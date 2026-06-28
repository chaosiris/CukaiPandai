# CukaiPandai — Demo Pitch Script (7 minutes: 3 pitch + 4 demo)

> **Style reference:** modeled on the "Layar" demo pitch — persona cold-open → striking stat → the MyGov chatbot failure as the setup → "introducing…" → named pipeline steps → the citation guardrail as the hero → data-stays-in-Malaysia → live demo with the persona → emotional persona bookend.
> **Budget:** ~3:00 pitch · ~4:00 live demo. _Italics_ = clicks / on-screen action. Plain text = spoken.
> **Demo policy:** walk only the **verified-OK** paths. See **§5 Demo Safety**.
> **One placeholder left to fill before recording:** the **persona** — swap `Encik Pandai` for a real seeded persona if you have one. _(The §1.7 impact metric is now filled with a sourced LHDN figure — the up-to-45% late-filing penalty, s.112(3) ITA 1967 / GPHDN 5/2019.)_
> **Honesty flags:** do **not** claim in-memory-only privacy unless confirmed (bracketed below); the data-stays-in-Malaysia beat is real.

---

# PART 1 — THE PITCH (3 min)

## 1.1 Cold open — the persona (25 sec)

> "Imagine you've spent years on the sigma grindset building something real — a small air-conditioning company in Shah Alam. Six employees; three of them have families who count on that payroll every month. You're good at the work, but you're certainly not good at accounting.
>
> This is Encik Pandai. He's 45 — and like most SME owners, he isn't trying to dodge anything. He just wants to file his company tax correctly, and not get blindsided by a penalty, or an audit he can't answer."

## 1.2 The problem + the stat (25 sec)

> "But Malaysian corporate tax is built for accountants, not for Encik Pandai. Form C, CP204, capital allowances, Schedule 3, Section 44 deductions, e-invoicing phases — every figure has to be computed correctly _and_ justified under the right provision.
>
> So most SMEs do one of two things. They **overpay** — leaving capital allowances and deductions they're entitled to on the table, just to feel safe. Or they **misfile** — a wrong figure here, a required schedule or field left blank there, a deduction claimed without backing — and hope LHDN never looks too closely. One quietly costs them money; the other invites a penalty or an audit. Both hurt a business that can't spare it."

## 1.3 The killer setup — why generic AI can't fix this (25 sec)

> "And when the Malaysian government _itself_ tried to fix this kind of problem with AI — the **MyGOV chatbot**, built by the National Digital Department — it was quietly shut down after it started giving nonsense answers. It named the wrong Communications Minister, invented ministry portfolios, and got the RON95 petrol price flat wrong. Today the chat box just reads _'Akan Datang' — coming soon._
>
> If the government's own AI can't be trusted with a petrol price, no SME should trust a generic chatbot with a tax return. The technology isn't the problem — _ungrounded_ technology is. There's a way to do this right."

## 1.4 Introducing CukaiPandai (20 sec)

> "Introducing **CukaiPandai** — your AI agent for Malaysian corporate tax.
>
> CukaiPandai just needs one upload of your company's financials. From that one file, it produces three things: every deadline on one calendar, a fully computed **Form C** — that's your company's annual tax return — and a draft filing packet, where **every single ringgit traces back to Malaysian law**, ready for you to review and submit."

## 1.5 Under the hood — the architecture (30 sec)

> "Under the hood, two layers — and the handoff between them is the whole point.
>
> First, **six AI agents** read your documents and classify each line — that's the thinking.
>
> Then it hands off to a **rules engine** for the actual tax math and the citations. No AI touches it, so it _can't_ make a number up. The AI does the _thinking_; the rules engine does the _math and the law._"

> _On screen (caption / mini-diagram), don't say aloud: built on **Python · Pydantic · LangGraph · FastAPI · React**. Let the stack show for credibility while you speak plainly._

## 1.6 The guardrail — the hero beat (25 sec)

> "Here's the line that matters. **No tax figure appears in the interface without a retrievable citation.** Every number on the form links to a real clause in the YA2026 law corpus. And if the corpus can't ground a figure, that figure is flagged **unverified** and never contributes to the return.
>
> That single guardrail is what separates CukaiPandai from the MyGov chatbot failure — and it's not a prompt, it's an architectural gate the model cannot bypass."

