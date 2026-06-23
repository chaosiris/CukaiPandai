"""BE-2 — the HITL filing graph mounted over FastAPI (start pauses, resume finalizes)."""
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


def test_start_pauses_for_approval_then_resume_finalizes():
    client = TestClient(app)

    r = client.post("/entities/C2581234509/filings/form-c/start", json={"ssm": SSM, "line_items": ITEMS})
    assert r.status_code == 200
    body = r.json()
    assert body["requires_approval"] is True  # paused at the interrupt
    assert body["computation"]["fields"]["tax_payable"]["value"] == 31000
    thread_id = body["thread_id"]
    assert thread_id

    r2 = client.post(
        "/entities/C2581234509/filings/form-c/resume",
        json={"thread_id": thread_id, "approved": True},
    )
    assert r2.status_code == 200
    final = r2.json()
    assert final["approved"] is True
    assert final["computation"]["fields"]["tax_payable"]["value"] == 31000


def test_start_surfaces_risk_flags_for_the_approver():
    client = TestClient(app)
    body = client.post(
        "/entities/C2581234509/filings/form-c/start", json={"ssm": SSM, "line_items": ITEMS}
    ).json()
    assert "risk_flags" in body
    # Acme (RM5m declared vs RM200k chargeable) trips the gross-vs-chargeable gap at the gate.
    assert any(f["code"] == "gross_chargeable_gap" for f in body["risk_flags"])


def test_resume_unknown_thread_returns_404():
    client = TestClient(app)
    r = client.post(
        "/entities/C2581234509/filings/form-c/resume",
        json={"thread_id": "does-not-exist", "approved": True},
    )
    assert r.status_code == 404


def test_resume_with_rejection_records_not_approved():
    client = TestClient(app)
    start = client.post(
        "/entities/C2581234509/filings/form-c/start", json={"ssm": SSM, "line_items": ITEMS}
    ).json()
    final = client.post(
        "/entities/C2581234509/filings/form-c/resume",
        json={"thread_id": start["thread_id"], "approved": False},
    ).json()
    assert final["approved"] is False
