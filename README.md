# CukaiPandai — *smart tax, audit-ready*

> **Agentic, audit-defense-first tax assurance for Malaysian enterprises.** It derives each entity's tax obligations, prepares filings where **every figure is cited to its source document + the Income Tax Act / Public-Ruling clause that justifies it**, flags audit risk before you file, and — when LHDN audits — **auto-assembles the cited defense pack**.
>
> **NexHack 2026 · Track 1 — Agentic AI for Internal Enterprise Operations** · Sponsor/host: Xenber Sdn. Bhd.

---

## The problem

Malaysia's tax system is digitalising fast (mandatory **MyInvois** e-invoicing, expanded **SST**, new **CGT**), which means enterprises must file **more, more accurately, with a permanent audit trail** — while LHDN's audit posture sharpens (penalties under **ITA 1967 s.112/s.113**). The tooling hasn't kept up:

- **LHDN MyTax** — free, but a dumb form: no document understanding, no obligation discovery, no audit defense.
- **Accounting tax modules** (SQL/AutoCount/Xero) — compute from the books; stop there.
- **Human tax agents** — do it all manually and expensively.
- **Global AI tax tools** (TaxGPT, Blue J) — US tax research, not Malaysian filing + LHDN audit defense.

**The open lane:** a Malaysian, agentic, **audit-defense-first** layer where defensibility is built in.

## Who it's for
**Licensed tax agents (s.153)** — one platform across many client entities (primary channel) — plus **SME/group finance teams** (controllers, group tax managers).

## What it does
1. **Obligation Radar** — derives the entity's obligations (income tax, e-invoice phase, SST, employer/MTD…) + a deadline calendar.
2. **Cited Filing Studio** — computes **Form C / CP204** with **every figure → source doc + ITA/PR clause**.
3. **Audit-Risk Pre-Flight** — flags LHDN audit triggers (e.g. turnover mismatch vs MyInvois) before you file.
4. **Audit-Defense Agent (the hero)** — paste an LHDN query → cited defense pack + penalty exposure (s.112/113).
5. **Evidence Vault + Citation Verifier** — append-only audit trail; a deterministic gate **+ LLM critic** that blocks any unsupported citation.

## How it works — deterministic core + agents + human-in-the-loop
```
 Next.js consoles  ──►  FastAPI  ──►  LangGraph agents (profiler · documents · deductibility ·
                                       audit-risk · audit-defense · citation-critic)
                                            │
        DETERMINISTIC CORE (no LLM): Obligation Rules Engine · Tax Computation Engine ·
        Citation gate · Evidence Vault          ← tax math/obligations are versioned config
                                            │
        Model adapter: ILMU Claw (sovereign) ⇄ Claude ⇄ Gemini   ·   human approves before any submit
```
**The guarantee (JurisTech's "deterministic agentic AI"):** the LLM never computes a tax figure or asserts an unverified citation — the deterministic core computes & gates, the critic verifies citations, and a human approves before anything is filed/sent.

## The hard part we solved: "what does each enterprise owe?"
There is **no government API that returns a company's obligations** — they must be **derived**. CukaiPandai assembles an Entity Tax Profile from **SSM** (entity type + MSIC + paid-up capital, via CTOS/Infomina or the SSM CSD API) + **MyInvois** (transactions → turnover + evidence) + **MySST** (registration) + the firm's own data, then runs a deterministic **Obligation Rules Engine**. Full deep-dive + citations: [`docs/superpowers/research/2026-06-19-obligation-retrieval-deep-dive.md`](docs/superpowers/research/2026-06-19-obligation-retrieval-deep-dive.md).

## Responsible & sovereign AI
Deterministic tax math (never model-guessed) · every output cited to source + law · independent **citation verifier** · **human-approval gate** before filing · immutable audit log · **ILMU Claw "sovereign mode"** keeps inference + data **in Malaysia (PDPA)** — one env-var swap, because the model layer is OpenAI-compatible.

## Tech stack
Python 3.11 · **FastAPI** · **LangGraph** (human-in-the-loop interrupts) · `LLMClient` adapter — `openai` SDK (→ **ILMU Claw** / Gemini) + `anthropic` (Claude), provider via env · **SQLite → Postgres/pgvector** · Docling · **Next.js + Tailwind + shadcn/ui** · Docker. *(Tax figures are versioned config keyed to Year of Assessment.)*

## Business case
- **Pricing:** tax-agent firm tier (per-firm + per-entity, **RM200–800/mo + per-client**, audit-defense as a premium module); SME/enterprise direct **RM1,500–4,000/mo**; per-audit-defense premium.
- **GTM:** land via tax-agent firms (channel multiplier) on the **audit-defense pain**, expand into the full compliance calendar; **sovereign mode** unlocks regulated/GLC buyers.
- **Adoption roadmap:** shadow mode → cited filing prep → autonomous audit-defense drafting (human-approved throughout).
- Aligns with **Xenber's** enterprise/fintech line (their *XEN Risk & Credit AI Engine*) — built to be adopted, not just demoed.

## Status
- ✅ **Deterministic core** (`core/`) — obligation + computation engines, law corpus, citation gate, evidence vault. **TDD.**
- ✅ **Agentic API** (`api/`) — 5 agents + LLM citation-critic + FastAPI endpoints + LangGraph orchestrator (HITL). **TDD.**
- ✅ **YA2026 tax figures verified** vs LHDN/RMCD (cited).
- ⏳ **Frontend** (Next.js consoles) — planned ([`docs/superpowers/plans/2026-06-19-frontend.md`](docs/superpowers/plans/2026-06-19-frontend.md)).
- **36 automated tests passing.**

## Quickstart
```bash
python -m venv .venv && . .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -e .
pytest -q                                          # 36 passing
uvicorn api.main:app --reload                      # http://localhost:8000/docs
# Sovereign mode: set LLM_PROVIDER=openai, LLM_BASE_URL/key/model to ILMU Claw
```
Or: `docker compose up` (see [`docs/runbook.md`](docs/runbook.md)).

## Docs
- Inception: [`docs/project-idea.md`](docs/project-idea.md) · [`docs/prd.md`](docs/prd.md) · [`docs/trd.md`](docs/trd.md)
- Design + plans: [`docs/superpowers/specs/`](docs/superpowers/specs/) · [`docs/superpowers/plans/`](docs/superpowers/plans/)
- Research (cited): [`docs/superpowers/research/`](docs/superpowers/research/)
- Run / demo / final-day: [`docs/runbook.md`](docs/runbook.md) · Roadmap: [`docs/roadmap.md`](docs/roadmap.md)

## Team
**Chaos** (backend / agents) · **Tuna** (frontend / demo).

---
*Built for NexHack 2026. Demo video: ▶️ (link to be added). Responsible-AI: every figure cited, every audit defensible.*
