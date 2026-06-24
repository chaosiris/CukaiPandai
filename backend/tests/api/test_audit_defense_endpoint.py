"""Boundary robustness — /audit-defense returns a controlled 502 on unparseable model output."""
from __future__ import annotations

from fastapi.testclient import TestClient

from api.agents.audit_defense import _FAKE_CLAUSE_ID
from api.llm import FakeLLMClient
from api.main import app, get_llm

_SCRIPTED = [
    '{"contested_item":"Repairs","claim":"deductible under s.33(1)","clause_ids":["ITA-1967-s33(1)"]}',
    "YES",
]


def test_audit_defense_502_on_non_json_model_reply():
    app.dependency_overrides[get_llm] = lambda: FakeLLMClient(["Sure! Here is your defense, no JSON at all."])
    try:
        r = TestClient(app, raise_server_exceptions=False).post(
            "/entities/C2581234509/audit-defense",
            json={"query": "Justify repairs", "evidence": []},
        )
        assert r.status_code == 502
    finally:
        app.dependency_overrides.clear()


def test_audit_defense_happy_path_still_works():
    app.dependency_overrides[get_llm] = lambda: FakeLLMClient(_SCRIPTED)
    try:
        r = TestClient(app).post(
            "/entities/C2581234509/audit-defense",
            json={"query": "Justify repairs", "evidence": [["tax_payable", "tb", "ITA-1967-s33(1)"]]},
        )
        assert r.status_code == 200
        body = r.json()
        assert body["citations"][0]["verified"] is True
        assert "sovereign" in body and "active_model" in body  # BE-6 route field
    finally:
        app.dependency_overrides.clear()


def test_inject_fabricated_endpoint_no_flag_single_citation():
    """Without inject_fabricated the response has exactly one citation."""
    app.dependency_overrides[get_llm] = lambda: FakeLLMClient(_SCRIPTED)
    try:
        r = TestClient(app).post(
            "/entities/C2581234509/audit-defense",
            json={"query": "Justify repairs", "evidence": []},
        )
        assert r.status_code == 200
        assert len(r.json()["citations"]) == 1
    finally:
        app.dependency_overrides.clear()


def test_inject_fabricated_endpoint_gate_rejects_probe():
    """With inject_fabricated=true: >=2 citations, probe rejected by the real gate."""
    app.dependency_overrides[get_llm] = lambda: FakeLLMClient(_SCRIPTED)
    try:
        r = TestClient(app).post(
            "/entities/C2581234509/audit-defense",
            json={"query": "Justify repairs", "evidence": [], "inject_fabricated": True},
        )
        assert r.status_code == 200
        citations = r.json()["citations"]
        assert len(citations) >= 2
        fake = [c for c in citations if _FAKE_CLAUSE_ID in c["clause_ids"]]
        real = [c for c in citations if _FAKE_CLAUSE_ID not in c["clause_ids"]]
        assert len(fake) == 1
        assert fake[0]["verified"] is False
        assert any(c["verified"] is True for c in real)
    finally:
        app.dependency_overrides.clear()
