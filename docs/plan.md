# PLAN

> Owned by **PL**. The PM presents this at **Gate 1** for the human to approve before any implementation.
>
> Shared across the team and organized by lane: **BE** (backend) · **FE** (frontend) · **TD** (testing & docs). Design & decisions → [`cukaipandai-spec.md`](cukaipandai-spec.md); current status → [`progress.md`](progress.md).

## Open Questions / Assumptions

_PL lists anything ambiguous here for the human to resolve at Gate 1._

- [ ] **Q1 (BE)** — Does `nemo-super` match Claude per-task on the 4 agent prompts, and where must Claude escalate? → resolve via the **BE-1** spike once the ILMU seat is live; decide per-task.
- [ ] **Q2 (BE)** — Is ILMU token usage actually free/unmetered during early access (vs the RM27 seat)? → re-read `console.ilmu.ai/pricing`; confirm on first real run.
- [ ] **Q3 (FE)** — Can a minimal Vite + React console land in time, or do we fall back to an API-driven walkthrough? → decide at the **FE-1** scaffold gate.
- [ ] **Q4 (BE)** — Exact current-year MyInvois API paths + the SSM CSD field set (for the production upgrade). → `sdk.myinvois.hasil.gov.my/api`; SSM CSD plan is `[ROADMAP]`.
- [ ] **Q5 (TD)** — Re-`⚠verify` all YA2026 rates/thresholds/deadlines before the deck (Budget/gazette can change them). → reconcile vs LHDN/RMCD; provenance file already cites sources.

---

## TODO Tasks

> Three gating tasks (one per lane) unblock everything below them: **BE-1**, **FE-1**, **TD-1**.

### Backend Lane (BE)

#### BE-1 — Test the AI layer stack _(gating)_

**Purpose:** Stand up ILMU-first routing with Claude failover/escalation so sovereign mode is live, not narrated.

**Implementation:**

- [ ] Buy ILMU Claw Starter (RM27) → verify: seat active, `sk-` key issued.
- [ ] Run the 4-prompt spike (`nemo-super` vs Claude across profiler / documents / deductibility / audit-defense / citation-critic) → verify: per-task quality table captured, escalation points decided (resolves Q1).
- [ ] Build `RoutingLLMClient` (ILMU-first → Claude on error + on the high-stakes citation-critic step) → verify: unit test exercises both the primary path and the failover path.
- [ ] Add `response_format={"type":"json_object"}` to `_OpenAICompatClient` → verify: JSON-mode response parses.

**Acceptance criteria:** `RoutingLLMClient` routes ILMU-first with Claude failover, JSON mode works, and the spike decides per-task escalation.

#### BE-2 — Mount the HITL LangGraph on a FastAPI endpoint

**Purpose:** The HITL `interrupt` graph in `api/graph.py` is test-only today; make approval interactive.

**Implementation:**

- [ ] Expose the LangGraph filing graph (with HITL `interrupt`) over a FastAPI endpoint → verify: a request reaches the interrupt and resumes on approval.

**Acceptance criteria:** Human-approval gate is reachable over HTTP, not just in tests.

#### BE-3 — Deepen `assess_risk` and wire it in

**Purpose:** `assess_risk` is currently two threshold checks and is not imported by `main.py`.

**Implementation:**

- [ ] Extend `assess_risk` to ≥3 checks → verify: tests cover each check.
- [ ] Import/wire it into `main.py` → verify: at least one audit-risk flag fires on the seeded demo.

**Acceptance criteria:** `assess_risk` runs ≥3 checks and is invoked by the live API path.

#### BE-4 — (optional) Real connectors

**Purpose:** Upgrade fixture-backed paths toward production where cheap.

**Implementation:**

- [ ] Wire the real MSIC lookup (data.gov.my) + the `holidays` package into `deadlines` → verify: live MSIC call returns, deadline holiday-shift uses the package.
- [ ] Docling doc ingestion `[ROADMAP]`.

**Acceptance criteria:** MSIC + holidays use real sources; Docling deferred to roadmap.

### Frontend Lane (FE)

#### FE-1 — Scaffold the workspace per spec tech stack _(gating)_

**Purpose:** Get a Vite + React console shell in `frontend/` so the demo thread has a UI.

**Implementation:**

- [ ] Port the ProofRank devkit shell into `frontend/` (Vite + React + RR7 + `tokens.css`, Bun) → verify: dev server boots, shell renders.
- [ ] Build a typed API client with **mock mode** mirroring the 3 endpoint schemas → verify: mock responses type-check against the schemas.
- [ ] Scaffold the 3 console routes (Obligation Calendar · Cited Filing Studio · Audit-Defense) → verify: all three routes navigate in mock mode (resolves Q3).

**Acceptance criteria:** `frontend/` boots with 3 routed consoles running against a typed mock client.

#### FE-2 — Obligation Calendar console

**Implementation:**

- [ ] Render the seeded entity's derived obligation set → verify: Acme calendar renders from the obligations endpoint.

