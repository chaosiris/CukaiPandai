"""EP-0 — Shared guest user + POST /auth/guest.

Hermetic: forces in-memory fallback (no DB). Tests the fixed shared guest identity,
idempotent seeding, JWT round-trip, and /auth/me validation.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from api import auth
from api.main import GUEST_EMAIL, GUEST_USER_ID, _USER_REPO, app

client = TestClient(app)


@pytest.fixture(autouse=True)
def _hermetic(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL_UNPOOLED", raising=False)
    # Clear mem store but re-seed the guest (mirrors startup behaviour)
    _USER_REPO._mem.clear()
    _USER_REPO.ensure_guest(GUEST_USER_ID, GUEST_EMAIL, "Guest")
    yield
    _USER_REPO._mem.clear()


def test_guest_auth_returns_token():
    r = client.post("/auth/guest")
    assert r.status_code == 200
    body = r.json()
    assert "token" in body
    assert "user" in body


def test_guest_token_sub_is_fixed_id():
    r = client.post("/auth/guest")
    token = r.json()["token"]
    claims = auth.decode_token(token)
    assert claims is not None
    assert claims["sub"] == GUEST_USER_ID


def test_guest_user_email_matches_constant():
    r = client.post("/auth/guest")
    assert r.json()["user"]["email"] == GUEST_EMAIL


def test_guest_me_roundtrip():
    token = client.post("/auth/guest").json()["token"]
    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == GUEST_EMAIL


def test_guest_seed_is_idempotent():
    """Calling ensure_guest twice must not create a duplicate user row."""
    _USER_REPO.ensure_guest(GUEST_USER_ID, GUEST_EMAIL, "Guest")
    _USER_REPO.ensure_guest(GUEST_USER_ID, GUEST_EMAIL, "Guest")
    # Count guest entries in mem store — must be exactly one
    guests = [u for u in _USER_REPO._mem.values() if u["email"] == GUEST_EMAIL]
    assert len(guests) == 1


def test_guest_id_is_stable_across_calls():
    """Two calls to POST /auth/guest yield tokens with the same sub."""
    t1 = client.post("/auth/guest").json()["token"]
    t2 = client.post("/auth/guest").json()["token"]
    assert auth.decode_token(t1)["sub"] == auth.decode_token(t2)["sub"] == GUEST_USER_ID


def test_guest_provider_is_guest():
    r = client.post("/auth/guest")
    assert r.json()["user"]["provider"] == "guest"
