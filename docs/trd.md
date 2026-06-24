# CukaiPandai — Technical Requirements Document (TRD)

> The _how_ for [cukaipandai-spec.md](cukaipandai-spec.md) + [prd.md](prd.md). Architecture, integrations, data model, AI/model layer, security, ownership, build plan. **⚠verify** = confirm against the cited official source before production. **Stack is LOCKED** (§12). **Team of 3: Chaos (backend/agents) + Tuna (frontend/demo) + a product/tax-verify contributor** (§2.1).

---

## 1. Architecture overview

Three planes: **(1) Deterministic Core** (rules + computation + citation gate — source of truth, `core`, already built), **(2) Agentic Reasoning** (LLM agents that classify/reason/draft/plan), **(3) Integrations & Data**. Humans approve before anything leaves the system.

```
 Vite/React UI ── Obligation Calendar · Cited Filing Studio · Audit-Defense console      [Tuna / Plan 3]
        │ (REST/SSE)
 FastAPI gateway ── auth, entity context, approval workflow, audit-log writer           [Chaos / Plan 2]
        │
 LangGraph Orchestrator (plan/act/decide, human-in-the-loop interrupts)                 [Chaos / Plan 2]
   ├─ Profiler agent ──────────► Integrations: SSM(mock), MyInvois(full fixture; sandbox optional), MySST(mock), data.gov.my MSIC(live)
   ├─ Document-understanding agent ─► Docling + vision model (BM/EN)
   ├─ Deductibility reasoner ─────► RAG over Law Corpus (§6)
   ├─ Audit-Risk agent ───────────► rules + anomaly checks + MyInvois cross-match
   ├─ Audit-Defense agent ────────► Evidence Vault + Law Corpus
   └─ Citation Verifier (LLM critic) ─► layered on the deterministic gate in `core`
        │                                    │
 DETERMINISTIC CORE  core: Obligation Rules Engine · Tax Computation Engine · Citation gate · Evidence Vault   [Chaos / Plan 1 ✅]
        │
 Data: Neon Postgres SG (prelim, hashes-not-payloads, fixtures fallback) → self-hosted MY Postgres (prod, identical schema) · local object store (docs)
 RAG: model2vec numpy index (prelim, sovereign/in-process, fail-open) → bge-m3 + pgvector (prod scale path)
 Model layer: RoutingLLMClient ── ILMU-first sovereign (pure-ILMU for prelim, Q6); escalation = a stronger model on the SAME ILMU gateway (stays in-country); direct-Anthropic = flagged non-sovereign opt-in, OFF by default (BE-5)
```

## 2. Components

| Component                          | Type                   | Responsibility                                                                                       | Plan |
| ---------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------- | ---- |
| **`core`**                         | Deterministic Py       | Obligation Rules + Tax Computation engines, law corpus, citation grounding gate, Evidence Vault      | 1 ✅ |
| **Orchestrator**                   | LangGraph graph        | Decompose goal; route agents; enforce human-approval interrupts                                      | 2    |
| **Profiler agent**                 | LLM + tools            | Assemble Entity Tax Profile from SSM + MyInvois + MySST + uploads                                    | 2    |
| **Document-understanding agent**   | LLM (vision) + Docling | Parse/classify trial balance, receipts, invoices, EA forms, LHDN letters (BM/EN)                     | 2    |
| **Deductibility reasoner**         | LLM + RAG              | Assign tax treatment per line item; cite ITA/PR clause                                               | 2    |
| **Audit-Risk agent**               | rules + LLM            | Trigger checks, MyInvois mismatch, ratio anomalies → score + fixes                                   | 2    |
| **Audit-Defense agent**            | LLM + RAG + tools      | Interpret query → retrieve evidence → cited defense + exposure                                       | 2    |
| **Citation Verifier (LLM critic)** | LLM + core gate        | Confirm each cited clause supports the claim; block unsupported                                      | 2    |
| **`LLMClient` adapter**            | service                | `chat(messages, tools)` over OpenAI-compatible (ILMU/Gemini) or Anthropic (Claude); provider via env | 2    |
| **FastAPI gateway**                | API                    | Endpoints wrapping core+agents; approval workflow; SSE for live agent steps                          | 2    |
| **Frontend**                       | Vite + React           | Three consoles; built against the API contract                                                       | 3    |

