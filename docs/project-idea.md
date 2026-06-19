# CukaiPandai — Project Specification

> **Smart tax, audit-ready.** An agentic tax-assurance platform for Malaysian enterprises and their tax agents: it figures out *what* an entity owes, prepares and validates the filings with every figure cited to source + law, flags audit risk before you file, and — when LHDN audits — assembles the cited defense pack automatically.
>
> Track: **1 — Agentic AI for Internal Enterprise Operations (Finance / Tax / Compliance).** Hackathon: NexHack 2026 (see [project-requirements.md](initial-analysis/project-requirements.md), [background-study.md](initial-analysis/background-study.md)). Locked from the Track-1 board (see [track1-ideas.md](initial-analysis/track1-ideas.md)).
>
> ⚠️ **Accuracy note:** Malaysian tax *rates, thresholds, deadlines and form numbers change yearly.* Every such figure below is marked **⚠verify** and must be reconciled against LHDN (hasil.gov.my), RMCD (customs.gov.my) and the official rules before production. Structural facts (which forms exist, how obligations are derived, which APIs exist) are researched and cited.

---

## 1. Project background & landscape

### 1.1 Why tax, why now (the 2024–2026 structural shift)
Malaysia's tax system is undergoing its largest digitalisation in a generation, which simultaneously (a) creates rich machine-readable data and (b) sharply raises the compliance + audit burden on enterprises:

