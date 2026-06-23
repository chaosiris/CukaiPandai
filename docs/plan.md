# PLAN

> Owned by **PL**. The PM presents this at **Gate 1** for the human to approve before any implementation.
>
> **Structure:** uniformly **phase-oriented** — top-level sections are PHASES in execution order, and **every task carries an explicit lane tag** in its heading. Completed work is summarized concisely under [`## Done`](#done). Design & decisions → [`cukaipandai-spec.md`](cukaipandai-spec.md); current status → [`progress.md`](progress.md).
>
> **Lane tags:** `[BE]` = backend · `[FE]` = frontend · `[DO]` = devops/infra (tooling · CI · deploy) · `[TD]` = testing & docs. A task is tagged by its **primary** lane; cross-lane touches are noted inline.
>
> **Phases:** **Phase 0** — Monorepo Restructure (devops/infra) → **DONE** (PR #1, merged to `main`; see [`## Done`](#done)) · **Phase 1** — AI layer + core gaps · **Phase 2** — Frontend consoles · **Phase 3** — Deploy, demo & submission.

---

## Open Questions / Assumptions

_PL lists anything ambiguous here for the human to resolve at Gate 1. Phase-0 restructure questions **RQ1–RQ6 are RESOLVED** (Gate 1, 23/06/26; Phase 0 is now **DONE** — see [`## Done`](#done)); the carried feature questions **Q1–Q5** remain open and resolve during their named tasks._

### Resolved — Monorepo Restructure (RQ1–RQ6, resolved at Gate 1; implementation in Done § Phase 0)

- [x] **RQ1 (DO) — RESOLVED.** A real tooling reference **does** exist at `/home/adam/CS/chutes/aic-hackathon/devkit` (root `package.json`, `bun.lock`, `.prettierrc`, `.husky/`, `.vscode/`, `CLAUDE.md`, `.gitignore`). **Decision:** R-DO-1/2/3 **mirror the devkit's actual configs at that path** rather than synthesizing from canonical docs. **Outcome at Gate 2:** PG kept the **richer biome + commitlint** toolchain on top of the devkit baseline (husky + lint-staged + prettier) — option (b).
- [x] **RQ2 (DO) — RESOLVED.** Husky hooks run via **Bun**: `bunx` invocations registered by `bun install`'s `prepare` script (confirmed against the devkit: `prepare: husky`, `.husky/pre-commit` = `bunx --no lint-staged`). **Decision:** Bun-driven hooks (not npm); contributors run `bun install` once to register the hooks.
- [x] **RQ3 (DO/BE) — RESOLVED.** **Single root `.env.example`** (NOT split per-lane). **Decision:** keep one root `.env.example` documenting **both** backend (MyInvois + `LLM_*`) and frontend (`VITE_*`) vars; `.env` stays gitignored. **Outcome:** `.env.example` stays at **repo root**; the backend reads `.env` from the `backend/` CWD (uvicorn) or inherits Docker env.
- [x] **RQ4 (FE) — RESOLVED.** **Delete the Next.js app entirely — no salvage.** **Decision:** none of the extra routes/components (`pricing`, `faq`, `corpus`, `settings`, `entities`, the 13 vitest specs) are ported. Rebuild only the **3 consoles** — Filing Studio, Audit-Defense, Obligation Radar.
- [x] **RQ5 (FE) — RESOLVED.** **Copy the real ProofRank devkit `tokens.css`.** **Decision:** copy `/home/adam/CS/chutes/aic-hackathon/devkit/proofrank/frontend/src/styles/tokens.css` into the new `frontend/` (no placeholder). FE-7's styling pass builds on these real tokens.
- [x] **RQ6 (DO) — RESOLVED.** The new **root `CLAUDE.md` references (does not duplicate)** `.claude/CLAUDE.md` + `docs/roles.md`. **Decision:** reference-style links only, plus the 4 PO-locked directives. Note: the devkit's own `CLAUDE.md` at `/home/adam/CS/chutes/aic-hackathon/devkit/CLAUDE.md` is a useful style reference.

### Carried feature questions (Q1–Q5, still open)

- [ ] **Q1 (BE)** — Does `nemo-super` match Claude per-task on the 4 agent prompts, and where must Claude escalate? → resolve via the **BE-1** spike once the ILMU seat is live; decide per-task.
- [ ] **Q2 (BE)** — Is ILMU token usage actually free/unmetered during early access (vs the RM27 seat)? → re-read `console.ilmu.ai/pricing`; confirm on first real run.
- [ ] **Q3 (FE)** — Can a minimal Vite + React console land in time, or do we fall back to an API-driven walkthrough? → decide at the **FE-1** scaffold gate.
- [ ] **Q4 (BE)** — Exact current-year MyInvois API paths + the SSM CSD field set (for the production upgrade). → `sdk.myinvois.hasil.gov.my/api`; SSM CSD plan is `[ROADMAP]`.
- [ ] **Q5 (TD)** — Re-`⚠verify` all YA2026 rates/thresholds/deadlines before the deck (Budget/gazette can change them). → reconcile vs LHDN/RMCD; provenance file already cites sources.

---

## Phase 1 — AI layer + core gaps

> **Gating task: BE-1** (the AI-layer spike + routing client) unblocks the rest of the AI work and FE's sovereign-mode wiring. **TD-1** (docs reconcile) is the docs gate that **TD-5** (plan expansion, Phase 3) depends on; **TD-2** covers tests for the new routing + endpoints. Builds on the Phase-0 `backend/` layout.

### BE-1 `[BE]` — Test the AI layer stack _(gating)_

**Purpose:** Stand up ILMU-first routing with Claude failover/escalation so sovereign mode is live, not narrated.

**Implementation:**

- [ ] Buy ILMU Claw Starter (RM27) → verify: seat active, `sk-` key issued.
- [ ] Run the 4-prompt spike (`nemo-super` vs Claude across profiler / documents / deductibility / audit-defense / citation-critic) → verify: per-task quality table captured, escalation points decided (resolves Q1).
- [ ] Build `RoutingLLMClient` (ILMU-first → Claude on error + on the high-stakes citation-critic step) → verify: unit test exercises both the primary path and the failover path.
- [ ] Add `response_format={"type":"json_object"}` to `_OpenAICompatClient` → verify: JSON-mode response parses.

**Acceptance criteria:** `RoutingLLMClient` routes ILMU-first with Claude failover, JSON mode works, and the spike decides per-task escalation.

### BE-2 `[BE]` — Mount the HITL LangGraph on a FastAPI endpoint

**Purpose:** The HITL `interrupt` graph in `api/graph.py` is test-only today; make approval interactive.

**Implementation:**

- [ ] Expose the LangGraph filing graph (with HITL `interrupt`) over a FastAPI endpoint → verify: a request reaches the interrupt and resumes on approval.

**Acceptance criteria:** Human-approval gate is reachable over HTTP, not just in tests.

### BE-3 `[BE]` — Deepen `assess_risk` and wire it in

**Purpose:** `assess_risk` is currently two threshold checks and is not imported by `main.py`.

**Implementation:**

- [ ] Extend `assess_risk` to ≥3 checks → verify: tests cover each check.
- [ ] Import/wire it into `main.py` → verify: at least one audit-risk flag fires on the seeded demo.

**Acceptance criteria:** `assess_risk` runs ≥3 checks and is invoked by the live API path.

### BE-4 `[BE]` — (optional) Real connectors

**Purpose:** Upgrade fixture-backed paths toward production where cheap.

**Implementation:**

- [ ] Wire the real MSIC lookup (data.gov.my) + the `holidays` package into `deadlines` → verify: live MSIC call returns, deadline holiday-shift uses the package.
- [ ] Docling doc ingestion `[ROADMAP]`.

**Acceptance criteria:** MSIC + holidays use real sources; Docling deferred to roadmap.

### TD-1 `[TD]` — Update `prd.md` + `trd.md` to current decisions _(gating)_

**Purpose:** Docs lag the current decisions.

**Implementation:**

- [ ] Reconcile: Next.js → Vite/devkit · deploy **Vercel + Render** · **team of 3** · MyInvois **full fixture** + MSIC real · **ILMU-first** routing → verify: `prd.md` and `trd.md` reflect each decision.

**Acceptance criteria:** `prd.md` and `trd.md` match the current architecture and team decisions.

### TD-2 `[TD]` — Tests for `RoutingLLMClient` + new endpoints

**Implementation:**

- [ ] Add tests for `RoutingLLMClient` and any new endpoints; keep the suite green → verify: full suite passes.

**Acceptance criteria:** New routing + endpoints are covered and the suite is green.

---

## Phase 2 — Frontend consoles

> All `[FE]` (the Vercel deploy is split out to **DO-1**). Builds on the **R-FE-2** scaffold (Phase 0, done) and the **BE-1/BE-2** AI/HITL work (Phase 1). **Gating task: FE-1.** FE-3/FE-4/FE-5 depend on the live AI endpoints; FE-6's live-API swap feeds the Phase-3 deploy/submission flow (via **DO-1**).

### FE-1 `[FE]` — Scaffold the workspace per spec tech stack _(gating)_

**Purpose:** Get a Vite + React console shell in `frontend/` so the demo thread has a UI. **Note:** the initial scaffold is already delivered by **R-FE-2** (Phase 0, done); this task is the feature-build entry point on top of it.

**Implementation:**

- [ ] Confirm the **R-FE-2** scaffold is in place (Vite + React + RR7 + `tokens.css`, Bun) and extend it — FE-1's original "port the ProofRank devkit shell" is superseded by R-FE-2's fresh scaffold → verify: dev server boots, shell renders.
- [ ] Build a typed API client with **mock mode** mirroring the 3 endpoint schemas → verify: mock responses type-check against the schemas.
- [ ] Scaffold the 3 console routes (Obligation Calendar · Cited Filing Studio · Audit-Defense) → verify: all three routes navigate in mock mode (resolves Q3).

**Acceptance criteria:** `frontend/` boots with 3 routed consoles running against a typed mock client.

### FE-2 `[FE]` — Obligation Calendar console

**Implementation:**

- [ ] Render the seeded entity's derived obligation set → verify: Acme calendar renders from the obligations endpoint.

**Acceptance criteria:** Obligation Calendar displays the seeded obligations.

### FE-3 `[FE]` — Cited Filing Studio (+ human-approval gate)

**Implementation:**

- [ ] Render Form C with `tax_payable RM31,000` and per-figure citation traces → verify: each figure shows its trace.
- [ ] Wire the HITL approval gate → verify: approval resumes the filing graph (depends on BE-2).

**Acceptance criteria:** Form C renders with traceable figures and an interactive approval gate.

### FE-4 `[FE]` — Audit-Defense console (hero) + live fabricated-citation rejection

**Implementation:**

- [ ] Turn a pasted query (e.g. _"Justify your RM4,800 repairs deduction"_) into a cited pack → verify: cited pack renders.
- [ ] Show the verifier rejecting a fabricated citation live → verify: a fabricated citation is visibly rejected in the UI.

**Acceptance criteria:** Audit-Defense produces a cited pack and visibly rejects a fabricated citation.

### FE-5 `[FE]` — Sovereign-mode indicator

**Implementation:**

- [ ] Surface the active model/sovereign-mode state in the UI → verify: indicator reflects ILMU-first vs Claude failover.

**Acceptance criteria:** UI shows whether the request ran sovereign (ILMU) or escalated.

### FE-6 `[FE]` — Swap mock → live API

> The Vercel **deploy** half of the original FE-6 is split out to **DO-1** (Phase 3). This task sequences the live-API swap only.

**Implementation:**

- [ ] Point the typed client at the live API → verify: all consoles work against real endpoints.

**Acceptance criteria:** Consoles run on the live API (deploy handled by **DO-1**).

### FE-7 `[FE]` — Styling pass to the devkit design tokens

**Implementation:**

- [ ] Polish to the ProofRank devkit tokens (the **real** `tokens.css` copied in R-FE-2, RQ5) → verify: consoles match the design system.

**Acceptance criteria:** UI is consistent with the devkit token system.

---

## Phase 3 — Deploy, demo & submission

> Mixed `[DO]` + `[TD]`. The final path to the **28 Jun** submission: deploy the two services (**DO-1** FE → Vercel, **DO-2** BE → Render), the deck + demo script, record/verify/submit, and the plan-expansion task that fleshes out the timeline. **TD-5 depends on TD-1** (Phase 1). The deploys (**DO-1/DO-2**) are prerequisites for **TD-4**'s record/verify/submit pass.

### DO-1 `[DO]` — Deploy FE → Vercel

> Split out from **FE-6** (the live-API swap stays in FE-6, Phase 2). Sequence after FE-6 points the client at the live API.

**Implementation:**

- [ ] Deploy the FE to Vercel → verify: preview URL loads and the consoles run against the live API.

**Acceptance criteria:** The FE is deployed to Vercel and the preview URL loads.

### DO-2 `[DO]` — Deploy BE → Render

> Split out from **TD-4** (record/verify/submit stays in TD-4). The Docker image is already Render-deployable as-is.

**Implementation:**

- [ ] Deploy BE → Render → verify: deployed health check (`/health`) passes.

**Acceptance criteria:** The BE is deployed to Render and its health check passes.

### TD-3 `[TD]` — Pitch-deck README + demo script

**Implementation:**

- [ ] Write the pitch-deck README (problem / market / pricing / roadmap) → verify: README covers all four.
- [ ] Time the demo script to ≤7:00 → verify: dry-run lands under 7 minutes.

**Acceptance criteria:** README deck + a timed ≤7:00 demo script exist.

### TD-4 `[TD]` — Record, verify, submit

> The deploy sub-items are split out to **DO-1** (Vercel) and **DO-2** (Render); this task covers record + final verify + submission packaging, and depends on both deploys being live.

**Implementation:**

- [ ] Record the 7-min YouTube video (≤7:00) → verify: final cut under 7 minutes.
- [ ] Final `⚠verify` pass on all figures → verify: every figure reconciles to its source.
- [ ] Submit repo + README deck + YouTube + Vercel link (depends on **DO-1** + **DO-2** being deployed) → verify: submission received before the deadline.

**Acceptance criteria:** Final video, verified figures, and a completed submission (with both services deployed via **DO-1/DO-2**).

### TD-5 `[TD]` — Expand the plan through submission

**Purpose:** Once `prd.md` + `trd.md` are finalized (TD-1), expand this plan to cover the full path to the 28 Jun submission.

**Implementation:**

- [ ] After **TD-1** lands, flesh out the remaining BE/FE/DO/TD tasks, milestones, and timeline from now through submission (routing, consoles, deploy, demo dry-runs, 7-min video, final `⚠verify`, submit) → verify: every task from today to 28 Jun has a lane tag, acceptance criteria, and a timeline slot.

**Acceptance criteria:** `plan.md` covers all work from now to the 28 Jun submission, lane-tagged with acceptance criteria; depends on **TD-1**.

---

## Done

> Completed work, terse. Full detail lives in [`progress.md`](progress.md). `[DECISION]` lines are PO-locked and must not be dropped.

### Phase 0 — Monorepo Restructure (PR #1, merged to `main`, 23/06/26)

Clean strictly-modular monorepo rooted at `CukaiPandai/` (`backend/` + `frontend/` + root Bun/JS tooling + root conventions `CLAUDE.md`); no redundant paths. RQ1–RQ6 resolved at Gate 1. QA fix-pass M1–M6 applied. Hard gates green: **pytest 40 passed**; **FE `vite build` clean**.

- **`[DO]` — Root tooling + conventions** (R-DO-1…4): root `package.json` (private, Bun) with biome + husky + commitlint + lint-staged + prettier; `biome.json` (scoped to `frontend/**`, excludes `backend/**`); `commitlint.config.js` (Conventional, 8 allowed types); `.prettierrc` (mirrors devkit); `.husky/{pre-commit,commit-msg}`; `lint-staged`; `.vscode/settings.json`; `AGENTS.md` (`@CLAUDE.md`); merged root `.gitignore` (Python + JS/Bun + env); new root `CLAUDE.md` (references `docs/roles.md` + `.claude/CLAUDE.md`, carries the 4 PO-locked directives: pm-workflow path + source URL · PR-then-`gh`-self-merge + Gate 2 · read PRs/commits before each iteration · plan.md + progress.md are shared state, no task-list.md).
- **`[DO]` — Backend relocation + CI/Docker** (R-BE-1/2): `git mv` `api/` `core/` `tests/` `pyproject.toml` `Dockerfile` `docker-compose.yml` → `backend/` (history preserved, renames). CWD discipline (corpus path left unchanged; run from `backend/`); `ci.yml` `test` job pinned to `working-directory: backend`, docker-build job to `./backend`. `.env.example` stays at repo root. 40 tests still pass from the new layout.
- **`[FE]` — Frontend rebuild** (R-FE-1/2): deleted the wrong-stack Next.js 14 tree (10 routes, Tailwind, postcss, 13 vitest specs) — no salvage. Scaffolded fresh **Vite 5 + React 18 + TS + React Router 7 + token-CSS** SPA in `frontend/` (Bun; no Tailwind/shadcn); copied the **real** ProofRank devkit `tokens.css`; typed API client over the 3 endpoints with mock mode; 3 routed consoles (`/obligations`, `/filing`, `/audit-defense`). `tsc --noEmit` clean; `vite build` green.

### Baseline (pre-restructure, verified 23/06/26)

- **`[BE]` — Deterministic core (`core/`):** obligation + computation engines, deadlines (holiday-shift), citation gate, law-corpus loader, YA2026 config (figures verified + cited), Pydantic models, seeded Acme fixtures. TDD.
- **`[BE]` — Agentic API (`api/`):** 6 agents + LangGraph filing graph with HITL `interrupt` + FastAPI (3 live POST endpoints + `/health`) + `LLMClient` adapter (Anthropic / OpenAI-compat / Fake). TDD. Known gaps carried into Phase 1: graph not endpoint-mounted (BE-2); `assess_risk` is 2 checks, not wired (BE-3); `_OpenAICompatClient` lacks `response_format`, `make_llm()` is single-provider (BE-1).
- **`[TD]` — Tests/infra:** 40 automated tests pass incl. an offline e2e pipeline (`tests/api/test_integration_e2e.py`); Docker compose + CI (pytest + Docker build); image is Render-deployable as-is.
- **Verified facts:** YA2026 figures reconciled vs LHDN/RMCD with provenance (SME bands 15/17/24%, e-invoice exemption raised to RM1m from 2026, final phase cancelled). Seeded demo: Acme TIN `C2581234509`, `chargeable_income RM200,000` → `tax_payable RM31,000`. ILMU API verified (tri-SDK base URLs, `sk-` key, `nemo-super` chat/SSE/tool-use/JSON). MyInvois sandbox OAuth verified live (HTTP 200; `/documents/recent` returns 0 docs → demo uses fixture).

### Decisions (PO-locked)

- **[DECISION] Backend package manager: uv (primary)** — `uv.lock` committed, CI (`astral-sh/setup-uv`) + `backend/Dockerfile` on uv; pip remains a fallback (standard pyproject).
- **[DECISION] Stack** — Backend: Python ≥3.11 · Pydantic 2 · FastAPI + Uvicorn · LangGraph · httpx → Render. Frontend: Vite 5 + React 18 + TS + React Router 7 + token-CSS (no Tailwind/shadcn), Bun → Vercel. Monorepo: `backend/` + `frontend/` under `CukaiPandai/`.
- **[DECISION] LLM routing** — **ILMU `nemo-super` primary** (sovereign, 100% in-country) → **Claude** failover/escalation (incl. the high-stakes citation-critic step).
- **[DECISION] Connectors** — MyInvois = **full fixture** (live OAuth verified but `/documents/recent` empty); **data.gov.my MSIC** is the only live external call; SSM/MySST seeded; BNM FX callable. Stated transparently (spec §10).
- **[DECISION] Team & timeline** — team of 3; target submission **28 Jun 2026** (repo + README deck + YouTube ≤7:00 + Vercel link).

---
