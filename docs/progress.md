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

---

## [26/06/26] — Wave 2: AUTH-FE + EN-1 + EN-2 (guest token, /entity page, backend-backed Custom persona) `[FE]`

### AUTH-FE — `continueAsGuest` now calls `POST /auth/guest`

- Added `authGuest(): Promise<AuthResponse>` to `frontend/src/api/client.ts`. Mock branch returns `{token:'mock-guest', user:{id:'guest-shared', ...provider:'guest'}}`. Live branch calls `POST /auth/guest`.
- `AuthContext.continueAsGuest()` made async: calls `authGuest()`, stores the returned token via `setToken()`, persists user to `USER_KEY` localStorage, sets `GUEST_KEY='1'`, updates `isGuest=true` and `user` state. Every subsequent `authHeaders()` call attaches `Authorization: Bearer <guest-token>`.
- `AuthScreen.tsx` `onGuest()` made async; wraps `await continueAsGuest()` in a try/catch (best-effort) with `busy` state while the call is in-flight. Navigation after guest auth unchanged.
- Hydration on reload: the existing `authMe()` path now validates the guest token correctly (guest is a real user in the backend). Mock mode reads `readStoredUser()` as before.
- Sign-out clears `USER_KEY` + `GUEST_KEY` + `cp_token` — guest session fully dropped.

### EN-1 — `/entity` page (Compliance nav)

- Created `frontend/src/pages/Entity.tsx`: view + edit the active company's full `EntityTaxProfile`.
  - One-line page description under `<h1>`.
  - Snapshot card showing all 9 fields (TIN, entity type, MSIC codes, gross income, paid-up capital, employees, SST, basis period, commencement date) with an `InfoTip` on the card heading.
  - Sectioned edit form (Company Identity / Financial Profile / Basis Period) reusing the validation helpers and field layout from `CustomCompany.tsx`. Each section card has an `InfoTip`. Pre-fills from the active entity.
  - Seed-entity notice shown when the active persona is one of the three built-in seeds.
  - On save: `await putMyEntity(ssm)` (awaitable, surfaces 422 detail), then `activateCustomPersona(ssm)` to update context without a second PUT.
  - Save status feedback (saving / saved / error inline).
- Added `/entity` route in `frontend/src/App.tsx` (under `<AppShell/>`).
- Added "Entity" NavLink to the **Compliance** drawer group in `frontend/src/layouts/AppShell.tsx` (after Audit Defense).
- `WALKTHROUGH_ROUTES` in `AppShell.tsx` already included `/entity` (Wave 1 GR-4) — no change needed.

### EN-2 — Persona model backed by `GET/PUT /me/entity`; localStorage data store removed

- Added `getMyEntity(): Promise<EntityTaxProfile>` and `putMyEntity(ssm): Promise<EntityTaxProfile>` to `client.ts`. Mock branch: module-scoped `_mockMyEntity` (null until a PUT). Live: `GET/PUT /me/entity` with `authHeaders()`.
- Refactored `PersonaContext.tsx`:
  - Removed `cp_custom_entities` localStorage read/write and `cp_active_persona` data store entirely.
  - On mount: best-effort `getMyEntity()` — if 200, builds a "Custom" persona (`tin='CUSTOM'`) from the profile and adds it to `allPersonas`; 404/error treated as "no custom entity yet".
  - Added `activateCustomPersona(ssm)` action: updates context state without triggering a PUT (used by `/entity` page which does its own awaited PUT).
  - `addCustomPersona(p)` still exists for `CustomCompany.tsx` (which needs the fire-and-forget path): updates context + fires `putMyEntity` best-effort.
  - `entityReady: boolean` exposed so consumers can avoid white-screen while the initial fetch settles.
  - Only `theme` + `cp_journey_done` remain in localStorage (UI prefs only).
- Updated `useEntity.ts`: resolves "Custom" TIN from `customPersonas` (backend-sourced) without any network call — no white-screen for custom entities.
- Updated `CustomCompany.tsx`: removed `createEntity` + `serverError` + the old localStorage + server-warn path. `handleSubmit` now just calls `addCustomPersona(persona)` (which does `putMyEntity` best-effort) and navigates. Updated footer/description copy (no "stored locally").
- Updated `getObligations` in `client.ts`: for `tin='CUSTOM'` (the context key), resolves mock lookup and live URL path via `ssm.tin` so the backend always receives the real TIN.

### Hard gates

- `bunx tsc --noEmit`: clean
- `bun run build`: **78 modules** (was 77; +1 new Entity page), 339 KB JS, 49 KB CSS, built in 1.94s
- `bunx biome check frontend/src`: 0 errors (41 files checked)
- No em-dashes in user-facing copy; Title Case headings; acronyms preserved (TIN, MSIC, SST, YA2026).

### Files touched

- `frontend/src/api/client.ts` (+`authGuest`, +`getMyEntity`, +`putMyEntity`, CUSTOM-TIN fix in `getObligations`)
- `frontend/src/AuthContext.tsx` (async `continueAsGuest`, import `authGuest`)
- `frontend/src/pages/AuthScreen.tsx` (async `onGuest`)
- `frontend/src/PersonaContext.tsx` (backend-backed Custom persona, `activateCustomPersona`, `entityReady`)
- `frontend/src/hooks/useEntity.ts` (CUSTOM TIN resolves from context)
- `frontend/src/pages/CustomCompany.tsx` (use `addCustomPersona` only; removed `createEntity` + `serverError`)
- `frontend/src/pages/Entity.tsx` (new)
- `frontend/src/App.tsx` (+Entity import +`/entity` route)
- `frontend/src/layouts/AppShell.tsx` (+Entity NavLink in Compliance group)
- `docs/plan.md` (AUTH-FE/EN-1/EN-2 all sub-bullets ticked `[x]`)

---

## [26/06/26] — Wave 3: FM-1 + FM-2 + FM-3 + Wizard Repoint (Filing Records Dashboard + Creation + Saved Record) `[FE]`

### FM-1 — `/filing` records dashboard

- Rewrote `frontend/src/pages/FilingStudio.tsx` as a records-list dashboard (keeping the same export name so all existing imports/routes are unchanged).
- Fetches `listFilings()` on mount, shows records newest-first with label / RM tax_payable headline / created date / risk-flag count.
- Checkbox per row (+ "Select All") + "Delete Selected" button calls `deleteFilings(ids)` and updates local state.
- Row label/meta/tax-payable cells are a `<Link display:contents>` to `/filing/[id]`; no non-interactive tabIndex.
- Empty state ("No filings yet. Create your first...") with CTA to `/filing/new`; barber loading strip.
- One-line `page-kicker` description + `InfoTip` on heading and on record count.

### FM-2 — `/filing/new` creation (new file: `FilingNew.tsx`)

- One-shot pipeline: Classify Line Items -> Compute Form C -> Risk Assessment -> Finalized (no Human Approval stage).
- Guided input panel: labelled instruction ("Provide your trial balance -- one account per line"), one-line format example, persona's `demoRawText` pre-filled in textarea (paste = primary), CSV/XLSX/PDF file-drop clearly secondary.
- "How this was calculated" provenance note shown immediately after computation: explicit statement that the tax figure is computed by the deterministic rule-based core, not the AI.
- On Save Filing: calls `saveFiling({ tin: entity.tin, label, computation, risk_flags, line_items })` then navigates to `/filing/[id]`. Uses `entity.tin` (real TIN, e.g. `C0000000001` for Custom) per Wave 2 note, not `persona.tin` which can be `'CUSTOM'`.
- Reuses `FilingPipeline.tsx` primitives: `ComputationPanel`, `Stage1Detail`, `StageRow`, `RiskFlagList`, `TechnicalDetailsDisclosure`.
- `SovereignBadge` on the classified items card; barber on isLoading; `InfoTip` on pipeline heading.

### FM-3 — `/filing/[id]` saved record view (new file: `FilingRecord.tsx`)

- Loads `getFiling(id)` (404 -> friendly not-found card with links to `/filing` and `/filing/new`).
- Layout: `ComputationPanel` (96px RM hero) on top, provenance note, risk flags card, then Filing Pipeline card (all stages COMPLETE through Finalized) with `TechnicalDetailsDisclosure` (collapsed `<details>`) at the bottom.
- Provenance note states plainly: "computed by the deterministic, rule-based core -- not the AI."
- Per-figure trace (`rule_id` / `config_version` / `inputs` / `value`) reachable by expanding "Show technical details".
- Breadcrumb link back to `/filing`; "All Filings" + "New Filing" buttons at page bottom.
- No WhatNext card.

### Shared primitives — `FilingPipeline.tsx` (new file)

- Extracted from old `FilingStudio.tsx`: `ComputationPanel`, `FigureTraceRow`, `Stage1Detail`, `StageRow`, `RiskFlagList`, `TechnicalDetailsDisclosure`, `severityColor`, `statusColor`, stage types.
- `TechnicalDetailsDisclosure` takes `computation` + optional `classifyRouteInfo`; the `<details>` trigger is styled inside the card border (no standalone float).

### client.ts additions

- `FilingRecord` interface (mirrors `FilingRecord` backend schema).
- `listFilings()`, `saveFiling(body)`, `getFiling(id)`, `deleteFiling(id)`, `deleteFilings(ids)` -- all with mock branches backed by a module-scoped `_mockFilings[]` store + auto-incrementing `_mockFilingSeq` so mock demos work without a backend.

### Wizard Repoint (GR-9 Wave 3 TODO resolved)

- `WizardLayout.tsx`: `WIZARD_STEPS[1].route` changed from `/start/filing` to `/start/filing/new`; label updated to "Form C Filing"; TODO comment removed.
- `App.tsx`: old `<Route path="filing" element={<FilingStudio />} />` under `/start` replaced with `<Route path="filing/new" element={<FilingNew />} />`; standalone `/filing/new` and `/filing/:id` routes added under AppShell.
- The full wizard tour now runs: welcome -> /start/obligations -> /start/filing/new -> /start/audit-defense -> /dashboard.

### Hard gates

