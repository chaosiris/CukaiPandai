from __future__ import annotations

from core.citations import ground_citation
from core.lawcorpus import LawCorpus
from core.models import Citation, LineItem

from api.jsonio import loads_relaxed
from api.llm import LLMClient


def cite_treatment(item: LineItem, llm: LLMClient, corpus: LawCorpus) -> Citation:
    allowed = ", ".join(corpus.ids())
    system = (
        "Given a Malaysian company line item, state its tax treatment and cite the supporting "
        "Income Tax Act clause(s). Cite ONLY from these valid clause IDs, copied VERBATIM with "
        f"their exact hyphens and punctuation: {allowed}. "
        'Return ONLY a JSON object: {"claim": "<one sentence>", "clause_ids": ["<id>", ...]}.'
    )
    raw = loads_relaxed(llm.complete(system, item.model_dump_json(), json_schema={"type": "object"}))
    return ground_citation(Citation(claim=raw["claim"], clause_ids=raw["clause_ids"]), corpus)
