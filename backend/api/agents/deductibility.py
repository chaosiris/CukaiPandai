from __future__ import annotations

import json

from core.citations import ground_citation
from core.lawcorpus import LawCorpus
from core.models import Citation, LineItem

from api.llm import LLMClient

_SYS = (
    "Given a Malaysian company line item, state its tax treatment and cite the "
    "Income Tax Act / Public Ruling clause IDs. Return ONLY JSON {claim, clause_ids}."
)


def cite_treatment(item: LineItem, llm: LLMClient, corpus: LawCorpus) -> Citation:
    raw = json.loads(llm.complete(_SYS, item.model_dump_json()))
    return ground_citation(Citation(claim=raw["claim"], clause_ids=raw["clause_ids"]), corpus)
