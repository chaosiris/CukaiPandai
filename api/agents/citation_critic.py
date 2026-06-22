from __future__ import annotations

from core.citations import ground_citation
from core.lawcorpus import LawCorpus
from core.models import Citation

from api.llm import LLMClient

_SYS = "Answer ONLY YES or NO: does the cited clause text support the claim?"


def verify_claim(citation: Citation, corpus: LawCorpus, llm: LLMClient) -> Citation:
    grounded = ground_citation(citation, corpus)
    if not grounded.verified:
        return grounded  # missing clause -> blocked, no LLM call
    texts = "\n".join(corpus.get(cid).text for cid in grounded.clause_ids)
    ans = llm.complete(_SYS, f"CLAIM: {grounded.claim}\nCLAUSES:\n{texts}").strip().upper()
    grounded.verified = ans.startswith("YES")
    return grounded