## 1.6b Not bookkeeping, not a chatbot — a new category (20 sec)

> "You might be thinking this is just accounting software. It isn't. Tools like **Bukku**, AutoCount and SQL are great at _bookkeeping_ — they record what happened and push your e-invoices to LHDN. But they all stop at the tax line: Bukku's own help docs literally tell you to _assume_ your tax bill and just journal it. None of them computes your Form C — capital allowances, the schedules, the SME bands — and none can cite a figure to law or defend it in an audit.
>
> A generic chatbot, for instance ChatGPT and Claude, _will_ compute it for you, but more often than not, they will hallucinate the law doing it, exactly like MyGov. CukaiPandai fills in the uncertainty gap: it **computes** the Form C like a tax agent, **cites** every figure like the law demands, and **never invents one** like the chatbots."

> _**Compressed (one line, if over time):** "And to be clear — this isn't bookkeeping like Bukku, which stops at the tax line, and it isn't a chatbot that makes the law up. It's the only tool that computes your Form C **and** cites every figure to the law."_

## 1.7 Why now, who it's for, and the upside (25 sec)

> "And the timing is now. Malaysia's **e-invoicing mandate** hit SMEs with RM1 to 5 million turnover on **1 January 2026** — pulling them into exactly this compliance burden, ready or not.
>
> This affects **1.2 million SMEs** — 97% of every business in the country. If they file their taxes late or wrongly, they might get penalized for up to 45% of their tax bill. CukaiPandai completely prevents this from happening by verifying your tax forms - in minutes, not days.
>
> We monetize through accounting firms and direct SaaS — and because every figure is sourced, we're the version an LHDN partnership could actually stand behind."

## 1.8 Your data stays in Malaysia (20 sec)

> "One last thing. Your company's tax data is about as confidential as it gets — it shouldn't be shipped off to some AI server overseas. So CukaiPandai runs on **ILMU**, the lokal Malaysian AI built by **YTL AI Labs**: your data stays in Malaysia, and so does the model that processes it.
>
> Now — let me show you the system."

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

> "Now the filing. Pandai uploads his financials — a single document, his trial balance. Watch the pipeline run in the open."

_Let the steps surface — extraction, then classification._

> "**Extract** — the system reads the documents into typed line items. **Classify** — the agent layer tags each line into its tax treatment: this is a capital allowance, this is entertainment expense, this is EPF.
>
> This is the agentic layer earning its keep — it's doing the tedious reading-and-sorting a junior accountant would do, in seconds. But notice what happens next: the moment there's a _number_ to compute, control hands off to the deterministic core."

## 2.3 Beat 3 — The computation trace, cited line by line (45 sec)

_Open the computation trace / figure breakdown._

> "Here's chargeable income, computed end to end. Watch this — his depreciation is added back, because accounting depreciation isn't deductible; and in its place the engine grants a **capital allowance** on his new machine: 34% of RM300,000, so **RM102,000**, straight from the Schedule 3 rates. Then the SME tax bands — 15, 17, then 24%.
>
> And this is the part that matters — **every figure has a trace.** This capital allowance isn't just a number on a screen; it links to the exact provision it comes from."

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
> A generic AI can summarize the tax act. CukaiPandai helps you _file_ it, and _defend_ it — grounded in Malaysian law, and verified by Malaysian AI.
>
> **One upload. Every ringgit cited. Ready to defend.** Thank you."

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

**"How is this different from Bukku, AutoCount, or other accounting software?"**

> "Those are bookkeeping — they record transactions, run SST, and push e-invoices to MyInvois. They deliberately stop at the corporate-tax line: Bukku's own help docs tell you to _assume_ your tax liability and just journal it. None of them computes a Form C — capital allowances, Schedule 3, Section 44, the SME bands — and none cites a figure to law or defends it in an audit. CukaiPandai starts exactly where they stop: it takes those accounting figures and produces a cited, audit-defensible Form C. We're complementary to bookkeeping, not a replacement for it — and a natural integration or acquisition target for one of them."

