"""BE-2.1 — filing draft/pending persistence + PATCH upgrade endpoint.

Hermetic: forces in-memory fallback (DATABASE_URL unset). Tests:
- create a draft (computation=None, status='draft', raw_text='...') → id returned, listed as draft
- PATCH draft to final (status flips, computation set, SAME id, list length unchanged, raw_text preserved)
- PATCH foreign owner's id → 404
- PATCH missing id → 404
- PATCH without token → 401
- PATCH with bad computation type → 422
- legacy record without 'status' reads back as 'final' (backfill)
- per-owner isolation (shared-guest vs registered sub)
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from api import auth
from api.main import _FILING_REPO, _USER_REPO, app

client = TestClient(app)

_COMPUTATION = {
    "form": "C",
    "fields": {
        "gross_income": {
            "value": 500000.0,
            "inputs": ["gross_income"],
            "rule_id": "ITA_1967_S4",
            "config_version": "YA2026-v1",
        }
    },
}

_DRAFT_BODY = {
    "tin": "C12345678901",
    "label": "YA2025 draft",
    "status": "draft",
    "raw_text": "Revenue 500000\nCOGS 200000",
}

_FINAL_BODY = {
    "tin": "C12345678901",
    "label": "YA2025 final",
    "computation": _COMPUTATION,
    "risk_flags": [],
    "status": "final",
}


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


def test_create_draft_returns_id_and_status():
    token = _make_token("user-a", "a@test.com")
    r = client.post("/me/filings", json=_DRAFT_BODY, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    body = r.json()
    assert "id" in body
    assert body["status"] == "draft"
    assert body["computation"] is None


def test_draft_appears_in_list():
    token = _make_token("user-a", "a@test.com")
    hdrs = {"Authorization": f"Bearer {token}"}
    client.post("/me/filings", json=_DRAFT_BODY, headers=hdrs)
    lst = client.get("/me/filings", headers=hdrs).json()
    assert len(lst) == 1
    assert lst[0]["status"] == "draft"
    assert lst[0]["raw_text"] == _DRAFT_BODY["raw_text"]


def test_patch_draft_to_final_same_id():
    token = _make_token("user-a", "a@test.com")
    hdrs = {"Authorization": f"Bearer {token}"}

    draft_id = client.post("/me/filings", json=_DRAFT_BODY, headers=hdrs).json()["id"]

    patch = {"status": "final", "computation": _COMPUTATION, "risk_flags": []}
    r = client.patch(f"/me/filings/{draft_id}", json=patch, headers=hdrs)
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == draft_id
    assert body["status"] == "final"
    assert body["computation"] == _COMPUTATION
    # raw_text preserved (not overwritten)
    assert body["raw_text"] == _DRAFT_BODY["raw_text"]


def test_patch_list_length_unchanged():
    """Upgrading a draft does NOT create a second record."""
    token = _make_token("user-a", "a@test.com")
    hdrs = {"Authorization": f"Bearer {token}"}

    draft_id = client.post("/me/filings", json=_DRAFT_BODY, headers=hdrs).json()["id"]
    client.patch(f"/me/filings/{draft_id}", json={"status": "final", "computation": _COMPUTATION}, headers=hdrs)

    lst = client.get("/me/filings", headers=hdrs).json()
    assert len(lst) == 1


def test_patch_foreign_owner_404():
    token_a = _make_token("user-a", "a@test.com")
    token_b = _make_token("user-b", "b@test.com")

    draft_id = client.post("/me/filings", json=_DRAFT_BODY, headers={"Authorization": f"Bearer {token_a}"}).json()["id"]
    r = client.patch(f"/me/filings/{draft_id}", json={"status": "final"}, headers={"Authorization": f"Bearer {token_b}"})
    assert r.status_code == 404


def test_patch_missing_id_404():
    token = _make_token("user-a", "a@test.com")
    r = client.patch("/me/filings/nonexistent-id", json={"status": "final"}, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 404


def test_patch_no_token_401():
    r = client.patch("/me/filings/some-id", json={"status": "final"})
    assert r.status_code == 401


def test_patch_bad_computation_type_422():
    token = _make_token("user-a", "a@test.com")
    r = client.patch(
        "/me/filings/some-id",
        json={"computation": "not-a-dict"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 422


def test_legacy_record_without_status_reads_final():
    """A record stored in memory without a 'status' key coalesces to 'final'."""
    token = _make_token("user-a", "a@test.com")
    hdrs = {"Authorization": f"Bearer {token}"}

    # Inject a legacy-style record directly into _mem (no 'status' key, no 'raw_text' key)
    import uuid as _uuid
    legacy_id = _uuid.uuid4().hex
    from datetime import datetime, timezone
    _FILING_REPO._mem["user-a"] = [{
        "id": legacy_id,
        "user_id": "user-a",
        "tin": "C99999999999",
        "label": "legacy",
        "computation": _COMPUTATION,
        "risk_flags": [],
        "line_items": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        # deliberately no 'status' or 'raw_text' keys
    }]

    # list should backfill status to 'final'
    lst = client.get("/me/filings", headers=hdrs).json()
    assert len(lst) == 1
    assert lst[0]["status"] == "final"
    assert lst[0]["raw_text"] is None

    # get by id should also backfill
    r = client.get(f"/me/filings/{legacy_id}", headers=hdrs)
    assert r.status_code == 200
    assert r.json()["status"] == "final"


def test_legacy_final_post_defaults_status_final():
    """A POST with computation (legacy shape) defaults status to 'final'."""
    token = _make_token("user-a", "a@test.com")
    hdrs = {"Authorization": f"Bearer {token}"}

    r = client.post("/me/filings", json=_FINAL_BODY, headers=hdrs)
    assert r.status_code == 200
    assert r.json()["status"] == "final"


def test_per_owner_isolation_draft():
    """Draft records are scoped to the creating owner; a different sub sees nothing."""
    token_a = _make_token("user-a", "a@test.com")
    token_b = _make_token("user-b", "b@test.com")

    client.post("/me/filings", json=_DRAFT_BODY, headers={"Authorization": f"Bearer {token_a}"})

    lst_b = client.get("/me/filings", headers={"Authorization": f"Bearer {token_b}"}).json()
    assert lst_b == []


def test_multi_delete_still_works_on_draft():
    """Deleting a draft via multi-delete removes it cleanly."""
    token = _make_token("user-a", "a@test.com")
    hdrs = {"Authorization": f"Bearer {token}"}

    draft_id = client.post("/me/filings", json=_DRAFT_BODY, headers=hdrs).json()["id"]
    r = client.request("DELETE", "/me/filings", json={"ids": [draft_id]}, headers=hdrs)
    assert r.status_code == 200

    assert client.get(f"/me/filings/{draft_id}", headers=hdrs).status_code == 404


def test_bogus_status_post_422():
    """POST with an invalid status value must be rejected with 422."""
    token = _make_token("user-a", "a@test.com")
    body = {**_DRAFT_BODY, "status": "foo"}
    r = client.post("/me/filings", json=body, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 422


def test_bogus_status_patch_422():
    """PATCH with an invalid status value must be rejected with 422."""
    token = _make_token("user-a", "a@test.com")
    hdrs = {"Authorization": f"Bearer {token}"}

    draft_id = client.post("/me/filings", json=_DRAFT_BODY, headers=hdrs).json()["id"]
    r = client.patch(f"/me/filings/{draft_id}", json={"status": "foo"}, headers=hdrs)
    assert r.status_code == 422
