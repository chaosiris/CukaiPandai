# NexHack 2026 — Project Ideas (Inception Research)

> Top 5 ideas per track, each with a working-prototype sample stack and real GitHub building blocks, grounded in 2024–2026 market data with citations. Includes a weighted **scoring matrix** and a **risk matrix** across all 10 ideas, plus a cross-track recommendation tuned to _this_ sponsor and judging panel (see [background-study.md](background-study.md)).

> ⚠️ **Read this first — two updates since this file was written:**
>
> 1. **These are the _canonical_ fintech-hackathon ideas.** They're solid and well-researched, but a hackathon veteran has seen them before. For the **fresh, non-obvious ideas** (vetted by an adversarial novelty critic + the ILMU Claw angle), see → **[original-ideas.md](original-ideas.md)**. That's now the primary idea set.
> 2. **The official rubric is confirmed** (130 marks; see [project-requirements.md §2](project-requirements.md)). **Innovation & Differentiation = 30/130 (23%)** — so this file's scoring matrix (which weighted Differentiation at only 8%) _under-rewards originality_ relative to how judges actually score. The `original-ideas.md` set is re-scored against the official rubric.

---

## 0. How to read this document

**Method.** Each idea was generated against the hackathon's stated philosophy — _"build what the market will pay for," "depth beats breadth," business depth (customer + pricing + roadmap) alongside technical depth, responsible/explainable AI_ — and against the judge panel's biases (engineer-heavy, fintech-leaning; PayNet fraud, JurisTech lending, Thebanq on/off-chain, Chin Hin enterprise PMO, Xenber's own Risk & Credit AI Engine). All ideas assume a **1–3 person team building over ~3–4 weeks** to a working prototype.

**Scoring criteria & weights** (each idea scored 1–5; weighted total on a 1–5 scale):

| #   | Criterion                               | Weight | What a 5 looks like                                            |
| --- | --------------------------------------- | ------ | -------------------------------------------------------------- |
| 1   | Market Pain Severity                    | 0.15   | Acute, expensive, frequent, board-level pain                   |
| 2   | Willingness to Pay / Revenue Clarity    | 0.15   | Named buyer + credible price + clear ROI                       |
| 3   | Agentic AI Depth                        | 0.15   | Multi-step plan→act→decide loop, tools, critic — not a chatbot |
| 4   | Technical Feasibility (1–3 ppl, ~3 wks) | 0.15   | Demoable MVP with low integration risk                         |
| 5   | Demo Impact / Live wow                  | 0.12   | Visceral, obviously-correct live moment                        |
| 6   | Judge & Sponsor Fit                     | 0.13   | Lands squarely in the panel's day-jobs                         |
| 7   | Differentiation & Defensibility         | 0.08   | Hard to copy; not a crowded incumbent space                    |
| 8   | Adoption Realism & Responsible AI       | 0.07   | Explainable, governed, deployable today                        |

**⚠ Two honesty notes:**

1. The automated synthesis pass had a **truncation bug** — its Track 2 input was cut after the first idea, so it _guessed_ four Track 2 ideas under invented names. **This document corrects that:** all 10 _actual_ ideas below are scored, with the four corrected Track 2 entries (ScamShield, AuditPilot, DeepShield, CreditSense) computed under the same rubric. Track 1 scores and MuleGuard come straight from full-description scoring; the rest were recomputed by hand against the weights above.
2. **Statistics are cited to the sources the research agents actually retrieved.** A few headline figures (e.g., "174 SOC alerts/day," "~95% AML false positives," "RM54b true scam losses") come from vendor surveys or survey-based estimates and are flagged as _directional_. Pull the official **rubric weights from the event's Google Doc** — they override this rubric.

---

## 1. Cross-track recommendation (read this first)

**Ranked field (all 10, by weighted total):**

| Rank | Idea                 | Track | Sub-domain         | Weighted total |
| ---- | -------------------- | ----- | ------------------ | -------------- |
| 🥇 1 | **MuleGuard**        | 2     | Scam Prevention    | **4.55**       |
| 🥈 2 | **ScamShield Agent** | 2     | Scam Prevention    | **4.54**       |
| 🥉 3 | **AuditPilot**       | 2     | AML                | **4.34**       |
| 4    | **LedgerPilot**      | 1     | Finance (AP/close) | **4.28**       |
| 5    | **ClauseWatch**      | 1     | Compliance/GRC     | **4.20**       |
| 6    | **OnboardMate**      | 1     | HR/Payroll         | **4.06**       |
| 7    | **CreditSense**      | 2     | Credit Risk        | **4.00**       |
| 8    | **DeepShield**       | 2     | Fraud/Deepfake     | **3.92**       |
| 9    | **TriageZero**       | 1     | IT Ops/SOC         | **3.81**       |
| 10   | **AgentWarden**      | 1     | IT Ops/Identity    | **3.67**       |

**Best per track:** Track 1 → **LedgerPilot (4.28)**; Track 2 → **MuleGuard (4.55)**.

**Recommended picks:**

1. **🏆 MuleGuard (lead pick).** The exact bullseye of this panel — PayNet (national fraud rails), Thebanq (money movement/layering), Xenber's fintech-risk DNA. It attacks Malaysia's most acute, board-level pain (APP scams + mule networks where the NSRC only traces funds _after_ the victim calls), rides BNM's **SeFT / Shared Responsibility Framework** liability wave (urgent, named buyers: GXBank/Boost/AEON/TNG), and the **"golden 20 minutes" live freeze** is the most visceral demo in the field. Genuinely agentic (read intent → traverse mule graph → decide freeze/allow → escalate) and explainable. Build on synthetic AMLSim-style data.

2. **🥈 ScamShield Agent (near-tied; lowest build risk).** Essentially co-leads MuleGuard on the rubric, trading MuleGuard's technical defensibility for the **highest feasibility + demo + responsible-AI floor**. The live role-play (a judge plays a scam victim; the agent talks them down and explains the typology) is gripping and needs almost no data engineering. **Risk:** on an engineer-heavy panel it must _prove_ it's a real plan-act-observe agent, not "a clever chatbot" — lean into adaptive interrogation, multimodal screenshot analysis, and autonomous escalation filing.

3. **🥉 AuditPilot (strong third / deepest agentic story).** An AML investigation crew that turns alert backlog into evidence-backed, regulator-ready STR cases. Deepest multi-agent design, perfect PayNet/JurisTech fit; ranks just behind on differentiation (heavy incumbents). Best if your team has AML/compliance domain strength.

4. **Track 1 safe pick: LedgerPilot.** If you prefer enterprise-SaaS engineering over fraud builds (lower regulatory-liability surface, lowest demo risk), this is the highest-scoring Track 1 idea: a genuine planner-executor-critic loop with a self-clearing AP exception queue demo over a seeded GL, MyInvois/SST localization as the moat, and labour-anchored pricing.

**Decision rule for the team:**

- Have **fintech / data-engineering / graph** strength and want the highest ceiling + tightest judge fit → **MuleGuard**.
- Smaller/less-technical team, want a near-equal score with the **lowest build risk and the most emotional demo** → **ScamShield Agent**.
- Want **Track 1** (less regulatory liability, pure enterprise SaaS) → **LedgerPilot**.
- **Avoid for _this_ sponsor:** TriageZero & AgentWarden (weak fintech fit; incumbent-heavy or nascent). Treat CreditSense carefully — it flatters Xenber most but must be wrapped in a real agentic underwriting loop to clear the "meaningful agentic AI" bar (Rule 4).

> **Whichever you pick, the winning framing is the same** (per the panel analysis): _an explainable, governed agent for a named Malaysian FI/enterprise buyer, with a live end-to-end demo, a price, and an adoption roadmap._ MuleGuard, ScamShield, AuditPilot, and CreditSense let you literally call it a _"risk/fraud/credit intelligence engine with an explainable score"_ — echoing Xenber's own flagship product.

---

## 2. Scoring matrix (all 10 ideas)

Scores are 1–5 per criterion. **Weights:** Pain .15 · WTP .15 · Agentic .15 · Feasibility .15 · Demo .12 · Fit .13 · Differentiation .08 · Adoption/Responsible-AI .07.

| Idea (Track)              | Pain | WTP | Agentic | Feas. | Demo | Fit | Diff. | Adopt | **Total** |
| ------------------------- | :--: | :-: | :-----: | :---: | :--: | :-: | :---: | :---: | :-------: |
| **MuleGuard** (T2)        |  5   |  5  |    4    |   4   |  5   |  5  |   4   |   4   | **4.55**  |
| **ScamShield Agent** (T2) |  5   |  4  |    4    |   5   |  5   |  5  |   3   |   5   | **4.54**  |
| **AuditPilot** (T2)       |  5   |  4  |    5    |   4   |  4   |  5  |   3   |   4   | **4.34**  |
| **LedgerPilot** (T1)      |  4   |  4  |    5    |   4   |  5   |  4  |   4   |   4   | **4.28**  |
| **ClauseWatch** (T1)      |  4   |  5  |    5    |   3   |  4   |  4  |   4   |   4   | **4.20**  |
| **OnboardMate** (T1)      |  3   |  4  |    4    |   5   |  4   |  4  |   4   |   5   | **4.06**  |
| **CreditSense** (T2)      |  4   |  4  |    4    |   4   |  3   |  5  |   3   |   5   | **4.00**  |
| **DeepShield** (T2)       |  4   |  4  |    4    |   4   |  4   |  4  |   3   |   4   | **3.92**  |
| **TriageZero** (T1)       |  4   |  4  |    5    |   3   |  4   |  3  |   3   |   4   | **3.81**  |
| **AgentWarden** (T1)      |  3   |  4  |    4    |   3   |  4   |  3  |   5   |   4   | **3.67**  |

**Notable reads:**

- **MuleGuard vs ScamShield are a statistical tie (4.55 vs 4.54).** MuleGuard wins on technical defensibility, WTP-crispness, and impressing engineer judges; ScamShield wins on feasibility, demo emotion, and responsible-AI. Choose by team strength.
- **AuditPilot** has the joint-highest Agentic Depth (5) and best judge fit, dragged down only by a crowded incumbent field (NICE Actimize, Hummingbird, Quantexa).
- **LedgerPilot** is the **highest-floor pick**: genuine agentic depth + a demo that needs no real ERP + clean pricing = lowest risk of a broken demo.
- **CreditSense** has the **highest possible sponsor fit** (mirrors Xenber's XEN Risk & Credit AI Engine) but the lowest demo-wow and a real "is it actually agentic?" risk.
- **AgentWarden** has the highest Differentiation (5, "an agent that governs agents") but a nascent category and a conceptual rather than visceral demo.

---

## 3. Risk matrix (all 10 ideas)

Top risks with likelihood / impact / mitigation. (L=Low, M=Medium, H=High.)

### Track 2

**MuleGuard**
| Risk | L | I | Mitigation |
|---|:--:|:--:|---|
| False-positive freezes block legit payments / create bank liability | M | H | Explainable, calibrated scores; **time-boxed soft-hold + human-confirm** not hard auto-block; clear appeal/release path; unwitting-vs-complicit scoring |
| Real-time mule-graph modeling is ambitious for 3 weeks | M | M | Build on synthetic transaction + mule-graph data; **pre-compute the network** so the live "golden 20 min" freeze is reliable |
| No real bank rails/BNM data — demo could look like a toy | H | M | Seed a realistic stream modeled on NSRC/Semak Mule patterns; frame **SeFT** as the buyer trigger; show deployable API+cloud architecture |
| Adversaries evade a static intent model | M | M | Fuse behavioral/velocity signals **with** the mule-network graph (harder to evade); design for retraining — this is the defensibility story |

**ScamShield Agent**
| Risk | L | I | Mitigation |
|---|:--:|:--:|---|
| Perceived as "just a chatbot" (Rule 4 depth penalty) on an engineer panel | M | H | Show the **plan-act-observe loop**: hypothesis → next-best question → multimodal classify → decide → autonomously file report |
| Over-intervening annoys legit users (friction) | M | M | Risk-gated triggering; graduated, explainable outcomes; never hard-block without escalation |
| Wrong scam verdict (hallucination) | M | M | RAG-grounded typologies; conservative escalation; outcome logging |
| Multilingual scam nuance (BM/Mandarin code-switching) | M | M | Curated few-shot examples; human-reviewed escalations |

**AuditPilot**
| Risk | L | I | Mitigation |
|---|:--:|:--:|---|
| Auto-closing an alert lets real laundering through (AMLA exposure) | M | H | Analyst-augmentation only; **mandatory human disposition**; conservative thresholds; full evidence trail |
| Generated STR/SAR contains hallucinated facts | M | H | Critic/citation-verifier grounds every narrative claim in retrieved evidence; human review before filing |
| Crowded incumbents (NICE Actimize, Hummingbird, Quantexa) | H | M | Differentiate on Malaysia/BNM typologies + the investigate-then-draft agentic loop |
| Realistic alert+counterparty data hard to source | M | M | Seed synthetic monitoring export with embedded known typologies so correctness is verifiable on stage |

**CreditSense**
| Risk | L | I | Mitigation |
|---|:--:|:--:|---|
| Scored "not meaningfully agentic" (Rule 4) — scoring is ML+explainability | H | H | **Wrap in an agentic underwriting loop** (gather alt-data, request missing docs, reason, draft memo) + autonomous early-warning monitor |
| Fairness/bias / disparate-impact scrutiny | M | H | SHAP attributions, adverse-action reason codes, fairness guardrail up front |
| Overlap with sponsor's own XEN engine reads as derivative | M | M | Lean into thin-file/underbanked SME wedge + alt-data; frame as extending, not duplicating |
| Score-with-reasons demo has low live-wow | M | M | Make data-gathering visible; show a thin-file applicant approved with a defensible rationale a rules engine would reject |

**DeepShield**
| Risk | L | I | Mitigation |
|---|:--:|:--:|---|
| Deepfake detection is an arms race; imperfect accuracy | H | M | Multi-signal fusion; **step-up, not hard-reject**; continuous model updates |
| Open detector models underperform on Malaysian demographics | M | M | Calibration; human review on borderline; explainable thresholds |
| GPU/latency for video analysis | M | M | CPU-friendly ONNX models for the demo; async processing in prod |
| Crowded eKYC vendor space | M | M | Differentiate via orchestration + extension into the **deepfake-CFO/BEC instruction-verification** moment |

### Track 1

**LedgerPilot**
| Risk | L | I | Mitigation |
|---|:--:|:--:|---|
| Wrong auto-posted journal entry corrupts books / destroys trust | M | H | Conservative thresholds; **independent critic/reconciliation agent**; reversible/journal-only writes + human sign-off early |
| ERP/GL write-back is the hard integration (can't truly build in 3 wks) | H | M | Demo on seeded Postgres GL; ship CSV round-trip connectors first; frame direct ERP API as v2 |
| OCR/extraction errors on poor scans | M | M | Confidence scoring forces escalation below threshold |
| Crowded global AP/close category (Vic.ai, HighRadius) | M | M | Lead with **MyInvois/SST localization** + the closed resolve-reconcile-post loop + approval-gate trust layer |

**ClauseWatch**
| Risk | L | I | Mitigation |
|---|:--:|:--:|---|
| Legal/regulatory interpretation errors | M | H | Decision-support with **mandatory human sign-off**; never auto-file; every claim hyperlinked to source clause |
| LLM hallucinates a clause, collapsing trust live | M | H | Independent **citation-verifier agent** vs stable clause IDs; rehearse the "verifier rejects a fabricated citation" beat |
| RAG over a reg corpus hard to make demo-reliable in 3 wks | M | M | Pre-curate a fixed seeded policy library; scope to one regulator's circular |
| Scraping regulator sources is brittle/grey-area | M | M | Official feeds / manual PDF uploads with a documented source list |

**OnboardMate**
| Risk | L | I | Mitigation |
|---|:--:|:--:|---|
| Wrong EPF/SOCSO/EIS/PCB calc → legal/tax liability | L | H | Rates in **audited, versioned deterministic config (never LLM-generated)**; verifier agent; HR sign-off |
| Reads as "guided RPA," not meaningful agentic AI (Rule 4) | M | M | Emphasize the branching planner (citizen/foreign-worker/contractor paths), tool use, retries, document-driven re-planning |
| Deep integrations (EPF i-Akaun, payroll filing) too heavy | H | L | Export standard statutory submission files in v1; direct filing = roadmap |
| Statutory rules change, silently breaking correctness | M | M | Treat rate maintenance as a paid, owned, versioned service (also a moat) |

**TriageZero**
| Risk | L | I | Mitigation |
|---|:--:|:--:|---|
| Auto-remediation breaks prod / auto-dismiss misses a real threat | M | H | Conservative gates; reversible actions only; hard human approval on destructive ops; kill-switch + audit log |
| Synthetic alert stream looks like "plausible noise," not obviously correct | M | H | Hand-craft a clean replay with one unambiguous multi-stage attack; make the kill-chain viz the centerpiece |
| Mature SOAR/AI-SOC incumbents (MS, CrowdStrike, Dropzone, Torq) | H | M | Anchor to BNM RMiT 24×7 mandate; lead with gated auto-resolution + evidence-pack escalation |
| Weakest sponsor fit (Xenber isn't a security shop) | M | M | Translate to RM saved on SOC headcount/MSSP seats; quantify on the customer's own alert volume |

**AgentWarden**
| Risk | L | I | Mitigation |
|---|:--:|:--:|---|
| Auto-revoking a live credential breaks production | M | H | Read-only-first; behavioral baselining before action; hard human gates on revocations |
| Nascent category needs buyer education (vs "adopt today") | H | M | Lead with visibility + audit-evidence ROI (zero behavior change); defer enforcement to a later phase |
| Mocked-IAM demo is conceptual, not visceral | M | M | Make discovery dramatic (50 messy identities, dormant/over-privileged surfaced); ship one real connector (AWS IAM/Entra) |
| Deep IAM integration breadth unrealistic for a hackathon | H | M | Demo on mocked data + one real connector; map evidence to OWASP Agentic Top 10 + RMiT/PDPA |

---

## 4. Track 1 — Agentic AI for Internal Enterprise Operations

### 4.1 Domain landscape & pain points (2024–2026, cited)

**Why it's a good "build what the market pays for" zone:** the agentic-AI market is ~**USD 7.6B (2025) → 10.8B (2026)**, and Gartner projects **40% of enterprise apps will embed task-specific AI agents by 2026** (up from <5% in 2025) — yet **86% of finance functions saw no significant AI ROI in 2024 despite 58% adoption**, because they bought chatbots, not agents that close the loop ([Gartner](https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025), [AI News — agentic AP ROI](https://www.artificialintelligence-news.com/news/agentic-ai-drives-finance-roi-in-accounts-payable-automation/)). **Malaysia is a favorable launch market**: it took **32% (~US$759M) of SEA AI funding** and grew **AI adoption 35% YoY** — the fastest in SEA ([Fintech News SG](https://fintechnews.sg/122832/ai/ai-adoption-surges-in-southeast-asia-singapore-leads-but-malaysia-shows-faster-growth/)).

| Sub-domain                    | Sharpest pain (cited)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Finance / AP**              | Manual invoices cost **USD 13–20 each** (vs 2.78 best-in-class), **39% contain errors**, exceptions eat **30–40% of AP time**; **72% of finance leaders** call AP the obvious agentic start ([AI News](https://www.artificialintelligence-news.com/news/agentic-ai-drives-finance-roi-in-accounts-payable-automation/)). Cash reconciliation can take **30+ hrs/month**; only **~31% of FP&A time is analysis**.                                                                                                                                                                                                                                                                                                                    |
| **HR / Payroll**              | HR AI adoption rose **19% → 61% (2023–25)**; SHRM cost-per-hire **USD 5,475**, ~44-day time-to-fill; AI cuts time-to-hire ~50%. Malaysia's EPF/SOCSO/EIS/PCB + **mandatory 2% foreign-worker EPF (Oct 2025)** + LHDN e-invoicing are systematically **under-localized by global tools** ([Talenox](https://blog.talenox.com/epf-socso-eis-pcb-complete-malaysian-payroll-compliance-outsourcing-guide/)).                                                                                                                                                                                                                                                                                                                           |
| **Compliance / GRC**          | ~**234 regulatory alerts/day** globally; **76% of compliance managers still manually scan regulator sites**; **~60% of GRC users run on spreadsheets**; **85% of teams spend 30%+ of time on repetitive tasks** ([Thomson Reuters](https://www.thomsonreuters.com/en-us/posts/investigation-fraud-and-risk/2023-cost-of-compliance-report/), [Adherent](https://www.adherent.com/blog/24-stats-every-chief-compliance-officer-should-know-in-2024/)). AI-native GRC cuts audit readiness from **60–80 eng-hrs to 10–15 platform-hrs** ([Hyperproof](https://hyperproof.io/resource/going-agentic-closing-the-gap-grc-dashboards-cannot-see/)).                                                                                      |
| **IT Ops / SOC**              | SOC analysts face **~174 alerts/day** (only ~22% worth investigating); **71% report burnout**; false positives eat ~52% of time _(vendor surveys — directional)_ ([Radiant](https://radiantsecurity.ai/blog/soc-burnout-and-how-ai-can-flip-the-script/), [The Hacker News](https://thehackernews.com/2025/09/the-state-of-ai-in-soc-2025-insights.html)). L1 tickets cost **~$22 each**, escalations $100+. ServiceNow says its agents autonomously resolve **~90% of internal IT requests** ([ServiceNow](https://newsroom.servicenow.com/press-releases/details/2025/ServiceNow-to-extend-leading-agentic-AI-to-every-employee-for-every-corner-of-the-business-with-acquisition-of-Moveworks-03-10-2025-traffic/default.aspx)). |
| **Identity/Agent governance** | Non-human identities outnumber humans **~82:1**; **97% are over-privileged**; **51% of orgs have no clear AI-identity owner**; Gartner expects **40%+ of agentic projects cancelled by 2027**, governance a top cause ([CSA](https://labs.cloudsecurityalliance.org/research/csa-whitepaper-nonhuman-identity-agentic-ai-governance-v1-cs/), [Okta](https://www.okta.com/newsroom/articles/ai-agents-at-work-2026-agentic-enterprise-security/)).                                                                                                                                                                                                                                                                                   |

**Malaysian regulatory demand drivers:** **PDPA Amendment 2024** (mandatory DPO, breach notification, fines raised to **RM1M**); **BNM RMiT** (mandatory **24×7 SOC**, extending to smaller FIs); BNM took **326 enforcement actions / RM18.9M fines in 2024**, AML breaches topping the list ([InCorp PDPA guide](https://malaysia.incorp.asia/guides/pdpa-compliance-malaysia-complete-guide/), [AKATI RMiT](https://www.akati.com/insights-blog/the-leaders-guide-to-meeting-bnm-rmits-247-monitoring-mandate), [Malay Mail](https://www.malaymail.com/news/money/2025/03/24/bank-negara-imposed-rm189m-in-fines-in-2024-with-anti-money-laundering-breaches-topping-list/170687)).

**Funded comparables proving the buyer pays:** Vanta (**$4.15B valuation, ~$300M ARR**), Drata (~$98M ARR), Norm Ai ($87M total), **Bretton AI (ex-Greenlite, $75M Series B Feb 2026)** for agentic financial-crime, **ServiceNow × Moveworks ($2.85B, Dec 2025)**, PagerDuty's Oct 2025 AI agent suite ([Sacra/Vanta](https://sacra.com/c/vanta/), [Bretton AI](https://www.businesswire.com/news/home/20260209387593/en/Bretton-AI-Raises-$75M-Series-B-Rebrands-from-Greenlite-AI-to-Build-the-AI-Standard-for-Financial-Crime), [PagerDuty](https://www.pagerduty.com/blog/product/product-launch-2025-h2/)).

---

### 4.2 — IDEA T1-A · LedgerPilot ⭐ Best Track 1 (4.28)

_An autonomous AP + month-end-close agent that clears invoice exceptions and reconciles the books — with human sign-off and a full audit trail._

- **Problem.** Manual invoice processing costs ~USD 13–20/invoice, 39% have errors, exceptions eat 30–40% of AP time; month-end cash reconciliation can take 30+ hours; 86% of finance functions saw no AI ROI in 2024 because they bought chatbots, not loop-closing agents.
- **Who pays.** CFOs/controllers at Malaysian SMEs & mid-market; payroll/finance **BPOs & accounting practices** (highest leverage). Labour-anchored: **RM1,500–4,000/mo per finance team** (vs a clerk at RM3–5k/mo), or ~RM0.50–1/invoice vs the RM50+ all-in manual cost.
- **Solution.** Multi-agent system: ingest invoices (email/PDF/**LHDN MyInvois XML**) → 3-way match (PO + goods-receipt) → autonomously resolve exceptions (duplicates, price/qty variance, missing PO, **SST/tax mismatch**) → draft vendor clarifications → post approved entries to the GL → at month-end run reconciliations and draft the close package. Every action above an RM threshold is human-gated; every decision carries a plain-language reason + cited source docs.
- **Agentic angle.** A **planner-executor + independent critic** loop: orchestrator decomposes the batch, calls tools (OCR/extraction, GL/PO API, duplicate vector-search, email), decides auto-resolve vs escalate, re-plans on failed matches; a separate reconciliation/critic agent verifies ledger impact before write-back; agents hold state across the multi-day close.
- **Key features.** 3-way match w/ autonomous exception resolution · MyInvois ingestion · RM-threshold approval gates · plain-language "why" + cited docs · autonomous month-end reconciliation + draft close · immutable exportable audit trail · vendor clarification drafting.
- **Sample stack.** **Frontend:** Next.js + React + Tailwind (approval inbox, exception queue, close cockpit). **Backend:** FastAPI; Postgres (state/exceptions/audit); Redis task queue. **AI layer:** **Claude Opus 4.8** for exception reasoning + reconciliation judgement, **Claude Sonnet 4.6** for high-volume extraction/classification + email drafting; **LangGraph** plan/act/critic loop; Anthropic API tool-use. **Data:** S3/MinIO docs; **pgvector** for duplicate/vendor matching; GL/PO tables synced from ERP. **Infra:** Docker Compose demo; deploy to a Malaysian region (AWS ap-southeast-5) for residency. **Integrations:** CSV connectors to SQL Account/AutoCount/Xero/QuickBooks; Gmail/Outlook intake; MyInvois format.
- **Similar GitHub.** [aniket-work/Lets-Build-Invoice-Processing-Using-AI-Agents](https://github.com/aniket-work/Lets-Build-Invoice-Processing-Using-AI-Agents) (extraction reference — LedgerPilot goes far beyond, into resolution + reconciliation + GL write-back); building blocks: [Docling](https://github.com/docling-project/docling)/[Marker](https://github.com/datalab-to/marker) (doc parsing), [ERPNext](https://github.com/frappe/erpnext) (realistic GL to act on), [Vanna](https://github.com/vanna-ai/vanna) (text-to-SQL over finance data).
- **Pricing.** Tiered SaaS: Starter RM1,500/mo (<500 invoices), Growth RM4,000/mo (multi-entity + close), overage ~RM0.80/invoice; annual BPO contracts per-client. Land on AP → expand to close/FP&A.
- **Adoption roadmap.** Phase 1 shadow mode (agent proposes, human executes — builds trust, measures accuracy) → Phase 2 auto-resolve low-risk under an RM cap → Phase 3 autonomous close drafting + GL write-back with sign-off. Directly addresses the ~20% who trust agents for financial transactions today.
- **Feasibility (3–4 wks).** Very high. Demo: drop 20 messy invoices (incl. a duplicate, a price variance, a missing-PO, an SST mismatch) → agent triages, auto-resolves easy ones, escalates hard ones with explanations, runs a mock reconciliation. Seeded Postgres "ERP" — no real integration.
- **Differentiators.** Closes the loop (resolve+reconcile+post) vs extract-and-display demos; **MyInvois/SST localization**; explainability + threshold gates as first-class trust features.
- **Citations.** [AI News — agentic AP ROI](https://www.artificialintelligence-news.com/news/agentic-ai-drives-finance-roi-in-accounts-payable-automation/) · [Gartner 40% by 2026](https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025) · [Malaysia AI adoption](https://fintechnews.sg/122832/ai/ai-adoption-surges-in-southeast-asia-singapore-leads-but-malaysia-shows-faster-growth/)

---

### 4.3 — IDEA T1-B · ClauseWatch (4.20)

_A regulatory-change agent that reads new rules, diffs them against your policies/controls, drafts the control update, and routes it for sign-off — every claim citation-grounded._

- **Problem.** ~234 regulatory alerts/day; 76% of compliance managers scan regulator sites manually; ~60% of GRC on spreadsheets; 85% spend 30%+ on repetitive work. Existing GRC tools record controls but don't autonomously read a new rule → map it to policy → flag the gap. Naive GenAI **hallucinates legal citations** — fatal in an audit.
- **Who pays.** CCOs, GRC analysts, in-house legal at Malaysian banks/insurers/fintechs — acute under **BNM AMLA/RMiT** and **PDPA Amendment 2024** (mandatory DPO, breach notification, RM1M fines). **RM5,000–15,000/mo per institution** (an analyst costs RM6–10k/mo; firms already buy reg feeds).
- **Solution.** Monitor regulator sources (BNM, SC, LHDN, PDPA/JPDP + international) → detect material change → per change: summarize obligation, RAG-retrieve affected internal policies/controls, gap-analyze (compliant/partial/missing), draft the redline, assign owner + due date, route a change ticket for approval. Every sentence links to the exact clause + internal doc.
- **Agentic angle.** Monitor-plan-act loop: watcher agent (poll/ingest) → triage agent (materiality vs licence type) → mapping agent (RAG over policy corpus) → drafting agent (redlines) → **citation-verifier critic** that independently re-checks every cited clause before it reaches a human (anti-hallucination gate).
- **Key features.** Continuous BNM/SC/LHDN/PDPA monitoring · materiality triage by licence type · automated reg-to-policy gap analysis · drafted redlines w/ owner+due date · **citation-verifier that blocks unsupported claims** · immutable audit trail · plain-language obligation summaries.
- **Sample stack.** Next.js dashboard (change feed, gap board, redline review, approvals); FastAPI + Postgres + Celery/cron poller; **Claude Opus 4.8** (legal interpretation + verifier critic) + **Claude Sonnet 4.6** (summarization/triage) on **LangGraph**; **pgvector/Chroma** over policy + regulatory corpus with stable clause IDs; Docker, in-country/air-gapped deploy; regulator RSS/PDF, Jira/ServiceNow ticketing. Build the control store on **[getprobo/probo](https://github.com/getprobo/probo)** (AI-native GRC, 270+ MCP tools) or **[CISO Assistant](https://github.com/intuitem/ciso-assistant-community)** (100+ frameworks); ground with **[RAGFlow](https://github.com/infiniflow/ragflow)** (citation-grounded RAG).
- **Pricing.** Core RM5,000/mo (one regulator domain, e.g. PDPA), Pro RM12,000/mo (BNM RMiT+AMLA+SC+PDPA); add-on per jurisdiction; implementation fee to ingest the policy library.
- **Adoption roadmap.** Phase 1 monitor+summary+manual mapping (prove citation accuracy) → Phase 2 automated gap analysis w/ confirmed mapping → Phase 3 autonomous redline + ticket routing w/ CCO approval. Beachhead on **PDPA Amendment 2024** (urgent, RM1M fines, every firm affected), then BNM RMiT/AMLA.
- **Feasibility (3–4 wks).** Moderate (the soft spot). Demo: feed a real PDPA/BNM circular it hasn't seen → it summarizes the obligation, retrieves 3 affected policies, marks one "missing control," drafts the edit, opens a ticket — every line hyperlinked. Killer beat: **the verifier rejecting a fabricated citation live.** Scope to one seeded policy library + one regulator to keep it demo-reliable.
- **Differentiators.** Closes the loop to a drafted, owner-assigned control change (vs summarize-only); the citation-verifier attacks the #1 regulated-adoption blocker; Malaysia-first.
- **Citations.** [Thomson Reuters Cost of Compliance](https://www.thomsonreuters.com/en-us/posts/investigation-fraud-and-risk/2023-cost-of-compliance-report/) · [CCO stats](https://www.adherent.com/blog/24-stats-every-chief-compliance-officer-should-know-in-2024/) · [When AI hallucinates compliance](https://www.cxcglobal.com/blog/risk-compliance-and-law/when-ai-hallucinates-compliance-why-human-oversight-still-matters/) · comparables: [Norm Ai](https://siliconangle.com/2025/03/11/ai-agent-powered-compliance-automation-startup-norm-ai-raises-48m/), [Bretton AI](https://www.businesswire.com/news/home/20260209387593/en/Bretton-AI-Raises-$75M-Series-B-Rebrands-from-Greenlite-AI-to-Build-the-AI-Standard-for-Financial-Crime)

---

### 4.4 — IDEA T1-C · OnboardMate (4.06)

_An HR onboarding + payroll-compliance agent that takes a new hire from offer to first compliant Malaysian payslip — EPF, SOCSO, EIS, PCB and all._

- **Problem.** HR teams drown in manual onboarding, and **Malaysian statutory payroll is genuinely hard**: EPF/SOCSO/EIS/PCB e-submissions, the new **mandatory 2% foreign-worker EPF (Oct 2025)**, LHDN e-invoicing — systematically under-localized by global HR agents. Onboarding is a multi-system, error-prone slog.
- **Who pays.** HR/finance leads at Malaysian SMEs/mid-market; **payroll outsourcers & PEO/EOR providers** (highest pain & WTP — statutory setup per hire is directly billable). **RM1,000–3,500/mo per company**, or **RM8–15 PEPM** for outsourcers.
- **Solution.** Orchestrate the full journey: generate offer/contract → collect & validate docs (IC/passport, bank, EPF/SOCSO IDs) via OCR → provision accounts (IT tickets) → register EPF/SOCSO/EIS/PCB → compute correct statutory contributions (incl. 2% foreign-worker branch + PCB tables) → prepare the first payroll run, flagging ambiguities for HR. Every statutory line shows the rule + rate applied.
- **Agentic angle.** Stateful **branching workflow-orchestration agent**: plans the checklist per employee type (citizen/foreign-worker/contractor), calls tools (OCR, IT-provisioning, statutory-rate engine, payroll calc, email), waits on human/external steps, retries, and **adapts the path from document contents** (detects a foreign worker → switches to the 2% EPF branch). A verifier agent re-checks every statutory figure against the rule table.
- **Key features.** End-to-end onboarding orchestration · doc collection + OCR validation · automated EPF/SOCSO/EIS/PCB registration + computation · built-in MY rules (2% foreign-worker EPF, PCB tables, SOCSO ceilings) · IT provisioning via tickets · **explainable statutory calcs + HR approval gates** · exportable statutory submission files.
- **Sample stack.** Next.js HR console (pipeline board, profile, approval, payroll preview); FastAPI + Postgres + a **deterministic Malaysia statutory rules engine (rates as versioned config — never LLM-guessed)**; **Claude Opus 4.8** (orchestration + edge-case reasoning + verifier) + **Claude Sonnet 4.6** (doc parsing + contract drafting) on **LangGraph**; doc store + pgvector for handbook Q&A; in-country deploy for PDPA. Drop-in HR backend: **[frappe/hrms](https://github.com/frappe/hrms)**; recruitment reference: [Ancastal/AI-Recruitment-Agent](https://github.com/Ancastal/AI-Recruitment-Agent), [FoloUp/FoloUp](https://github.com/FoloUp/FoloUp).
- **Pricing.** Starter RM1,000/mo (<50 staff), Growth RM3,500/mo (multi-entity), Outsourcer/PEO RM10–15 PEPM; setup fee for templates; **statutory-rate updates included (recurring-revenue moat).**
- **Adoption roadmap.** Phase 1 checklist + doc collection + statutory calc (HR submits) → Phase 2 auto-provisioning + auto-prepared statutory files w/ approval → Phase 3 integrated payroll run + offboarding/leave. Beachhead with one payroll outsourcer (multiplies across their clients).
- **Feasibility (3–4 wks).** Highest in Track 1. Demo: upload an offer + a foreign-worker passport → agent builds the plan, validates docs, **branches to the 2% EPF rule**, computes EPF/SOCSO/EIS/PCB, opens mock IT tickets, produces a payslip with each line explained — then the verifier catches a deliberately wrong rate. Deterministic math = demo-reliable.
- **Differentiators.** Deep MY statutory localization where global tools fail (the brief's "depth over breadth"); LLM reasoning separated from deterministic payroll math (trustworthy figures); outsourcer GTM multiplies one sale; recurring rate-update revenue.
- **Citations.** [Talenox — EPF/SOCSO/EIS/PCB guide](https://blog.talenox.com/epf-socso-eis-pcb-complete-malaysian-payroll-compliance-outsourcing-guide/) · [Gartner 40% by 2026](https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025) · [Malaysia AI adoption](https://fintechnews.sg/122832/ai/ai-adoption-surges-in-southeast-asia-singapore-leads-but-malaysia-shows-faster-growth/)

---

### 4.5 — IDEA T1-D · TriageZero (3.81)

_An autonomous L1 SOC + IT-ops agent that triages, enriches, correlates, and resolves low-value alerts/tickets — escalating only the real ones with an evidence packet._

- **Problem.** ~174 alerts/analyst/day (only ~22% worth it); false positives ~52% of time; 71% burnout. L1 tickets ~$22, escalations $100+. **BNM RMiT mandates 24×7 SOC** (extending to smaller FIs) — so Malaysian FIs must staff round-the-clock SOCs they can't fill.
- **Who pays.** SecOps/IT-service-desk managers, CISOs at FIs (RMiT-forced 24×7), **MSSPs** (SOC-as-a-service). **RM8,000–25,000/mo per SOC**, or per-analyst-seat for MSSPs.
- **Solution.** Ingest alerts/tickets from SIEM/monitoring → autonomously enrich (threat-intel, asset/owner context, MITRE ATT&CK mapping, log correlation) → classify (FP / known-benign / investigate / critical) → execute safe remediations for low-risk cases (password reset, close duplicate, runbook step) → for real incidents, assemble a ready-to-act evidence packet. Confidence threshold gates every action; kill-switch + full log.
- **Agentic angle.** Per-alert plan-act-observe loop + a **correlation agent** grouping alerts into incidents with kill-chain tracking + a **response agent** executing runbooks behind approval. Genuine multi-step tool-using autonomy.
- **Sample stack.** Next.js SOC console; FastAPI + Postgres + Redis + webhooks; **Claude Opus 4.8** (incident reasoning/correlation/remediation planning) + **Claude Sonnet 4.6** (high-throughput triage) on **LangGraph**; pgvector over runbooks/past incidents; MITRE ATT&CK + threat-intel feeds; on-prem/in-country; sandboxed remediation. Forkable cores: **[HolmesGPT](https://github.com/HolmesGPT/holmesgpt)** (agentic on-call investigation over observability), **[K8sGPT](https://github.com/k8sgpt-ai/k8sgpt)** (rule-first, LLM-explains), **[akmatori/akmatori](https://github.com/akmatori/akmatori)** (AIOps agents, Claude/MCP), **[zhadyz/AI_SOC](https://github.com/zhadyz/AI_SOC)** (multi-agent SOC); intake via **[Chatwoot](https://github.com/chatwoot/chatwoot)** for the helpdesk slice.
- **Pricing.** Core RM8,000/mo (<50 endpoints), Pro RM25,000/mo (MSSP/high-volume), per-client seats; outcome-aligned option tied to % auto-resolved.
- **Adoption roadmap.** Phase 1 enrichment + recommendation only → Phase 2 auto-close high-confidence FPs/duplicates → Phase 3 gated runbook execution (resets, isolations). Beachhead: one Malaysian MSSP or FI SOC under RMiT.
- **Feasibility (3–4 wks).** Moderate. Demo: replay ~100 synthetic alerts (mostly noise, one multi-stage attack) → auto-dismiss FPs with reasons, correlate the attack into one kill-chain incident, escalate with an evidence packet + recommended containment, while the confidence gate holds a risky auto-action for approval. Seeded SIEM export — no live infra.
- **Differentiators / caveats.** Gated auto-resolution + evidence-pack escalation vs summarize-only; RMiT 24×7 as a concrete MY trigger. **But:** crowded incumbents (MS, CrowdStrike, Dropzone, Torq) and **weakest sponsor fit** (Xenber isn't a security shop) → lower priority for _this_ event.
- **Citations.** [SOC burnout (Radiant)](https://radiantsecurity.ai/blog/soc-burnout-and-how-ai-can-flip-the-script/) · [ServiceNow × Moveworks](https://newsroom.servicenow.com/press-releases/details/2025/ServiceNow-to-extend-leading-agentic-AI-to-every-employee-for-every-corner-of-the-business-with-acquisition-of-Moveworks-03-10-2025-traffic/default.aspx) · [BNM RMiT 24×7](https://www.akati.com/insights-blog/the-leaders-guide-to-meeting-bnm-rmits-247-monitoring-mandate)

---

### 4.6 — IDEA T1-E · AgentWarden (3.67)

_A governance agent that discovers, scores, and least-privileges every AI agent / non-human identity in your enterprise — and produces the audit evidence to prove it._

- **Problem.** NHIs outnumber humans **~82:1** (some orgs 90–144:1); **97% over-privileged**; 79% of IT pros feel unequipped for NHI attacks; **51% have no clear AI-identity owner**. Most IAM treats agents like static service accounts. Gartner: **40%+ of agentic projects cancelled by 2027**, weak governance a top cause — so the "autonomous workforce" this hackathon asks you to build needs a warden.
- **Who pays.** CISOs, IAM/platform teams at FIs/enterprises adopting agents — accountable under RMiT/PDPA. **Security budget** (least price-sensitive): **RM10,000–30,000/mo**, or per-monitored-identity.
- **Solution.** Continuously discover agents/NHIs (cloud IAM, API keys, service accounts, agent registries) → baseline each one's real behavior (tools/data touched) → risk-score (excess privilege, dormancy, anomalous use) → autonomously draft least-privilege policies + revocation tickets → generate audit-ready evidence (identity ↔ owner ↔ permissions ↔ activity). Destructive actions human-gated; immutable log.
- **Agentic angle.** Continuous discover→analyze→recommend→act loop (discovery / behavior / policy / remediation agents using IAM APIs, log queries, ticketing) — **it governs agents by being an agent** (memorable, on-theme).
- **Sample stack.** Next.js console (inventory, risk heatmap, policy review, approvals, evidence export); FastAPI + Postgres (identity graph) + scheduler; **Claude Opus 4.8** (risk reasoning + policy drafting + anomaly explanation) + **Claude Sonnet 4.6** (log summarization) on **LangGraph**; graph/relational identity model + pgvector over best-practice corpus; scoped read-mostly creds. Consume/extend **[microsoft/agent-governance-toolkit](https://github.com/microsoft/agent-governance-toolkit)** (covers 10/10 OWASP Agentic Top 10).
- **Pricing.** Core RM10,000/mo (discovery+scoring+evidence), Enterprise RM30,000/mo (autonomous remediation, multi-cloud, RMiT/PDPA evidence packs); audit-evidence export is the renewal hook.
- **Adoption roadmap.** Phase 1 read-only discovery + scoring + owner attribution (instant value, zero blast radius) → Phase 2 policy recommendations + revocation tickets → Phase 3 gated autonomous remediation.
- **Feasibility (3–4 wks).** Moderate. Demo: point at ~50 seeded identities (mostly agents/service accounts with messy grants) → discover, baseline, flag over-privileged/dormant with explained scores, draft a least-privilege policy, open a revocation ticket, export an OWASP-Agentic-Top-10-mapped evidence pack — destructive revoke held at the gate. Mocked IAM/log data.
- **Differentiators / caveats.** Highest differentiation (brand-new "trust" category, meta theme); security budgets pay most. **But:** nascent category needs buyer education (vs "adopt today"), demo wow is conceptual, and sponsor fit is moderate.
- **Citations.** [CSA — NHI & Agentic AI governance](https://labs.cloudsecurityalliance.org/research/csa-whitepaper-nonhuman-identity-agentic-ai-governance-v1-cs/) · [Okta — AI Agents at Work 2026](https://www.okta.com/newsroom/articles/ai-agents-at-work-2026-agentic-enterprise-security/) · [Galileo — agent audit trails](https://galileo.ai/blog/ai-agent-compliance-governance-audit-trails-risk-management)

---

## 5. Track 2 — Fintech Risk & Trust Intelligence

### 5.1 Domain landscape & pain points (2024–2026, cited)

**This is the panel's home turf** (PayNet, Thebanq, JurisTech, Xenber's credit/fraud engine) and where Malaysian pain is most acute. Police-reported scam losses rose **RM1.28b (2023) → RM1.57b (2024) → RM2.77b (2025)** (~67,735 cases Jan–Nov, the highest in three years); survey-based estimates (GASA) put _true_ losses near **RM54b (~3% of GDP)** because ~70% never report and only ~2% recover ([Malay Mail](https://www.malaymail.com/news/malaysia/2026/01/22/home-ministry-malaysias-online-fraud-surge-drains-rm277b-in-2025-the-highest-in-three-years/206298), [ScamWatchHQ](https://scamwatchhq.com/malaysia-scams-2025-the-rm54-billion-crisis-where-macau-scams-romance-syndicates-and-human-trafficking-collide/)).

| Sub-domain                | Sharpest pain (cited)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scam Prevention**       | **~95% of Malaysian online fraud is authorized push-payment (APP)** — the victim is socially engineered into transferring, bypassing OTP/eKYC/chargeback. Funds split across mule accounts in **~20 minutes**, largely unrecoverable after ~2 hours. 2025 by type: investment **RM1.37b**, telecom/Macau **RM715.7m** (28,698 cases), e-finance RM458.1m, job scams **+146% to RM202.6m** ([Fintech News MY](https://fintechnews.my/57531/cyber-security/malaysians-lost-rm2-8-billion-to-scams-in-2025-is-bnms-response-matching-the-crisis/), [BusinessToday](https://www.businesstoday.com.my/2025/12/24/biggest-scams-in-malaysia-in-2025/)). |
| **Mule networks**         | **218,307 mule accounts identified 2023–25** (46,433 → 51,302 → **87,209, +70% in 2025**). Detection is reactive & indiscriminate — banks freeze accounts with vague "suspicious activity" reasons, punishing the **~80% unwitting** mules the same as complicit ones, with **1–3 month** reinstatement waits ([The Star/NSRC](https://www.thestar.com.my/news/nation/2026/02/26/rm24bil-in-funds-successfully-frozen-before-scammers-siphoned-it-off-says-nsrc), [FOMCA](https://www.fomca.org.my/v1/index.php/fomca-di-pentas-media/fomca-di-pentas-media-2025/2018-mule-accounts-reveal-deep-fault-lines-in-banking)).                         |
| **AML**                   | **~90–95% of rules-based AML alerts are false positives** (PwC), ~30–45 min each; SAR prep 25–315 min; ~**$206B/yr** financial-crime compliance spend; AML fines ~**$4.6B in 2024** (H1 2025 +417% YoY) ([Shufti Pro](https://shuftipro.com/blog/understanding-false-positives-in-aml-transaction-monitoring/), [Flagright](https://www.flagright.com/post/overcoming-the-hidden-costs-of-aml-compliance), [Fortune BI](https://www.fortunebusinessinsights.com/financial-crime-compliance-market-113535)).                                                                                                                                       |
| **Credit Risk**           | **~70% of SEA is underbanked**; MSME finance gap **~$5.7T**; Malaysia **BNPL +215%**; black-box scores breach fair-lending (ECOA/SR 11-7); thin-file/gig borrowers under-served ([FICO/Grab](https://www.fico.com/blogs/Alternative-Credit-Scoring-Southeast-Asia), [IFC MSME gap](https://www.smefinanceforum.org/data-sites/msme-finance-gap), [East Asia Forum BNPL](https://eastasiaforum.org/2025/07/03/regulating-malaysias-buy-now-pay-later-market/)).                                                                                                                                                                                    |
| **Deepfake/Synthetic ID** | A Singapore finance director approved a **US$499k transfer on a deepfaked "CFO" Zoom call** (Mar 2025); UNODC: SEA cyber-fraud caused **US$18–37b losses in 2023**, syndicates integrating GenAI/deepfakes/stolen biometrics; Malaysia mandated **eKYC liveness (Apr 2024)** but synthetic IDs still seed mule pipelines ([Tookitaki](https://www.tookitaki.com/blog/deepfake-ceo-scam-singapore-2025), [UNODC/The Record](https://therecord.media/southeast-asian-cyber-fraud-outpaces-crackdown-efforts-united-nations)).                                                                                                                       |

**Malaysia's response stack (your integration surface & vocabulary):** **National Fraud Portal (NFP)** launched Aug 2024 (BNM + PayNet + 16 FIs; ~30-min cross-bank fund tracing, +14% mule-detection accuracy, shared mule DB); **NSRC 997** (24/7; RM2.408b frozen by Jan 2026, ~1-in-5 victims now compensated); **SeFT / Shared Responsibility Framework** (Oct 2024); account **kill switch**; **Semak Mule**; new Penal Code mule-freezing powers (Oct 2024) ([iMoney NFP](https://www.imoney.my/articles/bank-negara-launch-national-fraud-portal), [The Star](https://www.thestar.com.my/news/nation/2026/02/26/rm24bil-in-funds-successfully-frozen-before-scammers-siphoned-it-off-says-nsrc)). Singapore's MAS/IMDA **Shared Responsibility Framework** (live 16 Dec 2024, real-time surveillance from Jun 2025) is the regional template SEA is converging toward ([MAS](https://www.mas.gov.sg/news/media-releases/2024/mas-and-imda-announce-implementation-of-shared-responsibility-framework-from-16-december-2024)).

**Vendor comparables proving the buyer pays:** BioCatch, **Feedzai**, **Featurespace (acquired by Visa, Dec 2024)**, **Hawk AI ($56M Series C Apr 2025; AML AI Overlay, >85% accuracy / <15% FP)**, **Sardine ($70M Series C)**, **Tookitaki** (Singapore; federated AFC Ecosystem), **Nasdaq Verafin** (Entity Research Copilot), **Zest AI** (FairBoost, ~30% approval lift). Crucially, **PayNet + BNM are building their own AI fraud system for 2026 + "FinancialGPT" federated model** — so privacy-preserving/federated design is a direct judge signal ([Hawk/Finovate](https://finovate.com/hawk-raises-56-million-in-series-c-funding-to-help-banks-fight-financial-crime/), [BNM+PayNet AI](https://fintechnews.my/54382/ai/bnm-paynet-ai-fraud-detection/)).

---

### 5.2 — IDEA T2-A · MuleGuard 🏆 Best overall (4.55)

_An autonomous agent that reads payment intent in the "golden 20 minutes" and freezes mule flows before money is layered away._

- **Problem.** 95% of Malaysian online fraud is APP (victim transfers themselves) so OTP/eKYC/chargebacks don't help; syndicates layer funds across mules in ~20 min, unrecoverable after ~2 hrs. Of 2025's ~RM2.77b losses, only ~RM34m was clawed back, ~RM6.7m returned. 218,307 mules 2023–25 (+70% in 2025); detection is reactive & punishes the ~80% unwitting mules.
- **Who pays.** BNM-regulated retail/digital banks (GXBank, Boost Bank, AEON Bank) + e-wallets (TNG, GrabPay, Boost) facing emerging **SeFT** liability. The NFP only traces _after_ a victim calls 997 — a tool that intercepts at the outbound-transfer and first-inbound-receipt moment directly cuts SeFT payouts. **RM8k–25k/mo platform per FI + RM0.01–0.05/scored authorization**; value add-on tied to documented SeFT-payout reduction; 90-day paid POC RM30k–60k on replayed transfers.
- **Solution.** Real-time scoring + autonomous-action engine on the auth path. On outbound: a planner agent scores **APP-scam intent** (sudden large transfer to never-seen beneficiary, beneficiary on a shared mule list, session behavioral anomalies, scam-script linguistic cues). On inbound: a **graph agent** scores the beneficiary as a likely mule from transaction-graph topology (fan-in/fan-out, rapid pass-through, account age vs first inbound). Above thresholds → graduated interventions (dynamic warning → hold-and-verify → kill-switch hold + auto-file an NFP-style trace package), each with a regulator-grade explanation so innocents aren't silently frozen.
- **Agentic angle.** Planner/Supervisor orchestrating specialists: Behavioural-Intent agent (session-anomaly model + LLM scam-script classifier) · Graph agent (community detection + GNN mule scoring) · Action agent (friction/hold/kill-switch via policy + SeFT-aligned justification) · Trace agent (auto-assembles cross-bank fund-flow trace + case file). Plans → acts → decides within seconds.
- **Key features.** Sub-second APP-scam intent scoring w/ "why" panel · graph mule scoring (fan-in/out, pass-through velocity, account age) · autonomous graduated intervention · auto-generated NFP-aligned trace package + freeze justification · **unwitting-vs-complicit fairness guardrail** · live dashboard replaying a scam transfer intercepted inside the 20-min window.
- **Sample stack.** **Frontend:** Next.js + React fraud-ops dashboard (case queue, **react-force-graph** network viz) + a mock mobile-banking screen for the in-app warning/hold. **Backend:** FastAPI on the scoring path; **Kafka** event stream; Redis low-latency features. **AI layer:** **Claude Opus 4.8** (Planner/Supervisor + regulator-grade explanations) + **Claude Sonnet 4.6** (fast scam-script classification) on **LangGraph**; **PyTorch Geometric / DGL** GNN for mule scoring; XGBoost behavioral model. **Data:** synthetic **AMLSim**-style graph + generated mule-ring dataset; Postgres accounts/cases; Neo4j (or in-memory) graph. **Infra:** Docker Compose demo; AWS EKS/Azure for a pilot. **Integrations:** mock NFP/PayNet trace API, kill-switch hook, Semak Mule-style lookup, fraud-ops webhook.
- **Similar GitHub.** [IBM/Multi-GNN](https://github.com/IBM/Multi-GNN) (directed-multigraph AML GNNs) · [vrks5331/Graph-Based-Fraud-Detection-Network](https://github.com/vrks5331/Graph-Based-Fraud-Detection-Network) (GNN + Louvain + BFS explainability — blueprint for explainable mule detection) · [AjayAlluri/realtime-fraud-detection](https://github.com/AjayAlluri/realtime-fraud-detection) (Kafka/Flink/Redis <100ms pipeline) · data: [IBM/AMLSim](https://github.com/IBM/AMLSim), [PaySim](https://github.com/EdgarLopezPhD/PaySim); engine to extend: **[Tazama (LF)](https://github.com/tazama-lf/Full-Stack-Docker-Tazama)** (open-source real-time payment-switch monitoring — directly analogous to PayNet/DuitNow rails).
- **Adoption roadmap.** Phase 1 90-day shadow-mode (one digital bank/e-wallet, replayed history — prove detection lift + low FP, no customer impact) → Phase 2 live in-app warnings/holds on a thin high-risk slice → Phase 3 full kill-switch + auto-trace + shared mule graph; pursue NFP/PayNet alignment. Land-and-expand into the SeFT consortium.
- **Feasibility (3–4 wks).** High. Synthetic AMLSim graph + scripted mule ring → deterministic, dramatic live demo (watch the agent intercept inside the 20-min window). GNN + XGBoost are standard; the agentic layer is mostly LangGraph + Claude prompt/tool wiring. Scope: 1 outbound path, 1 inbound graph path, 1 Action agent w/ 3 interventions, 1 auto-trace/explanation.
- **Differentiators.** Acts _inside_ the golden window (vs reactive NFP); pairs interception with **explainable, fairness-aware** freezing protecting the ~80% unwitting mules (answers FOMCA/PPIM criticism + BNM responsible-AI); speaks NFP/SeFT/kill-switch/Semak Mule vocabulary; frames as a "fraud risk intelligence engine" echoing Xenber's flagship.
- **Citations.** [RM2.8b scams 2025 (Fintech News MY)](https://fintechnews.my/57531/cyber-security/malaysians-lost-rm2-8-billion-to-scams-in-2025-is-bnms-response-matching-the-crisis/) · [RM2.4b frozen / mule scale (The Star)](https://www.thestar.com.my/news/nation/2026/02/26/rm24bil-in-funds-successfully-frozen-before-scammers-siphoned-it-off-says-nsrc) · [Mule fault lines (FOMCA)](https://www.fomca.org.my/v1/index.php/fomca-di-pentas-media/fomca-di-pentas-media-2025/2018-mule-accounts-reveal-deep-fault-lines-in-banking) · [NFP (iMoney)](https://www.imoney.my/articles/bank-negara-launch-national-fraud-portal)

---

### 5.3 — IDEA T2-B · ScamShield Agent (4.54 — near-tied lead; lowest build risk)

_An autonomous agent that intervenes mid-scam, interrogates the victim's intent, and talks them out of the transfer before the money leaves._

- **Problem.** Because ~95% of losses are _authorized_, the failure point is the human in the moment, not the credentials check. Investment (RM1.37b), Macau/telecom (RM715.7m), job (+146%) and love scams all end with a voluntary transfer. Static warning banners are ignored (warning fatigue); NSRC/NFP engage only _after_ the loss.
- **Who pays.** Retail/digital banks + e-wallets (SeFT-exposed) wanting to cut authorized-scam losses without blanket-blocking; telcos/super-apps (Grab, TNG) under Singapore-style waterfall liability SEA is converging toward. They pay to cut payouts and demonstrate "reasonable measures" to BNM.
- **Solution.** When a transfer trips a risk threshold (new high-value beneficiary, scam-typology pattern, forwarded message), the agent launches an **adaptive interactive intervention** in-app: targeted questions ("Did someone tell you to move money to a _safe account_?", "Are you paying upfront to release a loan/job/investment payout?"), classifies live answers against typologies, retrieves matching patterns, explains in plain language _why_ this looks like a specific scam → then clears, adds a cooling-off hold, or escalates to 997 with a pre-filled report. Can also analyze a pasted/forwarded scam **message or screenshot**.
- **Agentic angle.** Goal-directed conversational agent running a plan-act-observe loop: forms a hypothesis about the scam typology, chooses the next question to confirm/deny it (tool: typology KB + RAG over Semak Mule/scam-pattern corpus), runs a **multimodal classifier** on pasted artefacts, decides the intervention, and **autonomously files the structured report** on escalation. Adapts questioning to answers — not a fixed script.
- **Key features.** Adaptive typology-aware interview · multimodal analysis of scam messages/screenshots (investment/Macau/job/loan/love) · plain-language evidence-cited "why" · graduated outcome (clear / cooling-off / auto-escalate to 997/NFP with pre-filled report) · **multilingual (BM, English, Mandarin)** · outcome logging that feeds back labelled scam-vs-legit data.
- **Sample stack.** React Native mock banking screen for the live demo + Next.js ops console (outcomes, saved-loss metrics); FastAPI + Redis (session) + Postgres; **Claude Sonnet 4.6** drives the low-latency adaptive interview + multimodal analysis, **Claude Opus 4.8** handles typology reasoning + explanation + escalation report; LangGraph; RAG over a scam-pattern + Semak Mule KB (pgvector); Docker, embeddable SDK/widget + API. Reusable: [nkaps98/Phishing-Email-Detection-using-LLMs](https://github.com/nkaps98/Phishing-Email-Detection-using-LLMs), [jannikhst/llm-phishing-detector](https://github.com/jannikhst/llm-phishing-detector) (transparent "why it's a scam" reports), [rohith-66/llm-scam-detector](https://github.com/rohith-66/llm-scam-detector); plus [Phishing-URL-Detection](https://github.com/vaibhavbichave/Phishing-URL-Detection) for a "check this link" feature.
- **Pricing.** Embeddable SaaS: per-MAU (RM0.50–2/active user/yr tiered) or RM10k–30k/mo platform per FI + success-fee on documented prevented-loss. **Free public "is this a scam?" checker** as a funnel + CSR play.
- **Adoption roadmap.** Phase 1 ship the free public message-checker (builds a labelled dataset + brand trust) → Phase 2 bank pilot embedding intervention on high-risk transfers (advisory/shadow) → Phase 3 graduated holds + 997/NFP auto-escalation; expand to telco/super-app. Position as the FI's SeFT "reasonable measures" evidence.
- **Feasibility (3–4 wks).** Highest. The demo is a gripping live role-play — a judge plays the scam victim, the agent talks them down and explains the typology — on Claude + RAG with minimal infra. No heavy data engineering.
- **Differentiators / caveat.** Acts on **intent and the human moment** where 95% of losses occur; adaptive interrogation beats ignored banners; multimodal + multilingual; complements (not competes with) the post-loss NFP. **Caveat:** must visibly _be_ a plan-act-observe agent to avoid the "just a chatbot" Rule 4 penalty on an engineer panel — and it's the most copyable of the strong Track 2 ideas (lower defensibility).
- **Citations.** [Biggest scams 2025 (BusinessToday)](https://www.businesstoday.com.my/2025/12/24/biggest-scams-in-malaysia-in-2025/) · [MAS Shared Responsibility Framework](https://www.mas.gov.sg/news/media-releases/2024/mas-and-imda-announce-implementation-of-shared-responsibility-framework-from-16-december-2024) · [Scam economy = system-design problem (Malay Mail)](https://www.malaymail.com/news/what-you-think/2026/03/02/malaysias-scam-economy-is-not-a-public-awareness-problem-but-a-system-design-problem-galvin-lee-kuan-sian/210929)

---

### 5.4 — IDEA T2-C · AuditPilot (4.34 — deepest agentic story)

_Turns a flood of AML alerts into investigated, evidence-backed, regulator-ready cases — automatically._

- **Problem.** Legacy rules-based transaction monitoring floods analysts with false positives (~90–95%; vendors tout "<15% FP" as a selling point) while real typologies (e-wallet layering, mules on coerced IDs, cross-border hops, hidden UBO) slip through. Each surviving alert takes hours of manual evidence-gathering before an STR can be filed. The bottleneck is **investigation labour**, and Malaysia's mule surge (+70% to 87,209) worsens the backlog every quarter.
- **Who pays.** Bank/digital-bank AML teams, MSBs, remittance/e-wallet operators with STR obligations to **BNM's Financial Intelligence Unit**. They pay to cut cost-per-alert and clear backlogs while improving STR quality. **RM20k–60k/mo platform per FI + per-investigation usage**; ROI = cost-per-investigated-alert vs a loaded analyst hour; paid POC RM50k on synthetic/redacted alerts.
- **Solution.** An agent that runs the full investigation a human would: gather customer profile + KYC → pull & graph transaction history → run beneficiary/counterparty network for mule/layering → check watchlists/adverse media → weigh evidence vs typologies → produce a structured case file + disposition (close / escalate / file STR) + a **draft STR narrative**, every claim linked to evidence. Human approves the regulatory decision.
- **Agentic angle.** Planner-orchestrated investigation crew: a Supervisor decomposes the alert and dispatches tool-using sub-agents (KYC-retrieval, transaction-graph GNN + community detection, watchlist/adverse-media search, Narrative agent for the STR), reasons over evidence, **re-plans** if more is needed, reaches a disposition with confidence + full trail. Joint-deepest agentic design in the field.
- **Key features.** End-to-end autonomous investigation w/ re-plan loop · GNN + community-detection mule/layering surfaced as an explorable network · auto-drafted citation-linked STR narrative · disposition + confidence + audit trail · FP triage that closes low-risk alerts with documented justification · analyst-in-the-loop approval UI.
- **Sample stack.** Next.js analyst workbench (queue, evidence panel, interactive graph, editable STR draft w/ citations); FastAPI + Postgres + **Neo4j** + object store; **Claude Opus 4.8** as Supervisor/planner + STR writer (long-context over the evidence bundle) + **Claude Sonnet 4.6** retrieval/extraction sub-agents on **LangGraph**; **PyTorch Geometric** GNN; RAG over typology/FATF red-flag references; bank-VPC deploy. Reusable: [subrata-samanta/Langgraph_AML_Detection](https://github.com/subrata-samanta/Langgraph_AML_Detection) (direct precedent), [jube-home/aml-fraud-transaction-monitoring](https://github.com/jube-home/aml-fraud-transaction-monitoring) (monitoring + case-management backbone), [IBM/Multi-GNN](https://github.com/IBM/Multi-GNN); data: [IBM/AMLSim](https://github.com/IBM/AMLSim); screening: [OpenSanctions yente](https://github.com/opensanctions/yente); entity resolution: [Splink](https://github.com/moj-analytical-services/splink).
- **Adoption roadmap.** Phase 1 offline pilot on historical/synthetic alerts (prove investigation-time reduction + STR-quality parity) → Phase 2 in-workflow co-pilot (analyst approves every disposition) → Phase 3 auto-close high-confidence FPs w/ sampling QA + FIU-template STR export.
- **Feasibility (3–4 wks).** High — synthetic AML datasets + mock systems remove data blockers; the investigation crew is mostly LangGraph + Claude + tool wiring atop an existing GNN. Demo: feed one alert → watch the crew investigate live across tabs → read the auto-drafted, evidence-linked STR.
- **Differentiators / caveat.** Attacks the real cost centre (investigation labour) with explainable, human-approved STRs vs "more alerts"; bridges Track 2 detection + Track 1 back-office automation; perfect PayNet/JurisTech fit. **Caveat:** crowded incumbents (NICE Actimize, Hummingbird, Quantexa) — differentiate on Malaysia/BNM typologies.
- **Citations.** [Investment scams MY (Tookitaki)](https://www.tookitaki.com/compliance-hub/unmasking-investment-scams-in-malaysia-a-growing-financial-crime-threat) · [AML false positives ~95% (Shufti)](https://shuftipro.com/blog/understanding-false-positives-in-aml-transaction-monitoring/) · [Hawk AI $56M / AML AI Overlay](https://finovate.com/hawk-raises-56-million-in-series-c-funding-to-help-banks-fight-financial-crime/) · [Verafin Entity Research Copilot](https://verafin.com/2025/06/artificial-intelligence-the-future-of-financial-crime-investigations-is-here/)

---

### 5.5 — IDEA T2-D · CreditSense (4.00 — best sponsor-mirror)

_An autonomous underwriting analyst that scores thin-file SEA borrowers with alternative data and explains every decision to the regulator._

- **Problem.** Malaysian/SEA digital lenders, BNPL & SME-finance must underwrite **thin-file, unbanked, gig** borrowers where bureau scores are missing/stale, while BNM expects **fair, explainable, non-discriminatory** decisions. Manual underwriting is slow; black-box ML is hard to defend; lenders lack **early-warning** signals to act _before_ default. **This is the exact problem Xenber sells against with its XEN Risk & Credit AI Engine** — maximal sponsor alignment.
- **Who pays.** Digital banks, licensed digital lenders, BNPL, SME-financing platforms, cooperatives/MFIs across Malaysia/SEA. They pay to raise approval rates on creditworthy thin-file applicants without raising losses, cut underwriting cost, and satisfy BNM fair-lending/explainability. **RM1–5/application scored + RM10k–40k/mo platform**; early-warning priced per active loan/month; paid POC on a historical book.
- **Solution.** Ingest an application + alternative data (cash-flow/transaction history, e-wallet/telco signals, SME invoices) → plan which data to pull and checks to run → compute an explainable risk score with **SHAP-style per-feature attributions** → generate an adverse-action-grade plain-language reason → run an **early-warning monitor** over the live portfolio for behavioral deterioration (income drop, rising revolving use, missed-pattern) and autonomously raise pre-default alerts + recommended interventions. Human officer approves edge cases.
- **Agentic angle.** A planning agent orchestrates underwriting: decides which alt-data tools to call per profile, invokes the scoring model + explainability tool, cross-checks fair-lending guardrails (disparate-impact heuristics), composes the reasoned decision; a separate **monitoring agent** runs on a schedule over the live book, reasons about each borrower's trajectory, and decides when to fire an early-warning alert + what intervention (restructure / contact / limit-reduce). _(Wrap the model in this loop so it clears the "meaningful agentic AI" bar — see risk.)_
- **Key features.** Thin-file scoring w/ alt-data (cash-flow, e-wallet/telco, SME invoices) · SHAP per-decision explanations + auto adverse-action/approval reason · **fair-lending disparate-impact guardrail** · autonomous early-default-warning monitor + interventions · credit-officer review console w/ full reasoning trail · demo: score live + show SHAP "why" + simulate the monitor catching a deteriorating borrower.
- **Sample stack.** Next.js underwriting console (application, score, SHAP waterfall, reason text) + portfolio early-warning dashboard; FastAPI + Postgres + Celery/cron monitor; **Claude Opus 4.8** as underwriting planner + adverse-action writer (turns SHAP into regulator-grade plain language) + monitoring reasoner + **Claude Sonnet 4.6** extraction; LangGraph; **LightGBM/XGBoost** + **SHAP**; optional GNN for SME-network risk. **Data:** [Home Credit Default Risk](https://www.kaggle.com/c/home-credit-default-risk), [Lending Club](https://www.kaggle.com/datasets/wordsforthewise/lending-club) + synthetic alt-data; mock CTOS/CCRIS bureau + e-wallet/telco connectors. Reusable: [mnds18/credit-risk-assistant](https://github.com/mnds18/credit-risk-assistant) (LLM+ML+RAG+SHAP), [itzsivasakthiiik/...SHAP-and-LIME](https://github.com/itzsivasakthiiik/Interpretable-Machine-Learning-for-High-Dimensional-Credit-Risk-Scoring-Using-SHAP-and-LIME), [open-risk/openRiskScore](https://github.com/open-risk/openRiskScore).
- **Adoption roadmap.** Phase 1 champion/challenger on a historical book (prove lift + explainability) → Phase 2 live scoring on a thin-file segment w/ officer approval → Phase 3 turn on the early-warning monitor; explicit fit for a **Xenber-style integration/resale**.
- **Feasibility (3–4 wks).** High on public credit datasets — LightGBM + SHAP is fast; the agentic + explanation layer is the differentiator and mostly prompt/tool work. Two-part demo (score-with-reasons + early-warning catch) is judge-friendly.
- **Differentiators / caveat.** Mirrors Xenber's flagship while adding regulator-grade auto-explanations + an **autonomous early-warning monitor** (acts before default, not just at origination); responsible-AI/fairness first-class. **Caveat:** least "agentic" of the field — must be wrapped in the underwriting/monitoring loop or it risks the Rule 4 penalty; lower demo-wow.
- **Citations.** [Xenber — Risk & Credit AI Engine](https://xenber.com/about-xenber/) · [Alt credit scoring SEA (FICO/Grab)](https://www.fico.com/blogs/Alternative-Credit-Scoring-Southeast-Asia) · [MSME finance gap (IFC)](https://www.smefinanceforum.org/data-sites/msme-finance-gap) · [Zest AI FairBoost](https://www.zest.ai/product/underwriting/) · [BNM credit quality H2 2025](https://www.malaymail.com/news/money/2026/03/31/bnm-reports-stronger-credit-quality-for-business-sector-in-second-half-of-2025/214528)

---

### 5.6 — IDEA T2-E · DeepShield (3.92)

_An autonomous verification agent that catches deepfaked faces, voices, and "CEO" video calls that defeat liveness and human judgement._

- **Problem.** GenAI deepfakes beat both human reviewers and legacy controls: a Singapore finance director approved a **US$499k transfer on a deepfaked "CFO" Zoom call** (Mar 2025); SEA syndicates integrate deepfakes + malware-as-a-service + stolen biometrics to bypass eKYC. Malaysia mandated eKYC liveness (Apr 2024) yet liveness + OTP increasingly fail against injection attacks and synthetic identities — which then become the mule accounts feeding the scam economy.
- **Who pays.** Digital banks/FIs doing high-volume remote onboarding (BNM eKYC mandate + synthetic-ID mule prevention) + corporate finance/treasury teams (BEC/CEO-fraud targets). A single deepfake breach is a six-figure loss or a regulatory finding. **RM0.50–3/verification + RM10k–40k/mo platform**; premium tier for the high-value-instruction guardrail.
- **Solution.** A multi-modal verification agent at two moments: (1) **eKYC onboarding** — orchestrate passive liveness, deepfake/injection-attack detection, document-tamper checks, synthetic-identity risk score (device, velocity, identity-graph reuse) → pass / step-up / reject with an evidence report; (2) **high-value-instruction verification** — when a payment instruction arrives via video/voice/email, run deepfake media analysis, cross-check vs policy + channel-history, and force out-of-band confirmation before release.
- **Agentic angle.** Orchestration agent plans which verification tools to run by context (onboarding vs instruction, media type, initial risk), invokes specialist detectors (face/voice deepfake, doc forensics, identity-graph, injection heuristics), reasons over conflicting signals, decides pass / step-up / out-of-band / reject, and **loops to gather more evidence** (e.g., trigger challenge-response) when uncertain; auto-compiles the audit report.
- **Key features.** Multi-modal deepfake detection (face/voice/video-call) + injection/liveness-spoof checks · synthetic-identity scoring (device/velocity/identity-graph reuse) · high-value-instruction guardrail (deepfake analysis + policy cross-check + forced out-of-band) · context-aware escalation to challenge-response · explainable evidence bundle per decision · side-by-side real-vs-deepfake demo.
- **Sample stack.** Next.js onboarding/verification + ops console + a mock "video-call instruction" screen; FastAPI + Redis + Postgres + object store; **Claude Opus 4.8** as orchestration/decision agent + audit writer, **Claude Sonnet 4.6** for fast contextual + instruction-vs-policy checks; LangGraph; **open deepfake/anti-spoof models as tools** (ONNX face anti-spoofing, ASVspoof audio detectors) + doc-forensics libs. **Data:** FaceForensics++-style + ASVspoof + sample genuine/spoofed media; synthetic identity-graph. **Infra:** Docker, GPU-optional (CPU ONNX for the demo), eKYC API/SDK. Reference: [code-philia/PhishVLM](https://github.com/code-philia/PhishVLM) (vision-language artefact analysis), [tmylla/Awesome-LLM4Cybersecurity](https://github.com/tmylla/Awesome-LLM4Cybersecurity) (sourcing detectors).
- **Adoption roadmap.** Phase 1 add as a risk signal alongside existing eKYC (advisory, no rejections) → Phase 2 step-up/reject on a risk slice → Phase 3 roll the high-value-instruction guardrail to corporate treasury clients.
- **Feasibility (3–4 wks).** Good — use open pretrained detectors as tools; the team builds the agentic orchestration + decision + audit layer, not detectors from scratch. Visually compelling demo. Scope: 1 onboarding path + 1 instruction-verification path + explainable report.
- **Differentiators / caveat.** Orchestrating agent fusing multi-modal signals + deciding under uncertainty + explaining itself, uniquely extending into the **deepfake-CFO/BEC instruction-verification** moment; ties synthetic-ID prevention to the upstream cause of mules. **Caveat:** deepfake detection is an accuracy arms race; crowded eKYC vendors.
- **Citations.** [Deepfake CEO scam SG (Tookitaki)](https://www.tookitaki.com/blog/deepfake-ceo-scam-singapore-2025) · [SEA cyber-fraud outpaces crackdown (UN/The Record)](https://therecord.media/southeast-asian-cyber-fraud-outpaces-crackdown-efforts-united-nations) · [UNODC cyberfraud SEA](https://www.unodc.org/roseap/en/2024/10/cyberfraud-industry-expands-southeast-asia/story.html)

---

## 6. Consolidated GitHub building blocks (reusable to ship fast)

**Agent orchestration (both tracks):** [LangGraph](https://github.com/langchain-ai/langgraph) (~35k ⭐ — best for explainable/auditable stateful graphs + human-in-the-loop interrupts — _recommended default_) · [CrewAI](https://github.com/crewAIInc/crewAI) (~54k — fast multi-role "crew" prototyping) · [OpenAI Agents SDK](https://github.com/openai/openai-agents-python) (~27k — minimal boilerplate, built-in guardrails/tracing, provider-agnostic) · [Pydantic AI](https://github.com/pydantic/pydantic-ai) (~18k — type-safe structured outputs; great for finance/compliance records) · [AutoGen](https://github.com/microsoft/autogen) (~59k).

**Workflow/app accelerators:** [n8n](https://github.com/n8n-io/n8n) (~193k — visual end-to-end automation w/ real connectors) + [self-hosted AI starter kit](https://github.com/n8n-io/self-hosted-ai-starter-kit) (one-command local stack, privacy story) · [Activepieces](https://github.com/activepieces/activepieces) (MIT, MCP-native) · [Dify](https://github.com/langgenius/dify) / [Langflow](https://github.com/langflow-ai/langflow) (no/low-code agent+RAG apps).

**Document/RAG (Track 1 heavy):** [Docling](https://github.com/docling-project/docling) (~62k — robust PDF→structured) · [Marker](https://github.com/datalab-to/marker) (high-fidelity tables) · [RAGFlow](https://github.com/infiniflow/ragflow) (~83k — citation-grounded RAG out of the box) · [Unstructured](https://github.com/Unstructured-IO/unstructured) · [MinerU](https://github.com/opendatalab/MinerU) (multilingual OCR — good for BM/Chinese docs).

**Domain backends (Track 1):** [ERPNext](https://github.com/frappe/erpnext) (act on a real GL) · [Frappe HRMS](https://github.com/frappe/hrms) · [CISO Assistant](https://github.com/intuitem/ciso-assistant-community) / [getprobo/probo](https://github.com/getprobo/probo) (GRC) · [Chatwoot](https://github.com/chatwoot/chatwoot) (helpdesk shell) · [HolmesGPT](https://github.com/HolmesGPT/holmesgpt) / [K8sGPT](https://github.com/k8sgpt-ai/k8sgpt) (AIOps) · [Microsoft Presidio](https://github.com/microsoft/presidio) (PII redaction — tangible responsible-AI control) · [Vanna](https://github.com/vanna-ai/vanna) (text-to-SQL).

**Fraud/AML/credit (Track 2):** datasets — [IEEE-CIS Fraud](https://www.kaggle.com/competitions/ieee-fraud-detection), [ULB Credit Card Fraud](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud), [PaySim](https://github.com/EdgarLopezPhD/PaySim) (mobile-money — DuitNow-like), [IBM/AMLSim](https://github.com/IBM/AMLSim), [Elliptic++](https://github.com/git-disl/EllipticPlusPlus), [Home Credit](https://www.kaggle.com/c/home-credit-default-risk), [Lending Club](https://www.kaggle.com/datasets/wordsforthewise/lending-club); pipelines — [Fraud Detection Handbook](https://github.com/Fraud-Detection-Handbook/fraud-detection-handbook) (correct end-to-end pipeline + simulator — _highest leverage_), [awslabs/sagemaker-graph-fraud-detection](https://github.com/awslabs/sagemaker-graph-fraud-detection); graph ML — [PyTorch Geometric](https://github.com/pyg-team/pytorch_geometric), [DGL](https://github.com/dmlc/dgl), [DGFraud](https://github.com/safe-graph/DGFraud), [PyGOD](https://github.com/pygod-team/pygod); monitoring/rules — [Tazama (LF)](https://github.com/tazama-lf/Full-Stack-Docker-Tazama), [jube](https://github.com/jube-home/aml-fraud-transaction-monitoring); screening/ER — [OpenSanctions yente](https://github.com/opensanctions/yente), [Splink](https://github.com/moj-analytical-services/splink), [dedupe](https://github.com/dedupeio/dedupe); explainability — [SHAP](https://github.com/shap/shap), [Evidently](https://github.com/evidentlyai/evidently), [imbalanced-learn](https://github.com/scikit-learn-contrib/imbalanced-learn); scam/phishing — [Phishing-URL-Detection](https://github.com/vaibhavbichave/Phishing-URL-Detection).

> **AI-layer note:** for every idea, default the model layer to the latest Claude models — **Claude Opus 4.8** for deep reasoning/critic/planning, **Claude Sonnet 4.6** for high-volume/low-latency classification & extraction — via the Anthropic API, orchestrated with LangGraph. This also fits the "responsible/explainable AI" theme (structured outputs, reasoning traces, human-in-the-loop interrupts).

---

## 7. Method, confidence & caveats

- **Recency:** figures are 2023–2026, weighted to Malaysia/SEA. Web research was conducted June 2026.
- **Directional stats** (flagged in-text): SOC alert/burnout figures, "~95% AML false positives," and the "RM54b true scam losses" estimate are vendor-survey or survey-based and should be presented as _directional_, not official.
- **Identity caveats:** the "Henry Goh" ↔ Xenber founder mapping and one judge's name spelling are uncertain — see [background-study.md](background-study.md). "TheBanq" (Shawn Chee's employer) could not be confirmed.
- **Scoring correction:** the automated synthesis truncated its Track 2 input; this document re-scored the four affected Track 2 ideas (ScamShield, AuditPilot, DeepShield, CreditSense) by hand under the published weights. Track 1 scores and MuleGuard are from full-description scoring. Treat the matrix as a decision aid, not gospel — and **reconcile against the official rubric in the event's Google Doc.**

---

## 8. Next step — lock in an idea

To proceed to the `<idea>-spec.md` (then `prd.md` + `trd.md`), pick one idea. To recommend the right fit I need:

1. **Track preference** — Track 1 (enterprise ops) or Track 2 (fintech risk)?
2. **Team size & skill mix** — how many people, and who covers AI/ML, backend, frontend, and business/pitch? (Drives feasibility — e.g., MuleGuard/AuditPilot reward graph/data-eng strength; ScamShield/LedgerPilot are lighter.)
3. **Risk appetite** — highest ceiling + tightest judge fit (**MuleGuard**), lowest build risk + best demo (**ScamShield**), or Track-1 safety (**LedgerPilot**)?

My default recommendation, absent other constraints: **MuleGuard** (best overall, best judge/sponsor fit) — or **ScamShield Agent** if the team is small/less technical and wants the safest, most emotionally compelling demo.
