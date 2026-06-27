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
    # High-stakes gate: escalate to the failover model (Claude) when routing is active.
    ans = llm.complete(_SYS, f"CLAIM: {grounded.claim}\nCLAUSES:\n{texts}", escalate=True).strip().upper()
    # Pass only on an unambiguous affirmative: the FIRST token must be YES and the reply must carry no
    # negation. Prevents "YESTERDAY ... NO" and "YES, however this does NOT support" from passing.
    tokens = ans.replace(",", " ").replace(".", " ").split()
    first = tokens[0] if tokens else ""
    negated = any(t in {"NO", "NOT", "DOESN'T", "CANNOT", "DON'T"} for t in tokens)
    grounded.verified = first == "YES" and not negated
    return grounded
