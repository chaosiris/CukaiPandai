"""BE-2.3 — Tests for per-filing audit conversation memory (ConversationRepository + endpoints).

Hermetic: the _hermetic fixture forces in-memory fallback (monkeypatches DATABASE_URL away)
and clears all in-process state before/after each test, matching the pattern in
test_me_filings_endpoint.py.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from api import auth
from api.llm import FakeLLMClient
from api.main import _CONVERSATION_REPO, _FILING_REPO, _USER_REPO, app, get_llm
from api.persistence import ConversationRepository

client = TestClient(app)


# ---------------------------------------------------------------------------
# Hermetic fixture: force in-memory, clear state before/after each test
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def _hermetic(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL_UNPOOLED", raising=False)
    _USER_REPO._mem.clear()
    _FILING_REPO._mem.clear()
    _CONVERSATION_REPO._mem.clear()
    yield
    _USER_REPO._mem.clear()
    _FILING_REPO._mem.clear()
    _CONVERSATION_REPO._mem.clear()


# ---------------------------------------------------------------------------
# ConversationRepository unit tests (hermetic in-memory)
# ---------------------------------------------------------------------------

def test_get_returns_empty_list_for_unknown():
    repo = ConversationRepository()
    assert repo.get("user1", "filing1") == []


def test_append_then_get_round_trip():
    repo = ConversationRepository()
    turn = {"role": "user", "content": "What is my tax payable?"}
    repo.append("user1", "filing1", turn)
    messages = repo.get("user1", "filing1")
    assert len(messages) == 1
    assert messages[0]["role"] == "user"
    assert messages[0]["content"] == "What is my tax payable?"


def test_append_adds_timestamp():
    repo = ConversationRepository()
    repo.append("user1", "filing1", {"role": "user", "content": "Q?"})
    msg = repo.get("user1", "filing1")[0]
    assert "ts" in msg


def test_multiple_turns_preserved_in_order():
    repo = ConversationRepository()
    repo.append("u", "f", {"role": "user", "content": "Q1"})
    repo.append("u", "f", {"role": "assistant", "content": "A1"})
    repo.append("u", "f", {"role": "user", "content": "Q2"})
    msgs = repo.get("u", "f")
    assert len(msgs) == 3
    assert msgs[0]["content"] == "Q1"
    assert msgs[1]["content"] == "A1"
    assert msgs[2]["content"] == "Q2"


def test_per_owner_isolation():
    """Two different owners' threads for the same filing_id do not bleed."""
    repo = ConversationRepository()
    repo.append("owner_a", "f", {"role": "user", "content": "Owner A question"})
    repo.append("owner_b", "f", {"role": "user", "content": "Owner B question"})
    a_msgs = repo.get("owner_a", "f")
    b_msgs = repo.get("owner_b", "f")
    assert len(a_msgs) == 1 and a_msgs[0]["content"] == "Owner A question"
    assert len(b_msgs) == 1 and b_msgs[0]["content"] == "Owner B question"


def test_delete_removes_thread():
    repo = ConversationRepository()
    repo.append("u", "f", {"role": "user", "content": "Hello"})
    assert len(repo.get("u", "f")) == 1
    repo.delete("u", "f")
    assert repo.get("u", "f") == []


def test_delete_nonexistent_is_noop():
    """Deleting a thread that doesn't exist must not raise."""
    repo = ConversationRepository()
    repo.delete("u", "nonexistent")  # should not raise


# ---------------------------------------------------------------------------
# Cascade delete: filing delete also drops conversation rows
# ---------------------------------------------------------------------------

def test_cascade_delete_via_filing_repo():
    """FilingRepository.delete with conversation_repo= drops the conversation too."""
    from api.persistence import FilingRepository

    filing_repo = FilingRepository()
    conv_repo = ConversationRepository()

    rec = filing_repo.create("owner", {"tin": "C2581234509", "label": "test"})
    conv_repo.append("owner", rec["id"], {"role": "user", "content": "question"})
    assert len(conv_repo.get("owner", rec["id"])) == 1

    filing_repo.delete("owner", [rec["id"]], conversation_repo=conv_repo)
    assert conv_repo.get("owner", rec["id"]) == []


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_token(sub: str, email: str) -> str:
    _USER_REPO._mem[email] = {"id": sub, "email": email, "name": "Test", "provider": "password"}
    return auth.create_token(sub, email, "Test")


_SCRIPTED = [
    '{"contested_item":"Repairs","claim":"deductible under s.33(1)","clause_ids":["ITA-1967-s33(1)"],'
    '"answer":"Your repairs deduction is supported by the filing data.","followups":["Q1?","Q2?","Q3?"]}',
    "YES",
]


# ---------------------------------------------------------------------------
# Endpoint tests
# ---------------------------------------------------------------------------

