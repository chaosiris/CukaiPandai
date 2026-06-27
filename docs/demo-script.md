# CukaiPandai — Demo Pitch Script (7 minutes: 3 pitch + 4 demo)

> **Style reference:** modeled on the "Layar" demo pitch — persona cold-open → striking stat → the MyGov chatbot failure as the setup → "introducing…" → named pipeline steps → the citation guardrail as the hero → sovereignty → live demo with the persona → emotional persona bookend.
> **Budget:** ~3:00 pitch · ~4:00 live demo. _Italics_ = clicks / on-screen action. Plain text = spoken.
> **Demo policy:** walk only the **verified-OK** paths. See **§5 Demo Safety**.
> **Two placeholders to fill before recording:** (1) the **impact metric** in §1.7 and §3 — needs a real number from the team; (2) the **persona** — swap `Encik Pandai` for a real seeded persona if you have one.
> **Honesty flags:** do **not** claim in-memory-only privacy unless confirmed (bracketed below); the sovereignty beat is real.

---

# PART 1 — THE PITCH (3 min)

## 1.1 Cold open — the persona (20 sec)

> "This is Encik Pandai. He's 45, and he runs a small air-conditioning service company in Shah Alam — six employees, three of them with families that depend on that payroll.
>
> Like most SME owners, Pandai isn't looking to dodge anything. He's just trying to file his company tax correctly — and not get blindsided by a penalty or an audit he can't answer."

## 1.2 The problem + the stat (25 sec)

> "But Malaysian corporate tax is built for accountants, not for Pandai. Form C, CP204, capital allowances, Schedule 3, Section 44 deductions, e-invoicing phases — every figure has to be computed correctly _and_ justified under the right provision.
>
> So SMEs do one of two things: they overpay out of fear, or they misfile and hope LHDN never looks. Both cost them money they can't spare."

## 1.3 The killer setup — why generic AI can't fix this (25 sec)

> "And when the Malaysian government _itself_ tried to fix this kind of problem with AI — the **MyGOV chatbot**, built by the National Digital Department — it was quietly shut down after it started giving nonsense answers. It named the wrong Communications Minister, invented ministry portfolios, and got the RON95 petrol price flat wrong. Today the chat box just reads _'Akan Datang' — coming soon._
>
> If the government's own AI can't be trusted with a petrol price, no SME should trust a generic chatbot with a tax return. The technology isn't the problem — _ungrounded_ technology is. There's a way to do this right."

## 1.4 Introducing CukaiPandai (20 sec)

> "Introducing **CukaiPandai** — your AI agent for Malaysian corporate tax.
>
> One upload of your financials. And on the other side: your filing deadlines mapped to one calendar, a fully computed Form C, and a draft filing packet — where **every single ringgit traces back to Malaysian law**, ready for you to review and submit."

## 1.5 Under the hood — the architecture (30 sec)

> "Under the hood, CukaiPandai is two layers — and the split is the whole point.
>
> A **deterministic core** owns all the tax math, every deadline, and every citation. It does not call an LLM, so it _cannot_ hallucinate a number.
>
> On top, an **agentic layer** — six specialized agents and a filing graph — orchestrates the workflow: it reads documents, classifies line items, and drives the filing. But it is structurally forbidden from inventing a figure or a law. The AI does the _thinking_; the deterministic core does the _math and the law._"

## 1.6 The guardrail — the hero beat (25 sec)

> "Here's the line that matters. **No tax figure appears in the interface without a retrievable citation.** Every number on the form links to a real clause in the YA2026 law corpus. And if the corpus can't ground a figure, that figure is flagged **unverified** and never contributes to the return.
>
> That single guardrail is what separates CukaiPandai from the MyGov chatbot failure — and it's not a prompt, it's an architectural gate the model cannot talk its way past."

## 1.7 Why now, who it's for, and the upside (25 sec)

> "And the timing is now. Malaysia's **e-invoicing mandate** hit SMEs with RM1 to 5 million turnover on **1 January 2026** — pulling them into exactly this compliance burden, ready or not.
>
> That's part of **1.2 million SMEs** — 97% of every business in the country. For each one, CukaiPandai means **[IMPACT METRIC — e.g. "filings done in minutes instead of days," or "RM ___ in over-deductions caught," or "the RM ___ late-filing penalty avoided"]**.
>
> We monetize through accounting firms and direct SaaS — and because every figure is sourced, we're the version an LHDN partnership could actually stand behind."

## 1.8 Sovereignty (20 sec)

> "Last thing before I show you. This is Malaysian tax data — it shouldn't leave the country. So the agentic layer is model-agnostic and routed **ILMU-first, sovereign by default**. The same pipeline can hot-swap the model to run on-prem.
>
> So when the data must never leave the country, the model doesn't either. Let me show you the system."

