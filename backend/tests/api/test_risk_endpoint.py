"""BE-3 — assess_risk is invoked by the live form-c endpoint and fires on the seeded demo."""
from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from api.main import app

SSM = json.loads(Path("core/fixtures/entity_acme.json").read_text())
ITEMS = [
    {"code": "4000", "description": "Revenue", "amount": 500000, "category": "income"},
    {"code": "5000", "description": "Expenses", "amount": 300000, "category": "deductible"},
]


def test_form_c_returns_risk_flags_on_seeded_demo():
    client = TestClient(app)
    r = client.post("/entities/C2581234509/filings/form-c", json={"ssm": SSM, "line_items": ITEMS})
    assert r.status_code == 200
    body = r.json()
    assert body["computation"]["fields"]["tax_payable"]["value"] == 31000
    flags = body["risk_flags"]
    # Acme declares RM5m gross but only RM200k chargeable → gross-vs-chargeable gap fires.
    assert len(flags) >= 1
    assert any(f["code"] == "gross_chargeable_gap" for f in flags)
