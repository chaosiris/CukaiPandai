# CukaiPandai — Product Requirements Document (PRD)

> Derived from [cukaipandai-spec.md](project-idea.md). Defines *what* we build and *for whom*. Technical *how* is in [trd.md](trd.md). Scope is split into **Hackathon MVP** (what we ship/demo by 26 Jun 2026) and **Roadmap** (post-hackathon, for the business case judges reward).

---

## 1. Vision & mission
- **Vision:** every Malaysian enterprise's tax position is continuously correct, cited, and audit-ready by design.
- **Mission (MVP):** turn a pile of source data into a *cited, audit-defensible* corporate-tax filing — and turn an LHDN audit query into a one-click, evidence-backed defense pack.
- **One-liner:** *CukaiPandai — smart tax, audit-ready. Every figure cited to source + law, so the LHDN defense file writes itself.*

## 2. Target users & personas

| Persona | Role | Primary jobs-to-be-done | Why they pay |
|---|---|---|---|
| **Faizal — SME Financial Controller** | Finance lead at a RM5–50m Sdn Bhd | Know what's due; file correctly; not get audited; survive an audit if it comes | Penalties + agent fees + audit stress |
| **Mei Ling — Licensed Tax Agent (s.153)** ⭐ | Runs/works at a tax firm filing for many clients | Onboard clients fast; standardise quality; defend client audits; do more clients per headcount | Billable efficiency + audit-defense premium = our **primary channel** |
| **Anand — Group Tax Manager** | Tax function at a multi-entity group (e.g., Chin Hin-class) | Consistency across subsidiaries; audit trail; board-grade defensibility | Group-level risk + audit exposure |
| **(Funnel) — Micro/owner-operator** | Owner of a small Sdn Bhd | "Just tell me what to file and prove it's right" | Low WTP; People's-Choice/funnel, not core |

**Primary buyer for MVP/GTM:** **tax agents (Mei Ling)** — a force-multiplier channel (one sale → many entities) — and **SME/group finance (Faizal/Anand)**.

## 3. Value proposition
- **For finance/tax teams & tax agents** who **must file accurately and survive LHDN audits**,
- **CukaiPandai** is an **agentic tax-assurance platform**
- that **derives each entity's obligations, prepares cited filings, flags audit risk, and auto-builds the audit-defense pack**,
- **unlike** MyTax (dumb form), accounting tax modules (stop at computation), or human agents (manual & costly),
- because **every figure carries its source document + the ITA/Public-Ruling clause that justifies it** — defensibility is built-in, with deterministic tax math and optional in-country (ILMU Claw) processing.

## 4. Scope

### 4.1 Hackathon MVP (must demo by 26 Jun 2026)
Focus = **corporate income tax (Form C / CP204) + the audit-defense loop** for a single Sdn Bhd, on seeded/sandbox data.
- Obligation Radar for one entity (income tax + e-invoice + flags).
- Cited Filing Studio for Form C computation from trial balance + MyInvois sandbox data.
- Audit-Risk Pre-Flight (≥3 trigger checks).
- **Audit-Defense Agent** (the hero demo).
- Evidence Vault + audit trail + Citation Verifier.
- ILMU Claw "sovereign mode" toggle (at least document-understanding/BM path).

### 4.2 Out of scope (MVP) / Roadmap
- Live SSM CSD API, live MyTax submission, full SST/MTD/WHT/CGT/TP coverage, multi-tenant billing, mobile app, e-invoice issuance at scale. (All on the roadmap — shown in the pitch for the business case.)

## 5. Functional requirements (MoSCoW)

**Must (MVP):**
- FR1 Onboard an entity (TIN/BRN) and build its **Tax Obligation Profile** from entity data + MyInvois (sandbox) + uploaded financials.
- FR2 Generate the **Obligation Calendar** (obligation × form × deadline × est. amount × status), with holiday-shifted deadlines.
- FR3 Ingest trial balance + MyInvois data + receipts; classify line items; assign tax treatment **with citations**.
- FR4 Compute **Form C / CP204** on the deterministic engine; **every figure links to source doc + ITA/PR clause**.
- FR5 **Audit-Risk Pre-Flight**: ≥3 trigger checks (anomalous deduction, MyInvois mismatch, abnormal ratio) → risk score + suggested fix.
- FR6 **Audit-Defense Agent**: interpret a pasted LHDN query → retrieve evidence → draft a **cited defense pack** → compute penalty exposure (s.112/113).
- FR7 **Citation Verifier** blocks any unsupported clause before a human sees it.
- FR8 **Evidence Vault** + immutable audit trail of agent actions + human approvals.
- FR9 **Human approval gate** before any submission/export.

