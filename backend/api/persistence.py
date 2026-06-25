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

    def create(self, email: str, name: str, password_hash: str | None, provider: str = "password") -> dict:
        email = email.lower()
        user = {
            "id": uuid.uuid4().hex,
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

    def upsert_oauth(self, email: str, name: str, provider: str = "google") -> dict:
        """Link/create an SSO user — return the existing row if present, else create one (no password)."""
        return self.get_by_email(email) or self.create(email, name, password_hash=None, provider=provider)
