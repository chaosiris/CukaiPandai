"""BE-7 — CORS allows the configured origin and does not echo an unlisted one."""
from __future__ import annotations

from fastapi.testclient import TestClient

from api.main import app


def test_cors_allows_configured_origin():
    r = TestClient(app).get("/health", headers={"Origin": "http://localhost:5173"})
    assert r.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_does_not_allow_unlisted_origin():
    r = TestClient(app).get("/health", headers={"Origin": "http://evil.example"})
    assert r.headers.get("access-control-allow-origin") != "http://evil.example"


def test_cors_preflight_succeeds_for_post():
    r = TestClient(app).options(
        "/entities/C2581234509/obligations",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert r.status_code in (200, 204)
    assert r.headers.get("access-control-allow-origin") == "http://localhost:5173"