**Should:** FR10 ILMU Claw sovereign-mode toggle · FR11 multi-entity tax-agent console · FR12 e-invoice submission to MyInvois sandbox.

**Could:** FR13 SST-02 module · FR14 MTD/PCB module · FR15 deadline reminders/notifications · FR16 industry-benchmark anomaly baselines from data.gov.my/DOSM.

**Won't (this cycle):** live MyTax filing automation, WHT/CGT/TP modules, billing/payments, mobile.

## 6. Non-functional requirements (summary; detail in [trd.md](trd.md))
- **Explainability:** every output traceable to source + law; no unexplained numbers.
- **Determinism:** rates/thresholds/computations are deterministic config, never LLM-generated.
- **Data residency / PDPA:** support in-country processing (ILMU Claw sovereign mode); encrypt PII at rest/in transit.
- **Auditability:** immutable, exportable action log.
- **Latency (demo):** audit-query → cited defense pack in <15s; filing computation in <60s on seeded data.
- **Reliability of demo:** deterministic seeded scenarios for a flawless live run.

## 7. Success metrics / KPIs

| Stage | Metric | Target |
|---|---|---|
| Hackathon demo | End-to-end live demo (obligations → cited filing → audit risk → cited defense) | Works in <10 min |
| Hackathon judging | Coverage of rubric (Problem/Tech/Market/Innovation/Presentation) | Lead with audit-defense to protect Innovation |
| Product (pilot) | Time to prepare a corporate return | ↓ ≥60% vs manual |
| Product | Audit-query response time | hours → minutes |
| Product | % of figures auto-cited to source + law | ≥95% |
| Product | Tax-agent clients served per headcount | ↑ ≥2× |
| Business | Paid pilots with tax-agent firms / SMEs | ≥1 within 3 months |

## 8. Pricing & go-to-market (business case for judges)
- **Tax-agent firm tier** (primary): per-firm SaaS + per-entity seats (e.g., **RM200–800/mo per firm + per-client**), audit-defense as a premium module. One firm = many entities.
- **SME/enterprise direct:** **RM1,500–4,000/mo** per finance team (vs an in-house preparer or higher agent fees); group/multi-entity tiers.
- **Per-audit-defense** premium (high WTP — audit defense is currently expensive billable work).
- **GTM:** land via **tax-agent firms** (channel multiplier) + SME finance; wedge on the **audit-defense pain** (acute, urgent, budgeted), expand into full compliance calendar. Sovereign-mode (ILMU Claw) unlocks regulated/GLC buyers. Aligns with Xenber's enterprise/fintech sales motion (hire/incubation prize).

## 9. Milestones (3–4 week build to 26 Jun 2026)
- **Wk 1:** data model + Obligation Rules Engine (income tax) + entity onboarding + MyInvois sandbox auth; seed dataset.
- **Wk 2:** Filing Studio (computation + citations) + law-corpus RAG + Citation Verifier.
- **Wk 3:** Audit-Risk Pre-Flight + **Audit-Defense Agent** + Evidence Vault; ILMU Claw sovereign-mode toggle.
- **Wk 4:** UI polish, deterministic demo scenarios, 7-min video, pitch deck in README, deploy (localhost acceptable). Buffer for ⚠verify of tax figures.

## 10. Risks (product) & mitigations
| Risk | Mitigation |
|---|---|
| Wrong tax figures | Versioned config + ⚠verify + human sign-off; never LLM-computed |
| "Isn't this just TurboTax-MY?" (Innovation) | Lead with **audit-defense + cited audit-readiness**, the open lane; don't pitch "AI e-filing" |
| Demo depends on real integrations | Seed/synthetic data + MyInvois sandbox; mock SSM/MyTax |
| Hallucinated law citations | Citation-verifier agent + stable clause IDs + human review |
| Liability framing | Decision-support, human-approved; augments tax agents |

## 11. Open questions (to confirm)
- Exact current-year rates/thresholds/deadlines (⚠verify vs LHDN/RMCD before the deck).
- MyInvois sandbox access credentials for the team.
- Whether to demo single-entity (simpler) or include the multi-entity tax-agent console.
- Team size & skill mix (still TBD) — affects how much of "Should/Could" we attempt.

---
*See [trd.md](trd.md) for architecture, APIs, data model, security, and the build plan.*
