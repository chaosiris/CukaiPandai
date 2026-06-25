# PROGRESS

> Append-only log. **PG** adds a dated entry after each task; **QA** records test/build results. Newest at the bottom.
>
> Shared across the team; tag each entry with its lane — **BE** · **FE** · **DO** · **TD**. Design & decisions → [`cukaipandai-spec.md`](cukaipandai-spec.md); the plan → [`plan.md`](plan.md).

Format:

```
## [DD/MM/YY] — <Task Name>

- What changed (brief).
- Files touched.
- Test/build status.
```

---

## [23/06/26] — Phase 0 fix-pass (QA M1–M6) `[TD/BE/FE]`

**Branch:** `chore/monorepo-restructure` (staged, uncommitted).

### M1 — biome scope fixed `[TD]`

- `biome.json`: added `vcs.useIgnoreFile: true` (honours `.gitignore`) and narrowed `files.include` to `["frontend/src/**", "frontend/vite.config.ts", "frontend/tsconfig*.json"]`. No longer crawls `.venv/`, `node_modules/`, `backend/`, `.claude/`, `dist/`.
- Verify: `bunx biome check .` → **0 errors, 11 files checked**.

### M2 — biome/prettier conflict resolved `[TD/FE]`

- `lint-staged` in `package.json` split: `frontend/**/*.{ts,tsx,js,jsx}` → biome only; `frontend/**/*.{css,json}` → biome format only; `*.{md,yaml,yml}` → prettier only. No JS/TS file goes through both.
- All FE source auto-formatted by `bunx biome check --write`: import order sorted, formatting applied to 7 files.
- `noNonNullAssertion` fixed in `src/main.tsx`: replaced `!` with an explicit null guard (`if (!root) throw new Error(...)`).
- `noArrayIndexKey` fixed in `src/pages/AuditDefense.tsx`: replaced `key={i}` with `key={c.claim}` (claim string is unique per citation).
- Verify: `bunx biome check frontend/` → **0 errors, 10 files checked**; `bunx biome check .` → **0 errors, 11 files checked**.

### Minor — duplicate H1 in `.claude/CLAUDE.md` fixed `[TD]`

- Downgraded the karpathy block's `# CLAUDE.md` H1 to `## Karpathy Coding Guidelines`. File now has one top-level H1.

### [dev] extra added `[BE]`

- `backend/pyproject.toml`: added `[project.optional-dependencies] dev = ["pytest>=8.0", "httpx>=0.27"]`. Both were already required by the test suite; now declared explicitly.
- `.github/workflows/ci.yml`: install step updated to `pip install -e ".[dev]"`.
- Also appended Karpathy + RTK blocks to `.claude/CLAUDE.md` (prior coordinator-relayed change, staged on this branch).
- Verify: `cd backend && pip install -e ".[dev]" && pytest -q` → **40 passed, 1 warning in 0.96s**.

### Route paths aligned to plan `[FE]`

- `src/App.tsx`: routes changed from `/`, `/filing`, `/audit` to `/obligations`, `/filing`, `/audit-defense`. Root `/` now redirects to `/obligations` via `<Navigate replace>`. NavLinks updated accordingly. `navStyle` extracted to avoid inline function duplication.
- Verify: `tsc --noEmit` clean; `bun run build` → **44 modules, 0 errors, 1.52s**.

### Combined hard-gate results

- **pytest:** `40 passed, 1 warning in 0.96s` `[VERIFIED 23/06/26]`
- **FE build:** `vite v5.4.21 ✓ built in 1.52s` `[VERIFIED 23/06/26]`

---

## [23/06/26] — Baseline status snapshot `[VERIFIED 2026-06-23]`

- **BE — Deterministic core (`core/`):** obligation engine, computation engine, deadlines (holiday-shift), citation gate, law-corpus loader, YA2026 config (figures verified + cited), Pydantic models, seeded Acme fixtures. **TDD.**
- **BE — Agentic API (`api/`):** 6 agents (profiler, documents, deductibility, audit_risk, audit_defense, citation_critic) + LangGraph filing graph with HITL `interrupt` + FastAPI (3 live POST endpoints + `/health`) + `LLMClient` adapter (Anthropic / OpenAI-compat / Fake). **TDD.** Known gaps: graph not yet endpoint-mounted; `assess_risk` is two threshold checks and not imported by `main.py`; `_OpenAICompatClient.complete()` does not pass `response_format`; `make_llm()` is single-provider (no routing/fallback yet).
- **TD — Tests:** **40 automated tests pass** incl. an offline end-to-end pipeline test (`tests/api/test_integration_e2e.py`: profiler → compute → audit-defense, all on `FakeLLMClient`).
- **TD — Infra:** Docker compose + CI (GitHub Actions: pytest + Docker build); image is **Render**-deployable as-is.
- **Files touched:** `core/`, `api/`, `tests/`, `pyproject.toml`, `Dockerfile`, `docker-compose.yml`, `docs/`.
- **Test/build status:** **40 passed** (pytest) `[VERIFIED 2026-06-23]`.

### Verification results (baseline)

| Check                       | Result                                                                                                                                                                                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Automated tests**         | **40 passed** `[VERIFIED 2026-06-23]` (pytest), incl. the offline e2e pipeline test (`tests/api/test_integration_e2e.py`).                                                                                                                                                                  |
| **YA2026 tax figures**      | Verified vs LHDN/RMCD with citations `[VERIFIED]` — SME bands 15/17/24% (paid-up ≤ RM2.5m AND gross ≤ RM50m), non-SME 24%, e-invoice phases (exemption raised to RM1m from 2026, final phase cancelled), SST/CGT/TP/WHT annotated in `ya_2026.yaml` with a provenance file.                 |
| **Seeded demo correctness** | Acme TIN `C2581234509`; `chargeable_income RM200,000` → `tax_payable RM31,000` (15% × 150k + 17% × 50k) — asserted in `tests/api/test_endpoints.py` and `test_graph.py`. Audit query _"Justify your RM4,800 repairs deduction"_ → cited pack; fabricated citation rejected by the verifier. |
| **Live endpoints**          | 3 POST endpoints live (`/entities/{tin}/obligations`, `/filings/form-c`, `/audit-defense`) + `/health`. LangGraph orchestrator with HITL `interrupt` exists in `api/graph.py` (exercised in tests; **not yet endpoint-mounted**).                                                           |
| **ILMU API compatibility**  | `[VERIFIED 2026-06-23]` (browser) — tri-SDK base URLs, `sk-` key, `nemo-super`/`ilmu-nemo-nano` support chat + SSE + tool-use + JSON mode; Claw tier gates to those two text models, PAYG unlocks vision/embeddings. Existing `_OpenAICompatClient` integrates by base-url+key+model swap.  |
| **MyInvois sandbox**        | **OAuth verified live 2026-06-23** (token + `/api/v1.0/documenttypes` both HTTP 200) with real sandbox creds; `/documents/recent` returns 0 docs for the test TIN, so the demo uses the fixture.                                                                                            |
| **Other gov APIs**          | SSM/MySST seeded (paid / no API); data.gov.my MSIC + BNM FX confirmed free/callable. Intended hackathon scoping, stated transparently (spec §10).                                                                                                                                           |

### Verified vs. assumed (baseline)