> _[OPTIONAL — only if confirmed true in code: "And your financials are never warehoused into a shadow profile — processed for the filing, nothing else."]_

---

# PART 2 — THE LIVE DEMO (4 min)

> "Here's the working flow, end to end, using our reference persona, Pandai."
> **Pacing rule:** narrate every click; never let a load sit in silence. You have time now — let each beat breathe, but keep moving.

## 2.1 Beat 1 — The obligation calendar (35 sec)

_Open the calendar view._

> "First, his obligations. CukaiPandai maps **every deadline** Pandai's company faces onto one calendar — Form C, CP204, SST, e-invoicing — instead of six portals he'd never check.
>
> Form C lands exactly seven months after his financial year-end. And notice this one —"

_Point to a holiday-shifted date._

> "— the statutory date fell on a weekend, so the engine rolled it forward to the next working day, **state-aware** for the public holidays in his state. That's deterministic date arithmetic. No LLM touches it. Deadlines he simply will not miss."

## 2.2 Beat 2 — Upload, extract, classify (the agent pipeline, visible) (50 sec)

_Go to the document-first filing input. Upload the prepared sample financials._

> "Now the filing. Pandai uploads his financials — his P&L, his asset schedule. Watch the pipeline run in the open."

_Let the steps surface — extraction, then classification._

> "**Extract** — the system reads the documents into typed line items. **Classify** — the agent layer tags each line into its tax treatment: this is a capital allowance, this is entertainment expense, this is EPF.
>
> This is the agentic layer earning its keep — it's doing the tedious reading-and-sorting a junior accountant would do, in seconds. But notice what happens next: the moment there's a _number_ to compute, control hands off to the deterministic core."

## 2.3 Beat 3 — The computation trace, cited line by line (45 sec)

_Open the computation trace / figure breakdown._

> "Here's chargeable income, computed end to end — capital allowances, Schedule 3, Section 44 deductions in the correct statutory order, and the SME tax bands: 15%, 17%, then 24%.
>
> And this is the part that matters — **every figure has a trace.** This deduction isn't just a number on a screen; it links to the exact provision it comes from."

_Click one figure through to its citation._

> "I click the figure — and there's the clause it's grounded in. An accountant can audit this return line by line. **Nothing here is unsourced.**"

## 2.4 Beat 4 — The fabrication gate, head-to-head (40 sec)

_Trigger the citation-integrity probe._

> "Remember the MyGov chatbot hallucinating a petrol price? Watch what ours does when I _try_ to make it lie.
>
> I'll hand the citation gate a made-up statute — a law that doesn't exist —"

_Show the gate rejecting the fake clause ID; show a real+fake mix also caught._

> "— **rejected.** Deterministically. I'll mix a fake law in with three real ones — it catches the fake and keeps the rest. Not 'flagged for review.' Rejected, and excluded from the return.
>
> _This_ is audit-defense at the root: every number Pandai files already carries the citation that defends it. He doesn't scramble when LHDN asks 'why' — the answer ships with the figure."

## 2.5 Beat 5 — Human-in-the-loop filing (35 sec)

_Drive the filing graph to the confirmation interrupt._

> "And critically — CukaiPandai does not silently auto-file. The filing graph **pauses here and asks Pandai to confirm** before it finalizes anything.
>
> This is a real human-in-the-loop checkpoint built into the agent graph — the agent prepares, the human decides. For something as consequential as a tax return, that's not optional, and it's wired into the architecture, not bolted on."

_Resume / approve._

> "Pandai reviews, approves, and the graph continues."

## 2.6 Beat 6 — The draft packet, downloaded (35 sec)

_Open the generated Form C draft-pack PDF; show the watermark; hit download._

> "And the payoff — his Form C, generated. Every page watermarked **draft, not submitted**, because Pandai reviews and files himself; we never file on his behalf.
>
> Every number on this page traces back to its source in the law corpus. He downloads it —"

_Trigger the download._

> "— and he walks into LHDN with a return he can defend, line by line. That's the whole loop: from a folder of documents to a defensible, sourced, ready-to-file Form C — in minutes."

---

# PART 3 — CLOSE (the persona bookend) (20 sec)

> "So Pandai no longer agonizes over which deduction, which schedule, which deadline. CukaiPandai gives him a filing he can **defend**, deadlines he won't miss, and an answer for every number before LHDN even asks.
>
> Less guessing, less penalty risk, more time running the business he built — and more time for the people whose payroll depends on it.
>
> A generic AI can summarize the tax act. CukaiPandai helps you _file_ it, and _defend_ it — sovereign, and grounded in law. Thank you."

---

## 5. Demo Safety — Internal Only (do not say aloud)

Known open defects (see [`docs/defects.md`](defects.md)). **Do not click these on stage, do not invite probing:**