- `bunx tsc --noEmit`: clean
- `bun run build`: **81 modules** (was 78; +3 new pages), 351 KB JS, 49 KB CSS, built in 2.20s
- `bunx biome check frontend/src`: 0 errors (44 files checked)
- No em-dashes in user-facing copy; `--` used throughout; Title Case headings; acronyms (TIN, MSIC, SST, YA2026) preserved.

### Files touched

- `frontend/src/api/client.ts` (+`FilingRecord` interface + `listFilings`, `saveFiling`, `getFiling`, `deleteFiling`, `deleteFilings` with mock store)
- `frontend/src/components/FilingPipeline.tsx` (new -- shared pipeline primitives)
- `frontend/src/pages/FilingStudio.tsx` (rewritten as FM-1 records dashboard)
- `frontend/src/pages/FilingNew.tsx` (new -- FM-2 creation flow)
- `frontend/src/pages/FilingRecord.tsx` (new -- FM-3 saved record view)
- `frontend/src/App.tsx` (new routes: `/filing/new`, `/filing/:id`, `/start/filing/new`)
- `frontend/src/layouts/WizardLayout.tsx` (step 2 repointed to `/start/filing/new`)
- `docs/plan.md` (FM-1/FM-2/FM-3 all sub-bullets ticked `[x]`)

---

## [26/06/26] — Wave 4: AD-1 + AD-2 (Conversational Audit Assistant) `[FE]`

### AD-1 — Saved-filing picker on `/audit-defense`

- Rewrote `frontend/src/pages/AuditDefense.tsx` as a two-phase conversational Audit Assistant.
- Phase 1 (picker): fetches `listFilings()` on mount; shows a "Your Filed Returns" list with each record's label, TIN, created date, and tax payable, each with a "Defend This Filing" button.
- Empty state: friendly explanation that a filing must be created first + a "Create a Filing" link to `/filing/new`.
- Loading state: barber strip while `listFilings()` is in flight.
- One-line page description under `<h1>` with an `InfoTip` (UI-1) on the heading explaining the citation-grounded justification promise and fabrication-rejection guarantee.
- The "Why This Is Trustworthy" trust headline preserved (always visible on the page), pointing to the Trust Demo chip.
- No `WhatNext` card (already removed in GR-7; not re-added).

### AD-2 — Chat interface + seeded questions + fabrication trust signal

- Phase 2 (chat): activated when a filing is selected; shows a "Defending Filing" header with label, TIN, date, and a "Switch Filing" button.
- "Suggested Questions" card with tappable chips seeded from `rec.computation.fields` via `seedQuestions(rec)`: generates figure-specific questions (e.g. "Why is the tax payable RM 31,000?", "How is the chargeable income of RM 200,000 derived?") for up to 5 chips drawn from the filing's actual computed figures.
- "Trust Demo: inject fabricated clause" chip (red border) sends `inject_fabricated=true` via the existing `getAuditDefense` path (BE-18 preserved).
- Free-text input ("Ask a Question") with Enter-to-send and a "Send" button; disabled during in-flight requests.
- Each message send: `getAuditDefense(rec.tin, query, filingEvidence(rec), isFabrication)` where `filingEvidence` derives `[[key, 'RM N'], ...]` from all `computation.fields` entries. Multi-turn thread appends both user bubble and assistant turn per message; 502/network errors surface as an inline red error bubble without breaking the thread.
- Each assistant turn renders: a "Trust Payoff: Fabricated Clause Blocked" elevated panel (rust, BLOCKED stamp) when the Trust Demo ran and there are rejected citations; a "Defense Narrative" card with `SovereignBadge`; a "Citations" card with `CitationPanel` + `VerifiedBadge` per citation.
- `notify()` fires on rejected fabricated citations (existing notification path preserved).
- Auto-scroll to bottom of thread on each new message.
- Switching the selected filing (clicking "Switch Filing") clears the thread, resets the input, and re-seeds chips from the new record's figures.
- Persona/entity change also resets the picker (re-fetches filings) and clears chat.

### Hard gates

- `bunx tsc --noEmit`: clean
- `bun run build`: **81 modules** (same count as Wave 3; no new modules added), 349 KB JS, 49 KB CSS, built in 1.77s
- `bunx biome check frontend/src`: 0 errors (44 files checked)
- No em-dashes in user-facing copy; Title Case headings; acronyms (TIN, MSIC, SST, RM, YA2026) preserved.
- No backend change -- `/audit-defense` endpoint unchanged; `inject_fabricated` (BE-18) preserved as the trust-demo path.

### Mock-mode reasoning

- `listFilings()` mock reads from the module-scoped `_mockFilings[]` store (populated by `saveFiling()` in `FilingNew.tsx`). Empty by default until a filing is saved via the wizard or `/filing/new`.
- Empty state links to `/filing/new`; saving a filing there populates the mock store and the picker shows immediately on return to `/audit-defense`.
- Trust Demo chip uses `TRUST_DEMO_EVIDENCE` (fixed fabricated clause); not derived from the filing figures, so it works in mock mode even without a specific figure in the record.

### Files touched

- `frontend/src/pages/AuditDefense.tsx` (full rewrite -- AD-1 + AD-2)
- `docs/plan.md` (AD-1/AD-2 all sub-bullets ticked `[x]`)
- `docs/progress.md` (this entry)

---

## [26/06/26] — Analytics page redesign (data-dense analytical dashboard) `[FE]`

### What changed

- **Removed `EntitySnapshot`** component and the `useEntity` import entirely from `Analytics.tsx` -- the Entity Snapshot now lives on `/entity`. No orphaned imports remain.
- **Subtitle replaced** from the entity-specific "Acme Trading · YA2026 Compliance Overview" to a general single-line description: "Your YA2026 compliance at a glance: obligation load, overdue exposure, and what is due next."
- **KPI cards row:** added a lead "Compliance Rate" card (`round((total - overdue) / total * 100)%`, sub-label shows "N of M on track"); kept Total Obligations, Overdue, Due Within 30 Days, Next Due Date. Every KPI card heading carries an `InfoTip`.
- **Overdue Exposure panel (new):** full-width panel listing overdue obligations sorted most-overdue first. Each row shows form badge (rust-coloured border), obligation type, days-overdue value label, and a horizontal bar scaled to the max overdue in the set. Empty state: "All obligations are on track." Heading carries an `InfoTip`. Grounded in `daysUntil(due_date)` arithmetic only.
- **Status Breakdown** panel kept and cleaned up; `InfoTip` added to heading.
- **By Form Type** extracted into its own panel (was a sub-section inside StatusBreakdown); now sits alongside Status Breakdown in a balanced two-column grid. Bars scaled to most-common form count; `InfoTip` on heading.
- **Row hover highlighting:** `onMouseEnter`/`onMouseLeave` inline style swap (`rgba(65, 82, 110, 0.07)`) with `transition: background-color 160ms ease` on all list rows (no motion on bars -- they already existed). CSS bar transitions already gated by `prefers-reduced-motion` via the global `.reduce-motion` class in `tokens.css`.
- **Footer quick-links** kept ("Open Obligation Calendar", "Start Form C Filing"); `→` replaced with `&rarr;` to avoid literal arrow character.
- **InfoTip placement:** every card/panel heading has one `InfoTip`; the `<h1>` "Analytics" has none (per PO requirement).
- **Non-regressions:** `getObligations` + active-persona wiring + loading barber + empty state all preserved. Light + dark legible (token vars only). No new CSS file, no Tailwind, no charting library.

### Hard gates

- `bunx tsc --noEmit`: clean
- `bun run build`: **81 modules**, 351 KB JS, 49 KB CSS, built in 2.18s
- `bunx biome check frontend/src`: 0 errors (44 files checked)

### Files touched

- `frontend/src/pages/Analytics.tsx` (full rewrite)
- `docs/progress.md` (this entry)

---

## [26/06/26] — Settings symmetry, persona "(Demo)" labels, My Company persona, empty-entity guard `[FE]`

### What changed

**1. Settings layout symmetry**

- `Settings.tsx`: added `settings-card--wide` to the Workspace `<section>` so all three cards (Appearance, Workspace, Reset) span both columns and are visually symmetrical.

**2. Seed persona "(Demo)" suffix**

- `personas.ts`: renamed the three seed labels: "Acme Trading" to "Acme Trading (Demo)", "Sinar Digital" to "Sinar Digital (Demo)", "Selera Kita" to "Selera Kita (Demo)". Propagates to the selector and every heading that reads `persona.label`.

**3. Always-present "My Company" persona**

- `personas.ts`: added `EMPTY_CUSTOM_SSM` (blank tin, empty arrays, 0 numerics, false SST, empty dates) and exported `isEntityIncomplete(ssm)` (true when `ssm.tin` does not match `^[A-Z][0-9]{10}$`).
- `PersonaContext.tsx`: `MY_COMPANY_PLACEHOLDER` constant holds the empty-SSM persona. `allPersonas` is always `[...PERSONAS, customPersona ?? MY_COMPANY_PLACEHOLDER]` -- "My Company" is always the fourth option. `buildCustomPersona` label changed from `My Company (${tin})` to `My Company`. `addCustomPersona` label updated to match. `readDefaultPersona` initializer now searches `[...PERSONAS, MY_COMPANY_PLACEHOLDER]` so a stored `CUSTOM` default resolves correctly on first render.
- `hooks/useEntity.ts`: replaced `customPersonas.find(...)` logic with an `isMalaysianTin` guard -- any non-Malaysian-format TIN (e.g. `'CUSTOM'`) resolves directly from the `personas` list in context, covering both a hydrated backend profile and the empty placeholder. No network call is made for non-TIN tokens.

**4. Graceful empty My Company handling**

- `Dashboard.tsx`: `isEntityIncomplete(persona.ssm)` computed before the effect; effect returns early when entity is empty (no `getObligations` call); early JSX return renders a `.window` card with "Set up your company to see this. Add your details in the Entity page." and a link to `/entity`.
- `ObligationRadar.tsx`: same guard pattern -- effect skips `getObligations`; early return renders the same prompt. Added `Link` import from `react-router-dom`.
- `Analytics.tsx`: same guard -- effect skips `getObligations`; early return before computed KPI variables.
- `FilingNew.tsx`: early return after `entityEmpty` check -- no classify/upload/compute calls. Added `Link` import from `react-router-dom`.
- `AuditDefense.tsx`: not guarded (filing-driven, uses `listFilings` not entity TIN directly); confirmed it does not crash with an empty entity -- `useEntity` returns the empty-SSM object, not an error.

