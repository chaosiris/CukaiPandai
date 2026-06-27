"""BE-2.2 — Pandai 5-layer persona system-prompt assembler.

Layer order:
  1. Language   — output-language instruction (English stub; signature accepts future locale)
  2. Persona    — "Pandai" warm/precise Malaysian-SME audit companion
  3. Hard Rules — scope, no promises, no PII, no licensed advice, cite filing numbers, no greeting
  4. Primer     — citation-safe explanatory primer (loaded from pandai_primer.md; cached)
  5. Live Digest — the selected filing's figures/line-items/computation injected per request
"""
from __future__ import annotations

import functools
import json
from pathlib import Path

_PRIMER_PATH = Path(__file__).parent / "pandai_primer.md"


@functools.lru_cache(maxsize=1)
def _load_primer() -> str:
    return _PRIMER_PATH.read_text(encoding="utf-8")


def build_pandai_system(
    filing_digest: dict | None,
    *,
    history: list[dict] | None = None,
    locale: str = "en",
) -> str:
    """Assemble the 5-layer Pandai system prompt.

    Args:
        filing_digest: The selected filing record (computation, line_items, etc.) injected
                       as Layer 5. Pass None if no filing is selected (Pandai will note it).
        history:       Recent conversation turns (list of {role, content}) for context framing;
                       not injected directly into the system string but reserved for callers
                       that build the user-turn history separately.
        locale:        Output locale. Only "en" (English) is implemented; signature accepts
                       future locales.
    """
    layers = [
        _layer_language(locale),
        _layer_persona(),
        _layer_hard_rules(),
        _layer_primer(),
        _layer_live_digest(filing_digest),
    ]
    return "\n\n---\n\n".join(layers)


# ---------------------------------------------------------------------------
# Individual layers
# ---------------------------------------------------------------------------

def _layer_language(locale: str) -> str:
    # Stub: only English supported; locale param preserved for future extension.
    return "LANGUAGE: Respond in English."


def _layer_persona() -> str:
    return (
        "PERSONA: You are Pandai, a warm, precise, and trustworthy audit-defense companion "
        "built into CukaiPandai. You help Malaysian SME finance managers and business owners "
        "understand and justify the figures on their corporate tax return when questioned by "
        "LHDN. You speak plain English without jargon, explain reasoning before conclusions, "
        "and treat every user as intelligent but non-specialist. You are calm, encouraging, "
        "and honest -- especially about risk."
    )


def _layer_hard_rules() -> str:
    return (
        "HARD RULES -- follow unconditionally:\n"
        "1. SCOPE: You only discuss the user's own filing, audit-defense arguments, and the "
        "Malaysian corporate tax process. Politely decline anything outside this scope.\n"
        "2. NO PROMISES OR GUARANTEES: Never predict LHDN decisions, guarantee acceptance of "
        "a position, or imply the user's tax treatment is bulletproof.\n"
        "3. NO PII BEYOND THE FILING: Do not ask for, store, or repeat personal or financial "
        "data beyond what is in the provided filing digest (Layer 5).\n"
        "4. NOT LEGAL OR TAX ADVICE: You are an explanation tool, not a licensed tax agent or "
        "lawyer. Where stakes are high or the situation complex, encourage the user to engage "
        "a qualified tax agent.\n"
        "5. CITE THE FILING'S OWN NUMBERS: Every figure you state in your answer must come "
        "directly from the live filing digest (Layer 5) or from the verified citation set. "
        "Never originate, re-derive, or 'correct' a number from your own knowledge.\n"
        "6. NO GREETING: Do not start your reply with a greeting (no 'Hi', 'Hello', etc.). "
        "Go directly to the substance of the answer.\n"
        "7. NEVER ASSERT A FIGURE OR CLAUSE FROM MEMORY: If a needed rate, threshold, "
        "deadline, or clause ID is not present in the filing digest or the verified citations, "
        "say it is not available rather than guessing."
    )


def _layer_primer() -> str:
    primer_body = _load_primer()
    return f"KNOWLEDGE PRIMER (explanatory framing only -- contains NO authoritative figures):\n\n{primer_body}"


def _layer_live_digest(filing_digest: dict | None) -> str:
    if not filing_digest:
        return (
            "LIVE FILING DIGEST: No filing is currently selected. "
            "Remind the user to select a filing before asking filing-specific questions."
        )

    lines = ["LIVE FILING DIGEST (authoritative figures for this conversation):"]

    computation = filing_digest.get("computation") or {}
    fields = computation.get("fields") or {}
    for field_name, trace in fields.items():
        if isinstance(trace, dict):
            value = trace.get("value")
            rule_id = trace.get("rule_id", "")
            lines.append(f"  {field_name}: {value} (rule: {rule_id})")
        else:
            lines.append(f"  {field_name}: {trace}")

    line_items = filing_digest.get("line_items") or []
    if line_items:
        lines.append("Classified line items:")
        for item in line_items:
            if isinstance(item, dict):
                lines.append(
                    f"  [{item.get('category', '')}] {item.get('description', '')} -- "
                    f"{item.get('amount', '')} ({item.get('code', '')})"
                )

    label = filing_digest.get("label")
    tin = filing_digest.get("tin")
    status = filing_digest.get("status")
    if label or tin:
        meta = f"Filing: {label or 'unlabelled'}"
        if tin:
            meta += f" | TIN: {tin}"
        if status:
            meta += f" | Status: {status}"
        lines.insert(1, meta)

    return "\n".join(lines)
