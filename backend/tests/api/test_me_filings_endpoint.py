"""EP-2 — /me/filings CRUD (per-user saved filing records, JWT-sub-keyed).

Hermetic: forces in-memory fallback. Tests 401 without token, create→list→get→delete
round-trip, multi-delete, per-owner isolation, 404 on foreign id, 422 on bad body.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from api import auth
from api.main import _FILING_REPO, _USER_REPO, app

client = TestClient(app)

# Minimal valid filing record body (sans id/user_id/created_at)
_VALID_BODY = {
    "tin": "C12345678901",
    "label": "YA2025 Form C",
    "computation": {
        "form": "C",
        "fields": {
            "gross_income": {
                "value": 500000.0,
                "inputs": ["gross_income"],
                "rule_id": "ITA_1967_S4",
                "config_version": "YA2026-v1",
            }
        },
    },
    "risk_flags": [],
}

_BAD_BODY = {"tin": "X", "computation": "not-a-dict"}  # computation must be a dict or null


def _make_token(sub: str, email: str) -> str:
    _USER_REPO._mem[email] = {"id": sub, "email": email, "name": "Test", "provider": "password"}
    return auth.create_token(sub, email, "Test")


@pytest.fixture(autouse=True)
def _hermetic(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL_UNPOOLED", raising=False)
    _USER_REPO._mem.clear()
    _FILING_REPO._mem.clear()
    yield
    _USER_REPO._mem.clear()
    _FILING_REPO._mem.clear()


def test_post_filings_401_without_token():
    assert client.post("/me/filings", json=_VALID_BODY).status_code == 401


def test_get_filings_401_without_token():
    assert client.get("/me/filings").status_code == 401


def test_get_filing_by_id_401_without_token():
    assert client.get("/me/filings/some-id").status_code == 401


def test_delete_filing_401_without_token():
    assert client.request("DELETE", "/me/filings/some-id").status_code == 401


def test_create_filing_returns_id():
    token = _make_token("user-a", "a@test.com")
    r = client.post("/me/filings", json=_VALID_BODY, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    body = r.json()
    assert "id" in body
    assert body["tin"] == _VALID_BODY["tin"]


def test_create_bad_body_422():
    token = _make_token("user-a", "a@test.com")
    r = client.post("/me/filings", json=_BAD_BODY, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 422


def test_list_filings_returns_created():
    token = _make_token("user-a", "a@test.com")
    hdrs = {"Authorization": f"Bearer {token}"}

    client.post("/me/filings", json=_VALID_BODY, headers=hdrs)
    r = client.get("/me/filings", headers=hdrs)
    assert r.status_code == 200
    lst = r.json()
    assert isinstance(lst, list)
    assert len(lst) == 1
    assert "id" in lst[0]


def test_get_filing_by_id_roundtrip():
    token = _make_token("user-a", "a@test.com")
    hdrs = {"Authorization": f"Bearer {token}"}

    rec_id = client.post("/me/filings", json=_VALID_BODY, headers=hdrs).json()["id"]
    r = client.get(f"/me/filings/{rec_id}", headers=hdrs)
    assert r.status_code == 200
    assert r.json()["id"] == rec_id
    assert r.json()["tin"] == _VALID_BODY["tin"]


def test_get_filing_foreign_id_404():
    token = _make_token("user-a", "a@test.com")
    r = client.get("/me/filings/nonexistent-id", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 404


def test_delete_filing_removes_record():
    token = _make_token("user-a", "a@test.com")
    hdrs = {"Authorization": f"Bearer {token}"}

    rec_id = client.post("/me/filings", json=_VALID_BODY, headers=hdrs).json()["id"]
    del_r = client.delete(f"/me/filings/{rec_id}", headers=hdrs)
    assert del_r.status_code == 200

    assert client.get(f"/me/filings/{rec_id}", headers=hdrs).status_code == 404


def test_delete_foreign_filing_404():
    token_a = _make_token("user-a", "a@test.com")
    token_b = _make_token("user-b", "b@test.com")

    rec_id = client.post("/me/filings", json=_VALID_BODY, headers={"Authorization": f"Bearer {token_a}"}).json()["id"]
    r = client.delete(f"/me/filings/{rec_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert r.status_code == 404


def test_multi_delete():
    token = _make_token("user-a", "a@test.com")
    hdrs = {"Authorization": f"Bearer {token}"}

    id1 = client.post("/me/filings", json=_VALID_BODY, headers=hdrs).json()["id"]
    id2 = client.post("/me/filings", json=_VALID_BODY, headers=hdrs).json()["id"]

    r = client.request("DELETE", "/me/filings", json={"ids": [id1, id2]}, headers=hdrs)
    assert r.status_code == 200

    assert client.get(f"/me/filings/{id1}", headers=hdrs).status_code == 404
    assert client.get(f"/me/filings/{id2}", headers=hdrs).status_code == 404


def test_multi_delete_foreign_id_is_noop():
    """Multi-deleting a foreign id must not touch the foreign owner's records."""
    token_a = _make_token("user-a", "a@test.com")
    token_b = _make_token("user-b", "b@test.com")

    id_a = client.post("/me/filings", json=_VALID_BODY, headers={"Authorization": f"Bearer {token_a}"}).json()["id"]

    # B tries to delete A's record — should be a no-op for A's data
    client.request("DELETE", "/me/filings", json={"ids": [id_a]}, headers={"Authorization": f"Bearer {token_b}"})

    # A's record is untouched
    assert client.get(f"/me/filings/{id_a}", headers={"Authorization": f"Bearer {token_a}"}).status_code == 200


def test_per_owner_isolation_list():
    token_a = _make_token("user-a", "a@test.com")
    token_b = _make_token("user-b", "b@test.com")

    client.post("/me/filings", json=_VALID_BODY, headers={"Authorization": f"Bearer {token_a}"})

    r = client.get("/me/filings", headers={"Authorization": f"Bearer {token_b}"})
    assert r.status_code == 200
    assert r.json() == []


def test_per_owner_isolation_get_by_id():
    token_a = _make_token("user-a", "a@test.com")
    token_b = _make_token("user-b", "b@test.com")

    rec_id = client.post("/me/filings", json=_VALID_BODY, headers={"Authorization": f"Bearer {token_a}"}).json()["id"]

    r = client.get(f"/me/filings/{rec_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert r.status_code == 404