### Hard gates

- `bunx tsc --noEmit`: clean
- `bun run build`: **81 modules**, 353 KB JS, 49 KB CSS, built green
- `bunx biome check frontend/src`: 0 errors (44 files checked)

### Files touched

- `frontend/src/pages/Settings.tsx`
- `frontend/src/personas.ts`
- `frontend/src/PersonaContext.tsx`
- `frontend/src/hooks/useEntity.ts`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/ObligationRadar.tsx`
- `frontend/src/pages/Analytics.tsx`
- `frontend/src/pages/FilingNew.tsx`
- `docs/progress.md` (this entry)

---

## [27/06/26] — BE-2.1: filing draft/pending persistence + PATCH upgrade endpoint `[BE]`

**Branch:** `feat/filing-draft-persistence` (PR-A; not yet merged).

### What changed

- `backend/migrations/neon_schema.sql`: added `status text NOT NULL DEFAULT 'final'` and `raw_text text` to the `CREATE TABLE IF NOT EXISTS filing_records` inline DDL, plus two additive `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements for existing tables. Existing rows backfill `status='final'`; `raw_text` stays `NULL`. No column dropped or retyped.
- `backend/api/schemas.py`: made `FilingRecordReq.computation` optional (`dict | None = None`); added `status: str = "final"` and `raw_text: str | None = None` to `FilingRecordReq`; added new `FilingRecordPatch` model (all fields optional: `computation`, `risk_flags`, `line_items`, `status`, `label`, `raw_text`).
- `backend/api/persistence.py` (`FilingRepository`): `_ensure_table` now includes `status`/`raw_text` columns + runs the additive `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` migrations on connect. `create()` threads `status` (defaulting to `"final"`) and `raw_text` into both in-memory and Neon INSERT. `list()`/`get()` SELECTs include `status`/`raw_text` with `COALESCE(status, 'final')` for legacy Neon rows. Added `_coalesce()` helper to backfill legacy in-memory records without `status`/`raw_text` keys. Added `update(owner, rec_id, patch)` method: in-memory update first, then best-effort Neon `UPDATE ... RETURNING`; returns `None` if not owned/absent.
- `backend/api/main.py`: imported `FilingRecordPatch`; added `PATCH /me/filings/{rec_id}` endpoint (owner via `_owner` dependency; partial body; 404 on missing/foreign; 422 on bad body).
- `backend/tests/api/test_me_filings_endpoint.py`: updated `_BAD_BODY` to use `computation: "not-a-dict"` (old body was `{"tin": "X"}` which tested `computation` required -- now optional by design).
- `backend/tests/api/test_filing_drafts.py`: NEW file, 12 tests covering: create-draft returns status/id; draft in list; PATCH draft-to-final same id; list length unchanged after upgrade; PATCH foreign owner 404; PATCH missing id 404; PATCH no token 401; PATCH bad computation type 422; legacy record without status reads final; legacy final POST defaults status; per-owner isolation; multi-delete on draft.

### Deviations from plan

- Gate-1 Resolution OQ-3b/OQ-4 (FULL RESUME): `raw_text` additive column added (per the Gate-1 lock); `FilingRecordReq`/`FilingRecordPatch` carry it through.
- No `id` field on `FilingRecordReq` -- the plan notes either path param or an id field is acceptable; path param (`PATCH /me/filings/{rec_id}`) was used as planned.
- `test_create_bad_body_422` in the existing test file updated (not a regression -- the old sentinel body became valid after `computation` was made optional; the test now uses an actually-invalid body).

### Test status

- **Before:** 181 passed
- **After:** 193 passed (+12 new), 0 failed
- Hard gate: `cd backend && uv run pytest -q` → **193 passed, 1 warning**

---

## [27/06/26] — PR-B: FE-2.1/2.2/2.3/2.4/2.5/2.7 WALKTHROUGH-2 UI refinements `[FE]`

**Branch:** `feat/walkthrough2-fe`.

### What changed

**FE-2.1 — Tooltip viewport-overflow fix (global)**

- `frontend/src/components/Tooltip.tsx`: `reposition()` now applies a viewport-relative `maxWidth` (`Math.min(280, vw - 2*MARGIN)`) directly to the bubble's `style.maxWidth` before measuring; added bottom-edge vertical clamp (`top = vh - bubbleRect.height - MARGIN` when bubble would clip the bottom); added `scroll` + `resize` listeners while open (cleaned up on close). Removed hardcoded `maxWidth: 280` from the bubble's inline style object.

**FE-2.2 -- Row-divider full-bleed CSS (global)**

- `frontend/src/styles/tokens.css`: added `.drawer-hotzone` rule (desktop-only `pointer:fine` + `min-width:768px`); added `.row-list` + `.row-div-list` divider helpers (`* + *` top-border, `:last-child` no bottom border); changed `.requirement-row + .requirement-row` to use `border-top` (removes the doubled bottom-border on the last row).
- Applied to: `FilingStudio.tsx` (row-div-list on records), `AuditDefense.tsx` (row-div-list on picker rows), `Analytics.tsx` (row-list on ul rows), `FilingPipeline.tsx` (row-div-list on stage rows), `FilingRecord.tsx` (row-div-list on stages).

**FE-2.3 -- Analytics simplification (OQ-1 option b)**

- `frontend/src/pages/Analytics.tsx`: replaced `StatusBreakdown` + `ByFormType` bar-chart components with a single `StatusAndFormCounts` component that renders a 2-column grid of compact `<ul className="row-list">` count rows. `OverdueExposure` remains as the single primary visual with its bar chart. All data signals retained; no bars removed from the primary visual.

**FE-2.4 -- /filing/new auto-save + reorder + provenance InfoTip**

- `frontend/src/api/client.ts`: added `raw_text?: string | null` and `status: 'draft' | 'final'` to `FilingRecord`; added `createDraftFiling()` (POST `/me/filings`, status draft) and `upgradeFiling(id, patch)` (PATCH `/me/filings/{id}`); mock implementations mutate the module-scoped `_mockFilings` store by id.
- `frontend/src/pages/FilingNew.tsx`: added `draftId` state; resume effect reads `?resume=<id>` param and restores `rawText` + `draftId` from a draft record; `handleClassify` calls `createDraftFiling` best-effort after classify succeeds; `handleCompute` calls `upgradeFiling` (or `saveFiling` fallback) then navigates to `/filing/${targetId}`; removed `handleSave`/`handleReset` and the `'saving'` phase; removed the standalone provenance prose `.window`; result view reordered to ComputationPanel → RiskFlagList → Pipeline card → TechnicalDetailsDisclosure.
- `frontend/src/components/FilingPipeline.tsx`: `ComputationPanel` gained optional `headingTip?: ReactNode` prop rendered as `<InfoTip>` in the `.titlebar`.
- `frontend/src/pages/FilingRecord.tsx`: added `Navigate` import; drafts redirect to `/filing/new?resume=${record.id}`; `ComputationPanel` guarded with `{record.computation && ...}`; stages wrapped in `row-div-list`.

**FE-2.5 -- /filing filters**

- `frontend/src/pages/FilingStudio.tsx`: added `SortKey` type + `filterForm`/`filterStatus`/`sortKey` state; derived `formTypes`/`visible`/`sorted` arrays; filter row with three token-CSS `<select>` controls (form type, status, sort); `toggleAll`/`allSelected` operate on `sorted` (visible); draft rows show "Pending" pill (mustard); titlebar shows `{sorted.length} of {records.length} Filings`; records rendered from `sorted`.

**FE-2.7 -- Sidebar reorder + hotzone + wordmark**

- `frontend/src/layouts/AppShell.tsx`: Compliance nav reordered Entity → Obligations → Filing → Audit Defense; `/audit-assistant` added to `WALKTHROUGH_ROUTES`; both brand lockups point to `to="/"`; `drawerPinned` state added (hamburger sets it true; `closeDrawer` clears it); `<div className="drawer-hotzone">` added (invisible, 8px, left edge) with `onMouseEnter` to open the drawer on desktop.

### Deviations from plan

- FE-2.6 (Audit Assistant rename + two-pane workbench) is **out of scope for this PR** (separate PR-C as noted in the plan). The nav label and `WALKTHROUGH_ROUTES` for `/audit-assistant` were added in FE-2.7 in preparation, but the file rename and route change are deferred.
- `AuditDefense.tsx` picker rows: row-div-list applied to the existing file (not the renamed `AuditAssistant.tsx` -- that rename is in FE-2.6/PR-C).
- The `drawerPinned` state was added to prevent the hotzone from collapsing a manually-opened drawer, but `closeDrawer` is still triggered on backdrop click as before. The hotzone only triggers open on `mouseEnter`, not close on `mouseLeave` (per OQ-7 lock: "close on click-outside / backdrop close").

### Build + lint status

- `bunx tsc --noEmit` -- clean (0 errors)
- `bun run build` -- green (83 modules, 0 errors, 0 warnings)
- `bunx biome check frontend/src` -- **0 errors, 0 warnings**

---

## [27/06/26] -- BE-2.2 + BE-2.3 (PR-C backend: Pandai persona + conversation memory) `[BE]`

**BE-2.2 -- Pandai 5-layer persona system prompt + conversational answer**

