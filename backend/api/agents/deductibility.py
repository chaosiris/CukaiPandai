from __future__ import annotations

from core.citations import ground_citation
from core.lawcorpus import LawCorpus
from core.models import Citation, LineItem
from core.rag import retrieve, thread_provenance

from api.jsonio import loads_relaxed
from api.llm import LLMClient


def cite_treatment(item: LineItem, llm: LLMClient, corpus: LawCorpus) -> Citation:
    # RAG (BE-13): retrieve candidate clauses for this item; constrain the model to them
    # (fall back to the full corpus-ID list when retrieval is unavailable).
    hits = retrieve(f"{item.description} ({item.category})", k=6)
    allowed = ", ".join([h["clause_id"] for h in hits] or corpus.ids())
    system = (
        "Given a Malaysian company line item, state its tax treatment and cite the supporting "
        "Income Tax Act clause(s). Cite ONLY from these valid clause IDs, copied VERBATIM with "
        f"their exact hyphens and punctuation: {allowed}. "
        'Return ONLY a JSON object: {"claim": "<one sentence>", "clause_ids": ["<id>", ...]}.'
    )
    raw = loads_relaxed(llm.complete(system, item.model_dump_json(), json_schema={"type": "object"}))
    cit = ground_citation(Citation(claim=raw["claim"], clause_ids=raw["clause_ids"]), corpus)
    return thread_provenance(cit, hits)  # additive page/section/url provenance; gate unchanged
