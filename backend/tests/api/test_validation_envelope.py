"""BE-10 — malformed request bodies return a consistent 422 (not an uncaught 500)."""
from __future__ import annotations

from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app, raise_server_exceptions=False)
BAD_SSM = {"ssm": {"tin": "C1"}}  # missing required EntityTaxProfile fields


def test_obligations_bad_ssm_returns_422():
    r = client.post("/entities/C1/obligations", json=BAD_SSM)
    assert r.status_code == 422


def test_form_c_bad_ssm_returns_422():
    r = client.post("/entities/C1/filings/form-c", json={**BAD_SSM, "line_items": []})
    assert r.status_code == 422


def test_form_c_bad_line_items_returns_422():
    ssm = {
        "tin": "C2581234509", "entity_type": "sdn_bhd", "msic_codes": ["46900"],
        "paid_up_capital": 1000000, "gross_income": 5000000, "employee_count": 12,
        "sst_registered": True, "basis_period_start": "2025-01-01",
        "basis_period_end": "2025-12-31", "commencement_date": "2018-03-01",
    }
    r = client.post(
        "/entities/C2581234509/filings/form-c",
        json={"ssm": ssm, "line_items": [{"code": "4000"}]},  # missing amount/category
    )
    assert r.status_code == 422