- `backend/api/agents/pandai_primer.md` (NEW): citation-safe explanatory primer shipped from scratchpad; `## Research sources` section stripped; no asserted figures, no clause IDs, no percentage rates, no RM amounts.
- `backend/api/agents/pandai_persona.py` (NEW): `build_pandai_system(filing_digest, *, history, locale)` assembles the 5-layer system prompt in order -- (1) Language (English stub), (2) Persona ("Pandai", warm/precise Malaysian-SME companion), (3) Hard Rules (scope, no promises, no PII, no legal advice, cite filing numbers, no greeting, no memory figures), (4) Primer (lru_cache'd load of `pandai_primer.md`), (5) Live Digest (filing figures/line-items/computation injected per request).
- `backend/api/agents/audit_defense.py`: replaced bare one-line `system` with `build_pandai_system(filing_digest, history=bounded_history)`; extended JSON schema/prompt to request `answer` (Pandai's conversational reply) and `followups` (exactly 3 suggestions, padded with `""` if model returns fewer); new params `filing_digest: dict | None` and `history: list[dict] | None`; bounded history at `_MAX_HISTORY_TURNS=8`; citation gate (`verify_claim` + `thread_provenance` + `inject_fabricated` probe) preserved exactly as-is.
- `backend/core/models.py`: `DefensePack` gains `answer: str = ""` and `followups: list[str] = []` (optional with defaults; existing callers/tests unaffected).
- `backend/api/schemas.py`: `AuditDefenseReq` gains `filing_id: str | None = None` for conversation-linked queries.

**BE-2.3 -- Per-filing audit conversation memory**

- `backend/migrations/neon_schema.sql`: additive `CREATE TABLE IF NOT EXISTS audit_conversations (user_id text, filing_id text, messages jsonb NOT NULL DEFAULT '[]', updated_at timestamptz DEFAULT now(), PRIMARY KEY (user_id, filing_id))`. No existing table altered. Chaos-safe.
- `backend/api/persistence.py`: `ConversationRepository` (fallback-first): `get(owner, filing_id) -> list`, `append(owner, filing_id, turn)` (auto-timestamps), `delete(owner, filing_id)`. `FilingRepository.delete` gains optional `conversation_repo` param for cascade-delete.
- `backend/api/main.py`: `_CONVERSATION_REPO = ConversationRepository()` module singleton; `GET /me/filings/{id}/conversation` (401 no token, 404 if not owned/absent, `[]` if empty); `POST /entities/{tin}/audit-defense` extended -- loads filing digest + bounded history when `filing_id` is supplied + caller is authenticated, persists user question + assistant reply (with citations) after each call; cascade-delete wired on both single and multi-delete filing endpoints.
- Shared-guest caveat: documented in migration SQL comment -- guest sub keys all guest conversation rows (by design, same as other guest data).

**Tests**

- `backend/tests/api/test_pandai_persona.py` (NEW): 16 tests -- primer file exists; no asserted `%`/`RM`/comma-numbers in primer; no authoritative ITA clause IDs in primer; research-sources section stripped; 5 layers present in assembled system; layer order verified; no-greeting rule present; no-filing placeholder; filing digest injected; locale stub; primer cached; fabricated probe still rejected with persona; `answer` + `followups` present; pad-to-3 followups.
- `backend/tests/api/test_audit_conversation.py` (NEW): 16 tests -- hermetic `_hermetic` autouse fixture (monkeypatches DATABASE_URL away, clears `_mem` dicts); repo unit tests (empty get, append/get, timestamp added, order, per-owner isolation, delete, noop delete); cascade delete via FilingRepository.delete; endpoint tests (401, 404, empty [], persist Q+A, no persistence without filing_id, multi-turn growth, cascade via API, foreign-filing 404).

**Test count:** 195 (baseline) → 227 (+32). All 227 pass. `uv run pytest -q` green.

### Deviations from plan

- `ConversationRepository` implements `get`/`append`/`delete` (not `set` -- the plan listed `append(owner, filing_id, turn) / set(owner, filing_id, messages)` as alternatives; `set` was not needed by any endpoint, so omitted per simplicity-first).
- `FilingRepository.delete` signature changed from `(owner, ids)` to `(owner, ids, conversation_repo=None)` -- backward-compatible (default None); existing callers unaffected.
- The audit-defense endpoint is now auth-optional (resolves owner when a valid bearer token is present, falls back to None if absent or invalid). This keeps the endpoint working unauthenticated (existing tests pass) while enabling conversation persistence for authenticated users.

### Build status (BE)

- `cd backend && uv run pytest -q` -- **227 passed, 1 warning** (no failures)

---

## [27/06/26] -- FE-2.6 + PR-C FE: Audit Assistant rename + two-pane workbench + Pandai persona + conversation memory `[FE]`

**Branch:** `feat/audit-assistant-fe`

### FE-2.6 (6a) -- Rename + redirect + links

- `git mv frontend/src/pages/AuditDefense.tsx frontend/src/pages/AuditAssistant.tsx` (history preserved).
- `frontend/src/App.tsx`: import renamed to `AuditAssistant`; route `/audit-defense` -> `/audit-assistant`; legacy redirect `<Route path="/audit-defense" element={<Navigate to="/audit-assistant" replace />} />` added (mirrors the `/login` -> `/sign-in` pattern).
- Wizard child route updated: `path="audit-defense"` -> `path="audit-assistant"`.
- `frontend/src/layouts/AppShell.tsx`: NavLink `to`/label updated to `/audit-assistant` / "Audit Assistant".
- `frontend/src/pages/Dashboard.tsx`: quick-action card `to` updated to `/audit-assistant`.
- `frontend/src/layouts/WizardLayout.tsx`: wizard step 3 route updated to `/start/audit-assistant`.
- `frontend/src/components/JourneyProgress.tsx`: step 3 route updated to `/start/audit-assistant`.

### FE-2.6 (6b) -- Two-pane figure workbench

- New `AuditAssistant.tsx` (complete rewrite): responsive two-column `.audit-workbench` grid (1fr + 2fr; stacks to 1 col at <=680px).
- LEFT pane: `deriveFigureRows()` pulls `computation.fields` + `rec.line_items`; each row is a button that calls `handleChip(row.question)`. Uses `.row-div-list` helper for full-bleed dividers.
- RIGHT pane: suggested-question chips (empty thread) or follow-up chips (post-reply), Trust Demo chip, conversation thread, composer + Send.
- `tokens.css`: added `.audit-workbench` CSS rule + 680px mobile stack breakpoint.

### FE-2.6 (6c) -- Figure guard

- `isPlausibleFigure()`: guards non-finite + |value| > RM 100 billion.
- `isPlaceholderTin()`: guards known placeholder TINs (Z0000000001, Z0000000000).
- Applied in `deriveFigureRows()` (figure rows), `filingEvidence()` (evidence pairs for audit call), and filing picker's tax-payable display.

### PR-C FE -- Pandai persona + conversation memory + follow-up chips

- **Pandai avatar + name**: `PandaiHeader` component (`/logo.png` 28px circle + "Pandai" label + `SovereignBadge`) shown above each assistant answer bubble.
- **Conversational answer**: `AssistantTurn` renders `data.answer ?? data.exposure_note` as the message body (plain prose); structured `CitationPanel` replaced by inline `CitationChip` components (verified/rejected state, expandable source detail).
- **Fabrication money-shot preserved**: `isFabrication` + rejected citations still render the "Trust Payoff: Fabricated Clause Blocked" window.
- **Conversation memory**: `selectFiling()` calls `getFilingConversation(rec.id)` (new client method) and rehydrates prior turns as `ChatMessage[]`. Switching filings switches threads.
- **Persistence**: `getAuditDefense()` now accepts optional `filing_id`; in live mode this is passed in the POST body so BE persists the turn. In mock mode `_mockConversations[filing_id]` stores turns for round-trip fidelity.
- **Follow-up chips**: `sendMessage()` extracts `(res.followups ?? []).filter(f => f.trim().length > 0)` and stores on the `ChatMessage`; chips panel swaps from "Suggested Questions" to "Follow-up Questions" after the first reply.

### client.ts additions

- `AuditDefenseResponse`: added `answer?: string` and `followups?: string[]` fields.
- `ConversationTurn` interface (new).
- `makeMockDefense`: extended to accept `query` param and return believable `answer` + 3 `followups`; mock also persists to `_mockConversations`.
- `_mockConversations`: module-scoped in-memory store for mock conversation history.
- `getAuditDefense`: added optional `filing_id` param.
- `getFilingConversation`: new export -- `GET /me/filings/{id}/conversation`; mock reads from `_mockConversations`.

### Verify results

- `cd frontend && bunx tsc --noEmit` -- **0 errors**
- `bun run build` -- **green** (83 modules, 2.15s)
- `bunx biome check frontend/src` -- **0 errors** (46 files, 0 fixes applied)

---

## [27/06/26] — Branding pass (PR-D) `[FE]`

**Branch:** `feat/branding` (uncommitted, pending Gate 2).

### Assets added

- `frontend/public/fonts/talina.otf` -- Talina brand font (copied from `docs/screenshots/talina-font.otf`).
- `frontend/public/pandai-thinking.png` -- FAQ mascot, optimized 480x480 RGBA PNG (~142 KB, down from ~1.5 MB) via `PIL.Image.thumbnail(LANCZOS)`.
- `frontend/public/og-banner.png` -- social embed banner (copied as-is from `docs/screenshots/cukaipandai-embed.png`).

### Task 1 -- Brand font on wordmark only

- `frontend/src/styles/tokens.css`: added `@font-face` for "Talina" (`/fonts/talina.otf`, `font-display: swap`), added `--font-brand` token (`"Talina", "Fraunces", Georgia, serif`).
- Applied `var(--font-brand)` to `.topbar-wordmark`, `.drawer-wordmark`, `.footer-wordmark` in `tokens.css`.
- Applied `var(--font-brand)` to `.auth-brand` in `Auth.css`.
- No other Fraunces heading was touched.

### Task 2 -- Auth-page logo fix

- `frontend/src/pages/AuthScreen.tsx`: removed `LogoMark` import (orphan); replaced `<LogoMark />` with `<img src="/logo.png" alt="CukaiPandai" className="brand-logo" />`.
- `frontend/src/pages/Auth.css`: replaced `.auth-brand .logo-mark` sizing rule with `.auth-brand .brand-logo` (same 26px dimensions).

### Task 3 -- Landing FAQ mascot + cleanup

- `frontend/src/pages/Landing.tsx`: restructured FAQ section into 2-column layout (`.lp-faq-mascot-col` + `.lp-faq-content-col`); added `pandai-thinking.png` mascot in left column; removed "See All Questions" `<Link>`; removed `<p className="lp-script">` tagline from finale; kept "Open the Demo" CTA.
- `frontend/src/pages/Landing.css`: `.lp-faq-inner` changed to 2-col grid (280px mascot col + 1fr content); added `.lp-faq-mascot-col`, `.lp-faq-mascot`, `.lp-faq-content-col` rules; mobile `@media (max-width: 900px)` collapses to 1-col with smaller 120px mascot.

### Task 4 -- Landing mobile HOW IT WORKS stepped presentation

Desktop: scroll-driven `activeStep` JS (cardRefs on card slots) + sticky left step nav + tall right card slots (80vh each). Mobile was a flat stack with all steps at full opacity.

Fix: added a `.lp-how-mobile` layout (hidden on desktop, shown at <=900px) that renders each step with its console mock interleaved in a single column `<ol>`; `cardRefs` are now attached to each `<li>` in the mobile layout so scroll-driven `activeStep` updates work on mobile too. `cardRefs` type widened from `HTMLDivElement` to `Element` to accommodate `<li>` refs.

- `frontend/src/pages/Landing.tsx`: added `.lp-how-desktop` / `.lp-how-mobile` sibling containers; mobile uses `lp-step-mobile` `<li>` items with `.lp-step-header` + `.lp-step-mock` inline.
- `frontend/src/pages/Landing.css`: `.lp-how-desktop { display: grid }` / `.lp-how-mobile { display: none }` by default; at <=900px swapped; added `.lp-steps-mobile`, `.lp-step-mobile`, `.lp-step-header`, `.lp-step-mock` rules.

### Task 5 -- Social embed meta

- `frontend/index.html`: added Open Graph tags (`og:type`, `og:url`, `og:title`, `og:description`, `og:image`, `og:image:width 1200`, `og:image:height 630`) and Twitter Card tags (`twitter:card summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`), all pointing to `/og-banner.png`.

### Verify results

- `cd frontend && bunx tsc --noEmit` -- **0 errors**
- `bun run build` -- **green** (83 modules, 2.26s)
- `bunx biome check frontend/src` -- **0 errors** (46 files, 0 fixes applied)
- Font file confirmed present at `frontend/public/fonts/talina.otf` (9 KB).

---

## [27/06/26] -- PR-E: post-#27 fixes `[FE]`

**Branch:** `feat/pr27-fixes`. Five targeted follow-up fixes discovered after merging PR #27.

### Fix 1 -- Row-divider left edge (GLOBAL)

Changed `.row-list > * + *` and `.row-div-list > * + *` and `.requirement-row + .requirement-row` in `frontend/src/styles/tokens.css` from `border-top: var(--border)` to `box-shadow: inset 0 1px 0 var(--ink)`. The `inset` box-shadow spans the full element width regardless of border-radius or child padding, making dividers truly symmetric on both left and right edges. Added `border-bottom: none` guards on last children. Affects all consumers: Filing records, Classified Line Items, Analytics rows, ComputationPanel req-list bands, Audit picker/figure rows.

### Fix 2 -- PENDING draft resume (functional)

In `frontend/src/pages/FilingNew.tsx`, the `resumeId` effect now rehydrates `classifyResult`, `lineItems`, and sets `phase` to `{ tag: 'classified' }` when the fetched draft has `line_items`. Previously only `rawText` and `draftId` were restored, forcing a re-classify. Now opening a PENDING draft from `/filing` lands the user on the "classified, ready to compute" stage. The mock `createDraftFiling` already stores `line_items` and `raw_text`, so the full round-trip is demoable with `VITE_API_MOCK=1`.

### Fix 3 -- /filing/[id] provenance into tooltip

In `frontend/src/pages/FilingRecord.tsx`, removed the standalone "[i] How this was calculated..." info `.window` card. Passed the same provenance text as `headingTip` into `ComputationPanel` (the prop was already implemented in PR #27). The info now appears as an `InfoTip` on the "Tax Computation" heading.

### Fix 4 -- /analytics bottom CTA cleanup

In `frontend/src/pages/Analytics.tsx`, removed the bottom `borderTop` divider div and the two cross-link CTAs ("Open Obligation Calendar" and "Start Form C Filing"). The `Link` import was retained (still used in the entity-setup empty state).

### Fix 5 -- Solid-background sweep (GLOBAL polish)

Replaced `background: 'transparent'` with `background: 'var(--window)'` on bordered buttons/links that sit directly over the `.page-scroll` grid background:

- `frontend/src/pages/FilingNew.tsx`: "Edit Trial Balance" secondary button.
- `frontend/src/pages/FilingRecord.tsx`: "Back to Filing Records" (not-found card) and "All Filings" (bottom nav) links.
- `frontend/src/pages/FilingStudio.tsx`: "Delete Selected" destructive toolbar button.
- `frontend/src/pages/CustomCompany.tsx`: "Back" secondary button in the company form.
  Elements inside `.window` (dialog, popovers, nav drawer, audit workbench) were left untouched. Intentional transparent elements (`.dash-cta-ghost` on denim hero, borderless text-link skip buttons) were not modified.

### Verify results

- `cd frontend && bunx tsc --noEmit` -- **0 errors**
- `bun run build` -- **green** (83 modules, 2.05s)
- `bunx biome check frontend/src` -- **0 errors** (46 files, 0 fixes applied)

---

## [27/06/26] -- PR-F: audit conversation card consolidation + back-to-records + wordmark spacing + landing finale removal `[FE]`

**Branch:** `feat/audit-layout-polish` (uncommitted; awaiting Gate 2).

### Change 1 -- Audit Assistant right pane consolidated into one "Conversation" card

In `frontend/src/pages/AuditAssistant.tsx`: replaced the three stacked `.window` cards in the right pane ("Follow-up Questions / Suggested Questions", "Conversation", "Ask a Question") with a single `.window` titled "Conversation". Internal layout order: (a) message thread at top; (b) follow-up/suggested chips; (c) ask composer (textarea + Send) at bottom. Chips section and composer section are separated from the thread by `borderTop: 'var(--border)'` lines. The merged card uses `gridTemplateRows: 'auto 1fr auto auto'` so the thread area expands and the chips + composer are pinned at the bottom.

Follow-up chips now render with `variant='followup'` (mustard-tinted: `border: 1px solid var(--mustard)`, `background: rgba(224,169,59,0.12)`). Suggested question chips (empty-thread seeds) keep `variant='default'` (screen background). Trust Demo chip keeps `variant='trust-demo'` (rust). Added `'followup'` to the `Chip` variant union and resolved ternary formatting to satisfy biome's single-line preference.

### Change 2 -- "Back to Chat Records" breadcrumb link

In `frontend/src/pages/AuditAssistant.tsx`: added an unobtrusive `<- Back to Chat Records` button above the "Defending Filing" card. Uses `font-mono`, `ink-soft` colour, no border/background, calls `clearFiling()` to return to the filing picker. The existing "Switch Filing" button inside the card is preserved.

### Change 3 -- Brand wordmark letter-spacing

In `frontend/src/styles/tokens.css`: added `letter-spacing: 0.03em` to `.topbar-wordmark`, `.drawer-wordmark`, and `.footer-wordmark`. In `frontend/src/pages/Auth.css`: added `letter-spacing: 0.03em` to `.auth-brand`. No other text is affected.

### Change 4 -- Landing finale section removed

In `frontend/src/pages/Landing.tsx`: removed the entire `<section className="lp-section lp-finale">` block (the dark `.lp-finale` band with the "Open the Demo" CTA). The `lp-fold` div now closes directly after the FAQ `</section>`. The standalone scroll-to-top button (`.lp-top`) lives outside `.lp-fold` and is preserved. The `Link` import is still used by the hero CTA.

In `frontend/src/pages/Landing.css`: removed `.lp-finale`, `.lp-finale-inner`, `.lp-finale-cta`, `.lp-finale-cta:hover` rule blocks; removed `.lp-finale` from the dark-theme rule (`.lp-trust` dark override retained).

### Verify results

- `cd frontend && bunx tsc --noEmit` -- **0 errors**
- `bun run build` -- **green** (83 modules, 2.09s)
- `bunx biome check frontend/src` -- **0 errors** (46 files, 0 fixes applied)

---

## [27/06/26] — Structured filing input + full corporate-tax engine (SFI-0…SFI-6) `[BE/FE/TD]`

**Why:** the `/filing/new` free-text `AccountName Amount` textarea was too lax — users typed non-financial gibberish (emojis, "tung tung tung sahur") and still got a classification. Replaced it with fixed, selectable accounts; PO chose to ALSO build the real Schedule-3 capital-allowance + s.44 reliefs engine (not just `income − deductible`).

### Research (SFI-0) — cited YA2026 rates/caps

Background workflow `w5fzrr9qw` (4 agents) verified CA IA/AA rates + cost caps, s.44 relief caps, and the 7-stage computation order vs LHDN + PwC/EY/KPMG/Deloitte/Grant Thornton/Crowe. Locked: P&M 20/14, MV 20/20 (RM50k base cap), F&F 20/10, ICT 40/20, IBA 10/3, SVA 100% (SME aggregate-cap-exempt), **renovation general deduction EXPIRED 31/12/2022 → no auto-allowance**; donation 10% + zakat 2.5% both vs **aggregate** income; **company zakat is a deduction not a rebate**; **company total income = chargeable income**; **group relief needs paid-up >RM2.5m (inverse of SME)**.

### Taxonomy (SFI-1)

- `backend/core/tax_accounts.py` — **88 fixed accounts across 14 groups** (research summary's "62" was an undercount); typed `TaxAccount`, `category` ∈ {income, exempt_income, deductible, non_deductible, capital_allowance, special_deduction} + `ca_class`/`relief_key`; helpers `by_code`/`by_group`/`allowed_codes`.
- `frontend/src/lib/taxAccounts.ts` — mirror (code/label/group/category/note + `CATEGORY_LABEL`). MUST stay in sync (audit verified 88/88 codes, 0 category/group mismatches).

### Config (SFI-2)

- `core/config/ya_2026.yaml` — added cited `capital_allowances` (IA/AA + caps per `ca_class`) and `reliefs` (EPF 19%, secretarial RM15k, ESG RM50k, donation 10%, zakat 2.5%, group relief 70%, loss/CA carry-forward 10y). Version unchanged (`YA2026.1`; additive only).

### Engine (SFI-3)

- Rewrote `core/computation.py` `compute_form_c` to the full ascertainment chain (business income → adjusted → statutory[+balancing charge −CA] → aggregate[−CY loss] → total[−b/f loss −zakat −donations −group relief] → chargeable → tax). Exempt credit items (dividend, gain on disposal, unrealised forex gain) excluded. 8 stage fields exposed for the FigureTrace UI; `chargeable_income`+`tax_payable` keys retained. +9 stage tests. **Golden RM31,000 + non-SME RM240,000 preserved.**

### Structured manual entry (SFI-4)

- `FilingNew.tsx`: free-text textarea → **two-level structured rows** (group → account → amount). `buildLineItems` builds `LineItem[]` deterministically from the taxonomy (**no LLM on the manual path**). Personas carry `demoItems` (replaced `demoRawText` everywhere). **Honest UI:** manual shows "entered directly · no AI", hides the AI route-info, provenance tip states no AI involved; sovereign/AI shown only for uploads. Resume rehydrates rows from line_items; "Edit Line Items" preserves rows + the one draft id. `FilingPipeline.Stage1Detail` gained a `manual` prop; `UPSTREAM_KEYS` extended for ordered stage display.

### Constrained upload (SFI-5)

- `documents.py`: injects the 88-account catalogue into the prompt; **server-side drops codes outside the taxonomy + non-finite/zero amounts, and sets category authoritatively from the taxonomy** (never the model). Drop-zone names the curated docs (Income Statement/P&L, Trial Balance); AI extract pre-fills the rows for review. Mock classify aligned to taxonomy codes + valid categories.

### Audits (SFI-6)

- Backend tax-engine audit → **GO**. FE + upload audit → **GO** (taxonomy sync verified programmatically; honesty contract holds; determinism + state-flow correct; no regressions). Hardened `documents.py` to reject NaN/Infinity per the audit note.

### Verify results

- `backend`: `python -m pytest -q` (repo `.venv`) → **236 passed**.
- `frontend`: `tsc --noEmit` 0 errors · `vite build` green (84 modules) · `biome check` (root-pinned 1.9.4) 0 errors on all changed files.

---

## [27/06/26] — Document-first filing input + realistic sample documents (SFI-7) `[FE/TD]`

**Why:** follow-up to SFI. (1) The New Filing input showed Manual entry first; the team wants it **document-first** with the manual form behind a toggleable tab, mirroring `../myai-future-hackathon`. (2) No realistic sample documents existed to exercise the upload pipeline.

### Research (online-grounded)

- A research agent mapped `../myai-future-hackathon`'s intake UX: **Upload is the default tab**; a custom (non-library) toggle keeps both panels mounted; sample docs live in `public/fixtures/` and load via a "use sample" affordance.
- A second agent gathered **real Malaysian document formats** (cited): MPERS Statement of Profit or Loss (KPMG / Radiant Rainbow illustrative statements — header block, `Registration No : <12-digit> (<ROC>)`, `(Incorporated in Malaysia)`, parenthesised deductions, `RM` once at column head); AutoCount/SQL trial-balance export (`AccNo | Description | Debit | Credit`, `nnn-nnn` chart-of-accounts codes, "As At DD/MM/YYYY"); LHDN HK-1 working-sheet captions.

### FE — document-first tabs (`FilingNew.tsx`)

- Replaced the manual-first + divider layout with a **tab toggle** ("Upload Document" default · "Manual Entry"); both panels stay mounted (toggled via `display`), so state survives a switch. Titlebar → "Stage 01 - Provide Your Figures".
- **Honesty preserved:** manual entry stays deterministic ("entered directly · no AI", no sovereign badge); the AI/sovereign path shows only for uploads.
- Added a **"Use sample document"** button (upload tab) that fetches the active persona's sample income statement from `/fixtures/`, wraps it as a `File`, and runs the upload pipeline. Shown only for the 3 demo personas (`SAMPLE_DOCS` keyed by TIN); hidden for custom entities.

### Sample documents (generated, verified)

- A multi-agent workflow generated **sector-specific, arithmetic- and taxonomy-verified** financials for Acme (wholesale), Sinar (SaaS), Selera (F&B) — each P&L revenue matches the persona's gross income, gross profit + PBT reconcile exactly, and the trial balances balance. Saved to `backend/scripts/sample_financials.json`.
- `backend/scripts/gen_sample_docs.py` (uses `fpdf2`, a dev-only fixture dep — NOT a runtime/deploy dependency) renders, per persona, into `frontend/public/fixtures/`:
  - `{key}-income-statement.pdf` — detailed MPERS Statement of Profit or Loss (real header format, parenthesised deductions).
  - `{key}-trial-balance.csv` — AutoCount-style trial balance (`AccNo | Description | Debit | Credit`, balanced totals).
- Confirmed the PDFs contain **extractable text** (pypdf) with every line item present, so the live extraction pipeline (pypdf → constrained classifier → taxonomy) works end-to-end.

### Verify results

- `frontend`: `tsc --noEmit` 0 errors · `vite build` green (84 modules) · `biome check` 0 errors.
- Sample docs: 6 files generated; Acme/Sinar/Selera revenue + PBT exact; trial balances balance; PDF text extraction verified.

---

## [27/06/26] — Engine robustness: deterministic deduction treatments + boot-message UX (SFI-8) `[BE/FE/TD]`

**Why:** a review surfaced classic Form C misclassifications a naive classifier makes (depreciation as deductible; staff entertainment disallowed; client entertainment fully disallowed instead of 50%). Does our deterministic core catch these? Mostly yes — category is pinned to the taxonomy account, so depreciation is structurally `non_deductible` — but the entertainment 50% split + the EPF cap were not automatic.

### Boot-message UX (FE)

- `client.ts`: added `safeFetch` (wraps `globalThis.fetch`; no recursion) so a failed request (server cold/suspended) surfaces "**The server is still starting up … please wait for it to boot, then refresh**" instead of the raw `NetworkError`. All live-path calls route through it — every backend-backed page benefits.

### Deterministic deduction treatments (BE)

- `tax_accounts.py`: added a `treatment` field. Client entertainment repurposed (`sell_entertainment_allowed` → `sell_entertainment_clients`, `treatment="entertainment_50"`): the user enters the FULL amount and the engine deducts 50% + adds back 50% (s.39(1)(l)). Removed the manual `nd_entertainment_50` half. Added `staff_entertainment` (100% deductible — the s.39(1)(l) employee carve-out). `staff_epf` tagged `treatment="epf_capped"`.
- `computation.py`: `_deductions` is now treatment-aware — applies the 50% entertainment restriction and the employer-EPF 19%-of-remuneration cap (s.34(4); base = salaries + directors' fees + direct labour; no cap when base is 0), and surfaces the disallowed amounts as visible figures (`entertainment_50pct_addback`, `epf_excess_addback`) for defensibility. Depreciation / general provisions / unapproved donations stay excluded by their pinned `non_deductible` category.
- `audit_risk.py`: transparency flags when the entertainment restriction or EPF cap is applied.
- Taxonomy stays **88 accounts, FE↔BE identical (diff = 0)**.

### Tests

- +5 computation tests: entertainment 50% auto-split; staff entertainment 100%; EPF capped (excess added back) + under-cap; the full 20-line user scenario → chargeable RM1,901,500. Golden RM31,000 + non-SME RM240,000 unchanged.

### Verify results

- `backend`: `python -m pytest -q` → **241 passed**.
- `frontend`: `tsc --noEmit` 0 errors · `vite build` green · `biome check` 0 errors. Taxonomy diff backend↔FE = 0.

---

## [27/06/26] — Filing draft-pack report (WeasyPrint PDF) (SFI-9) `[BE/FE/DO/TD]`

**Why:** give the SME a printable Form C **draft pack** (tax-computation working paper) to review and take to LHDN / a tax agent. A preparation aid — **never auto-submitted** (Malaysia self-assessment; the taxpayer/authorised agent files via MyTax). Pattern mirrors `../myai-future-hackathon` (WeasyPrint + blob-URL iframe preview + download); format grounded in online research (LHDN HK-1 + tax-agent working-paper convention).

### Merges first

Fast-forwarded `feat/engine-robustness` then rebased+FF `fix/auth-page` into `main` (now `60a000c`) and pushed.

### Backend

- `api/report.py`: `build_report_html(filing, entity)` — pure HTML builder (cover + diagonal "DRAFT - NOT FOR SUBMISSION" watermark on every page via `position:fixed`; entity particulars; tax-computation working sheet; capital-allowance schedule; line-item schedule; Form C field summary; self-assessment disclaimer). All figures sourced from the engine's `computation.fields` (no re-derivation; inter-stage deltas reconcile). All interpolated values HTML-escaped. `render_pdf` lazily imports WeasyPrint so the API still boots if a native lib is missing.
- `main.py`: `GET /me/filings/{id}/report` (owner-scoped) → inline `application/pdf`, `Cache-Control: no-store`; 404 (absent/foreign), 409 (no computation yet), 503 (PDF engine libs unavailable — caught ImportError/OSError so genuine bugs still 500).
- Deps/deploy: `weasyprint>=62` in `pyproject`; Dockerfile installs Pango/Cairo/PangoFT2/HarfBuzz/GDK-PixBuf/libffi + DejaVu/Liberation fonts. `uv.lock` NOT regenerated (sandbox offline) — harmless: the image uses `uv pip install -e .` (resolves from pyproject), not `uv sync`.

### Frontend

- `client.ts` `getFilingReport(id): Promise<Blob>` (authed fetch; mock degrades with a clear message). `FilingRecord.tsx` "Filing Draft Pack" card: Generate → blob → `URL.createObjectURL` → inline `<iframe>` preview + Download PDF (`<a download>`); blob URL revoked on unmount.

### Verify results

- `backend`: `python -m pytest -q` → **246 passed** (+5 report tests; PDF-render test skips where WeasyPrint native libs absent).
- End-to-end: a real Acme filing renders to a valid **3-page PDF** with every section + the entertainment-restricted / EPF-cap add-back lines + disclaimer.
- `frontend`: `tsc --noEmit` 0 errors · `vite build` green · `biome check` 0 errors.

---

## [27/06/26] — Defect-register verification + fixes (34-item QA sweep) `[BE/FE/DO/TD]`

**Why:** an external 34-item defect register (`defects.md`) was provided. A 6-lens verification workflow checked EACH item against the actual code before any fix: **2 refuted** (DEAD-7 off-by-one — a rule-selection heuristic, no day-level error; FE-9 — ObligationRadar DOES have empty-state branches), the rest confirmed/partial. Fixed the clear, safe, high-value items; deferred the large/contract-changing ones with rationale.

### Fixed

- **AUTH-1/2 (P0)** `api/auth.py`: `_jwt_secret` never signs with the public dev default or an empty key — a configured secret is used only if >=32 chars and not the legacy value, else a **random per-process key** (unforgeable; non-breaking — guest-first demo + tests keep working without env wiring; prod should still set `AUTH_JWT_SECRET`). `.env.example` line commented out.
- **API-1** `api/llm.py` + `docker-compose.yml`: default LLM route flipped to **sovereign ILMU** (`LLM_PROVIDER=openai`, `nemo-super`); direct Anthropic is now an explicit opt-in (was the silent default).
- **API-2/3/4** `api/main.py`: malformed `.xlsx` (`BadZipFile`/`InvalidFileException`) and `.pdf` (`PyPdfError` — the register's `PdfError` name was wrong) now return **422**; MSIC upstream `httpx.HTTPError` returns **502** (were uncaught 500s). +3 tests.
- **COMP-1** balancing charge now applies on an adjusted loss (CA still can't create a loss). **COMP-2** group relief zeroed for SME claimants (ineligible). **COMP-3** employer-EPF fully added back when no remuneration line (cap base 0). **COMP-4** `LineItem.amount` is `Field(ge=0)`; classifier drops non-positive rows. **COMP-5** secretarial citation reconciled to P.U.(A) 162/2020 (amended by 471/2021). **COMP-6** dead `rd_double_deduction_pct` + small-value per-asset assumption annotated. +5 computation tests.
- **CITE-3** `citation_critic.py`: affirmative parse tightened to first-token `YES` + no negation (rejects "YESTERDAY…NO", "YES…NOT support"). +3 tests.
- **DEAD-3** MyInvois mandate uses the turnover **band → `mandatory_from`** (not basis-period start); **DEAD-6** CP204 30-day offset externalised to `income_tax.cp204_estimate_days_before`. FE mock dates synced; obligations holiday test updated.
- **FE-1** all money figures use `'en-MY'` grouping. **FE-4** journey route `/start/filing` → `/start/filing/new`. **FE-6** `useEntity` resolves from in-context personas first, then `validateTin`-gated fetch (no more misrouted valid TINs). **FE-2** FilingStudio surfaces list-load + delete errors (empty-state gated on no-error). **FE-3** FilingRecord shows an Error card for non-404 failures (not "Filing Not Found").

### Deferred (documented; not half-implemented)

- **DEAD-1/2/5/8** (SST bi-monthly + CP39 monthly + CP204 instalments/SME-exemption + per-entity-type forms): large, change the ObligationCalendar contract (1→N obligations) and need verified per-form deadlines — a coordinated deadline-correctness workstream.
- **DEAD-4** (obligation→clause citations): needs filing-procedure clauses added to the corpus with verified sources.
- **CITE-1/2/4/5** (prose grounding, probe segregation, RAG allowed-set, escalation policy): the citation-integrity theme is entangled with the BE-18 "rejects a fake citation" money-shot contract + needs a product decision on redact-vs-block; CITE-2 left intact so the money-shot is not broken.
- **FE-5** (custom-save silent failure): by-design best-effort; product decision on whether a save failure blocks navigation.
- **COMP-6** per-asset small-value cap enforcement: needs a one-asset-per-line input contract.

### Verify results

- `backend`: `python -m pytest -q` → **257 passed** (+11).
- `frontend`: `tsc --noEmit` 0 errors · `vite build` green · `biome check` clean.

## [27/06/26] — Mobile + filing UI overflow sweep `[FE]`

**Why:** screenshots showed the filing page's RM tax hero clipping off-screen on mobile and the Classified Line Items table running past the viewport on desktop (long rule codes / extreme RM figures). A deep, viewport-driven UI audit (Edge via playwright-core; programmatic overflow detection at 375px + 1440px, then a 4-lens read-only sweep of every page + the global CSS) confirmed both and surfaced the same root causes elsewhere.

### Root causes (one of three patterns each)

1. Fixed px font-size on large numbers/headings with no `clamp()` → overflow on narrow screens.
2. Grid tracks (`1fr` / `Npx` / `repeat(12,1fr)`) without `minmax(0,…)`, so a wide/unbreakable cell (grid items default `min-width:auto`) forces the track past the viewport.
3. Long unbreakable mono strings (URLs, rule codes, big RM figures, model IDs) with no `overflow-wrap`.

### Fixed (9 files)

- **FilingPipeline** — hero tax number `clamp(2.25rem,12vw,96px)` + wrap; `.requirement-topline` regrid to `minmax(0,1fr) minmax(0,200px) minmax(0,150px)` + shrinkable/wrapping cells; new `.trace-detail` rule wraps rule_id/config_version/input slugs.
- **CitationPanel** — citation URL/clause/passage wrap; SovereignBadge truncates long model IDs.
- **ObligationRadar** — 12-month calendar `repeat(12,minmax(0,1fr))` + `min-width:0` cells; filing-obligation rows `72px minmax(0,1fr) auto auto`.
- **Dashboard** — deadline rows `80px minmax(0,1fr) auto auto`.
- **Analytics** — KPI value `clamp(22px,6vw,32px)` + wrap.
- **Entity / CustomCompany** — basis-period date grids `repeat(2,minmax(0,1fr))`.
- **AuditAssistant** — three `minmax(0,1fr) auto` rows + CitationChip clause/URL wrap.
- **tokens.css** — additive `overflow-wrap` guards on `.page-head h1`, `.page-kicker`, `.popover-detail`, `.toast-body`, `.empty-hello`/`.empty-copy`, `.kind-tag`, `.dash-hero-form`.

> Two refuted by the audit (no action): no other 96px-class heroes; `.dash-main-grid`/`.dash-orient`/`.dash-hero-sub` are already responsive-safe. Remaining audit items were `low` (defensive guards on devkit-dead-code classes — left untouched).

### Verify results

- Edge screenshots + programmatic check: **zero horizontal overflow** at 375px and 1440px across the filing computation/line-items, citations, Obligation Calendar (12-month grid + filing rows), and Dashboard (mock-data populated).
- `frontend`: `tsc -b` 0 errors · `vite build` green (84 modules) · `biome lint` 0 violations.
- Diff audited by subagent → GO (one parity gap closed: AuditAssistant figure-row amount).

## [27/06/26] — PR-G1: Loading skeletons + tooltip overflow fix + full-bleed dividers `[FE]`

**Branch:** `feat/loading-skeletons`

### 1. Loading skeleton screens

- New primitive: `frontend/src/components/Skeleton.tsx` — `Skeleton` (rect block), `SkeletonText` (n-line stack), `SkeletonCard` (window card with titlebar + body).
- New CSS: `.skeleton` shimmer rule in `frontend/src/styles/tokens.css` — sweeping `background-position` gradient animation using `--screen`/`--grid` tokens. Under `.reduce-motion` and `prefers-reduced-motion: reduce`, animation is suppressed and falls back to a static `--screen` block.
- Pages updated: `Dashboard.tsx` (Deadlines panel — 4-row grid skeleton), `Analytics.tsx` (5 KPI cards + Overdue + two compact panels), `Entity.tsx` (snapshot card + form card), `ObligationRadar.tsx` (calendar viz + obligations list), `FilingStudio.tsx` (3-row filing list), `AuditAssistant.tsx` (3-row filed returns picker), `FilingNew.tsx` (2-card form skeleton while entity loads).
- Barber strips used for IN-PROGRESS ACTIONS (classifying, computing, pipeline steps) are untouched per spec.

### 2. Tooltip overflow fix

- Root cause: `Tooltip.tsx` bubble div had no `white-space` or `overflow-wrap` in its inline style. `maxWidth` was applied via `reposition()` correctly, but without `whiteSpace: 'normal'` and `overflowWrap: 'anywhere'`, the browser treated content as a single unbreakable run, so `max-width` never actually constrained the rendered width.
- Fix: added `whiteSpace: 'normal'` + `overflowWrap: 'anywhere'` to the bubble div's inline style in `frontend/src/components/Tooltip.tsx`. Global (every InfoTip/Tooltip consumer). API unchanged.

### 3. Full-bleed row dividers

- Root cause: `.requirement-row + .requirement-row { box-shadow: inset 0 1px 0 var(--ink) }` — `box-shadow` can be clipped by the parent `.window`'s `border-radius: 3px` (browsers may apply implicit overflow clipping at border-radius boundaries), producing a left-edge gap while the right edge renders correctly.
- Fix: replaced `box-shadow: inset 0 1px 0 var(--ink)` with `border-top: 1px solid var(--ink)` on `.requirement-row + .requirement-row`, which draws the divider at the element's border-box edge — guaranteed edge-to-edge. Added `overflow: hidden` to `.req-list` to contain any rendering artifacts. Last row has no `border-bottom`, so no collision with the `.window` bottom border.
- Scope: only `.req-list` / `.requirement-row` in `frontend/src/styles/tokens.css`. Does not touch `.row-list`/`.row-div-list` (already correct). No regress on obligation rows, analytics rows, or filing-record rows.

### Verify

- `bunx tsc --noEmit`: clean
- `bun run build`: green (85 modules, 0 errors)
- `bunx biome check frontend/src`: 0 errors

---

## [27/06/26] — PR-G2: Filing-new upload doc-type picker + preview modal + back link `[FE]`

**Branch:** `feat/filing-upload-redesign`

### 1. Upload Document tab redesign (item 4, Option 1)

- Replaced the single open-ended dropzone in Stage 01's Upload Document tab with a guided two-step flow.
- Step A: two selectable doc-type option cards ("Income Statement / P&L" / "Trial Balance") with one-line captions ("revenue & expense lines" / "all ledger account balances"). Token-CSS `aria-pressed` segmented buttons; one selected at a time.
- Step B: revealed once a type is picked — a tailored dropzone whose headline copy matches the selected type ("Drop your Income Statement (P&L) · CSV, XLSX, or PDF" vs "Drop your Trial Balance · ...") plus a type-matched "Use sample document" button (wired to the per-type fixture from the updated `SAMPLE_DOCS` map, falls back gracefully if only one type has a sample).
- `SAMPLE_DOCS` updated from a flat per-persona record to `Partial<Record<DocType, ...>>` — all 3 personas now have both `income-statement` and `trial-balance` fixture entries.
- `DOC_TYPE_META` constant carries label/caption/dropCopy/formats per type; picker is data-driven.
- Existing `handleUpload`/`handleDrop`, accepted formats, AI extraction, line-item prefill, and draft-create behaviour are all preserved.

### 2. Loaded-document display + preview modal (item 4)

- After upload (or "Use sample document"), a `LoadedDoc` state tracks: filename, docType, previewSrc, isSample, mimeType.
- A doc-row appears below the dropzone: doc icon + filename + type/sample label + eye (preview) button.
- Eye button opens `DocPreviewModal` — a floating modal with blurred backdrop (`backdropFilter: blur(6px)` + dim scrim).
- Modal preview rendering:
  - PDF: `<iframe>` of the object URL or fixture path.
  - CSV: `csvToTableHtml()` — inline split into a simple HTML table (no new package), first 200 rows.
  - XLSX: best-effort note ("XLSX preview not supported inline; the AI will extract figures from it").
- For sample docs, uses the fixture path directly (`/fixtures/...`); for uploaded files, creates an object URL which is revoked on component unmount via `previewObjectUrlRef` cleanup effect.
- Accessibility: Escape closes, backdrop-click closes, visible close `×` in the titlebar, `tabIndex={-1}` on `<dialog>`, modal focused on open and prior-focus restored on close.

### 3. "Back to Filing Records" breadcrumb (item 4)

- Added `← Back to Filing Records` link (`fontFamily: var(--font-mono)`, `color: var(--ink-soft)`) above the "New Filing" page heading, routing to `/filing`.
- Mirror style from `FilingRecord.tsx` (`← Filing Records`).

### 4. Remove "entered directly · no AI" text (item 3-text)

- In `frontend/src/components/FilingPipeline.tsx` `Stage1Detail`: removed the `<span className="titlebar-meta">entered directly · no AI</span>` branch when `manual === true`. The conditional now only renders `SovereignBadge` when `!manual`. No orphaned imports or variables.

### Files touched

- `frontend/src/pages/FilingNew.tsx` — all items 1/2/3
- `frontend/src/components/FilingPipeline.tsx` — item 4

### Verify

- `bunx tsc --noEmit`: clean
- `bun run build`: green (85 modules, 0 errors, 400 kB JS)
- `bunx biome check frontend/src`: 0 errors in our changed files (1 pre-existing format error in `client.ts` not touched by this PR)

---

## [28/06/26] — PR-G3: filing-record scroll-spy index + Ask AI deep-link + back-link/draft-text/All-Filings cleanup `[FE]`

### Summary

Four refinements to `/filing/[id]` (`FilingRecord.tsx`) and the Audit Assistant deep-link (`AuditAssistant.tsx`).

### 1. Back-link rename

- `&larr; Filing Records` → `&larr; Back to Filing Records` in the breadcrumb `<Link>` near the top of the loaded record view.

### 2. Remove "draft · not submitted"

- Removed `<span className="titlebar-meta">draft · not submitted</span>` from the "Filing Draft Pack" card titlebar. The card title + InfoTip are kept; no orphan left.

### 3. Scroll-spy index island

- Added a `PageIndex` sub-component (a `<nav aria-label="On this page">` with `.page-index` / `.page-index-list` / `.page-index-link` token-CSS classes) rendering the page section headings in order: "Tax Computation", "Risk Assessment" (only when risk flags exist), "Filing Draft Pack", "Filing Pipeline".
- Each indexed card now has an `id` (`fr-tax-computation`, `fr-risk-assessment`, `fr-filing-draft-pack`, `fr-filing-pipeline`). Clicking a link calls `scrollIntoView`-equivalent via `window.scrollTo` with an 84px topbar offset and `behavior: 'smooth'`.
- Active-section tracking via a `useActiveSection` hook using `IntersectionObserver` (`rootMargin: '-84px 0px -60% 0px'`). Active item gets `aria-current="true"` and the `.page-index-link[aria-current]` rule applies `color: var(--denim)` + left accent border.
- Layout restructured with `.filing-record-layout` (two-column grid: `1fr 160px`) + `.filing-record-rail` (`position: sticky; top: 84px`) + `.filing-record-main`. On `max-width: 900px` the rail is hidden and layout collapses to single column.
- CSS added to `frontend/src/styles/tokens.css` (`.filing-record-layout`, `.filing-record-main`, `.filing-record-rail`, `.page-index`, `.page-index-label`, `.page-index-list`, `.page-index-link`, responsive media query).
- Main component refactored into `ActiveFilingRecord` to keep `useActiveSection` hook unconditional (avoids hooks-after-early-return).

### 4. Bottom actions — remove "All Filings", add "Ask AI" deep-link

- Removed the "All Filings" `<Link to="/filing">` button from the bottom nav.
- Added `<HelpCircleIcon>` (new 14×14 SVG in `frontend/src/components/icons.tsx`) and "Ask AI" button beside "+ New Filing". Clicking navigates to `/audit-assistant?filing=<record.id>`.
- In `AuditAssistant.tsx`: imported `useSearchParams` from `react-router-dom`; reads `?filing=<id>` param on mount. After filings load, a dedicated `useEffect` finds the matching filing (if any) in the eligible list and calls `selectFiling` to go straight to the workbench — skipping the picker. A `deepLinkApplied` ref prevents double-execution. Falls back to normal picker if param is absent or filing not found.

### Files touched

- `frontend/src/pages/FilingRecord.tsx` — all four items
- `frontend/src/pages/AuditAssistant.tsx` — `useSearchParams` + deep-link `useEffect`
- `frontend/src/components/icons.tsx` — added `HelpCircleIcon`
- `frontend/src/styles/tokens.css` — filing-record two-column layout + scroll-spy island CSS

### Verify

- `bunx tsc --noEmit`: clean
- `bun run build`: green (85 modules, 0 errors, ~405 kB JS)
- `bunx biome check` on all 4 touched files: 0 errors, 0 warnings

## [28/06/26] — PR-G4: fix req-list divider left-gap, analytics tooltip 768px clip, scroll-spy top highlight `[FE]`

**Branch:** `fix/ui-batch-smoke` (uncommitted; Gate 2 pending).

### 1. Fix 1 -- req-list left-gap divider (tokens.css)

- **Root cause:** `.req-list` inherits the browser-default `ul` padding (`padding-inline-start: 40px`), which insets the `<ul>` ~40px from the card left edge. The `border-top` on `.requirement-row` elements fills the `<ul>` width, not the `.window` width, so dividers in "Classified Line Items", "Line Items", and "SUPPORTING FIGURES" bands were ~40px short of the card left border.
- **Fix:** added `list-style: none; margin: 0; padding: 0;` to the `.req-list` rule in `frontend/src/styles/tokens.css`. The `display: grid` + `overflow: hidden` properties were already there and handle the right edge and border-radius clipping; removing the default padding makes the left edge flush too.
- **Files:** `frontend/src/styles/tokens.css` (`.req-list` rule, ~line 855).

### 2. Fix 2 -- analytics tooltip 768px clip (Tooltip.tsx)

- **Root cause (two parts):**
  1. The bubble initially renders at `pos={top:0, left:0}` with `maxWidth` only in the React state initial value (280) but NOT in the style prop -- so the first paint showed the bubble at its natural (potentially unclamped) width.
  2. A single `requestAnimationFrame` is not guaranteed to run after the browser has completed layout for the newly-mounted bubble; `getBoundingClientRect()` could return `{width:0, height:0}` if the browser hasn't laid out the node yet, leaving `left` unclamped.
- **Fix:**
  - Added `maxWidth` to the `pos` state (`{ top, left, maxWidth }`) so it is part of the React style prop and is always correctly applied from the first positioned render onward. The `effectiveMaxWidth = min(280, vw - 2*MARGIN)` computation already existed; it now flows into state and the style prop.
  - Changed the single `rAF` to a double nested `rAF` (`outer -> inner`): the outer frame lets React flush the bubble into the DOM and the browser complete an initial layout pass; the inner frame runs `reposition()` after that settled layout, so `getBoundingClientRect()` returns real dimensions.
  - Both cleanup paths (`cancelAnimationFrame(outer)` + `cancelAnimationFrame(inner)`) are covered.
- **Files:** `frontend/src/components/Tooltip.tsx` (state type, `reposition`, open `useEffect`, bubble `style` prop).

### 3. Fix 3 -- scroll-spy stale highlight at page top (FilingRecord.tsx)

- **Root cause:** The `useActiveSection` hook's `IntersectionObserver` callback returned early (`return`) when `visible.length === 0` (no section in the `-84px 0px -60% 0px` band). At `scrollY = 0` the page header pushes SECTION_TAX below the top margin, so the first section never enters the band, and the observer fires with 0 intersecting entries -- leaving `activeId` unchanged from the previous mid-scroll state (stale highlight).
- **Fix:** Introduced a `Set<string> intersecting` to track which sections are currently in the band (updated on each observer callback). When the set is empty, fall back to `ids[0]` (the first section = "Tax Computation"). When non-empty, sort by `boundingClientRect.top` as before and highlight the topmost.
- **Files:** `frontend/src/pages/FilingRecord.tsx` (`useActiveSection` hook).

### Verify

- `bunx tsc --noEmit`: clean (0 errors)
- `bun run build`: green (85 modules, 2.07s, 0 errors)
- `bunx biome check frontend/src`: 1 error (pre-existing `client.ts` format nit, not ours); 0 errors on touched files
