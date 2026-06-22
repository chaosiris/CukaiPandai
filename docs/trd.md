# CukaiPandai — Technical Requirements Document (TRD)

> The *how* for [project-idea.md](project-idea.md) + [prd.md](prd.md). Architecture, integrations, data model, AI/model layer, security, ownership, build plan. **⚠verify** = confirm against the cited official source before production. **Stack is LOCKED** (§12). **Team: Chaos (backend/agents) + Tuna (frontend/demo)** (§2.1).

---

## 1. Architecture overview
Three planes: **(1) Deterministic Core** (rules + computation + citation gate — source of truth, `core`, already built), **(2) Agentic Reasoning** (LLM agents that classify/reason/draft/plan), **(3) Integrations & Data**. Humans approve before anything leaves the system.

```
 Next.js UI ── Obligation Calendar · Cited Filing Studio · Audit-Defense console        [Tuna / Plan 3]
        │ (REST/SSE)
 FastAPI gateway ── auth, entity context, approval workflow, audit-log writer           [Chaos / Plan 2]
        │
 LangGraph Orchestrator (plan/act/decide, human-in-the-loop interrupts)                 [Chaos / Plan 2]
   ├─ Profiler agent ──────────► Integrations: SSM(mock), MyInvois(sandbox), MySST(mock), data.gov.my
   ├─ Document-understanding agent ─► Docling + vision model (BM/EN)
   ├─ Deductibility reasoner ─────► RAG over Law Corpus (§6)
   ├─ Audit-Risk agent ───────────► rules + anomaly checks + MyInvois cross-match
   ├─ Audit-Defense agent ────────► Evidence Vault + Law Corpus
   └─ Citation Verifier (LLM critic) ─► layered on the deterministic gate in `core`
        │                                    │
 DETERMINISTIC CORE  core: Obligation Rules Engine · Tax Computation Engine · Citation gate · Evidence Vault   [Chaos / Plan 1 ✅]
        │
 Data: SQLite (MVP) → Postgres+pgvector (prod) · local object store (docs)
 Model layer: LLMClient adapter ── OpenAI-compatible (ILMU Claw / Gemini)  ⇄  Anthropic (Claude)
```

## 2. Components

| Component | Type | Responsibility | Plan |
|---|---|---|---|
| **`core`** | Deterministic Py | Obligation Rules + Tax Computation engines, law corpus, citation grounding gate, Evidence Vault | 1 ✅ |
| **Orchestrator** | LangGraph graph | Decompose goal; route agents; enforce human-approval interrupts | 2 |
| **Profiler agent** | LLM + tools | Assemble Entity Tax Profile from SSM + MyInvois + MySST + uploads | 2 |
| **Document-understanding agent** | LLM (vision) + Docling | Parse/classify trial balance, receipts, invoices, EA forms, LHDN letters (BM/EN) | 2 |
| **Deductibility reasoner** | LLM + RAG | Assign tax treatment per line item; cite ITA/PR clause | 2 |
| **Audit-Risk agent** | rules + LLM | Trigger checks, MyInvois mismatch, ratio anomalies → score + fixes | 2 |
| **Audit-Defense agent** | LLM + RAG + tools | Interpret query → retrieve evidence → cited defense + exposure | 2 |
| **Citation Verifier (LLM critic)** | LLM + core gate | Confirm each cited clause supports the claim; block unsupported | 2 |
| **`LLMClient` adapter** | service | `chat(messages, tools)` over OpenAI-compatible (ILMU/Gemini) or Anthropic (Claude); provider via env | 2 |
| **FastAPI gateway** | API | Endpoints wrapping core+agents; approval workflow; SSE for live agent steps | 2 |
| **Frontend** | Next.js | Three consoles; built against the API contract | 3 |

### 2.1 Component ownership (Chaos / Tuna)
- **Chaos** — everything Python/agentic: `core` (done), Plan 2 (FastAPI, LangGraph, `LLMClient` adapter incl. ILMU sovereign mode, the 5 agents, RAG + LLM citation-critic, MyInvois sandbox connector, Audit-Defense).
- **Tuna** — Plan 3 (Next.js consoles), API wiring, UX, demo polish, the 7-min video + pitch-deck README.
- **Interface contract:** the **FastAPI endpoints (§7a)** are the boundary. Tuna develops against mocked responses matching those schemas so the two streams never block each other.

## 3. Determining obligations (engine spec — the core)
**Input — Entity Tax Profile** (Profiler): `{ entity_type, msic_codes[], paid_up_capital, gross_income, status, tin, sst_registered, employee_count, has_foreign_payments, related_party_txns, share_disposals, turnover (from MyInvois/financials), basis_period }`.

