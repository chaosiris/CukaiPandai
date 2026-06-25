"""BE-J1 — POST /entities (create + persist custom entity, fallback-first).

Tests cover:
- 200 create round-trip via in-memory fallback (no DATABASE_URL required)
- 422 on missing/bad SSM fields (reuses _profile 422 envelope)
- Upsert: posting the same TIN twice updates, no crash
- GET /entities/{tin} returns the profile created via POST
"""
from __future__ import annotations

import os
import pytest
from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app, raise_server_exceptions=False)

VALID_SSM = {
    "tin": "C9990000001",
    "entity_type": "sdn_bhd",
    "msic_codes": ["46900"],
    "paid_up_capital": 500000.0,
    "gross_income": 2000000.0,
    "employee_count": 5,
    "sst_registered": False,
    "basis_period_start": "2025-01-01",
    "basis_period_end": "2025-12-31",
}


def test_create_entity_returns_200_and_profile(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    r = client.post("/entities", json={"ssm": VALID_SSM})
    assert r.status_code == 200
    body = r.json()
    assert body["tin"] == "C9990000001"
    assert body["entity_type"] == "sdn_bhd"
    assert body["gross_income"] == 2000000.0


def test_create_entity_then_get_round_trips(monkeypatch):
    """POST creates the entity; a subsequent GET returns the same profile."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    r_post = client.post("/entities", json={"ssm": VALID_SSM})
    assert r_post.status_code == 200

    r_get = client.get(f"/entities/{VALID_SSM['tin']}")
    assert r_get.status_code == 200
    assert r_get.json()["tin"] == VALID_SSM["tin"]


def test_create_entity_bad_ssm_422(monkeypatch):
    """Missing required fields returns 422 (not 500), matching _profile envelope."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    bad = {"tin": "C9990000002"}  # missing all other required fields
    r = client.post("/entities", json={"ssm": bad})
    assert r.status_code == 422


def test_create_entity_upsert_same_tin_succeeds(monkeypatch):
    """Posting the same TIN twice updates the record without crashing."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    client.post("/entities", json={"ssm": VALID_SSM})
    updated_ssm = {**VALID_SSM, "gross_income": 3000000.0}
    r = client.post("/entities", json={"ssm": updated_ssm})
    assert r.status_code == 200
    assert r.json()["gross_income"] == 3000000.0


def test_create_entity_missing_ssm_key_422(monkeypatch):
    """Body without the 'ssm' key returns 422, not 500 (typed Pydantic model guard)."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    r = client.post("/entities", json={"wrong_key": "value"})
    assert r.status_code == 422


def test_create_entity_flat_body_422(monkeypatch):
    """Sending the SSM profile flat (not wrapped in {ssm:...}) returns 422, not 500."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    r = client.post("/entities", json=VALID_SSM)
    assert r.status_code == 422
