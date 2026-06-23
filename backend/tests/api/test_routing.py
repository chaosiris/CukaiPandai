"""BE-1 — RoutingLLMClient (ILMU-first → Claude failover/escalation) + JSON-object mode."""
from __future__ import annotations

from types import SimpleNamespace

import pytest

from api.llm import FakeLLMClient, RoutingLLMClient, _OpenAICompatClient


class _Boom:
    """A client whose complete() always raises — simulates an ILMU/network failure."""

    def complete(self, system, user, *, json_schema=None, escalate=False):
        raise RuntimeError("primary down")


def test_routes_to_primary_when_healthy():
    primary = FakeLLMClient(["from-ilmu"])
    fallback = FakeLLMClient(["from-claude"])
    assert RoutingLLMClient(primary, fallback).complete("s", "u") == "from-ilmu"


def test_fails_over_to_fallback_on_primary_error():
    r = RoutingLLMClient(_Boom(), FakeLLMClient(["from-claude"]))
    assert r.complete("s", "u") == "from-claude"


def test_escalate_uses_fallback_directly_without_touching_primary():
    primary = FakeLLMClient(["from-ilmu"])
    fallback = FakeLLMClient(["from-claude"])
    r = RoutingLLMClient(primary, fallback)
    assert r.complete("s", "u", escalate=True) == "from-claude"
    # primary's scripted response is still unconsumed → it was never called
    assert primary.complete("s", "u") == "from-ilmu"


def test_raises_when_primary_fails_and_no_fallback():
    r = RoutingLLMClient(_Boom(), None)
    with pytest.raises(RuntimeError):
        r.complete("s", "u")


def _fake_openai(content: str, captured: dict):
    class _Comp:
        def create(self, **kw):
            captured.update(kw)
            return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])

    return SimpleNamespace(chat=SimpleNamespace(completions=_Comp()))


def test_openai_compat_requests_json_object_mode_when_schema_given():
    c = _OpenAICompatClient("nemo-super", "k", "https://api.ilmu.ai/v1")
    captured: dict = {}
    c._c = _fake_openai('{"ok": true}', captured)
    out = c.complete("sys", "user", json_schema={"type": "object"})
    assert captured.get("response_format") == {"type": "json_object"}
    assert out == '{"ok": true}'


def test_openai_compat_omits_json_mode_by_default():
    c = _OpenAICompatClient("nemo-super", "k", "https://api.ilmu.ai/v1")
    captured: dict = {}
    c._c = _fake_openai("YES", captured)
    out = c.complete("sys", "user")
    assert "response_format" not in captured
    assert out == "YES"
