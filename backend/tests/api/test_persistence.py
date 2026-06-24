"""BE-15/16/17 — persistence seams degrade to in-memory/fixtures when DATABASE_URL is unset.

Live-Postgres behaviour requires a Neon DATABASE_URL (DO-4) and is exercised only when set;
these tests lock the demo-critical fallback (DB-down ≠ demo-down)."""
from __future__ import annotations

import json
from pathlib import Path

from core.evidence import EvidenceVault
from api.persistence import EntityRepository, make_checkpointer, make_evidence_vault

ACME = json.loads(Path("core/fixtures/entity_acme.json").read_text(encoding="utf-8"))


def test_checkpointer_is_none_without_database_url(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    assert make_checkpointer() is None  # → graph falls back to MemorySaver


def test_evidence_vault_falls_back_to_in_memory(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    vault = make_evidence_vault()
    assert isinstance(vault, EvidenceVault)
    vault.link("tax_payable", "trial_balance_acme", "ITA-1967-s33(1)")
    vault.log_action("agent:computation", "compute_form_c", "h1")
    assert ("trial_balance_acme", "ITA-1967-s33(1)") in vault.links_for("tax_payable")
    assert [t["action"] for t in vault.audit_trail()] == ["compute_form_c"]


def test_entity_repository_serves_fixtures_without_db(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    repo = EntityRepository({ACME["tin"]: ACME})
    assert repo.get(ACME["tin"])["msic_codes"] == ["46900"]
    assert repo.get("C0000000000") is None
