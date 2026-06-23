from __future__ import annotations

import json
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from langgraph.types import Command
from pydantic import ValidationError

# Load .env (searches CWD upward, so it finds the repo-root .env when run from backend/).
# No-op if absent; tests inject FakeLLMClient and never need a real key.
load_dotenv()

from core.computation import compute_form_c
from core.lawcorpus import LawCorpus
from core.models import EntityTaxProfile, FormComputation, LineItem
from core.obligations import derive_obligations

from api.agents.audit_defense import build_defense
from api.agents.audit_risk import assess_risk
from api.connectors.msic import MsicClient
from api.graph import build_filing_graph
from api.llm import LLMClient, make_llm
from api.schemas import AuditDefenseReq, FilingResumeReq, FormCReq, ObligationsReq

app = FastAPI(title="CukaiPandai API")
_CORPUS = LawCorpus.load(Path("core/fixtures/lawcorpus_seed.json"))

# Single in-process HITL filing graph (MemorySaver persists paused state across the
# start→resume calls, keyed by thread_id). The graph's compute node is deterministic —
# it never calls the LLM — so no model client is constructed here.
# NOTE: MemorySaver is in-process and non-durable — paused threads are lost on restart and
# do not survive across multiple Uvicorn workers. Run a single worker on Render; swap to a
# durable checkpointer (SQLite/Postgres) for production beyond the demo.
_FILING_GRAPH = build_filing_graph(None)

# Shared MSIC client: data.gov.my caps at ~4 req/min, so reuse one instance (the catalogue is
# fetched once and cached) rather than re-downloading per request. Tests override get_msic.
_MSIC_CLIENT = MsicClient()


def get_llm() -> LLMClient:
    return make_llm()


def get_msic() -> MsicClient:
    return _MSIC_CLIENT  # shared/cached live client; overridden with a fixture client in tests


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
    flags = assess_risk(fc, profile, declared_income=profile.gross_income, myinvois_turnover=None)
    return {
        "computation": fc.model_dump(mode="json"),
        "requires_approval": True,
        "risk_flags": [f.model_dump() for f in flags],
    }


@app.post("/entities/{tin}/audit-defense")
def audit_defense(tin: str, req: AuditDefenseReq, llm: LLMClient = Depends(get_llm)) -> dict:
    try:
        pack = build_defense(req.query, [tuple(e) for e in req.evidence], llm, _CORPUS)
    except (json.JSONDecodeError, KeyError, TypeError, ValidationError) as e:
        # The model returned output that could not be parsed into the expected shape.
        raise HTTPException(status_code=502, detail=f"Model returned unparseable output: {e}") from e
    return pack.model_dump(mode="json")


@app.post("/entities/{tin}/filings/form-c/start")
def filing_start(tin: str, req: FormCReq) -> dict:
    """Run the filing graph until it pauses at the human-approval interrupt, surfacing the
    audit-risk flags the reviewer should weigh before approving."""
    profile = EntityTaxProfile(**req.ssm)
    thread_id = uuid.uuid4().hex
    cfg = {"configurable": {"thread_id": thread_id}}
    state = _FILING_GRAPH.invoke(
        {"profile_ssm": req.ssm, "line_items": req.line_items}, cfg
    )
    computation = state.get("computation")
    flags = assess_risk(
        FormComputation(**computation), profile,
        declared_income=profile.gross_income, myinvois_turnover=None,
    )
    return {
        "thread_id": thread_id,
        "computation": computation,
        "requires_approval": bool(state.get("__interrupt__")),
        "risk_flags": [f.model_dump() for f in flags],
    }


@app.get("/reference/msic/{code}")
def msic(code: str, client: MsicClient = Depends(get_msic)) -> dict:
    """Look up an MSIC activity code against the data.gov.my reference."""
    entry = client.lookup(code)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"MSIC code {code} not found")
    return entry


@app.post("/entities/{tin}/filings/form-c/resume")
def filing_resume(tin: str, req: FilingResumeReq) -> dict:
    """Resume a paused filing graph with the human's approval decision."""
    cfg = {"configurable": {"thread_id": req.thread_id}}
    # No pending step (unknown or already-finalized thread) → don't re-run from START.
    if not _FILING_GRAPH.get_state(cfg).next:
        raise HTTPException(status_code=404, detail="No filing awaiting approval for this thread_id")
    final = _FILING_GRAPH.invoke(Command(resume={"approved": req.approved}), cfg)
    return {"approved": final["approved"], "computation": final["computation"]}