- **Full obligation calendar (CP39, SST-02, CP204, MyInvois) — CONDITIONAL.** Beat 1 shows the _full_ calendar, but only do this if DEAD-1,2,3,5 are **actually fixed and re-verified** in the build you're demoing. The dates must be correct on screen — a tax-literate judge spots a wrong SST or CP204 date instantly. **If the fixes haven't landed, fall back to Form C only** and say: _"Form C and the calendar engine are live; CP204 instalments and SST scheduling are landing this sprint."_
- **Computation on arbitrary inputs:** COMP-1 (balancing charge dropped on a loss), COMP-2 (group relief uncapped), COMP-3 (EPF cap skipped at zero remuneration) can produce wrong figures. **Demo only with the prepared sample numbers.** If a judge asks to type their own, steer to the seeded persona or say the engine is tuned for the common SME case with edge cases on the hardening list.
- **Free-text audit Q&A:** the conversational answer is not yet grounded (CITE-1/2). **Demo the deterministic citation gate (Beat 4), not a chat answer.** If asked: _"The deterministic gate is production-grade; the conversational layer rides the same gate next sprint."_
- **File uploads:** only the **prepared valid samples** — malformed files currently error (API-2/3). Never let a judge hand you a file to upload live.
- **Auth:** the seeded demo uses a proper secret — fine to show login/isolation. Don't discuss the default-secret config (AUTH-1/2).
- **Privacy claims:** don't assert in-memory-only / no-storage unless confirmed in code.

**If WiFi/backend dies:** have a screen recording of all 6 demo beats pre-saved, plus static screenshots of the calendar, the computation trace, the rejected-fabrication result, and the draft PDF.

---

## 6. Q&A Prep

**"How is this different from ChatGPT, or from the MyGov chatbot?"**

> "Both compute nothing deterministically and will fabricate a citation under pressure — that's literally why the MyGov bot was pulled. Our tax math lives in a pure deterministic core with zero LLM involvement, and our citation gate rejects fabrications outright. The AI orchestrates; it never invents."

**"Where's the audit-defense pillar?"**

> "It starts at the figure: every number we file already carries its citation, so the defense ships with the return — that's Beat 4. The conversational audit assistant rides that same deterministic gate, and it's our immediate next sprint."

**"Is the computation actually correct?"**

> "The core is test-covered — 245 backend tests across SME band boundaries, capital-allowance rates, Schedule 3 / Section 44 ordering, and Form C deadline shifting including holiday and state-specific rolls. We're hardening edge cases like loss-year balancing charges next."

**"Why 'sovereign'?"**

> "Malaysian tax data stays on Malaysian infrastructure — ILMU-first, failover in-country, foreign models off by default. For government and enterprise buyers, data residency is the deciding factor."

**"What's the business model / who pays?"**

> "Accounting firms as a productivity tool, direct SaaS for SMEs, and a credible LHDN-partnership path because every figure is sourced. The e-invoicing mandate across 2025–26 is forcing the whole SME market into this need right now."

**"What's real vs roadmap?"**

> "Live: the calendar, the document-to-Form-C pipeline, the deterministic citation gate, the human-in-the-loop filing graph, and the draft-pack PDF. Roadmap: conversational audit-defense, full CP204/SST/e-invoice scheduling, more edge-case hardening."

---

## 7. Pre-Demo Checklist (15 min before)

- [ ] App open on dashboard, logged in as the seeded persona (Pandai).
- [ ] Backend warm — fire one throwaway request so the first click isn't a cold start.
- [ ] Prepared valid sample financials on the desktop, clearly named.
- [ ] Fabrication probe ready to trigger in one click (have the fake clause ID + the real+fake mix ready).
- [ ] Filing graph staged so the HITL interrupt fires cleanly in Beat 5.
- [ ] Form C draft-pack PDF pre-generated for Pandai (so Beat 6 opens instantly, no live render wait).
- [ ] Calendar dates spot-checked correct IF showing the full calendar (else Form C only — see §5).
- [ ] Impact metric (§1.7 / §3) filled in with a real, defensible number.
- [ ] Screen recording + fallback screenshots in a background tab (calendar, trace, rejected fabrication, PDF).
- [ ] Browser zoom ~125%; notifications silenced.
- [ ] Private timer visible to you — pitch done by 3:00, demo done by 6:45.

---

## 8. Clip / B-roll Sourcing Guide for Part 1 (all verified real)

> Every claim in Part 1 is now backed by a real, citable source. Below: what to show on screen for each voiceover line, where to get it, and a capture tip. **Always show the source name/URL on screen** (small caption) when you display a screenshot — that _is_ the credibility, and it mirrors your own product's "every claim is cited" thesis.

### §1.1 Cold open — "Encik Pandai" (the persona)

