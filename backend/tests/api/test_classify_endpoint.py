"""BE-9 — POST /entities/{tin}/documents/classify (JSON-mode, 502-guarded) + BE-6 route field."""
from __future__ import annotations

from fastapi.testclient import TestClient

from api.llm import FakeLLMClient
from api.main import app, get_llm

_OBJ = '{"line_items":[{"code":"rev_sales","description":"Revenue","amount":500000,"category":"income"}]}'


def test_classify_returns_line_items_and_route_info():
    app.dependency_overrides[get_llm] = lambda: FakeLLMClient([_OBJ])
    try:
        r = TestClient(app).post(
            "/entities/C2581234509/documents/classify", json={"raw_text": "4000 Revenue 500000"}
        )
        assert r.status_code == 200
        body = r.json()
        assert body["line_items"][0]["code"] == "rev_sales"
        # BE-6: AI responses report the active route.
        assert "sovereign" in body and "active_model" in body
    finally:
        app.dependency_overrides.clear()


def test_classify_502_on_unparseable_output():
    app.dependency_overrides[get_llm] = lambda: FakeLLMClient(["totally not json"])
    try:
        r = TestClient(app, raise_server_exceptions=False).post(
            "/entities/C2581234509/documents/classify", json={"raw_text": "x"}
        )
        assert r.status_code == 502
    finally:
        app.dependency_overrides.clear()
