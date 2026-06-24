from __future__ import annotations

import json
import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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
from api.agents.documents import classify_line_items
from api.connectors.msic import MsicClient
from api.graph import build_filing_graph
from api.llm import LLMClient, make_llm
from api.schemas import (
    AuditDefenseReq,
    ClassifyReq,
    FilingResumeReq,
    FormCReq,
    ObligationsReq,
)

app = FastAPI(title="CukaiPandai API")

# CORS (BE-7) — the Vite dev server (:5173) and the deployed Vercel origin are cross-origin to
# the API, so a browser is blocked without this. Origins are env-configurable for deploy.
_CORS_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")).split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

_CORPUS = LawCorpus.load(Path("core/fixtures/lawcorpus_seed.json"))

# Seeded entity profiles, keyed by TIN (BE-8; BE-17 later moves this behind a Neon repository
# with this fixture as the fallback). Extend with FE-8 personas as more fixtures land.
_ENTITIES: dict[str, dict] = {
    e["tin"]: e
    for e in [json.loads(Path("core/fixtures/entity_acme.json").read_text(encoding="utf-8"))]
}

# Single in-process HITL filing graph (MemorySaver persists paused state across the
# start→resume calls, keyed by thread_id). The graph's compute node is deterministic —
# it never calls the LLM — so no model client is constructed here.
# NOTE: MemorySaver is in-process and non-durable — paused threads are lost on restart and
# do not survive across multiple Uvicorn workers. Run a single worker on Render; made durable
# via the Neon Postgres checkpointer in BE-15.
_FILING_GRAPH = build_filing_graph(None)

# Shared MSIC client: data.gov.my caps at ~4 req/min, so reuse one instance (the catalogue is
# fetched once and cached) rather than re-downloading per request. Tests override get_msic.
_MSIC_CLIENT = MsicClient()

_PARSE_ERRORS = (json.JSONDecodeError, KeyError, TypeError, ValidationError)


def get_llm() -> LLMClient:
    return make_llm()


def get_msic() -> MsicClient:
    return _MSIC_CLIENT  # shared/cached live client; overridden with a fixture client in tests


def _profile(ssm: dict) -> EntityTaxProfile:
    """Validate an SSM dict at the boundary → 422 with field detail (BE-10) instead of a 500."""
    try:
        return EntityTaxProfile(**ssm)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors()) from e


def _line_items(line_items: list[dict]) -> list[LineItem]:
    try:
        return [LineItem(**li) for li in line_items]
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors()) from e


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/entities/{tin}")
def get_entity(tin: str) -> dict:
    """Serve a seeded entity profile so the FE can render onboarding + the calendar header (BE-8)."""
    data = _ENTITIES.get(tin)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Entity {tin} not found")
    return EntityTaxProfile(**data).model_dump(mode="json")


@app.post("/entities/{tin}/obligations")
def obligations(tin: str, req: ObligationsReq) -> dict:
    return derive_obligations(_profile(req.ssm), 2026).model_dump(mode="json")


@app.post("/entities/{tin}/filings/form-c")
def form_c(tin: str, req: FormCReq) -> dict:
    profile = _profile(req.ssm)
    fc = compute_form_c(profile, _line_items(req.line_items), 2026)
    flags = assess_risk(fc, profile, declared_income=profile.gross_income, myinvois_turnover=None)
    return {
        "computation": fc.model_dump(mode="json"),
        "requires_approval": True,
        "risk_flags": [f.model_dump() for f in flags],
    }


@app.post("/entities/{tin}/documents/classify")
def classify(tin: str, req: ClassifyReq, llm: LLMClient = Depends(get_llm)) -> dict:
    """Classify raw trial-balance text into LineItem[] (BE-9; resolves Q7)."""
    try:
        items = classify_line_items(req.raw_text, llm)
    except _PARSE_ERRORS as e:
        raise HTTPException(status_code=502, detail=f"Model returned unparseable output: {e}") from e
    return {"line_items": [i.model_dump(mode="json") for i in items], **llm.route_info()}


@app.post("/entities/{tin}/audit-defense")
def audit_defense(tin: str, req: AuditDefenseReq, llm: LLMClient = Depends(get_llm)) -> dict:
    try:
        pack = build_defense(req.query, [tuple(e) for e in req.evidence], llm, _CORPUS)
    except _PARSE_ERRORS as e:
        raise HTTPException(status_code=502, detail=f"Model returned unparseable output: {e}") from e
    return {**pack.model_dump(mode="json"), **llm.route_info()}


@app.post("/entities/{tin}/filings/form-c/start")
def filing_start(tin: str, req: FormCReq) -> dict:
    """Run the filing graph until it pauses at the human-approval interrupt, surfacing the
    audit-risk flags the reviewer should weigh before approving."""
    profile = _profile(req.ssm)
    _line_items(req.line_items)  # validate at the boundary (422 on bad input) before the graph runs
    thread_id = uuid.uuid4().hex
    cfg = {"configurable": {"thread_id": thread_id}}
    state = _FILING_GRAPH.invoke({"profile_ssm": req.ssm, "line_items": req.line_items}, cfg)
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


@app.post("/entities/{tin}/filings/form-c/resume")
def filing_resume(tin: str, req: FilingResumeReq) -> dict:
    """Resume a paused filing graph with the human's approval decision."""
    cfg = {"configurable": {"thread_id": req.thread_id}}
    # No pending step (unknown or already-finalized thread) → don't re-run from START.
    if not _FILING_GRAPH.get_state(cfg).next:
        raise HTTPException(status_code=404, detail="No filing awaiting approval for this thread_id")
    final = _FILING_GRAPH.invoke(Command(resume={"approved": req.approved}), cfg)
    return {"approved": final["approved"], "computation": final["computation"]}


@app.get("/reference/msic/{code}")
def msic(code: str, client: MsicClient = Depends(get_msic)) -> dict:
    """Look up an MSIC activity code against the data.gov.my reference."""
    entry = client.lookup(code)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"MSIC code {code} not found")
    return entry