### 2.1 Component ownership (team of 3)

- **Chaos** — everything Python/agentic: `core` (done), Plan 2 (FastAPI, LangGraph, `LLMClient` adapter incl. ILMU sovereign mode, the 5 agents, RAG + LLM citation-critic, MyInvois connector, Audit-Defense).
- **Tuna** — Plan 3 (Vite + React consoles), API wiring, UX, demo polish, the 7-min video + pitch-deck README.
- **Product/tax-verify contributor** — product framing, ⚠verify of tax figures vs LHDN, demo narration.
- **Interface contract:** the **FastAPI endpoints (§7a)** are the boundary. Tuna develops against mocked responses matching those schemas so the streams never block each other.

## 3. Determining obligations (engine spec — the core)

**Input — Entity Tax Profile** (Profiler): `{ entity_type, msic_codes[], paid_up_capital, gross_income, status, tin, sst_registered, employee_count, has_foreign_payments, related_party_txns, share_disposals, turnover (from MyInvois/financials), basis_period }`.

**Engine — deterministic rule table** (config-driven, YA-keyed; ⚠verify figures):

- company → Form C + CP204 (estimate ≥30 days before basis period; 3 months for new co; revisions 6th/9th month; monthly instalments).
- paid-up ≤ RM2.5m **and** gross ≤ RM50m → SME bands (15/17/24%); else 24%. ⚠verify.
- turnover ≥ e-invoice phase threshold (≥RM1m mandated 2026) → e-invoice.
- sst_registered → SST-02. · employee_count>0 → MTD/PCB + Form E/EA + EPF/SOCSO/EIS.
- foreign payments → WHT (CP37). · unlisted share disposals (from 2024) → CGT ⚠verify. · related-party > threshold → TP docs ⚠verify.

**Output — Obligation Calendar:** `[{obligation, form, due_date (holiday-shifted), est_amount, status, rule_id, config_version}]`. _(Implemented in `core/obligations.py`, `computation.py`, `deadlines.py`.)_

## 4. Integrations (data sources)

### 4.1 LHDN MyInvois API (primary transactional source)

