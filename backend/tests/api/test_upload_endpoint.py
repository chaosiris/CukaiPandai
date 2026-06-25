"""BE-J2 — POST /entities/{tin}/documents/upload (multipart → extract → classify).

Tests cover:
- CSV upload → ClassifyResponse shape (line_items + route_info)
- XLSX upload → ClassifyResponse shape
- PDF upload → ClassifyResponse shape
- Unsupported format → 415
- Empty file → 422
All LLM calls go through FakeLLMClient (no network).
"""
from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from api.llm import FakeLLMClient
from api.main import app, get_llm

_FIXTURE_DIR = Path(__file__).parent

_CLASSIFY_RESPONSE = (
    '{"line_items":['
    '{"code":"4000","description":"Revenue","amount":500000,"category":"income"},'
    '{"code":"5100","description":"Staff Costs","amount":120000,"category":"deductible"}'
    "]}"
)

TIN = "C2581234509"


def _fake_llm():
    # FakeLLMClient always returns the same scripted response; we give enough copies
    # to cover repeated calls (one per test with its own client).
    return FakeLLMClient([_CLASSIFY_RESPONSE] * 10)


def test_upload_csv_returns_classify_response():
    app.dependency_overrides[get_llm] = _fake_llm
    try:
        csv_path = _FIXTURE_DIR / "trial_balance.csv"
        with open(csv_path, "rb") as f:
            r = TestClient(app).post(
                f"/entities/{TIN}/documents/upload",
                files={"file": ("trial_balance.csv", f, "text/csv")},
            )
        assert r.status_code == 200
        body = r.json()
        assert "line_items" in body
        assert len(body["line_items"]) > 0
        assert "sovereign" in body
        assert "active_model" in body
    finally:
        app.dependency_overrides.clear()


def test_upload_xlsx_returns_classify_response():
    app.dependency_overrides[get_llm] = _fake_llm
    try:
        xlsx_path = _FIXTURE_DIR / "trial_balance.xlsx"
        with open(xlsx_path, "rb") as f:
            r = TestClient(app).post(
                f"/entities/{TIN}/documents/upload",
                files={
                    "file": (
                        "trial_balance.xlsx",
                        f,
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    )
                },
            )
        assert r.status_code == 200
        body = r.json()
        assert "line_items" in body
        assert len(body["line_items"]) > 0
        assert "sovereign" in body
    finally:
        app.dependency_overrides.clear()


def test_upload_pdf_returns_classify_response():
    app.dependency_overrides[get_llm] = _fake_llm
    try:
        pdf_path = _FIXTURE_DIR / "trial_balance.pdf"
        with open(pdf_path, "rb") as f:
            r = TestClient(app).post(
                f"/entities/{TIN}/documents/upload",
                files={"file": ("trial_balance.pdf", f, "application/pdf")},
            )
        assert r.status_code == 200
        body = r.json()
        assert "line_items" in body
        assert "sovereign" in body
    finally:
        app.dependency_overrides.clear()


def test_upload_unsupported_format_returns_415():
    app.dependency_overrides[get_llm] = _fake_llm
    try:
        r = TestClient(app, raise_server_exceptions=False).post(
            f"/entities/{TIN}/documents/upload",
            files={"file": ("report.docx", b"binary content", "application/msword")},
        )
        assert r.status_code == 415
    finally:
        app.dependency_overrides.clear()


def test_upload_empty_file_returns_422():
    app.dependency_overrides[get_llm] = _fake_llm
    try:
        r = TestClient(app, raise_server_exceptions=False).post(
            f"/entities/{TIN}/documents/upload",
            files={"file": ("empty.csv", b"", "text/csv")},
        )
        assert r.status_code == 422
    finally:
        app.dependency_overrides.clear()
