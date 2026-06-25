"""BE-8 — GET /entities/{tin} serves the seeded profile; unknown TIN → 404."""
from __future__ import annotations

from fastapi.testclient import TestClient

from api.main import app


def test_get_entity_returns_seeded_profile():
    r = TestClient(app).get("/entities/C2581234509")
    assert r.status_code == 200
    body = r.json()
    assert body["tin"] == "C2581234509"
    assert body["msic_codes"] == ["46900"]
    assert body["gross_income"] == 5_000_000


def test_get_entity_unknown_tin_404():
    r = TestClient(app).get("/entities/C0000000000")
    assert r.status_code == 404


def test_get_entity_sinar():
    """FE-8 — Sinar Digital persona is reachable."""
    r = TestClient(app).get("/entities/C7654321098")
    assert r.status_code == 200
    body = r.json()
    assert body["tin"] == "C7654321098"
    assert body["msic_codes"] == ["62010"]
    assert body["gross_income"] == 380_000


def test_get_entity_selera():
    """FE-8 — Restoran Selera Kita persona is reachable."""
    r = TestClient(app).get("/entities/C3219876540")
    assert r.status_code == 200
    body = r.json()
    assert body["tin"] == "C3219876540"
    assert body["msic_codes"] == ["56101"]
    assert body["employee_count"] == 45
