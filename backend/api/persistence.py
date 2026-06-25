"""Neon Postgres persistence seams (DO-4/BE-15/16/17), fallback-first.

Everything here degrades to in-memory/fixtures when ``DATABASE_URL`` is unset (or unreachable),
so **DB-down ≠ demo-down**. The Postgres paths are lazy + wrapped — a misconfigured/down DB
returns the in-memory fallback rather than breaking startup. Neon caveats baked in: run
``setup()`` over the DIRECT (unpooled) endpoint, serve runtime over the POOLED endpoint with
``prepare_threshold=0`` (PgBouncer transaction mode).

NOTE: the Postgres branches are verified end-to-end against a live Neon DB (PostgreSQL 18.4,
Singapore region) — durable checkpointer (BE-15), EvidenceVault audit+links (BE-16), and
EntityRepository with fixtures fallback (BE-17) all pass; DB-down fallbacks are also tested.
"""
from __future__ import annotations

import os
import uuid

from core.evidence import EvidenceVault


def database_url() -> str | None:
    return os.getenv("DATABASE_URL") or None


def _connect(url: str):
    from psycopg import Connection
    from psycopg.rows import dict_row

    # Pooled (PgBouncer transaction mode) → prepare_threshold=0; dict rows for ergonomic reads.
    return Connection.connect(url, autocommit=True, prepare_threshold=0, row_factory=dict_row)


def make_checkpointer():
    """BE-15 — durable LangGraph checkpointer over Neon when DATABASE_URL is set, else None
    (the graph then uses an in-process MemorySaver). Fail-safe: any error returns None."""
    url = database_url()
    if not url:
        return None
    try:
        from psycopg import Connection
        from langgraph.checkpoint.postgres import PostgresSaver

        # Create the checkpoint tables ONCE over the direct/unpooled endpoint.
        with Connection.connect(
            os.getenv("DATABASE_URL_UNPOOLED", url), autocommit=True
        ) as setup_conn:
            PostgresSaver(setup_conn).setup()
        # Serve runtime over the pooled endpoint.
        return PostgresSaver(_connect(url))
    except Exception:
        return None


class _PostgresEvidenceVault:
    """BE-16 — EvidenceVault method surface backed by Neon. Stores payload HASHES, not payloads."""

    def __init__(self, conn):
        self._c = conn
        self._c.execute("CREATE TABLE IF NOT EXISTS links (figure_id text, document_id text, clause_id text)")
        self._c.execute(
            "CREATE TABLE IF NOT EXISTS audit (id serial PRIMARY KEY, actor text, action text, payload_hash text)"
        )

    def link(self, figure_id: str, document_id: str, clause_id: str) -> None:
        self._c.execute("INSERT INTO links VALUES (%s,%s,%s)", (figure_id, document_id, clause_id))

    def links_for(self, figure_id: str) -> list[tuple]:
        cur = self._c.execute(
            "SELECT document_id, clause_id FROM links WHERE figure_id=%s", (figure_id,)
        )
        return [(r["document_id"], r["clause_id"]) for r in cur.fetchall()]

    def log_action(self, actor: str, action: str, payload_hash: str) -> None:
        self._c.execute(
            "INSERT INTO audit (actor, action, payload_hash) VALUES (%s,%s,%s)",
            (actor, action, payload_hash),
        )

    def audit_trail(self) -> list[dict]:
        cur = self._c.execute("SELECT actor, action, payload_hash FROM audit ORDER BY id")
        return [
            {"actor": r["actor"], "action": r["action"], "payload_hash": r["payload_hash"]}
            for r in cur.fetchall()
        ]


def make_evidence_vault():
    """BE-16 — Neon-backed EvidenceVault when DATABASE_URL is set, else the in-memory core vault."""
    url = database_url()
    if not url:
        return EvidenceVault()
    try:
        return _PostgresEvidenceVault(_connect(url))
    except Exception:
        return EvidenceVault()


