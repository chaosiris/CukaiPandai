from __future__ import annotations

import json
import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
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

from api import auth
from api.agents.audit_defense import build_defense
from api.agents.audit_risk import assess_risk
from api.agents.documents import classify_line_items
from api.connectors.msic import MsicClient
from api.graph import build_filing_graph
from api.llm import LLMClient, make_llm
from api.persistence import EntityRepository, FilingRepository, UserEntityRepository, UserRepository, make_checkpointer
from api.schemas import (
    AuditDefenseReq,
    ClassifyReq,
    EntityCreateReq,
    FilingRecordReq,
    FilingResumeReq,
    FormCReq,
    GoogleAuthReq,
    LoginReq,
    MultiDeleteReq,
    ObligationsReq,
    SignupReq,
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
# with this fixture as the fallback). FE-8 personas: Acme + Sinar + Selera.
_ENTITIES: dict[str, dict] = {
    e["tin"]: e
    for e in [
        json.loads(Path("core/fixtures/entity_acme.json").read_text(encoding="utf-8")),
        json.loads(Path("core/fixtures/entity_sinar.json").read_text(encoding="utf-8")),
        json.loads(Path("core/fixtures/entity_selera.json").read_text(encoding="utf-8")),
    ]
}
# BE-17: reads from Neon when DATABASE_URL is set, else from the fixtures above (fallback).
_ENTITY_REPO = EntityRepository(_ENTITIES)

# Auth users — Neon `users` table when DATABASE_URL is set, else a process-level in-memory store
# (fallback-first, like the repos above). Holds password hashes only.
_USER_REPO = UserRepository()

# EP-0 — shared guest identity (single account; all guests share one JWT sub).
# Data written under this sub is shared/public across all guest sessions by design.
GUEST_USER_ID = "guest-shared"
GUEST_EMAIL = "guest@cukaipandai.local"
GUEST_NAME = "Guest"
_USER_REPO.ensure_guest(GUEST_USER_ID, GUEST_EMAIL, GUEST_NAME)

# EP-1 — per-user entity profiles (keyed by JWT sub; Neon when DATABASE_URL set, else in-memory).
_USER_ENTITY_REPO = UserEntityRepository()

# EP-2 — per-user filing records (keyed by JWT sub; fallback-first).
_FILING_REPO = FilingRepository()

# Single in-process HITL filing graph. The compute node is deterministic (no LLM), so no model
# client is constructed here. BE-15: a durable Neon Postgres checkpointer is used when
# DATABASE_URL is set; otherwise this falls back to an in-process MemorySaver (single Uvicorn
# worker; paused threads non-durable across restart — acceptable for the demo, durable with Neon).
_FILING_GRAPH = build_filing_graph(None, checkpointer=make_checkpointer())

# Shared MSIC client: data.gov.my caps at ~4 req/min, so reuse one instance (the catalogue is
# fetched once and cached) rather than re-downloading per request. Tests override get_msic.
_MSIC_CLIENT = MsicClient()

_PARSE_ERRORS = (json.JSONDecodeError, KeyError, TypeError, ValidationError)


def get_llm() -> LLMClient:
    return make_llm()


def get_msic() -> MsicClient:
    return _MSIC_CLIENT  # shared/cached live client; overridden with a fixture client in tests


def _validation_detail(e: ValidationError) -> list[dict]:
    """JSON-safe error list. include_context=False drops the raised exception object that
    custom validators put in `ctx` (a ValueError isn't JSON-serializable, which would 500
    the response); include_url=False keeps the envelope to the loc/msg/type the FE expects."""
    return e.errors(include_url=False, include_context=False)


def _profile(ssm: dict) -> EntityTaxProfile:
    """Validate an SSM dict at the boundary → 422 with field detail (BE-10) instead of a 500."""
    try:
        return EntityTaxProfile(**ssm)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=_validation_detail(e)) from e


def _line_items(line_items: list[dict]) -> list[LineItem]:
    try:
        return [LineItem(**li) for li in line_items]
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=_validation_detail(e)) from e


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


# --- Auth (real backend: hashed passwords + signed JWT + Google SSO; users in Neon w/ fallback) ---