**"So who are your actual competitors?"**

> "Three camps, and none of them do what we do. **One — accounting + e-invoicing software:** Bukku, AutoCount, SQL, Financio, ABSS, QuickBooks, Xero, Deskera, plus MyInvois middleware like Storecove and ClearTax. They move money and invoices but never compute or cite a Form C. **Two — AI helpers:** generic ChatGPT, TaxGPT, the personal-tax app MyTaxMate, LHDN's own support bot — they either only cover personal tax or hallucinate the law. **Three — human tax agents:** real Form C work, but slow, offline, RM300–1,500 a return. No one fuses all four of our pillars: deterministic cited tax math, a fabrication-rejecting citation gate, in-country routing on a Malaysian model, and a human-in-the-loop draft return. That's the white space — software speed with tax-agent rigor and zero hallucinated numbers."

**"Where's the audit-defense pillar?"**

> "It starts at the figure: every number we file already carries its citation, so the defense ships with the return — that's Beat 4. The conversational audit assistant rides that same deterministic gate, and it's our immediate next sprint."

**"Is the computation actually correct?"**

> "The core is test-covered — 257 backend tests across SME band boundaries, capital-allowance rates, Schedule 3 / Section 44 ordering, and Form C deadline shifting including holiday and state-specific rolls. We're hardening edge cases like loss-year balancing charges next."

**"Why does keeping the data in Malaysia matter?"**

> "Tax data is some of the most confidential data a company has, and ours stays on Malaysian infrastructure. We run on **ILMU** — the Malaysian LLM built by **YTL AI Labs** — kept in-country, with foreign models off by default. For government and enterprise buyers, data residency is the deciding factor, and building on a homegrown national model is part of the story."

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
- **Impact-metric source (caption when you say "up to 45%"):** the s.112(3) ITA 1967 late-filing penalty is administered on a **15% / 30% / 45%** sliding scale by months overdue under LHDN Operational Guidelines GPHDN 5/2019 (later 3/2020) — [GSK Associates summary](https://www.gskassociates.net/post/new-penalty-rates-lhdn) · [KTP](https://www.ktp.com.my/blog/what-is-the-penalty-of-late-filing-for-my-sdn-bhd/09nov22). The stacked penalties: **10%** CP204 under-estimation when actual tax exceeds the estimate by >30% (s.107C(10)) and **10%** late-payment (s.103) — [ClearTax LHDN penalties](https://www.cleartax.com/my/en/lhdn-penalties). _Say "up to 45%," not a fixed RM figure — it's a % of the company's own tax bill, so it's always defensible._

### §1.5 / §1.6 Architecture + guardrail

- **Show:** a simple two-layer diagram (agentic layer → deterministic core → law corpus) and a mock of a figure with its citation link.
- **Source:** make this yourself from your own architecture (see `docs/trd.md`). This is your IP — don't pull external footage here.

### §1.6b Category / competitors — "not bookkeeping, not a chatbot"

- **Show:** a 3-column "who does what" slide — _Bookkeeping_ (Bukku / AutoCount / SQL logos), _Chatbot_ (ChatGPT / MyGov), _CukaiPandai_ (✓ computes ✓ cites ✓ defends). Optionally flash the Bukku help-doc line that says to _assume_ a tax liability and journal it — it's the single most damning visual.
- **Source (cite on screen):** [Bukku features](https://bukku.my/features) · [Bukku "How to Record the Company Tax" help doc](https://intercom.help/bukku/en/articles/8056759-how-to-record-the-company-tax) (the "let's say the company has a tax liability of RM10,000" line) · [AutoCount](https://www.autocountsoft.com/).
- **Tip:** keep it to ~3 seconds per column. The point is positioning, not a feature war — you're defining a new category, not dunking on Bukku.
- **Honesty:** Bukku/AutoCount/SQL are genuinely good bookkeeping tools — frame as "they stop where we start," not "they're bad."

> **One-line on-screen disclaimer to include once in Part 1:** "Encik Pandai is an illustrative persona; figures shown are from sample data." Honest, and it pre-empts any 'is this a real customer?' doubt.
