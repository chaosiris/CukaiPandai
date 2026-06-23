import json

from fastapi.testclient import TestClient

from api.llm import FakeLLMClient
from api.main import app, get_llm

SSM = json.loads(open("core/fixtures/entity_acme.json").read())


def test_obligations_endpoint():
    c = TestClient(app)
    r = c.post("/entities/C2581234509/obligations", json={"ssm": SSM})
    assert r.status_code == 200
    assert any(o["form"] == "C" for o in r.json()["obligations"])


def test_form_c_endpoint_requires_approval():
    items = [
        {"code": "4000", "description": "Revenue", "amount": 500000, "category": "income"},
        {"code": "5000", "description": "Expenses", "amount": 300000, "category": "deductible"},
    ]
    c = TestClient(app)
    r = c.post("/entities/C2581234509/filings/form-c", json={"ssm": SSM, "line_items": items})
    body = r.json()
    assert body["requires_approval"] is True
    assert body["computation"]["fields"]["tax_payable"]["value"] == 31000


def test_audit_defense_endpoint():
    app.dependency_overrides[get_llm] = lambda: FakeLLMClient(
        ['{"contested_item":"Repairs","claim":"deductible under s.33(1)","clause_ids":["ITA-1967-s33(1)"]}', "YES"]
    )
    c = TestClient(app)
    r = c.post(
        "/entities/C2581234509/audit-defense",
        json={"query": "Justify repairs", "evidence": [["tax_payable", "tb", "ITA-1967-s33(1)"]]},
    )
    assert r.json()["citations"][0]["verified"] is True
    app.dependency_overrides.clear()