- **Mandatory e-invoicing (MyInvois).** LHDN's centralised e-invoicing is rolling out in phases by turnover: **Phase 1 >RM100m (1 Aug 2024), Phase 2 RM25–100m (1 Jan 2025), Phase 3 RM5–25m (1 Jul 2025), Phase 4 RM1–5m (1 Jan 2026)**; the exemption threshold was **raised to RM1,000,000 effective 1 Jan 2026 and the planned final phase (RM150k–500k) was cancelled** — so sub-RM1m entities are voluntary ([ClearTax phases](https://www.cleartax.com/my/en/different-phases-implementation-timelines-einvoicing-malaysia), [Sovos](https://sovos.com/regulatory-updates/vat/malaysia-mandatory-e-invoicing-exemption-threshold-increased/), [VATupdate](https://www.vatupdate.com/2025/12/17/malaysia-raises-e-invoicing-exemption-threshold-to-rm1-million-cancels-final-implementation-phase/)). Every mandated transaction now flows through LHDN with structured tax data — the substrate CukaiPandai reads.
- **SST expansion.** Sales & Service Tax scope and rates were expanded across 2024–2025, pulling more businesses into SST registration and **SST-02** filing ([MySST](https://mysst.customs.gov.my/), [ClearTax SST](https://www.cleartax.com/my/en/sst-in-malaysia)). ⚠verify current scope/rates.
- **Capital Gains Tax** introduced for companies (disposal of unlisted shares / certain foreign capital assets) from 2024. ⚠verify.
- **Aggressive LHDN audit posture.** LHDN runs desk + field audits under its Tax Audit Framework; incorrect returns carry penalties under **ITA 1967 s.113**, failure to furnish under **s.112**, and wilful evasion under **s.114**. Responding to an audit query is manual, stressful and expensive — and the e-invoice data trail makes mismatches easier for LHDN to spot.

**Net:** enterprises must file more, more accurately, with a permanent audit trail — but the tooling is either LHDN's free-but-dumb **MyTax** portal, accounting-suite tax modules that stop at computation, or human tax agents doing it manually. Nobody offers an **agentic, audit-defense-first** layer grounded in Malaysian law.

### 1.2 Competitive landscape (honest)
| Category | Examples | Gap CukaiPandai fills |
|---|---|---|
| Govt e-filing | **MyTax / ezHASiL** (free) | A form with no document understanding, no obligation discovery, no audit defense, no citations |
| Accounting tax modules | SQL, AutoCount, Xero | Compute from the books; no audit-risk, no audit-defense, no law-cited justification |
| Global AI tax tools | TaxGPT, Blue J | US-centric tax *research/Q&A*; not Malaysian filing + LHDN audit defense end-to-end |
| Human tax agents (s.153) | Big-4, SME firms | Do all this manually & expensively — **our channel partner, not competitor** |

**The open lane:** a Malaysian, agentic, **audit-defense-first** tax-assurance platform where *every figure carries its source document + the ITA/Public-Ruling clause that justifies it.*

### 1.3 Fit to sponsor & judges
- **Xenber** (sponsor) sells enterprise/fintech software incl. its *XEN Risk & Credit AI Engine* — tax-assurance SaaS is squarely "build what the market will pay for," and a credible hire/incubation target (the real prize; see [project-requirements.md §8](initial-analysis/project-requirements.md)).
- **Chin Hin Group PMO** (judge) — a multi-subsidiary conglomerate that lives this exact corporate-tax/audit pain; pure Track-1 enterprise ops.
- **JurisTech** (judge) — "deterministic agentic AI, policy-locked, audit-logged" is *literally* CukaiPandai's architecture (deterministic tax engine + LLM-explains + human sign-off).
- **PayNet / Thebanq** — less direct, but the MyInvois data plumbing + data-sovereignty design resonate.

---

## 2. Problem statements

**P1 — Obligation ambiguity (the core bottleneck).** Enterprises (and even tax agents onboarding a new client) cannot easily answer *"which taxes, which forms, which deadlines apply to THIS entity?"* It depends on entity type, business activities (MSIC), paid-up capital, turnover, SST/employer status, foreign payments, related-party transactions and asset disposals — scattered across SSM, LHDN, RMCD and internal systems. There is **no single source of truth**; it must be derived. Getting it wrong = missed filings + penalties.

**P2 — Filing is manual, error-prone, and not audit-traceable.** Preparing Form C / CP204 / SST-02 from source data is laborious; figures are entered without a durable link back to the evidence and the law, so the return is not *defensible*.

**P3 — Audit response is a fire drill.** When an LHDN audit query/letter lands, finance/tax teams scramble to reconstruct which transactions justify a contested figure, gather evidence, and draft a response citing the right ITA section/Public Ruling — often under a tight clock, often paying agents/lawyers a premium.

**P4 — Audit risk is invisible until it's too late.** Teams file without knowing which entries look like LHDN audit triggers (anomalous deductions, mismatches against the e-invoice/third-party trail, abnormal ratios), so they get selected for audit they could have pre-empted.

**P5 — Data sensitivity & sovereignty.** Tax data is highly sensitive financial PII; enterprises and regulated buyers increasingly require **in-country data residency (PDPA)** and explainable, controllable AI — which generic US-hosted AI tools don't satisfy.

---

## 3. Aims & objectives

**Aim.** Make every Malaysian enterprise's tax position **continuously correct, cited, and audit-ready by design** — and make an LHDN audit a one-click, evidence-backed response instead of a fire drill.

**Objectives**
1. **O1 — Derive obligations automatically.** Build a per-entity **Tax Obligation Profile + Calendar** from SSM + MyInvois + MySST + internal data via a deterministic rules engine (solves P1).
2. **O2 — Prepare cited, validated filings.** Generate Form C / CP204 / SST-02 (and supporting schedules) where **every figure links to its source document + the ITA/PR clause**, ready for human-approved submission (solves P2).
3. **O3 — Audit-defense agent.** On an LHDN query, interpret it, retrieve evidence, compute exposure, and draft a cited defense pack (solves P3).
4. **O4 — Pre-file audit-risk check.** Flag audit-trigger red flags and fix-before-you-file (solves P4).
5. **O5 — Responsible & sovereign by design.** Deterministic tax math (never LLM-guessed), citation-verified outputs, human-in-the-loop sign-off, immutable audit trail, and **optional in-country inference via ILMU Claw** (solves P5).
6. **O6 — Hackathon-demoable** by a 1–3 person team in ~3–4 weeks on synthetic + sandbox data.

**Success criteria (hackathon).** A working prototype that, on a seeded entity: (a) shows the derived obligation calendar, (b) produces a cited Form C computation from a trial balance + MyInvois data, (c) flags ≥1 audit risk, and (d) answers a pasted LHDN audit query with a cited defense pack — live, in <10 minutes of demo.

---

## 4. The core research: how to determine an enterprise's tax obligations

> This is the bottleneck the project hinges on. **Finding: obligations are *derived*, not looked up.** No government endpoint returns a company's obligation set; CukaiPandai assembles it.

### 4.1 The data sources (what each provides, how to obtain)

| # | Source | What it gives | How to access | Role |
|---|---|---|---|---|
| **A** | **SSM** — SSM e-Info / MYDATA-SSM | Entity type (Sdn Bhd / LLP / sole-prop / partnership), **MSIC business-activity codes**, paid-up capital, incorporation date, status, directors | Authorised API / Corporate Subscription Data plan ([SSM e-Info](https://www.ssm-einfo.my/), [MYDATA-SSM](https://mydata-ssm.my/)) — paid/licensed | **Entity profile** → drives which tax regimes apply |
| **B** | **LHDN MyInvois API/SDK** | The entity's actual **sales & purchase e-invoices**: supplier/buyer **TIN**, classification codes, **tax types & amounts**, totals (~55 fields) | REST API, **OAuth 2.0**, TIN + NRIC/BRN; **sandbox (preprod) + production** ([MyInvois SDK](https://sdk.myinvois.hasil.gov.my/), [LHDN SDK](https://www.hasil.gov.my/en/e-invoice/reference-for-the-implementation-of-e-invoice/e-invoice-software-development-kit-sdk/)) | **Transaction ledger** → derive turnover (→ phase/SME/SST thresholds), tax computations, and **audit evidence** |
| **C** | **RMCD MySST** | SST (sales/service) **registration status** | Lookup at [mysst.customs.gov.my](https://mysst.customs.gov.my/) / [status inquiry](https://sst01.customs.gov.my/account/inquiry) (no rich public API → status check / customer-provided number) | **SST obligation** flag |
| **D** | **Internal / uploaded** | Trial balance & financials (SQL/AutoCount/Xero), **payroll/HR** (employee count, EA/Form E), **AP** (foreign payments → WHT), fixed-asset & share-disposal (CGT), related-party transactions (TP) | File upload / connector | Computations + obligations not visible externally |
| **E** | **developer.data.gov.my** (`https://api.data.gov.my`) | **Reference data**: MSIC code reference, **public-holiday calendar** (deadline shifting), DOSM economic indicators/benchmarks | Open REST API (Data Catalogue + OpenDOSM) ([developer.data.gov.my](https://developer.data.gov.my/), [Data Catalogue](https://developer.data.gov.my/static-api/data-catalogue)) | **Supporting reference layer** — *not* the obligation source |

> **Important expectation-set:** `developer.data.gov.my` is Malaysia's official *open* data API (population, economy, transport, govt finance). It does **not** expose a given company's tax obligations or filings — that data is private (LHDN/SSM/RMCD). Its genuine value to CukaiPandai is the **reference layer** (MSIC lookups, holiday calendars for deadline math, macro benchmarks for audit-risk anomaly baselines). For per-company obligation derivation, **B (MyInvois) + A (SSM) + C (MySST) + D (internal)** are the real sources. (BNM's Open API can supply FX rates for foreign-currency/WHT if needed.)

### 4.2 The Obligation Rules Engine (deterministic — the heart of P1)
A versioned, auditable rules engine maps **Entity Tax Profile → applicable obligations + deadlines + forms**. (Rates/thresholds are config, never LLM-generated.) Core rules (⚠verify all current-year figures):

| Obligation | Triggered when | Forms / cadence |
|---|---|---|
| **Corporate income tax** | Any company (Sdn Bhd) | **Form C** annually; **CP204** estimate (within 3 months of commencement; ≥30 days before basis period thereafter); **CP204 revisions** (6th & 9th month); monthly installments |
| Tax rate band | SME = paid-up ≤ **RM2.5m** *and* gross income ≤ **RM50m** → tiered (15/17/24%); else 24% ⚠verify | feeds the computation |
| **e-Invoice** | Turnover ≥ phase threshold (≥RM1m mandated from 2026) | Issue/validate via MyInvois |
| **SST (SST-02)** | SST-registered (sales/service); thresholds vary (~RM500k) ⚠verify | **SST-02** bi-monthly |
| **Employer (MTD/PCB)** | Has employees | Monthly deduction (CP39 data); **Form E** annual + **EA** forms; EPF/SOCSO/EIS |
| **Withholding tax** | Payments to non-residents (royalty/interest/technical/contract) | **CP37** within 1 month |
| **CGT** | Company disposes unlisted shares / certain foreign assets (from 2024) ⚠verify | relevant return |
| **Stamp duty** | Chargeable instruments executed | per instrument |
| **Transfer pricing** | Related-party transactions above thresholds ⚠verify | contemporaneous TP documentation |

Output = a per-entity **Obligation Calendar** (obligation × form × due date × estimated amount × status), with deadlines shifted for weekends/public holidays (source E). This calendar drives filing, audit-risk and audit-defense.

> **Filing reality (accuracy):** LHDN provides **no public API to file income-tax returns** — Form C/BE filing is via the **MyTax/ezHASiL** portal (directly or through licensed tax agents). MyInvois API covers **e-invoices only**. Therefore CukaiPandai *prepares a complete, validated, cited return ready for one-click human submission on MyTax* and *submits e-invoices via the MyInvois API*; it does not silently auto-file statutory returns. This is a deliberate, responsible boundary.

---

## 5. Methodology

CukaiPandai follows a **deterministic-core + agentic-reasoning + human-in-the-loop** methodology — the "deterministic agentic AI" pattern judges (esp. JurisTech) reward.

1. **Deterministic where it must be:** tax rates, thresholds, deadlines, obligation rules and final computations live in a **versioned rules/calc engine**. The LLM never invents a rate or computes the final tax — it *classifies, reasons, explains, and drafts*; the engine *computes and gates*.
2. **Agentic where it adds value:** an orchestrated set of agents plan/act/decide across tools (data-source connectors, OCR, the engines, RAG over law) to assemble profiles, prepare filings, hunt audit risk, and build audit defenses — re-planning on missing data.
3. **Grounded & cited:** all interpretive output (deductibility, audit-query answers) is RAG-grounded on the **Income Tax Act 1967, Public Rulings, DGIR guidelines, SST orders**, with a **citation-verifier agent** that rejects any clause not actually supporting the claim (anti-hallucination).
4. **Human-in-the-loop:** nothing files or is sent to LHDN without a tax-agent/finance approval; every action is logged to an immutable, exportable audit trail.
5. **Sovereign by design:** model layer is OpenAI-API-compatible and swappable; a **sovereign mode routes inference to ILMU Claw** (in-country) for data-resident, BM-capable processing.
6. **Evidence-first data model:** every figure on every form carries pointers to (a) its source document(s) and (b) the law clause that justifies it — so the audit-defense file is a by-product of normal operation, not extra work.

---

## 6. Solution features

**F1 — Obligation Radar.** Connect SSM + MyInvois + MySST + upload financials → auto-derived **Obligation Profile & Calendar** (what's due, when, est. amount), with deadline reminders and "new obligation" alerts (e.g., turnover just crossed an e-invoice/SST threshold).

**F2 — Cited Filing Studio.** Ingest trial balance + MyInvois data + receipts → compute Form C / CP204 / SST-02 on the deterministic engine → each line **cited to source doc + ITA/PR clause** → human-review → export/submit (e-invoice via MyInvois API; returns prepared for MyTax).

**F3 — Audit-Risk Pre-Flight.** Before filing, scan the return for LHDN audit triggers — anomalous deductions, **mismatches vs the MyInvois trail**, abnormal YoY/industry ratios (benchmarks from data.gov.my/DOSM) — score risk and propose fixes.

**F4 — Audit-Defense Agent (the hero).** Paste/upload an LHDN audit query/letter → agent interprets the contested items → retrieves the supporting transactions + evidence → computes exposure (penalties s.112/113) → drafts a **cited defense pack** (each item ↔ evidence ↔ ITA/PR clause) → human approves.

**F5 — Evidence Vault & Audit Trail.** Append-only, per-entity vault linking every figure to its documents + law; full immutable log of agent actions and human approvals (regulator-grade defensibility).

**F6 — Citation Verifier.** Independent agent re-checks every cited clause against the law corpus before a human sees it; blocks hallucinated citations.

**F7 — Sovereign Mode (ILMU Claw).** Toggle to run inference in-country on ILMU Claw for data residency + BM/Manglish document and LHDN-letter understanding.

**F8 — Tax-Agent Multi-Entity Console.** For s.153 tax agents: manage many client entities, each with its own profile/calendar/vault — the B2B channel multiplier.

---

## 7. End-to-end usage workflow

### 7.1 Everyday (filing) flow
1. **Onboard entity** → enter TIN/BRN; CukaiPandai pulls **SSM profile** (entity, MSIC, capital), checks **MySST** status, connects **MyInvois** (OAuth).
2. **Obligation Radar** derives the obligation calendar (F1).
3. As a deadline nears, the **Filing Studio** ingests the trial balance + MyInvois transactions + uploaded receipts → the **document agent** classifies each → the **deductibility reasoner** assigns tax treatment with citations → the **computation engine** produces the return → the **citation verifier** checks every clause.
4. **Audit-Risk Pre-Flight** flags risks; the agent proposes fixes.
5. **Human review & approve** → e-invoices submitted via MyInvois API; the income-tax return is packaged + cited for one-click MyTax submission. Everything lands in the **Evidence Vault**.

### 7.2 Audit-defense flow (the differentiator)
1. LHDN issues an **audit query/letter** → user pastes/uploads it.
2. **Audit-Defense Agent**: interpret the contested items → query the Evidence Vault + MyInvois ledger for the relevant transactions + documents → reason about position & exposure (s.112/113) → draft a **cited response/defense pack** → citation verifier checks it.
3. **Human (tax agent/finance) reviews, edits, approves** → export the defense pack (PDF + evidence index) for submission to LHDN.

### 7.3 Demo script (7-min video friendly)
- Drop a seeded entity's trial balance + a folder of MyInvois e-invoices → Obligation Calendar appears; Filing Studio produces a **Form C computation with every line cited**, flags a **non-deductible entertainment expense** and a **missing CP204 revision**.
- Paste a mock LHDN query — *"Justify your RM48,000 repairs & maintenance deduction"* — → the agent returns a cited defense pack in ~10 seconds (transactions + receipts + the ITA capital-vs-revenue test + Public Ruling), with the **citation verifier** rejecting one fabricated citation live.

---

## 8. Agentic architecture & the role of ILMU Claw

### 8.1 Agent topology
```
                         ┌─────────────────────────────────────────┐
                         │        Orchestrator / Planner agent      │
                         │  (decomposes: "file Q3" | "answer audit")│
                         └───────────────┬─────────────────────────┘
        ┌───────────────┬────────────────┼───────────────┬──────────────────┐
        ▼               ▼                ▼               ▼                  ▼
 ┌────────────┐ ┌──────────────┐ ┌───────────────┐ ┌──────────────┐ ┌────────────────┐
 │ Profiler   │ │ Document     │ │ Deductibility │ │ Audit-Risk   │ │ Audit-Defense  │
 │ agent      │ │ understanding│ │ reasoner (LLM │ │ agent        │ │ agent          │
 │ SSM+MyInv. │ │ agent (OCR,  │ │ + RAG on law) │ │ (triggers/   │ │ (interpret →   │
 │ +MySST+TB  │ │ BM/EN multi- │ │               │ │ mismatches)  │ │ retrieve →     │
 │            │ │ modal)       │ │               │ │              │ │ draft cited)   │
 └─────┬──────┘ └──────┬───────┘ └──────┬────────┘ └──────┬───────┘ └───────┬────────┘
       │               │                │                 │                 │
       ▼               ▼                ▼                 ▼                 ▼
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │  DETERMINISTIC CORE (no LLM):  Obligation Rules Engine · Tax Computation Engine     │
 │  (rates/thresholds/deadlines/rules as versioned config) · Citation Verifier gate    │
 └──────────────────────────────────────────────────────────────────────────────────┘
       │                                                                   │
       ▼                                                                   ▼
 ┌──────────────────────┐                                   ┌──────────────────────────┐
 │ Evidence Vault +      │   ── every figure ↔ source doc ↔  │ Human-in-the-loop review  │
 │ immutable audit trail │      ITA/PR clause ──             │ & approval (before filing)│
 └──────────────────────┘                                   └──────────────────────────┘
```
Each agent plans → calls tools → observes → decides → the deterministic core computes/gates → humans approve. Genuinely multi-step, tool-using autonomy (clears the "meaningful agentic AI, not a chatbot" bar).

### 8.2 Model layer & ILMU Claw (data-sovereign by design)
The reasoning agents call an LLM through an **OpenAI-compatible interface**, so the backend is swappable. Two modes:

- **Default (capability) mode:** **Claude Opus 4.8** for the hardest reasoning (deductibility judgement, audit-query interpretation, defense drafting, citation verification) + **Claude Sonnet 4.6** for high-volume document classification/extraction.
- **Sovereign mode (ILMU Claw):** route inference to **YTL's ILMU Claw** — a Malaysian-hosted, OpenAI-API-compatible agentic platform with **100% in-country data residency** and strong **Bahasa Melayu / Manglish / dialect** understanding ([ILMU Claw](https://www.digitalnewsasia.com/digital-economy/ytl-ai-labs-launches-ilmu-claw-malaysias-ai-powers-ai-agents)). Because tax data is sensitive financial PII under **PDPA**, sovereign mode means **raw financials never leave Malaysia** — a real procurement edge for enterprise/regulated buyers and a direct responsible-AI story.
- **Recommended hybrid:** ILMU Claw handles document understanding + BM tax-correspondence/LHDN-letter interpretation + bulk classification (local, cost-effective, data-resident); Claude handles the deepest deductibility/defense reasoning + citation verification (highest accuracy). Demo a **one-toggle "sovereign mode."**
- **Why it scores:** clean model-abstraction (Technical Execution), procurement-ready residency (Market Adoption), sovereignty-aware design (Innovation), explainability + control (Responsible AI).
- **Caveat:** ILMU Claw launched with limited early-access seats + token plans and smaller base models (Nemo-Nano/Super) — hence the *model-agnostic hybrid*, not betting the whole reasoning stack on it.

---

## 9. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| **Frontend** | Next.js + React + Tailwind | Obligation calendar, Filing Studio, Audit-Defense console, multi-entity (tax-agent) view |
| **Backend** | FastAPI (Python) | Agent orchestration service; REST/SSE to frontend |
| **Agent orchestration** | LangGraph | Stateful plan/act/critic graph; human-in-the-loop interrupts = approval gates |
| **AI layer** | Claude Opus 4.8 + Sonnet 4.6 via Anthropic API; **ILMU Claw** (OpenAI-compatible) for sovereign mode | Model-agnostic adapter |
| **Deterministic engines** | Python rules + calc modules; rates/thresholds as **versioned YAML/JSON config** | Obligation Rules Engine + Tax Computation Engine — never LLM-guessed |
| **Law corpus / RAG** | pgvector (or Chroma) over ITA 1967 + Public Rulings + DGIR guidelines + SST orders, with **stable clause IDs** | Powers cited reasoning + citation verifier |
| **Document processing** | Docling / Marker (PDF/scan → structured); MinerU for BM/multilingual OCR | Trial balances, receipts, EA forms, LHDN letters |
| **Data** | Postgres (entities, profiles, obligations, computations, append-only audit log); object store (S3/MinIO) for documents | Evidence Vault |
| **Integrations** | **MyInvois API** (OAuth2, sandbox); **SSM** e-Info/MYDATA (or mocked for demo); **MySST** status; **api.data.gov.my** (MSIC/holidays/DOSM); BNM Open API (FX) | |
| **Infra** | Docker Compose (demo); deployable to a Malaysian cloud region for residency | |

> **Hackathon scoping:** demo on **seeded/synthetic SSM + a MyInvois *sandbox* + uploaded trial balance**; mock the SSM paid API and MyTax submission step. The novelty is the obligation-derivation + cited filing + audit-defense logic, not live production integrations.

---

## 10. Limitations & risks

1. **Tax-figure accuracy.** Rates/thresholds/deadlines change yearly and vary by entity — mitigated by the **versioned config engine + ⚠verify discipline + human sign-off**; never present LLM-guessed numbers.
2. **No public filing API for returns.** Form C/BE filing is via MyTax (manual/tax-agent); CukaiPandai prepares + cites the return for one-click submission and only auto-submits **e-invoices** via MyInvois. Framed as a responsible boundary, not a gap.
3. **SSM data is paid/licensed** and MySST has no rich public API — for the demo these are mocked/seeded; production needs the SSM CSD plan + customer-provided SST numbers.
4. **Law/citation hallucination risk** — mitigated by the **citation-verifier agent** + stable clause IDs + RAG grounding + human review; never auto-file.
5. **Audit-defense is decision-support, not legal advice** — always human-approved; positioned to augment tax agents, not replace professional judgement.
6. **ILMU Claw maturity** — limited early-access + smaller models → model-agnostic hybrid with Claude as the capability backstop.
7. **Scope creep** — the platform spans many taxes; the hackathon MVP scopes to **corporate income tax (Form C/CP204) + the audit-defense loop**, with SST/MTD/WHT as the roadmap.

---

*Next: this spec decomposes into [prd.md](prd.md) (product requirements) and [trd.md](trd.md) (technical requirements), concluding the inception phase.*
