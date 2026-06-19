# CukaiPandai — Technical Requirements Document (TRD)

> The *how* for [cukaipandai-spec.md](project-idea.md) + [prd.md](prd.md). Architecture, integrations, data model, AI/model layer, security, and the 3–4-week build plan. **⚠verify** = confirm against the cited official source before production (API specifics + tax figures change).

---

## 1. Architecture overview

Three planes: **(1) Deterministic Core** (rules + computation + citation gate — the source of truth), **(2) Agentic Reasoning** (LLM agents that classify/reason/draft/plan), **(3) Integrations & Data** (gov + internal sources). Humans approve before anything leaves the system.

```
 React/Next.js UI ── Obligation Calendar · Filing Studio · Audit-Defense console · Multi-entity view
        │ (REST/SSE)
 FastAPI gateway ── auth, entity context, approval workflow, audit-log writer
        │
 LangGraph Orchestrator (plan/act/critic, human-in-the-loop interrupts)
   ├─ Profiler agent ──────────► Integrations: SSM, MyInvois, MySST, data.gov.my (§4)
   ├─ Document-understanding agent ─► OCR/parse (Docling/Marker/MinerU)
   ├─ Deductibility reasoner ─────► RAG over Law Corpus (§6)
   ├─ Audit-Risk agent ───────────► rules + anomaly checks + MyInvois cross-match
   ├─ Audit-Defense agent ────────► Evidence Vault + Law Corpus
   └─ Citation Verifier (critic) ─► Law Corpus (stable clause IDs)
        │                                    │
 DETERMINISTIC CORE: Obligation Rules Engine · Tax Computation Engine · Citation gate
        │
 Data: Postgres (entities/profiles/obligations/computations/audit log) · pgvector (law) · S3/MinIO (docs)
 Model layer (OpenAI-compatible adapter): Claude Opus 4.8 / Sonnet 4.6  ⇄  ILMU Claw (sovereign mode)
```

---

## 2. Components

| Component | Type | Responsibility |
|---|---|---|
| **Orchestrator** | LangGraph graph | Decompose goal ("prepare Form C" / "answer audit query"); route to agents; enforce human-approval interrupts |
| **Profiler agent** | LLM + tools | Assemble Entity Tax Profile from SSM + MyInvois + MySST + uploads |
| **Obligation Rules Engine** | Deterministic | Profile → obligations + forms + deadlines (versioned config) |
| **Document-understanding agent** | LLM (multimodal) + OCR | Parse/classify trial balance, receipts, invoices, EA forms, LHDN letters (BM/EN) |
| **Deductibility reasoner** | LLM + RAG | Assign tax treatment per line item; cite ITA/PR clause |
| **Tax Computation Engine** | Deterministic | Compute Form C/CP204/SST-02 from treated line items (rates/bands as config) |
| **Audit-Risk agent** | Rules + LLM | Trigger checks, MyInvois mismatch, ratio anomalies → risk score + fixes |
| **Audit-Defense agent** | LLM + RAG + tools | Interpret query → retrieve evidence → draft cited defense + exposure |
| **Citation Verifier** | LLM critic + lookup | Re-check every cited clause vs corpus; block unsupported claims |
| **Evidence Vault** | Postgres + object store | Append-only links: figure ↔ source doc ↔ law clause; immutable audit trail |
| **Model adapter** | Service | OpenAI-compatible routing: Claude ⇄ ILMU Claw |

---

## 3. Determining obligations (engine spec — the core)

**Input — Entity Tax Profile** (assembled by Profiler):
`{ entity_type, msic_codes[], paid_up_capital, incorporation_date, status, tin, sst_registered{sales,service}, employee_count, has_foreign_payments, related_party_txns, share_disposals, turnover (derived from MyInvois/financials), basis_period }`

**Engine — deterministic rule table** (config-driven; ⚠verify all figures):
- `is_company` → Form C + CP204 (estimate within 3 months of commencement; ≥30 days before basis period thereafter; revisions 6th & 9th month; monthly installments).
- `paid_up ≤ RM2.5m AND gross ≤ RM50m` → SME tiered rate (15/17/24%); else 24%. ⚠verify bands.
- `turnover ≥ e-invoice phase threshold` → e-invoice mandate (≥RM1m mandated from 2026).
- `sst_registered` → SST-02 bi-monthly.
- `employee_count > 0` → MTD/PCB monthly (CP39 data) + Form E + EA + EPF/SOCSO/EIS.
- `has_foreign_payments` → WHT (CP37) within 1 month.
- `share_disposals (unlisted, from 2024)` → CGT. ⚠verify.
- `related_party_txns > threshold` → TP documentation. ⚠verify.

**Output — Obligation Calendar:** `[{obligation, form, due_date (holiday-shifted via data.gov.my calendar), est_amount, status, source_rule_id}]`. Each obligation traces to a rule ID and a config version (auditable).

