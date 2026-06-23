# PROGRESS

> Append-only log. **PG** adds a dated entry after each task; **QA** records test/build results. Newest at the bottom.
>
> Shared across the team; tag each entry with its lane — **BE** · **FE** · **TD**. Design & decisions → [`cukaipandai-spec.md`](cukaipandai-spec.md); the plan → [`plan.md`](plan.md).

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
