# CLAUDE.md

> **Read `docs/roles.md` first** — it defines your role, boundaries, and the gates in this project's PM-orchestrated workflow.

---

## Project

**CukaiPandai** — sovereign, citation-grounded AI tax-assurance for Malaysian SMEs (obligation calendar · cited Form C filing · audit-defense).

Every figure is traceable to a verified YA2026 source; fabricated citations are rejected by a verifier gate. The deterministic core is authoritative; the agent layer orchestrates but never invents numbers or law.

---

## Architecture

See `docs/trd.md` (canonical) and `docs/cukaipandai-spec.md` (design). Do not create `docs/architecture.md`.

Two layers: a **deterministic core** (`core/`) that owns all tax math, deadlines, citations and law-corpus lookups, and an **agentic API** (`api/`) that wraps it — 6 agents + a LangGraph filing graph with a HITL `interrupt`, exposed over FastAPI. The LLM is routed **ILMU-first** (sovereign `nemo-super`) with **Claude** as failover/escalation.

### Repo layout

```
core/        # deterministic engines: obligations, computation, deadlines, citations, lawcorpus, config_loader, models
api/         # graph.py (LangGraph + HITL), main.py (FastAPI), schemas.py, llm.py (LLMClient adapter)
tests/       # pytest suite (incl. offline e2e pipeline)
docs/        # roles, plan, progress, test, prd, trd, cukaipandai-spec, runbook
frontend/    # [planned] Vite + React + TS console (FE lane)
pyproject.toml · Dockerfile · docker-compose.yml · .env.example
```

---

## Tech Stack

- **Backend:** Python ≥3.11 · Pydantic 2 · FastAPI + Uvicorn · LangGraph · httpx · `openai`/`anthropic` SDKs. Deploy → **Render** (Docker image is deploy-ready).
- **Frontend (planned):** Vite 5 + React 18 + TS + React Router 7 + token-CSS, reusing the ProofRank devkit design system; Bun. Deploy → **Vercel**.
- **LLM routing:** ILMU `nemo-super` primary (sovereign) → Claude failover/escalation.
- **Connectors:** MyInvois → full fixture; data.gov.my MSIC is the only live external call (spec §10).

---

## Commands

```bash
# install (editable core + dev deps)
pip install -e ".[dev]"

# run the API (dev)
uvicorn api.main:app --reload

# tests
pytest

# docker
docker compose up --build
```

---

## Code Style

- **Naming:** snake_case for Python; descriptive module-level names matching `core/`/`api/` convention.
- **Types:** Pydantic at all system boundaries; no untyped dicts crossing the core↔api seam. The deterministic core stays pure (no LLM calls).
- **Error handling:** Validate at system boundaries; do not wrap internal framework calls in try/catch.
- **Comments:** Default to none. Comment only when the _why_ is non-obvious. Never describe _what_ the code does.
- **Changes are surgical:** touch only what the task requires; match existing style; don't refactor what isn't broken.

---

## Working Conventions

- **CLI-first.** Configure via CLI tools over GUI where possible.
- **Commit gate.** Agents may create commits and push **only after explicitly asking the human and receiving approval at Gate 2** — never unprompted, never `--force`.
- **Log progress.** After each task, PG appends a dated entry to `docs/progress.md` and ticks `docs/plan.md`.
- **No secrets in repo.** `.env.example` committed, `.env` gitignored.
- **Citation discipline.** Never introduce a tax figure, rate, threshold, or legal reference without a verified source; the citation verifier must be able to reject fabrications.

---

## Critical Do-Nots

- **Do not** `git push --force`, rewrite published history, or delete branches.
- **Do not** commit or push without explicitly asking the human and getting approval at Gate 2.
- **Do not** create `docs/architecture.md` — architecture lives in `docs/trd.md`.
- **Do not** let the agent layer compute tax figures or invent citations — that is the deterministic core's job (`core/`).

---

## Agent Workflow & Documentation Protocol

This project runs the **PM → PL → PG → QA** pipeline defined in `docs/roles.md`, with two human gates:

1. **PL** writes `docs/plan.md` (after brainstorming).
2. **Gate 1** — PM shows the plan + open questions to the human for approval.
3. **PG** implements the approved tasks; ticks `docs/plan.md`, logs `docs/progress.md`.
4. **QA** reviews the diff into `docs/test.md` with a verdict.
5. **Gate 2** — PM relays the verdict. Reject → back to PG. Approve → PM proposes a Conventional Commit message and asks the human to authorize commit + push.

Reference `docs/prd.md` (requirements) and `docs/trd.md` (architecture/contracts) when they exist. `plan.md`/`progress.md` are shared across the team and organized by the three lanes — **BE** (backend) · **FE** (frontend) · **TD** (testing & docs).

---

## Re-Read Discipline

Start every session by reading, in order: `docs/roles.md` → tail of `docs/progress.md` → `docs/plan.md` (open tasks) → `docs/prd.md`/`docs/trd.md` only when touching the matching domain. Do not rely on memory from prior sessions.

---

## Git Commit Convention

[Conventional Commits](https://www.conventionalcommits.org/): `<type>[scope]: <description>` — single imperative sentence, no trailing period. Allowed types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`. The PM proposes the message at Gate 2; the human authorizes the commit.
