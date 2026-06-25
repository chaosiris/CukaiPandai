"""EP-1 — GET/PUT /me/entity (per-user saved entity profile, JWT-sub-keyed).

Hermetic: forces in-memory fallback. Tests 401 without token, PUT→GET round-trip,
422 on bad ssm, per-owner isolation, and 404 before first save.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from api import auth
from api.main import _USER_ENTITY_REPO, _USER_REPO, app

client = TestClient(app)

# Minimal valid SSM for EntityTaxProfile
_VALID_SSM = {
    "tin": "C12345678901",
    "entity_type": "Sdn Bhd",
    "msic_codes": ["46510"],
    "paid_up_capital": 100000.0,
    "gross_income": 500000.0,
    "employee_count": 10,
    "sst_registered": False,
    "basis_period_start": "2025-01-01",
    "basis_period_end": "2025-12-31",
}

_BAD_SSM = {"tin": "bad"}  # missing required fields


def _make_token(sub: str, email: str) -> str:
    # Register user in mem store so _bearer_user finds them
    _USER_REPO._mem[email] = {"id": sub, "email": email, "name": "Test", "provider": "password"}
    return auth.create_token(sub, email, "Test")


@pytest.fixture(autouse=True)
def _hermetic(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL_UNPOOLED", raising=False)
    _USER_REPO._mem.clear()
    _USER_ENTITY_REPO._mem.clear()
    yield
    _USER_REPO._mem.clear()
    _USER_ENTITY_REPO._mem.clear()


def test_get_entity_401_without_token():
    r = client.get("/me/entity")
    assert r.status_code == 401


def test_put_entity_401_without_token():
    r = client.put("/me/entity", json={"ssm": _VALID_SSM})
    assert r.status_code == 401


def test_get_entity_404_before_save():
    token = _make_token("user-a", "a@test.com")
    r = client.get("/me/entity", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 404


def test_put_then_get_roundtrip():
    token = _make_token("user-a", "a@test.com")
    hdrs = {"Authorization": f"Bearer {token}"}

    put_r = client.put("/me/entity", json={"ssm": _VALID_SSM}, headers=hdrs)
    assert put_r.status_code == 200
    assert put_r.json()["tin"] == _VALID_SSM["tin"]

    get_r = client.get("/me/entity", headers=hdrs)
    assert get_r.status_code == 200
    assert get_r.json()["tin"] == _VALID_SSM["tin"]


def test_put_bad_ssm_422():
    token = _make_token("user-a", "a@test.com")
    r = client.put("/me/entity", json={"ssm": _BAD_SSM}, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 422


def test_per_owner_isolation():
    """User A's entity must not be visible to user B."""
    token_a = _make_token("user-a", "a@test.com")
    token_b = _make_token("user-b", "b@test.com")

    client.put("/me/entity", json={"ssm": _VALID_SSM}, headers={"Authorization": f"Bearer {token_a}"})

    # User B has no entity saved
    r = client.get("/me/entity", headers={"Authorization": f"Bearer {token_b}"})
    assert r.status_code == 404


def test_put_is_upsert():
    """Second PUT overwrites the first; GET returns the latest."""
    token = _make_token("user-a", "a@test.com")
    hdrs = {"Authorization": f"Bearer {token}"}

    ssm2 = {**_VALID_SSM, "gross_income": 999999.0}
    client.put("/me/entity", json={"ssm": _VALID_SSM}, headers=hdrs)
    client.put("/me/entity", json={"ssm": ssm2}, headers=hdrs)
    assert client.get("/me/entity", headers=hdrs).json()["gross_income"] == 999999.0
