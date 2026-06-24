"""make_llm escalation wiring — sovereign-by-default; direct-Anthropic is a flagged opt-in."""
from __future__ import annotations

import pytest

from api.llm import RoutingLLMClient, _AnthropicClient, _OpenAICompatClient, make_llm

_VARS = (
    "LLM_PROVIDER", "LLM_BASE_URL", "LLM_MODEL", "LLM_API_KEY",
    "LLM_ESCALATION_MODEL", "LLM_ESCALATION_BASE_URL", "LLM_ESCALATION_API_KEY",
    "LLM_ALLOW_DIRECT_ANTHROPIC", "ANTHROPIC_API_KEY", "LLM_FALLBACK_MODEL",
)


@pytest.fixture(autouse=True)
def _clean_env(monkeypatch):
    for v in _VARS:
        monkeypatch.delenv(v, raising=False)


def _ilmu(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "openai")
    monkeypatch.setenv("LLM_BASE_URL", "https://api.ilmu.ai/v1")
    monkeypatch.setenv("LLM_MODEL", "nemo-super")
    monkeypatch.setenv("LLM_API_KEY", "sk-ilmu")


def test_pure_ilmu_returns_bare_sovereign_client(monkeypatch):
    _ilmu(monkeypatch)
    c = make_llm()
    assert isinstance(c, _OpenAICompatClient)  # no router built (prelim, Q6)
    assert c.route_info() == {"sovereign": True, "active_model": "nemo-super"}


def test_escalation_model_wraps_router_staying_on_ilmu(monkeypatch):
    _ilmu(monkeypatch)
    monkeypatch.setenv("LLM_ESCALATION_MODEL", "nemo-super-xl")
    c = make_llm()
    assert isinstance(c, RoutingLLMClient)
    assert isinstance(c._fallback, _OpenAICompatClient)  # secondary is ILMU, not Anthropic
    assert c._fallback.route_info()["sovereign"] is True  # escalation stays in-country


def test_direct_anthropic_is_optin_and_flagged_nonsovereign(monkeypatch):
    _ilmu(monkeypatch)
    monkeypatch.setenv("LLM_ALLOW_DIRECT_ANTHROPIC", "1")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test")
    c = make_llm()
    assert isinstance(c, RoutingLLMClient)
    assert isinstance(c._fallback, _AnthropicClient)
    assert c._fallback.route_info()["sovereign"] is False  # direct Anthropic leaves Malaysia


def test_anthropic_key_alone_does_not_enable_direct_fallback(monkeypatch):
    _ilmu(monkeypatch)
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test")  # no LLM_ALLOW_DIRECT_ANTHROPIC=1
    c = make_llm()
    assert isinstance(c, _OpenAICompatClient)  # stays pure-ILMU; opt-in not enabled