**Engine — deterministic rule table** (config-driven, YA-keyed; ⚠verify figures):
- company → Form C + CP204 (estimate ≥30 days before basis period; 3 months for new co; revisions 6th/9th month; monthly instalments).
- paid-up ≤ RM2.5m **and** gross ≤ RM50m → SME bands (15/17/24%); else 24%. ⚠verify.
- turnover ≥ e-invoice phase threshold (≥RM1m mandated 2026) → e-invoice.
- sst_registered → SST-02. · employee_count>0 → MTD/PCB + Form E/EA + EPF/SOCSO/EIS.
- foreign payments → WHT (CP37). · unlisted share disposals (from 2024) → CGT ⚠verify. · related-party > threshold → TP docs ⚠verify.

**Output — Obligation Calendar:** `[{obligation, form, due_date (holiday-shifted), est_amount, status, rule_id, config_version}]`. *(Implemented in `core/obligations.py`, `computation.py`, `deadlines.py`.)*

## 4. Integrations (data sources)
### 4.1 LHDN MyInvois API (primary transactional source)
Docs [sdk.myinvois.hasil.gov.my/api](https://sdk.myinvois.hasil.gov.my/) (SDK v1.0, 6 Apr 2024). **OAuth 2.0** (client credentials; TIN + NRIC/BRN); **sandbox (preprod) + prod**. Capabilities (⚠verify exact paths): submit documents, get document/details, document state/status, **search documents** (last 31 days — pull the ledger → turnover + evidence), validate TIN, reject/cancel. Payload ~55 fields incl. supplier/buyer TIN, classification codes, tax type & amount, totals. **Use:** derive turnover (→ phase/SME/SST thresholds), feed computation, seed Evidence Vault, cross-match for audit-risk. **Hackathon:** sandbox; mock with UBL-2.1 JSON fixtures if creds pending.
### 4.2 SSM ([e-Info](https://www.ssm-einfo.my/) / [MYDATA-SSM](https://mydata-ssm.my/)) — entity profile (type, MSIC, paid-up, status). Authorised CSD API; **mock/seed in MVP**.
### 4.3 RMCD [MySST](https://mysst.customs.gov.my/) — SST registration status (no rich API → customer-provided number / mock).
### 4.4 [developer.data.gov.my](https://developer.data.gov.my/) (`api.data.gov.my`, no auth, 4 req/min) — **reference only**: public-holiday calendar (deadline shift), MSIC reference, DOSM ratios (audit-risk baselines). *Not* a per-company obligation source.
> Per-company obligations are **derived** from §4.1–4.3 + uploads (see [research](superpowers/research/2026-06-19-tax-obligation-determination.md)).

## 5. Tax Computation Engine
Pure deterministic Python (`core/computation.py`); inputs = treated line items + profile; output = form fields + per-figure trace `{value, inputs[], rule_id, config_version}`. Rates/bands/thresholds = versioned YA config. **LLM never computes a final figure** — the "deterministic agentic AI" guarantee.

## 6. Law corpus, RAG & Citation Verifier
Corpus: ITA 1967, Public Rulings, DGIR guidelines, SST orders → stable clause IDs (`ITA-1967-s33(1)`). **MVP store:** SQLite + lightweight hybrid (keyword + embedding) retrieval over the curated subset; **prod:** pgvector. **Deductibility reasoner** cites clause IDs; **Citation Verifier** = the deterministic existence gate in `core/citations.py` **plus** an LLM critic (Plan 2) that confirms the clause supports the claim → unsupported is blocked (the demo's "rejects a fake citation" beat).

## 7. AI / model layer (locked)
- **Adapter `LLMClient`:** one interface `chat(messages, tools) -> ToolCalls|text`. Two implementations: **OpenAI-compatible** (via the `openai` SDK, configurable `base_url`/`api_key`/`model`) for **ILMU Claw (sovereign mode)** and **Gemini** (OpenAI-compat endpoint); and **Anthropic** for **Claude**. Provider chosen by env (`LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`).
- **Default (dev):** Claude (deep reasoning: deductibility, audit-query interpretation, defense drafting, citation critic). **Sovereign mode:** flip env to ILMU Claw → all inference in-country (PDPA). Gemini optional.
- **Why:** clean abstraction (Technical), residency (Market Adoption), sovereignty-aware (Innovation), explainable/controllable (Responsible AI). **Caveat:** ILMU limited seats/smaller models → Claude is the capability backstop; the adapter makes the swap one env change.

### 7a. API contract (the Chaos↔Tuna boundary — exact shapes in Plan 2)
`POST /entities` (onboard → profile) · `GET /entities/{tin}/obligations` (calendar) · `POST /entities/{tin}/filings/form-c` (compute → cited FormComputation) · `POST /entities/{tin}/audit-risk` (flags) · `POST /entities/{tin}/audit-defense` (query → DefensePack) · `GET /entities/{tin}/evidence` · all mutating routes return a `requires_approval` step before commit. SSE `/runs/{id}/stream` for live agent steps.

## 8. Data model (core tables)
`entities` · `obligation_profiles` · `obligations` · `documents` · `transactions` · `computations` (per-figure trace) · `citations` (clause_id + verified) · `audit_cases` · `audit_log` (append-only) · `evidence_links` (figure↔doc↔clause). **MVP:** SQLite (Evidence Vault already SQLite in `core/evidence.py`). **Prod:** Postgres + pgvector.

## 9. Security, privacy & compliance
PDPA: encrypt PII at rest + TLS; least-privilege; retention policy. **Residency:** sovereign mode keeps inference + data in Malaysia (ILMU + MY region). Secrets (MyInvois OAuth, model keys) in env/secrets manager, never in code. Immutable `audit_log` (payload hashes). **Human-in-the-loop hard gate** before any submit/export; no auto-filing of statutory returns.

## 10. Non-functional requirements
Latency: audit-query → pack <15s; Form C <60s (seeded). Reliability: deterministic seeded scenarios; graceful fallback to upload/mock if a gov source is down. Observability: tracing on agent runs; per-step logs. Testability: golden-file (computation), table-driven (obligations), planted-fake-citation (verifier).

## 11. Build plan (mapped to plans + owners)
- **Plan 1 — Deterministic Core** ✅ *done* (Chaos): 10 TDD tasks, 19 tests green, committed/pushed.
- **Plan 2 — Agent layer + API** (Chaos, Wk 2–3): `LLMClient` adapter → agents (profiler, doc-understanding, deductibility, audit-risk, **audit-defense**) on LangGraph → LLM citation-critic on the core gate → FastAPI endpoints (§7a) → MyInvois sandbox connector. TDD: mock the model in tests; assert agent decisions + endpoint contracts.
- **Plan 3 — Frontend** (Tuna, Wk 2–4, parallel on mocked API): Obligation Calendar, Cited Filing Studio (approval inbox), Audit-Defense console; styling absorbs the user's visual reference images when provided.
- **Wk 4 (both):** integration, deterministic demo scenarios, 7-min video + pitch-deck README, Docker deploy. Buffer for **⚠verify** of tax figures.
- **Discipline:** corporate income tax + audit-defense first; SST/MTD/WHT are config extensions, not new architecture.

## 12. Tech stack (LOCKED)
- **Core:** Python 3.11 · Pydantic v2 · PyYAML · pytest (built).
- **Backend/API:** **FastAPI** (Py 3.11) · **LangGraph** (orchestration + human-in-the-loop interrupts) · SSE for live steps.
- **Model layer:** **`openai` SDK** (OpenAI-compatible → ILMU Claw sovereign mode / Gemini) **+ `anthropic` SDK** (Claude), behind the `LLMClient` adapter; provider via env.
- **RAG:** SQLite + lightweight hybrid retrieval (MVP) → **pgvector** (prod).
- **Data:** **SQLite** (MVP) → **Postgres + pgvector** (prod); local object store for docs.
- **Docs/OCR:** **Docling** (structured PDFs) + a vision model via the adapter (receipts/letters).
- **Frontend:** **Next.js** (App Router) + React + **Tailwind** + **shadcn/ui** + Lucide.
- **Infra/tooling:** **Docker** (deployable to a Malaysian region / ILMU for sovereignty; localhost OK for the hackathon) · venv/pip · ruff (optional) · tracing (LangSmith optional).
> Rationale: ILMU Claw is OpenAI-compatible, so the adapter makes ILMU/Claude/Gemini swappable by env — maximises the sovereignty story and avoids GCP/ADK lock-in; lean for a 2-dev team; the deterministic core stays model/stack-independent.

## 13. Limitations & verification checklist
- **⚠verify before prod/deck:** all tax rates/bands/thresholds/deadlines (LHDN); SST scope/rates (RMCD); e-invoice phases/exemptions (re-confirm); CGT/TP thresholds; exact **MyInvois API** paths + payload (sdk.myinvois.hasil.gov.my/api); SSM CSD fields; MySST lookup.
- **No public return-filing API** → prepare-and-cite for MyTax; auto-submit e-invoices only.
- **SSM/MySST mocked** in MVP → prod needs CSD plan + customer SST numbers.
- **Audit-defense = decision-support**, human-approved; not legal advice.

---
*Inception complete: [project-idea.md](project-idea.md) → [prd.md](prd.md) → [trd.md](trd.md). Design: [superpowers/specs/2026-06-19-cukaipandai-design.md](superpowers/specs/2026-06-19-cukaipandai-design.md) · Research: [superpowers/research/2026-06-19-tax-obligation-determination.md](superpowers/research/2026-06-19-tax-obligation-determination.md) · Plans: [superpowers/plans/](superpowers/plans/) · Prior analysis: [initial-analysis/](initial-analysis/).*
