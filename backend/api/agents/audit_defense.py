from __future__ import annotations

import json

from core.lawcorpus import LawCorpus
from core.models import Citation, DefensePack

from api.agents.citation_critic import verify_claim
from api.llm import LLMClient

_SYS = (
    "You are an LHDN audit-defense assistant. Interpret the auditor's query and return ONLY JSON "
    "{contested_item, claim, clause_ids}. Cite Income Tax Act / Public Ruling clause IDs."
)


def build_defense(query: str, evidence: list[tuple], llm: LLMClient, corpus: LawCorpus) -> DefensePack:
    raw = json.loads(llm.complete(_SYS, query))
    cit = verify_claim(Citation(claim=raw["claim"], clause_ids=raw["clause_ids"]), corpus, llm)
    note = (
        "If the position is not sustained, exposure may arise under ITA 1967 s.113 "
        "(incorrect return) / s.112 (failure to furnish); human review required."
    )
    return DefensePack(
        query=query,
        items=[{"contested_item": raw["contested_item"], "evidence": evidence}],
        citations=[cit], exposure_note=note,
    )
