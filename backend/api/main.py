from __future__ import annotations

import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from langgraph.types import Command

# Load .env (searches CWD upward, so it finds the repo-root .env when run from backend/).
# No-op if absent; tests inject FakeLLMClient and never need a real key.
load_dotenv()

from core.computation import compute_form_c
from core.lawcorpus import LawCorpus
from core.models import EntityTaxProfile, LineItem
from core.obligations import derive_obligations

from api.agents.audit_defense import build_defense
from api.graph import build_filing_graph
from api.llm import LLMClient, make_llm
from api.schemas import AuditDefenseReq, FilingResumeReq, FormCReq, ObligationsReq

app = FastAPI(title="CukaiPandai API")
_CORPUS = LawCorpus.load(Path("core/fixtures/lawcorpus_seed.json"))

# Single in-process HITL filing graph (MemorySaver persists paused state across the
# start→resume calls, keyed by thread_id). The graph's compute node is deterministic —
# it never calls the LLM — so no model client is constructed here.
_FILING_GRAPH = build_filing_graph(None)


def get_llm() -> LLMClient:
    return make_llm()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/entities/{tin}/obligations")
def obligations(tin: str, req: ObligationsReq) -> dict:
    profile = EntityTaxProfile(**req.ssm)
    return derive_obligations(profile, 2026).model_dump(mode="json")


@app.post("/entities/{tin}/filings/form-c")
def form_c(tin: str, req: FormCReq) -> dict:
    profile = EntityTaxProfile(**req.ssm)
    items = [LineItem(**li) for li in req.line_items]
    fc = compute_form_c(profile, items, 2026)
    return {"computation": fc.model_dump(mode="json"), "requires_approval": True}


@app.post("/entities/{tin}/audit-defense")
def audit_defense(tin: str, req: AuditDefenseReq, llm: LLMClient = Depends(get_llm)) -> dict:
    pack = build_defense(req.query, [tuple(e) for e in req.evidence], llm, _CORPUS)
    return pack.model_dump(mode="json")


@app.post("/entities/{tin}/filings/form-c/start")
def filing_start(tin: str, req: FormCReq) -> dict:
    """Run the filing graph until it pauses at the human-approval interrupt."""
    thread_id = uuid.uuid4().hex
    cfg = {"configurable": {"thread_id": thread_id}}
    state = _FILING_GRAPH.invoke(
        {"profile_ssm": req.ssm, "line_items": req.line_items}, cfg
    )
    computation = _FILING_GRAPH.get_state(cfg).values.get("computation")
    return {
        "thread_id": thread_id,
        "computation": computation,
        "requires_approval": bool(state.get("__interrupt__")),
    }


@app.post("/entities/{tin}/filings/form-c/resume")
def filing_resume(tin: str, req: FilingResumeReq) -> dict:
    """Resume a paused filing graph with the human's approval decision."""
    cfg = {"configurable": {"thread_id": req.thread_id}}
    # No pending step (unknown or already-finalized thread) → don't re-run from START.
    if not _FILING_GRAPH.get_state(cfg).next:
        raise HTTPException(status_code=404, detail="No filing awaiting approval for this thread_id")
    final = _FILING_GRAPH.invoke(Command(resume={"approved": req.approved}), cfg)
    return {"approved": final["approved"], "computation": final["computation"]}