**Acceptance criteria:** Obligation Calendar displays the seeded obligations.

#### FE-3 — Cited Filing Studio (+ human-approval gate)

**Implementation:**

- [ ] Render Form C with `tax_payable RM31,000` and per-figure citation traces → verify: each figure shows its trace.
- [ ] Wire the HITL approval gate → verify: approval resumes the filing graph (depends on BE-2).

**Acceptance criteria:** Form C renders with traceable figures and an interactive approval gate.

#### FE-4 — Audit-Defense console (hero) + live fabricated-citation rejection

**Implementation:**

- [ ] Turn a pasted query (e.g. _"Justify your RM4,800 repairs deduction"_) into a cited pack → verify: cited pack renders.
- [ ] Show the verifier rejecting a fabricated citation live → verify: a fabricated citation is visibly rejected in the UI.

**Acceptance criteria:** Audit-Defense produces a cited pack and visibly rejects a fabricated citation.

#### FE-5 — Sovereign-mode indicator

**Implementation:**

- [ ] Surface the active model/sovereign-mode state in the UI → verify: indicator reflects ILMU-first vs Claude failover.

**Acceptance criteria:** UI shows whether the request ran sovereign (ILMU) or escalated.

#### FE-6 — Swap mock → live API; deploy FE → Vercel

**Implementation:**

- [ ] Point the typed client at the live API → verify: all consoles work against real endpoints.
- [ ] Deploy FE → Vercel → verify: preview URL loads.

**Acceptance criteria:** Consoles run on live API and the FE is deployed to Vercel.

#### FE-7 — Styling pass to the devkit design tokens

**Implementation:**

- [ ] Polish to the ProofRank devkit tokens → verify: consoles match the design system.

**Acceptance criteria:** UI is consistent with the devkit token system.

### Testing & Documentation Lane (TD)

#### TD-1 — Update `prd.md` + `trd.md` to current decisions _(gating)_

**Purpose:** Docs lag the current decisions.

**Implementation:**

- [ ] Reconcile: Next.js → Vite/devkit · deploy **Vercel + Render** · **team of 3** · MyInvois **full fixture** + MSIC real · **ILMU-first** routing → verify: `prd.md` and `trd.md` reflect each decision.

**Acceptance criteria:** `prd.md` and `trd.md` match the current architecture and team decisions.

#### TD-2 — Tests for `RoutingLLMClient` + new endpoints

**Implementation:**

- [ ] Add tests for `RoutingLLMClient` and any new endpoints; keep the suite green → verify: full suite passes.

**Acceptance criteria:** New routing + endpoints are covered and the suite is green.

#### TD-3 — Pitch-deck README + demo script

**Implementation:**

- [ ] Write the pitch-deck README (problem / market / pricing / roadmap) → verify: README covers all four.
- [ ] Time the demo script to ≤7:00 → verify: dry-run lands under 7 minutes.

**Acceptance criteria:** README deck + a timed ≤7:00 demo script exist.

#### TD-4 — Record, deploy, verify, submit

**Implementation:**

- [ ] Record the 7-min YouTube video (≤7:00) → verify: final cut under 7 minutes.
- [ ] Deploy BE → Render → verify: deployed health check passes.
- [ ] Final `⚠verify` pass on all figures → verify: every figure reconciles to its source.
- [ ] Submit repo + README deck + YouTube + Vercel link → verify: submission received before the deadline.

**Acceptance criteria:** Final video, deployed BE, verified figures, and a completed submission.

---

## Done (Temporary Section; Will Be Deleted)

_PG ticks `- [x]` and moves completed tasks here as they pass QA._

### Backend (BE)

- Deterministic core (`core/`): obligation + computation engines, deadlines (holiday-shift), citation gate, law corpus, YA2026 config, Pydantic models, seeded fixtures. **TDD.**
- Agentic API (`api/`): 6 agents + LangGraph filing graph with HITL `interrupt` + FastAPI (3 POST endpoints + `/health`) + `LLMClient` adapter (Anthropic / OpenAI-compat / Fake). **TDD.**
- `[DECISION]` Model routing: **ILMU-first** (`nemo-super` primary) + **Claude** failover/escalation.
- `[DECISION]` Connectors: **MyInvois → full fixture**; **data.gov.my MSIC** is the only real API call (spec §10).

### Frontend (FE)

- `[DECISION]` Stack: **Vite 5 + React 18 + TS + React Router 7 + token-CSS**, reusing the **ProofRank devkit** design system; deploy → **Vercel**.

### Testing & Docs (TD)

- 40 automated tests pass (incl. offline e2e); CI (GitHub Actions: pytest + Docker build).
- Verified live: YA2026 figures (cited), ILMU API compatibility, MyInvois sandbox OAuth (spec §10, [`progress.md`](progress.md)).
- Docs restructured: `cukaipandai-spec.md` (design), `progress.md` (status), `plan.md` (this), `runbook.md`; `project-idea.md` folded into the spec.