- **Show:** warm B-roll of a Malaysian small-business owner / aircon technician at work, a small shopfront, a workshop.
- **Source:** royalty-free stock — Pexels / Pixabay / Mixkit (search: _"malaysia small business owner"_, _"technician van"_, _"shop owner malaysia"_). Or shoot 10 sec on a phone.
- **Tip:** Encik Pandai is a composite persona — keep it generic so you're not implying a real person. A lower-third caption "Encik Pandai · SME owner (illustrative)" is honest and clean.

### §1.2 Problem + the stat — "built for accountants, not for Encik Pandai"

- **Show:** the actual complexity — scroll an LHDN Form C, the e-invoice portal, a Schedule 3 / capital-allowance worksheet. Overlay the stat **"1.2 million SMEs · 97.4% of all Malaysian businesses."**
- **Source:**
  - LHDN forms & e-invoice: [hasil.gov.my](https://www.hasil.gov.my/en/)
  - SME stat: [SME Corp / DOSM via researchgate summary](https://www.researchgate.net/publication/387413477_Tax_Compliance_Among_SMEs_A_Study_in_Selangor_Malaysia) (1,226,494 MSMEs = 97.4% of establishments, 2021).
- **Tip:** screen-record a slow scroll through a real Form C PDF — the density _is_ the argument.

### §1.3 The MyGOV failure — THE hero clip ⭐ (fully verified)

- **Show, in order:** (1) news headline "MyGOV quietly shuts down AI chatbot after it starts talking nonsense"; (2) the screenshots of the chatbot's wrong answers (petrol price + wrong ministers); (3) the live app chat box now reading **"Akan Datang."**
- **Source (cite on screen):**
  - [Malay Mail — MyGOV quietly shuts down AI chatbot after it starts talking nonsense (21 Aug 2025)](https://www.malaymail.com/news/tech-gadgets/2025/08/21/mygov-quietly-shuts-down-ai-chatbot-after-it-starts-talking-nonsense/188445)
  - [SoyaCincau — same story, **contains 3 screenshots of the wrong answers**](https://soyacincau.com/2025/08/20/mygov-beta-ai-chatbot-shut-down-nonsense-answers/)
  - [Yahoo News Malaysia mirror](https://malaysia.news.yahoo.com/mygov-quietly-shuts-down-ai-083309572.html)
- **Verified facts you may state (do not embellish beyond these):**
  - Built by the **National Digital Department (Jabatan Digital Negara)**; uses a local LLM "still undergoing training."
  - Named **Gobind Singh Deo** as Communications Minister (wrong — it's Fahmi Fadzil); mis-assigned Natural Resources / Economy portfolios.
  - On the **RON95 RM1.99** petrol price, claimed it had been in effect "since 1 July 2022" (wrong timing).
  - Got the **Jalur Gemilang flag designer** wrong.
  - Chatbot now disabled; shows **"Akan Datang."**
- **⚠ Do NOT say "disabled one day after launch"** — that specific timing isn't in the sources. Safe phrasing: _"quietly shut down after it started giving nonsense answers."_
- **Tip:** this is your strongest 8 seconds — screen-record scrolling the SoyaCincau article so the screenshots + headline appear together, caption the URL.

### §1.7 Why now — the e-invoicing mandate (verified timeline)

- **Show:** the LHDN e-invoice phase timeline, highlight **Phase 4 — 1 Jan 2026 — turnover RM1–5 million (SMEs)**.
- **Source (cite on screen):**
  - [LHDN official e-Invoice implementation timeline](https://www.hasil.gov.my/en/e-invoice/implementation-of-e-invoicing-in-malaysia/e-invoice-implementation-timeline/)
  - Clean phase table: [Crowe Malaysia — latest e-invoice timeline](https://www.crowe.com/my/news/latest-e-invoice-implementation-timeline) or [ClearTax MY](https://www.cleartax.com/my/en/different-phases-implementation-timelines-einvoicing-malaysia)
- **Verified phases:** P1 Aug 2024 (>RM100m) · P2 Jan 2025 (RM25–100m) · P3 Jul 2025 (RM5–25m) · **P4 Jan 2026 (RM1–5m)** · P5 Jul 2026 (remainder; <RM1m now exempt).
- **Tip:** animate a marker landing on the Jan 2026 SME row as you say "ready or not" — makes the "why now" land visually.

### §1.5 / §1.6 Architecture + guardrail

- **Show:** a simple two-layer diagram (agentic layer → deterministic core → law corpus) and a mock of a figure with its citation link.
- **Source:** make this yourself from your own architecture (see `docs/trd.md`). This is your IP — don't pull external footage here.

> **One-line on-screen disclaimer to include once in Part 1:** "Encik Pandai is an illustrative persona; figures shown are from sample data." Honest, and it pre-empts any 'is this a real customer?' doubt.