class EntityRepository:
    """BE-17 — entity profiles from Neon when available, else the seeded fixtures (fallback so the
    hero beats never hard-depend on the DB)."""

    def __init__(self, fixtures: dict[str, dict]):
        self._fixtures = fixtures

    def get(self, tin: str) -> dict | None:
        url = database_url()
        if url:
            try:
                with _connect(url) as conn:
                    row = conn.execute("SELECT data FROM entities WHERE tin=%s", (tin,)).fetchone()
                    if row:
                        return row["data"]  # jsonb column
            except Exception:
                pass  # fall through to fixtures — DB-down ≠ demo-down
        return self._fixtures.get(tin)

    def create(self, data: dict) -> None:
        """Upsert an entity profile. Writes to Neon when DATABASE_URL is set; always writes to the
        in-memory fixtures dict so GET round-trips without a live DB (DB-down ≠ demo-down)."""
        import json as _json

        tin = data["tin"]
        # Always store in-memory so in-process GETs see the new entity regardless of DB state.
        self._fixtures[tin] = data
        url = database_url()
        if url:
            try:
                with _connect(url) as conn:
                    conn.execute(
                        "INSERT INTO entities (tin, data) VALUES (%s, %s::jsonb) "
                        "ON CONFLICT (tin) DO UPDATE SET data = EXCLUDED.data",
                        (tin, _json.dumps(data)),
                    )
            except Exception:
                pass  # fallback already written in-memory above; never crash on DB error


class UserRepository:
    """Auth users — a Neon ``users`` table when DATABASE_URL is set, else a process-level in-memory
    dict (so tests + a DB-down demo still work). Stores password HASHES, never raw passwords."""

    def __init__(self):
        self._mem: dict[str, dict] = {}  # email (lowercased) -> user dict

    def _ensure_table(self, conn) -> None:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS users ("
            "id text PRIMARY KEY, email text UNIQUE NOT NULL, name text, "
            "password_hash text, provider text NOT NULL DEFAULT 'password', "
            "created_at timestamptz NOT NULL DEFAULT now())"
        )

    def get_by_email(self, email: str) -> dict | None:
        email = email.lower()
        url = database_url()
        if url:
            try:
                with _connect(url) as conn:
                    self._ensure_table(conn)
                    row = conn.execute(
                        "SELECT id, email, name, password_hash, provider FROM users WHERE email=%s",
                        (email,),
                    ).fetchone()
                    return dict(row) if row else None
            except Exception:
                pass  # fall through to in-memory — DB-down ≠ demo-down
        return self._mem.get(email)

    def create(self, email: str, name: str, password_hash: str | None, provider: str = "password", id: str | None = None) -> dict:
        email = email.lower()
        user = {
            "id": id if id is not None else uuid.uuid4().hex,
            "email": email,
            "name": name,
            "password_hash": password_hash,
            "provider": provider,
        }
        url = database_url()
        if url:
            try:
                with _connect(url) as conn:
                    self._ensure_table(conn)
                    conn.execute(
                        "INSERT INTO users (id, email, name, password_hash, provider) "
                        "VALUES (%s,%s,%s,%s,%s)",
                        (user["id"], email, name, password_hash, provider),
                    )
                    return user
            except Exception:
                pass  # DB-down ≠ demo-down: fall back to in-memory
        self._mem[email] = user
        return user

    def ensure_guest(self, guest_id: str = "", guest_email: str = "", guest_name: str = "") -> dict:
        """Idempotently seed the shared guest user with a fixed id. Safe to call multiple times."""
        existing = self.get_by_email(guest_email)
        if existing is not None:
            return existing
        return self.create(guest_email, guest_name, password_hash=None, provider="guest", id=guest_id)

    def upsert_oauth(self, email: str, name: str, provider: str = "google") -> dict:
        """Link/create an SSO user — return the existing row if present, else create one (no password)."""
        return self.get_by_email(email) or self.create(email, name, password_hash=None, provider=provider)


