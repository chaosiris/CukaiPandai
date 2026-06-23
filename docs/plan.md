# PLAN

> Owned by **PL**. The PM presents this at **Gate 1** for the human to approve before any implementation.
>
> **Structure:** uniformly **phase-oriented** — top-level sections are PHASES in execution order, and **every task carries an explicit lane tag** in its heading. Completed work is summarized concisely under [`## Done`](#done). Design & decisions → [`cukaipandai-spec.md`](cukaipandai-spec.md); current status → [`progress.md`](progress.md).
>
> **Lane tags:** `[BE]` = backend · `[FE]` = frontend · `[DO]` = devops/infra (tooling · CI · deploy) · `[TD]` = testing & docs. A task is tagged by its **primary** lane; cross-lane touches are noted inline.
>
> **Phases:** **Phase 0** — Monorepo Restructure (devops/infra) → **DONE** (PR #1, merged to `main`) · **Phase 1** — AI layer + core gaps → **DONE** (BE-1…BE-4, TD-1/TD-2; 79 tests) · **Phase 2** — Frontend consoles · **Phase 3** — Deploy, demo & submission. See [`## Timeline / milestones`](#timeline--milestones) for the dated path to **28 Jun 2026**.

---

## Open Questions / Assumptions

_PL lists anything ambiguous here for the human to resolve at Gate 1. Phase-0 restructure questions **RQ1–RQ6 are RESOLVED**; the Phase-1 spike resolved **Q1** and partially **Q2**. The escalation decision **Q6 is RESOLVED at Gate 1 (pure-ILMU for the prelim)**. **Q3–Q5** remain open and resolve during their named tasks._

### Resolved this cycle (Phase-1 spike + Gate 1)

- [x] **Q1 (BE) — RESOLVED by the BE-1 spike.** Per-task routing is **decided**: `documents` (classify) and `deductibility` (cite) stay on `nemo-super`; the **citation-critic is the one weak step** (it answered NO on a clearly-supported s.33(1) claim live). `audit-defense` grounds correctly but its verdict is gated by the critic, so the critic is the single escalation point. _(Per Q6, escalation is deferred for the prelim — the critic runs on `nemo-super` and the deterministic gate carries the trust demo.)_
- [~] **Q2 (BE) — PARTIALLY RESOLVED.** ILMU early-access is **free during early access** (banner verified); whether tokens are **metered** under "Claw Starter ~RM27/seat/month" is **still unconfirmed** (treated as a seat/access fee per `[ASSUMPTION] A1`). Re-check `console.ilmu.ai/pricing` before the pricing slide (folds into **TD-3** + **TD-6**). Not a blocker.
- [x] **Q6 (BE) — RESOLVED at Gate 1 → PURE-ILMU for the prelim (stay fully sovereign).** For the 28 Jun submission CukaiPandai stays **100% on ILMU `nemo-super`**: the **fabricated-citation trust demo runs on the deterministic clause-ID gate** (`ground_citation`, no LLM), and we **accept `nemo-super`'s weaker semantic-critic** on the "valid claim shows ✓verified" badge. **Rationale:** (1) it makes the sovereignty story airtight — _every_ call is in-country, no asterisk; (2) the 4-day window favours cutting a non-critical integration; (3) it is **demo-safe** because the money-shot is the deterministic gate, which already works on pure ILMU. **Consequence:** **BE-5 (wire + live-test Claude escalation) is DEFERRED to post-prelim** — kept as a documented future task, **OUT of the 28 Jun critical path** (no `ANTHROPIC_API_KEY` / PAYG needed for the prelim).

### Carried feature questions (Q3–Q5, still open)

- [ ] **Q3 (FE)** — Can the Vite + React console reach demo quality in the time left, or do we narrate a partial UI + lean on the API/tests? → decide at the **FE-1** confirm-scaffold gate (the scaffold already exists from R-FE-2, so the risk is feature-completeness/polish, not boot).
- [ ] **Q4 (BE)** — Exact current-year MyInvois API paths + the SSM CSD field set (for the production upgrade). → `sdk.myinvois.hasil.gov.my/api`; SSM CSD plan is `[ROADMAP]`, **out of scope for the prelim**.
- [ ] **Q5 (TD)** — Re-`⚠verify` all YA2026 rates/thresholds/deadlines before the deck (Budget/gazette can change them). → reconcile vs LHDN/RMCD; provenance file already cites sources. Owned by **TD-6** (final ⚠verify pass).

---

## Phase 1 — AI layer + core gaps → **DONE** (79 tests pass)

> **COMPLETE.** BE-1 (ILMU-first `RoutingLLMClient` + JSON mode + live spike), BE-2 (HITL filing graph mounted over FastAPI: `…/filings/form-c/start` + `…/resume`), BE-3 (`assess_risk` → 4 deterministic checks, wired; `risk_flags` in responses), BE-4 (live MSIC `GET /reference/msic/{code}` via data.gov.my + holidays-backed deadline shift), TD-1 (prd/trd reconciled — the gate **TD-5** depended on), TD-2 (routing + endpoint tests). **79 backend tests pass.** Per-task routing decided (resolves Q1). Full detail → [`progress.md`](progress.md). **Carry-forward:** the Claude-escalation path is wired but stays dormant for the prelim — **Q6 resolved pure-ILMU**, so the critic runs on `nemo-super` and live-validating the escalation is the post-prelim **BE-5**; `shift_for_malaysian_holidays` lives in `deadlines.py` but is deliberately not wired into `derive_obligations` output (preserves the demo's golden due dates).

### BE-1 `[BE]` — AI-layer stack (ILMU-first routing) — **DONE**

- [x] Buy ILMU Claw Starter (RM27) — seat active, `sk-` key issued.
- [x] Run the 4-prompt spike (`nemo-super`) across profiler / documents / deductibility / audit-defense / citation-critic — per-task table captured in `progress.md`; weak step identified (**citation-critic**), resolving **Q1**. _(Claude head-to-head deferred — Q6 resolved pure-ILMU → post-prelim **BE-5**.)_
- [x] Build `RoutingLLMClient` (ILMU-first → Claude on error + on `escalate=True` for the critic) — unit tests cover primary / failover / escalate / no-fallback. _(The escalate path stays dormant for the prelim per Q6; the mechanism is retained for post-prelim BE-5.)_
- [x] Add `response_format={"type":"json_object"}` to `_OpenAICompatClient`; JSON-mode parses. Spike-driven fix: JSON agents constrained to `LawCorpus.ids()`; relaxed JSON parse via `api/jsonio.loads_relaxed`.

**Met:** ILMU-first routing with Claude failover, working JSON mode, per-task escalation decided.

### BE-2 `[BE]` — HITL LangGraph mounted on FastAPI — **DONE**

- [x] `POST …/filings/form-c/start` runs the graph to the human-approval `interrupt` → `{thread_id, computation, requires_approval, risk_flags}`; `POST …/resume` resumes via `Command(resume={approved})`. Module-level graph + `MemorySaver` persists the paused state across the two calls; unknown/finalized `thread_id` → 404. Golden `tax_payable` RM31,000 flows through both.

**Met:** the human-approval gate is reachable over HTTP, not just in tests. **Deploy note:** `MemorySaver` is in-process → **single Uvicorn worker on Render** (see **DO-2**).

### BE-3 `[BE]` — `assess_risk` deepened + wired — **DONE**

- [x] 4 deterministic checks: `turnover_mismatch` (>10% vs MyInvois), `negative_chargeable`, `gross_chargeable_gap` (honest gross-vs-chargeable gap; renamed from `high_deduction_ratio` in the audit), `zero_tax_positive_income`. Wired into the live `form-c` endpoint **and** the HITL `/start` (so the reviewer sees `risk_flags`). On seeded Acme (RM5m declared vs RM200k chargeable) the `gross_chargeable_gap` flag fires.

**Met:** `assess_risk` runs 4 checks and is invoked on the live API path(s).

### BE-4 `[BE]` — Real connectors (MSIC + holidays) — **DONE**

- [x] `MsicClient` (`api/connectors/msic.py`): level-based lookup vs **data.gov.my** (`?id=msic`, follow-redirects, cached singleton `get_msic`), fixture mode for offline tests; `GET /reference/msic/{code}` (404 on unknown). Live verified: `46900 → class 4690`. `core/deadlines.py` gains `malaysia_holidays()` + `shift_for_malaysian_holidays()` (offline `holidays` package).
- [ ] Docling doc ingestion `[ROADMAP]` — **out of scope for the prelim.**

**Met:** MSIC + holidays use real sources; Docling deferred to roadmap.

### TD-1 `[TD]` — Reconcile `prd.md` + `trd.md` — **DONE** _(the gate TD-5 depended on)_

- [x] prd/trd reflect: Vite/devkit frontend · deploy **Vercel + Render** · **team of 3** · MyInvois **full fixture** + MSIC live · **ILMU-first** routing · uv + `backend/`+`frontend/` monorepo. No stale Next.js/shadcn/two-dev/Default-Claude remnants.

**Met:** prd/trd match the current architecture and team decisions.

### TD-2 `[TD]` — Tests for routing + new endpoints — **DONE**

- [x] Tests for `RoutingLLMClient` + the new endpoints (routing, JSON-mode, graph start/resume, risk, MSIC, jsonio); suite green at **79**.

**Met:** new routing + endpoints are covered and the suite is green.

---

## Phase 2 — Frontend consoles

> All `[FE]` (the Vercel deploy is split out to **DO-1**). Builds on the **R-FE-2** scaffold (Phase 0, done) + the live Phase-1 backend (HITL start/resume, `risk_flags`, MSIC reference, audit-defense 502-on-unparseable). **Gating task: FE-1.** **Reality check (verified this session):** the existing `frontend/src/api/client.ts` only has `getObligations` / `getFormC` (synchronous) / `getAuditDefense` — it does **NOT** yet have HITL `start`/`resume`, MSIC, or the `risk_flags` field, and **no backend response exposes which model/route ran** (so the live sovereign indicator needs **BE-6** first — see **FE-5**). These gaps are the substance of Phase 2.

### FE-1 `[FE]` — Confirm scaffold + extend the typed client to the real surface _(gating)_

**Purpose:** Get the existing Vite + React console shell building, then bring the typed API client up to the **actual** Phase-1 backend surface so every later console has real methods to call.

**Implementation:**

- [ ] Confirm the **R-FE-2** scaffold boots: `cd frontend && bun install && bun run dev` (Vite + React + RR7 + `tokens.css`); `tsc --noEmit` + `bun run build` clean → verify: dev server serves `/obligations`, `/filing`, `/audit-defense`; build is green.
- [ ] Extend `frontend/src/api/client.ts`: add `startFiling(tin, ssm, line_items)` → `{thread_id, computation, requires_approval, risk_flags}` and `resumeFiling(tin, thread_id, approved)` → `{approved, computation}`; add `getMsic(code)`; add `risk_flags: RiskFlag[]` to the `FormCResponse`/start types; add a `RiskFlag` type (`{check, triggered, message, ...}` mirroring `api/agents/audit_risk.py`) → verify: `tsc --noEmit` clean; mock-mode fixtures exist for each new method.
- [ ] Keep **mock mode** (`VITE_API_MOCK=1`) mirroring every endpoint schema incl. the new HITL + MSIC + risk shapes → verify: all three routes render end-to-end in mock mode (resolves **Q3** at this gate).

**Acceptance criteria:** `frontend/` boots with 3 routed consoles; the typed client covers **all** shipped endpoints (obligations, form-c, form-c/start+resume, audit-defense, reference/msic) with mock fixtures and clean types.

### FE-2 `[FE]` — Obligation Calendar console

**Implementation:**

- [ ] Render the seeded entity's derived obligation set (Form C + CP204 + any seeded e-invoice/SST/employer rows) as a calendar/list with `due_date`, `form`, `status`, `rule_id` → verify: Acme calendar renders from the obligations endpoint (mock + live).
- [ ] Pre-seed a couple of obligations so the calendar doesn't look thin (per spec §6.2 "weak beat" mitigation) → verify: ≥3 obligation rows show.

**Acceptance criteria:** Obligation Calendar displays the seeded obligations with form/deadline/status, populated enough to demo well.

### FE-3 `[FE]` — Cited Filing Studio (+ human-approval gate + risk flags)

**Implementation:**

- [ ] Render Form C with `tax_payable RM31,000` and **per-figure citation traces** — each field shows `value` + `inputs` + `rule_id` + `config_version` (the `FigureTrace` money-shot) → verify: every field shows its trace.
- [ ] Surface the **`risk_flags`** returned by `/start` (and `/form-c`) so the reviewer sees audit-risk context before approving — show the `gross_chargeable_gap` flag firing on Acme → verify: at least one risk flag renders.
- [ ] Wire the **HITL approval gate** to `startFiling` → render the interrupt → `resumeFiling(approved=true)` resumes and shows the finalized computation → verify: approval resumes the graph and the studio reflects the approved result (uses BE-2).

**Acceptance criteria:** Form C renders with traceable figures, visible risk flags, and an interactive approval gate that drives the real `/start`→`/resume` graph.

### FE-4 `[FE]` — Audit-Defense console (hero) + live fabricated-citation rejection

**Implementation:**

- [ ] Turn a pasted query (e.g. _"Justify your RM4,800 repairs deduction"_) into a cited `DefensePack` — render `items`, `citations` (claim ↔ `clause_ids` ↔ `verified`), and the `exposure_note` (s.112/113) → verify: cited pack renders from the audit-defense endpoint.
- [ ] Show the **verifier rejecting a fabricated citation live** — a claim citing a clause-ID **not in the corpus** renders `verified=false` and is visibly blocked (this is the deterministic `ground_citation` gate — **the prelim trust money-shot, runs on pure ILMU per Q6**) → verify: a fabricated citation is visibly rejected in the UI.
- [ ] Handle the controlled **502** from `/audit-defense` (unparseable model output) gracefully (don't white-screen) → verify: a forced 502 shows a friendly error, not a crash.

**Acceptance criteria:** Audit-Defense produces a cited pack, visibly rejects a fabricated citation, and degrades gracefully on a model-parse failure.

### FE-5 `[FE]` — Live sovereign-mode indicator _(depends on BE-6)_

> **RESOLVED at Gate 1 → live, not hardcoded.** The indicator binds to the real `sovereign`/`active_model` field that **BE-6** adds to AI responses. Under the **pure-ILMU** decision (Q6) it will truthfully read **"sovereign — ILMU `nemo-super`"** for every call — BE-6 still earns its place by making that claim **evidence-backed** (read off the actual route the request took) rather than a hardcoded label. **Sequence: BE-6 → FE-5.**

**Implementation:**

- [ ] Read the `sovereign`/`active_model` field from BE-6 and render an "in-country (ILMU `nemo-super`)" badge in the console chrome (the field is the source of truth, so if a route ever escalated it would read "Claude" honestly) → verify: the indicator reflects the **actual** per-request route reported by the backend, showing sovereign-ILMU for the prelim's pure-ILMU calls.

**Acceptance criteria:** UI shows the real, backend-reported route for each AI call — sovereign (ILMU) for the prelim — sourced from BE-6's field, not a constant.

### FE-6 `[FE]` — Swap mock → live API

> The Vercel **deploy** half is split out to **DO-1** (Phase 3). This task sequences the live-API swap only.

**Implementation:**

- [ ] Point the typed client at the live API (`VITE_API_MOCK=0`, `VITE_API_BASE_URL=<render url>`) → verify: all consoles (obligations, filing+HITL, audit-defense) work against real endpoints with CORS configured (cross-lane: confirm FastAPI CORS allows the Vercel origin — coordinate with **DO-2**).

**Acceptance criteria:** Consoles run on the live API end-to-end (deploy handled by **DO-1/DO-2**).

### FE-7 `[FE]` — Styling pass to the devkit design tokens _(polish; first cut candidate)_

**Implementation:**

- [ ] Polish to the ProofRank devkit tokens (the **real** `tokens.css` copied in R-FE-2) — use the existing devkit classes (`.window`, `.titlebar`, `.req-list`, `.evidence`, `.verified-stamp`, `.barber`) consistently across the 3 consoles → verify: consoles match the design system; `bun run build` stays green.

**Acceptance criteria:** UI is consistent with the devkit token system and still builds clean. _(This is polish — see the Timeline cut list; functional styling from FE-1…FE-4 suffices for the demo if a day slips.)_

---

## Phase 3 — Deploy, demo & submission

> Mixed `[DO]` + `[TD]` + one in-scope `[BE]` (BE-6) and one deferred `[BE]` (BE-5). The final path to the **28 Jun** submission: **deploy is committed** — both services go up (**DO-2** BE → Render, **DO-1** FE → Vercel) and are smoke-verified end-to-end (**DO-3**); the deck + demo script; a dry-run; record/verify/submit; plus **BE-6** (active-route field powering the live FE-5). The deploys (**DO-1/DO-2/DO-3**) are prerequisites for the live-demo recording in **TD-4**. **BE-5 (Claude escalation) is DEFERRED post-prelim** (Q6 = pure-ILMU). See [`## Timeline / milestones`](#timeline--milestones) for what is **critical-path** vs **cut-first**.

### DO-2 `[DO]` — Deploy BE → Render _(committed; do this first — FE depends on its URL)_

> Re-sequenced **ahead of DO-1**: the FE live-swap (**FE-6**) needs the Render URL, so the backend deploys first. The Docker image is already Render-deployable as-is.

**Implementation:**

- [ ] Create the Render service from `backend/` (Docker), set env (`LLM_*`, ILMU `sk-` key; **no `ANTHROPIC_API_KEY` needed** for the prelim per Q6), **`--workers 1`** (MemorySaver is in-process, per BE-2) → verify: deployed `/health` returns `{"status":"ok"}`.
- [ ] Configure CORS to allow the Vercel origin (cross-lane with FE-6) → verify: a browser request from the Vercel preview is not CORS-blocked.

**Acceptance criteria:** the BE is deployed to Render, `/health` passes, single worker, CORS open to the FE origin.

### DO-1 `[DO]` — Deploy FE → Vercel _(committed)_

> Sequence after **FE-6** points the client at the live Render API.

**Implementation:**

- [ ] Deploy `frontend/` to Vercel (Bun build), set `VITE_API_BASE_URL=<render url>`, `VITE_API_MOCK=0`, `VITE_SOVEREIGN` → verify: preview URL loads and the consoles run against the live API.

**Acceptance criteria:** the FE is deployed to Vercel and the preview URL drives the live backend.

### DO-3 `[DO]` — Deploy smoke / integration verify _(committed)_

**Purpose:** Prove the two deployed services actually talk end-to-end before the demo recording — not just that each is individually "up".

**Implementation:**

- [ ] Run the full demo path against the **deployed** stack: obligations → cited Form C (HITL start → approve → resume) → audit-defense (cited pack + fabricated-citation rejection) from the Vercel URL hitting Render → verify: each beat returns correctly over the network (no CORS, no cold-start timeout, golden `tax_payable RM31,000` and the live citation-rejection both reproduce).

**Acceptance criteria:** the deployed FE+BE complete the whole demo flow end-to-end, capturing any prod-only breakage early.

### BE-6 `[BE]` — Surface the active route on responses _(committed; prerequisite for the live FE-5)_

**Purpose:** Make the sovereign-mode indicator **live and evidence-backed** by reporting which client actually served each request. Under Q6 (pure-ILMU) this reports sovereign-ILMU for every call — but read off the real route, not hardcoded.

**Implementation:**

- [ ] Have `RoutingLLMClient` record the route it took (`last_provider` / whether it escalated) and add a `sovereign: bool` + `active_model: str` field to the AI-backed responses (`/audit-defense`; and `/filings/form-c*` if a model runs) → verify: the field reports `nemo-super` / sovereign=true for the prelim's pure-ILMU calls; existing tests stay green (add a small test asserting the field is present and correct).

**Acceptance criteria:** AI responses report the active route so **FE-5** binds a live indicator; suite stays green.

### TD-3 `[TD]` — Pitch-deck README + demo script

**Implementation:**

- [ ] Write the pitch-deck README (problem / market / **pricing** / roadmap) — fold the YA2026 figures, the ILMU pricing caveat (Q2/A1), the **pure-ILMU sovereignty story** (every call in-country; Claude escalation is a documented roadmap item — BE-5), and the "decision-support, not legal advice" guardrail → verify: README covers all four sections.
- [ ] Write a **≤7:00 demo script** ordered for impact per spec §6.2: cited Form C → audit-defense pack → fabricated-citation rejection (the deterministic trust money-shot) → sovereign-by-default framing (live FE-5 badge) → HITL approval → verify: written script maps to the live console beats.

**Acceptance criteria:** a pitch-deck README and a beat-by-beat ≤7:00 demo script both exist.

### TD-4 `[TD]` — Demo dry-run + record + final verify + submit

> The deploys are **DO-1/DO-2** and the integration check is **DO-3**; this task is the **rehearse → record → final ⚠verify → package/submit** pass. Depends on DO-1/DO-2/DO-3 being green.

**Implementation:**

- [ ] **Demo dry-run:** run the demo script live against the deployed stack and **time it** → verify: the run lands **under 7:00** and every scripted beat works on the deployed URLs.
- [ ] Record the YouTube video from the dry-run → verify: final cut is **≤7:00**.
- [ ] **Final `⚠verify` pass** on all figures (closes **Q5/TD-6**) — reconcile every rate/threshold/deadline + the seeded Acme figures vs LHDN/RMCD → verify: every figure reconciles to its cited source.
- [ ] Submit **repo + README deck + YouTube + Vercel link** → verify: submission received **before 28 Jun**.

**Acceptance criteria:** a timed dry-run, a ≤7:00 video, verified figures, and a completed submission with both services live.

### TD-5 `[TD]` — Expand the plan through submission — **DONE**

- [x] After **TD-1**, flesh out every remaining BE/FE/DO/TD task with steps, `→ verify` checks, acceptance criteria, and a dated timeline slot through 28 Jun; resolve Q1/Q2, raise then (at Gate 1) **resolve Q6 (pure-ILMU)**, fold the Gate-1 deploy + live-FE-5/BE-6 decisions, and tick Phase 1 → Done → verify: every task from today to 28 Jun has a lane tag, acceptance criteria, and a timeline slot. _(This document; Gate-1 decisions folded.)_

**Met:** `plan.md` covers all work from now to the 28 Jun submission, lane-tagged with acceptance criteria and a timeline, with the four Gate-1 decisions folded in.

### TD-6 `[TD]` — Final ⚠verify of YA2026 figures _(resolves Q5)_

> Folded into the **TD-4** record/verify pass but tracked as its own ID because it has a distinct owner (the product/tax-verify contributor) and a hard gate (no unverified figure ships).

**Implementation:**

- [ ] Re-`⚠verify` SME bands (15/17/24%), the RM1m e-invoice exemption, CP204/Form C deadlines, and the seeded Acme `tax_payable RM31,000` vs current LHDN/RMCD sources; update the provenance file if anything moved → verify: each figure has a current, cited source; any change is reflected in `ya_2026.yaml` + provenance.

**Acceptance criteria:** all demo-visible YA2026 figures are re-verified current and cited before the deck/video; resolves **Q5**.

### BE-5 `[BE]` — Wire + live-test the Claude escalation — **DEFERRED post-prelim** _(NOT on the 28 Jun critical path)_

> **Q6 resolved pure-ILMU**, so this is a **documented future task**, not prelim work. The `escalate=True` mechanism already exists in `RoutingLLMClient`; this task lights it up once a Claude route is provisioned **after** the submission.

**Implementation (post-prelim):**

- [ ] Provision a Claude route (direct `ANTHROPIC_API_KEY`, or ILMU PAYG/tier if on-platform Claude is wanted to preserve sovereignty), confirm `make_llm()` wraps ILMU in the router with the live fallback, and harden `_AnthropicClient` JSON-mode/escalate forwarding → verify: a live critic call on a **valid** s.33(1) claim returns verified=true via the escalation path; the deterministic fabricated-citation rejection is unaffected.

**Acceptance criteria (post-prelim):** the citation-critic's "valid claim ✓verified" badge is reliable via the escalation path. **For the prelim this is intentionally NOT done** — the deterministic gate carries the trust demo on pure ILMU.

---

## Timeline / milestones

> **Today = 24 Jun 2026; deadline = 28 Jun 2026 → 4 working days (Wed–Sun).** Net change from Gate 1: **deploy (DO-1/2/3) + BE-6 + live FE-5 are now committed** (more work), while **BE-5 is cut** to post-prelim (less work). Phase 1 (the hard backend) is done, so the risk is concentrated in **frontend feature-completeness + the two-service deploy + recording**, not the logic (spec §6.2: "the risk is entirely the UI, not the logic"). Dates are targets; the **critical path** is marked ★.

| Day | Date       | Lane focus | Milestone (critical-path ★)                                                     | Tasks                                                                                              |
| --- | ---------- | ---------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Wed | **24 Jun** | FE (+BE)   | ★ Console boots + typed client covers the real surface (HITL/MSIC/risk)         | **FE-1**; **BE-6** (small, parallel — backend lane is otherwise free)                              |
| Thu | **25 Jun** | FE         | ★ Three consoles render the real beats end-to-end in mock mode; live FE-5 badge | **FE-2, FE-3, FE-4, FE-5** (FE-5 needs BE-6 from Wed); **TD-3** (deck/script) in parallel          |
| Fri | **26 Jun** | FE → DO    | ★ Live-swap + both services deployed and talking                                | **FE-6**; **DO-2** (Render) then **DO-1** (Vercel); **DO-3** smoke; **FE-7** styling only if ahead |
| Sat | **27 Jun** | TD         | ★ Timed dry-run + record + final ⚠verify                                        | **TD-4** dry-run + record, **TD-6** ⚠verify                                                        |
| Sun | **28 Jun** | TD         | ★ **SUBMIT** (repo + deck + video + Vercel link) — **buffer/contingency day**   | **TD-4** submit                                                                                    |

**Critical path:** `FE-1 → {FE-2,FE-3,FE-4} → FE-6 → DO-2 → DO-1 → DO-3 → TD-4 (dry-run→record→submit)`. **BE-6→FE-5** runs as a small parallel side-branch (BE-6 Wed, FE-5 Thu) and merges before recording; it is committed but not on the longest path.

**Prelim-critical vs cut-first (if a day slips):**

- **Prelim-critical (committed):** FE-1, FE-2, FE-3 (incl. HITL gate), FE-4 (incl. the live deterministic fabricated-citation rejection — the trust money-shot), FE-5, FE-6, BE-6, DO-1, DO-2, DO-3, TD-3, TD-4, TD-6.
- **Cut-first if behind (in priority order):** (1) **FE-7** styling polish — functional token-CSS from FE-1…FE-4 already presents acceptably; (2) **FE-5/BE-6** live binding — if BE-6 can't land, FE-5 falls back to a static "sovereign — ILMU `nemo-super`" badge (truthful under pure-ILMU) and BE-6 moves post-prelim; (3) the broader depth of the **TD-3** deck (keep the script, trim slides). **BE-5 is already cut** (post-prelim).
- **Localhost contingency (deploy is committed, but keep the safety net):** prd/trd both state _localhost is acceptable for the prelim_. If Render/Vercel slips on Fri, record TD-4 against localhost and submit, then finalize the deploy. This de-risks Day 26–27 without dropping the committed deploy goal.

**Realism flag (explicit).** The committed scope is **achievable but tight** for a team of 3 over 4 days, and tighter than the pre-Gate-1 plan because deploy + BE-6 + live FE-5 were added while only BE-5 was removed (a small net increase, since BE-6 is ~20–40 lines and deploy is largely config on a Render-ready image). The realistic pressure points: **(a)** FE-3's HITL start/resume wiring is the most intricate FE piece — if it lags, it compresses Thu; **(b)** first-time **Render cold-start + CORS** can eat Fri afternoon — DO-3 exists precisely to surface that early, and the localhost contingency covers a Friday deploy miss; **(c)** doing FE-2/3/4 **all** on Thu assumes the FE owner is unblocked all day — if not, FE-4 (the hero) takes priority over FE-2 (the weakest beat). Net assessment: **the critical path holds with Sunday as a genuine buffer**, provided FE-1 lands clean on Wed and BE-6 is done Wed in parallel. If Wed slips, cut FE-7 first and treat FE-5/BE-6 as the next lever.

---

## Done

> Completed work, terse. Full detail lives in [`progress.md`](progress.md). `[DECISION]` lines are PO-locked and must not be dropped.

### Phase 1 — AI layer + core gaps (BE-1…BE-4, TD-1/TD-2; merged to `main`)

ILMU-first AI layer landed and live-verified; **79 backend tests pass** (40 → 79). **BE-1:** `RoutingLLMClient` (ILMU-first → Claude on error / on `escalate=True` for the critic), `_OpenAICompatClient` JSON mode, `api/jsonio.loads_relaxed`, live spike (`scripts/spike_ilmu.py`) — per-task routing decided (resolves Q1). **BE-2:** HITL filing graph mounted — `POST …/filings/form-c/start` + `…/resume` (module-level graph + in-process `MemorySaver` → single Uvicorn worker). **BE-3:** `assess_risk` → 4 deterministic checks (`turnover_mismatch`, `negative_chargeable`, `gross_chargeable_gap`, `zero_tax_positive_income`), wired into `form-c` + `/start` (`risk_flags` in responses). **BE-4:** live MSIC `GET /reference/msic/{code}` (data.gov.my, cached singleton) + `holidays`-backed deadline-shift helpers in `core/deadlines.py`. **TD-1:** prd/trd reconciled to current decisions. **TD-2:** routing + endpoint tests green. **Carry-forward:** the Claude-escalation mechanism exists but is dormant for the prelim (Q6 = pure-ILMU; live-validation is post-prelim BE-5); holiday-shift not wired into obligation output (preserves golden due dates).

- **[DECISION] AI-layer feasibility CONFIRMED (live-verified)** — `nemo-super` runs the core loop sovereign-by-default: documents-classify ✓, deductibility cite verifies `ITA-1967-s33(1)` ✓, all agents parse JSON live. The **only** weak step is the citation-**critic** (false-negatived a valid claim). The fabricated-citation money-shot is the **deterministic clause-ID gate** (no LLM) → works on pure ILMU.
- **[DECISION] Q6 → PURE-ILMU for the 28 Jun prelim (Gate 1).** Stay 100% sovereign: the deterministic clause-ID gate carries the trust demo; `nemo-super`'s weaker semantic-critic is accepted on the "valid claim ✓verified" badge. **Claude escalation (BE-5) is deferred post-prelim** — out of the critical path, no Claude key/PAYG needed for the prelim. Rationale: airtight sovereignty story + 4-day window + demo-safe (money-shot is the deterministic gate).

### Phase 0 — Monorepo Restructure (PR #1, merged to `main`, 23/06/26)

Clean strictly-modular monorepo rooted at `CukaiPandai/` (`backend/` + `frontend/` + root Bun/JS tooling + root conventions `CLAUDE.md`); no redundant paths. RQ1–RQ6 resolved at Gate 1. QA fix-pass M1–M6 applied. Hard gates green: **pytest 40 passed**; **FE `vite build` clean**.

- **`[DO]` — Root tooling + conventions** (R-DO-1…4): root `package.json` (private, Bun) with biome + husky + commitlint + lint-staged + prettier; `biome.json` (scoped to `frontend/**`, excludes `backend/**`); `commitlint.config.js` (Conventional, 8 allowed types); `.prettierrc` (mirrors devkit); `.husky/{pre-commit,commit-msg}`; `lint-staged`; `.vscode/settings.json`; `AGENTS.md` (`@CLAUDE.md`); merged root `.gitignore` (Python + JS/Bun + env); new root `CLAUDE.md` (references `docs/roles.md` + `.claude/CLAUDE.md`, carries the 4 PO-locked directives: pm-workflow path + source URL · PR-then-`gh`-self-merge + Gate 2 · read PRs/commits before each iteration · plan.md + progress.md are shared state, no task-list.md).
- **`[DO]` — Backend relocation + CI/Docker** (R-BE-1/2): `git mv` `api/` `core/` `tests/` `pyproject.toml` `Dockerfile` `docker-compose.yml` → `backend/` (history preserved, renames). CWD discipline (corpus path left unchanged; run from `backend/`); `ci.yml` `test` job pinned to `working-directory: backend`, docker-build job to `./backend`. `.env.example` stays at repo root. 40 tests still pass from the new layout.
- **`[FE]` — Frontend rebuild** (R-FE-1/2): deleted the wrong-stack Next.js 14 tree (10 routes, Tailwind, postcss, 13 vitest specs) — no salvage. Scaffolded fresh **Vite 5 + React 18 + TS + React Router 7 + token-CSS** SPA in `frontend/` (Bun; no Tailwind/shadcn); copied the **real** ProofRank devkit `tokens.css`; typed API client over the 3 endpoints with mock mode; 3 routed consoles (`/obligations`, `/filing`, `/audit-defense`). `tsc --noEmit` clean; `vite build` green.

### Baseline (pre-restructure, verified 23/06/26)

- **`[BE]` — Deterministic core (`core/`):** obligation + computation engines, deadlines (holiday-shift), citation gate, law-corpus loader, YA2026 config (figures verified + cited), Pydantic models, seeded Acme fixtures. TDD.
- **`[BE]` — Agentic API (`api/`):** 6 agents + LangGraph filing graph with HITL `interrupt` + FastAPI (3 live POST endpoints + `/health`) + `LLMClient` adapter (Anthropic / OpenAI-compat / Fake). TDD. _(Phase-1 closed the carried gaps: graph endpoint-mounted (BE-2); `assess_risk` → 4 checks + wired (BE-3); `_OpenAICompatClient` JSON mode + `RoutingLLMClient` (BE-1).)_
- **`[TD]` — Tests/infra:** 40 automated tests pass incl. an offline e2e pipeline (`tests/api/test_integration_e2e.py`); Docker compose + CI (pytest + Docker build); image is Render-deployable as-is.
- **Verified facts:** YA2026 figures reconciled vs LHDN/RMCD with provenance (SME bands 15/17/24%, e-invoice exemption raised to RM1m from 2026, final phase cancelled). Seeded demo: Acme TIN `C2581234509`, `chargeable_income RM200,000` → `tax_payable RM31,000`. ILMU API verified (tri-SDK base URLs, `sk-` key, `nemo-super` chat/SSE/tool-use/JSON). MyInvois sandbox OAuth verified live (HTTP 200; `/documents/recent` returns 0 docs → demo uses fixture).

### Decisions (PO-locked)

- **[DECISION] Backend package manager: uv (primary)** — `uv.lock` committed, CI (`astral-sh/setup-uv`) + `backend/Dockerfile` on uv; pip remains a fallback (standard pyproject).
- **[DECISION] Stack** — Backend: Python ≥3.11 · Pydantic 2 · FastAPI + Uvicorn · LangGraph · httpx → Render. Frontend: Vite 5 + React 18 + TS + React Router 7 + token-CSS (no Tailwind/shadcn), Bun → Vercel. Monorepo: `backend/` + `frontend/` under `CukaiPandai/`.
- **[DECISION] LLM routing** — **ILMU `nemo-super` primary** (sovereign, 100% in-country) → Claude failover/escalation (the high-stakes citation-critic step). **For the 28 Jun prelim: PURE-ILMU** (Q6, Gate 1) — Claude escalation is deferred post-prelim (BE-5); the `escalate=True` mechanism exists but stays dormant.
- **[DECISION] Connectors** — MyInvois = **full fixture** (live OAuth verified but `/documents/recent` empty); **data.gov.my MSIC** is the only live external call (BE-4, verified `46900→4690`); SSM/MySST seeded; BNM FX callable. Stated transparently (spec §10).
- **[DECISION] Team & timeline** — team of 3; target submission **28 Jun 2026** (repo + README deck + YouTube ≤7:00 + Vercel link). **Deploy committed** (Vercel + Render); localhost retained as contingency only.

---
