# CukaiPandai — Product Requirements Document (PRD)

> Derived from [cukaipandai-spec.md](cukaipandai-spec.md). Defines _what_ we build and _for whom_. Technical _how_ is in [trd.md](trd.md). Scope splits into **Hackathon MVP** (demo by 28 Jun 2026) and **Roadmap** (the business case judges reward). **Stack is locked** — see [trd.md §12](trd.md). **Team of 3 — Chaos, Tuna & a product/tax-verify contributor** (see §3).

---

## 1. Vision & mission

- **Vision:** every Malaysian enterprise's tax position is continuously correct, cited, and audit-ready by design.
- **Mission (MVP):** turn a pile of source data into a _cited, audit-defensible_ corporate-tax filing — and turn an LHDN audit query into a one-click, evidence-backed defense pack.
- **One-liner:** _CukaiPandai — smart tax, audit-ready. Every figure cited to source + law, so the LHDN defense file writes itself._

## 2. Target users & personas (buyers)

| Persona                                      | Role                                | Jobs-to-be-done                                                                | Why they pay                                                      |
| -------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| **Mei Ling — Licensed Tax Agent (s.153)** ⭐ | Files for many client entities      | Onboard fast; standardise quality; defend client audits; more clients per head | Billable efficiency + audit-defense premium = **primary channel** |
| **Faizal — SME Financial Controller**        | Finance lead, RM5–50m Sdn Bhd       | Know what's due; file right; pre-empt audit; survive one                       | Penalties + agent fees + audit stress                             |
| **Anand — Group Tax Manager**                | Multi-entity group (Chin Hin-class) | Consistency across subsidiaries; board-grade audit trail                       | Group risk + audit exposure                                       |
| **(Funnel) Micro/owner-operator**            | Small Sdn Bhd owner                 | "Tell me what to file and prove it's right"                                    | Low WTP; People's-Choice funnel                                   |

**Primary buyer for GTM:** **tax-agent firms (Mei Ling)** — one sale → many entities — plus SME/group finance.

## 3. Build team & responsibilities (team of 3)

Three contributors; ownership split to maximise parallelism after the shared core (Plan 1, done).

| Owner                       | Surface                         | Plans / scope                                                                                                                                                                                       |
| --------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Chaos** (repo owner)      | **Backend & agents**            | Plan 1 ✅ (deterministic core) · **Plan 2** (FastAPI, LangGraph orchestrator, `LLMClient` adapter incl. ILMU, the 5 agents, RAG + LLM citation-critic, MyInvois connector, audit-defense)           |
| **Tuna**                    | **Frontend & demo**             | **Plan 3** (Vite + React + React Router frontend: Obligation Calendar, Cited Filing Studio, Audit-Defense console), API wiring, UX, demo polish, **7-min video + pitch-deck README**                |
| **Product/tax contributor** | **Product · tax-verify · demo** | Product framing, **⚠verify of tax figures vs LHDN**, demo narration                                                                                                                                |

> Interface contract across the team: the **FastAPI endpoints in Plan 2** are the boundary; Tuna builds against them with mock responses until Chaos's endpoints land, so the streams don't block each other.

## 4. Value proposition

**For** finance/tax teams & tax agents who **must file accurately and survive LHDN audits**, **CukaiPandai** is an **agentic tax-assurance platform** that **derives each entity's obligations, prepares cited filings, flags audit risk, and auto-builds the audit-defense pack** — **unlike** MyTax (dumb form), accounting tax modules (stop at computation), or human agents (manual & costly) — **because every figure carries its source document + the ITA/Public-Ruling clause that justifies it**, with deterministic tax math and optional in-country (ILMU Claw) processing.

## 5. Scope

### 5.1 Hackathon MVP (demo by 28 Jun 2026)

A **general, config-driven engine** shown with **breadth + depth**: the Obligation Radar derives _multiple_ obligations; we go deep end-to-end on **corporate income tax (Form C/CP204)** + the **Audit-Defense hero**, on seeded + MyInvois-sandbox data.

- Obligation Radar (income tax, e-invoice phase, SST, employer) for one entity.
- Cited Filing Studio (Form C/CP204) — every figure → source doc + ITA/PR clause.
- Audit-Risk Pre-Flight (≥3 trigger checks).
- **Audit-Defense Agent** (hero).
- Evidence Vault + immutable audit trail + Citation Verifier.
- ILMU Claw "sovereign mode" toggle (≥ the doc-understanding/BM path).

### 5.2 Out of scope (MVP) / roadmap

Live SSM CSD API, live MyTax submission, full SST/MTD/WHT/CGT/TP _computation_, multi-entity console, e-invoice issuance at scale, billing, mobile. _(Configs for other taxes are stubbed — adding them is config, not new architecture.)_

## 6. Functional requirements (MoSCoW)

