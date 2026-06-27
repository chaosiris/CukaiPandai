"""BE-4 — the MSIC reference endpoint (fixture-backed via DI in tests; live data.gov.my otherwise)."""
from __future__ import annotations

import httpx
from fastapi.testclient import TestClient

from api.connectors.msic import MsicClient
from api.main import app, get_msic


def _override():
    app.dependency_overrides[get_msic] = lambda: MsicClient(fixtures_path="core/fixtures/msic_sample.json")


def test_msic_endpoint_returns_description():
    _override()
    try:
        r = TestClient(app).get("/reference/msic/46900")
        assert r.status_code == 200
        assert "wholesale" in r.json()["desc_en"].lower()
    finally:
        app.dependency_overrides.clear()


def test_msic_endpoint_404_for_unknown():
    _override()
    try:
        r = TestClient(app).get("/reference/msic/99999")
        assert r.status_code == 404
    finally:
        app.dependency_overrides.clear()


def test_msic_endpoint_502_on_upstream_error():
    """API-4 — an upstream data.gov.my failure surfaces as 502, not 500."""

    class _Boom:
        def lookup(self, code: str):
            raise httpx.ConnectError("connection refused")

    app.dependency_overrides[get_msic] = lambda: _Boom()
    try:
        r = TestClient(app, raise_server_exceptions=False).get("/reference/msic/46900")
        assert r.status_code == 502
    finally:
        app.dependency_overrides.clear()
