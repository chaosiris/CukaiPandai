"""Auth — signup/login/me happy + error paths, Google gating, and the password/JWT primitives.

Hermetic: forces the in-memory user fallback (no DB) and clears the store per test, so these pass
regardless of whether a DATABASE_URL is present in the environment.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from api import auth
from api.main import _USER_REPO, app

client = TestClient(app)


@pytest.fixture(autouse=True)
def _hermetic(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL_UNPOOLED", raising=False)
    monkeypatch.delenv("GOOGLE_CLIENT_ID", raising=False)
    _USER_REPO._mem.clear()
    yield
    _USER_REPO._mem.clear()


def test_signup_then_me_roundtrip():
    r = client.post("/auth/signup", json={"email": "Founder@Acme.com", "password": "s3cret-pass"})
    assert r.status_code == 200
    body = r.json()
    assert body["user"]["email"] == "founder@acme.com"  # normalized to lowercase
    assert body["user"]["provider"] == "password"
    assert "password_hash" not in body["user"]  # never leak the hash
    me = client.get("/auth/me", headers={"Authorization": f"Bearer {body['token']}"})
    assert me.status_code == 200
    assert me.json()["email"] == "founder@acme.com"


def test_signup_duplicate_409():
    client.post("/auth/signup", json={"email": "dup@acme.com", "password": "password1"})
    r = client.post("/auth/signup", json={"email": "dup@acme.com", "password": "password2"})
    assert r.status_code == 409


def test_signup_weak_password_422():
    assert client.post("/auth/signup", json={"email": "x@acme.com", "password": "short"}).status_code == 422


def test_signup_bad_email_422():
    assert client.post("/auth/signup", json={"email": "not-an-email", "password": "password1"}).status_code == 422


def test_login_success_then_wrong_password_401():
    client.post("/auth/signup", json={"email": "a@acme.com", "password": "password1"})
    assert client.post("/auth/login", json={"email": "a@acme.com", "password": "password1"}).json()["token"]
    assert client.post("/auth/login", json={"email": "a@acme.com", "password": "nope-wrong"}).status_code == 401


def test_login_unknown_email_401():
    assert client.post("/auth/login", json={"email": "nobody@acme.com", "password": "password1"}).status_code == 401


def test_me_rejects_missing_and_garbage_token():
    assert client.get("/auth/me").status_code == 401
    assert client.get("/auth/me", headers={"Authorization": "Bearer garbage.token.here"}).status_code == 401


def test_google_unconfigured_503():
    assert client.post("/auth/google", json={"id_token": "anything"}).status_code == 503


def test_password_hash_roundtrip():
    h = auth.hash_password("hunter2-longpw")
    assert h != "hunter2-longpw"
    assert auth.verify_password("hunter2-longpw", h)
    assert not auth.verify_password("wrong-pw", h)


def test_jwt_roundtrip_and_tamper():
    t = auth.create_token("id1", "u@x.com", "U")
    claims = auth.decode_token(t)
    assert claims and claims["email"] == "u@x.com" and claims["sub"] == "id1"
    assert auth.decode_token(t + "x") is None  # tampered signature


def test_jwt_expiry(monkeypatch):
    t = auth.create_token("id1", "u@x.com", "U")
    monkeypatch.setattr(auth.time, "time", lambda: 99_999_999_999)  # far future, past the 7-day TTL
    assert auth.decode_token(t) is None
