# PLAN

> Owned by **PL**. The PM presents this at **Gate 1** for the human to approve before any implementation.
>
> **Structure:** uniformly **phase-oriented** — top-level sections are PHASES in execution order, and **every task carries an explicit lane tag** in its heading. Design & decisions → [`cukaipandai-spec.md`](cukaipandai-spec.md); current status → [`progress.md`](progress.md).
>
> **Lane tags:** `[TD]` = testing & docs / infra · `[BE]` = backend · `[FE]` = frontend. A task is tagged by its **primary** lane; cross-lane touches are noted inline.
>
> **Phases:** **Phase 0** — Monorepo Restructure (infra) · **Phase 1** — AI layer + core gaps · **Phase 2** — Frontend consoles · **Phase 3** — Deploy, demo & submission.

## Open Questions / Assumptions

_PL lists anything ambiguous here for the human to resolve at Gate 1. Phase-0 restructure questions **RQ1–RQ6 are RESOLVED** (Gate 1, 23/06/26); the carried feature questions **Q1–Q5** remain open and resolve during their named tasks._

### Phase 0 — Monorepo Restructure (RQ1–RQ6, RESOLVED at Gate 1)

- [x] **RQ1 (TD) — RESOLVED.** A real tooling reference **does** exist at `/home/adam/CS/chutes/aic-hackathon/devkit` (root `package.json`, `bun.lock`, `.prettierrc`, `.husky/`, `.vscode/`, `CLAUDE.md`, `.gitignore`). **Decision:** R-TD-1/2/3 **mirror the devkit's actual configs at that path** rather than synthesizing from canonical docs. ⚠ **Implementation flag for PG/PO:** the devkit's _actual_ root toolchain is **prettier + husky + lint-staged only** — there is **no biome and no commitlint** at the devkit root (`package.json` scripts = `format: prettier --write .`, `prepare: husky`, `lint-staged: { "*": "prettier --write --ignore-unknown" }`; `.husky/pre-commit` = `bunx --no lint-staged`). R-TD-1 below still carries the richer biome+commitlint substance from the original plan; PG must pick one at implementation and flag it at Gate 2 — **(a)** mirror the devkit literally (prettier+husky+lint-staged, drop biome/commitlint), or **(b)** keep the richer toolchain the task specifies (biome+commitlint added on top of the devkit baseline). Not the PL's call to make silently.
- [x] **RQ2 (TD/infra) — RESOLVED.** Husky hooks run via **Bun**: `bunx` invocations registered by `bun install`'s `prepare` script (confirmed against the devkit: `prepare: husky`, `.husky/pre-commit` = `bunx --no lint-staged`). **Decision:** Bun-driven hooks (not npm); contributors run `bun install` once to register the hooks.
- [x] **RQ3 (TD/BE) — RESOLVED.** **Single root `.env.example`** (NOT split per-lane). **Decision:** keep one root `.env.example` documenting **both** backend (MyInvois + `LLM_*`) and frontend (`VITE_*`) vars; `.env` stays gitignored. The backend reads its env from the repo root or `backend/` as appropriate — **the exact location is an implementation detail for PG to settle and note** (see R-BE-1 and R-BE-2). The prior proposal of a separate `frontend/.env.example` is dropped.
- [x] **RQ4 (FE) — RESOLVED.** **Delete the Next.js app entirely — no salvage.** **Decision:** none of the extra routes/components (`pricing`, `faq`, `corpus`, `settings`, `entities`, the 13 vitest specs) are ported. Rebuild only the **3 consoles** — Filing Studio, Audit-Defense, Obligation Radar.
- [x] **RQ5 (FE) — RESOLVED.** **Copy the real ProofRank devkit `tokens.css`.** **Decision:** copy `/home/adam/CS/chutes/aic-hackathon/devkit/proofrank/frontend/src/styles/tokens.css` into the new `frontend/` (no placeholder). FE-7's styling pass builds on these real tokens.
- [x] **RQ6 (TD) — RESOLVED.** The new **root `CLAUDE.md` references (does not duplicate)** `.claude/CLAUDE.md` + `docs/roles.md`. **Decision:** reference-style links only. Note: the devkit's own `CLAUDE.md` at `/home/adam/CS/chutes/aic-hackathon/devkit/CLAUDE.md` is a useful style reference for the root conventions doc.