- **Verified live (browser):** ILMU as a sovereign Malaysian platform (100% in-country residency) · tri-SDK base URLs (`/v1`, `/anthropic`, `/gemini`), one `sk-` key · model catalogue · Claw-vs-PAYG plan split · capability matrix · early-access free banner + "Claw Starter ~RM27/seat/month" · ILMU BM capability · MyInvois sandbox OAuth. Sources cited (docs 403 bots): `docs.ilmu.ai`, `console.ilmu.ai/pricing`, `ytlailabs.com`, `preprod-api.myinvois.hasil.gov.my`.
- **Verified in repo / via pytest:** 40 tests pass incl. offline e2e · the deterministic↔AI split · `make_llm()` is single-provider with no routing/fallback · `_OpenAICompatClient.complete()` does not pass `response_format` · `assess_risk` is two threshold checks, not imported by `main.py` · 3 live POST endpoints + `health` · LangGraph HITL graph exists but not endpoint-mounted · seeded Acme figures · MyInvois fixture-backed (live OAuth path still a `NotImplementedError` stub) · SSM/MySST seeded · YA2026 config annotated with verified figures + provenance.
- **Researched / cited (carried from inception, not re-fetched):** competitive landscape · the obligation-derivation finding (no government endpoint returns a company's obligation set) · the no-public-filing-API boundary · MyInvois sandbox/OAuth2 facts and SSM/MySST access nature.
- **Assumed / deferred:** spec Assumptions A1–A6 (spec §12) + the plan's open questions ([`plan.md`](plan.md)). None architectural; all cheap to resolve.

---

## [23/06/26] — Phase 0 monorepo restructure (R-TD-1…4, R-BE-1/2, R-FE-1/2)

**Branch:** `chore/monorepo-restructure` (staged, uncommitted — awaiting Gate 2).

### R-TD `[TD]` — Root Bun/JS tooling + conventions

- Created root `package.json` (private, `type: module`, Bun package manager) with devDependencies: `@biomejs/biome`, `husky`, `@commitlint/cli`, `@commitlint/config-conventional`, `lint-staged`, `prettier`. Scripts: `prepare: husky`, `lint: biome check .`, `format: biome format --write . && prettier --write .`.
- Added `biome.json` scoped to `frontend/**` + root JS/TS/JSON; excludes `backend/**`.
- Added `commitlint.config.js` (ESM export, extends `@commitlint/config-conventional`, `type-enum` restricted to the 8 types in `.claude/CLAUDE.md`). Verified: `echo "chore: x" | bunx commitlint` → passes; `echo "bad msg" | bunx commitlint` → fails.
- Added `.prettierrc` mirroring the devkit exactly (`trailingComma: none`, `singleQuote: true`, `semi: false`, `printWidth: 120`, `tabWidth: 2`).
- Added `.husky/pre-commit` (`bunx --no lint-staged`, matching devkit exactly) and `.husky/commit-msg` (`bunx commitlint --edit "$1"`), both executable. Registered via `prepare` script.
- `lint-staged` in `package.json`: `frontend/**/*.{ts,tsx,js,jsx,json,css}` → biome check + prettier.
- Added `.vscode/settings.json` (extends devkit base with format-on-save, biome as formatter for TS/TSX/JS/JSX, search/watch excludes).
- Added root `AGENTS.md` containing `@CLAUDE.md`.
- Rewrote root `.gitignore` to cover Python (`__pycache__/`, `*.py[cod]`, `*.egg-info/`, `.pytest_cache/`, `.ruff_cache/`, `.venv/`), JS/Bun (`node_modules/`, `dist/`, `build/`, `*.tsbuildinfo`, `.vite/`, `.next/`), env (`.env`, `.env.local`, `.env.*.local`), `_research/`, and OS noise. Verified: `git check-ignore -v frontend/node_modules` → resolves to root `.gitignore:12`.
- Added root `CLAUDE.md` (separate from `.claude/CLAUDE.md`) with project orientation + Conventions section carrying all 4 PO-locked directives (pm-workflow path + source URL; PR-then-gh-merge + Gate 2; read PRs/commits before each iteration; plan.md + progress.md are shared state, no task-list.md).
- **PG toolchain decision (RQ1):** kept the **richer biome + commitlint** toolchain on top of the devkit baseline (husky + lint-staged + prettier). Flagged for Gate 2.
- **Files created/modified:** `package.json`, `bun.lock`, `biome.json`, `commitlint.config.js`, `.prettierrc`, `.husky/pre-commit`, `.husky/commit-msg`, `.vscode/settings.json`, `AGENTS.md`, `CLAUDE.md`, `.gitignore`.

### R-BE `[BE]` — Move backend tree into `backend/`

- `git mv` into `backend/`: `api/`, `core/`, `tests/`, `pyproject.toml`, `Dockerfile`, `docker-compose.yml`. Git status shows all as renames (R), not delete+add.
- **`.env.example` location decision (RQ3):** `.env.example` stays at **repo root** (not moved into `backend/`). Root `.env.example` updated to replace `NEXT_PUBLIC_*` with `VITE_*` vars and add backend runtime note.
- **CWD-path fix decision:** CWD discipline. The `Path("core/fixtures/lawcorpus_seed.json")` in `backend/api/main.py` is **left unchanged** — resolved by running from `backend/` (dev: `cd backend && uvicorn api.main:app --reload`; Docker: `WORKDIR /app` with `COPY core ./core` so `/app/core/fixtures/…` resolves). No code change needed.
- **`backend/Dockerfile`:** updated comment only (build context = `backend/`). COPY paths (`COPY core ./core`, `COPY api ./api`) are unchanged and correct when built with `backend/` as context.
- **`backend/docker-compose.yml`:** `build: .` left unchanged (when run from `backend/`, `.` = `backend/` = correct context). Run `cd backend && docker compose up --build`.
- **`.github/workflows/ci.yml`:** added `defaults.run.working-directory: backend` for the `test` job; `pip install -e .` + `pytest -q` now run from `backend/`. Docker-build job uses `docker build -t cukaipandai-api ./backend` from repo root (overrides the top-level default).
- **`backend/pyproject.toml`:** no changes needed — `pythonpath=["."]`, `testpaths=["tests"]`, and packages list all resolve correctly from `backend/`.
- **Docs/commands note (for TD owner):** The canonical commands in `.claude/CLAUDE.md` / README should be updated to `cd backend && uvicorn api.main:app --reload` and `cd backend && docker compose up --build`. The backend reads `.env` from the `backend/` CWD (uvicorn) or inherits Docker env; the repo root `.env.example` documents all vars. NOT editing `.claude/CLAUDE.md` here — flagged for TD/docs task.
- **HARD GATE — pytest result:**

```
........................................
40 passed, 1 warning in 0.95s
```

- **Files moved/modified:** `backend/api/`, `backend/core/`, `backend/tests/`, `backend/pyproject.toml`, `backend/Dockerfile`, `backend/docker-compose.yml`, `.github/workflows/ci.yml`, `.env.example`.

### R-FE `[FE]` — Delete Next.js + scaffold Vite SPA

- `git rm -r frontend/` removed the entire Next.js 14 App-Router tree (10 routes, Tailwind, postcss, 13 vitest specs, `package-lock.json`, `frontend/.gitignore`). No salvage.
- Scaffolded fresh Vite 5 + React 18 + TypeScript + React Router 7 SPA in `frontend/` with Bun as package manager. No Tailwind, no shadcn, no postcss.
- Copied real ProofRank devkit `tokens.css` from `/home/adam/CS/chutes/aic-hackathon/devkit/proofrank/frontend/src/styles/tokens.css` → `frontend/src/styles/tokens.css`. Imported once in `src/main.tsx`. No utility framework.
- Built typed API client at `frontend/src/api/client.ts` covering all 3 endpoints (`POST /entities/{tin}/obligations`, `POST /entities/{tin}/filings/form-c`, `POST /entities/{tin}/audit-defense`) with TS types mirroring backend Pydantic models (`ObligationCalendar`, `FormComputation`/`FigureTrace`, `DefensePack`, `Citation`). Mock mode via `VITE_API_MOCK=1`.
- Added 3 routed pages via React Router 7: `/` → Obligation Radar, `/filing` → Filing Studio, `/audit` → Audit Defense. Minimal token-CSS styling using devkit classes (`.window`, `.titlebar`, `.req-list`, `.requirement-row`, `.evidence`, `.verified-stamp`, `.barber`).
- Root `.env.example` updated with `VITE_API_BASE_URL`, `VITE_API_MOCK`, `VITE_SOVEREIGN` (no `NEXT_PUBLIC_*` remain).
- **FE build result:**

```
vite v5.4.21 building for production...
✓ 44 modules transformed.
dist/index.html                   0.40 kB │ gzip:  0.27 kB
dist/assets/index-CLNBSJt2.css   17.78 kB │ gzip:  4.41 kB
dist/assets/index-DHFQ65WX.js   187.70 kB │ gzip: 60.64 kB
✓ built in 1.70s
```

- `tsc --noEmit` passes clean.
- **Files created:** `frontend/package.json`, `frontend/bun.lock`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/tsconfig.node.json`, `frontend/index.html`, `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/api/client.ts`, `frontend/src/styles/tokens.css`, `frontend/src/pages/ObligationRadar.tsx`, `frontend/src/pages/FilingStudio.tsx`, `frontend/src/pages/AuditDefense.tsx`.

---

## [23/06/26] — PM handoff: monorepo restructure + tooling + root CLAUDE.md (decisions locked, NOT yet implemented)

> PM-workflow planning action (no code changed). The restructure below runs through **PL → Gate 1 → PG → QA → PR** in a fresh session rooted at this repo. Captured here so the next session does not re-derive the decisions.

**Locked decisions (PO-approved, 23/06/26):**

1. **Monorepo root = this repo** (`CukaiPandai/`). `nexhack/` is only a container folder. Root-level `CLAUDE.md`, Bun/biome/husky tooling, and `backend/` + `frontend/` all live here.
2. **Frontend = fresh minimal console** (not a port). Replace the wrong-stack Next.js 14 + Tailwind app with a clean **Vite 5 + React 18 + TS + React Router 7 + token-CSS (no Tailwind/shadcn)** SPA exposing only the core consoles spec H1 needs: **Filing Studio + Audit-Defense + Obligation Radar**. The existing `frontend/` (Next App Router, 10 routes) is dropped; rebuild incrementally per spec §7.3.
3. **Execution = PM pipeline in a fresh session** rooted at `CukaiPandai/` (named agents register there with correct model+effort pinning).

**Target clean-monorepo shape (no redundant paths):**

```
CukaiPandai/
  CLAUDE.md            # NEW root conventions doc (reference-style + 4 extra directives below)
  AGENTS.md            # @CLAUDE.md
  package.json biome.json commitlint.config.js .prettierrc .husky/   # root Bun/JS tooling (biome+husky+commitlint+lint-staged+prettier)
  .vscode/settings.json
  .gitignore           # merged Python + JS/Bun + env
  backend/             # api/ + core/ + tests/ + pyproject.toml + Dockerfile + docker-compose.yml + fixtures  (moved via git mv)
  frontend/            # rebuilt: Vite 5 + React 18 + TS + React Router 7 + token-CSS
  docs/  .claude/  .github/workflows/ci.yml   # ci.yml updated for backend/ paths
```

**Four extra directives the new root `CLAUDE.md` must carry (beyond the reference's content):**

1. Agents in this workspace **must follow the PM skill** at `.claude/skills/pm-workflow/` (SOURCE: https://github.com/AlaskanTuna/pm-workflow) when implementing.
2. Every commit + push goes through a **PR first → agent self-merge into `main`** via the `gh` CLI (still gated by Gate 2 human authorization).
3. Before implementing in a new iteration, **read the latest PRs + recent commit history** of the GitHub repo first via `gh`.
4. `docs/plan.md` and `docs/progress.md` are **shared team state** — update them for every plan and action. (This repo uses plan.md + progress.md; there is **no** task-list.md.)

**Restructure scope for PL to plan (lane-tagged):**

- **TD/infra:** add root Bun tooling mirroring `chutes-hack/dev` (package.json, biome.json, commitlint.config.js, .prettierrc, .husky/{commit-msg,pre-commit}, lint-staged), `.vscode/settings.json`, `AGENTS.md`; merge `.gitignore`; write the new root `CLAUDE.md`.
- **BE:** `git mv` `api/`, `core/`, `tests/`, `pyproject.toml`, `Dockerfile`, `docker-compose.yml` (+ `.env*`) into `backend/`; fix package paths (`pyproject` packages, `pythonpath`, Docker build context, compose, CI `ci.yml`) so `pytest` stays green (40 tests).
- **FE:** delete the Next.js `frontend/`; scaffold the Vite+RR7+token-CSS console (3 consoles) wired to the 3 live FastAPI endpoints.
- **Note:** `.claude/CLAUDE.md` (the agent-onboarding doc) stays; the new **root** `CLAUDE.md` is the separate conventions doc (reference keeps both).

---

## [23/06/26] — uv as backend primary PM + runbook update `[DO/TD]`

**Branch:** `chore/uv-backend-and-runbook` (staged, uncommitted — awaiting Gate 2).

### `[DO]` — uv integration (backend)

- **uv version:** 0.10.10 (pre-installed).
- Generated `backend/uv.lock` via `uv lock` (51 packages resolved). `git check-ignore backend/uv.lock` → not ignored (correct — file will be committed for reproducible installs). `backend/.venv/` remains gitignored and is not staged.
- `backend/pyproject.toml`: no changes required — `[project]`, `[project.optional-dependencies] dev`, and `[build-system]` (setuptools) are already uv-compatible.
- **pytest via uv:** `cd backend && uv run pytest -q` → **40 passed, 1 warning in 3.10s** `[VERIFIED 23/06/26]`.
- pip still works as a documented fallback (standard pyproject — no uv-specific formats introduced).

### `[DO]` — CI updated to uv

- `.github/workflows/ci.yml`: replaced `actions/setup-python@v5 cache: pip` + `pip install -e ".[dev]"` + `pytest -q` with `astral-sh/setup-uv@v6` + `uv sync --extra dev` + `uv run pytest -q` (working-directory: `backend` unchanged). Docker-build job unchanged.

### `[DO]` — Dockerfile updated to uv

- `backend/Dockerfile`: replaced `FROM python:3.11-slim` + `RUN pip install --no-cache-dir -e .` with `COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv` + `COPY pyproject.toml uv.lock ./` + `RUN uv pip install --system --no-cache -e .`. `WORKDIR /app`, fixture CWD discipline, and `CMD` unchanged.
- **Docker build result:** `docker build -t cukaipandai-be ./backend` → **succeeded** (sha256:0375ae46…) `[VERIFIED 23/06/26]`.

### `[TD]` — docs/runbook.md fixed for post-restructure + uv

- §1 backend: commands now run from `backend/`; switched to `uv venv && uv sync --extra dev` / `uv run pytest -q` / `uv run uvicorn api.main:app --reload`; pip fallback documented; removed incorrect `pip install -e . pytest` (pytest is in `[dev]` extra).
- §2 frontend: removed "In progress" note (3 consoles exist); corrected env var to `VITE_API_BASE_URL` (from `client.ts`); fixed `cp` path to `../.env.example .env` (file is at repo root).
- §4 deploy: noted build context `backend/` for Render + CI now uses uv.
- §5 demo flow: fixture paths updated from `core/fixtures/...` → `backend/core/fixtures/...`.

### `[TD]` — .claude/CLAUDE.md Commands block updated

- Tech Stack line: added `uv` as backend package manager; removed "(planned)" from Frontend.
- Commands block: switched to `cd backend && uv sync --extra dev`, `uv run uvicorn ...`, `uv run pytest -q`; noted `cd backend` CWD requirement; kept pip as one-line fallback.

### `[TD]` — docs/plan.md Done/Decisions section

- Added `[DECISION] Backend package manager: uv (primary)` line.

- **Files touched:** `backend/uv.lock` (new), `backend/Dockerfile`, `.github/workflows/ci.yml`, `docs/runbook.md`, `.claude/CLAUDE.md`, `docs/plan.md`, `docs/progress.md`.

---

## [23/06/26] — DO lane taxonomy sync `[TD]`

- Added **DO** (devops/infra — tooling · CI · deploy) to the lane enumeration in `.claude/CLAUDE.md` (line ~104) and `docs/progress.md` header; both previously listed only BE · FE · TD.

---

## [23/06/26] — BE-1 AI-layer stack: ILMU-first routing + live spike `[BE]`

- **ILMU seat live + verified.** `nemo-super` via `https://api.ilmu.ai/v1` returns HTTP 200. `.env` (gitignored, repo root) is read via **python-dotenv** (`load_dotenv()` in `api/main.py`); `python-dotenv` added to `pyproject.toml`.
- **`RoutingLLMClient`** (`api/llm.py`): ILMU-first → Claude **on error**, and `escalate=True` sends high-stakes calls straight to the fallback. `make_llm()` wraps the ILMU client in the router when `ANTHROPIC_API_KEY` is set (else bare ILMU). 6 unit tests cover primary / failover / escalate / no-fallback.
- **JSON-object mode** in `_OpenAICompatClient` (`response_format={"type":"json_object"}` when a `json_schema` is passed); unit-tested.
- **Citation critic escalates** (`escalate=True`) — the YES/NO gate routes to Claude when routing is active.
- **Live spike** (`scripts/spike_ilmu.py`, ILMU side; Claude side pending a key) — resolves Q1:

| Agent                    | nemo-super                                                          | Decision                              |
| ------------------------ | ------------------------------------------------------------------- | ------------------------------------- |
| documents (classify)     | parses, correct categories                                          | keep on ILMU                          |
| deductibility (cite)     | verifies after fix (was emitting `ITA 1967 s33(1)` without hyphens) | keep on ILMU; constrain to corpus IDs |
| citation-critic (YES/NO) | answered NO on a clearly-supported claim                            | **escalate to Claude** (wired)        |
| audit-defense            | grounds correctly; verdict gated by the weak critic                 | escalate the critic to Claude         |

- **Spike-driven fix:** the JSON agents (`deductibility`, `audit_defense`) now constrain the model to the corpus's exact clause IDs (`LawCorpus.ids()`) and use JSON mode; all JSON parsing goes through `api/jsonio.loads_relaxed` (tolerates code fences). Post-fix, `deductibility` verifies `ITA-1967-s33(1)` live.
- **Tests:** 46 backend pass (40 → 46, +6 routing/JSON).
- **Open (Q1/Q2):** the Claude-side spike + real failover need an `ANTHROPIC_API_KEY` (not yet provisioned); ILMU token metering unconfirmed.
- **Files:** `api/llm.py`, `api/jsonio.py` (new), `api/agents/{documents,deductibility,audit_defense,citation_critic}.py`, `core/lawcorpus.py`, `scripts/spike_ilmu.py` (new), `tests/api/test_routing.py` (new), `api/main.py`, `pyproject.toml`, `.env.example`.

---

## [23/06/26] — BE-2 + BE-3: HITL endpoint + audit-risk pre-flight `[BE]`

- **BE-2 — HITL filing graph over FastAPI.** `POST /entities/{tin}/filings/form-c/start` runs the LangGraph filing graph to the human-approval `interrupt` and returns `{thread_id, computation, requires_approval}`; `POST .../resume` resumes the same run via `Command(resume={approved})` → `{approved, computation}`. A single module-level graph + `MemorySaver` persists the paused state across the two calls (the compute node is deterministic, so no model client is built at import). Resume on an unknown/finalized `thread_id` returns 404. Golden `tax_payable` RM31,000 flows through both. Subagent-verified.
- **BE-3 — `assess_risk` deepened + wired.** Now 4 deterministic checks: `turnover_mismatch` (>10% vs MyInvois), `negative_chargeable`, `high_deduction_ratio` (>90% of declared income), `zero_tax_positive_income`. Invoked in the live `form-c` endpoint (`risk_flags` in the response); on the seeded Acme demo (RM5m declared vs RM200k chargeable) the `high_deduction_ratio` flag fires. Subagent-verified.
- **Tests:** 61 backend pass (53 → 61: +3 graph-API, +5 audit-risk/endpoint).
- **Open:** real Claude failover + the Claude-side spike still need an `ANTHROPIC_API_KEY`.
- **Files:** `api/main.py`, `api/schemas.py`, `api/agents/audit_risk.py`, `tests/api/{test_graph_api,test_audit_risk,test_risk_endpoint}.py`.

---

## [23/06/26] — BE-4 + TD-1 + TD-2 + Phase-1 audit fixes → Phase 1 complete `[BE]` `[TD]`

- **BE-4 — live MSIC + holidays.** `MsicClient` (`api/connectors/msic.py`) does a level-based lookup against **data.gov.my** (`?id=msic`, follow-redirects, cached) with a fixture mode for offline tests; exposed at `GET /reference/msic/{code}` (DI-overridable; 404 on unknown). Live verified: `46900 → class 4690 (Non-specialized wholesale trade)`, 1943 rows. `core/deadlines.py` gains `malaysia_holidays()` + `shift_for_malaysian_holidays()` from the offline `holidays` package.
- **TD-1 — prd/trd reconciled** to the current decisions (Vite + React + RR7 frontend, Vercel + Render deploy, team of 3, MyInvois full fixture + MSIC live, ILMU-first routing, uv + `backend/`+`frontend/` monorepo). No stale Next.js/shadcn/two-dev/Default-Claude remnants; both stay checkbox-free.
- **TD-2 — tests** for `RoutingLLMClient` + the new endpoints (routing, JSON-mode, graph start/resume, risk, MSIC, jsonio); suite green.
- **Phase-1 adversarial audit (8-dimension workflow, 31 findings) — fixes applied:**
  - `assess_risk` check #3 renamed `high_deduction_ratio` → **`gross_chargeable_gap`** with an honest message (it measures the gross-vs-chargeable gap, not deductions); zero-turnover (`0` vs `None`) now flags; negative declared income guarded.
  - HITL `/start` now returns **`risk_flags`** so the human at the approval gate sees the audit-risk context (previously only the synchronous endpoint did).
  - `/audit-defense` returns a controlled **502** on unparseable model output (was an uncaught 500); `loads_relaxed` now salvages a fenced JSON block embedded in prose.
  - MSIC: **shared/cached client** (`get_msic` singleton) so the catalogue isn't re-downloaded per request (data.gov.my ~4 req/min); section lookup is **case-insensitive**.
- **Deferred (explicitly out of scope this pass):**
  - **Anthropic failover hardening** (per "ignore the Anthropic fallback first"): `_AnthropicClient` JSON-mode enforcement, escalate-path failover/forwarding, and the **Claude-side spike** (BE-1 `nemo-super`-vs-Claude head-to-head) all wait on an `ANTHROPIC_API_KEY`.
  - Wiring `shift_for_malaysian_holidays` into `derive_obligations` (deferred to avoid disturbing the demo's golden due dates; capability lives in `deadlines.py`).
  - `documents` JSON-object mode (it is not endpoint-wired; live spike parses it correctly today).
- **Tests:** 79 backend pass (61 → 79). `MemorySaver` is in-process — run a single Uvicorn worker on Render (noted in code + runbook).
- **Files:** `api/agents/audit_risk.py`, `api/connectors/msic.py`, `api/jsonio.py`, `api/main.py`, `core/deadlines.py`, `core/fixtures/msic_sample.json`, `pyproject.toml`, several `tests/`, `docs/{prd,trd,plan,progress,runbook}.md`.

---

## [24/06/26] — TD-docs: documentation-alignment pass (Phase-2 decisions → cukaipandai-spec / trd / prd) `[TD]`

**Scope:** docs-only pass; no code changed. Reflects the Gate-1 decisions (Q6–Q9) and Phase-1 completion into the three design docs.

**`docs/cukaipandai-spec.md`:**

- §7.1 system diagram — removed stale "STATUS: PLANNED — NOT built" / "NOT YET mounted" notes; updated to reflect Phase-1 complete (HITL endpoints live, RoutingLLMClient live, MsicClient live); added new endpoint surface (BE-6 through BE-10); added sovereign RAG layer block (numpy index, model2vec, fail-open); updated ILMU ↔ Claude line to note pure-ILMU for prelim (Q6).
- §7.3 stack table — "Law corpus / RAG" row updated to local static embeddings + committed numpy index (model2vec/potion, fit for Render 256MB) + scale-path note (bge-m3 = ILMU PAYG, not Claw tier); "Data" row updated to managed Neon SG + sovereignty caveat (no MY region; hashes-not-payloads; prod = self-hosted MY identical schema; RAG stays on numpy, not pgvector).
- §3.3 plan-access table — added paragraph noting `bge-m3`/embeddings require PAYG, so prelim RAG uses local static model2vec (sovereign, in-process); ILMU bge-m3 is the scale path.
- §3.4 routing decision — replaced the "code gaps / planned spike" table with Phase-1 status (RoutingLLMClient built + verified, 79 tests); added pure-ILMU prelim constraint (Q6, ILMU Claw Starter 403 on Claude); `[ROADMAP]` note for post-prelim BE-5.
- §2.1 mechanism table — updated "Cited reasoning" row (committed numpy RAG in progress, BE-12/13/14); updated "Human-in-the-loop" row (HITL endpoints live, BE-2); updated "Sovereign mode" row (RoutingLLMClient live; added honest Neon SG persistence caveat).
- §2.2 stress-test table — closed H2 (RoutingLLMClient live, 79 tests) and H4 (assess_risk → 4 checks + wired); updated H5 (sovereign RAG committed, numpy index approach described).
- §6.1 usage walkthrough — beat 8: removed "not yet endpoint-mounted"; noted BE-2 live.
- §6.2 demoable beats — updated strong-beats list to include Layak UX patterns (96px hero, per-figure details panel, two-tier trace, verified/unverified badge, live sovereign indicator, HITL gate, seed personas/DEMO MODE); updated "Verdict" test count 40 → 79.
- §8.1 Pydantic table — `Clause` model updated to include `section`, `page_ref`, `url` provenance fields (BE-12).
- §11 Responsible AI table — HITL row updated (endpoints live, BE-2); Sovereignty row updated with honest residency statement (in-country inference + SG persistence now / MY in prod; do not claim unqualified "all data stays in Malaysia").

**`docs/trd.md`:**

- §6 Law corpus — rewritten to describe committed numpy index + model2vec prelim approach + fail-open; bge-m3/pgvector as scale path; provenance fields on `Clause`; RAG-gate relationship stated.
- §7a API contract — expanded with all new endpoints: `GET /entities/{tin}` (BE-8), `POST …/documents/classify` (BE-9), CORS (BE-7), 422 envelope (BE-10), `sovereign`/`active_model` field (BE-6); shipped route list updated.
- §8 Data model — updated from SQLite MVP → Postgres prod to Neon SG prelim + hashes-not-payloads + fixtures fallback + MY prod path; RAG stays on numpy (not pgvector) for prelim.
- §9 Security/residency — updated with honest Neon SG statement; in-country inference + in-country computation + SG persistence now / MY in prod; do not claim unqualified "all data stays in Malaysia".
- §12 Tech stack — RAG line updated (model2vec + committed numpy index → pgvector scale path); Data line updated (Neon SG prelim + full caveat + self-hosted MY prod path).

**`docs/prd.md`:**

- §7 NFR — "Data residency/PDPA" line updated: inference in-country (pure-ILMU); RAG in-process; Neon SG prelim with hashes-not-payloads mitigation; prod = self-hosted MY (deploy-config swap); explicit "do not claim unqualified" note; added Demo reliability / DB-down note.
- §12 Open items — credentials obtained (MyInvois sandbox + ILMU seat); Neon residency item added.

**Sovereignty wording: NOW HONEST.** No doc claims unqualified "all data stays in Malaysia" for the prelim. The accurate framing — in-country inference (ILMU) + in-country computation + SG persistence now / MY persistence in prod — is stated in spec §11, trd §9, and prd §7. TD-3's Q9 sub-task is the deck/README equivalent gate.

---

## [24/06/26] — Phase 2/3 ① critical-path BE (BE-6/7/8/9/10) `[BE]`

- **BE-7 — CORS:** `CORSMiddleware` in `api/main.py`, origins via `CORS_ORIGINS`/`FRONTEND_ORIGIN` env (default `http://localhost:5173`), documented in `.env.example`. Specific-origin list **with** credentials (not the insecure `*`+credentials combo).
- **BE-8 — `GET /entities/{tin}`:** serves the seeded `EntityTaxProfile` (404 on unknown TIN) so the FE can render onboarding + the calendar header.
- **BE-9 — `POST /entities/{tin}/documents/classify`:** raw trial-balance text → `LineItem[]` (resolves Q7). The `documents` agent now uses JSON-object mode (`{"line_items":[...]}`, tolerates a bare array); 502 on unparseable output. Live-verified on `nemo-super`.
- **BE-10 — 422 envelope:** `_profile`/`_line_items` catch `ValidationError` → **422** with field detail across `/obligations`, `/form-c`, `/start` (was an uncaught 500).
- **BE-6 — route_info:** every `LLMClient` reports `{sovereign, active_model}`; `RoutingLLMClient` tracks the last route; `/audit-defense` + `/classify` carry the field (live source of truth for FE-5). Pure-ILMU → `sovereign=true`.
- **Tests:** 89 backend pass (79 → 89; +CORS, entity, classify, 422, route-field). Live spike 4/4. Subagent-audited: all 5 RESOLVED, no regressions, no 500/security defects.
- **Files:** `api/main.py`, `api/llm.py`, `api/agents/documents.py`, `api/schemas.py`, `.env.example`, `tests/api/{test_entity_endpoint,test_classify_endpoint,test_cors,test_validation_envelope}.py` (new) + `test_audit_defense_endpoint.py`.

---

## [24/06/26] — Phase 2 ② sovereign RAG (BE-12/13/14) `[BE]`

- **BE-12 — corpus + offline index:** `Clause` gains optional `section`/`page_ref`/`url`; `lawcorpus_seed.json` expanded 5 → 15 ITA/PR clauses (incl. **PR-6/2019** repairs ruling) with provenance; `scripts/build_rag_index.py` embeds via local static **model2vec** (`potion-base-8M`), L2-normalizes, writes the COMMITTED `core/fixtures/rag/{vectors.npz, chunks.json}`. ⚠verify of clause text/section/page is the TD-6/Q5 gate (tax-verify contributor).
- **BE-13 — retriever + wiring:** `core/rag.py` — `lru_cache` embedder + index, cosine top-k, **fail-open** (any error → `[]`). `deductibility`/`audit_defense` replace the full-ID dump with retrieved candidate IDs (fall back to the full corpus when retrieval is `[]`); `thread_provenance` threads section/page_ref/url/passage into the `Citation` additively. The deterministic gate (`ground_citation` → `corpus.exists`) is **unchanged and authoritative**.
- **BE-14 — tests:** golden retrieval (PR-6/2019 for repairs), fail-open, agent-fallback-when-RAG-off, and the **gate-still-rejects-fabrication invariant with RAG ON**.
- **Honest limitation (Q6):** static-embedding precision on a 15-clause corpus is coarse and `nemo-super`'s clause _choice_ among valid candidates is imperfect — accepted per Q6: the deterministic clause-ID gate + the fabricated-citation rejection (RAG-independent) carry the trust demo; the rich audit-defense query retrieves cleanly (PR-6/2019 top-1). `bge-m3`/pgvector = documented scale path.
- **Sovereign:** in-process, no foreign API; sized for the Render 256MB tier. Local model copy `backend/.hf_models/` is gitignored; CI/Render download the ~30MB model (or set `RAG_MODEL_PATH`) — RAG fails open to the gate if it can't load.
- **Tests:** 93 backend pass (89 → 93). Live spike 4/4. Subagent-audited: BE-12/13/14 RESOLVED; fabrication invariant holds.
- **⚠ uv.lock:** `model2vec` + `numpy` added to `pyproject.toml` → run `cd backend && uv lock` (uv unavailable in this session; mirrors the BE-4 `holidays` lock fix).
- **Files:** `core/models.py`, `core/rag.py` (new), `core/fixtures/lawcorpus_seed.json`, `core/fixtures/rag/{vectors.npz,chunks.json}` (new), `scripts/build_rag_index.py` (new), `api/agents/{deductibility,audit_defense}.py`, `pyproject.toml`, `.gitignore`, `tests/api/test_rag.py` (new).

---

## [24/06/26] — Phase 3 ③ Neon persistence — fallback-first SEAMS (DO-4 + BE-15/16/17) `[BE]` `[DO]`

> **Status: seams built + fallbacks tested; live-Neon NOT yet verified.** The plan boxes for DO-4/BE-15/16/17 stay **unticked** — their acceptance (live Neon round-trips, restart-survival) needs a `DATABASE_URL` (DO-4 provisioning is the human step). What's done is the **demo-critical fallback-first architecture**.

- **Fallback-first (DB-down ≠ demo-down):** every seam degrades to in-memory/fixtures when `DATABASE_URL` is unset/unreachable; the `psycopg`/`langgraph-checkpoint-postgres` imports are **lazy** — the app boots and every endpoint works even with those packages absent (audit-verified).
- **BE-15:** `build_filing_graph(llm, checkpointer=None)` defaults to MemorySaver; `make_checkpointer()` builds a Neon `PostgresSaver` when `DATABASE_URL` is set (`setup()` over the UNPOOLED endpoint; runtime over POOLED with `prepare_threshold=0`), else None → MemorySaver. Any error → None (degrades, never crashes).
- **BE-16:** `make_evidence_vault()` → in-memory core `EvidenceVault` by default; `_PostgresEvidenceVault` mirrors the surface, **hashes-not-payloads** preserved.
- **BE-17:** `EntityRepository` serves the seeded fixture by default; reads Neon `entities` when configured, falling through to fixtures on any error. `GET /entities/{tin}` reads via the repo.
- **DO-4:** deps in `pyproject.toml`; `DATABASE_URL`/`DATABASE_URL_UNPOOLED` documented in `.env.example`; `migrations/neon_schema.sql` (audit/links + entities/filings/defense_packs; checkpoints via `PostgresSaver.setup()`). **Provisioning the Neon project + the connection string is the human step — pending.**
- **Tests:** 96 backend pass (93 → 96; +3 persistence fallback tests). Subagent-audited: BE-15/16/17 + DO-4 seams RESOLVED, demo-safe.
- **⚠ uv.lock:** now also needs `psycopg` + `langgraph-checkpoint-postgres` → run `cd backend && uv lock`.
- **Next (needs creds):** provide `DATABASE_URL` → tick DO-4, wire + live-verify BE-15 restart-survival, BE-16/17 round-trips.
- **Files:** `api/persistence.py` (new), `api/graph.py`, `api/main.py`, `pyproject.toml`, `.env.example`, `migrations/neon_schema.sql` (new), `tests/api/test_persistence.py` (new).

---

## [24/06/26] — Escalation reframed sovereign-by-default; direct-Claude demoted to flagged opt-in `[BE]` `[TD]`

> **Sovereignty fix.** The docs/code framed the RoutingLLMClient secondary as "Claude failover/escalation" as if it were free of residency cost — but a direct Anthropic call leaves Malaysia and breaks the PDPA/sovereignty pitch. Supersedes the [23/06/26] BE-1 note: `make_llm()` no longer wraps the router on a bare `ANTHROPIC_API_KEY`.

- **`make_llm()` rewired (`api/llm.py`):** new `_escalation_fallback()` builds the secondary in priority order — (1) **sovereign:** `LLM_ESCALATION_MODEL` → another `_OpenAICompatClient` on the SAME ILMU gateway (in-country); (2) **non-sovereign opt-in:** `LLM_ALLOW_DIRECT_ANTHROPIC=1` **and** `ANTHROPIC_API_KEY` → `_AnthropicClient` (leaves Malaysia); (3) else **None** → bare sovereign ILMU client, no router. A bare `ANTHROPIC_API_KEY` no longer enables a fallback.
- **`route_info()` honesty:** `_OpenAICompatClient` → `sovereign = "ilmu.ai" in base_url`; `_AnthropicClient` → `sovereign=False`. The FE indicator stays evidence-backed.
- **`.env.example`:** model-layer block reframed — ILMU primary, then commented **sovereign** `LLM_ESCALATION_MODEL`/`_BASE_URL`/`_API_KEY`, then the commented **non-sovereign** `LLM_ALLOW_DIRECT_ANTHROPIC=1`/`ANTHROPIC_API_KEY`/`LLM_FALLBACK_MODEL` with a "leaves Malaysia" warning.
- **Docs reframed (all "Claude failover/escalation as if free"):** `trd.md` (§7 routing rationale + §12 stack + top diagram), `cukaipandai-spec.md` (§3.4 status/prelim/roadmap, §9.1/9.2 status + env examples, the audit-defense table, A2 assumption, both diagrams), `plan.md` (Q6 decision, BE-5 title/bullet, the routing `[DECISION]`, Phase-1 retrospective, README task), `.claude/CLAUDE.md` (Architecture + Tech Stack lines). Honest carry-over: Claw Starter has **no Claude-class model on the gateway** (verified 403) → a sovereign escalation needs ILMU PAYG/larger; direct-Claude is the only Claude path today and it breaks residency.
- **Prelim unchanged:** still **PURE-ILMU (Q6)** — no secondary configured, escalate path dormant; the deterministic `ground_citation` gate carries the trust demo.
- **Tests:** new `tests/api/test_make_llm.py` (4 — pure-ILMU bare client, sovereign-escalation router, direct-Anthropic opt-in flagged non-sovereign, bare-key-does-not-enable). **100 backend pass** (96 → 100). Subagent-audited.
- **Files:** `api/llm.py`, `.env.example`, `tests/api/test_make_llm.py` (new), `docs/{trd,cukaipandai-spec,plan,progress}.md`, `.claude/CLAUDE.md`.

---

## [25/06/26] — FE-1: Confirm scaffold + extend typed client to real surface `[FE]`

- **`frontend/src/api/client.ts` — fully extended to all 9 backend routes:**
  - New types: `EntityTaxProfile`, `RiskFlag`, `FilingStartResponse`, `FilingResumeResponse`, `ClassifyResponse`, `AuditDefenseResponse`, `RouteInfo`, `ApiValidationError`, `ValidationErrorDetail`.
  - Fixed stale types: `FormCResponse` gains `risk_flags: RiskFlag[]`; `Citation` gains optional `section?/page_ref?/url?/passage?` (RAG provenance, BE-13).
  - New methods: `getEntity(tin)`, `classifyTrialBalance(tin, raw_text)`, `startFiling(tin, ssm, line_items)`, `resumeFiling(tin, thread_id, approved)`, `getMsic(code)`.
  - 422 error envelope: `handleResponse<T>()` parses FastAPI `{detail:[{loc,msg,type}]}` and attaches `.validationDetail` to the thrown Error instead of a bare `'${status} ${statusText}'` string.
  - Mock mode updated for every new method — all fixtures use seeded Acme values (`msic_codes:['46900']`, `gross_income:5_000_000`, `tax_payable:31000`). Exported `ACME_TIN` + `ACME_SSM` constants.
- **New `frontend/src/hooks/useEntity.ts`** — shared `useEntity(tin?)` hook. All three console pages call this instead of page-local `DEMO_SSM` stubs. Resolves FQ4 / [DRIFT] #3.
- **New `frontend/src/components/CitationPanel.tsx`** — shared primitives:
  - `CitationPanel` — renders a single `Citation` with expandable `<details>` for RAG provenance (`section`, `page_ref`, `url`, `passage`); all RAG fields guarded for null.
  - `VerifiedBadge` — renders `VERIFIED`/`REJECTED` stamp using existing `.verified-stamp`/`.unverified-stamp` devkit classes.
  - `SovereignBadge` — renders `ILMU · <model>` or `EXTERNAL · <model>` badge from BE-6 `route_info()` fields.
- **Page updates (surgical — body logic untouched, only stub replacement):**
  - `ObligationRadar.tsx`: removed page-local `DEMO_SSM`/`DEMO_TIN`; now calls `useEntity()` + builds the ssm argument from the live profile.
  - `FilingStudio.tsx`: same — page-local stub gone, `useEntity()` drives the ssm; `DEMO_ITEMS` updated to Acme-consistent amounts.
  - `AuditDefense.tsx`: `useEntity()` wired; imports `CitationPanel`+`SovereignBadge`; renders defense citations via `CitationPanel` (FE-4 builds on these primitives).
- **Build/type status:** `tsc --noEmit` clean; `bun run build` → 46 modules, 0 errors; `bunx biome check` → 9 files, 0 errors.

---

## [25/06/26] — Phase 2 FE spine complete (FE-1…FE-5) — lint fix + plan tick `[FE]`

- **Biome lint pass (11 violations → 0):** added `type="button"` to 9 `<button>` elements missing it (3 in `AuditDefense.tsx` lines ~60/93/271; 6 in `FilingStudio.tsx` lines ~441/494/509/561/576/605); replaced 2 array-index keys with stable keys derived from item content (`AuditDefense.tsx` ~245: `Object.entries(item).map(([k,v])=>\`${k}:${v}\`).join('|')`; ~378: `c.claim`).
- **Verify:** `bunx biome check frontend/src` → 0 errors, 9 files; `bun run build` → 46 modules, 0 errors; `bunx tsc --noEmit` → clean.
- **Files touched:** `frontend/src/pages/AuditDefense.tsx`, `frontend/src/pages/FilingStudio.tsx`.
- **Plan ticked:** all sub-bullets under FE-1 (shell/shared-contract), FE-2 (Obligation Radar — entity header + obligations list), FE-3 (Filing Studio — classify + HITL gate + risk_flags + Layak trust-trio: 96px hero, honest-number IA, per-figure FigureTrace `<details>`, no clause-IDs on figures), FE-4 (Audit-Defense — CitationPanel + verified/unverified badge, live fabricated-citation rejection money-shot, 502 handling, two-tier trace), FE-5 (sovereign badge bound to real `{sovereign, active_model}` from BE-6, folded into FE-4) — marked `[x]` in `docs/plan.md`. FE-6/7/8/9 and all BE/DO/TD tasks untouched.
- **Context:** consoles are v1/functional; a later `ui-ux-pro-max` pass owns visual redesign. Deploy (DO-1/2/3) is next on the critical path. The FE spine was built mock-first against the real backend contract (CORS/entity/classify/route_info all on `main`); all AI responses read `sovereign`/`active_model` from BE-6, not hardcoded.

---

## [25/06/26] — Deploy-readiness batch (BE-18 + FE-6 code-prep + DO-1/DO-2 agent config) `[BE]` `[FE]` `[DO]`

- **BE-18 — opt-in fabricated-citation inject:** added `inject_fabricated: bool = False` to `AuditDefenseReq` (`api/schemas.py`); when set, the `/audit-defense` handler appends a known out-of-corpus `Citation` (e.g. `clause_ids=["ITA_s99_ZZ"]`) to `citations[]` **before** `ground_citation` / `verify_claim` runs — the real deterministic gate (`citations.py` → `corpus.exists`) stamps it `verified=false`; the genuine citation stays `verified=true`; default behaviour is unchanged. New test asserts the injected cite is gated `verified=false` and the genuine cite `verified=true` in the same pack. **105 tests pass** (96 → 105 across this batch). QA: Approve.
- **FE-6 code-prep — live-swap carry-forwards (3 of 4 bullets; Render-URL-dependent bullet left unticked):**
  - QA carry-forward #1: wired the fabrication button in `AuditDefense.tsx` to the `inject_fabricated=true` path so the live Render call exercises the real `ground_citation` gate.
  - QA carry-forward #2: aligned `MOCK_DEFENSE.items` shape in `client.ts` from `[{clause_id, text, source}]` to the live `build_defense` shape `[{contested_item, evidence}]`.
  - QA carry-forward #3: branched `getAuditDefense`'s mock on the query so the standard path returns only the verified citation and the fabrication query returns the rejected one — matching live behavior under DQ1=A.
  - `tsc --noEmit` clean; `bun run build` green after each edit.
- **DO-2 agent config — Render:** applied the one-line Dockerfile `$PORT` fix (`CMD` now `uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}` shell form; local `:-8000` default preserved). Runbook `§4a` env-var table already present (written in the prior deploy-readiness pass). Human-only steps (Render login, create service, set dashboard env, capture URL, CORS reconcile, cold-start pre-warm) remain unticked.
- **DO-1 agent config — Vercel:** created `frontend/vercel.json` with the SPA catch-all rewrite (`/(.*) → /index.html`) so React Router 7 deep-link refreshes on `/obligations`, `/filing`, `/audit-defense` resolve without 404. Build contract confirmed (`bun run build` → `dist/`; `tsc --noEmit` clean). Runbook `§4b` Vercel section already present. Human-only steps (vercel login/link, set env, `vercel --prod`, capture URL) remain unticked.
- **Runbook:** updated test-count to **105 passed** (was stale at 40).
- **Plan ticked:** BE-18 (all 3 bullets); FE-6 carry-forward bullets #1/#2/#3; DO-2 port-binding bullet + runbook env-table bullet; DO-1 `vercel.json` bullet + build-contract bullet + runbook Vercel section bullet. Left unticked: FE-6 "Point the client at live" + "Verify every console against the live backend" (require human Render deploy); all DO-2 and DO-1 human-only bullets; DO-3 live smoke.
- **Remaining steps (human-gated):** Render login + create service + set dashboard env + capture URL → CORS reconcile → Vercel login/link + set env + `vercel --prod` + capture stable URL → feed Vercel URL back to Render CORS → DO-3 live smoke (end-to-end click-through on the deployed stack).

---

## [25/06/26] — Frontend copy cleanup: strip em-dashes + Title-Case headings `[FE]`

- **User-requested polish** (not a plan task): removed all em-dashes from user-facing frontend copy and normalised headings/subheadings to Title Case.
- **16 user-facing em-dashes removed**, rephrased (not just deleted) with fitting punctuation, across `pages/ObligationRadar.tsx` (2), `pages/FilingStudio.tsx` (8), `pages/AuditDefense.tsx` (4), `api/client.ts` (2 rendered mock strings). Examples: `"Trust demo — fabricated clause injection"` → `"Trust demo: fabricated clause injection"`; `"Tax Payable — YA2026"` → `"Tax Payable, YA2026"`.
- **Headings/subheadings Title-Cased**, e.g. `"Building defense pack…"` → `"Building Defense Pack…"`, `"DETERMINISTIC GATE — fabricated citation REJECTED"` → `"Deterministic Gate: Fabricated Citation Rejected"`. Acronyms preserved (LHDN, RM, MSIC, TIN, HITL, RAG, Form C).
- **Left untouched (out of scope):** 34 em-dashes in code/CSS comments (JSDoc, `//`, `tokens.css`) — not user-facing; backend-contract literals (clause IDs, field names, routes) byte-for-byte.
- `tsc --noEmit` clean; `bun run build` green; `biome check frontend/src` 0 errors. A later ui-ux-pro-max pass still owns the full visual redesign.

---

## [25/06/26] — DO-5: Gated CI/CD deploy pipeline `[DO]`

- **Consolidated `.github/workflows/deploy.yml`** replacing and deleting the old `ci.yml`. Single workflow, four jobs:
  - `test`: backend (`uv sync --extra dev` + `uv run pytest -q`, working-directory `backend`) then frontend (`bun install --frozen-lockfile`, `bunx tsc --noEmit`, `bun run build`, `bunx biome check frontend/src`) — both must pass; runs on every PR + push.
  - `docker-build`: smoke-build `./backend` Docker image (`needs: test`).
  - `deploy-backend`: curl the Render deploy hook (`needs: [test, docker-build]`; push to `main` only). Uses `secrets.RENDER_DEPLOY_HOOK_URL`; `-fsS -X POST` fails the job if the hook call fails.
  - `deploy-frontend`: `vercel pull --yes --environment=production` → `vercel build --prod` → `vercel deploy --prebuilt --prod` (`needs: test`; push to `main` only). Uses `secrets.VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. Production env vars (`VITE_API_BASE_URL`, `VITE_API_MOCK`) are already set in the Vercel project and pulled by `vercel pull` — not hardcoded in the workflow.
- **YAML validated:** `yaml.safe_load` parses cleanly; `if:` guards confirmed (deploy jobs skipped on PRs; no secrets needed for PR builds).
- **`ci.yml` deleted:** no duplicate test workflow remains.
- **`docs/runbook.md`** — new §4 CI/CD subsection: 4-job graph, required GitHub secrets with sources (`RENDER_DEPLOY_HOOK_URL`, `VERCEL_TOKEN`, `VERCEL_ORG_ID=team_CwktsdBSB9TLrdwdCV3dZRbg`, `VERCEL_PROJECT_ID=prj_0KnVQwxUPBqML8k4KjgPQv1iaYTE`), live URLs (`https://cukaipandai.vercel.app`, `https://cukaipandai-api.onrender.com`), note that Render native auto-deploy must be turned OFF after the first green pipeline run, manual CLI fallback documented.
- **`docs/plan.md`** — DO-5 added under Phase 3 with agent-done bullets ticked and human-gated bullets (add secrets, confirm green run, turn off Render auto-deploy) left unticked.
- **Remaining human-gated steps:** add the 4 secrets in GitHub → Settings → Secrets → Actions; push to `main`; confirm the first green run in the Actions tab; turn off Render native auto-deploy.
- **Files touched:** `.github/workflows/deploy.yml` (new), `.github/workflows/ci.yml` (deleted), `docs/runbook.md`, `docs/plan.md`, `docs/progress.md`.

---

## [25/06/26] — FE-8: seed personas + entity-picker + DEMO MODE banner; FE-6 confirmed complete `[BE]` `[FE]`

### `[BE]` — FE-8 entity fixtures seeded into `_ENTITIES`

- Added `backend/core/fixtures/entity_sinar.json` (Sinar Digital Sdn Bhd, TIN `C7654321098`, MSIC `62010`, gross income RM380k, 3 employees, SST-exempt — services SME; produces a visibly leaner obligation calendar than Acme).
- Added `backend/core/fixtures/entity_selera.json` (Restoran Selera Kita Sdn Bhd, TIN `C3219876540`, MSIC `56101`, gross income RM2.5m, 45 employees, SST-registered — employer-heavy F&B; higher headcount drives a different HR/payroll obligation profile than the other two personas).
- Extended `_ENTITIES` in `backend/api/main.py` (lines 57-64) to load all three fixtures; the `EntityRepository` / `GET /entities/{tin}` handler serves all three without further change.
- Added `test_get_entity_sinar` and `test_get_entity_selera` in `backend/tests/api/test_entity_endpoint.py` asserting 200 + correct TIN/MSIC/field values for both new personas.
- **Test result:** 107 passed, 1 warning (uv run pytest -q from `backend/`). All prior 105 tests remain green; 2 new entity tests added.

### `[FE]` — FE-8 personas + entity-picker + DEMO MODE banner + mock fix

- **`frontend/src/personas.ts`** (new): `PERSONAS` list of 3 `Persona` objects (tin, label, ssm, demoRawText) — Acme Trading / Sinar Digital / Selera Kita. Each `ssm` matches its backend fixture exactly so `getObligations` and `getEntity` tell one coherent story per persona. Each has a persona-appropriate trial-balance `demoRawText` for the Filing Studio.
- **`frontend/src/PersonaContext.tsx`** (new): `ActivePersonaProvider` wrapping React context with `{ persona, setPersona }` state; defaults to Acme. `useActivePersona()` hook exported for consumers.
- **`frontend/src/App.tsx`** — wrapped the router in `<ActivePersonaProvider>`; added `PersonaPicker` component (a `<select>` listing the 3 persona labels; on change calls `setPersona`); added `DemoModeBanner` component (rendered above the nav when `import.meta.env.VITE_DEMO_MODE === '1'`). The picker and banner use existing devkit tokens; no style overhaul.
- **`frontend/src/hooks/useEntity.ts`** — now reads `useActivePersona()` and resolves `tin` from `persona.tin` when no explicit `tin` arg is passed. All three pages call `useEntity()` with no arg and therefore track the active persona automatically.
- **`frontend/src/pages/FilingStudio.tsx`** — imports `useActivePersona`; seeds `rawText` from `persona.demoRawText`; a `useEffect` on `persona.tin` resets rawText + classify state + phase when the persona switches.
- **`frontend/src/api/client.ts`** — mock `getEntity` extended: `MOCK_ENTITIES` map covers all 3 personas (Acme + Sinar + Selera); previously threw for any TIN != ACME_TIN, now serves all 3 personas in `VITE_API_MOCK=1` mode.

### `[FE]` — FE-6 confirmed complete (live deploy + smoke test)

- The two remaining FE-6 bullets ("Point the client at live" and "Verify every console against the LIVE backend") are DONE — `VITE_API_BASE_URL` and `VITE_API_MOCK=0` were set in the Vercel dashboard and the human's end-to-end smoke test passed. Ticked in `docs/plan.md`.

### Build/lint status

- `bunx tsc --noEmit` → clean (0 errors).
- `bun run build` → 48 modules, `dist/` emitted cleanly (1.73s).
- `bunx biome check frontend/src` → 0 errors, 11 files checked.

### Notes

- The consoles remain v1/functional pending the queued ui-ux-pro-max redesign (FE-7 / future polish pass). The persona switcher is a plain `<select>` — deliberately functional, not polished.
- The FE still needs a manual `vercel --prod` to pick up the new files (CI deploy half-dormant until GitHub secrets are added). The PM will handle the redeploy.

### Files touched

- `backend/core/fixtures/entity_sinar.json` (new)
- `backend/core/fixtures/entity_selera.json` (new)
- `backend/api/main.py` (extend `_ENTITIES` list)
- `backend/tests/api/test_entity_endpoint.py` (2 new tests)
- `frontend/src/personas.ts` (new)
- `frontend/src/PersonaContext.tsx` (new)
- `frontend/src/App.tsx` (ActivePersonaProvider + PersonaPicker + DemoModeBanner)
- `frontend/src/hooks/useEntity.ts` (reads active persona tin from context)
- `frontend/src/pages/FilingStudio.tsx` (persona-aware rawText + reset effect)
- `frontend/src/api/client.ts` (MOCK_ENTITIES map for all 3 personas)

## [25/06/26] — FE-8 QA fix-pass (M1 stale-pack + M2 Selera basis-period) `[FE/BE]`

- **M1:** `AuditDefense.tsx` — added `useEffect` keyed on `entity?.tin` that resets `data`, `error`, `activeQuery`, and `technicalOpen` to initial on every persona switch; matches FilingStudio pattern. Imported `useEffect` (was missing). `AuditDefense.tsx:21-27`.
- **M2:** Varied Selera on `basis_period_start`/`basis_period_end` (Apr 2024–Mar 2025 FY vs Acme's Jan–Dec 2025). Synced identically across all three places: `backend/core/fixtures/entity_selera.json`, `frontend/src/personas.ts`, `frontend/src/api/client.ts`. Result: Selera's obligation calendar has different Form C (Oct 2025 vs Jul 2026), CP204, einvoice, and SST due-dates from Acme's — visibly distinct without changing any obligation logic.
- **Tests:** `uv run pytest -q` → 107 passed (unchanged). `bunx tsc --noEmit` → clean. `bun run build` → 48 modules green. `bunx biome check frontend/src` → 0 errors.
- `frontend/src/api/client.ts` (MOCK_ENTITIES map for all 3 personas)

---

## [25/06/26] — Redesign Wave 1 (RW-1 → RW-6) `[FE]`

**All six Wave-1 tasks implemented in one pass.**

### RW-1 — AppShell layout (gating)

- Created `frontend/src/layouts/AppShell.tsx`: ProofRank-pattern shell stripped of auth/notifications/settings. Owns: `.page-scroll` → `.topbar` (hamburger + brand lockup + controls) → `<main className="app-shell"><Outlet/>` → `.drawer-layer` → `.app-footer`. All CSS reused from `tokens.css` (no new CSS authored). Drawer closes on Escape, backdrop click, and link click.

### RW-2 — LogoMark (inline SVG)

- Created `frontend/src/components/icons.tsx` exporting `LogoMark` (30×30 inline SVG, ledger/document-stamp motif in `currentColor` — no image asset, no `public/` dir), `ThemeIcon` (sun/moon by theme prop), `ProfileIcon`. Used in topbar, drawer head, and footer in all three slots.

### RW-3 — Route consoles under the shell + surgical layout pass

- Rewrote `frontend/src/App.tsx`: `<ActivePersonaProvider>` → `<BrowserRouter>` → single `<Route element={<AppShell/>}>` wrapping index/obligations/filing/audit-defense/404. Old inline topbar + NavLinks + `PersonaPicker` + `DemoModeBanner` removed from App.tsx (shell owns all of this now; DEMO MODE banner lives in AppShell).
- Removed the `<div className="app-shell">` outer wrapper from `ObligationRadar.tsx`, `FilingStudio.tsx`, `AuditDefense.tsx` — replaced with `<>…</>` fragment; page-head + window internals untouched. All data-fetching, persona wiring, HITL flow, citation/badge rendering, and api/client.ts calls are 100% unchanged.

### RW-4 — Theme toggle

- Created `frontend/src/hooks/useTheme.ts` (adapted from ProofRank; localStorage key = `cukaipandai-theme`; respects `prefers-color-scheme`; persists across reload).
- Dark-mode audit: all four surfaces use CSS custom properties throughout. The only rgba values in page files are pre-existing alpha tints of `--denim`/`--rust` (legible on the dark `#10141c` base). Toggle is included (not hidden). Dark mode is legible on all surfaces.

### RW-5 — Dashboard hub at `/` + entity-switcher upgrade

- Created `frontend/src/pages/Dashboard.tsx`: time-of-day greeting + 3-card grid (Obligation Calendar · Cited Form C Filing · Audit Defense), each card a `.window` `<Link>` with title, description, mono kicker. Responsive (`auto-fit minmax(260px,1fr)`).
- `/` is now the dashboard hub (index route). `/obligations` stays reachable from hub cards and drawer.
- Entity switcher moved into AppShell topbar as a styled `<select>` reading/writing `useActivePersona()` — the exact same `PersonaContext` all consoles read via `useEntity`. No behaviour change; only presentation upgraded.

### RW-6 — In-shell 404

- Created `frontend/src/pages/NotFound.tsx`: uses `.empty-window`/`.empty-body`/`.empty-arrow`/`.empty-hello` devkit classes. Friendly copy + `<Link to="/">` back to dashboard. Mounted as `<Route path="*">` inside the AppShell route — topbar + footer always present on unknown paths.

### Build / lint status

- `bunx tsc --noEmit` → clean (0 errors)
- `bun run build` → green (53 modules, 219kB JS)
- `bunx biome check frontend/src` → 0 errors (16 files checked)
- `tokens.css` unchanged

### Deferred (Wave 2+)

- Marketing landing, auth/guest gate, settings depth, chat surface, persistent sidebar rail, console-internals redesign — all remain in the Wave 2+ deferred list as documented.

---

## [25/06/26] — Redesign Wave 2: Dashboard Hub Depth `[FE]`

**Task:** Fill the ~50% empty dead space below the action cards with real, data-driven content.

### Changes

- **`frontend/src/api/client.ts`** — Extended `MOCK_OBLIGATIONS` from a single shared dataset to `MOCK_OBLIGATIONS_BY_TIN` (a `Record<string, ObligationCalendar>` keyed by TIN) so persona switching fetches different obligation sets:
  - Acme Trading: 4 obligations (Form C, CP204 overdue, CP37 overdue, SST-02)
  - Sinar Digital: 3 obligations (Form C, CP204 overdue, CP204A)
  - Selera Kita: 4 obligations (Form C overdue, CP204 overdue, SST-02, Audited Accounts overdue)
  - `getObligations` now resolves `MOCK_OBLIGATIONS_BY_TIN[tin] ?? MOCK_OBLIGATIONS` in mock mode.

- **`frontend/src/pages/Dashboard.tsx`** — Rewrote to add a content section below the action cards:
  - **`DeadlinesPanel`** (2/3 width, primary column): calls `getObligations(persona.tin, persona.ssm)`, sorts soonest-first by `due_date`, renders each obligation with: form badge (rust if overdue, denim if current), obligation type, `rule_id · config_version` mono meta, formatted due date, and a countdown pill ("Xd overdue" in rust, "in Xd" in mustard if urgent ≤30d, plain otherwise). Re-fetches on persona switch via `key={persona.tin}`. Loading state shows `.barber` strip. "Open full calendar →" footer link.
  - **`SnapshotPanel`** (1/3 width, secondary column): uses `useEntity()` hook, shows RM-formatted gross income as a hero figure, then a 2-column facts table (MSIC codes, SST registered, basis period, employee count, paid-up capital). Re-fetches on persona switch via `key={\`snap-${persona.tin}\`}`. Loading state shows `.barber` strip.
  - **`TrustStrip`** (full-width, 3-column): sovereign · cited · audit-ready, each with a one-line detail. Static, no invented data.
  - Countdown logic: `countdown(dueDate)` computes `diffDays` from midnight-normalised today; negative → "Xd overdue" (`overdue: true`); 0 → "Due today"; 1 → "Due tomorrow"; else "in Xd". Urgency: ≤30d remaining (not overdue).

### CSS

- No new CSS added. All styling uses exclusively existing devkit tokens: `.window`, `.titlebar`, `.titlebar-meta`, `.closebox`, `.req-list`, `.requirement-row`, `.barber`, `var(--rust)`, `var(--denim)`, `var(--mustard)`, `var(--ink-soft)`, `var(--font-mono)`, `var(--font-display)`, `var(--font-body)`, `var(--border)`.

### Verification

- `bunx tsc --noEmit` → clean (0 errors)
- `bun run build` → green (53 modules, 226kB JS gzip 69kB)
- `bunx biome check frontend/src` → 0 errors (16 files checked)
- Persona switch: `DeadlinesPanel` and `SnapshotPanel` both carry `key` prop tied to `persona.tin` — forces React remount and fresh `useEffect` fetch on each switch.
- Dark mode: all color references are `var(--…)` tokens; no literal hex. Both themes use the correct rust/mustard/denim/ink-soft contrast.
- Mock mode (`VITE_API_MOCK=1`): all three personas return distinct obligation sets; entity snapshot shows correct entity per persona.

### Files touched

- `frontend/src/api/client.ts`
- `frontend/src/pages/Dashboard.tsx`

### [25/06/26] — Wave 2 post-ship fixes (badge overflow + mock-fidelity) `[FE]`

- **Badge fix:** form badge column widened from `56px` to `80px` with `overflow:hidden; text-overflow:ellipsis; min-width:0` so long labels (e.g. `MyInvois`) truncate cleanly without overlapping the row title; short labels (`CP204`, `C`, `CP39`) unaffected.
- **Mock-fidelity:** rewrote all three persona obligation sets in `MOCK_OBLIGATIONS_BY_TIN` to mirror `derive_obligations()` exactly — canonical `oblig.*` rule_ids, correct `obligation_type` values, `config_version:'YA2026.1'`; removed invented `ITA_s77A`/`ITA_s107C`/`ITA_s109`/`SST_s26`/`CA_s259` references and non-existent forms (`CP37`, `CP204A`, `Audited Accounts`); Sinar (sst_registered=false, gross_income=380k) now correctly omits SST-02 and MyInvois; Selera (sst+45 employees) now includes SST-02+CP39+MyInvois as the backend would emit; due dates derived from `form_c_deadline`/`cp204_deadline` logic per each persona's basis period. Build/lint: `tsc --noEmit` clean, `bun run build` green (53 modules), `biome check` 0 errors.

---

## [25/06/26] — DO-5 CI bug fix: add setup-bun to deploy-frontend job `[DO]`

- **Root cause:** `deploy-frontend` calls `vercel build`, which auto-detects `bun.lock` and tries `bun install`, but Bun was not on PATH in that job (only the `test` job ran `oven-sh/setup-bun`).
- **Fix:** added `- uses: oven-sh/setup-bun@v2` with `if: env.HAS_VERCEL == '1'` guard immediately after the secret-check step and before "Install Vercel CLI", mirroring the version pin used in the `test` job. All existing `if: env.HAS_VERCEL == '1'` guards on vercel steps and the `environment: { name: production }` block unchanged.
- **YAML validated:** `python3 -c "import yaml; yaml.safe_load(open(...))"` → valid.
- **Runbook note added:** `docs/runbook.md` §4 deploy mechanism line for frontend now notes that `deploy-frontend` installs Bun via `oven-sh/setup-bun` so `vercel build` can run the project's bun-based build.
- **Files touched:** `.github/workflows/deploy.yml`, `docs/runbook.md`.

---

## [25/06/26] — Redesign Wave 3 — Entry Journey: Landing + Auth/Guest Gate `[FE]`

- Created `frontend/src/layouts/MarketingShell.tsx` + `MarketingShell.css`: standalone marketing layout (sticky topbar with LogoMark + wordmark + theme toggle + "Get Started" CTA → `/login`; fixed denim footer reusing `.footer-*` tokens). No AppShell dependency.
- Created `frontend/src/pages/Landing.tsx` + `Landing.css`: full editorial marketing landing — pinned hero with denim-gradient background and cream overlay, "how it works" 3-step sticky-left / scrolling-right-cards section mapped to the three consoles (Obligations / Filing / Audit Defense), fixed dark-band sovereignty section (4 trust cards: sovereign inference · deterministic gate · decision-support · YA2026-sourced), and a finale CTA to `/login`. All content grounded to the real product story; no fabricated metrics, pricing, or testimonials.
- Created `frontend/src/pages/LoginGate.tsx` + `LoginGate.css`: 50:50 ProofRank-layout auth/guest gate — left denim hero panel (wordmark + tagline + Caveat script line + mono footer), right cream panel with "Continue as Guest →" (sets `localStorage` flag, navigates to `/dashboard`), plus disabled SSO + email fields labeled "coming soon" (no real auth backend).
- Updated `frontend/src/App.tsx`: routing restructured — `/` and `/login` render under `MarketingShell` (no AppShell); `/dashboard`, `/obligations`, `/filing`, `/audit-defense`, and `*` remain under AppShell. No hard auth guard on any route (demo-friendly).
- Updated `frontend/src/layouts/AppShell.tsx`: topbar brand-lockup `to="/"` → `to="/dashboard"`, drawer brand link `to="/"` → `to="/dashboard"`, drawer "Dashboard" NavLink `to="/"` → `to="/dashboard"`.
- All existing consoles + persona switching + in-shell 404 unaffected; Dashboard hub still at `/dashboard`.
- **Build:** `bunx tsc --noEmit` clean; `bun run build` → 59 modules, 0 errors, 1.73s; `bunx biome check frontend/src` → 0 errors.
- **Files touched:** `frontend/src/App.tsx`, `frontend/src/layouts/AppShell.tsx`, `frontend/src/layouts/MarketingShell.tsx` (new), `frontend/src/layouts/MarketingShell.css` (new), `frontend/src/pages/Landing.tsx` (new), `frontend/src/pages/Landing.css` (new), `frontend/src/pages/LoginGate.tsx` (new), `frontend/src/pages/LoginGate.css` (new), `docs/plan.md`, `docs/progress.md`.
- **[25/06/26 cleanup]** Em-dashes swept from all user-facing FE copy (AppShell banner/popover, Landing steps/mock copy, Dashboard trust strip + card desc, NotFound titlebar — 9 strings across 4 files; re-enforcing the PR rule); marketing CSS literal hex tokenized in `Landing.css` (8 literals → `var(--ink/ink-soft/denim)`, 4 redundant dark overrides removed) and `LoginGate.css` (3 `#e9edf3` → `var(--ink)`); build: tsc clean, `bun run build` green (59 modules), biome 0 errors.

---

## [25/06/26] — Redesign Wave 4 — Filing Studio Stepper `[FE]`

- Rewrote `frontend/src/pages/FilingStudio.tsx` to a Layak-style numbered stage stepper while preserving all existing filing functionality (classify, HITL start/resume, one-shot fallback, risk flags, 96px hero, honest-number IA, FigureTrace details, sovereign badge).
- **Stage model:** five `StageId` values (`classify` / `compute` / `risk` / `approval` / `finalized`) with `StageStatus` (`pending` / `running` / `awaiting` / `complete` / `error`) derived purely from the existing `Phase` union type; no new state variables added.
- **Stage 01 (Classify Line Items):** drives `classifyTrialBalance`; write-back "Read your trial balance, N line items classified"; `Stage1Detail` sub-component shows the `LineItem[]` with category badges and the `SovereignBadge` from `classifyResult.sovereign`/`active_model`.
- **Stage 02 (Compute Form C):** drives `startFiling`; write-back shows chargeable income + tax payable from `computation.fields`; existing `ComputationPanel` (96px hero, honest-number IA, per-figure `FigureTraceRow` `<details>`) is unchanged and re-rendered as "Stage 02 - Computed (Pending Approval)".
- **Stage 03 (Risk Assessment):** write-back "X high, Y medium risk flags detected" or "No risk flags detected"; existing `RiskFlagList` rendered inside a dedicated Stage 03 window card.
- **Stage 04 (Human Approval):** status "AWAITING YOU" (mustard) while `pending_approval`; existing Approve/Reject buttons driving `resumeFiling`; 404-safe error path unchanged.
- **Stage 05 (Finalized):** write-back "Filing finalized" or "Filing rejected, returned for revision"; `ComputationPanel` re-rendered with final `resumeFiling` result; "Start Over" resets to classified state.
- **Stepper card:** `Filing Pipeline` window shows all five `StageRow`s (numbered circle with check on complete; stage name in Fraunces; write-back in Space Mono; status badge in denim/mustard/rust/ink-soft); active stage highlighted with `--screen` background; barber-pole progress indicator in the titlebar while loading.
- **"Show technical details" disclosure:** `TechnicalDetails` component expands to `route_info` (`sovereign` / `active_model` from the classify call) + deterministic core trace per figure (`rule_id` / `config_version` / `inputs` / `value` for every `computation.fields` entry). FE-side only, no new endpoint.
- **One-shot path preserved:** "One-Shot (No Gate)" button after classify completes calls `getFormC` and wraps the result into the same `approved` phase.
- **No new CSS file added:** stepper layout uses exclusively existing token classes (`.window`, `.titlebar`, `.titlebar-meta`, `.req-list`, `.requirement-row`, `var(--denim)`, `var(--mustard)`, `var(--rust)`, `var(--ink-soft)`, `var(--screen)`, `var(--font-mono)`, `var(--font-display)`).
- **Build:** `bunx tsc --noEmit` clean; `bun run build` green (59 modules, 1.80s); `bunx biome check frontend/src` 0 errors.
- **Files touched:** `frontend/src/pages/FilingStudio.tsx`, `docs/plan.md`, `docs/progress.md`.

---

## [25/06/26] — Redesign Wave 5: Polish and Cohesion `[FE]`

- **Fix 1 — Responsive topbar (real bug):** Added `className="topbar-mock-chip"` and `className="topbar-entity-select"` to the respective elements in `AppShell.tsx`. Added `@media (max-width: 480px)` block in `tokens.css` that hides `.topbar-wordmark` (LogoMark stays visible) and `.topbar-mock-chip`, and shrinks `.topbar-entity-select` to `max-width: 100px`. Desktop layout (>480px) unchanged. MarketingShell topbar already wraps cleanly at 520px — no overlap risk.
- **Fix 2 — Console cohesion + Obligation Radar:** Rewrote `ObligationRadar.tsx` to use a `.proof-grid` two-column layout (entity snapshot panel on the left, filing obligations on the right) matching the Dashboard hub's density and visual structure. Obligation rows now use the hub's deadline-row treatment: form badge (denim/rust) + obligation type + formatted due date + countdown pill (overdue in `--rust`, urgent in `--mustard`, future in `--ink-soft`). All four app pages share the existing `.app-shell` container (consistent max-width / padding / top spacing) — no container divergence to normalize. The `.proof-grid` collapses to single-column at `max-width: 900px`. No fabricated data added.
- **Fix 3 — FilingStudio Phase union nit:** In `FilingStudio.tsx` line 41, removed `classify: ClassifyResponse` from the `| { tag: 'classified' }` variant. Updated the two `setPhase({ tag: 'classified', classify: ... })` callsites (lines 730 and 778) to `setPhase({ tag: 'classified' })`. The field was set but never read (`phase.classify` has zero reads; the separate `classifyResult` state is used throughout). Zero behavior change.
- **Build:** `bunx tsc --noEmit` clean; `bun run build` green (59 modules); `bunx biome check frontend/src` 0 errors (22 files checked).
- **Files touched:** `frontend/src/layouts/AppShell.tsx`, `frontend/src/styles/tokens.css`, `frontend/src/pages/ObligationRadar.tsx`, `frontend/src/pages/FilingStudio.tsx`, `docs/plan.md`, `docs/progress.md`.

---

## [25/06/26] — Settings feature + sidebar reorder `[FE]`

- **Task 1 — Settings page (`/settings`):** New `frontend/src/pages/Settings.tsx` + `Settings.css` under the AppShell (topbar/drawer/footer shell). Three sections:
  - **Appearance:** dark/light theme toggle wired to `useTheme` (instant apply; persists via `cukaipandai-theme` localStorage key).
  - **Workspace:** default entity selector over `PERSONAS`; selection writes `cp_default_persona` to localStorage, calls `setPersona` to apply immediately, and is read back by `PersonaContext` on next load (initial state now calls `readDefaultPersona()` which checks localStorage before falling back to `DEFAULT_PERSONA`).
  - **About:** read-only block — app name/description, GitHub link, "Decision support, not legal advice", YA2026.
  - **Reset:** "Reset all preferences" button clears `cukaipandai-theme` + `cp_default_persona` and reloads.
- **Task 1 — Profile popover (real, not placeholder):** `AppShell.tsx` profile button now renders a functional `.topbar-popover` with **Settings** (navigates to `/settings`, closes popover) and **Sign Out** (clears `cp_entered_as_guest`, navigates to `/`). Added `useNavigate` import. Removed disabled placeholder `Settings (Wave 2)` button.
- **Task 1 — Route:** `/settings` added to `App.tsx` under the `<AppShell />` layout route.
- **Task 2 — Sidebar group order:** Drawer nav reordered — **Workspace** (Dashboard) now comes first, **Compliance** (Obligations, Filing, Audit Defense) second. Removed `<div className="drawer-placeholder">Settings (Wave 2)</div>` from the Workspace section.
- **PersonaContext:** Exports `DEFAULT_PERSONA_KEY` constant; initial state reads from `localStorage` so persisted default survives reload.
- **Build:** `bunx tsc --noEmit` clean; `bun run build` green (61 modules); `bunx biome check frontend/src` 0 errors (24 files checked).
- **Files touched:** `frontend/src/PersonaContext.tsx`, `frontend/src/layouts/AppShell.tsx`, `frontend/src/App.tsx`, `frontend/src/pages/Settings.tsx` (new), `frontend/src/pages/Settings.css` (new), `docs/progress.md`.

---

## [25/06/26] — Wave B notification system: bell + toasts `[FE]`

- **Provider (`frontend/src/notifications.tsx`):** `NotificationProvider` holds bell list (`AppNotification[]`) + transient toasts (`TransientToast[]`). Two public callsites: `notify()` pushes to the bell AND fires a 4s auto-dismiss toast; `toast()` fires a transient toast only (no bell entry). `markAllRead()` marks all unread, `dismiss(id)` removes from the list. `seedDeadlines()` accepts an obligations array and adds bell entries for overdue (`error`) and due-within-30d (`warning`) items, keyed by `form:due_date` to prevent re-fire on re-render. A `_clearSeeds` escape hatch resets the seeded keys when the persona changes. `unreadCount` is derived. `<ToastContainer>` renders inside the provider, fixed top-right, z-index 200. All colors are tokens (`var(--rust)`, `var(--mustard)`, `var(--denim)`).
- **BellIcon (`frontend/src/components/icons.tsx`):** Added `BellIcon` SVG component matching devkit style.
- **Toast CSS (`frontend/src/styles/tokens.css`):** Added `.toast-container`, `.toast-item` (left `3px` border accent), `.toast-header`, `.toast-kind`, `.toast-title`, `.toast-close`, `.toast-body`, `@keyframes toast-in`, `.notif-kind-dot`, `.popover-detail`. All token-only; legible in light + dark.
- **App.tsx:** Wrapped `<BrowserRouter>` in `<NotificationProvider>` (inside `<ActivePersonaProvider>`).
- **AppShell.tsx:** Replaced `profileOpen: boolean` with `activePopover: TopbarPopover` (`'notifications' | 'profile' | null`) so bell and profile popover are mutually exclusive. Bell button added between entity switcher and profile — `topbar-control-button`, `topbar-badge` for `unreadCount`. Notifications dropover lists items newest-first with a kind dot, title, optional body, relative time. "Clear all" dismisses all. Opening the dropover marks all read (badge clears). Escape + outside-click close both popovers. On mount, calls `getObligations` for the active persona and seeds deadline notifications (once per TIN). On persona switch, calls `notify()` for an "Entity Switched" toast, clears seeded keys, then re-seeds for the new persona. No toast loop: seeded-set guard + seededTinRef ensure exactly one seed call per TIN per session.
- **FilingStudio.tsx:** `handleApprove(true)` calls `notify({ title: 'Filing Finalized', kind: 'success' })`; `handleApprove(false)` calls `notify({ title: 'Filing Returned', kind: 'warning' })`.
- **AuditDefense.tsx:** After `getAuditDefense` resolves in `'fabrication'` mode, if any citations are unverified calls `notify({ title: 'Fabricated Citation Rejected', kind: 'error' })` — the deterministic gate trust money-shot surfaced as a toast.
- **Settings.tsx:** `handleDefaultPersonaChange` calls `toast({ title: 'Default Entity Updated', kind: 'info' })` on save.
- **Non-regression:** profile popover path preserved; entity switcher unchanged; AppShell guest flow unchanged; ObligationRadar, Dashboard, NotFound, Landing, Auth pages untouched.
- **Build:** `bunx tsc --noEmit` clean; `bun run build` green (66 modules, 1.87s); `bunx biome check frontend/src` 0 errors (29 files checked).
- **Files touched:** `frontend/src/notifications.tsx` (new), `frontend/src/components/icons.tsx`, `frontend/src/styles/tokens.css`, `frontend/src/App.tsx`, `frontend/src/layouts/AppShell.tsx`, `frontend/src/pages/FilingStudio.tsx`, `frontend/src/pages/AuditDefense.tsx`, `frontend/src/pages/Settings.tsx`, `docs/progress.md`.

---

## [25/06/26] — Wave A auth rework: /sign-in, /sign-up, /privacy `[FE]`

- **Routes:** Replaced `/login` → `/sign-in` + `/sign-up` (both standalone, outside MarketingShell so the 50:50 grid is truly full-screen with no constrained-padding wrapper). `/login` now redirects to `/sign-in` via `<Navigate replace>` so no dead links ever 404. `/privacy` added inside MarketingShell (public, topbar + footer).
- **Split fix:** Root cause of the broken partition was the auth page rendering inside `.marketing-main` (constrained to `min(1440px, 100vw - 28px)` with 30px top padding and 144px bottom padding). Fix: auth routes are now **outside** MarketingShell entirely, matching ProofRank's pattern. `AuthScreen.tsx` + `Auth.css` own a clean `min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr` — no breakout hacks needed.
- **New files:** `frontend/src/pages/AuthScreen.tsx` (shared component, `mode: 'sign-in' | 'sign-up'`), `frontend/src/pages/Auth.css`, `frontend/src/pages/SignIn.tsx`, `frontend/src/pages/SignUp.tsx`, `frontend/src/pages/Privacy.tsx`, `frontend/src/pages/Privacy.css`.
- **SSO + email:** Both remain disabled "coming soon" placeholders. "Continue as Guest" sets `cp_entered_as_guest` and navigates to `/dashboard`.
- **Privacy page:** CukaiPandai-appropriate copy (sovereign inference, fixture-only demo, citation gate, PDPA 2010 rights, decision-support disclaimer). Linked from auth screen "By continuing you agree to our Privacy Policy" and from marketing footer.
- **Tagline removed from auth:** "YA2026 · decision-support, not legal advice." removed from auth screen (was `lg-legal`). It remains in the MarketingShell footer and Settings about section.
- **Link updates:** Landing "Get Started" + "Open the Demo" → `/sign-in`; MarketingShell "Get Started" CTA → `/sign-in`; footer gains "Privacy" → `/privacy` link. Old `LoginGate.tsx`/`LoginGate.css` remain on disk (no longer imported or routed; can be cleaned up later).
- **Dark mode:** `Auth.css` uses only design tokens (`--denim`, `--paper`, `--ink`, `--mustard`, `--window`, `--screen`, `--border`, `--shadow`, `--radius`, font vars). No literal hex. Tokens switch automatically under `[data-theme="dark"]`.
- **Build:** `bunx tsc --noEmit` clean; `bun run build` green (65 modules); `bunx biome check frontend/src` 0 errors (30 files).

---

## [25/06/26] — Wave C: landing hero image + FAQ (items 1 + 6) `[FE]`

- **Hero background image (item 1):** Copied ProofRank's `hero-background.webp` into the new `frontend/public/marketing/hero-background.webp` (74.9K). Applied it as the landing hero background in `Landing.css`: the existing left-to-right cream/ink scrim gradient is kept as the top layer for copy legibility, the prior solid denim gradient is now a translucent denim tint (rgba), and `url("/marketing/hero-background.webp") center / cover no-repeat` sits beneath. Light + dark `.lp-hero` both updated; the `max-width: 640px` flat-scrim fallback reworked to a single semi-opaque wash over the image (0.86 light / 0.90 dark) so text stays legible on narrow screens. Hero copy/CTAs unchanged.
- **FAQ data (shared):** New `frontend/src/faqData.ts` — 21 honest, app-relevant Q/A pairs typed by `FaqCategory` across 5 categories: Getting Started, Sovereignty & Data, Citations & Accuracy, Filing & Compliance, Privacy & Account. 5 marked `featured: true` (a spread across categories) for the landing. Content covers what the app does (obligation calendar, cited Form C, audit defense), ILMU nemo-super sovereign in-country inference, the deterministic citation gate, YA2026-sourced figures, decision-support-not-legal-advice, the HITL approval gate, the fixtures-only demo, and PDPA-generic privacy. No fabricated rates/thresholds/prices/statistics/guarantees.
- **Landing FAQ section (item 1):** Added an `#faq` section to `Landing.tsx` (above the finale CTA, inside the fold) rendering the 5 featured pairs as document-style expandable `<details>` (Fraunces question, mono index + toggle that rotates to a rust × on open, DM Sans answer, category pill). A "See All Questions" link routes to `/faq`. New `.lp-faq*` styles in `Landing.css`, token-only, with a dark-theme tonal step (`[data-theme="dark"] .lp-faq`).
- **/faq page (item 6):** New route `/faq` under AppShell (so it gets shell chrome) in `App.tsx`; new `frontend/src/pages/Faq.tsx` + `Faq.css`. Renders all 21 pairs in a `.window` with titlebar, a case-insensitive search input filtering on question/answer text, category filter chips (All + each category) with `aria-pressed`, a live result count, document-style expandable `<details>` items, and an empty state ("No matching questions." + Clear Filters). `Faq.css` adapted from ProofRank's FAQ style (pagination dropped, chips added); token-only so light + dark work.
- **Nav:** Added a "FAQ" `NavLink` to the drawer's Workspace group (under Dashboard) in `AppShell.tsx`, routing to `/faq`.
- **Non-regression:** Landing's How/Trust/Finale sections, the shell chrome, consoles, and existing nav groups untouched. Hero copy/CTAs preserved.
- **Dark mode:** Hero image overlay keeps text legible in both themes (scrim opacities tuned per theme); landing FAQ + `/faq` use only design tokens, so both render correctly under `[data-theme="dark"]`.
- **Build:** `bunx tsc --noEmit` clean; `bun run build` green (69 modules, 1.87s); `bunx biome check frontend/src` 0 errors (32 files). Image confirmed at `frontend/public/marketing/hero-background.webp`.
- **Files touched:** `frontend/public/marketing/hero-background.webp` (new), `frontend/src/faqData.ts` (new), `frontend/src/pages/Faq.tsx` (new), `frontend/src/pages/Faq.css` (new), `frontend/src/pages/Landing.tsx`, `frontend/src/pages/Landing.css`, `frontend/src/App.tsx`, `frontend/src/layouts/AppShell.tsx`, `docs/progress.md`.

---

## [25/06/26] — Wave D: dashboard redesign (overview / quick-access landing) `[FE]`

- **Problem:** `/dashboard` (the post-sign-in landing) was rated "very bad" — weak notion, unpleasant layout, no obvious next step. Prior layout: greeting + 3 equal flat console cards + Upcoming Deadlines + Entity Snapshot + a trust strip floating in dead space.
- **Primary action zone (centerpiece):** Added a dominant hero card (`.dash-hero`) computed from real obligations. `leadObligation()` picks the single most-pressing item from the active persona's `getObligations` calendar: most-overdue item wins, else nearest upcoming due date. The hero shows the form badge (large Fraunces), obligation type, countdown pill, due date, and a primary CTA into the Obligation Calendar. **Urgency-aware:** if the lead is overdue the card floods `--rust` and the kicker reads "N obligations overdue"; otherwise it floods `--denim` ("Your nearest obligation"). When the lead is Form C, a secondary ghost CTA "Start Form C Filing →" routes to `/filing`. All-caught-up state renders a calm denim hero. No fabricated data — everything derives from the real obligations endpoint.
- **Quick-access hierarchy:** Replaced the 3 equal cards with a `.dash-consoles` rail under a "What You Can Do" header. The primary path (Cited Form C Filing) gets a denim accent rail + larger title; Obligation Calendar and Audit Defense are compact secondary links. Doubles as the first-view "here's what you can do" orientation.
- **Overview at a glance:** Kept Upcoming Deadlines (countdown/overdue pills, sorted soonest-first incl. overdue) and Entity Snapshot, now in a balanced `.dash-overview-grid` (matching `minmax(0,1.55fr) minmax(260px,1fr)` columns, `align-items: stretch`, `.dash-panel { height:100% }`) so columns are equal-height with no dead space. The Entity Snapshot's redundant "Gross income" row was dropped (already the hero number) so the panel heights align. Removed the floating trust strip.
- **Strong notion / first-view:** Confident greeting + orienting subline ("Your YA2026 tax command center for {entity}. Track deadlines, file a cited Form C, and build audit-ready defenses.") + a real status summary line (`StatusSummary`): "N obligations · M overdue · next due {date}", all computed from the live calendar; overdue count turns rust when > 0.
- **Data flow:** The obligations fetch is lifted into `Dashboard` and shared by the hero, status summary, and deadlines panel (one `getObligations` call per persona). Re-renders on persona switch via `useActivePersona` (`useEffect` keyed on `persona.tin`/`persona.ssm`); Entity Snapshot keyed `snap-${tin}`. Works in mock (`VITE_API_MOCK=1`) and live.
- **Styling:** All new CSS scoped under `.dash-*` in `tokens.css`, token-only (denim/rust floods reuse the existing `.flood` pattern; `--paper` CTAs/pills invert on the flood). Light + dark both verified by screenshot (rust hero reads as warm coral on the dark blueprint base, CTA legible). No em-dashes in copy; Title Case headings; acronyms preserved (Form C, CP204, SST, MSIC, YA2026, HITL, RAG).
- **Non-regression:** Shell/nav/notifications/consoles untouched; only `Dashboard.tsx` restructured and a scoped CSS block added.
- **Build:** `bunx tsc --noEmit` clean; `bun run build` green (69 modules, 1.88s); `bunx biome check frontend/src` 0 errors (32 files).
- **Files touched:** `frontend/src/pages/Dashboard.tsx`, `frontend/src/styles/tokens.css`, `docs/progress.md`.

---

## [25/06/26] — Neon persistence verified end-to-end (DO-4 + BE-15/16/17) `[BE]` `[DO]`

- **Local seam suite: 19/19 passed** — pooled PgBouncer connect (`prepare_threshold=0`) + direct unpooled endpoint both reach Neon; schema applied (`audit` / `links` / `entities` / `filings` / `defense_packs`); `make_checkpointer()` returns a real `PostgresSaver` and auto-creates `checkpoints*` tables (BE-15); `EvidenceVault` audit+links roundtrip stores and reads back hashes (BE-16); `EntityRepository` reads from Neon with fixtures fallback (BE-17); DB-down path falls through to `None` checkpointer / in-memory vault / fixture reads without raising.
- **Fallback suite: 107/107 passed** — `env -u DATABASE_URL -u DATABASE_URL_UNPOOLED uv run pytest -q` against no DB, all tests green; no regression.
- **Live deployed (Render):** HITL filing `start`→`resume` flow confirmed over the wire (tax_payable RM675,000); `thread_id` confirmed persisted in Neon (`checkpoints` rows written); the deployed instance is actively writing to Neon, not the in-process fallback.
- **Neon details:** PostgreSQL 18.4, `aws-ap-southeast-1` Singapore region (Q9 sovereignty caveat stands — SG not MY; prod path = self-hosted MY-region Postgres, identical schema, deploy-config swap).
- **DB-down ≠ demo-down confirmed:** hero beats (cited Form C, audit-defense, fabricated-citation rejection) run on deterministic seeded data and do not hard-depend on Neon.
- **EntityRepository note:** `entities` table is intentionally empty in Neon — `EntityRepository` serves fixtures by design; seeding it from fixtures is a documented optional future step.
- **Docstring updated:** `backend/api/persistence.py` NOTE revised from "not yet verified" to verified, citing the durable checkpointer + evidence vault + entity repo + fallbacks.
- **Plan ticked:** DO-4 (all 3 bullets), BE-15 (all 4 bullets), BE-16 (both bullets), BE-17 (all 3 bullets) marked `[x]` in `docs/plan.md`.

---

## [26/06/26] — JR-1: PersonaContext runtime custom-entity + useEntity local-first resolution `[FE]`

- **What changed:**
  - `PersonaContext.tsx` extended: added `customPersonas: Persona[]` state seeded from `localStorage` key `cp_custom_entities`; `addCustomPersona(p)` (`useCallback`) upserts into the list, persists to localStorage, and sets the persona active; exposed derived `personas = [...PERSONAS, ...customPersonas]` via context alongside `customPersonas` and `addCustomPersona`. `useMemo` stabilises the context value object. `readDefaultPersona` now receives the merged list so a custom-TIN default survives reload.
  - `hooks/useEntity.ts` updated: before calling `getEntity`, checks if `resolvedTin` matches any entry in `customPersonas`; if so, returns its `ssm` as `EntityTaxProfile` directly — no network call, no throw in mock mode, no 404 in live mode. Built-in TINs continue through `getEntity` unchanged. `customPersonas` added to the `useEffect` dependency array.
  - `layouts/AppShell.tsx`: dropped `import { PERSONAS } from '../personas'`; destructures `personas` from `useActivePersona()`; the entity `<select>` `onChange` and `map` now use the context-provided merged list. Side-effects (Entity Switched toast, deadline re-seed) fire for custom entities identically to built-ins — `useEffect` keys on `persona.tin`/`persona.label`/`persona.ssm`, unchanged.
  - `pages/Settings.tsx`: dropped `import { PERSONAS } from '../personas'`; destructures `personas` from `useActivePersona()`; the default-entity `<select>` and `handleDefaultPersonaChange` use the merged list.
  - Dashboard: no change needed — uses `useEntity()` which already flows through the updated hook.
- **JR-Q5 (Sign-Out):** confirmed `AppShell.tsx` Sign-Out only removes `cp_entered_as_guest`; `cp_custom_entities` is NOT cleared — custom entities persist across Sign-Out as decided.
- **Custom-TIN no-white-screen reasoning:** `useEntity` short-circuits on `customPersonas` match before any `getEntity` call. In mock mode this avoids the `MOCK_ENTITIES` throw (`client.ts:488`); in live mode it avoids the `/entities/{tin}` 404 (`main.py:116-118`). Both the Obligations and Dashboard Entity Snapshot panels consume `useEntity()` — both safe. Filing Studio and Audit Defense pass `ssm` directly from `persona.ssm` (via `useActivePersona`) rather than through `useEntity`, so they are unaffected even without the hook short-circuit.
- **Build:** `bunx tsc --noEmit` clean (0 errors); `bun run build` green (69 modules, 2.01s); `bunx biome check frontend/src` 0 errors (32 files).

---

## 2026-06-26 [BE] Wave J0 — BE-J1 POST /entities + BE-J2 POST .../documents/upload

**BE-J1 — POST /entities (create + persist custom entity)**

- Added `EntityRepository.create(data)` to `api/persistence.py`: writes to `_fixtures` (in-memory) unconditionally first, then best-effort upsert to Neon (`INSERT ... ON CONFLICT DO UPDATE`); DB errors silently swallowed; DB-down != demo-down guarantee preserved.
- Added `POST /entities` route to `api/main.py`: validates `req["ssm"]` via existing `_profile()` helper (422 on bad input), calls `_ENTITY_REPO.create()`, returns normalised `EntityTaxProfile.model_dump(mode="json")`. Upsert-safe on duplicate TIN.
- Tests: `tests/api/test_create_entity_endpoint.py` — 200 create, create->GET round-trip (in-memory fallback, no DATABASE_URL), 422 on bad SSM, upsert on duplicate TIN (4 tests).

**BE-J2 — POST /entities/{tin}/documents/upload (multipart -> extract -> classify)**

- Added `_extract_text(filename, bytes)` helper to `api/main.py`: CSV via stdlib `csv`, XLSX via `openpyxl`, PDF via `pypdf`; raises HTTP 415 on unsupported extension (in-process only, no foreign API).
- Added `POST /entities/{tin}/documents/upload` route: reads `UploadFile` bytes -> 422 if empty -> `_extract_text` (415 on bad type) -> existing `classify_line_items` -> same `ClassifyResponse` shape as `POST .../documents/classify` including `route_info`; 502-guarded on unparseable model output via `_PARSE_ERRORS`.
- Added deps to `backend/pyproject.toml`: `pypdf>=4.0`, `openpyxl>=3.1`, `python-multipart>=0.0.9`. Ran `uv lock` -- `uv.lock` updated (+4 packages: pypdf, openpyxl, et-xmlfile, python-multipart).
- Fixtures: `tests/api/trial_balance.csv`, `tests/api/trial_balance.xlsx`, `tests/api/trial_balance.pdf` (tiny Acme-consistent files).
- Tests: `tests/api/test_upload_endpoint.py` -- CSV/XLSX/PDF each return valid `ClassifyResponse`; unsupported format -> 415; empty file -> 422 (5 tests).

**Files touched:** `backend/api/main.py`, `backend/api/persistence.py`, `backend/pyproject.toml`, `backend/uv.lock`, `backend/tests/api/test_create_entity_endpoint.py`, `backend/tests/api/test_upload_endpoint.py`, `backend/tests/api/trial_balance.{csv,xlsx,pdf}`.

**pytest result:** 116 passed (was 107; +4 BE-J1 + 5 BE-J2; 0 regressions).

---

## 2026-06-26 [FE] Wave J2 — JR-2 Wizard Chrome + JR-3 Welcome + JR-4 Connective Tissue

**JR-2 — Guided 3-step wizard chrome wrapping the existing consoles**

- Added `frontend/src/layouts/WizardLayout.tsx`: renders INSIDE AppShell (full chrome visible). Mounts existing console components via `<Outlet/>` at `/start/obligations`, `/start/filing`, `/start/audit-defense`. Adds a Step X of 3 progress header (step circles + connector lines, active=mustard, done=denim) + active entity chip + "Skip the tour" inline. Footer has Back (or "Welcome" on step 1) / Skip / Next or "Finish" on step 3. Finish and Skip both set `cp_journey_done` and navigate to `/dashboard`.
- Added wizard routes to `App.tsx` under `<AppShell/>`: `<Route path="/start" element={<WizardLayout/>}>` nesting `ObligationRadar`, `FilingStudio`, `AuditDefense` at their sub-paths. Standalone `/obligations`, `/filing`, `/audit-defense` routes unchanged.
- Entity pinning (T2): `WizardLayout` reads `persona` at render; the wizard navigation (Back/Next links) does not change persona. The one acceptable reset is if the user manually switches the topbar entity picker mid-wizard, which is the same behaviour as today on standalone routes.

**JR-3 — First-run welcome screen + journey routing/flags**

- Added `frontend/src/pages/Welcome.tsx`: one-line payoff ("Sovereign, Citation-Grounded Tax Assurance for Malaysian SMEs."), ①②③ journey OUTPUT map (via `JourneyMap`), two on-ramps ("Try Sample Data" with persona picker -> `/start/obligations`; "Use My Own Company" stub with "coming soon" badge pointing to `/start/custom` as JR-6 placeholder), and "Skip to Dashboard" escape hatch (sets `cp_journey_done`, navigates `/dashboard`).
- Added `/welcome` route to `App.tsx` under `<AppShell/>`.
- Updated `AuthScreen.tsx` `continueAsGuest()`: checks `localStorage.getItem('cp_journey_done') === '1'`; first-run users (flag absent) navigate to `/welcome`; returning users go to `/dashboard`. `cp_entered_as_guest` unchanged. Sign-Out only clears `cp_entered_as_guest` (AppShell.tsx:310 unchanged) -- `cp_journey_done` survives Sign-Out per JR-Q5.

**JR-4 — Connective tissue + Dashboard ①②③ progress**

- Added `frontend/src/components/JourneyProgress.tsx` with three exports: `JourneyMap` (full step cards, used in Welcome and any future full-page context), `JourneyStrip` (compact ①②③ strip with step circles + arrows + links, used in Dashboard), and `WhatNext` (handoff footer card with label, output description, and CTA link).
- Added `WhatNext` footer to `ObligationRadar.tsx` (-> `/filing`), `FilingStudio.tsx` (-> `/audit-defense`), and `AuditDefense.tsx` (-> `/dashboard`). Each is an additive append -- no console body modified.
- Added `JourneyStrip` to `Dashboard.tsx` at the top of the return, reading `cp_journey_done` from localStorage; strip links go to standalone console routes if journey done, wizard routes otherwise.
- Progress derivation is real-flags-only: `cp_journey_done` (single boolean) drives all states. No per-step tracking invented.
- No hardcoded tax figures/rates/thresholds in any new copy.

**Files touched:**

- `frontend/src/components/JourneyProgress.tsx` (new)
- `frontend/src/layouts/WizardLayout.tsx` (new)
- `frontend/src/pages/Welcome.tsx` (new)
- `frontend/src/App.tsx` (wizard routes + welcome route)
- `frontend/src/pages/AuthScreen.tsx` (guest routing fork)
- `frontend/src/pages/Dashboard.tsx` (JourneyStrip import + render)
- `frontend/src/pages/ObligationRadar.tsx` (WhatNext footer)
- `frontend/src/pages/FilingStudio.tsx` (WhatNext footer)
- `frontend/src/pages/AuditDefense.tsx` (WhatNext footer)

**Build results:** `bunx tsc --noEmit` clean; `bun run build` green (72 modules, was 69; +3 new modules); `bunx biome check frontend/src` 0 errors (35 files). No regressions to consoles, auth, notifications, settings, or AppShell.

- **Files touched:** `frontend/src/PersonaContext.tsx`, `frontend/src/hooks/useEntity.ts`, `frontend/src/layouts/AppShell.tsx`, `frontend/src/pages/Settings.tsx`, `docs/plan.md`, `docs/progress.md`.

---

## [26/06/26] — Wave J3: JR-5 Audit Defense rework + JR-6 Custom Company form + JR-7 File-upload UI `[FE]`

### JR-5 — Audit Defense rework

- Replaced the 2-button console with a **free-text query textarea** + 3 example **chips** (standard deduction query, depreciation query, and the labelled trust-demo fabrication chip that drives `inject_fabricated=true`). Chips auto-submit on click.
- Added a **FE-simulated 4-stage pipeline** (Retrieve Law / Ground Claim / Verify Citations / Reject Fabrications) using `setInterval` to advance stage index during the single real network call, then resolving all stages when data returns. The fabrication chip flips stage 4 to BLOCKED/rust colour. Reuses `StageRow` pattern from FilingStudio.
- Added a **pack-shape preview** (greyed skeleton: narrative placeholder bars, two citation slot previews with VERIFIED/REJECTED badges, exposure note bar) shown before any query runs, replaced by the real pack on response.
- Elevated the **fabrication money-shot** to a headline `window` panel ("Trust Payoff: The AI Cannot Fabricate a Citation and Have It Pass") shown above the narrative, with the BLOCKED stamp and both the rejected + verified citation IDs highlighted. Added an upfront trust framing banner.
- Preserved: two-tier trace, 502 handler, persona-switch reset effect, SovereignBadge, notify() on rejection, CitationPanel / VerifiedBadge. Zero backend change.
- **Files touched:** `frontend/src/pages/AuditDefense.tsx` (full rewrite of the component).

### JR-6 — Custom Company form

- Created `frontend/src/pages/CustomCompany.tsx`: a sectioned form (Company Identity / Financial Profile / Basis Period) capturing all 10 `EntityTaxProfile` fields with inline required-field validation (TIN regex `[A-Z][0-9]{10}`, MSIC 4-5 digit code list, positive numeric coercion, required dates, optional commencement).
- On submit: calls `addCustomPersona` (JR-1) immediately (localStorage + setActive), then fires `createEntity(ssm)` (best-effort BE write, `.catch` to inline warning) without awaiting, then navigates to `/start/obligations`. The local entity is always active regardless of server write outcome.
- Added `createEntity(ssm)` to `frontend/src/api/client.ts` — mock branch echoes the SSM as EntityTaxProfile (no-op).
- Added `/start/custom` route to `App.tsx` under AppShell (outside WizardLayout so it renders as a full page, not wizard-chrome).
- Updated `Welcome.tsx`: removed "coming soon" badge and stub `<a>` link; replaced with a live `<button onClick={() => navigate('/start/custom')}>`; updated description copy to reflect the form is live.
- **Files touched:** `frontend/src/pages/CustomCompany.tsx` (new), `frontend/src/api/client.ts` (+`createEntity`, +`uploadDocument`), `frontend/src/App.tsx` (+import +route), `frontend/src/pages/Welcome.tsx` (button update).

### JR-7 — File-upload UI

- Added `uploadDocument(tin, file): Promise<ClassifyResponse>` to `client.ts` using a raw `fetch` + `FormData` (no `post<T>()` JSON helper per T6; browser sets multipart boundary). Mock branch returns `MOCK_CLASSIFY`.
- Added a **drag-and-drop zone** to the FilingStudio Stage-01 block (`FilingStudio.tsx`): a `<button>` element handling `onDragOver` / `onDragLeave` / `onDrop` / `onClick` (clicking opens the hidden `<input type="file" accept=".csv,.xlsx,.pdf">`). Extension guard before upload (4-5 char allow-list); upload error shows inline in `--rust` with a note to paste instead.
- On successful upload: `classifyResult` and `lineItems` set exactly as paste does, phase transitions to `classified`, and a success toast fires.
- On upload failure: inline `uploadError` shown, phase stays `idle` — paste textarea fully functional, never a white-screen.
- Paste textarea + Classify button preserved unchanged; the two paths are separated by an "or paste below" divider.
- **Files touched:** `frontend/src/pages/FilingStudio.tsx` (+`useRef` import, +`uploadDocument` import, +state, +`handleUpload`, +`handleDrop`, +drop-zone UI).

### Hard gate results

- `bunx tsc --noEmit` clean.
- `bun run build` green: **73 modules** (was 72 pre-wave; +1 new CustomCompany page), 306 KB JS, 47 KB CSS, 1.87s.
- `bunx biome check frontend/src` **0 errors** (36 files checked).
- No backend changes; no regression to the 116-test backend suite.

**Files touched this wave:**

- `frontend/src/pages/AuditDefense.tsx`
- `frontend/src/pages/CustomCompany.tsx` (new)
- `frontend/src/pages/FilingStudio.tsx`
- `frontend/src/pages/Welcome.tsx`
- `frontend/src/api/client.ts`
- `frontend/src/App.tsx`
- `docs/plan.md` (JR-5/JR-6/JR-7 ticked)
- `docs/progress.md` (this entry)

---

## [26/06/26] — Wave J4: JR-8 Obligations enrichment (calendar viz + payoff headline) `[FE]`

### JR-8 — YA2026 calendar viz + payoff headline

- Added `ObligationSummary` component (reuses `dash-summary` / `dash-summary-alert` CSS from Dashboard Wave-D): shows "N obligations · M overdue · next due {date}" derived entirely from `data.obligations`. Renders at the top of the console, above the `proof-grid`. Updates on persona/custom switch because it's keyed to `data` state (which re-fetches on entity change via the existing `useEffect`).
- Added `ObligationCalendarViz` component: a `.window` with a 12-column month grid per year. Year span is derived from the obligations' actual `due_date` fields (not hardcoded). Each month cell shows form badges (rust for overdue, denim for upcoming) positioned by real `due_date`. A `title` attribute on each badge gives hover detail (form, date, obligation type). Legend at the bottom of the final year row. No fabricated dates or figures.
- Refactored the inline `isUrgent` IIFE in the obligations list to use the new top-level `daysUntil()` function (my change; same logic, cleaner).
- `Obligation` type added to the `client.ts` import (was `ObligationCalendar` only).

### JR-9 — Deferred (cut-tolerant; grounding constraint)

JR-9 was NOT shipped. Reason: the `computation.fields` returned by the API (`gross_income`, `adjusted_income`, `chargeable_income`, `tax_payable`) does NOT include explicit band breakdown figures (e.g. `band_1_tax`, `sme_rate_1`). The 15/17/24% band percentages are implicit in `ya_2026.yaml` on the backend but are not surfaced in the API response. Showing a band breakdown card would require either hardcoding the rate percentages (fabrication -- hard no per the grounding rule) or making an additional `/form-c` call (explicitly excluded by JR-Q4 = grounded/no-recompute). JR-9 sub-tasks remain unticked in `plan.md`. Follow-on option: extend the `FormComputation` response to include a `band_breakdown` array from the core so the FE can surface it without inventing numbers.

### Hard gate results

- `bunx tsc --noEmit` clean (0 errors)
- `bun run build` green: **73 modules** (same count; no new modules), 309 KB JS, 47 KB CSS, 1.92s
- `bunx biome check frontend/src` **0 errors** (36 files)
- No backend changes; no regression to the 116-test backend suite.

**Files touched:**

- `frontend/src/pages/ObligationRadar.tsx` (added `ObligationSummary`, `ObligationCalendarViz`, `daysUntil`; simplified inline `isUrgent`; added `Obligation` import)
- `docs/plan.md` (JR-8 all 3 sub-tasks ticked; JR-9 unticked)
- `docs/progress.md` (this entry)

---

## [26/06/26] — Wave J5 Usability Polish (post-SUS 65/100) `[BE/FE/TD]`

### P0 #3 — `createEntity` body-shape bug + 500 edge `[BE/FE]`

- Added `EntityCreateReq(ssm: dict)` to `backend/api/schemas.py` so `POST /entities` is typed at the Pydantic boundary.
- Updated `create_entity` in `backend/api/main.py` from `req: dict` to `req: EntityCreateReq`; reads `req.ssm` instead of `req.get("ssm", {})`.
- Fixed `createEntity` in `frontend/src/api/client.ts` to send `{ ssm }` wrapped (was flat `ssm`), matching the BE contract.
- Added 2 new tests in `backend/tests/api/test_create_entity_endpoint.py`: missing `ssm` key → 422; flat body → 422 (not 500).
- **Test result: 118 passed** (was 116; 2 new tests added).

### P0 #5 — Trust-Demo citation-ID consistency `[FE]`

- `FABRICATION_QUERY` and `FABRICATION_EVIDENCE` in `frontend/src/pages/AuditDefense.tsx` updated to use canonical `ITA-1967-s999-FAKE` (was `ITA s99_ZZ`). One ID now flows through query text, BLOCKED banner, and rejected chip.
- Backend `_FAKE_CLAUSE_ID = "ITA-1967-s999-FAKE"` is the authoritative source (`backend/api/agents/audit_defense.py:12`).

### P0 #1 — Plain-language relabel + remove dev labels + de-emphasize machine IDs + glosses `[FE]`

- Removed "Seeded · BE-8 / getEntity" footer from entity snapshot in `frontend/src/pages/Dashboard.tsx`.
- Renamed "Start Filing (HITL)" → "File With Review" and "One-Shot (No Gate)" → "File Without Review" in `frontend/src/pages/FilingStudio.tsx`.
- Replaced "HITL · ILMU nemo-super" kicker in `Dashboard.tsx` with "Review and Approve · ILMU nemo-super".
- Updated WhatNext copy in `frontend/src/pages/ObligationRadar.tsx` to remove "HITL gate".
- Removed always-visible `rule_id`/`config_version` from: Dashboard hero rail (now shows "YA2026" / "LHDN-sourced"); Dashboard obligation rows; ObligationRadar obligation rows; `FigureTraceRow` topline in `FilingStudio.tsx`; hero numeral sub-line in `FilingStudio.tsx`. All IDs remain inside existing `<details>` blocks.
- Replaced `rule_id and config_version` in `frontend/src/pages/Landing.tsx` and `frontend/src/pages/Privacy.tsx` with plain-language copy.
- Added "Form codes explained" `<details>` disclosure in ObligationRadar with plain-language glosses for Form C, CP204, SST-02, CP39, MyInvois.
- Enhanced `hint` text in `frontend/src/pages/CustomCompany.tsx`: TIN (LHDN gloss), MSIC (full name), SST (Sales and Service Tax), Basis Period (financial year gloss in titlebar).

### P0 #2 — Mock fidelity: per-persona classify line items `[FE/TD]`

- Replaced static `MOCK_CLASSIFY` in `frontend/src/api/client.ts` with `MOCK_CLASSIFY_BY_TIN` (Acme/Sinar/Selera each have own line items with their own `gross_income` as revenue).
- Added `makeMockClassify(tin, profile?)` that falls back to a `gross_income`-derived set for custom entities.
- `classifyTrialBalance` and `uploadDocument` now call `makeMockClassify(tin, MOCK_ENTITIES[tin])` in mock mode.
- Grounding: line items derive from the entity's own `gross_income`; no invented tax rates or thresholds.

### P1 #4 — Soften first-run OVERDUE framing `[FE]`

- Added context note below overdue count in `ObligationSummary` (`ObligationRadar.tsx`) and `StatusSummary` (`Dashboard.tsx`) when `overdueCount > 0`: "Dates shown are for the sample basis period. OVERDUE status reflects the demo clock."
- Obligation logic and genuine overdue status unchanged.

### Verify results `[TD]`

| Check                           | Result                                 |
| ------------------------------- | -------------------------------------- |
| `uv run pytest -q`              | **118 passed** (was 116; +2 new tests) |
| `bunx tsc --noEmit`             | **0 errors**                           |
| `bun run build`                 | **73 modules, built in 1.91s**         |
| `bunx biome check frontend/src` | **0 errors** (36 files)                |

**Files touched:**

- `backend/api/schemas.py` (added `EntityCreateReq`)
- `backend/api/main.py` (typed `create_entity` request; import `EntityCreateReq`)
- `backend/tests/api/test_create_entity_endpoint.py` (+2 tests)
- `frontend/src/api/client.ts` (wrapped `createEntity` body; per-persona `makeMockClassify`)
- `frontend/src/pages/AuditDefense.tsx` (citation ID consistency)
- `frontend/src/pages/Dashboard.tsx` (remove dev label; rename HITL kicker; remove machine IDs; overdue context note)
- `frontend/src/pages/FilingStudio.tsx` (rename HITL buttons; remove machine IDs from always-visible rows)
- `frontend/src/pages/ObligationRadar.tsx` (remove machine IDs; add glossary disclosure; overdue context note; WhatNext copy)
- `frontend/src/pages/CustomCompany.tsx` (enhanced hint glosses)
- `frontend/src/pages/Landing.tsx` (plain-language copy)
- `frontend/src/pages/Privacy.tsx` (plain-language copy)
- `docs/plan.md` (Wave J5 section added, all tasks ticked)
- `docs/progress.md` (this entry)

## [26/06/26] — Brand logo + favicon wire-in `[FE]`

- Replaced SVG `LogoMark` placeholder (ledger/document icon) with the panda brand logo (`/logo.png`) in all 5 brand lockup slots.
- Added `frontend/public/favicon.ico`, `frontend/public/logo.png` (128×128), `frontend/public/apple-touch-icon.png` (180×180).
- `frontend/index.html`: added `<link rel="icon" type="image/x-icon" href="/favicon.ico" />` and `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`.
- Added `.brand-logo` CSS rule to `frontend/src/styles/tokens.css` (30×30, `border-radius: 24%`, `object-fit: contain`, `flex-shrink: 0`).
- Removed orphaned `import { LogoMark }` from `AppShell.tsx`, `MarketingShell.tsx`, and `AuthScreen.tsx`. `LogoMark` definition remains in `icons.tsx` (now unreferenced externally).

**Files touched:**

- `frontend/public/favicon.ico` (new)
- `frontend/public/logo.png` (new)
- `frontend/public/apple-touch-icon.png` (new)
- `frontend/index.html`
- `frontend/src/styles/tokens.css`
- `frontend/src/layouts/AppShell.tsx` (topbar + drawer head + footer: 3 slots)
- `frontend/src/layouts/MarketingShell.tsx` (topbar + footer: 2 slots)
- `frontend/src/pages/AuthScreen.tsx` (auth hero: 1 slot)
- `docs/progress.md` (this entry)

**Build status:**
| Check | Result |
|---|---|
| `bunx tsc --noEmit` | 0 errors |
| `bun run build` | 73 modules, built in 1.92s |

---

## [26/06/26] — Wave J5 Usability Fix-2: Custom-entity classify + active persona persistence `[FE]`

Two targeted fixes surfaced by a post-SUS re-walk.

### Fix 1 (HIGH) — Custom-entity classified figures reflect the entered gross income

**Root cause (two parts):**

1. `classifyTrialBalance(tin, raw_text)` and `uploadDocument(tin, file)` in `client.ts` called `makeMockClassify(tin, MOCK_ENTITIES[tin])`. For a custom TIN, `MOCK_ENTITIES[tin]` is `undefined`, so `makeMockClassify` fell back to `entityProfile?.gross_income ?? 1_000_000`, always returning RM 1,000,000 revenue regardless of the entered gross income.
2. The TIN field placeholder in `CustomCompany.tsx` was `C2581234509` — identical to `ACME_TIN`. A user who copied the placeholder would silently route to Acme's RM 5,000,000 seed instead of their custom entity.

**Fix:**

- Added optional `profile?: EntityTaxProfile` parameter to `classifyTrialBalance` and `uploadDocument` in `client.ts`. Mock path now uses `profile ?? MOCK_ENTITIES[tin]`, so a custom entity's own `gross_income` is the revenue figure.
- Updated `FilingStudio.tsx` callers: `classifyTrialBalance(entity.tin, rawText, entity)` and `uploadDocument(entity.tin, file, entity)` — `entity` is already resolved from `useEntity()` (includes the custom profile).
- Changed the TIN field `placeholder` in `CustomCompany.tsx` from `C2581234509` to `C0000000001` (clearly non-colliding). Updated the inline validation error hint to match.

### Fix 2 (LOW) — Persist active entity across reload / direct nav

**Root cause:** `PersonaContext` initialized the active persona from `readDefaultPersona` (reads `cp_default_persona`) on every load. An in-session selection was held only in React state — a reload or direct URL nav reset to Acme.

**Fix:**

- Added `ACTIVE_PERSONA_KEY = 'cp_active_persona'` and `readActivePersona(allPersonas, fallback)` in `PersonaContext.tsx`.
- Extracted `setPersona` as a stable `useCallback` that writes `cp_active_persona` to localStorage on every call before updating state.
- Init now uses `readActivePersona(allPersonas, readDefaultPersona(allPersonas))` — resolves against the merged list (built-in + custom personas), so a custom entity survives reload.
- Falls back to the existing `cp_default_persona` / `DEFAULT_PERSONA` if the stored TIN is missing or no longer exists.
- `addCustomPersona` dependency array updated to `[setPersona]`; `useMemo` deps updated to include `setPersona`. Biome formatting applied.

**Files touched:**

- `frontend/src/api/client.ts` — optional `profile?` param on `classifyTrialBalance` + `uploadDocument`
- `frontend/src/pages/FilingStudio.tsx` — pass `entity` to both calls
- `frontend/src/pages/CustomCompany.tsx` — placeholder changed from `C2581234509` → `C0000000001`; validation hint updated
- `frontend/src/PersonaContext.tsx` — `ACTIVE_PERSONA_KEY`, `readActivePersona`, `setPersona` as stable callback with localStorage write
- `docs/progress.md` (this entry)

**Build status:**
| Check | Result |
|---|---|
| `bunx tsc --noEmit` | 0 errors |
| `bun run build` | 73 modules, built in 1.99s |
| `bunx biome check frontend/src` | 0 errors |
| `bunx biome check frontend/src` | 0 errors (36 files) |

## [25/06/26] — TD-6 / Q5 YA2026 figure + RAG-clause re-verify (AI-assisted online audit) `[TD]`

- **Scope:** re-audited every demo-visible YA2026 figure in `core/config/ya_2026.yaml` AND all 15 RAG law-corpus clauses (`core/fixtures/lawcorpus_seed.json`) against LHDN/RMCD/MoF + the ITA 1967 (Act 53, AGC `lom.agc.gov.my`) + Big-4, via parallel research subagents.
- **Figures — all correct** (SME bands 15/17/24 + ≤RM2.5m/≤RM50m conditions, non-SME 24%, CP204 s.107C, Form C 7-mo, CGT 10%/2% from 1 Mar 2024, TP RM30m+RM10m/RM50m, WHT 10/15/10 + contractor 10+3, SST RM500k/RM1m + 8% + enforce 1 Jan 2026). Unchanged in Budget 2026.
- **ONE correction (e-invoicing):** the ≤RM5m band's **1 Jan 2026 implementation date stands**, but LHDN extended the penalty-free interim relaxation twice (PM Anwar 5 Jan 2026; Specific Guideline v4.7, 20 Apr 2026) → **penalty-free to 31 Dec 2027, full enforcement 1 Jan 2028**. Added `einvoice_smallband_penalty_free_until` + `einvoice_smallband_enforcement_from` (+ comment) to `ya_2026.yaml`. **No computation value changed; golden tests unaffected.**
- **15 RAG clauses — all correctly numbered/cited** (Act 53 = ITA 1967 confirmed; **PR-6/2019** number+title verified exact; s.140A is the correct TP section, not s.140). Four MATCH-but-imprecise descriptions (s.39 entertainment is a 50% restriction; s.77A also covers LLPs/trusts/co-ops; s.140A formal marginal note; s.33(1) heading) — **gate-safe, left as-is** (tightening would force a RAG-index rebuild).
- **Seeded Acme golden — confirmed:** `tax_payable RM31,000` = chargeable 200,000 (Revenue 500,000 − expenses 300,000); 15%×150k + 17%×50k (asserted in `tests/test_computation.py`).
- **Tests:** **107/107 pass** after the config annotation.
- **Caveat:** AI-assisted online re-verification — a human tax-professional glance is still advisable for the formal TD-6 sign-off. Plan TD-6 + Q5 ticked with that qualifier.
- **Files:** `backend/core/config/ya_2026.yaml`, `docs/superpowers/research/2026-06-19-ya2026-figures-verification.md`, `docs/plan.md`, `docs/progress.md`.

---

## [26/06/26] — Settings: "Reset all data" button `[FE]`

- Added a **"Reset all data"** button to the Settings page Reset section alongside the existing "Reset all preferences" button. Both buttons now display in labelled rows with a one-line description so their scope is distinct: preferences (theme + default entity, reload) vs. data (full first-run reset, navigate to `/`).
- On confirm (`window.confirm`), iterates `localStorage` keys and removes any starting with `cp_` or `cukaipandai-` — covers all known keys (`cp_default_persona`, `cp_active_persona`, `cp_journey_done`, `cp_entered_as_guest`, `cp_custom_entities`, `cukaipandai-theme`) and any future keys added under those prefixes. No blanket `localStorage.clear()`.
- After clearing, `window.location.href = '/'` for a full reload to the marketing landing; next Continue-as-Guest will show `/welcome` because `cp_journey_done` was cleared.
- "Reset all data" button styled with `settings-reset-btn--full` (rust fill, matching the hover state of the existing button) to signal a more destructive action.
- **Files touched:** `frontend/src/pages/Settings.tsx`, `frontend/src/pages/Settings.css`.
- **Build:** `bunx tsc --noEmit` clean; `bun run build` green (0 errors, 0 warnings); `bunx biome check frontend/src` 36 files, 0 errors.

---

## [26/06/26] — Sidebar groups, floating help, analytics, about, settings reset `[FE]`

Four related FE changes implemented:

**1. Sidebar three groups (`AppShell.tsx`)**

- Restructured `drawer-nav` into exactly three `drawer-section` groups: **Workspace** (Dashboard, Analytics), **Compliance** (Obligations, Filing, Audit Defense), **Essentials** (Settings, FAQ, About).
- FAQ moved from Workspace to Essentials. Settings added to drawer (profile popover entry unchanged). Analytics (new) and About (new) added to their respective groups.

**2. Floating "?" help button + walkthrough modal (`AppShell.tsx`)**

- A circular "?" button is fixed bottom-right (z-index 90, above content, below z-300 modal) in `--denim` with `--paper` text, visible in light and dark.
- Clicking opens a centered `<dialog>` modal (Escape + backdrop-click close) titled "Need A Walkthrough?" with body copy and two buttons: "Yes, Show Me" (removes `cp_journey_done` from `localStorage` and navigates to `/welcome`) and "No Thanks" (dismiss).
- `WalkthroughModal` is a standalone component at the top of `AppShell.tsx`; uses `useNavigate` internally.

**3. Settings "Reset all data" lands on `/welcome` (`Settings.tsx`)**

- Changed `window.location.href = '/'` to `window.location.href = '/welcome'` in `handleResetAllData`. The `window.confirm` guard and prefix-based clearing (`cp_`, `cukaipandai-`) are unchanged.

**4. New `/analytics` page (`Analytics.tsx` + route in `App.tsx`)**

- Reads the active persona from `useActivePersona()` and fetches `getObligations(persona.tin, persona.ssm)` — re-fetches on `persona.tin` change.
- Loading state (`.barber`), error state, empty state all handled.
- Content is fully grounded in real obligation data and entity profile (no fabricated figures):
  - Stat cards: total obligations, overdue count, due-within-30-days count, next due date.
  - Status Breakdown panel: horizontal bars by deadline window (overdue / within 30 days / later) + count table by form type (CP204, Form C, SST-02, etc.).
  - Entity Snapshot panel: gross income hero figure + rows for TIN, entity type, MSIC, SST, basis period, employees, paid-up capital — from `useEntity()` (resolves custom entities via `customPersonas`, no network).
  - Compliance ratio alert when overdue count > 0 (plain arithmetic over real counts).
  - Cross-links to Obligation Calendar and Filing.

**5. New `/about` page (`About.tsx` + route in `App.tsx`)**

- Three sections: "The Problem" (3 problem statements grounded in real product framing), "Objectives" (4 numbered objectives matching the product), "How It Works" (deterministic core, agentic layer, citation gate, in-country inference).
- No fabricated stats or figures. Ends with the "Decision support, not legal advice" disclaimer.
- Added to the Essentials group in the drawer.

**Files touched:** `frontend/src/layouts/AppShell.tsx`, `frontend/src/pages/Settings.tsx`, `frontend/src/pages/Analytics.tsx` (new), `frontend/src/pages/About.tsx` (new), `frontend/src/App.tsx`.

**Build:**
| Check | Result |
|---|---|
| `bunx tsc --noEmit` | 0 errors |
| `bun run build` | 75 modules, built in 2.16s |
| `bunx biome check frontend/src` | 38 files, 0 errors |

Em-dash sweep: all three em-dashes in user-facing copy in `About.tsx` were removed and rephrased (comma+participle, colon, semicolon); remaining em-dashes in the batch are code comments only.

---

## [26/06/26] — Wave 0 BE Foundation: EP-0 + EP-1 + EP-2 `[BE]`

### EP-0 — Shared guest user + `POST /auth/guest`

- **Constants** (`api/main.py`): `GUEST_USER_ID = "guest-shared"`, `GUEST_EMAIL = "guest@cukaipandai.local"`, `GUEST_NAME = "Guest"` — single source of truth.
- **`UserRepository.ensure_guest(guest_id, guest_email, guest_name)`** (`api/persistence.py`): idempotent seeder — `get_by_email` first; only creates if absent; takes `provider="guest"`. `UserRepository.create` gained an optional `id` arg so the fixed guest id survives restarts.
- **Startup seed** (`api/main.py`): `_USER_REPO.ensure_guest(...)` called immediately after `_USER_REPO = UserRepository()`.
- **`POST /auth/guest`** (`api/main.py`): returns `{token, user}` — mints JWT via `auth.create_token(GUEST_USER_ID, GUEST_EMAIL, GUEST_NAME)`; never leaks a hash; defensively re-seeds if the row is absent.
- **Design note (shared-data caveat):** the guest is a single shared backend account. All guests share one `sub`; any data written under that sub (entity profile, filing records) is shared/public across all guest sessions. This is the intended demo behaviour and will be documented in TD-W3.
- **Tests:** `tests/api/test_guest_auth.py` (7 tests — token returned, sub == GUEST_USER_ID, email matches constant, /auth/me round-trip, idempotent seed, stable id across calls, provider == "guest").

### EP-1 — `GET/PUT /me/entity` (per-user entity profile)

- **`UserEntityRepository`** (`api/persistence.py`): `get(owner)` / `put(owner, data)`. Neon path: `user_entities(user_id text PRIMARY KEY, data jsonb)` with lazy `CREATE TABLE IF NOT EXISTS`; in-memory dict fallback; any DB error falls through silently.
- **`_USER_ENTITY_REPO = UserEntityRepository()`** instantiated at startup in `api/main.py`.
- **`_owner(authorization)` dependency** (`api/main.py`): calls `_bearer_user` (existing, 401 without token), then decodes the same token to extract `claims["sub"]`; returns the sub string.
- **`GET /me/entity`**: returns saved profile or 404 if none yet.
- **`PUT /me/entity`**: validates `{ssm}` via existing `_profile()` helper (422 on bad input), upserts via `_USER_ENTITY_REPO.put()`, returns the normalised profile.
- **Migration** (`migrations/neon_schema.sql`): additive `CREATE TABLE IF NOT EXISTS user_entities (user_id text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`.
- **Tests:** `tests/api/test_me_entity_endpoint.py` (8 tests — 401 no token on GET/PUT, 404 before save, PUT→GET round-trip, 422 bad ssm, per-owner isolation, upsert overwrites).

### EP-2 — `/me/filings` CRUD (per-user filing records)

- **`FilingRecordReq` + `MultiDeleteReq`** (`api/schemas.py`): request schemas for POST body and multi-delete body.
- **`FilingRepository`** (`api/persistence.py`): `create(owner, rec)` / `list(owner)` / `get(owner, rec_id)` / `delete(owner, ids)`. New `filing_records` table (not the existing `filings` table — zero destructive alteration). In-memory `dict[str, list[dict]]` fallback; Neon path with lazy `CREATE TABLE IF NOT EXISTS`; any DB error falls through. `create()` always writes in-memory first.
- **`_FILING_REPO = FilingRepository()`** at startup.
- **Endpoints** (all `Depends(_owner)` → 401 without valid token):
  - `POST /me/filings` → 200 + stored record with server-assigned `id`; 422 on bad body.
  - `GET /me/filings` → list (newest first, per-owner).
  - `GET /me/filings/{rec_id}` → full record or 404 if not owned/absent.
  - `DELETE /me/filings/{rec_id}` → deletes or 404.
  - `DELETE /me/filings` with `{ids:[...]}` body → multi-delete; foreign ids are silently skipped (no-op, never touch another owner's rows).
- **Migration** (`migrations/neon_schema.sql`): additive `CREATE TABLE IF NOT EXISTS filing_records (id text PRIMARY KEY, user_id text NOT NULL, tin text, label text, computation jsonb, risk_flags jsonb, line_items jsonb, created_at timestamptz NOT NULL DEFAULT now())`.
- **Tests:** `tests/api/test_me_filings_endpoint.py` (14 tests — 401 on all endpoints, create returns id, 422 bad body, list, get by id, 404 foreign id, delete, 404 re-get after delete, 404 delete foreign, multi-delete, multi-delete foreign is noop, list isolation, get-by-id isolation).

### Test result

`uv run pytest -q` → **158 passed** (was 129 before Wave 0; +29 new tests; 0 regressions).

### Files touched

- `backend/api/main.py` — constants, repos, `_owner` dep, 7 new endpoints
- `backend/api/persistence.py` — `UserRepository.ensure_guest` + `id` arg; `UserEntityRepository`; `FilingRepository`
- `backend/api/schemas.py` — `FilingRecordReq`, `MultiDeleteReq`
- `backend/migrations/neon_schema.sql` — additive `user_entities` + `filing_records` tables
- `backend/tests/api/test_guest_auth.py` (new, 7 tests)
- `backend/tests/api/test_me_entity_endpoint.py` (new, 8 tests)
- `backend/tests/api/test_me_filings_endpoint.py` (new, 14 tests)
- `docs/plan.md` — EP-0/EP-1/EP-2 ticked `[x]`

---

## [26/06/26] — Wave 1: Quick UI Refinements + Tooltip + GR-1...GR-9 `[FE]`

**Tasks:** UI-1, OB-1, GR-1, GR-2, GR-3, GR-4, GR-5, GR-6, GR-7, GR-8, GR-9

### UI-1 — Reusable Tooltip + InfoTip

- Created `frontend/src/components/Tooltip.tsx` with `Tooltip` (hover + focus-capture, ESC dismiss, fixed-positioned with edge-clamping, `aria-describedby`, `role="tooltip"`) and `InfoTip` (focusable `<button>` trigger, `aria-label`). Token-CSS only, z-index 200 (below z-300 walkthrough modal). No native `title=`, no new dependency.

### OB-1 — Obligation Calendar (/obligations) refinements

- Added entity-aware one-line page description under `<h1>`.
- Replaced all calendar badge `title=` attributes with `<Tooltip>` (form + due date + obligation type shown in bubble).
- Added `<InfoTip>` to both card titlebars: YA2026 Obligation Calendar (heading tooltip carries the live obligation summary: N total, M overdue, next due date + demo-clock note) and Filing Obligations (heading tooltip carries the full form-codes glossary).
- Removed the inline `<details>` form-codes block; content moved into the Filing Obligations InfoTip.
- Removed the `ObligationSummary` component from the page body; counts now live in the Calendar heading InfoTip.
- Removed the Entity Snapshot left-column card (moving to `/entity` in Wave 2).
- Removed `<WhatNext>` usage and import.

### GR-1 — Dashboard: hide Journey strip when walkthrough done

- `Dashboard.tsx`: `<JourneyStrip>` now gated on `!journeyDone`; absent when `cp_journey_done=1`.

### GR-2 — Remove topbar entity selector

- `AppShell.tsx`: removed the `<select>` topbar entity switcher. Entity selection is now exclusively in Settings / Workspace. Persona-switch side-effects (deadline re-seed + toast) remain intact since they trigger on `persona.tin` change from any source.

### GR-3 — Remove drawer X close button

- `AppShell.tsx`: removed `<button className="drawer-close">`. Backdrop-click and Escape remain the close affordances.

### GR-4 — Walkthrough ? button: pin true bottom-right, scope to Workspace + Compliance

- `AppShell.tsx`: ? button repositioned to `bottom: 20, right: 20` (was `bottom: 176`). Visibility gated via `useLocation()` + `isWalkthroughRoute()` helper: visible on `/dashboard`, `/analytics`, `/obligations`, `/filing/**`, `/audit-defense`, `/entity`; hidden on Essentials, marketing, auth, wizard.

### GR-5 — Dashboard: remove StatusSummary + SnapshotPanel; single-column overview

- `Dashboard.tsx`: removed `StatusSummary` component (demo-clock text), `SnapshotPanel` component, `fmtRM` helper, and `useEntity` import (all orphaned by removal). `dash-overview-grid` now holds only `DeadlinesPanel`; `QuickAccess` fills the freed primary-grid space.

### GR-6 — Settings: remove About section; match reset-button colours

- `Settings.tsx`: removed the About `<section>`. Applied `settings-reset-btn--full` to the "Reset all preferences" button to match "Reset all data".

### GR-7 — Remove WhatNext from Filing + Audit Defense

- `FilingStudio.tsx`: removed `<WhatNext>` usage and `WhatNext` import.
- `AuditDefense.tsx`: removed `<WhatNext>` usage and `WhatNext` import.

### GR-8 — Light theme as default

- `useTheme.ts`: default changed from `systemTheme()` to `'light'` when no stored preference. Removed `systemTheme()` helper, `hasStoredTheme` state, and the system-preference media-query listener (all orphaned). Toggle + localStorage persistence unchanged.

### GR-9 — Wizard sequence + non-destructive Reset All Data

- `WizardLayout.tsx`: added `// TODO(Wave 3): repoint to /start/filing/new` comment on step 2; step still points to `/start/filing` (shippable; Wave 3 FM-2 repoints it).
- `Settings.tsx`: `handleResetAllData` now clears ONLY `cukaipandai-theme` + `cp_journey_done` (the two local UI-pref keys). Removed the `DATA_PREFIXES` broad-sweep that was clearing business data keys. Button copy updated to clarify saved company/filings are not affected.
- Welcome "Try sample data" and walkthrough modal "Yes, Show Me" already navigated to `/welcome` first (no change needed). `WizardLayout` `graduate()` already goes to `/dashboard` only at Finish/Skip.

### Hard gates

- `bunx tsc --noEmit`: clean
- `bun run build`: **77 modules**, built in 2.08s
- `bunx biome check frontend/src`: 0 errors (40 files checked)
- Em-dash sweep: no em-dashes in user-facing copy (comments only)

### Files touched

- `frontend/src/components/Tooltip.tsx` (new)
- `frontend/src/hooks/useTheme.ts`
- `frontend/src/layouts/AppShell.tsx`
- `frontend/src/layouts/WizardLayout.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/ObligationRadar.tsx`
- `frontend/src/pages/FilingStudio.tsx`
- `frontend/src/pages/AuditDefense.tsx`
- `frontend/src/pages/Settings.tsx`
- `docs/plan.md` — UI-1/OB-1/GR-1...GR-9 ticked `[x]`