def _public_user(user: dict) -> dict:
    """The user fields safe to return to the client — never the password hash."""
    return {"id": user["id"], "email": user["email"], "name": user.get("name"), "provider": user.get("provider", "password")}


def _bearer_user(authorization: str | None) -> dict:
    """Resolve the current user from an `Authorization: Bearer <jwt>` header, or 401."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    claims = auth.decode_token(authorization.split(" ", 1)[1].strip())
    if claims is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = _USER_REPO.get_by_email(claims.get("email", ""))
    if user is None:
        raise HTTPException(status_code=401, detail="Unknown user")
    return user


def _auth_response(user: dict) -> dict:
    return {"token": auth.create_token(user["id"], user["email"], user.get("name") or ""), "user": _public_user(user)}


@app.post("/auth/signup")
def signup(req: SignupReq) -> dict:
    email = req.email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1] or len(req.password) < 8:
        raise HTTPException(status_code=422, detail="Valid email and a password of at least 8 characters are required")
    if _USER_REPO.get_by_email(email) is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    name = (req.name or email.split("@")[0]).strip()
    user = _USER_REPO.create(email, name, auth.hash_password(req.password), provider="password")
    return _auth_response(user)


@app.post("/auth/login")
def login(req: LoginReq) -> dict:
    user = _USER_REPO.get_by_email(req.email.strip().lower())
    if user is None or not user.get("password_hash") or not auth.verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return _auth_response(user)


@app.post("/auth/google")
def google_auth(req: GoogleAuthReq) -> dict:
    if not auth.google_configured():
        raise HTTPException(status_code=503, detail="Google SSO is not configured on this server")
    info = auth.verify_google_id_token(req.id_token)
    if info is None:
        raise HTTPException(status_code=401, detail="Invalid Google credential")
    user = _USER_REPO.upsert_oauth(info["email"].lower(), info["name"], provider="google")
    return _auth_response(user)


@app.get("/auth/me")
def me(authorization: str | None = Header(default=None)) -> dict:
    return _public_user(_bearer_user(authorization))


@app.post("/auth/guest")
def guest_auth() -> dict:
    """EP-0 — Issue a JWT for the single shared guest identity. No password required.
    All guests share one sub; guest-owned data is shared/public across sessions by design."""
    user = _USER_REPO.get_by_email(GUEST_EMAIL)
    if user is None:
        # Re-seed defensively (should not happen, but ensures the endpoint never 500s)
        user = _USER_REPO.ensure_guest(GUEST_USER_ID, GUEST_EMAIL, GUEST_NAME)
    token = auth.create_token(GUEST_USER_ID, GUEST_EMAIL, GUEST_NAME)
    return {"token": token, "user": _public_user(user)}


def _owner(authorization: str | None = Header(default=None)) -> str:
    """Resolve the JWT `sub` from the Bearer token; 401 without a valid token."""
    user = _bearer_user(authorization)
    claims = auth.decode_token(authorization.split(" ", 1)[1].strip())  # type: ignore[union-attr]
    sub = claims.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="invalid token")
    return sub


@app.get("/me/entity")
def get_my_entity(owner: str = Depends(_owner)) -> dict:
    """EP-1 — Return the owner's saved EntityTaxProfile; 404 if none saved yet."""
    data = _USER_ENTITY_REPO.get(owner)
    if data is None:
        raise HTTPException(status_code=404, detail="No entity profile saved yet")
    return data


@app.put("/me/entity")
def put_my_entity(req: EntityCreateReq, owner: str = Depends(_owner)) -> dict:
    """EP-1 — Validate and upsert the owner's EntityTaxProfile. 422 on bad ssm."""
    profile = _profile(req.ssm)
    data = profile.model_dump(mode="json")
    _USER_ENTITY_REPO.put(owner, data)
    return data


@app.post("/me/filings")
def create_my_filing(req: FilingRecordReq, owner: str = Depends(_owner)) -> dict:
    """EP-2 — Save a filing record for the owner; returns the record with its server-assigned id."""
    rec = _FILING_REPO.create(owner, req.model_dump(mode="json"))
    return rec


