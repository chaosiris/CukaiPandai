# NexHack 2026 — Track 1 Ideas (Internal Enterprise Operations)

> **Decision locked: Track 1** (Agentic AI for Internal Enterprise Operations — HR, Finance, Compliance, IT Ops). Rationale: Track 2 (fintech risk) is the most incumbent-dense field (Feedzai/BioCatch/NICE Actimize), fraud demos are hard to make credible on synthetic data, and "Innovation vs *existing solutions*" (23% of the rubric) is harder to win where giants already operate. Track 1 is less crowded for original angles, **far easier to demo**, and **Chin Hin's Group-PMO judge is pure Track 1** (with Xenber doing enterprise software).

> ⚠️ **Vetting note:** these came from a 7-fresh-lens generation pass whose automated red-team hit a session limit, so **I vetted them by hand** against the failure-modes (cliché / foreign-port / incumbent-owned / wrong-premise / locked / contrived). Prior-art notes are knowledge-based; the **top 3 should get a quick web prior-art check** before you commit (I'll do it when the model limit resets). The exception is **Ulang**, which *was* adversarially red-teamed in the earlier batch. Scores are my estimates against the official 130-mark rubric (Problem 20 · Technical 30 · Market 30 · Innovation 30 · Presentation 20).

---

## Ranked board

| # | Idea | Sub-domain | Chin Hin / judge fit | /130 | Novelty | Winnable |
|---|---|---|---|:--:|:--:|:--:|
| 🥇 1 | **Klir** | Compliance — undeclared conflict-of-interest / related-party | ⭐⭐⭐ bullseye (conglomerate + MACC §17A) | 107 | 4 | 4.5 |
| 🥈 2 | **Cadence** | Finance/Treasury — corporate intraday liquidity sequencing | ⭐⭐⭐ (Chin Hin treasury) | 106 | 4 | 4.5 |
| 🥉 3 | **Sabit** | Procurement — pre-bid tender-steering detection | ⭐⭐⭐ (construction change-orders + §17A) | 105 | 4 | 4 |
| 4 | **Ulang** | Compliance/Audit — agent decision "black-box recorder + replay court" | ⭐⭐ (JurisTech/Xenber, RMiT) | 105 | 4 | 4 |
| 5 | **Tera** | Finance — AI-era expense-receipt corroboration auditor | ⭐⭐ (field-workforce groups) | 103 | 3.5 | 4.5 |
| 6 | **Padam** | Compliance/Data Gov — Open-Finance/PDPA deletion-proof custodian | ⭐⭐ (responsible-AI, DPO) | 103 | 4 | 3.5 |
| 7 | **Driftroot** | Finance Ops — reconciliation-break root-cause eliminator | ⭐⭐ (PMO ops-ROI lens) | 102 | 3.5 | 4 |
| 8 | **TuntutFlow** | Finance/Legal-ops — CIPAA construction-claim & cashflow agent | ⭐⭐⭐ (construction supply chain) | 101 | 4 | 3.5 |
| 9 | **Sahkan** | Finance/Compliance — MyInvois e-invoice lifecycle agent | ⭐⭐ (mandatory e-invoicing) | 99 | 3 | 4 |
| 10 | **Skim** | Treasury — correspondent-banking fee/FX leakage recovery | ⭐ ("found money") | 98 | 3.5 | 3.5 |
| 11 | **Waris-Niaga** | Finance Ops — business financial-continuity / signatory handover | ⭐⭐ (SME/family-group) | 97 | 3.5 | 3 |

**My pick: Klir** (most original + Chin Hin bullseye + a hard §17A money reason + a visceral demo), with **Cadence** (cleanest structural unlock + crisp ROI) and **Sabit** (same integrity/§17A wedge, procurement flavour) as the strong alternates. **Klir + Sabit could even ship as one "Integrity Desk."**

---

## The ideas

### 🥇 1. Klir — Undeclared-Conflict-of-Interest / Related-Party Investigator
*An agentic "undisclosed-relationship investigator" that continuously discovers the conflicts employees **didn't** declare — by reconciling the COI register against who they actually pay, hire, and approve.*

- **Structural unlock / why now.** Conglomerates keep a conflict-of-interest *register* (self-declared) but have no way to find what people **omitted**. Agentic reasoning can now cross-reference HR records, vendor master, payments, approvals and external ownership data to surface *undeclared* related-party links at scale — work that was previously a manual forensic audit. Malaysia's **MACC §17A corporate-liability** regime (directors personally liable; min RM1m or 10× the bribe) makes this a board-level money problem *now*.
- **"Doesn't this exist?"** GRC/ethics tools (Diligent, OneTrust/Convercent) *store* declarations; continuous-controls/forensic-analytics (MindBridge, Oversight) flag anomalous transactions. **None continuously reconcile the COI register against actual pay/hire/approve behaviour to surface the *undeclared* conflict** with a cited case file. That reconciliation + investigation loop is the wedge.
- **Who pays.** Chin Hin (the PMO judge's own org — sprawling multi-subsidiary group = textbook related-party risk), Sunway/IOI/YTL, Khazanah GLCs, any Bursa-listed group needing audit-committee-grade RPT control. Buyer = Chief Integrity Officer / Head of Internal Audit. **RM80k–250k/yr** (a fraction of one §17A fine).
- **Agentic angle.** Discover entities/relationships across systems → reconcile declared vs actual → reason about each suspected undisclosed link → score + assemble a cited case file → route to a human integrity officer. Deterministic matching + LLM reasoning, human decides (JurisTech's "deterministic agentic AI").
- **Demo.** Seed synthetic HR + vendor master + payments + a COI register. The agent surfaces an employee who declared nothing but **approves payments to a vendor owned by their spouse**, with the relationship graph and the exact transactions cited — then a clean officer who's correctly cleared.
- **Stack.** Python/FastAPI; entity-resolution (Splink/dedupe) for people↔vendors↔addresses; graph (Neo4j/networkx); Claude Opus 4.8 for relationship reasoning + case-file drafting, Sonnet 4.6 for bulk matching (ILMU Claw optional for BM names/docs + in-country PII); Postgres append-only audit log; React integrity console.
- **Honest objection / prior-art to verify.** Forensic-analytics incumbents (MindBridge, Oversight, SAP) touch related-party anomalies — **verify none productize the register-vs-behaviour *undeclared*-conflict discovery loop**. Entity resolution on messy Malaysian names is the real technical risk (mitigate with a curated demo dataset).

### 🥈 2. Cadence — Corporate Intraday Liquidity-Sequencing Agent
*Decides the order, timing and partial-funding of a corporate's bulk payment runs (payroll, supplier batches) against a live cash position on 24/7 instant rails — the funding-discipline decision that just moved from the bank's treasury desk onto the corporate, which has zero tooling for it.*

- **Structural unlock / why now.** 24/7 instant rails (DuitNow/RENTAS+) killed the old "end-of-day batch + overnight float" model. The corporate now has to decide *which payments go in what order, when, and partially-funded how* to never bounce payroll while not parking idle cash — a decision banks' treasury desks used to absorb. Corporates have **no tooling** for it; TMS (Kyriba, GTreasury) are batch/forecast-oriented, not real-time sequencing.
- **"Doesn't this exist?"** Kyriba/GTreasury do cash positioning & payment scheduling for large enterprises, but not autonomous, constraint-aware **intraday sequencing/partial-funding on instant rails for the mid-market**. That's the gap.
- **Who pays.** Mid-large Malaysian corporates with heavy recurring outflows — **a Chin Hin-class manufacturer/construction group (named judge org!)** paying hundreds of suppliers + payroll; GLCs; multi-entity groups. Buyer = Group Finance Manager / Treasury. **RM5–12k/mo**; ROI = released idle buffer (yield) + zero failed-payroll/supplier incidents.
- **Agentic angle.** Ingest live cash position + the payment batch + constraints (due dates, criticality, penalties, minimum balances) → plan a funding/sequencing schedule → decide order + partial-funding + hold/release → re-plan as balances move → explain every decision. Genuine constrained planning loop.
- **Demo.** A RM cash position that can't cover everything today. Cadence sequences: payroll first (hard deadline), splits a supplier batch, holds a discretionary payment, and shows "RMx idle buffer freed, 0 failed payments" vs the naïve "pay-in-arrival-order" baseline that bounces payroll.
- **Stack.** Python/FastAPI + a constraint/optimization layer (OR-Tools or rules) as the hard engine; Claude Opus 4.8 as the planner/explainer; mock bank-balance + payment-batch APIs; Postgres; React treasury console.
- **Honest objection.** A judge may ask "isn't this just a scheduler/optimizer?" — answer: the agentic value is reasoning over *messy, changing* real-world constraints + explainable trade-offs + re-planning, not a static solve. Verify no MY TMS already ships this for mid-market.

### 🥉 3. Sabit — Pre-Bid Procurement-Steering Detector
*Catches bid-rigging **before** the bids — by reading the buyer's own internal artifacts (specs, scoring criteria, change orders) for the fingerprints of a contract being steered to a chosen vendor.*

- **Structural unlock / why now.** Procurement-fraud analytics look at *bid patterns after the fact*. Agentic document reasoning can now read the **pre-bid internal artifacts** — over-specific specs ("must have X" that only one vendor has), scoring criteria weighted to a favourite, suspicious change-orders — to flag steering *before award*. §17A makes a single steered megaproject a corporate-liability event.
- **"Doesn't this exist?"** SAP Ariba/Fairmarkit + audit analytics detect post-hoc bid anomalies and duplicate vendors; **pre-bid steering detection from internal spec/scoring artifacts** is auditor manual methodology, not a product.
- **Who pays.** CAPEX-heavy buyers with big tender volumes — **Chin Hin (construction; change-order milking is endemic)**, Gamuda/IJM, plantation/O&G groups, GLCs under integrity pacts. Buyer = Group Procurement Governance / Integrity Office. **RM100k–300k/yr** vs §17A exposure.
- **Agentic angle.** Ingest tender pack (specs, scoring matrix, shortlist, change orders) → reason about restrictive specs / skewed weightings / change-order milking → cross-check vendor links → flag steered tenders with a cited rationale for human review.
- **Demo.** Feed a synthetic tender whose scoring criteria are quietly rigged to one vendor + a spec line only they meet. Sabit flags it pre-award with the exact clauses, vs a clean tender it passes.
- **Stack.** Doc parsing (Docling) + Claude Opus 4.8 reasoning over artifacts; vendor-link graph; Postgres audit log; React procurement-governance console. ILMU Claw optional for BM tender docs + sovereignty.
- **Honest objection.** Overlaps Klir's §17A integrity buyer — could be one "Integrity Desk." Verify no procurement-GRC tool already does pre-bid steering detection.

### 4. Ulang — Agent "Black-Box Recorder & Replay Court"  *(red-team-vetted)*
*A vendor-neutral flight-recorder + deterministic replay for production AI agents: captures full decision context, then re-executes a contested decision and runs counterfactuals into a narrated, citation-linked dossier a BNM examiner or auditor can read months later.*

- **Why it's strong for Track 1.** It's **picks-and-shovels trust infra for the "autonomous AI workforce"** the hackathon is themed on — and it maps directly onto **JurisTech's "deterministic agentic AI"** and **Xenber's** need to defend its own engine. Rides **BNM RMiT model-validation / incident-response**.
- **Killer rebuttal.** "Deterministic replay of an LLM is impossible" → we don't replay against live calls; we capture model id/seed/prompt/retrieved-docs/tool-outputs at decision time and **replay against frozen artifacts** (byte-stable), then flip one input for the counterfactual.
- **Who pays.** Banks/lenders/insurers deploying decisioning agents under RMiT + dispute liability. Buyer = Head of Model Risk / CCO / Internal Audit. **/130 ≈ 105.**
- **Honest objection.** Demos cerebrally (mitigate by rehearsing the frozen-artifact replay); slightly forward-looking buyer (needs FIs to *have* agents). Full detail in [original-ideas.md](original-ideas.md).

### 5. Tera — AI-Era Expense-Receipt Corroboration Auditor
*Proves a receipt is **real** by corroborating it against ground-truth payment + merchant signals — built for the AI-generated-receipt era, where the document itself can no longer be trusted.*

- **Structural unlock / why now.** Anyone can now generate a photorealistic fake receipt with AI in seconds, breaking OCR-based expense tools that trust the document. The fix is to stop trusting the artifact and **corroborate against signals that can't be faked** (card feed, merchant existence, geo/time consistency, duplicate-across-employees).
- **"Doesn't this exist?"** AppZen/Oversight/Ramp/Brex audit expenses — but the **AI-generated-receipt corroboration** angle is the timely wedge; many incumbents still lean on the receipt image. Verify how far AppZen/Ramp already corroborate.
- **Who pays.** Enterprises with big field/sales workforces — **Chin Hin field crews**, telcos, FMCG/pharma sales, plantations. Buyer = Group Finance / Shared Services / Internal Audit. **RM3–8/claim or RM60k–180k/yr** (Ramp publicly flagged >USD 1m in 90 days).
- **Demo.** Submit an AI-faked restaurant receipt → Tera flags "no matching card transaction; merchant unverifiable; duplicated against a colleague's claim," vs a genuine one it clears.
- **Honest objection.** Semi-crowded category — win on the AI-receipt-era framing + Malaysian merchant/card-feed corroboration.

### 6. Padam — Open-Finance / PDPA "Deletion-Proof Custodian"
*When a customer revokes an Open Finance consent, it fans the revocation out to every data-consumer and sub-processor, demands cryptographic deletion attestations, probes for residual/derived data, and produces regulator-grade proof that "delete without undue delay" actually happened.*

- **Structural unlock / why now.** Malaysia's **Open Finance** + **PDPA Amendment 2024** create a *deletion liability* (right to erasure, breach accountability) with **no tooling to prove** deletion propagated across consumers/sub-processors. Agentic orchestration can chase, collect attestations, and probe for residual data.
- **Who pays.** Data-consumer fintechs + data-provider banks/insurers carrying deletion liability. Buyer = CCO / DPO. **RM6k–25k/mo** + per-revocation attestation fee. Strong responsible-AI / PMO-ROI fit.
- **Honest objection.** Depends on Open Finance ecosystem maturity in MY (mitigate by anchoring on PDPA erasure, which is broad); consent-management incumbents (OneTrust) exist but don't do the cryptographic deletion-attestation fan-out.

### 7. Driftroot — Reconciliation-Break Root-Cause Eliminator
*Treats every reconciliation break not as a ticket to close but a symptom to diagnose — clusters recurring breaks to their shared upstream root cause and proposes the specific control/mapping fix that kills the whole family, turning a perpetual exception queue into a shrinking one.*

- **Structural unlock.** Recon incumbents (Blackline, Duco) help humans *close* breaks faster; nobody **eliminates the root cause** so the family stops recurring — agentic causal reasoning over break history is the new capability. Counter-positioned: sold as a queue-*reducer*, not a queue-worker.
- **Who pays.** Banks/insurers/large corporates with standing recon teams. Buyer = Head of Finance Operations. **RM6–15k/mo**; ROI = FTE-hours + aged-item write-offs. Strong PMO ops-ROI fit.
- **Honest objection.** Recon is crowded — win on root-cause-elimination (not faster closing). Verify Duco/Blackline don't already cluster root causes.

### 8. TuntutFlow — CIPAA Construction-Claim & Cashflow Agent
*Turns a Malaysian construction SME's messy site/billing records into an adjudication-ready **CIPAA** claim, and decides by cashflow math whether to adjudicate, settle, or finance the disputed receivable.*

- **Structural unlock.** **CIPAA** (Construction Industry Payment & Adjudication Act) gives subcontractors a statutory fast-track to recover unpaid progress claims, but assembling the claim is painful manual work — agentic doc reasoning now makes it tractable, *plus* a finance decision. **Directly in Chin Hin's construction supply chain.**
- **Who pays.** Construction/building-materials SMEs (RM3–30m); **Chin Hin's dealer/subcontractor network** as a stickiness tool. **RM800–2,500/mo + 8–12% success fee.** One recovered RM50k back-charge pays for years.
- **Honest objection.** More legal-ops than pure internal-ops (still defensible as finance ops); the adjudicate/settle/finance decision is the agentic core — lean into it.

### 9. Sahkan — MyInvois E-Invoice Lifecycle Agent
*Watches every SME e-invoice through its MyInvois lifecycle, predicts which will be rejected/cancelled or silently stall, and choreographs resubmission, CN/DN, and financing-eligibility timing so cash lands on schedule.*

- **Structural unlock.** **MyInvois is now mandatory** (phased through 2024–26) and SMEs are drowning in lifecycle failures (rejections, stalls) that quietly delay cash. Newly-available LHDN-validated invoice status is the signal.
- **Who pays.** SMEs mandated onto MyInvois (RM300–900/mo); invoice financiers wanting a "validated, financeable" feed; accounting-software vendors to embed.
- **Honest objection.** Accounting-software vendors (AutoCount/SQL) could build this — win on the predictive + financing-timing agentic layer.

### 10. Skim — Correspondent-Banking Fee/FX Leakage Recovery
*Reverse-engineers what was actually deducted from every cross-border payment vs what was contractually entitled, then auto-assembles the reclaim case — recovering silent "lifting fees" and FX-spread skim no Malaysian treasury audits line-by-line.*

- **Who pays.** Banks with correspondent networks + MNCs/trading houses with heavy cross-border AP. **Contingency (15–25% of recovered leakage) = "found money"** + a SaaS assurance tier.
- **Honest objection.** Treasury-niche; reconstructing entitled-vs-actual needs correspondent fee schedules (mitigate with sample data). Agentic = parse statements, compute, assemble claim.

### 11. Waris-Niaga — Business Financial-Continuity Agent
*Keeps a live, identity-bound inventory of a company's scattered bank/credit/e-wallet relationships and enables governed, auditable handover when the sole signatory leaves, is incapacitated, or dies — so the business isn't silently frozen out of its own money.*

- **Who pays.** Owner-managed Sdn Bhd / family groups (Chin Hin-PMO type), company secretaries (distribution channel), SME insurers (continuity rider). **RM150–600/mo + activation fee.**
- **Honest objection.** Agentic depth is modest (inventory + handover workflow); cross-institution data access is the hard part. Real, ignored SME pain though.

---

## Considered & set aside (off-target for Track 1 / your steer)
- **Setara** (regulator's enforcement-consistency checker) — buyer is BNM/SC only (SupTech), not an enterprise.
- **Groupr / Tebus** (hospital DRG-coding / guarantee-letter defense) — healthcare revenue-cycle; vertical and Track-2-adjacent.
- **Lebihan** (takaful surplus integrity) — Islamic-finance + risk; you ruled out Islamic.
- **Ledgerwake / Twindeck** (PSP settlement / tokenized-deposit reconciliation) — bank/PSP-internal & crypto-pilot buyers; closer to Track 2 risk, tiny/early buyer set.

---

## Next step
Pick one and I'll expand it into `<idea>-spec.md` (then prd.md + trd.md). My recommendation: **Klir** (or **Cadence** if you prefer a treasury/ROI flavour over integrity/forensics; or **Sabit** for procurement). Tell me which — and whether you want the quick web prior-art check on the top pick first (once the model limit resets).
