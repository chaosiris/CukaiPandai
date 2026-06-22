from __future__ import annotations

import os
from typing import Protocol


class LLMClient(Protocol):
    def complete(self, system: str, user: str, *, json_schema: dict | None = None) -> str: ...


class FakeLLMClient:
    """Deterministic, scriptable LLM stub for tests — no network."""

    def __init__(self, scripted: list[str]):
        self._s = list(scripted)
        self._i = 0

    def complete(self, system: str, user: str, *, json_schema: dict | None = None) -> str:
        out = self._s[self._i]
        self._i += 1
        return out


class _AnthropicClient:
    def __init__(self, model: str, api_key: str):
        import anthropic

        self._c = anthropic.Anthropic(api_key=api_key)
        self._model = model

    def complete(self, system: str, user: str, *, json_schema: dict | None = None) -> str:
        m = self._c.messages.create(
            model=self._model, max_tokens=2048, system=system,
            messages=[{"role": "user", "content": user}],
        )
        return m.content[0].text


class _OpenAICompatClient:
    """ILMU Claw (sovereign) or Gemini via an OpenAI-compatible base_url."""

    def __init__(self, model: str, api_key: str, base_url: str):
        from openai import OpenAI

        self._c = OpenAI(api_key=api_key, base_url=base_url)
        self._model = model

    def complete(self, system: str, user: str, *, json_schema: dict | None = None) -> str:
        r = self._c.chat.completions.create(
            model=self._model,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        )
        return r.choices[0].message.content or ""


def make_llm() -> LLMClient:
    provider = os.getenv("LLM_PROVIDER", "anthropic")
    model = os.getenv("LLM_MODEL", "claude-opus-4-8")
    key = os.getenv("LLM_API_KEY", "")
    if provider == "openai":  # ILMU Claw / Gemini (OpenAI-compatible)
        return _OpenAICompatClient(model, key, os.getenv("LLM_BASE_URL", ""))
    return _AnthropicClient(model, key)
