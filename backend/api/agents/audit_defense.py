from __future__ import annotations

from core.lawcorpus import LawCorpus
from core.models import Citation, DefensePack
from core.rag import retrieve, thread_provenance

from api.agents.citation_critic import verify_claim
from api.agents.pandai_persona import build_pandai_system
from api.jsonio import loads_relaxed
from api.llm import LLMClient


_FAKE_CLAUSE_ID = "ITA-1967-s999-FAKE"

# Maximum number of history turns fed into the persona system prompt to keep context bounded.
_MAX_HISTORY_TURNS = 8


def build_defense(
    query: str,
    evidence: list[tuple],
    llm: LLMClient,
    corpus: LawCorpus,
    inject_fabricated: bool = False,
    filing_digest: dict | None = None,
    history: list[dict] | None = None,
) -> DefensePack:
    # RAG (BE-13): retrieve candidate clauses for the auditor query; constrain the model to them
    # (fall back to the full corpus-ID list when retrieval is unavailable).
    hits = retrieve(query, k=6)
    allowed = ", ".join([h["clause_id"] for h in hits] or corpus.ids())

    # BE-2.2: 5-layer Pandai persona system prompt.
    # Feed only the last N turns of history to keep context bounded.
    bounded_history = (history or [])[-_MAX_HISTORY_TURNS:]
    system = build_pandai_system(filing_digest, history=bounded_history)

    # Extend the JSON schema to include conversational answer + 3 follow-up suggestions.
    # The citation gate (verify_claim + thread_provenance + inject_fabricated probe) is unchanged.
    user_prompt = (
        f"Clause IDs you may cite (VERBATIM, exact hyphens/punctuation): {allowed}\n\n"
        f"Auditor query: {query}\n\n"
        'Return ONLY a JSON object:\n'
        '{"contested_item": "<text>", "claim": "<one sentence>", '
        '"clause_ids": ["<id>", ...], '
        '"answer": "<Pandai\'s conversational reply, grounded ONLY in the provided filing and verified citations>", '
        '"followups": ["<brief follow-up question 1>", "<brief follow-up question 2>", "<brief follow-up question 3>"]}'
    )

    raw = loads_relaxed(llm.complete(system, user_prompt, json_schema={"type": "object"}))
    cit = verify_claim(Citation(claim=raw["claim"], clause_ids=raw["clause_ids"]), corpus, llm)
    cit = thread_provenance(cit, hits)  # additive page/section/url provenance; gate unchanged
    note = (
        "If the position is not sustained, exposure may arise under ITA 1967 s.113 "
        "(incorrect return) / s.112 (failure to furnish); human review required."
    )
    citations = [cit]
    if inject_fabricated:
        probe = Citation(
            claim="(integrity probe -- fabricated clause, not a real citation)",
            clause_ids=[_FAKE_CLAUSE_ID],
        )
        citations.append(verify_claim(probe, corpus, llm))

    answer = raw.get("answer", "")
    followups = raw.get("followups", [])
    # Guarantee exactly 3 follow-ups (pad with empty strings if the model returns fewer).
    if not isinstance(followups, list):
        followups = []
    followups = (followups + ["", "", ""])[:3]

    return DefensePack(
        query=query,
        items=[{"contested_item": raw["contested_item"], "evidence": evidence}],
        citations=citations,
        exposure_note=note,
        answer=answer,
        followups=followups,
    )
