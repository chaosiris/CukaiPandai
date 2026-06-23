from __future__ import annotations

from pathlib import Path

from fastapi import Depends, FastAPI

from core.computation import compute_form_c
from core.lawcorpus import LawCorpus
from core.models import EntityTaxProfile, LineItem
from core.obligations import derive_obligations

from api.agents.audit_defense import build_defense
from api.llm import LLMClient, make_llm
from api.schemas import AuditDefenseReq, FormCReq, ObligationsReq

app = FastAPI(title="CukaiPandai API")
_CORPUS = LawCorpus.load(Path("core/fixtures/lawcorpus_seed.json"))


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
