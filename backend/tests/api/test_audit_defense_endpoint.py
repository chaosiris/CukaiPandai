"""Boundary robustness — /audit-defense returns a controlled 502 on unparseable model output."""
from __future__ import annotations

from fastapi.testclient import TestClient

from api.llm import FakeLLMClient
from api.main import app, get_llm


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
    app.dependency_overrides[get_llm] = lambda: FakeLLMClient([
        '{"contested_item":"Repairs","claim":"deductible under s.33(1)","clause_ids":["ITA-1967-s33(1)"]}',
        "YES",
    ])
    try:
        r = TestClient(app).post(
            "/entities/C2581234509/audit-defense",
            json={"query": "Justify repairs", "evidence": [["tax_payable", "tb", "ITA-1967-s33(1)"]]},
        )
        assert r.status_code == 200
        assert r.json()["citations"][0]["verified"] is True
    finally:
        app.dependency_overrides.clear()
