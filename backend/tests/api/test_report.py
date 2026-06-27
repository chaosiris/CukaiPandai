"""Filing draft-pack report — GET /me/filings/{id}/report (WeasyPrint PDF) + the pure HTML builder.

Hermetic (in-memory fallback). The PDF-render assertion skips when WeasyPrint's native libraries
are unavailable so CI without Pango/Cairo still passes; the HTML builder + 401/404/409 paths always run.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from api import auth
from api.main import _FILING_REPO, _USER_REPO, app
from api.report import build_report_html

client = TestClient(app)


def _weasyprint_ok() -> bool:
    try:
        from weasyprint import HTML

        HTML(string="<p>x</p>").write_pdf()
        return True
    except Exception:
        return False


_WP_OK = _weasyprint_ok()

_FINAL_FILING = {
    "tin": "C2581234509",
    "label": "Acme Trading (Demo) · Form C YA2026",
    "computation": {
        "form": "C",
        "fields": {
            "business_income": {"value": 5000000.0, "inputs": [], "rule_id": "cit.business_income", "config_version": "YA2026.1"},
            "adjusted_income": {"value": 200000.0, "inputs": [], "rule_id": "cit.adjusted_income", "config_version": "YA2026.1"},
            "statutory_income": {"value": 200000.0, "inputs": [], "rule_id": "cit.statutory_income", "config_version": "YA2026.1"},
            "aggregate_income": {"value": 200000.0, "inputs": [], "rule_id": "cit.aggregate_income", "config_version": "YA2026.1"},
            "total_income": {"value": 200000.0, "inputs": [], "rule_id": "cit.total_income", "config_version": "YA2026.1"},
            "chargeable_income": {"value": 200000.0, "inputs": [], "rule_id": "cit.chargeable_income", "config_version": "YA2026.1"},
            "tax_payable": {"value": 31000.0, "inputs": [], "rule_id": "cit.rate.sme", "config_version": "YA2026.1"},
        },
    },
    "risk_flags": [],
    "line_items": [
        {"code": "rev_sales", "description": "Sales / turnover", "amount": 5000000.0, "category": "income"},
        {"code": "dep_depreciation", "description": "Depreciation", "amount": 120000.0, "category": "non_deductible"},
    ],
}


def _make_token(sub: str, email: str) -> str:
    _USER_REPO._mem[email] = {"id": sub, "email": email, "name": "Test", "provider": "password"}
    return auth.create_token(sub, email, "Test")


def _auth(sub: str = "u1", email: str = "u1@x.my") -> dict:
    return {"Authorization": f"Bearer {_make_token(sub, email)}"}


@pytest.fixture(autouse=True)
def _hermetic(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL_UNPOOLED", raising=False)
    _USER_REPO._mem.clear()
    _FILING_REPO._mem.clear()
    yield
    _USER_REPO._mem.clear()
    _FILING_REPO._mem.clear()


def test_build_report_html_has_sections_and_disclaimer():
    out = build_report_html(_FINAL_FILING, None)
    assert "DRAFT - NOT FOR SUBMISSION" in out
    assert "Tax Computation" in out
    assert "Entity Particulars" in out
    assert "Chargeable income" in out
    assert "31,000" in out  # tax payable formatted
    assert "self-assessment" in out.lower()
    assert "MyTax" in out
    assert "authorised tax agent" in out


def test_report_401_without_token():
    assert client.get("/me/filings/anything/report").status_code == 401


def test_report_404_unknown_filing():
    assert client.get("/me/filings/does-not-exist/report", headers=_auth()).status_code == 404


def test_report_409_when_not_yet_computed():
    headers = _auth()
    rec = client.post("/me/filings", json={"tin": "C2581234509", "label": "draft", "status": "draft"}, headers=headers).json()
    assert client.get(f"/me/filings/{rec['id']}/report", headers=headers).status_code == 409


@pytest.mark.skipif(not _WP_OK, reason="WeasyPrint native libraries unavailable in this environment")
def test_report_returns_inline_pdf():
    headers = _auth()
    rec = client.post("/me/filings", json=_FINAL_FILING, headers=headers).json()
    r = client.get(f"/me/filings/{rec['id']}/report", headers=headers)
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert r.content[:5] == b"%PDF-"
    assert "inline" in r.headers.get("content-disposition", "")