**Must:** FR1 onboard entity (TIN/BRN) → Tax Obligation Profile (entity data + MyInvois sandbox + uploads) · FR2 Obligation Calendar (obligation×form×deadline×est×status, holiday-shifted) · FR3 ingest trial balance + MyInvois + receipts → classify → assign treatment **with citations** · FR4 compute **Form C/CP204** deterministically, **every figure → source + ITA/PR clause** · FR5 **Audit-Risk Pre-Flight** (≥3 checks: anomalous deduction, MyInvois mismatch, abnormal ratio) → score + fix · FR6 **Audit-Defense Agent** (paste LHDN query → retrieve evidence → cited defense pack → exposure s.112/113) · FR7 **Citation Verifier** blocks unsupported clauses · FR8 **Evidence Vault** + immutable audit trail · FR9 **human approval gate** before any submit/export.

**Should:** FR10 ILMU sovereign-mode toggle · FR11 multi-entity console · FR12 e-invoice submission to MyInvois sandbox.

**Could:** FR13 SST-02 module · FR14 MTD/PCB module · FR15 deadline reminders · FR16 DOSM industry-ratio baselines.

**Won't (this cycle):** live MyTax filing, WHT/CGT/TP modules, billing, mobile.

## 7. Non-functional requirements (detail in [trd.md](trd.md))

Explainability (every output → source + law) · Determinism (rates/thresholds/computations are config, never LLM-generated) · Data residency/PDPA (ILMU sovereign mode; encrypt PII) · Auditability (immutable, exportable log) · Latency (audit-query → pack <15s; filing <60s on seeded data) · Demo reliability (deterministic seeded scenarios).

## 8. Success metrics / KPIs

| Stage     | Metric                                                                         | Target                                        |
| --------- | ------------------------------------------------------------------------------ | --------------------------------------------- |
| Hackathon | End-to-end live demo (obligations → cited filing → audit-risk → cited defense) | <10 min                                       |
| Judging   | Rubric coverage                                                                | Lead with audit-defense to protect Innovation |
| Pilot     | Time to prepare a corporate return                                             | ↓ ≥60% vs manual                              |
| Pilot     | Audit-query response time                                                      | hours → minutes                               |
| Pilot     | % figures auto-cited to source + law                                           | ≥95%                                          |
| Business  | Paid pilots (tax-agent firms / SMEs)                                           | ≥1 in 3 months                                |

## 9. Pricing & GTM (business case)

- **Tax-agent firm tier** (primary): per-firm SaaS + per-entity seats (**RM200–800/mo + per-client**); audit-defense as a premium module. One firm = many entities.
- **SME/enterprise direct:** **RM1,500–4,000/mo** per finance team; group/multi-entity tiers.
- **Per-audit-defense** premium (high WTP — currently expensive billable work).
- **GTM:** land via tax-agent firms (channel multiplier) + SME finance; wedge on the **audit-defense pain** (acute, budgeted), expand into the full compliance calendar. **Sovereign mode (ILMU)** unlocks regulated/GLC buyers. Aligns with Xenber's enterprise/fintech motion (hire/incubation prize).

## 10. Milestones (3–4 wks → 28 Jun 2026; mapped to plans)

- **Plan 1 — Deterministic Core** ✅ _done_ (Chaos): obligation + computation engines, law corpus, citation gate, evidence vault, seeded data; 19 tests green.
- **Plan 2 — Agent layer + API** (Chaos, Wk 2–3): FastAPI + LangGraph + `LLMClient` adapter (ILMU/Claude/Gemini) + the 5 agents + LLM citation-critic + MyInvois sandbox + **Audit-Defense**.
- **Plan 3 — Frontend** (Tuna, Wk 2–4, parallel against mocked API): Vite + React + React Router consoles — Obligation Calendar · Cited Filing Studio · Audit-Defense console.
- **Wk 4 (team):** integration, deterministic demo scenarios, 7-min video, pitch-deck README, deploy (frontend → Vercel, backend → Render via the Render-ready Docker image; localhost still acceptable for the prelim), ⚠verify tax figures.

## 11. Risks (product) & mitigations

| Risk                                   | Mitigation                                                                             |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| Wrong tax figures                      | Versioned config + ⚠verify + human sign-off; never LLM-computed                        |
| "Isn't this TurboTax-MY?" (Innovation) | Lead with **audit-defense + cited audit-readiness**, the open lane                     |
| Demo depends on real integrations      | Seed/synthetic data + MyInvois full fixture (sandbox optional); live MSIC; mock SSM/MyTax |
| Hallucinated law citations             | Citation-verifier (deterministic gate + LLM critic) + stable clause IDs + human review |
| Cross-team coordination                | FastAPI contract is the interface; Tuna builds on mocks; daily integration             |
| Liability framing                      | Decision-support, human-approved; augments tax agents                                  |

## 12. Open items (confirm)

- Exact current-year rates/thresholds/deadlines — ⚠verify vs LHDN/RMCD before the deck.
- **MyInvois sandbox credentials** + **ILMU Claw seat** — to obtain (mock until then).
- ~~Tech stack~~ ✅ locked ([trd.md §12](trd.md)). ~~Team~~ ✅ team of 3 — Chaos, Tuna & a product/tax-verify contributor (§3). MVP = single-entity (multi-entity is Should/roadmap).

---

_See [trd.md](trd.md) for architecture, APIs, data model, security, ownership, and the build plan._