---

## 4. Integrations (data sources)

### 4.1 LHDN MyInvois API (primary transactional source)
- **Base/docs:** [sdk.myinvois.hasil.gov.my](https://sdk.myinvois.hasil.gov.my/) (Getting Started / **API** / Release Notes / FAQ); official LHDN SDK page ([hasil.gov.my](https://www.hasil.gov.my/en/e-invoice/reference-for-the-implementation-of-e-invoice/e-invoice-software-development-kit-sdk/)). **SDK v1.0 since 6 Apr 2024.**
- **Auth:** **OAuth 2.0** (client credentials); identity via **TIN + NRIC/BRN**. **Sandbox (preprod) + production** environments.
- **Capabilities (⚠verify exact paths in /api):** OAuth token; **submit documents** (e-invoice); **get document / details**; **get document state/status**; **search documents** (by date/type — used to pull the transaction ledger → turnover & evidence); **validate taxpayer TIN**; reject/cancel. E-invoice payload (~**55 fields**) includes supplier/buyer **TIN**, classification codes, **tax type & amount**, line items, totals.
- **Use in CukaiPandai:** pull the entity's sales/purchase e-invoices → (a) derive **turnover** (→ phase/SME/SST thresholds), (b) feed the **computation engine**, (c) seed the **Evidence Vault** for audit defense, (d) cross-match the draft return for audit-risk mismatches. Issue e-invoices (sandbox) for F12.
- **Hackathon:** use **sandbox**; if credentials are unavailable, mock with realistic e-invoice JSON fixtures.

### 4.2 SSM — entity profile
- **Sources:** [SSM e-Info](https://www.ssm-einfo.my/) / [MYDATA-SSM](https://mydata-ssm.my/) — authorised **Corporate Subscription Data (CSD)** API for company & business profiles (entity type, **MSIC codes**, paid-up capital, status, directors).
- **Hackathon:** **mock/seed** (paid/licensed API); model the exact fields so production swap is trivial.

### 4.3 RMCD MySST — SST registration status
- **Source:** [mysst.customs.gov.my](https://mysst.customs.gov.my/) / [status inquiry](https://sst01.customs.gov.my/account/inquiry). No rich public API → registration-status lookup or customer-provided SST number.
- **Hackathon:** capture SST number on onboarding / mock status.

### 4.4 developer.data.gov.my — reference layer
- **Base:** `https://api.data.gov.my` (RESTful). Data Catalogue API + **OpenDOSM** (statistics) + realtime ([developer.data.gov.my](https://developer.data.gov.my/), [quickstart](https://developer.data.gov.my/quickstart), [Data Catalogue](https://developer.data.gov.my/static-api/data-catalogue)).
- **Use:** **public-holiday calendar** (deadline shifting), **MSIC** reference, DOSM **economic indicators** (industry-ratio baselines for audit-risk anomaly detection). **Not** a per-company obligation source.
- **(Optional)** BNM Open API for FX rates (foreign-currency / WHT).

> **Expectation-set restated:** per-company obligations are **derived** from §4.1–4.3 + uploads; §4.4 is reference only. This is the answer to the "how do we know what each enterprise owes" bottleneck.

---

## 5. Tax Computation Engine
- Pure deterministic Python; inputs = treated line items + entity profile; outputs = form fields + a computation trace.
- **Rates/thresholds/bands/deadlines in versioned config** (YAML/JSON), keyed by Year of Assessment; every computed figure carries `{value, inputs[], rule_id, config_version}`.
- LLM **never** computes a final tax figure — it only maps line items to treatment (which the engine consumes). This is the "deterministic agentic AI" guarantee.

## 6. Law corpus, RAG & Citation Verifier
- **Corpus:** Income Tax Act 1967, **Public Rulings**, DGIR guidelines, SST orders → chunked with **stable clause IDs** (e.g., `ITA-1967-s33(1)`, `PR-2024-xx-para-5`).
- **Store:** pgvector/Chroma; hybrid (keyword + vector) retrieval.
- **Deductibility reasoner** retrieves + cites clause IDs for each treatment.
- **Citation Verifier** (independent critic) re-fetches each cited clause and confirms it supports the claim; unsupported → block + flag for human. (Anti-hallucination — the demo's "hero rejects a fake citation" beat.)

## 7. AI / model layer
- **Adapter:** single OpenAI-compatible interface; per-call routing by task + mode.
- **Default mode:** **Claude Opus 4.8** (deductibility judgement, audit-query interpretation, defense drafting, citation verification) + **Claude Sonnet 4.6** (bulk doc classification/extraction) via Anthropic API.
- **Sovereign mode:** **ILMU Claw** (YTL, Malaysian-hosted, OpenAI-compatible, BM/Manglish/dialects, in-country residency) — doc understanding + BM LHDN-letter interpretation + bulk classification; full-sovereign option routes all inference in-country. ([ILMU Claw](https://www.digitalnewsasia.com/digital-economy/ytl-ai-labs-launches-ilmu-claw-malaysias-ai-powers-ai-agents))
- **Why:** model-agnostic = clean abstraction (Technical), residency (Market Adoption), sovereignty-aware (Innovation), explainable/controllable (Responsible AI). **Caveat:** ILMU Claw limited seats + smaller models → Claude is the capability backstop.

## 8. Data model (core tables)
- `entities` (tin, brn, type, msic[], paid_up, status, sst_no, employee_count, basis_period)
- `obligation_profiles` (entity_id, derived flags, turnover, config_version)
- `obligations` (entity_id, type, form, due_date, est_amount, status, rule_id)
- `documents` (entity_id, kind, object_url, parsed_json, hash)
- `transactions` (entity_id, source[myinvois|upload], fields…, tax_type, amount)
- `computations` (entity_id, form, field, value, inputs[], rule_id, config_version)
- `citations` (computation_id|claim_id, clause_id, verified_bool)
- `audit_cases` (entity_id, query_text, contested_items[], status)
- `audit_log` (append-only: actor[agent|human], action, payload_hash, ts)
- `evidence_links` (figure_id ↔ document_id ↔ clause_id)

## 9. Security, privacy & compliance
- **PDPA:** encrypt PII at rest (DB/object store) + TLS in transit; least-privilege access; data-retention policy.
- **Residency:** sovereign mode keeps inference + data in Malaysia (ILMU Claw + MY cloud region).
- **Secrets:** OAuth client creds (MyInvois) + SSM keys in a secrets manager; never in code.
- **Auditability:** immutable `audit_log`; every agent action + human approval recorded with payload hashes.
- **Human-in-the-loop:** hard approval gate before any submission/export; no auto-filing of statutory returns.

## 10. Non-functional requirements
- Latency: audit-query → cited defense <15s; Form C computation <60s (seeded). 
- Reliability: deterministic seeded demo scenarios; graceful degradation if a gov source is unreachable (fall back to upload/mock).
- Observability: LangSmith/tracing on agent runs; per-step logs.
- Testability: golden-file tests on the computation engine; citation-verifier unit tests with planted fake citations.

## 11. Hackathon build plan (3–4 weeks, 1–3 people)
- **Wk1:** Postgres schema + Obligation Rules Engine (income tax) + entity onboarding + MyInvois **sandbox** OAuth + seed dataset (1 Sdn Bhd: SSM profile JSON, trial balance, e-invoice fixtures).
- **Wk2:** Filing Studio — document agent + deductibility reasoner + computation engine + citations; law-corpus RAG (curated ITA/PR subset) + Citation Verifier.
- **Wk3:** Audit-Risk Pre-Flight (3+ checks incl. MyInvois mismatch) + **Audit-Defense agent** + Evidence Vault; ILMU Claw sovereign-mode toggle (doc-understanding path).
- **Wk4:** UI polish; deterministic demo scenarios; 7-min video + README pitch deck; Docker deploy (localhost OK). Buffer for **⚠verify** of tax figures vs LHDN.
- **Scope discipline:** corporate income tax + audit-defense first; SST/MTD/WHT modules are config-extensions, not new architecture.

## 12. Tech stack (versions/choices)
Next.js + React + Tailwind · FastAPI (Python 3.12+) · LangGraph · Anthropic API (Opus 4.8 / Sonnet 4.6) + ILMU Claw adapter · Postgres + pgvector · S3/MinIO · Docling/Marker/MinerU (OCR) · Docker Compose · LangSmith (tracing).

## 13. Limitations & verification checklist
- **⚠verify before production/deck:** all tax rates/bands/thresholds/deadlines (LHDN); SST scope/rates (RMCD); e-invoice phases/exemptions (current as of Dec-2025 research — re-confirm); CGT/TP thresholds; exact **MyInvois API** endpoint paths + payload schema (sdk.myinvois.hasil.gov.my/api); SSM CSD field names; MySST lookup method.
- **No public return-filing API** → prepare-and-cite for MyTax; auto-submit e-invoices only.
- **SSM/MySST** mocked in MVP (licensed/no-API) → production needs CSD plan + customer SST numbers.
- **Audit-defense = decision-support**, human-approved; not legal advice.

---
*Inception phase complete: [cukaipandai-spec.md](project-idea.md) → [prd.md](prd.md) → [trd.md](trd.md). Companion research: [project-requirements.md](initial-analysis/project-requirements.md), [background-study.md](initial-analysis/background-study.md), [track1-ideas.md](initial-analysis/track1-ideas.md).*