def test_get_conversation_401_no_token():
    r = client.get("/me/filings/someid/conversation")
    assert r.status_code == 401


def test_get_conversation_404_unknown_filing():
    token = _make_token("sub1", "user1@example.com")
    r = client.get("/me/filings/nonexistent-id/conversation", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 404


def test_get_conversation_returns_empty_for_new_filing():
    token = _make_token("sub2", "user2@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    rec = client.post("/me/filings", json={"tin": "C2581234509", "label": "test"}, headers=headers)
    assert rec.status_code == 200
    filing_id = rec.json()["id"]
    r = client.get(f"/me/filings/{filing_id}/conversation", headers=headers)
    assert r.status_code == 200
    assert r.json() == []


def test_audit_defense_with_filing_id_persists_conversation():
    """When filing_id is provided and the caller is authenticated, the Q+A is persisted."""
    app.dependency_overrides[get_llm] = lambda: FakeLLMClient(list(_SCRIPTED))
    token = _make_token("sub3", "user3@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        rec = client.post("/me/filings", json={"tin": "C2581234509", "label": "convo test"}, headers=headers)
        assert rec.status_code == 200
        filing_id = rec.json()["id"]

        r = client.post(
            "/entities/C2581234509/audit-defense",
            json={"query": "Justify repairs", "evidence": [], "filing_id": filing_id},
            headers=headers,
        )
        assert r.status_code == 200
        body = r.json()
        assert "answer" in body
        assert "followups" in body
        assert len(body["followups"]) == 3

        conv = client.get(f"/me/filings/{filing_id}/conversation", headers=headers)
        assert conv.status_code == 200
        messages = conv.json()
        assert len(messages) == 2
        assert messages[0]["role"] == "user"
        assert messages[1]["role"] == "assistant"
        assert "citations" in messages[1]
    finally:
        app.dependency_overrides.clear()


def test_audit_defense_without_filing_id_no_persistence():
    """Without a filing_id, the endpoint works but does not write any conversation."""
    app.dependency_overrides[get_llm] = lambda: FakeLLMClient(list(_SCRIPTED))
    token = _make_token("sub4", "user4@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        r = client.post(
            "/entities/C2581234509/audit-defense",
            json={"query": "Justify repairs", "evidence": []},
            headers=headers,
        )
        assert r.status_code == 200
        assert "answer" in r.json()
    finally:
        app.dependency_overrides.clear()


def test_conversation_grows_on_subsequent_questions():
    """Multiple audit-defense calls grow the conversation thread linearly."""
    app.dependency_overrides[get_llm] = lambda: FakeLLMClient(list(_SCRIPTED) * 3)
    token = _make_token("sub5", "user5@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        rec = client.post("/me/filings", json={"tin": "C2581234509", "label": "multi-turn"}, headers=headers)
        assert rec.status_code == 200
        filing_id = rec.json()["id"]

        for _ in range(2):
            r = client.post(
                "/entities/C2581234509/audit-defense",
                json={"query": "Another question", "evidence": [], "filing_id": filing_id},
                headers=headers,
            )
            assert r.status_code == 200

        conv = client.get(f"/me/filings/{filing_id}/conversation", headers=headers)
        assert conv.status_code == 200
        # 2 rounds * 2 turns each = 4 messages
        assert len(conv.json()) == 4
    finally:
        app.dependency_overrides.clear()


def test_cascade_delete_endpoint_clears_conversation():
    """Deleting a filing via the API also clears its conversation."""
    app.dependency_overrides[get_llm] = lambda: FakeLLMClient(list(_SCRIPTED))
    token = _make_token("sub6", "user6@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        rec = client.post("/me/filings", json={"tin": "C2581234509", "label": "cascade test"}, headers=headers)
        filing_id = rec.json()["id"]

        client.post(
            "/entities/C2581234509/audit-defense",
            json={"query": "Q?", "evidence": [], "filing_id": filing_id},
            headers=headers,
        )

        del_r = client.delete(f"/me/filings/{filing_id}", headers=headers)
        assert del_r.status_code == 200

        # Filing gone => conversation endpoint returns 404
        r = client.get(f"/me/filings/{filing_id}/conversation", headers=headers)
        assert r.status_code == 404
    finally:
        app.dependency_overrides.clear()


def test_get_conversation_for_foreign_filing_returns_404():
    """Owner A cannot read owner B's conversation (filing lookup enforces ownership)."""
    token_a = _make_token("sub7a", "user7a@example.com")
    token_b = _make_token("sub7b", "user7b@example.com")

    rec_a = client.post("/me/filings", json={"tin": "C2581234509", "label": "A's filing"}, headers={"Authorization": f"Bearer {token_a}"})
    filing_id_a = rec_a.json()["id"]

    r = client.get(f"/me/filings/{filing_id_a}/conversation", headers={"Authorization": f"Bearer {token_b}"})
    assert r.status_code == 404