class UserEntityRepository:
    """Per-user entity profiles, keyed by the JWT ``sub`` (owner).

    Neon table ``user_entities(user_id text PRIMARY KEY, data jsonb)`` when DATABASE_URL is set;
    falls back to an in-memory dict per fallback-first pattern. Any DB error → in-memory.
    """

    def __init__(self):
        self._mem: dict[str, dict] = {}  # owner (sub) -> profile dict

    def get(self, owner: str) -> dict | None:
        url = database_url()
        if url:
            try:
                with _connect(url) as conn:
                    conn.execute(
                        "CREATE TABLE IF NOT EXISTS user_entities "
                        "(user_id text PRIMARY KEY, data jsonb NOT NULL)"
                    )
                    row = conn.execute(
                        "SELECT data FROM user_entities WHERE user_id=%s", (owner,)
                    ).fetchone()
                    return row["data"] if row else None
            except Exception:
                pass
        return self._mem.get(owner)

    def put(self, owner: str, data: dict) -> None:
        import json as _json

        self._mem[owner] = data
        url = database_url()
        if url:
            try:
                with _connect(url) as conn:
                    conn.execute(
                        "CREATE TABLE IF NOT EXISTS user_entities "
                        "(user_id text PRIMARY KEY, data jsonb NOT NULL)"
                    )
                    conn.execute(
                        "INSERT INTO user_entities (user_id, data) VALUES (%s, %s::jsonb) "
                        "ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data",
                        (owner, _json.dumps(data)),
                    )
            except Exception:
                pass  # already stored in-memory above; never crash on DB error


class FilingRepository:
    """Per-user filing records, keyed by the JWT ``sub`` (owner).

    Uses a new ``filing_records`` table (additive; does NOT alter the existing ``filings`` table).
    Falls back to an in-memory dict when DATABASE_URL is unset or unreachable.
    """

    def __init__(self):
        # owner (sub) -> list of record dicts (newest first after insert)
        self._mem: dict[str, list[dict]] = {}

    def _ensure_table(self, conn) -> None:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS filing_records ("
            "id text PRIMARY KEY, user_id text NOT NULL, tin text, label text, "
            "computation jsonb, risk_flags jsonb, line_items jsonb, "
            "created_at timestamptz NOT NULL DEFAULT now())"
        )

    def create(self, owner: str, rec: dict) -> dict:
        import json as _json
        from datetime import datetime, timezone

        record = {
            **rec,
            "id": uuid.uuid4().hex,
            "user_id": owner,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        # Always write to in-memory first
        self._mem.setdefault(owner, []).insert(0, record)
        url = database_url()
        if url:
            try:
                with _connect(url) as conn:
                    self._ensure_table(conn)
                    conn.execute(
                        "INSERT INTO filing_records (id, user_id, tin, label, computation, risk_flags, line_items) "
                        "VALUES (%s,%s,%s,%s,%s::jsonb,%s::jsonb,%s::jsonb)",
                        (
                            record["id"], owner,
                            rec.get("tin"), rec.get("label"),
                            _json.dumps(rec.get("computation")),
                            _json.dumps(rec.get("risk_flags", [])),
                            _json.dumps(rec.get("line_items")),
                        ),
                    )
            except Exception:
                pass
        return record

    def list(self, owner: str) -> list[dict]:
        url = database_url()
        if url:
            try:
                with _connect(url) as conn:
                    self._ensure_table(conn)
                    rows = conn.execute(
                        "SELECT id, user_id, tin, label, computation, risk_flags, line_items, created_at "
                        "FROM filing_records WHERE user_id=%s ORDER BY created_at DESC",
                        (owner,),
                    ).fetchall()
                    return [dict(r) for r in rows]
            except Exception:
                pass
        return list(self._mem.get(owner, []))

    def get(self, owner: str, rec_id: str) -> dict | None:
        url = database_url()
        if url:
            try:
                with _connect(url) as conn:
                    self._ensure_table(conn)
                    row = conn.execute(
                        "SELECT id, user_id, tin, label, computation, risk_flags, line_items, created_at "
                        "FROM filing_records WHERE id=%s AND user_id=%s",
                        (rec_id, owner),
                    ).fetchone()
                    return dict(row) if row else None
            except Exception:
                pass
        for rec in self._mem.get(owner, []):
            if rec["id"] == rec_id:
                return rec
        return None

    def delete(self, owner: str, ids: list[str]) -> None:
        url = database_url()
        if url:
            try:
                with _connect(url) as conn:
                    self._ensure_table(conn)
                    for rec_id in ids:
                        conn.execute(
                            "DELETE FROM filing_records WHERE id=%s AND user_id=%s",
                            (rec_id, owner),
                        )
            except Exception:
                pass
        # Always apply to in-memory (may be the only store if DB is down)
        if owner in self._mem:
            self._mem[owner] = [r for r in self._mem[owner] if r["id"] not in ids]