### Carried feature questions (Q1–Q5, still open)

- [ ] **Q1 (BE)** — Does `nemo-super` match Claude per-task on the 4 agent prompts, and where must Claude escalate? → resolve via the **BE-1** spike once the ILMU seat is live; decide per-task.
- [ ] **Q2 (BE)** — Is ILMU token usage actually free/unmetered during early access (vs the RM27 seat)? → re-read `console.ilmu.ai/pricing`; confirm on first real run.
- [ ] **Q3 (FE)** — Can a minimal Vite + React console land in time, or do we fall back to an API-driven walkthrough? → decide at the **FE-1** scaffold gate.
- [ ] **Q4 (BE)** — Exact current-year MyInvois API paths + the SSM CSD field set (for the production upgrade). → `sdk.myinvois.hasil.gov.my/api`; SSM CSD plan is `[ROADMAP]`.
- [ ] **Q5 (TD)** — Re-`⚠verify` all YA2026 rates/thresholds/deadlines before the deck (Budget/gazette can change them). → reconcile vs LHDN/RMCD; provenance file already cites sources.

---

## Phase 0 — Monorepo Restructure (infra)

> **Precedes all feature phases.** Goal: a clean, strictly-modular monorepo rooted at `CukaiPandai/` — `backend/` + `frontend/` + root Bun/JS tooling + a root conventions `CLAUDE.md` — with **no redundant paths** (no leftover `api/` + `backend/api/`). Decisions are **PO-locked** (see [`progress.md`](progress.md), entry _"[23/06/26] — PM handoff: monorepo restructure …"_); do not re-litigate them here.
>
> **IDs are namespaced `R-…`** so they never collide with the feature tasks (`BE-*`/`FE-*`/`TD-*`). **Note:** the **FE-1…FE-7** tasks in Phase 2 now build **on the rebuilt `frontend/`** delivered by **R-FE-2** (the old Next.js shell they referenced is gone). FE-1's "port the ProofRank devkit shell" is superseded by R-FE-2's fresh Vite scaffold; FE-2…FE-7 layer features onto it.
>
> **Three independent PR tracks** (each lands as its own PR → self-merge to `main` via `gh`, gated by **Gate 2**):
>
> 1. **R-TD track** (root tooling + conventions docs) — independent; can land first.
> 2. **R-BE track** (backend → `backend/` + all path fixes + CI) — must land **atomically** (move + Dockerfile + compose + CI + pyproject in one PR) or `main` breaks; carries the **40-test hard gate**.
> 3. **R-FE track** (delete Next.js + scaffold the Vite SPA) — independent of the BE move and of the tooling track.
>
> **Sequencing constraints:** R-BE's CI fix **must ship inside the same PR** as the backend move (a partial move red-lines CI). R-TD's `lint-staged`/formatter globbing should already account for both `backend/` (Python — out of the JS formatter's scope, leave to Python tooling) and `frontend/` (JS/TS — in scope). R-FE may proceed before or after R-BE; if R-TD lands first, the husky `pre-commit` will run `lint-staged` over R-FE's new files.

### R-TD-1 `[TD]` — Root Bun/JS tooling (biome + husky + commitlint + lint-staged + prettier) _(track 1, independent)_

**Purpose / issue:** The repo has no root JS toolchain or commit-hygiene gate. Add Bun-managed tooling at the monorepo root **mirroring the devkit's actual configs at `/home/adam/CS/chutes/aic-hackathon/devkit`** (RQ1 RESOLVED — a real reference exists). ⚠ **See RQ1's implementation flag:** the devkit root is **prettier + husky + lint-staged only** (no biome/commitlint); PG decides at Gate 2 whether to mirror the devkit literally or keep the richer biome+commitlint toolchain the steps below specify.

**Implementation:**

- [x] Create root `package.json` (`"private": true`, name e.g. `cukaipandai`) with **devDependencies** `@biomejs/biome` · `husky` · `@commitlint/cli` · `@commitlint/config-conventional` · `lint-staged` · `prettier`, and **scripts** `lint` (`biome check .`), `format` (biome/prettier per the RQ1 duty split), `prepare` (`husky`); add via Bun (`bun add -d …`) → verify: `bun install` completes and writes `bun.lockb` (or `bun.lock` to match the devkit).
- [x] Add `biome.json` (formatter + linter for JS/TS/JSON) with includes/ignores scoped to `frontend/**` + root configs and **excluding** Python under `backend/**` → verify: `bunx biome check .` runs with no config error.
- [x] Add `commitlint.config.js` extending `@commitlint/config-conventional`, restricted to the allowed types in `.claude/CLAUDE.md` (`feat, fix, refactor, docs, test, chore, style, perf`) → verify: `echo "chore: x" | bunx commitlint` passes and `echo "bad msg" | bunx commitlint` fails.
- [x] Add `.prettierrc` (mirror the devkit's: `trailingComma: none`, `singleQuote: true`, `semi: false`, `printWidth: 120`, `tabWidth: 2`; keep duties non-overlapping with biome per **RQ1**) → verify: `bunx prettier --check .` runs.
- [x] Add `.husky/commit-msg` (`bunx commitlint --edit "$1"`) and `.husky/pre-commit` (`bunx --no lint-staged`, matching the devkit), registered via the `prepare` script → verify: hooks present + executable; a bad-message commit is rejected locally.
- [x] Add a `lint-staged` config (in `package.json` or `.lintstagedrc`) globbing `frontend/**/*.{ts,tsx,js,jsx,json,css}` → biome/prettier; leave Python staged files untouched → verify: staging a JS/TS file triggers the formatter on commit.

**Acceptance criteria:** `bun install` registers the husky hooks; the configured formatter/linter (`bunx prettier --check .`, and `bunx biome check .` / `bunx commitlint` if kept) all run cleanly; a non-Conventional commit message is rejected by `commit-msg` (if commitlint is kept); `lint-staged` runs on staged `frontend/` files only. (Resolves **RQ1**, **RQ2**.)

### R-TD-2 `[TD]` — Editor config + `AGENTS.md` _(track 1, independent)_

**Purpose / issue:** Standardize editor behavior and provide the `AGENTS.md` entry point, mirroring the devkit (`/home/adam/CS/chutes/aic-hackathon/devkit/.vscode/settings.json`).

**Implementation:**

- [x] Add `.vscode/settings.json` (format-on-save, default formatter = biome/prettier for JS/TS, exclude `.venv`/`node_modules`/`dist` from search/watch; the devkit's own file is minimal — `{ "json.schemaDownload.trustedDomains": { "*": true } }` — extend it as needed) → verify: valid JSON, references only installed tooling.
- [x] Add root `AGENTS.md` whose content is exactly `@CLAUDE.md` (pointer to the new root conventions doc from R-TD-4) → verify: `AGENTS.md` contains the `@CLAUDE.md` reference and nothing contradictory.

**Acceptance criteria:** `.vscode/settings.json` is valid and points at the installed formatter; `AGENTS.md` resolves to the root `CLAUDE.md` via `@CLAUDE.md`.

### R-TD-3 `[TD]` — Merge `.gitignore` (Python + JS/Bun + env) _(track 1, independent)_

**Purpose / issue:** Two ignore files exist (root Python-only `.gitignore` + `frontend/.gitignore`). After the restructure, Python artifacts live under `backend/` and JS artifacts under `frontend/`; consolidate into one correct root file (the devkit's root `.gitignore` at `/home/adam/CS/chutes/aic-hackathon/devkit/.gitignore` — OS noise + `node_modules` + `.env` — is a useful base to extend with the Python rules).

**Implementation:**

- [x] Rewrite the **root `.gitignore`** to cover Python (`__pycache__/`, `*.py[cod]`, `*.egg-info/`, `.pytest_cache/`, `.ruff_cache/`, `.venv/`), JS/Bun (`node_modules/`, `dist/`, `build/`, `*.tsbuildinfo`, `.vite/`, Bun/Vite caches), env (`.env`, `.env.local`, `.env*.local`), the existing `_research/` scratch, and OS noise (`.DS_Store`); paths must match the nested `backend/` + `frontend/` layout → verify: after a build/test run in either lane, `git status` shows no `node_modules`, `__pycache__`, `dist`, or `.env` as untracked.
- [x] Remove the redundant `frontend/.gitignore` **only if** R-FE-1 has not already deleted the directory; otherwise the fresh scaffold (R-FE-2) inherits the root file → verify: no second ignore file masks root rules; `git check-ignore -v frontend/node_modules` resolves to the root `.gitignore`.

**Acceptance criteria:** A single root `.gitignore` correctly ignores Python, JS/Bun, and env artifacts across both `backend/` and `frontend/`; no stray per-lane ignore file overrides it.

### R-TD-4 `[TD]` — Write the new root `CLAUDE.md` conventions doc (with the 4 directives) _(track 1, independent)_

**Purpose / issue:** Add a **new root `CLAUDE.md`** — a human-facing _conventions_ doc, **separate** from `.claude/CLAUDE.md` (which stays as the agent-onboarding doc). Reference-style (link, **do not duplicate**, `docs/roles.md` + `.claude/CLAUDE.md`), PLUS the 4 PO-locked directives below (RQ6 RESOLVED — references not duplication; the devkit's own `CLAUDE.md` at `/home/adam/CS/chutes/aic-hackathon/devkit/CLAUDE.md` is a useful style reference).

**Implementation:**

- [x] Write root `CLAUDE.md` with a brief project orientation + a **Conventions** section that links to `docs/roles.md` (workflow/gates) and `.claude/CLAUDE.md` (agent onboarding) rather than restating them → verify: the doc references both and does not duplicate the role/gate tables.
- [x] **Directive 1** — agents in this workspace **must follow the PM skill** at `.claude/skills/pm-workflow/` (SOURCE: `https://github.com/AlaskanTuna/pm-workflow`) when implementing → verify: path + source URL appear verbatim; the path exists in-repo (`.claude/skills/pm-workflow/SKILL.md` is present).
- [x] **Directive 2** — every commit + push goes through a **PR first → agent self-merge into `main` via the `gh` CLI**, still gated by **Gate 2** human authorization (never `--force`, never unprompted) → verify: directive states PR-then-self-merge-via-`gh` and the Gate-2 gating explicitly.
- [x] **Directive 3** — before implementing a new iteration, **read the latest PRs + recent commit history** of the GitHub repo first via `gh` → verify: directive names `gh` and "latest PRs + recent commits".
- [x] **Directive 4** — `docs/plan.md` and `docs/progress.md` are **shared team state** — update them for every plan and action; there is **no** `task-list.md` → verify: directive names both files and explicitly states "no task-list.md".

**Acceptance criteria:** Root `CLAUDE.md` exists as a separate conventions doc, references (not duplicates) `docs/roles.md` + `.claude/CLAUDE.md`, and carries all 4 directives with the exact `pm-workflow` path + source URL and the `gh` PR/self-merge + Gate-2 rule. `.claude/CLAUDE.md` is left unchanged. (Resolves **RQ6**.)

### R-BE-1 `[BE]` — `git mv` the backend tree into `backend/` _(track 2, atomic with R-BE-2 — same PR)_

**Purpose / issue:** Establish the `backend/` package boundary by relocating the entire Python project with history preserved. Must land in the **same PR** as R-BE-2 (path fixes + CI) so `main` is never left red.

**Implementation:**

- [x] `git mv` into `backend/`: `api/`, `core/`, `tests/`, `pyproject.toml`, `Dockerfile`, `docker-compose.yml`, the root **`.env.example`** (single root example per **RQ3** — decide whether the canonical copy lives at repo root or `backend/`; if moved into `backend/`, leave a root copy or document the location), and the working `.env` (gitignored but present — move the file so local runs keep their creds) → verify: `git status` shows renames (not delete+add) for the tracked files; no `api/`, `core/`, or `tests/` remain at repo root.
- [x] Confirm **no redundant paths** remain: exactly one `backend/api/`, one `backend/core/`, one `backend/tests/`; nothing left at the old root locations → verify: root `ls` shows `backend/`, `frontend/`, `docs/`, `.claude/`, `.github/`, and the root tooling files — and no top-level `api/`/`core/`/`tests/`.

**Acceptance criteria:** The full Python project lives under `backend/` with git history preserved (renames), and no duplicate backend paths exist anywhere in the tree. The single root `.env.example` (RQ3) documents both lanes; its exact on-disk location (root vs `backend/`) is recorded for PG/QA.

### R-BE-2 `[BE]` — Fix everything the move breaks (paths, Docker, compose, CI) _(track 2, atomic with R-BE-1 — same PR; HARD GATE)_

**Purpose / issue:** The move changes the runtime CWD and every build context. Fix each breakage so the app runs and **all 40 tests pass** from the new layout. Breakages found in-repo: `api/main.py:17` loads the law corpus via a **CWD-relative** path `core/fixtures/lawcorpus_seed.json` (so the process must run from inside `backend/`); the Dockerfile `COPY`s `core`/`api`/`pyproject.toml` from a **root** context; `docker-compose.yml` `build: .` uses **root** context; `ci.yml` runs `pip install -e .`, `pytest -q`, and `docker build … .` all assuming **root**.

**Implementation:**

- [x] **`pyproject.toml`** — confirm `[tool.pytest.ini_options]` (`pythonpath=["."]`, `testpaths=["tests"]`) and `[tool.setuptools] packages=[core, api, api.agents, api.connectors]` still resolve **relative to `backend/`** (they do when commands run from `backend/`); adjust only if a value breaks — do not over-edit → verify: `cd backend && pip install -e ".[dev]"` succeeds and `python -c "import core, api"` works.
- [x] **Runtime CWD / corpus path** — keep `api/main.py`'s `Path("core/fixtures/lawcorpus_seed.json")` working by running from `backend/` (dev: `cd backend && uvicorn api.main:app --reload`; Docker `WORKDIR /app` with `core/` copied to `/app/core/`). Prefer CWD discipline over rewriting the path; do **not** silently change the corpus path unless QA flags it (surgical) → verify: `cd backend && uvicorn api.main:app` boots, `/health` returns `{"status":"ok"}`, corpus loads without `FileNotFoundError`.
- [x] **Env location (RQ3)** — confirm where the backend reads `.env` from after the move (repo root vs `backend/`), wire `LLM_*` + MyInvois vars accordingly, and **record the exact location** for the docs note below → verify: a `cd backend && uvicorn api.main:app` run picks up the env vars from the documented location.
- [x] **`Dockerfile`** — update `COPY` sources for the new build context (keep `backend/` as context with `COPY pyproject.toml/core/api ./…`, **or** keep root context with `COPY backend/pyproject.toml ./` + `COPY backend/core ./core` + `COPY backend/api ./api`); keep `WORKDIR /app` and `CMD uvicorn api.main:app …` so `/app/core/fixtures/...` resolves → verify: `docker build` (with the chosen context) succeeds and a container responds on `/health`.
- [x] **`docker-compose.yml`** — set `build:` to the chosen context (`build: ./backend`, or `build: { context: ., dockerfile: backend/Dockerfile }`) → verify: `docker compose up --build` starts the `api` service and `/health` passes.
- [x] **`.github/workflows/ci.yml`** — run the **test job** inside `backend/` (`defaults.run.working-directory: backend`, or `cd backend &&` per step) for `pip install -e ".[dev]"` + `pytest -q`; set the **docker-build job** to the new context (`docker build … ./backend` or `-f backend/Dockerfile ./backend`) → verify: a CI run (or local reproduction) shows pytest collecting from `backend/tests` and the image building.
- [x] **Docs/commands note (operational only, no code):** the canonical run commands in `.claude/CLAUDE.md`/README now require `cd backend` and the env location settled above — flag for the TD/docs owner; **do not** edit `.claude/CLAUDE.md` in this task (out of R-BE scope) → verify: the note is recorded in the PR description / progress entry, not silently applied.

**Acceptance criteria (HARD GATE):** From the new layout, `cd backend && pytest` reports **40 passed**; `cd backend && uvicorn api.main:app` serves `/health` and loads the law corpus; `docker compose up --build` brings up the API; `ci.yml` is updated so both jobs target `backend/`. No tax figures, citations, or test assertions changed — this is a pure relocation.

### R-FE-1 `[FE]` — Delete the wrong-stack Next.js `frontend/` _(track 3, independent)_

**Purpose / issue:** The current `frontend/` is a Next.js 14 App-Router app (~10 routes incl. `pricing`/`faq`/`corpus`/`settings`/`entities`, Tailwind + postcss, 13 vitest specs) — the wrong stack per the PO-locked decision. Remove it entirely before scaffolding fresh (**RQ4 RESOLVED — delete entirely, no salvage**; "not a port").

**Implementation:**

- [x] `git rm -r frontend/` (remove the entire Next.js tree: `src/app/**`, `src/components/**`, `src/lib/**`, `src/__tests__/**`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `tsconfig.json`, `package.json`, `package-lock.json`, `frontend/.gitignore`) → verify: `git status` shows the deletions; no Next.js/Tailwind files remain under `frontend/`.

**Acceptance criteria:** The Next.js `frontend/` is fully removed (no App-Router routes, no Tailwind/postcss config, no Next deps); the working tree is ready for a clean scaffold. (RQ4 RESOLVED — no extra routes/components salvaged.)

### R-FE-2 `[FE]` — Scaffold a minimal Vite 5 + React 18 + TS + React Router 7 + token-CSS SPA _(track 3; depends on R-FE-1)_

**Purpose / issue:** Deliver the restructure's FE artifact: a **minimal** SPA exposing **only 3 consoles** — **Filing Studio**, **Audit-Defense**, **Obligation Radar** — wired to the 3 live FastAPI endpoints. NO Tailwind, NO shadcn. Bun as package manager. This is the restructure deliverable, **not** the full FE-2…FE-7 feature build (those layer on top later, in Phase 2).

**Implementation:**

- [x] Scaffold a Vite 5 + React 18 + TypeScript SPA in `frontend/` with **Bun** (`bun create vite frontend --template react-ts`, or equivalent); add `react-router-dom@7` → verify: `cd frontend && bun install && bun run dev` boots the dev server and renders the shell.
- [x] Add a **token-CSS** layer: **copy the real ProofRank devkit `tokens.css`** from `/home/adam/CS/chutes/aic-hackathon/devkit/proofrank/frontend/src/styles/tokens.css` into the new `frontend/` (RQ5 RESOLVED — real tokens, no placeholder) + a minimal global stylesheet; no utility framework → verify: tokens imported once at the app root and applied; no Tailwind/postcss present.
- [x] Build a **typed API client** (`src/lib/api.ts`) covering the 3 endpoints — `POST /entities/{tin}/obligations`, `POST /entities/{tin}/filings/form-c`, `POST /entities/{tin}/audit-defense` — with TS types mirroring the backend Pydantic shapes (`ObligationCalendar`, `FormComputation`/`FigureTrace`, `DefensePack`), reading `VITE_API_BASE` (+ a `VITE_API_MOCK` switch) → verify: the client type-checks (`bunx tsc --noEmit`) and the mock path returns shaped data for each endpoint.
- [x] Add **3 routed pages** via React Router 7: `/obligations` (**Obligation Radar**), `/filing` (**Filing Studio**), `/audit-defense` (**Audit-Defense**), plus a minimal nav/shell → verify: all three routes navigate and render against the typed client (mock mode).
- [x] Document the frontend's `VITE_*` vars (`VITE_API_BASE`, `VITE_API_MOCK`, `VITE_SOVEREIGN`) in the **single root `.env.example`** (RQ3 RESOLVED — one root example, not a separate `frontend/.env.example`); ensure no `NEXT_PUBLIC_*` vars remain → verify: the root example lists the Vite vars and no `NEXT_PUBLIC_*` remain.

**Acceptance criteria:** `cd frontend && bun run dev` boots a Vite SPA with exactly 3 routed consoles (Filing Studio, Audit-Defense, Obligation Radar), a typed API client against the 3 live endpoints (mock mode works, `tsc --noEmit` clean), token-CSS only (no Tailwind/shadcn) using the **real** devkit `tokens.css`. The Phase-2 **FE-1…FE-7** tasks build on this scaffold. (RQ5 — real token sheet; RQ3 — frontend vars documented in the root `.env.example`.)

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

> All `[FE]`. Builds on the **R-FE-2** scaffold (Phase 0) and the **BE-1/BE-2** AI/HITL work (Phase 1). **Gating task: FE-1.** FE-3/FE-4/FE-5 depend on the live AI endpoints; FE-6 also appears in Phase 3's deploy/submission flow (cross-referenced there).

### FE-1 `[FE]` — Scaffold the workspace per spec tech stack _(gating)_

**Purpose:** Get a Vite + React console shell in `frontend/` so the demo thread has a UI. **Note:** the initial scaffold is delivered by **R-FE-2** (Phase 0); this task is the feature-build entry point on top of it.

**Implementation:**

- [ ] Port the ProofRank devkit shell into `frontend/` (Vite + React + RR7 + `tokens.css`, Bun) — superseded by **R-FE-2**'s fresh scaffold; confirm the scaffold is in place and extend it → verify: dev server boots, shell renders.
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

### FE-6 `[FE]` — Swap mock → live API; deploy FE → Vercel

> Cross-phase: the **deploy** half also serves Phase 3 (submission). Sequence the live-API swap here; the Vercel deploy can land with the Phase-3 deploy/verify pass.

**Implementation:**

- [ ] Point the typed client at the live API → verify: all consoles work against real endpoints.
- [ ] Deploy FE → Vercel → verify: preview URL loads.

**Acceptance criteria:** Consoles run on live API and the FE is deployed to Vercel.

### FE-7 `[FE]` — Styling pass to the devkit design tokens

**Implementation:**

- [ ] Polish to the ProofRank devkit tokens (the **real** `tokens.css` copied in R-FE-2, RQ5) → verify: consoles match the design system.

**Acceptance criteria:** UI is consistent with the devkit token system.

---

## Phase 3 — Deploy, demo & submission

> All `[TD]`. The final path to the **28 Jun** submission: deck + demo script, record/deploy/verify/submit, and the plan-expansion task that fleshes out the timeline. **TD-5 depends on TD-1** (Phase 1). FE-6's Vercel deploy is cross-referenced here.

### TD-3 `[TD]` — Pitch-deck README + demo script

**Implementation:**

- [ ] Write the pitch-deck README (problem / market / pricing / roadmap) → verify: README covers all four.
- [ ] Time the demo script to ≤7:00 → verify: dry-run lands under 7 minutes.

**Acceptance criteria:** README deck + a timed ≤7:00 demo script exist.

### TD-4 `[TD]` — Record, deploy, verify, submit

**Implementation:**

- [ ] Record the 7-min YouTube video (≤7:00) → verify: final cut under 7 minutes.
- [ ] Deploy BE → Render → verify: deployed health check passes.
- [ ] Final `⚠verify` pass on all figures → verify: every figure reconciles to its source.
- [ ] Submit repo + README deck + YouTube + Vercel link → verify: submission received before the deadline.

**Acceptance criteria:** Final video, deployed BE, verified figures, and a completed submission.

### TD-5 `[TD]` — Expand the plan through submission

**Purpose:** Once `prd.md` + `trd.md` are finalized (TD-1), expand this plan to cover the full path to the 28 Jun submission.

**Implementation:**

- [ ] After **TD-1** lands, flesh out the remaining BE/FE/TD tasks, milestones, and timeline from now through submission (routing, consoles, deploy, demo dry-runs, 7-min video, final `⚠verify`, submit) → verify: every task from today to 28 Jun has a lane tag, acceptance criteria, and a timeline slot.

**Acceptance criteria:** `plan.md` covers all work from now to the 28 Jun submission, lane-tagged with acceptance criteria; depends on **TD-1**.

---
