from __future__ import annotations

from core.lawcorpus import LawCorpus
from core.models import Citation, DefensePack
from core.rag import retrieve, thread_provenance

from api.agents.citation_critic import verify_claim
from api.jsonio import loads_relaxed
from api.llm import LLMClient


def build_defense(query: str, evidence: list[tuple], llm: LLMClient, corpus: LawCorpus) -> DefensePack:
    # RAG (BE-13): retrieve candidate clauses for the auditor query; constrain the model to them
    # (fall back to the full corpus-ID list when retrieval is unavailable).
    hits = retrieve(query, k=6)
    allowed = ", ".join([h["clause_id"] for h in hits] or corpus.ids())
    system = (
        "You are an LHDN audit-defense assistant. Interpret the auditor's query and identify the "
        "contested item and its tax-treatment justification. Cite ONLY from these valid clause IDs, "
        f"copied VERBATIM with their exact hyphens and punctuation: {allowed}. "
        'Return ONLY a JSON object: '
        '{"contested_item": "<text>", "claim": "<one sentence>", "clause_ids": ["<id>", ...]}.'
    )
    raw = loads_relaxed(llm.complete(system, query, json_schema={"type": "object"}))
    cit = verify_claim(Citation(claim=raw["claim"], clause_ids=raw["clause_ids"]), corpus, llm)
    cit = thread_provenance(cit, hits)  # additive page/section/url provenance; gate unchanged
    note = (
        "If the position is not sustained, exposure may arise under ITA 1967 s.113 "
        "(incorrect return) / s.112 (failure to furnish); human review required."
    )
    return DefensePack(
        query=query,
        items=[{"contested_item": raw["contested_item"], "evidence": evidence}],
        citations=[cit], exposure_note=note,
    )