Docs [sdk.myinvois.hasil.gov.my/api](https://sdk.myinvois.hasil.gov.my/) (SDK v1.0, 6 Apr 2024). **OAuth 2.0** (client credentials; TIN + NRIC/BRN); **sandbox (preprod) + prod**. Capabilities (⚠verify exact paths): submit documents, get document/details, document state/status, **search documents** (last 31 days — pull the ledger → turnover + evidence), validate TIN, reject/cancel. Payload ~55 fields incl. supplier/buyer TIN, classification codes, tax type & amount, totals. **Use:** derive turnover (→ phase/SME/SST thresholds), feed computation, seed Evidence Vault, cross-match for audit-risk. **Hackathon:** full UBL-2.1 JSON fixture (sandbox optional if creds land).

### 4.2 SSM ([e-Info](https://www.ssm-einfo.my/) / [MYDATA-SSM](https://mydata-ssm.my/)) — entity profile (type, MSIC, paid-up, status). Authorised CSD API; **mock/seed in MVP**.

### 4.3 RMCD [MySST](https://mysst.customs.gov.my/) — SST registration status (no rich API → customer-provided number / mock).

### 4.4 [developer.data.gov.my](https://developer.data.gov.my/) (`api.data.gov.my`, no auth, ~4 req/min) — **reference only**: public-holiday calendar (deadline shift), **MSIC reference (the one live/real external call — `api.data.gov.my?id=msic`)**, DOSM ratios (audit-risk baselines). _Not_ a per-company obligation source.

> Per-company obligations are **derived** from §4.1–4.3 + uploads (see [research](superpowers/research/2026-06-19-tax-obligation-determination.md)).

## 5. Tax Computation Engine

Pure deterministic Python (`core/computation.py`); inputs = treated line items + profile; output = form fields + per-figure trace `{value, inputs[], rule_id, config_version}`. Rates/bands/thresholds = versioned YA config. **LLM never computes a final figure** — the "deterministic agentic AI" guarantee.

## 6. Law corpus, RAG & Citation Verifier

Corpus: ITA 1967, Public Rulings, DGIR guidelines, SST orders → stable clause IDs (`ITA-1967-s33(1)`); each clause carries `section`, `page_ref`, `url` provenance fields (added in BE-12). **Prelim RAG store:** a **committed numpy index** (`core/fixtures/rag/vectors.npz` + `chunks.json`) built offline by `scripts/build_rag_index.py` using **local static `model2vec`/potion embeddings** (~30–60MB, no transformer at inference, fully sovereign — no foreign API); `lru_cache` cosine top-k retrieval at runtime; **fail-open** (errors return `[]`, never raise). **Prod scale path:** `bge-m3` (ILMU's own embedding model, PAYG-only — not on Claw tier) + **pgvector** on a ≥512MB Render tier or ILMU-hosted PAYG. **Deductibility reasoner** + **audit_defense** agent: RAG retrieves candidate clause IDs (replacing the full-ID dump) and threads the verbatim passage + precise `page_ref`/`section`/`url` into the `Citation`; curated/hardcoded citation remains the prepended fallback (belt-and-braces). **Citation Verifier** = the deterministic existence gate in `core/citations.py` (`ground_citation`) **plus** an LLM critic that confirms the clause supports the claim — `ground_citation` stays authoritative with RAG on; RAG never decides figures or eligibility. Unsupported/fabricated clause-IDs are blocked (the demo's "rejects a fake citation" beat).

## 7. AI / model layer (locked)

- **Adapter `LLMClient` / RoutingLLMClient:** one interface `chat(messages, tools) -> ToolCalls|text`. Two implementations: **OpenAI-compatible** (via the `openai` SDK, configurable `base_url`/`api_key`/`model`) for **ILMU Claw (sovereign primary, `nemo-super`)** and **Gemini** (OpenAI-compat endpoint); and **Anthropic** for **Claude**. Provider/route chosen by env (`LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`).
- **Routing — ILMU-first, escalation stays sovereign:** ILMU Claw `nemo-super` is the **sovereign primary** (all inference in-country, PDPA). **Escalation/failover is sovereign by default** — a **stronger model on the SAME ILMU gateway** (`LLM_ESCALATION_MODEL`, reusing the one `sk-` key), so high-stakes work (e.g. the citation critic) never leaves Malaysia. A **direct Anthropic (Claude) call is a deliberate, flagged non-sovereign opt-in** (`LLM_ALLOW_DIRECT_ANTHROPIC=1` + `ANTHROPIC_API_KEY`) — it sends data to the US and is **OFF by default**. Gemini = the same gateway's SDK shim, optional.
- **Why:** clean abstraction (Technical), residency (Market Adoption), sovereignty-aware (Innovation), explainable/controllable (Responsible AI). **Caveat:** if ILMU has no stronger model, sovereign escalation needs an ILMU PAYG/larger model; a direct-Claude backstop exists but is opt-in and **breaks residency**. The adapter makes the route one env change; **the prelim is pure-ILMU (Q6)** — no escalation wired. _(Confirm on the ILMU console whether a stronger/Claude-class model is gateway-hosted before BE-5.)_

### 7a. API contract (the Chaos↔Tuna boundary — exact shapes in Plan 2)

`POST /entities` (onboard → profile) · `GET /entities/{tin}` (entity profile — returns seeded `EntityTaxProfile`; 404 on unknown TIN; **BE-8**) · `POST /entities/{tin}/obligations` (calendar) · `POST /entities/{tin}/filings/form-c` (compute → cited `FormComputation` + `risk_flags` + `sovereign`/`active_model`) · `POST /entities/{tin}/filings/form-c/start` + `/resume` (HITL: pause at the human-approval interrupt → resume with the approval decision; **shipped, BE-2**) · `POST /entities/{tin}/audit-defense` (query → `DefensePack`) · `POST /entities/{tin}/documents/classify` (raw text → `LineItem[]`, JSON-mode, 502-guarded; **BE-9**) · `GET /reference/msic/{code}` (MSIC reference lookup; **shipped, BE-4**) · `GET /entities/{tin}/evidence` · CORS middleware via `FRONTEND_ORIGIN`/`CORS_ORIGINS` env (**BE-7**); all validation errors return a consistent **422** with field detail (**BE-10**); AI-backed responses carry a `sovereign: bool` + `active_model: str` field (**BE-6**). SSE `/runs/{id}/stream` for live agent steps (STRETCH, BE-11). _(Shipped routes: `GET /health`, `POST …/obligations`, `POST …/filings/form-c`, `POST …/filings/form-c/start`, `POST …/filings/form-c/resume`, `POST …/audit-defense`, `GET /reference/msic/{code}`.)_

## 8. Data model (core tables)

`entities` · `obligation_profiles` · `obligations` · `documents` · `transactions` · `computations` (per-figure trace) · `citations` (clause_id + verified) · `audit_cases` · `audit_log` (append-only, **payload hashes only — no raw payloads**) · `evidence_links` (figure↔doc↔clause). **Prelim:** managed Neon serverless Postgres (AWS `ap-southeast-1` Singapore, free tier) — LangGraph checkpoints (BE-15), EvidenceVault (BE-16, hashes-not-payloads), entities/filings/defense-packs (BE-17, seeded from fixtures + fixtures/in-memory fallback). Schema is plain Postgres; no vendor bundle. **Prod:** self-hosted / MY-region plain Postgres with identical schema (residency is a deploy-config swap). RAG index stays on the committed numpy artifact (not pgvector) for the prelim; pgvector is the prod consolidation option.

## 9. Security, privacy & compliance

PDPA: encrypt PII at rest + TLS; least-privilege; retention policy. **Residency (honest statement):** **Inference is 100% in-country for the prelim** — pure-ILMU `nemo-super` (Q6, Gate 1), every model call is in-country; RAG retrieval is also in-process (local static embeddings, no foreign API). **Prelim persistence is on Neon Postgres in AWS Singapore** — no Malaysian region available; mitigated by the EvidenceVault storing **payload hashes, not raw payloads** (no raw financials leave). **Prod sovereign path: self-hosted / MY-region plain Postgres, identical schema — residency is a deploy-config swap (clean because Neon has no vendor bundle)**. Do not claim unqualified "all data stays in Malaysia" for the prelim; the accurate statement is **in-country inference + in-country computation + SG persistence now / MY persistence in prod**. Secrets (MyInvois OAuth, model keys) in env/secrets manager, never in code. Immutable `audit_log` (payload hashes). **Human-in-the-loop hard gate** before any submit/export; no auto-filing of statutory returns.

## 10. Non-functional requirements

Latency: audit-query → pack <15s; Form C <60s (seeded). Reliability: deterministic seeded scenarios; graceful fallback to upload/mock if a gov source is down. Observability: tracing on agent runs; per-step logs. Testability: golden-file (computation), table-driven (obligations), planted-fake-citation (verifier).

## 11. Build plan (mapped to plans + owners)

- **Plan 1 — Deterministic Core** ✅ _done_ (Chaos): 10 TDD tasks, 19 tests green, committed/pushed.
- **Plan 2 — Agent layer + API** (Chaos, Wk 2–3): `LLMClient` adapter → agents (profiler, doc-understanding, deductibility, audit-risk, **audit-defense**) on LangGraph → LLM citation-critic on the core gate → FastAPI endpoints (§7a) → MyInvois sandbox connector. TDD: mock the model in tests; assert agent decisions + endpoint contracts.
- **Plan 3 — Frontend** (Tuna, Wk 2–4, parallel on mocked API): Vite + React + React Router consoles — Obligation Calendar, Cited Filing Studio (approval inbox), Audit-Defense console; styling absorbs the user's visual reference images when provided.
- **Wk 4 (team):** integration, deterministic demo scenarios, 7-min video + pitch-deck README, deploy (frontend → Vercel, backend → Render via the Render-ready Docker image; localhost still acceptable for the prelim). Buffer for **⚠verify** of tax figures.
- **Discipline:** corporate income tax + audit-defense first; SST/MTD/WHT are config extensions, not new architecture.

## 12. Tech stack (LOCKED)

- **Core:** Python 3.11 · Pydantic v2 · PyYAML · pytest (built).
- **Backend/API:** **FastAPI** (Py 3.11) · **LangGraph** (orchestration + human-in-the-loop interrupts) · SSE for live steps.
- **Model layer:** **`openai` SDK** → ILMU Claw (sovereign primary `nemo-super`; **sovereign escalation = a stronger model on the SAME gateway**, in-country) behind the `LLMClient`/RoutingLLMClient adapter, ILMU-first via env. The **`anthropic` SDK is a flagged non-sovereign opt-in** (`LLM_ALLOW_DIRECT_ANTHROPIC`, OFF by default — a direct Claude call leaves Malaysia). Gemini = the gateway's SDK shim, optional.
- **RAG:** **local static `model2vec`/potion embeddings** + **committed numpy index** (`vectors.npz` + `chunks.json`, offline build via `scripts/build_rag_index.py`) → `lru_cache` cosine top-k → fail-open (prelim). Scale path: `bge-m3` (ILMU PAYG) + **pgvector**.
- **Data:** **managed Neon serverless Postgres** (AWS `ap-southeast-1` SG free tier, prelim; plain Postgres via connection string, psycopg + `langgraph-checkpoint-postgres`; pooled `DATABASE_URL` runtime + direct `DATABASE_URL_UNPOOLED` for `PostgresSaver.setup()`; hashes-not-payloads in EvidenceVault; fixtures/in-memory fallback — DB-down ≠ demo-down) → **self-hosted / MY-region plain Postgres** (prod, identical schema, deploy-config swap); local object store for docs.
- **Docs/OCR:** **Docling** (structured PDFs) + a vision model via the adapter (receipts/letters).
- **Frontend:** **Vite 5** + **React 18** + **React Router 7** + **token-CSS** (the ProofRank devkit design system) + Lucide; **Bun**.
- **Layout:** **`backend/` + `frontend/` monorepo** (root Bun tooling); backend is an editable package managed with **uv**.
- **Infra/tooling:** **Docker** (Render-ready backend image) · deploy → **frontend to Vercel, backend to Render** (localhost still acceptable for the prelim; a Malaysian region / ILMU for sovereignty in prod) · backend deps via **uv** · ruff (optional) · tracing (LangSmith optional).
  > Rationale: ILMU Claw is OpenAI-compatible, so the adapter makes ILMU/Claude/Gemini swappable by env — maximises the sovereignty story and avoids GCP/ADK lock-in; lean for a small team; the deterministic core stays model/stack-independent.

## 13. Limitations & verification checklist

- **⚠verify before prod/deck:** all tax rates/bands/thresholds/deadlines (LHDN); SST scope/rates (RMCD); e-invoice phases/exemptions (re-confirm); CGT/TP thresholds; exact **MyInvois API** paths + payload (sdk.myinvois.hasil.gov.my/api); SSM CSD fields; MySST lookup.
- **No public return-filing API** → prepare-and-cite for MyTax; auto-submit e-invoices only.
- **SSM/MySST mocked** in MVP → prod needs CSD plan + customer SST numbers.
- **Audit-defense = decision-support**, human-approved; not legal advice.

---

_Inception complete: [cukaipandai-spec.md](cukaipandai-spec.md) → [prd.md](prd.md) → [trd.md](trd.md). Design: [superpowers/specs/2026-06-19-cukaipandai-design.md](superpowers/specs/2026-06-19-cukaipandai-design.md) · Research: [superpowers/research/2026-06-19-tax-obligation-determination.md](superpowers/research/2026-06-19-tax-obligation-determination.md) · Plans: [superpowers/plans/](superpowers/plans/) · Prior analysis: [initial-analysis/](initial-analysis/)._
