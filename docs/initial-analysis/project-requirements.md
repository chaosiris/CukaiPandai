# NexHack 2026 — Project Requirements

> Extracted from the three official event screenshots (Overview, Judges, Rules tabs). Items I could not read with full confidence are flagged **⚠ VERIFY** against the official rules/rubric document and Discord. Source of truth for rubric weights is the linked Google Doc (see [Key Links](#key-links)).

---

## 1. Event at a glance

| Field                     | Detail                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| **Event**                 | NexHack 2026                                                                                     |
| **Tagline**               | "Where AI Talent Builds the Future of Enterprise and Fintech"                                    |
| **Theme**                 | **Building Autonomous AI Workforce & Trusted Fintech Ecosystems**                                |
| **Host / Sponsor**        | **Xenber Sdn. Bhd.** — _sole sponsor_ and _physical final host_                                  |
| **Event window**          | 2 June 2026 → 10 July 2026                                                                       |
| **Eligibility geography** | Open to the public **in Malaysia**                                                               |
| **Format**                | Online preliminary round → **top 10 finalists** → one-day **physical final at Xenber Sdn. Bhd.** |
| **Team size**             | **1–3 members**                                                                                  |
| **Registration reward**   | +50 XP (platform gamification)                                                                   |

> ⚠ **Location note:** You mentioned "Singapore," but every signal in the brief points to **Malaysia** — "Open to the public in Malaysia," prizes in **RM (Malaysian Ringgit)**, sponsor/host **Xenber Sdn. Bhd.** (Sdn. Bhd. = a Malaysian private limited company), and judges from Malaysian firms (PayNet, Juris Technologies, Chin Hin). The physical final is at Xenber's office. Please double-check the venue city — this affects travel and the "local relevance" angle of your pitch.

---

## 2. Mission & judging philosophy (the most important section)

This event has an unusually explicit philosophy. The brief literally tells you how to win. Internalize these — they are the lens every judge will use:

- **"Build what the market will pay for."** Commercial viability is a first-class criterion, not an afterthought.
- **"Winning solutions don't just look impressive — they solve painful problems real organizations would adopt."** Pain severity + adoptability > flashy demo.
- **"Technical depth matters, and so does business depth: target customers, pricing, and a realistic adoption roadmap."** You must show _both_ engineering and go-to-market.
- **"Depth beats breadth."** One deep, working capability beats five shallow features.
- **"Ship solutions that survive beyond a one-day demo."** Production-mindedness, not throwaway prototypes.
- **"Practical AI systems for real enterprise operations and fintech trust problems."** Real workflows, real data shapes, real constraints.
- **Responsible AI:** must be **rational and explainable**, and **practical and realistic for adoption**.

### ✅ OFFICIAL JUDGING RUBRIC (130 marks total) — retrieved from the official Google Doc

| Criterion                                            | Marks  | %   | What they're scoring                                                                                  |
| ---------------------------------------------------- | ------ | --- | ----------------------------------------------------------------------------------------------------- |
| **Technical Architecture, Execution & Completeness** | **30** | 23% | Quality of architecture & implementation, **working prototype**, AI workflow, **agent orchestration** |
| **Market Adoption & Commercial Potential**           | **30** | 23% | Can organizations realistically **adopt** it? Clear **target market** + value proposition?            |
| **Innovation & Differentiation**                     | **30** | 23% | How **unique** is the approach vs **existing solutions**?                                             |
| **Problem Relevance & Impact**                       | **20** | 15% | Does it solve a real business/fintech problem? Is the pain **significant**?                           |
| **Presentation & Demonstration**                     | **20** | 15% | Pitch clarity, demo quality, **storytelling**, communicating value                                    |

> 🔑 **What the rubric tells you:** the three heaviest criteria are tied at **30 marks each — Technical Execution, Market Adoption, and Innovation/Differentiation** (69% combined). Two takeaways:
>
> 1. **Innovation/Differentiation is 23% of your score** → _originality is heavily rewarded._ "Yet another fraud detector / AML copilot / credit scorer" leaves ~30 marks on the table. **Build something the judges haven't seen.**
> 2. **Market Adoption (23%) + Problem (15%) = 38% is business/market** → named buyer, realistic adoption, value prop. Combined with the tiny cash prize (see §8), this is a _recruitment/incubation audition_ — build what Xenber would adopt or fund.
> 3. **Technical Execution (23%)** rewards a _real working prototype with genuine agent orchestration_ — not slideware, not a chatbot wrapper.
>
> Responsible/explainable AI isn't its own line item but is embedded in "controllable AI systems" (problem statement) and credibility under Technical + Adoption.

---

## 3. Tracks

You pick **one** track. Innovation must be driven by **meaningful use of Agentic AI, AI/ML, automation, workflow orchestration, or intelligent decision-making** (Rule 4) — not a thin chatbot wrapper.

### Track 1 — Agentic AI for Internal Enterprise Operations

Sub-domains called out: **HR, Finance, Compliance, IT Ops.**
The brief frames this as building a **"Autonomous AI Workforce"** — agents that actually _do_ internal back-office work, not just answer questions.

### Track 2 — Fintech Risk & Trust Intelligence

Sub-domains called out: **Fraud Detection, Anti-Money Laundering (AML), Credit Risk, Scam Prevention.**
Framed as building **"Trusted Fintech Ecosystems."**

---

## 4. Problem domains & notable pain points (overview)

> A deeply-cited, 2024–2026 treatment with market figures lives in `project-ideas.md`. This is the at-a-glance map of where the pain is.

### Track 1 — Internal Enterprise Operations

| Sub-domain           | Notable pain points (where the money/pain is)                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HR**               | High-volume résumé screening; slow, inconsistent onboarding; repetitive employee policy/leave/payroll Q&A swamping HR; compliance with labor/PDPA rules; offboarding & access revocation. |
| **Finance**          | Manual invoice/PO/receipt processing (AP); expense report review & policy enforcement; reconciliation and month-end close drag; procurement approvals; FP&A data wrangling.               |
| **Compliance / GRC** | Tracking regulatory change; mapping controls to evidence; audit-prep fire drills; contract & vendor risk review; internal investigations; data-privacy (PDPA) handling.                   |
| **IT Ops**           | L1 helpdesk ticket triage & resolution; incident detection/response (AIOps); access/identity provisioning; change management; fragmented internal knowledge.                              |

Cross-cutting pain: knowledge is scattered across systems; humans do high-volume, low-judgment work; current "automation" (RPA/macros) is brittle and breaks on exceptions — exactly where **agents that plan, use tools, and handle exceptions** add value.

### Track 2 — Fintech Risk & Trust

| Sub-domain          | Notable pain points                                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fraud Detection** | Real-time payment fraud; account takeover; rules-based systems are brittle and produce false positives; fraudsters adapt faster than static models.                                                                                   |
| **Scam Prevention** | Authorized-push-payment (APP) scams, investment/job/romance scams, **mule-account networks**, deepfake/GenAI-enabled social engineering — a severe and growing problem in Malaysia/SEA (NSRC 997, Semak Mule, National Fraud Portal). |
| **AML**             | Transaction-monitoring **alert fatigue** (very high false-positive rates), slow manual investigations, KYC/KYB onboarding friction, sanctions/PEP screening, SAR/STR drafting.                                                        |
| **Credit Risk**     | Thin-file / underbanked applicants; SME lending risk; need for **explainable, fair, auditable** credit decisions; alternative-data scoring.                                                                                           |

---

## 5. Deliverables (Preliminary round — due **26 June 2026, 11:59 PM**)

Per **Rule 6**, the preliminary submission requires **all** of:

1. **(a) Pitch deck** — placed _in your GitHub repository README_; must cover **problem, users, technical architecture, business case**.
2. **(b) A 7-minute demo video on YouTube** — must cover **both** the live app demo **and** presentation slides spanning: problem statement, solution, features, **technical architecture diagram**, **target market**, **pricing**, and **implementation roadmap** — with **both technical and business parts**. ⏱ **Hard penalty: −2 marks per 30 seconds over the 7-minute limit.**
3. **(c) GitHub repository** — the codebase (project must be built _within_ the prelim period; original work only).
4. **(d) Optional deployment link** — **localhost is acceptable**.

> The 7-minute video is the highest-leverage artifact: it is explicitly required to carry business depth (market, pricing, roadmap) _and_ technical depth (architecture diagram). Treat it as the actual judged pitch — and **rehearse to land at ≤7:00** (overruns are penalized −2/30s).

### Final round (Top 10 finalists)

Present a **working prototype**, **live demo**, **pitch deck**, and a **technical + business explanation** at the **physical final at Xenber Sdn. Bhd.** (Rule 8).

---

## 6. Rules summary

1. **Eligibility:** open to the public (students, fresh grads, working adults, domain experts, founders, engineers, designers, builders — all levels).
2. **Team size:** 1–3 per team. **Mixed teams** (engineering, AI/ML, product/UX, business, domain expertise) **encouraged**.
3. **Build window:** start after registration; submit anytime before the prelim submission period ends.
4. **Tech stack:** any language/framework/library/AI tool/API/cloud/DB is allowed — **but innovation must be driven by meaningful Agentic AI / AI-ML / automation / workflow orchestration / intelligent decision-making.**
5. **Original work:** must be developed within the prelim period; plagiarism/misrepresentation ⇒ **disqualification**.
6. **Preliminary submission:** as in Section 5.
7. **Responsible AI:** rational, explainable, practical, realistic for adoption.
8. **Final round:** top 10 present prototype + live demo + deck + tech/business explanation at the physical final.
9. **Judges' decisions are final.**

---

## 7. Schedule (✅ confirmed from official Google Doc)

| Milestone                           | Date / time                                              |
| ----------------------------------- | -------------------------------------------------------- |
| Registration opens                  | **2 June 2026**                                          |
| **Preliminary submission deadline** | **26 June 2026, 11:59 PM**                               |
| Online judging period               | **27 June – 3 July 2026**                                |
| **Top-10 finalists announced**      | **4 July 2026, 3:00 PM**                                 |
| **Physical final / pitch day**      | **10 July 2026, 10:00 AM – 4:00 PM** at Xenber Sdn. Bhd. |

**Working backward from 26 June:** registering in early June gives you roughly **3–4 weeks** to build the prelim MVP, then ~1 week (4–10 July) for finalists to polish the working prototype for the physical final. Scope accordingly — this drives the feasibility scoring in `project-ideas.md`.

---

## 8. Prizes (confirmed from clearer image)

| Placement                | Prize                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| 🥇 1st Place             | **RM 1,000**                                                        |
| 🥈 2nd Place             | **RM 600**                                                          |
| 🥉 3rd Place             | **RM 300**                                                          |
| ❤️ People's Choice Award | **RM 100** — most **likes by the end of the prelim judging period** |

**Total cash pool ≈ RM 2,000.** The cash is modest/symbolic. The _real_ prize is the next line:

> Beyond cash: **"Job opportunities await, and outstanding projects may be considered for further development and funding support"** (subject to terms).

> 🎯 **Strategic implication (important — this changes the optimal play):** With only ~RM2,000 cash on the table, the genuine incentive is **getting hired and/or having your project incubated/funded by Xenber.** Don't optimize for a flashy one-off demo — build something **Xenber would actually want to hire you to keep building**, i.e., aligned with their commercial line (their **XEN Risk & Credit AI Engine**, AIoT, enterprise/fintech software for Malaysian FIs/government/telco). Treat NexHack as a **paid audition / pre-seed pitch**, not a prize grab. This _strongly_ reinforces "adoptable, sellable, deployable" over "clever." See [background-study.md](background-study.md).

---

## 9. Judges (full background study in `background-study.md`)

| Judge                           | Role               | Organization                                          |
| ------------------------------- | ------------------ | ----------------------------------------------------- |
| **Henry Goh**                   | Founder            | Xenber Sdn. Bhd. (sponsor/host)                       |
| **Shawn Chee**                  | Fullstack Engineer | Thebanq (finance; "breaking & building on/off-chain") |
| **Hans Andreanto**              | Software Engineer  | Juris Technologies                                    |
| **Christopher Teo**             | Group PMO          | Chin Hin Group                                        |
| **Muhammad Rahman Abdul Manab** | Software Engineer  | PayNet (Payments Network Malaysia)                    |

> Quick read on the panel: it skews **engineer-heavy**, with deep **payments/fraud** (PayNet), **lending/credit** (Juris Technologies), **on/off-chain finance** (Thebanq), and **enterprise/PMO** (Chin Hin) lenses. Expect tough technical questions and a bias toward solutions that are _real_ and _adoptable in a Malaysian enterprise/fintech context_. Detailed per-judge "what they value / how to pitch them" analysis is in `background-study.md`.

---

## 10. Key links

- **Full details (problem statement, rules, rubric):** [official Google Doc](https://docs.google.com/document/d/1mfCPoE_JbULx2wT5r4opRg66zqqpk34WtoL1761WUhw/edit?usp=sharing) — ✅ **rubric & timeline retrieved** (see §2 and §7). Re-check it for any track-specific problem statements or fine print not captured here.
- **Discord support:** [discord.gg/PtZxcJZTT](https://discord.gg/PtZxcJZTT)
- **Registration:** via the event platform ("Register (+50 XP)")

---

## 11. Open items to confirm before locking scope

1. **Venue city** (Malaysia vs. Singapore) — see note in Section 1. _(Still worth confirming for travel; all signals say Malaysia / Xenber's office.)_
2. ~~Exact prize amounts~~ — ✅ **Confirmed:** RM1,000 / 600 / 300 + RM100 People's Choice (see §8).
3. ~~Exact rubric & weights~~ — ✅ **Confirmed:** 130-mark rubric (see §2).
4. ~~Exact schedule~~ — ✅ **Confirmed** (see §7).
5. **Track-specific problem statements / fine print** — re-skim the Google Doc in case individual problem prompts exist per track.
6. **Your team composition & skills** (1–3 people; who does AI/eng vs. business) — still TBD; determines feasibility and which idea to lock in.

_Companion files: `background-study.md` (sponsor & judges) and `project-ideas.md` (ideas + scoring/risk matrices). A second, originality-focused idea pass is in progress per your feedback._
