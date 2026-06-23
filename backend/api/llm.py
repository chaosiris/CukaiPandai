from __future__ import annotations

import os
from typing import Protocol


class LLMClient(Protocol):
    def complete(
        self, system: str, user: str, *, json_schema: dict | None = None, escalate: bool = False
    ) -> str: ...


class FakeLLMClient:
    """Deterministic, scriptable LLM stub for tests — no network."""

    def __init__(self, scripted: list[str]):
        self._s = list(scripted)
        self._i = 0

    def complete(
        self, system: str, user: str, *, json_schema: dict | None = None, escalate: bool = False
    ) -> str:
        out = self._s[self._i]
        self._i += 1
        return out


class _AnthropicClient:
    def __init__(self, model: str, api_key: str):
        import anthropic

        self._c = anthropic.Anthropic(api_key=api_key)
        self._model = model

    def complete(
        self, system: str, user: str, *, json_schema: dict | None = None, escalate: bool = False
    ) -> str:
        m = self._c.messages.create(
            model=self._model, max_tokens=2048, system=system,
            messages=[{"role": "user", "content": user}],
        )
        return m.content[0].text


class _OpenAICompatClient:
    """ILMU (sovereign) or Gemini via an OpenAI-compatible base_url."""

    def __init__(self, model: str, api_key: str, base_url: str):
        from openai import OpenAI

        self._c = OpenAI(api_key=api_key, base_url=base_url)
        self._model = model

    def complete(
        self, system: str, user: str, *, json_schema: dict | None = None, escalate: bool = False
    ) -> str:
        kwargs: dict = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
        if json_schema is not None:
            # OpenAI-compatible JSON mode: forces a valid JSON object response.
            kwargs["response_format"] = {"type": "json_object"}
        r = self._c.chat.completions.create(**kwargs)
        return r.choices[0].message.content or ""


class RoutingLLMClient:
    """ILMU-first router: uses the primary (sovereign) client, falls back to the secondary
    (Claude) on any error, and escalates high-stakes calls (e.g. the citation critic) straight
    to the secondary when ``escalate=True``."""

    def __init__(self, primary: LLMClient, fallback: LLMClient | None = None):
        self._primary = primary
        self._fallback = fallback

    def complete(
        self, system: str, user: str, *, json_schema: dict | None = None, escalate: bool = False
    ) -> str:
        if escalate and self._fallback is not None:
            return self._fallback.complete(system, user, json_schema=json_schema)
        try:
            return self._primary.complete(system, user, json_schema=json_schema)
        except Exception:
            if self._fallback is None:
                raise
            return self._fallback.complete(system, user, json_schema=json_schema)


def make_llm() -> LLMClient:
    """Build the active client from env. ILMU-first (LLM_PROVIDER=openai); if ANTHROPIC_API_KEY
    is also set, wrap it in a RoutingLLMClient with a Claude failover/escalation path."""
    provider = os.getenv("LLM_PROVIDER", "anthropic")
    model = os.getenv("LLM_MODEL", "claude-opus-4-8")
    key = os.getenv("LLM_API_KEY", "")
    if provider == "openai":  # ILMU / Gemini (OpenAI-compatible)
        primary = _OpenAICompatClient(model, key, os.getenv("LLM_BASE_URL", ""))
        fallback_key = os.getenv("ANTHROPIC_API_KEY", "")
        if fallback_key:
            fallback = _AnthropicClient(os.getenv("LLM_FALLBACK_MODEL", "claude-opus-4-8"), fallback_key)
            return RoutingLLMClient(primary, fallback)
        return primary
    return _AnthropicClient(model, key)