@app.get("/me/filings")
def list_my_filings(owner: str = Depends(_owner)) -> list:
    """EP-2 — List the owner's filing records, newest first."""
    return _FILING_REPO.list(owner)


@app.get("/me/filings/{rec_id}")
def get_my_filing(rec_id: str, owner: str = Depends(_owner)) -> dict:
    """EP-2 — Return one filing record; 404 if not owned or absent."""
    rec = _FILING_REPO.get(owner, rec_id)
    if rec is None:
        raise HTTPException(status_code=404, detail="Filing record not found")
    return rec


@app.delete("/me/filings/{rec_id}")
def delete_my_filing(rec_id: str, owner: str = Depends(_owner)) -> dict:
    """EP-2 — Delete one filing record; 404 if not owned or absent."""
    rec = _FILING_REPO.get(owner, rec_id)
    if rec is None:
        raise HTTPException(status_code=404, detail="Filing record not found")
    _FILING_REPO.delete(owner, [rec_id])
    return {"deleted": rec_id}


@app.delete("/me/filings")
def multi_delete_my_filings(req: MultiDeleteReq, owner: str = Depends(_owner)) -> dict:
    """EP-2 — Delete multiple filing records by id. Foreign/unknown ids are silently skipped."""
    _FILING_REPO.delete(owner, req.ids)
    return {"deleted": req.ids}


@app.post("/entities")
def create_entity(req: EntityCreateReq) -> dict:
    """BE-J1 — Create (or update) a custom entity. Validates the ssm body → EntityTaxProfile;
    persists via EntityRepository.create() (Neon when available, in-memory always); returns the
    normalised profile. 422 on bad input; upsert-safe on duplicate TIN."""
    profile = _profile(req.ssm)
    data = profile.model_dump(mode="json")
    _ENTITY_REPO.create(data)
    return data


@app.get("/entities/{tin}")
def get_entity(tin: str) -> dict:
    """Serve an entity profile so the FE can render onboarding + the calendar header (BE-8;
    BE-17: from Neon when configured, else fixtures)."""
    data = _ENTITY_REPO.get(tin)
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


def _extract_text(filename: str, content: bytes) -> str:
    """Extract plain text from CSV, XLSX, or PDF bytes. Raises HTTPException on unsupported/empty."""
    import csv
    import io

    name_lower = filename.lower()
    if name_lower.endswith(".csv"):
        text = content.decode("utf-8", errors="replace")
        reader = csv.reader(io.StringIO(text))
        rows = ["\t".join(row) for row in reader]
        return "\n".join(rows)
    elif name_lower.endswith(".xlsx"):
        import openpyxl

        wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
        lines: list[str] = []
        for ws in wb.worksheets:
            for row in ws.iter_rows(values_only=True):
                lines.append("\t".join("" if v is None else str(v) for v in row))
        wb.close()
        return "\n".join(lines)
    elif name_lower.endswith(".pdf"):
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(content))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages)
    else:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {filename!r}. Accepted: csv, xlsx, pdf")


@app.post("/entities/{tin}/documents/upload")
def upload_document(tin: str, file: UploadFile = File(...), llm: LLMClient = Depends(get_llm)) -> dict:
    """BE-J2 — multipart upload: extract text from CSV/XLSX/PDF → classify_line_items → ClassifyResponse."""
    content = file.file.read()
    if not content:
        raise HTTPException(status_code=422, detail="Uploaded file is empty")
    raw_text = _extract_text(file.filename or "", content)
    try:
        items = classify_line_items(raw_text, llm)
    except _PARSE_ERRORS as e:
        raise HTTPException(status_code=502, detail=f"Model returned unparseable output: {e}") from e
    return {"line_items": [i.model_dump(mode="json") for i in items], **llm.route_info()}


@app.post("/entities/{tin}/audit-defense")
def audit_defense(tin: str, req: AuditDefenseReq, llm: LLMClient = Depends(get_llm)) -> dict:
    try:
        pack = build_defense(req.query, [tuple(e) for e in req.evidence], llm, _CORPUS, inject_fabricated=req.inject_fabricated)
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
