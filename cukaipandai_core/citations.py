from __future__ import annotations

from cukaipandai_core.lawcorpus import LawCorpus
from cukaipandai_core.models import Citation


def ground_citation(citation: Citation, corpus: LawCorpus) -> Citation:
    citation.verified = bool(citation.clause_ids) and all(
        corpus.exists(cid) for cid in citation.clause_ids
    )
    return citation
