# TEST / QA VERDICTS

> Owned by **QA**. The PM reads the latest verdict at **Gate 2**. Newest at the bottom.

Format:

```
## [DD/MM/YY] — <Task Name>

**Verdict:** Approve | Approve with comments | Reject with reasons

**Findings:**
- `file:line` — [severity] what's wrong → suggested fix

**Smoke test:** <build/test/lint command and result>
```

---

## [23/06/26] — Phase 0 Monorepo Restructure (R-TD-1…4, R-BE-1/2, R-FE-1/2)

**Branch:** `chore/monorepo-restructure` (staged, uncommitted).

**Verdict:** Approve with comments

Both hard gates pass and the restructure is functionally correct. The comments below are tooling-hygiene and plan-fidelity items — none block runtime or break `main`. Recommend approving the commit; the two Major items (M1/M2) are quick follow-ups that can land in this PR or a fast follow.

### Hard gates (both PASS)

- **HG1 — backend tests:** `cd backend && pytest -q` → **40 passed, 1 warning in 1.50s**. (Run in the project `.venv`; the active shell's `.browser-use-env` has no pytest, but the intended dev env passes cleanly.)
- **HG2 — frontend build:** `cd frontend && bun run build` → `tsc -b && vite build` builds clean (44 modules, `dist/` emitted). `bunx tsc --noEmit` → **exit 0, clean**.

### Findings

**Major (should fix; not blocking the move)**

- `package.json:scripts.lint` (`biome check .`) + `biome.json:files.ignore` — [major] The `lint` script and R-TD-1's acceptance command `bunx biome check .` report **41 errors**, so the criterion "runs cleanly" is NOT met. Two causes: (a) `biome.json` `ignore` covers `backend/**`, `node_modules/**`, `frontend/node_modules/**`, `frontend/dist/**` but **not the root `.venv/`** (nor `.claude/`), so biome crawls third-party Python `.venv` JSON/JS files; (b) biome's formatter disagrees with the FE source style. → Fix: add `".venv/**"`, `".claude/**"` (and `"dist/**"`) to `biome.json` `ignore`, or set `"vcs": { "enabled": true, "useIgnoreFile": true }` so biome honors `.gitignore`. Then resolve (b) per the next item.
- `frontend/src/{App.tsx,api/client.ts,pages/*.tsx,main.tsx}` — [major] **prettier AND biome both flag the new FE files.** `bunx prettier --check 'frontend/src/**/*.{ts,tsx}'` warns on 5 files; `biome check` adds `organizeImports`, `format`, plus real lint rules (`main.tsx:6` `noNonNullAssertion`, `AuditDefense.tsx:57` `noArrayIndexKey`). The lint-staged chain runs `biome check --write` THEN `prettier --write` on the same globs — two formatters with different rules (biome `format` vs prettier) will fight on commit. → Fix: pick one formatter as the source of truth for `frontend/**` (the RQ1 duty-split the plan calls for), run it once over the FE files so the tree is clean, and decide whether to keep `noNonNullAssertion`/`noArrayIndexKey` or suppress them.

**Minor (non-blocking comments)**

- `frontend/src/App.tsx:46-48` — [minor] Routes are `/`, `/filing`, `/audit`; plan R-FE-2 specifies `/obligations`, `/filing`, `/audit-defense`. PG self-flagged this. Acceptable for a minimal shell (all 3 consoles route + render), but the Phase-2 FE tasks reference the plan paths — recommend aligning to `/obligations` and `/audit-defense` now to avoid churn later. (Adjudication: acceptable to ship, preferable to fix.)
- `frontend/src/api/client.ts` — [minor] The typed client lives at `src/api/client.ts`; plan text says `src/lib/api.ts`. Content is correct and types mirror `backend/api/schemas.py` + `backend/core/models.py` exactly (SsmProfile/EntityTaxProfile, Obligation, ObligationCalendar, FigureTrace, FormComputation, Citation, DefensePack all match field-for-field; the 3 endpoint paths + request bodies `{ssm}` / `{ssm,line_items}` / `{query,evidence}` match `main.py`). Path/name deviation is cosmetic — note it, no fix required.
- `.env.example` + `client.ts` use `VITE_API_BASE_URL`; plan text says `VITE_API_BASE`. Internally consistent (both files agree), so the client reads the documented var correctly. Note only.
- `.claude/CLAUDE.md` — [minor, known issue confirmed] The appended karpathy block reintroduces a **duplicate top-level `# CLAUDE.md` H1 at line 118** (original H1 at line 1). The blocks are otherwise self-contained (no dangling `@references`). → Fix: downgrade line 118 to a section heading (e.g. `## Karpathy Guidelines`). Cosmetic; harmless to agents.
- `.gitignore:17` — [trivial] Retains `.next/` though Next.js is deleted. Harmless/defensive; leave or drop.
- `docker-compose.yml:build: .` — [confirmed correct] Compose lives at `backend/docker-compose.yml`, so `.` resolves to `backend/` (its own dir) = the Dockerfile's expected context. PG's self-flagged point (2) is correct. Caveat: `docker compose up --build` must be run from `backend/`, consistent with the documented `cd backend` discipline.
- pyproject `[dev]` extra — [confirmed, informational] There is **no `[dev]` extra** and **pytest is not a declared dependency** (`pip install -e ".[dev]"` warns "does not provide the extra 'dev'"). CI correctly uses plain `pip install -e .`. BUT pytest resolves in the dev `.venv` only because it was installed out-of-band — `pip install -e .` alone does NOT pull pytest. On a clean CI runner `pytest -q` would fail with "No module named pytest". → This is a pre-existing gap, not introduced by this PR (the old root `pyproject.toml` had the same shape), so it does not block Phase 0; flag for a follow-up (add pytest to a real `[project.optional-dependencies] dev` and switch CI back to `".[dev]"`).

### Verified clean (no action)

- **No orphan paths:** no top-level `api/ core/ tests/ pyproject.toml Dockerfile docker-compose.yml`; they exist only under `backend/`. `git diff --staged -M` shows all backend files as **renames** (history preserved), not delete+add.
- **No stale Next.js:** all `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, App-Router routes, and 13 vitest specs are deleted; no `NEXT_PUBLIC_*` anywhere.
- **.gitignore:** `git check-ignore -v` resolves `frontend/node_modules`, `.venv`, `backend/.venv` (via `.venv/`), `.env`, and `cukaipandai_core.egg-info` (via `*.egg-info/`) to the root `.gitignore`; `.env.example` is NOT ignored; no `node_modules`/`__pycache__`/`dist`/`.venv`/`.egg-info` staged.
- **CI:** `.github/workflows/ci.yml` test job sets `defaults.run.working-directory: backend` (`pip install -e .` + `pytest -q`); docker-build job sets context to `./backend`. Internally consistent with the Dockerfile (`backend/` context, `COPY pyproject.toml/core/api`, `WORKDIR /app`) and compose (`build: .` in `backend/`). The CWD-relative corpus path `Path("core/fixtures/lawcorpus_seed.json")` resolves in all three (CI/dev/Docker) because each runs from `backend/` or `/app`.
- **Husky/commitlint:** `.husky/commit-msg` = `bunx commitlint --edit "$1"`; `.husky/pre-commit` = `bunx --no lint-staged`; `commitlint.config.js` extends `config-conventional` with `type-enum` = the 8 allowed types. Smoke: `echo "chore: x" | bunx commitlint` passes; `echo "bad msg" | bunx commitlint` rejects (exit 1).
- **Root `CLAUDE.md`:** carries all 4 directives (pm-workflow path + source URL verbatim · PR-first→self-merge via `gh`, Gate-2-gated · read latest PRs+commits via `gh` · plan.md+progress.md shared state, "no task-list.md") and references (does not duplicate) `.claude/CLAUDE.md` + `docs/roles.md`.
- **AGENTS.md:** Codex-usable — names both `CLAUDE.md` (root) and `.claude/CLAUDE.md` in plain prose, not only via the `@CLAUDE.md` include.
- **Plan/progress hygiene:** all Phase 0 boxes ticked (no `- [ ]` remaining in R-\* tasks); `docs/progress.md` has a dated lane-tagged entry (`[23/06/26] — Phase 0 monorepo restructure`) recording the pytest 40-passed and FE build results.
- **Surgical:** no changes outside Phase 0 scope; no Phase 1–3 code touched; no tax figures/citations/assertions altered (pure relocation + new FE shell + new root tooling).

**Smoke test:** `cd backend && pytest -q` → **40 passed** · `cd frontend && bun run build` → clean, `bunx tsc --noEmit` → exit 0 · `commitlint` accept/reject → correct · `biome check .` → **41 errors** (see M1/M2) · `prettier --check frontend/src` → 5 files need formatting (see M2).

---

## [23/06/26] — Phase 0 Re-check (PG fix pass on M1/M2/H1 + routes + [dev] extra)

**Branch:** `chore/monorepo-restructure` (staged, uncommitted). Focused re-verification of the prior "Approve with comments" findings.

**Verdict:** Approve

All five fix items are confirmed resolved, both hard gates pass, and the pre-commit/commit-msg hook chain will pass cleanly. No regressions. One trivial, pre-existing doc-hygiene note remains (non-blocking). Recommend authorizing the commit.

### Fixes verified (5/5 resolved)

- **M1 — biome scoped:** `biome.json` now sets `vcs.useIgnoreFile: true` and `files.include` = `frontend/src/**`, `frontend/vite.config.ts`, `frontend/tsconfig*.json`. `bunx biome check .` → **exit 0, "Checked 11 files, no fixes"** (was 41 errors). `bunx biome check frontend/` → **exit 0**. Verified scoping does NOT skip real FE source: `--verbose` confirms all 6 FE `.ts/.tsx` files (App, api/client, main, 3 pages) plus tokens.css + tsconfig\*.json + vite.config.ts are processed. RESOLVED.
- **M2 — lint-staged split + lint fixes:** three non-overlapping globs in `package.json` — `frontend/**/*.{ts,tsx,js,jsx}`→`biome check --write`, `frontend/**/*.{css,json}`→`biome format --write`, `*.{md,yaml,yml}`→`prettier --write`. Extensions are mutually exclusive → no file matches two globs, no formatter fights. Simulated each glob against staged files: all **exit 0, zero rewrites** on the FE source. `main.tsx:6-7` now null-guards the root element (`if (!root) throw …`) — `noNonNullAssertion` gone. `AuditDefense.tsx` uses `key={c.claim}` — `noArrayIndexKey` gone. RESOLVED.
- **H1 — duplicate H1:** the appended block's `# CLAUDE.md` is downgraded to `## Karpathy Coding Guidelines` (line 118). There is no longer a duplicate `# CLAUDE.md`. RESOLVED. (See minor note below re: a separate `# RTK` H1.)
- **[dev] extra:** `backend/pyproject.toml` now declares `[project.optional-dependencies] dev = ["pytest>=8.0", "httpx>=0.27"]`; CI runs `pip install -e ".[dev]"`. Dry-run `pip install -e ".[dev]"` confirms pip resolves `pytest>=8.0` **as a dependency of the package via the extra** (not just out-of-band) → a clean CI runner will pull pytest. RESOLVED.
- **Routes:** `App.tsx` wires `/`→`<Navigate to="/obligations" replace />`, plus `/obligations`, `/filing`, `/audit-defense`; nav `NavLink`s updated to match. All three canonical plan paths (R-FE-2) present and redirect works. RESOLVED.

### Hard gates (both PASS)

- **HG1 — backend:** `pytest -q` in the project `.venv` → **40 passed, 1 warning in 0.68s**. The 1 warning is a pre-existing Starlette/httpx deprecation, unrelated to this PR.
- **HG2 — frontend:** `bun run build` (`tsc -b && vite build`) → **44 modules, dist/ emitted, exit 0**. `bunx tsc --noEmit` → **exit 0**.

### Commit-hook simulation (will pass cleanly)

- **pre-commit** (`bunx --no lint-staged`): each of the 3 globs run against staged files returns exit 0 with no rewrites — the hook will not fail or dirty the tree.
- **commit-msg** (`bunx commitlint --edit`): `chore: …` sample → **exit 0 (accepted)**; `fixed some stuff` → **exit 1 (rejected: type-empty, subject-empty)**. Gate behaves correctly.

### Staged-tree hygiene

- No `node_modules/`, `.venv/`, `dist/`, `*.egg-info`, or `__pycache__` staged. All staged paths are in Phase-0 scope. Backend relocation remains pure renames (history preserved).

### Remaining note (trivial, non-blocking — NOT a regression)

- `.claude/CLAUDE.md:195` — [trivial] The appended RTK block introduces a second top-level markdown H1 `# RTK (Rust Token Killer)…`. This is a _different_ heading from the H1 finding that was fixed (the duplicate `# CLAUDE.md` is gone). It's a personal/local tooling section; harmless to agents and to tooling (no markdownlint gate in this repo). Optional follow-up: downgrade to `## RTK …` or drop the block from the committed file. Does not block the commit.

**Smoke test:** `biome check .` → exit 0 (11 files) · `biome check frontend/` → exit 0 (10 files) · 3 lint-staged globs → all exit 0, no rewrites · `commitlint` accept/reject → correct · `pytest -q` → 40 passed · `bun run build` + `tsc --noEmit` → clean · `pip install -e ".[dev]" --dry-run` → resolves pytest via extra.

---

## [23/06/26] — uv backend + runbook de-stale + plan cleanup `[DO/TD]`

**Branch:** `chore/uv-backend-and-runbook` (staged, uncommitted). 7 files: `backend/uv.lock` (new), `backend/Dockerfile`, `.github/workflows/ci.yml`, `docs/runbook.md`, `.claude/CLAUDE.md`, `docs/plan.md`, `docs/progress.md`.

**Verdict:** Approve

All hard gates pass on both interpreters, the lock is CI-safe on Python 3.11, pip remains a working fallback, the Docker image builds **and runs** (health OK on 3.11.15), the runbook is accurate, and the plan cleanup preserved every task ID, sub-item, and the Open-Questions block. The PG-raised "3.14-local vs 3.11-CI" concern is **resolved — not a finding** (proof below). Only trivial, pre-existing doc nits remain. Recommend authorizing the commit.

### Hard gates (all PASS)

- **HG1 — uv path (local default 3.14):** `cd backend && uv sync --extra dev` → resolved 51 / checked 50, clean. `uv run python --version` → 3.14.3. `uv run pytest -q` → **40 passed, 1 warning in 2.11s**. (Warning = pre-existing Starlette/httpx deprecation, unrelated.)
- **HG2 — uv path pinned to CI's Python 3.11:** fresh copy, `uv venv --python 3.11 && uv sync --extra dev && uv run pytest -q` → installs from the committed lock on **CPython 3.11.14** → **40 passed, 1 warning in 1.88s**. This is the conclusive CI-equivalence check.
- **HG3 — Docker:** `docker build -t cukaipandai-be-qa ./backend` → success (`sha256:0375ae46…`, matches PG). Ran the image: container Python = **3.11.15**, `GET /health` → `{"status":"ok"}` (so the CWD-relative `core/fixtures/lawcorpus_seed.json` law-corpus loads at `/app`), logs show 0 errors / 0 warnings.
- **HG4 — pip fallback intact:** `pip install -e ".[dev]" --dry-run` → `Would install cukaipandai-core-0.1.0 … pytest …`; the `[dev]` extra resolves (no "does not provide the extra" warning). `pyproject.toml` is unchanged and standard — no uv-specific formats introduced.

### CI Python-version determination (the PG concern — RESOLVED)

The lock was generated locally against CPython 3.14.3, but CI/Docker target 3.11. This does **not** red-line CI:

- `backend/uv.lock:3` declares `requires-python = ">=3.11"` and the lock is **universal** (resolution markers like `python_full_version < '3.13'`, plus cp311 wheels are present, e.g. `websockets-15.0.1-cp311-…`).
- `uv lock --python 3.11 --check` → "Using CPython 3.11.14 / Resolved 51 packages" with **no relock and no error** → the committed lock already satisfies 3.11.
- Empirically, a clean `uv sync` on 3.11.14 (HG2) and the Docker image on 3.11.15 (HG3) both install from this lock and pass all 40 tests.
- CI ordering: `actions/setup-python@v5` (3.11) runs before `astral-sh/setup-uv@v6`, so a 3.11 interpreter is on PATH; uv prefers a PATH interpreter satisfying `requires-python` → CI lands on 3.11. Even if uv picked any other `>=3.11`, the universal lock resolves for all of them.
- `astral-sh/setup-uv@v6` is a real, current tag — plausible and correct.

### Lock / staged-tree hygiene (PASS)

- `git check-ignore backend/uv.lock` → exit 1 (not ignored → committed, correct). `git check-ignore backend/.venv` → ignored (exit 0); `git ls-files backend/.venv` → empty. No `.venv/`, `__pycache__`, `*.egg-info`, `node_modules`, or `dist` staged.

### Docs accuracy (PASS)

- **runbook.md** — all backend commands are under `cd backend` (no root-relative leftovers). Frontend env var `VITE_API_BASE_URL` + `VITE_API_MOCK` match `frontend/src/api/client.ts:5-6` and the root `.env.example`; there is no `frontend/.env.example`, so `cp ../.env.example .env` is correct. All five demo fixture paths exist at the stated `backend/core/fixtures/...` locations. Deploy notes (backend context `backend/`, CI uses uv) are accurate.
- **.claude/CLAUDE.md** — Commands block correctly switched to `cd backend && uv sync --extra dev` / `uv run uvicorn` / `uv run pytest -q`, with the pip fallback noted; Tech-Stack line adds "Package manager: uv (primary)" and drops "(planned)" from Frontend. Root `CLAUDE.md` correctly **not** touched (it is reference-style and carries no command block).
- **plan.md cleanup** — `[DO]` lane added; legend lists all four lanes (BE/FE/DO/TD). Every feature task ID preserved (BE-1…4, FE-1…7, TD-1…5) with acceptance criteria intact; DO-1/DO-2 added. The FE-6→DO-1 split (Vercel deploy) and TD-4→DO-2 split (Render deploy) each moved their sub-item + verify cleanly with no content dropped; TD-4 now references DO-1/DO-2 as deps. Open Questions block intact (RQ1–6 resolved, Q1–5 open). The verbose active Phase-0 section is condensed into a terse `## Done` entry; a `[DECISION]` block (uv + 4 pre-existing PO-locked decisions) was added — all reflect committed reality, none fabricated.
- **progress.md** — dated `[DO/TD]` entry records the uv pytest (40 passed) and Docker (succeeded, sha256) results with `[VERIFIED 23/06/26]` tags.

### Findings (all non-blocking)

- `.claude/CLAUDE.md:60` — [trivial, pre-existing] `docker compose up --build` lacks a `cd backend &&` prefix that the other three commands carry, though `backend/docker-compose.yml` must run from `backend/`. The block header "Run backend commands from the `backend/` directory" covers it contextually; this diff did not introduce the inconsistency. Optional: prefix for symmetry.
- `docs/runbook.md:9` — [trivial] `uv venv && uv sync --extra dev` — `uv sync` creates the venv itself, so `uv venv` is redundant (harmless, not wrong).
- `docs/plan.md` — [informational] Two "Phase 0" headings exist: one in Open Questions (the RQ1–6 resolved-questions log) and one in `## Done` (the PR #1 summary). They serve distinct purposes; the verbose _active-work_ Phase 0 is correctly gone. Not a duplicate to fix.

### Verified clean (no action)

- **Surgical:** nothing outside the uv + docs + plan-cleanup scope changed. No backend source, no tax figures, no citations, no test assertions altered. Dockerfile keeps `WORKDIR /app`, the CWD-relative corpus load, and the `CMD` intact; only the install layer switched pip→uv (+ `uv.lock` copied for reproducibility).

**Smoke test:** `uv sync --extra dev` (3.14) → `uv run pytest -q` → **40 passed** · `uv sync` pinned to 3.11.14 → `pytest -q` → **40 passed** · `docker build ./backend` → success, container on 3.11.15 `/health` → `{"status":"ok"}` · `pip install -e ".[dev]" --dry-run` → resolves pytest via extra · `uv lock --python 3.11 --check` → no relock (lock is 3.11-safe) · `git check-ignore` → uv.lock committed, .venv ignored.

---

## [24/06/26] — Escalation reframed sovereign-by-default; direct-Claude demoted to flagged opt-in `[BE]` `[TD]`

**Branch:** `main` (working tree, uncommitted). 8 files: `backend/api/llm.py`, `backend/tests/api/test_make_llm.py` (new), `.env.example`, `docs/{trd,cukaipandai-spec,plan,progress}.md`, `.claude/CLAUDE.md`.

**Verdict:** Approve with comments

The sovereignty rewire is correct, the tests genuinely assert the residency properties, and no AI-attribution leaked into the diff. Two stale-doc hits remain (one Major in a primary doc, one Minor) — neither breaks runtime nor the prelim's pure-ILMU path, but the Major one contradicts the new framing in a deck-facing doc and should be fixed before the commit.

### Smoke test

- `../.venv/Scripts/pytest tests/api/test_make_llm.py -v` → **4 passed** (uv not on PATH in this env; ran the repo-root `.venv` pytest directly).
- `../.venv/Scripts/pytest -q` (full backend) → **100 passed, 1 warning** (pre-existing Starlette/httpx deprecation, unrelated). No regressions.
- Diff scanned for `co-authored|generated with|claude code|noreply@anthropic|🤖` → **0 matches**.

### Findings by audit area

1. **`_escalation_fallback()` logic — RESOLVED.** Priority order is exactly (1) `LLM_ESCALATION_MODEL` → ILMU OpenAI-compat secondary reusing `primary_key`/`primary_base_url` (`api/llm.py:128-134`); (2) `LLM_ALLOW_DIRECT_ANTHROPIC=="1"` **AND** `ANTHROPIC_API_KEY` → `_AnthropicClient` (`:135-138`); (3) else `None` (`:139`). A bare `ANTHROPIC_API_KEY` without the flag returns `None` (short-circuit `and`), proven green by `test_anthropic_key_alone_does_not_enable_direct_fallback`. `make_llm()` returns a bare `_OpenAICompatClient` (no router) when `fallback` is falsy (`:155`).

2. **`route_info()` honesty — RESOLVED.** ILMU base_url → `sovereign=True` via `"ilmu.ai" in self._base_url` (`:83`); `_AnthropicClient` → hardcoded `sovereign=False` (`:52`). A non-ILMU `LLM_ESCALATION_BASE_URL` (e.g. Gemini) correctly reports `sovereign=False` because the substring check fails — there is no path that claims `sovereign=True` while calling out-of-country. `RoutingLLMClient.route_info()` reports the **last** route taken (`self._last`), so an escalation/failover that actually hit the secondary is reported honestly, not the optimistic primary. Solid.

3. **Edge cases — ISSUE (acceptable, by-design, but flag).** `make_llm()` defaults `LLM_PROVIDER` to `"anthropic"` (`:147`); with no env at all it returns a **direct `_AnthropicClient` (non-sovereign)** regardless of the new opt-in flag — the new flag only gates the _escalation secondary_, never the _primary_. This is acceptable because the committed `.env.example:14` sets `LLM_PROVIDER=openai` and `load_dotenv()` runs on startup, so the deployed default is sovereign; but it is a latent footgun (a missing/empty `.env` silently leaves Malaysia on the primary path, with `route_info` correctly reporting `sovereign=False`). Not introduced by this change and out of the stated scope — flag only. The duplicate-model case (`LLM_ESCALATION_MODEL` == primary model) is harmless: it just builds a second identical ILMU client; no correctness or sovereignty impact.

4. **Doc/code consistency — ISSUE (one Major, one Minor).**
   - `docs/runbook.md:34-41` — **[Major]** the "Environment" section still presents the model layer as **"ILMU-first (sovereign primary), Claude as fallback"** with a two-column "Sovereign (ILMU — primary) | Claude (fallback)" table — exactly the pre-change framing the rewire was meant to retire. No mention of `LLM_ESCALATION_MODEL`, the sovereign-escalation default, or that direct-Claude leaves Malaysia / is `LLM_ALLOW_DIRECT_ANTHROPIC`-gated. This is a deck/demo-facing doc and was not updated in this diff. → Fix: reframe the table to "ILMU primary + sovereign escalation (`LLM_ESCALATION_MODEL`); direct-Claude = flagged non-sovereign opt-in, off by default", matching `trd.md:93` / spec §3.4 line 173.
   - `docs/cukaipandai-spec.md:168-171` — **[Minor]** §3.4's opening sentence still reads "**Claude (Opus 4.8) is the FALLBACK**, in two roles: 1. Failover … 2. Capability escalation". Lines 173/175/177/179 immediately below it _do_ carry the corrected sovereign-by-default framing, so the section self-corrects, but the lead-in is stale and reads as a contradiction. → Fix: change the lead-in to "the secondary is sovereign by default (a stronger ILMU model); direct-Claude is a flagged opt-in," consistent with the paragraph that follows.
   - Everything else is consistent: `trd.md:28/93/124`, spec §3.4 lines 173-179, §9.2 lines 427-436, the two ASCII diagrams (lines 305/324-326), A2 (line 510), `.env.example:19-30`, `plan.md` Q6/BE-5/DECISION lines, and `.claude/CLAUDE.md` all describe (a) sovereign escalation as the default secondary, (b) direct-Claude as off-by-default and leaving Malaysia, (c) the prelim as pure-ILMU with no router. The `demo-video-script.md` "ILMU Claw — fully in-country" line (4:15-5:00) is accurate for the pure-ILMU prelim.

5. **Test coverage — RESOLVED.** All 4 tests assert the sovereignty properties, not just types: `test_escalation_model_wraps_router_staying_on_ilmu` asserts `c._fallback.route_info()["sovereign"] is True`; `test_direct_anthropic_is_optin_and_flagged_nonsovereign` asserts `... is False`; the bare-key test asserts no router is built. One untested branch: `LLM_ESCALATION_BASE_URL` set to a **non-ILMU** host (the Gemini/escalation-leaves-country case in finding 2) is verified by inspection but not by a test. Minor gap; the substring logic is trivially correct. Optional: add a one-liner asserting a non-ilmu escalation base reports `sovereign=False`.

6. **No Claude attribution — RESOLVED.** Working diff and the new test file contain no `Co-Authored-By` / `Generated with Claude` / `noreply@anthropic` / 🤖 text (grep → 0). Hard requirement met.

### Verified clean (no action)

- **Surgical:** the code change is confined to `_escalation_fallback()` (new), `make_llm()` (rewired return), and `_OpenAICompatClient.route_info()` (substring check) plus the new test file. No tax figures, citations, or core math touched. The deterministic `ground_citation` gate still carries the prelim trust demo on pure ILMU.
- **Prelim unaffected:** with no escalation var set, `make_llm()` returns the bare ILMU client; the escalate path is dormant. Pure-ILMU (Q6) holds.

**Return to PM:** Approve with comments — the sovereignty rewire is correct, honest, and fully tested (4 new + 100 total green); no AI attribution. One **Major** stale doc (`runbook.md:34-41` still says "Claude as fallback") and one **Minor** (`cukaipandai-spec.md:168` stale lead-in) contradict the new framing in deck-facing docs and should be fixed pre-commit; the `LLM_PROVIDER` default-anthropic footgun is pre-existing and mitigated by `.env.example`. None block `main`.

---

## [25/06/26] — Phase-2 FE spine (FE-1…FE-5) — mock-first consoles vs the real backend contract

**Branch:** `main` (working tree, uncommitted). Changed: `frontend/src/api/client.ts`, `frontend/src/pages/{ObligationRadar,FilingStudio,AuditDefense}.tsx`, new `frontend/src/components/CitationPanel.tsx`, new `frontend/src/hooks/useEntity.ts`, `docs/{plan,progress}.md`.

**Verdict:** Approve with comments

The FE spine is correct, contract-faithful, and the grounding invariants hold. Every field the FE consumes exists on the real backend response models; the `sovereign`/`active_model` route fields are read ONLY from the two responses that carry them; no clause-IDs leak onto form-c figures; and the fabricated-citation money-shot reproduces both a verified and a rejected citation with visually-distinct stamps. All three gates are green. The comments below are mock-vs-live divergences that are latent until the FE-6 live-swap — none break the mock demo, none block a commit, but two should be tightened before FE-6 so live behavior matches what the mock promises.

### Smoke test (all green — verified this session)

- `cd frontend && bun run build` → **`tsc -b && vite build`, 46 modules transformed, dist/ emitted, exit 0.**
- `cd frontend && bunx tsc --noEmit` → **exit 0, clean.**
- `bunx biome check frontend/src` → **"Checked 9 files, no fixes applied", exit 0.**
- `git status` → only the 3 page files + `client.ts` + the two new dirs (`components/`, `hooks/`) + `docs/` changed. Shared files coherent; no stray edits to `App.tsx`/`tokens.css`/`main.tsx`. Isolation integrity holds.

### Contract alignment (highest priority — verified field-by-field against the REAL backend)

**route_info() carriers — CORRECT.**

- `route_info()` returns exactly `{sovereign: bool, active_model: str}` (`api/llm.py:12-13,31-32,51-52,81-83`) and is spread ONLY onto `/documents/classify` (`main.py:141`) and `/audit-defense` (`main.py:150`). It is **absent** from `/form-c`, `/form-c/start`, `/form-c/resume` (`main.py:127-131,167-172,183`).
- FE honors this exactly: `ClassifyResponse`/`AuditDefenseResponse` carry the fields (`client.ts:119-123`); `FormCResponse`/`FilingStartResponse`/`FilingResumeResponse` do NOT (`client.ts:77-93`). FilingStudio reads `sovereign`/`active_model` only off `classifyResult` (`FilingStudio.tsx:472`), never off `getFormC`/the HITL responses — verified by grep. AuditDefense reads them off the defense response (`AuditDefense.tsx:57,363-366`). **No FE path reads a route/sovereign field off a response that lacks it.**

**FigureTrace grounding invariant — CORRECT (correctness-critical, passes).**

- `FigureTrace` = `{value, inputs, rule_id, config_version}` (`core/models.py:42-46`), faithfully typed (`client.ts:59-64`).
- FilingStudio's `FigureTraceRow`/`ComputationPanel` (`FilingStudio.tsx:114-309`) render ONLY `value`/`rule_id`/`config_version`/`inputs`. **No clause-IDs, no `Citation`, no `clause_ids` are rendered anywhere on the form-c figures** — confirmed by reading the full component. Clause-level citations appear only in AuditDefense via `CitationPanel`. The "render each citation where it actually exists" constraint is honored.

**Citation fields — CORRECT.** `Citation` = `{claim, clause_ids, verified, section?, page_ref?, url?, passage?}` (`core/models.py:63-71`) is typed correctly (`client.ts:95-104`) and consumed defensively in `CitationPanel` (`CitationPanel.tsx:40-124`) — every optional RAG field is null-guarded (`hasProvenance` gate at :41, per-field `&&` guards at :84-119).

**HITL request/response shapes — CORRECT.** `startFiling` posts `{ssm, line_items}` → reads `{thread_id, computation, requires_approval, risk_flags}`; `resumeFiling` posts `{thread_id, approved}` → reads `{approved, computation}` (`client.ts:349-358`). Matches `FormCReq` (`schemas.py:10-13`), `FilingResumeReq` (`schemas.py:20-22`), and `main.py:154,167-172,176,183` exactly. The unknown/finalized `thread_id` → 404 branch (`main.py:180-181`) is handled in the FE (`FilingStudio.tsx:355-356`) without a white-screen.

**RiskFlag — CORRECT.** `{code, message, severity}` (`models.py:74-77`) typed at `client.ts:71-75`, rendered with severity in `RiskFlagList` (`FilingStudio.tsx:71-112`).

**Typed 422 / 502 — CORRECT.** `handleResponse` (`client.ts:299-309`) parses the FastAPI `{detail: [{loc,msg,type}]}` envelope (matches `main.py:92` `e.errors()`) into a typed error with `validationDetail`; other non-OK statuses (incl. the controlled 502 from `/classify` + `/audit-defense`, `main.py:140,149`) throw a plain `Error` surfaced as the friendly error window (`AuditDefense.tsx:168-175`, `FilingStudio.tsx:395-402`). No white-screen on 422/502.

### The trust money-shot — WORKS

- `MOCK_DEFENSE.citations` (`client.ts:262-277`) contains BOTH a `verified:true` citation (with full RAG provenance) AND a `verified:false` fabricated `ITA_s99_ZZ` citation. AuditDefense partitions them (`AuditDefense.tsx:43-44`), renders the rust-coloured "DETERMINISTIC GATE — fabricated citation REJECTED / BLOCKED" callout in fabrication mode (`:130-165`), and the stamps are visually distinct: `.verified-stamp` = denim border + double-notch stamp animation; `.unverified-stamp` = rust-red, no shadow (`tokens.css:930-974`). The deterministic gate this dramatizes is real (`core/citations.py:7-11` → `corpus.exists`), unchanged by RAG (`audit_defense.py:25-26`). Money-shot reproduces faithfully in mock mode.

### Findings

**Critical:** none.

**Major:** none.

**Minor (mock-vs-live divergences — latent until FE-6; fix before/at the live-swap, not blocking now):**

- `frontend/src/api/client.ts:254-261` — [minor] **`MOCK_DEFENSE.items` shape diverges from the real backend.** The mock seeds `items: [{clause_id, text, source}]`, but the real `build_defense` returns `items=[{"contested_item": <str>, "evidence": <list>}]` (`api/agents/audit_defense.py:33`). It renders fine today because AuditDefense iterates defensively over `Object.entries(item)` (`AuditDefense.tsx:254`), so this is not a runtime bug — but a teammate reading the mock will believe `items` carries clause rows when live it carries the contested-item + echoed evidence. → Fix: change the mock `items` to `[{ contested_item: 'Repairs deduction RM4,800', evidence: [['invoice','INV-2025-0042: …']] }]` to match `audit_defense.py:33` so mock and live agree.

- `frontend/src/api/client.ts:361-363` (`classifyTrialBalance`) + `:367-373` (`getAuditDefense`) — [minor] **The mock returns one fixed response regardless of input, so the fabrication path is "always rejected" only because the mock hardcodes the rejected citation — live, a fabricated rejection depends on the model actually emitting an out-of-corpus clause ID.** Live, `build_defense` constrains the model to retrieved/corpus IDs (`audit_defense.py:16-23`) and returns a SINGLE citation (`citations=[cit]`), so a live fabrication query may not yield a `verified=false` row at all (the model is told to cite only valid IDs). The demo-vs-fabrication buttons (`AuditDefense.tsx:30-31`) send different queries, but in mock mode both receive the identical `MOCK_DEFENSE` (both a verified and a rejected citation) — so the "Standard defense query" button also shows a rejected citation in the list (the rejection _callout_ is correctly gated to `activeQuery==='fabrication'`, `:130`, but the citations panel isn't). → Pre-FE-6: confirm the live backend reliably produces the `verified=false` row for the fabrication query (it may need a seeded fabricated-evidence fixture or a dedicated endpoint that forces the planted fake), and consider branching the mock on `query` so the standard query returns only the verified citation. Not a blocker for the mock demo; it IS the single thing most likely to surprise at the live swap, since the money-shot's live reliability isn't proven by this slice.

- `frontend/src/api/client.ts:255-260` — [minor, cosmetic] `MOCK_DEFENSE.items[0]` uses a `clause_id` that mirrors a real corpus shape but is decorative; harmless given the defensive render, folds into the first finding's fix.

**Informational (no action — by design or out of scope):**

- `getFormC`/the one-shot path (`FilingStudio.tsx:360-371`) is retained as a non-interactive fallback alongside the HITL primary, per FQ5. Correct — it wraps the one-shot `{computation, requires_approval}` into the approved-result shape without reading any route field.
- `FilingStudio.tsx:35` `LIABILITY_KEYS`/`UPSTREAM_KEYS` are hardcoded field-name sets for the honest-number IA; any unknown figure falls through to "Additional Fields" (`:283-306`) so an unexpected key from the core won't be dropped. Robust.
- Visual/UX polish (spacing, colour, inline styles vs devkit classes) intentionally NOT raised — owned by the later ui-ux-pro-max pass per the task's non-goals.

### Verified clean (no action)

- **Grounding invariant:** no clause-IDs on form-c figures; clause cites only in AuditDefense. Holds.
- **Isolation:** shared files (`client.ts`, `useEntity.ts`, `CitationPanel.tsx`, `App.tsx`, `tokens.css`) coherent; `useEntity` correctly replaces the divergent page-local `DEMO_SSM` stubs with a single canonical Acme via `getEntity(ACME_TIN)` (FQ4 resolved). Both pages drive the seeded profile.
- **Edge cases:** loading windows, error windows, empty/initial state, the HITL reject branch (`handleApprove(false)`, `FilingStudio.tsx:582`), and the 404 finalized-thread branch all handled. Empty obligation/citation lists guard with `.length` checks.

**Return to PM:** **Approve with comments.** The FE spine is contract-faithful against the real backend — route fields read only from their true carriers, the `FigureTrace` grounding invariant holds (no clause cites on figures), HITL/422/502/404 all handled, and the fabricated-citation money-shot reproduces with distinct verified/rejected stamps. All three gates green: build (46 modules), `tsc --noEmit` clean, biome 0 errors. No Critical/Major findings. Three Minor items are mock-vs-live divergences (the `items` shape; and — most important — the live fabrication-rejection isn't proven by this mock-only slice) to tighten before the FE-6 live swap, not blocking this commit.

---

## [25/06/26] — Deploy-readiness batch (BE-18 inject · FE-6 live-swap parity · Render+Vercel config) `[BE]` `[FE]` `[DO]`

**Branch:** `main` (working tree, uncommitted). 11 modified + 2 new: `backend/{Dockerfile,api/agents/audit_defense.py,api/main.py,api/schemas.py,tests/api/test_audit_defense.py,tests/api/test_audit_defense_endpoint.py,uv.lock}`, `frontend/src/{api/client.ts,pages/AuditDefense.tsx}`, `docs/{plan,runbook}.md`, **new** `frontend/.env.example` + `frontend/vercel.json`.

**Verdict:** Approve

The honesty invariant holds end-to-end, mock↔live parity is achieved (all three prior FE-6 carry-forwards closed), the default audit-defense path is unchanged, and the deploy config is correct and secure. All gates green (105 backend / FE build / tsc / biome) and the Docker image builds with a valid, expanding `$PORT` CMD. No Critical or Major findings. One Minor doc-staleness nit and one Minor shell-form/signals tradeoff to note — neither blocks the commit. Recommend authorizing.

### Honesty invariant (highest priority — VERIFIED, adversarially)

- **The rejected verdict is produced by the REAL deterministic gate, not hardcoded.** `build_defense(..., inject_fabricated=True)` builds the probe `Citation(clause_ids=["ITA-1967-s999-FAKE"])` and runs it through `verify_claim` (`audit_defense.py:46`) → `ground_citation` (`citation_critic.py:13` → `core/citations.py:8-9` → `corpus.exists`). The `verified=false` is **computed**, never assigned.
- **The fake ID is genuinely absent from the corpus.** `lawcorpus_seed.json` has 15 clause IDs; `grep`/`json` confirm `ITA-1967-s999-FAKE` (and `s999`/`FAKE`) appear **0 times**. So `ground_citation` sets `verified=False` and `verify_claim` short-circuits at `:14-15` **before any LLM call** — there is zero chance of a fluke `YES` flipping the verdict. The rejection is deterministic and reproducible. Test `test_fake_clause_id_genuinely_absent_from_corpus` asserts exactly this.
- **FE never hardcodes a false verdict on the standard path.** Whole-tree grep: the ONLY `verified: false` literal in `frontend/src` is `client.ts:266` (`MOCK_DEFENSE_FAKE_CITATION`), included **only** when `injectFabricated` is true — mirroring BE-18. The standard (`demo`) path calls `makeMockDefense(false)` → single verified citation, no rejected row. `AuditDefense.tsx:43-44` partitions on the response's `verified` field (computed), not a constant.

### Mock↔live parity (the point of FE-6 — VERIFIED, all 3 carry-forwards closed)

- **#2 — `items` shape now matches live.** `makeMockDefense` emits `items:[{contested_item, evidence:[['invoice','INV-2025-0042: …']]}]` (`client.ts`), matching `build_defense`'s `items=[{"contested_item": …, "evidence": evidence}]` (`audit_defense.py:49`). The prior misleading `[{clause_id,text,source}]` shape is gone.
- **#3 — mock branches on the inject flag, mirroring BE-18.** The rejected citation appears **only** on the fabrication path (`citations: injectFabricated ? [verified, fake] : [verified]`). The standard query now shows no rejected row in mock — matching live. The fake citation's clause_id (`ITA-1967-s999-FAKE`) and claim string (`(integrity probe — fabricated clause, not a real citation)`) are **byte-for-byte identical** to BE-18.
- **Request body sends `inject_fabricated` only when true.** `...(injectFabricated && { inject_fabricated: true })` (`client.ts`) omits the key on the standard path, matching the backend Pydantic default `inject_fabricated: bool = False` (`schemas.py:16`). No spurious flag on the default path.
- **Wiring:** `AuditDefense.tsx:32` passes `mode === 'fabrication'` as the 4th arg, so the fabrication button → `true`, the standard button → `false`. Correct.

### Default-path regression (VERIFIED byte-for-byte identical)

- With the flag absent/false, `build_defense` returns `citations=[cit]` (single citation) exactly as before BE-18 — the new code is entirely behind `if inject_fabricated:` (`audit_defense.py:41`). `test_inject_fabricated_false_is_unchanged` (unit) + `test_inject_fabricated_endpoint_no_flag_single_citation` (endpoint) both assert exactly one citation, verified=true, and no fake ID present.
- The tests assert the **gate produced** the verdict, not just a shape: `test_inject_fabricated_true_appends_rejected_probe` asserts `fake_cits[0].verified is False` AND `any(c.verified is True for c in real_cits)`; the endpoint twin asserts the same over JSON. Genuine gate verification, not a tautology.

### Deploy config correctness (VERIFIED)

- **Dockerfile `$PORT` expands.** CMD is **shell form** (`CMD uvicorn … --port ${PORT:-8000}`, no JSON array), so Docker runs it via `/bin/sh -c` and the variable expands at runtime. Proven: `PORT=9999 sh -c 'echo --port ${PORT:-8000}'` → `--port 9999`; unset → `--port 8000`. `docker build ./backend` → **success** (`sha256:b8982353…`), exit 0. The exec/JSON form would NOT have expanded `$PORT` — shell form is correct and required here.
- **vercel.json rewrite is correct.** `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}` is the canonical Vercel SPA pattern. Vercel's filesystem handler serves real files (`/assets/*.js`, `/assets/*.css`) **before** evaluating rewrites, so the built asset bundle resolves; deep links (`/filing`, `/audit-defense`, `/obligations`) fall through to `/index.html` so client-side routing works on hard refresh.
- **Runbook env tables correct + complete.** `LLM_PROVIDER=openai`, base/key/model present; escalation + direct-Claude left unset (pure-ILMU prelim); `CORS_ORIGINS` explicitly says **"must include the Vercel prod URL once known; exact-match, no wildcards (credentials are enabled)"**; `DATABASE_URL` **unset = fixtures fallback** documented; `/health` health-check path documented; single-worker MemorySaver constraint + free-tier cold-start pre-warm noted.

### CORS (VERIFIED — env-driven, secure)

- `main.py:42-46` reads `os.getenv("CORS_ORIGINS", os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"))`, comma-split, whitespace-trimmed — the human can add the Vercel origin via env with **no code change**. The runbook (4a table + §4b CORS note) instructs exactly that and warns that rotating preview URLs aren't covered by exact-match CORS (demo from prod). No wildcard is hardcoded.

### Findings

**Critical:** none. **Major:** none.

**Minor (non-blocking):**

- `docs/runbook.md:10` — [minor, doc staleness] The backend run step still says `uv run pytest -q   # expect: 40 passed`, but the suite is now **105 passed** (4 new audit-defense tests landed in this batch + prior growth). → Fix: change `40 passed` to `105 passed`. Cosmetic; does not affect runtime or deploy.
- `backend/Dockerfile:17` — [minor, accepted tradeoff — note only] The shell-form CMD (required for `${PORT:-8000}` expansion) triggers Docker's `JSONArgsRecommended` warning and means uvicorn runs as a child of `/bin/sh`, not PID 1, so it won't receive SIGTERM directly on container stop. Acceptable on Render free tier (single instance, MemorySaver has no durable shutdown state to flush; platform force-kills after grace). The only alternatives that keep `$PORT` are an exec-form `["sh","-c","uvicorn … ${PORT:-8000}"]` or `ENV PORT` defaulting — not worth the churn for the prelim. Leave as-is; revisit if graceful shutdown matters post-BE-15.

### Plan-fidelity note (not a finding)

- FE-6 checkboxes at `plan.md:260-264` remain `- [ ]`. This is **correct** — those bullets are live-only verification steps (point the client at the live Render URL, walk all three consoles end-to-end against live, prove the live `verified=false` row) that cannot be ticked until DO-2/DO-1 deploy. The two QA carry-forward sub-items that ARE agent-doable now (#2 items shape, #3 branch-on-query) are implemented and verified above; the deploy-gated remainder stays open by design. This batch is deploy-**readiness**, not the live swap itself.

### Verified clean (no action)

- **Surgical:** changes confined to the inject opt-in (BE), the mock refactor + 4th arg (FE), the Dockerfile CMD line, two new config files, and docs. No tax figures, citations, core math, or the deterministic gate touched. `thread_provenance`/RAG path unchanged.
- **No AI attribution:** `git diff HEAD | grep -iE 'co-authored|generated with|claude code|noreply@anthropic|🤖'` → 0 matches.

**Smoke test:** `cd backend && uv run pytest -q` → **105 passed, 1 warning** (pre-existing Starlette/httpx deprecation) · `cd frontend && bun run build` → **46 modules, dist/ emitted, exit 0** · `bunx tsc --noEmit` → **exit 0** · `bunx biome check frontend/src` → **9 files, 0 errors** · `docker build ./backend` → **success (sha256:b8982353…), exit 0** · shell `${PORT:-8000}` expansion → 9999 / 8000 as expected · corpus check → `ITA-1967-s999-FAKE` absent (0/15 ids) · FE `verified:false` literals → exactly 1 (the gated fake mock).

**Return to PM:** **Approve.** The honesty invariant is airtight — the rejected verdict is computed by the real `ground_citation` gate against a fake ID genuinely absent from the 15-clause corpus (short-circuits before any LLM call), and the FE's lone `verified:false` literal is gated behind the inject flag, mirroring BE-18 byte-for-byte. Mock↔live parity is achieved (all 3 FE-6 carry-forwards closed: `items` shape, inject-branched mock, flag-only-when-true body); the default path is unchanged (single verified citation, asserted by tests). Deploy config is correct and secure: shell-form Dockerfile CMD expands `$PORT` (build verified), vercel.json serves assets before the SPA catch-all, CORS is env-driven exact-match with credentials, and the runbook env tables are complete. All gates green (105 / build / tsc / biome / docker). Two Minor non-blockers: runbook says "40 passed" (now 105) and the shell-form CMD's PID-1/SIGTERM tradeoff (accepted for the prelim). No Critical/Major. Ready for Gate-2 commit authorization.

---

## [25/06/26] — DO-5: Gated CI/CD deploy pipeline (`deploy.yml`) `[DO]`

**Verdict:** Approve

**Scope:** Static infra/YAML review of `.github/workflows/deploy.yml` (replacing `ci.yml`), plus runbook §4 / plan DO-5 / progress alignment. Actual deploy not exercisable here (no secrets) — reviewed statically per the brief.

**Required-behavior verification (all PASS):**

1. **Test gate** (lines 13–42) — PASS. `test` job runs backend (`uv sync --extra dev` L25 → `uv run pytest -q` L28, `working-directory: backend`) AND frontend (`bun install --frozen-lockfile` L34 → `bunx tsc --noEmit` L37 → `bun run build` L40, all `working-directory: frontend`; `bunx biome check frontend/src` L42 at repo root where `biome.json` lives). All are sequential steps in one job, so any non-zero exit fails the whole job and blocks every downstream `needs: test` job. Frontend failure genuinely fails the job (verified `biome.json` resolves at root, `bun.lock` present for `--frozen-lockfile`).
2. **Deploy gating** (L52–55, 67–70) — PASS. `deploy-backend` (`needs: [test, docker-build]`, L54) and `deploy-frontend` (`needs: test`, L69) each carry `if: github.ref == 'refs/heads/main' && github.event_name == 'push'` (L55, L70). On any `pull_request` event (incl. fork PRs) `github.event_name == 'push'` is false → both jobs are SKIPPED, never queued. Forks/PRs cannot trigger a deploy and need no secrets. **This is the failure mode that matters and it is correctly closed.**
3. **Graceful secret-absence (critical)** — PASS, no red-on-empty path exists.
   - `deploy-backend` (L57–65): `HOOK` from `secrets.RENDER_DEPLOY_HOOK_URL` via step `env:`; `[ -z "$HOOK" ]` → `::warning::` + `exit 0` (green); else `curl -fsS -X POST "$HOOK"`. Empty secret → exit 0.
   - `deploy-frontend` (L74–110): check step writes `HAS_VERCEL=0|1` to `$GITHUB_ENV` (L80/L82) and itself always exits 0; the install/pull/build/deploy steps each carry `if: env.HAS_VERCEL == '1'` (L85/88/96/104) → all skipped when `VERCEL_TOKEN` empty → job green.
   - Correctly uses the **env-var / step-check** pattern, NOT `if: secrets.X != ''` (which GitHub disallows at job/step `if:`). Confirmed no job-level `if:` references `secrets.*`.
4. **Least privilege** (L9–10) — PASS. Top-level `permissions: contents: read`.
5. **Secret hygiene** — PASS. No secret VALUES in the workflow; Render hook and Vercel token referenced only as `${{ secrets.RENDER_DEPLOY_HOOK_URL }}` / `${{ secrets.VERCEL_TOKEN }}`. Vercel org/project IDs are NOT in the workflow at all (only `${{ secrets.VERCEL_ORG_ID/PROJECT_ID }}`); the literal IDs appear only in `runbook.md` L89–90, flagged there as non-sensitive — acceptable.
6. **Deploy-command correctness** — PASS. `deploy-frontend` runs `vercel pull --yes --environment=production` (L90) → `vercel build --prod` (L98) → `vercel deploy --prebuilt --prod` (L106) from `working-directory: frontend`, with `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID`/`VERCEL_TOKEN` in each step `env:` (L91-94, 99-102, 107-110). `--token=$VERCEL_TOKEN` shell-expands correctly because `VERCEL_TOKEN` is in the same step's `env:`. `deploy-backend` curls the hook with `-fsS` (fails job on HTTP error, as runbook §4 promises). No flag/path errors that would break a real run.

**Also-verified:**

- YAML parses: `python3 -c "import yaml; yaml.safe_load(...)"` → OK.
- `ci.yml` deleted: `.github/workflows/` contains only `deploy.yml`; `git status` shows `D .github/workflows/ci.yml`. No duplicate test workflow.
- Frontend builds: `cd frontend && bun run build` → 46 modules, dist/ emitted, exit 0.
- Action refs sane: `actions/checkout@v4`, `actions/setup-python@v5`, `astral-sh/setup-uv@v6`, `oven-sh/setup-bun@v2`, `actions/setup-node@v4` — all real, current major tags.
- New untracked `frontend/.gitignore` adds `.vercel` (the dir `vercel pull` creates) — correct, keeps deploy artifacts out of git.
- Docs aligned: runbook §4 lists all 4 secrets + sources + the Render auto-deploy cutover note + live URLs; plan DO-5 acceptance criteria match the workflow; progress entry accurate.

**Findings:**

- `.github/workflows/deploy.yml:90,98,106` — [Minor / optional] `--token=$VERCEL_TOKEN` is redundant given `VERCEL_TOKEN` is already in each step's `env:` (the Vercel CLI reads it automatically). Harmless and works; could drop the flag for tidiness. Not blocking.
- `.github/workflows/deploy.yml:44–50` — [Minor / informational] `docker-build` only smoke-builds the image; it does not run the container or `/health`. Matches the documented intent ("smoke") and DO-3 owns live smoke — noting scope, not a defect.
- No Critical, no Major.

**Smoke test:** `yaml.safe_load(deploy.yml)` → OK · `cd frontend && bun run build` → 46 modules, exit 0 · `bunx tsc --noEmit` → exit 0 · `bunx biome check frontend/src` → 9 files, 0 errors · `ci.yml` absent (only `deploy.yml` in workflows dir) · action refs all valid major tags.

**Return to PM:** **Approve.** The two failure modes that matter are both correctly closed: (1) deploy jobs are guarded by `github.ref == 'refs/heads/main' && github.event_name == 'push'`, so fork/PR events skip them entirely and need no secrets; (2) with secrets unset both deploy jobs end GREEN — `deploy-backend` warns + `exit 0` on empty `$HOOK`, `deploy-frontend` uses the legal `HAS_VERCEL` env-var/step-check pattern (not the disallowed `if: secrets.X != ''`) so every Vercel step is skipped. `permissions: contents: read`, no secret values in YAML (IDs live only in the runbook, flagged non-sensitive), correct `vercel pull→build→deploy --prebuilt --prod` chain, valid action refs, `ci.yml` removed, YAML parses, frontend green. Only two optional Minors (redundant `--token` flag; docker-build is build-only by design). The remaining human-gated steps (add 4 secrets, confirm first green run, turn off Render native auto-deploy) are correctly left unticked. Ready for Gate-2 commit authorization.

---

## [25/06/26] — FE-8: seed personas + DEMO MODE banner + 2 backend entity fixtures `[FE]` `[BE]`

**Branch:** `main` (working tree, uncommitted). 9 modified + 4 new: `backend/{api/main.py,tests/api/test_entity_endpoint.py,uv.lock}`, **new** `backend/core/fixtures/{entity_sinar,entity_selera}.json`; `frontend/src/{App.tsx,api/client.ts,hooks/useEntity.ts,pages/FilingStudio.tsx}`, **new** `frontend/src/{personas.ts,PersonaContext.tsx}`; `docs/{plan,progress}.md`.

**Verdict:** Approve with comments

Persona↔fixture coherence is exact, the picker drives all three consoles, mock parity is complete, and all gates are green (107 backend / tsc / build / biome). No Critical or Major findings. Two Minor items: (1) the audit-defense console doesn't clear a stale defense pack when you switch persona, so its header briefly shows the new TIN above the prior persona's pack; (2) Acme and Selera derive the _same_ obligation calendar (same types and — sharing basis dates — same due dates), so only Sinar is visibly distinct. Neither blocks a commit. Recommend authorizing.

### Persona↔ssm↔fixture coherence (highest priority — VERIFIED field-by-field, exact)

Cross-checked `personas.ts` ssm, the backend fixtures, `client.ts` `ACME_SSM`/`MOCK_ENTITIES`, all field-by-field. **All three agree on every compute/obligation-driving field:**

- **Acme** `C2581234509`: `personas.ts` reuses `ACME_SSM`; `ACME_SSM` == `entity_acme.json` == `MOCK_ENTITIES[ACME_TIN]` (sdn_bhd · msic 46900 · gross 5,000,000 · emp 12 · sst true · BP 2025-01-01→12-31 · comm 2018-03-01). Match.
- **Sinar Digital** `C7654321098`: `personas.ts:28-39` == `entity_sinar.json` == `MOCK_ENTITIES.C7654321098` (sdn_bhd · msic 62010 · paid_up 100,000 · gross 380,000 · emp 3 · **sst false** · BP 2025 · comm 2022-04-01). Match.
- **Selera Kita** `C3219876540`: `personas.ts:48-58` == `entity_selera.json` == `MOCK_ENTITIES.C3219876540` (sdn_bhd · msic 56101 · paid_up 500,000 · gross 2,500,000 · **emp 45** · **sst true** · BP 2025 · comm 2019-09-01). Match.

**Header↔calendar cannot diverge — stronger than the spec asks.** Both consoles build the obligations/form-c `ssm` from the _fetched_ `EntityTaxProfile` (the same object that renders the header), not from the `personas.ts` ssm: `ObligationRadar.tsx:12-23` spreads `entity.*` into the `getObligations` body, and `FilingStudio` uses `buildSsm(entity)` (`:342,369`). The `personas.ts` `ssm` field only seeds `DEFAULT_PERSONA`/the mock store; live compute reads the GET response. So a persona's header (GET `/entities/{tin}`) and its calendar/form-c (POST with `ssm`) are guaranteed to tell one story. No mismatch found.

### Personas drive different calendars (VERIFIED against `derive_obligations` + `ya_2026.yaml`)

`derive_obligations` (`core/obligations.py`) emits: C + CP204 always; einvoice if `gross_income >= 1,000,000` (lowest `einvoice_phases.min_turnover`, `ya_2026.yaml:26`); SST-02 if `sst_registered`; CP39 if `employee_count > 0`. Resulting calendars:

- **Sinar** (gross 380k < 1m, sst false, emp 3): C · CP204 · CP39 → **3 obligations, no einvoice, no SST**. Visibly distinct. ✅
- **Acme** (gross 5m, sst true, emp 12): C · CP204 · einvoice · SST · CP39 → **5 obligations**.
- **Selera** (gross 2.5m, sst true, emp 45): C · CP204 · einvoice · SST · CP39 → **5 obligations**.

The demo's variation lands (Sinar is clearly different), but **Acme and Selera produce an identical obligation set** — same five types, and because both share `basis_period_start/end = 2025-01-01/12-31`, the due dates are identical too (einvoice/CP39 → basis*start; C → form_c_deadline(basis_end); SST → basis_end). See Minor M2 below — the demo would read more strongly if Selera's calendar differed from Acme's beyond gross-income/employee-count magnitude (which don't change the obligation \_lines*).

### Active-persona wiring (VERIFIED — all three consoles switch; no residual ACME\_)

- `App.tsx` wraps the tree in `ActivePersonaProvider` and renders `<PersonaPicker>` (a `<select>` over `PERSONAS` keyed on tin, `:21-49`) in the topbar; switching calls `setPersona`.
- `useEntity()` (`hooks/useEntity.ts`) resolves `tin ?? persona.tin` and re-fetches in a `useEffect` keyed on `resolvedTin` — so the picker change re-runs the entity fetch.
- **ObligationRadar** — `useEntity()` → re-fetches obligations in a `useEffect` keyed on `entity` (`:10-26`); header shows `entity?.tin`. Switches. ✅
- **FilingStudio** — `useEntity()` + `useActivePersona()`; a `useEffect` keyed on `persona.tin` (`:316-321`) re-seeds `rawText` from `persona.demoRawText` and clears classify/lineItems/phase; compute uses `buildSsm(entity)`. Switches and resets cleanly. ✅
- **AuditDefense** — `useEntity()`; request uses `entity.tin`, header shows `entity?.tin` (`:32,50`). Switches. ✅ (but see M1 — no clear-on-switch for the result pack).
- **Grep for residual `ACME_*` in `pages/`** → **zero hits.** The only `ACME_*`/`MOCK_ENTITY` references are in `client.ts` (the Acme persona's own data + `MOCK_ENTITIES[ACME_TIN]`). No page hardcodes Acme.

### Mock parity (VERIFIED)

- `MOCK_ENTITIES` (`client.ts:332-358`) serves all 3 TINs; `getEntity` returns the keyed profile in mock mode and throws `404` for an unknown TIN (`:362-365`), matching the live 404 (`main.py:116-117`). The old single-Acme `getEntity` that threw for non-Acme is gone.
- The three mock entity objects are **byte-identical** to the backend fixtures (checked field-by-field above), so a `VITE_API_MOCK=1` run drives the picker for all personas with the same data the live backend would return.

### Banner + no regressions (VERIFIED)

- `DemoModeBanner` (`App.tsx:51-68`) returns `null` unless `import.meta.env.VITE_DEMO_MODE === '1'` — strict `=== '1'`, so absent/`'0'`/`'true'` all hide it. When hidden it renders nothing (no empty wrapper), so layout is unaffected. When shown it's a single mustard strip above the topbar.
- FE-6 carry-forward intact: the AuditDefense fabrication path is untouched — `getAuditDefense(entity.tin, …, mode==='fabrication')` still flows to `makeMockDefense(true)`/the live `inject_fabricated` body; the `verified=false` row remains gated behind the inject flag (`client.ts:277-279`). No change to the honesty path.

### Backend (VERIFIED)

- The 2 new fixtures parse as valid `EntityTaxProfile`: `GET /entities/{tin}` constructs `EntityTaxProfile(**data)` (`main.py:118`) and the 2 new endpoint tests (`test_get_entity_sinar`, `test_get_entity_selera`) pass — a malformed fixture would 500/raise. `_ENTITIES` loads all three via a dict-comp keyed on `tin` (`main.py:59-66`).
- Unknown TIN still 404s (`test_get_entity_unknown_tin_404` green). Existing tests unaffected — full suite **107 passed**.

### Findings

**Critical:** none. **Major:** none.

**Minor:**

- `frontend/src/pages/AuditDefense.tsx:13-44` — [Minor] **No clear-on-persona-switch for the defense result.** `data`/`activeQuery` are page-local state with no `useEffect` keyed on `entity`/persona (unlike FilingStudio's `:316-321` reset and ObligationRadar's `entity`-keyed refetch). After you run a defense for one persona then switch the picker, the header `page-kicker` updates to the new TIN (`:50`) while the previously-rendered defense pack (citations/exposure/items) stays on screen until the user clicks a query button again — a brief header-vs-body contradiction. Demo impact is small because the mock/demo defense content is fixed to Acme's "RM4,800 repairs" regardless of persona, but it's the one console that doesn't track the picker for its _body_. → Fix: add `useEffect(() => { setData(null); setActiveQuery(null); setError(null) }, [entity?.tin])` so the pack clears when the persona changes.
- `core/obligations.py` + `frontend/src/personas.ts:45-65` — [Minor] **Acme and Selera derive an identical obligation calendar.** Both clear the RM1m einvoice threshold, are `sst_registered`, and have `employee_count > 0`, and they share basis-period dates — so `derive_obligations` emits the same five obligation lines with the same due dates for both. Only Sinar is visibly distinct (drops einvoice + SST). The 45-vs-12 employee gap and 2.5m-vs-5m gross gap don't change the _lines_ the radar renders (the rules are boolean on `>0` / `>=1m`). Not a bug — the seeded values are internally coherent — but the demo's "three different calendars" value is really "two identical + one different." → Optional: give Selera a sub-RM1m-but-SST-registered or sub-threshold profile, or pick basis dates that shift a due date, so its radar reads differently from Acme's. Folds into a future FE/data tweak; not blocking.

**Informational (no action):**

- `personas.ts:5,19` reuses the exported `ACME_SSM`/`ACME_TIN` from `client.ts` for the Acme persona rather than re-literalling the values — good (single source of truth; can't drift from the mock).
- `FilingStudio.tsx:315` carries a `biome-ignore lint/correctness/useExhaustiveDependencies` on the reset effect (keyed on `persona.tin`, intentionally omitting the setters) — legitimate use; biome passes clean.
- Visual polish of the picker/banner intentionally NOT raised (owned by the queued ui-ux-pro-max pass, per the task non-goals). FE not-yet-redeployed and per-persona form-c numbers differing from Acme's RM31,000 also out of scope per the brief.
- No AI attribution in the diff (`git diff HEAD | grep -iE 'co-authored|generated with|claude code|noreply@anthropic|🤖'` → 0 matches).

**Smoke test:** `cd backend && uv run pytest -q` → **107 passed, 1 warning** (pre-existing Starlette/httpx deprecation) · `cd frontend && bunx tsc --noEmit` → **exit 0** · `bun run build` → **48 modules, dist/ emitted, exit 0** · `bunx biome check frontend/src` (from root) → **11 files, 0 errors** · persona↔fixture cross-check → exact on all compute fields · `grep ACME_ pages/` → 0 hits · `derive_obligations` calendars → Sinar 3 / Acme 5 / Selera 5 (Acme==Selera).

**Return to PM:** **Approve with comments.** Persona↔fixture coherence is exact across `personas.ts`, the two new backend fixtures, and `MOCK_ENTITIES` — and the consoles build their obligations/form-c `ssm` from the _fetched_ entity, so a persona's header can never contradict its calendar. The picker drives all three consoles (no residual `ACME_*` in any page), mock mode serves all 3 TINs with 404 parity, the DEMO banner is strictly gated on `VITE_DEMO_MODE==='1'`, and the FE-6 fabrication path is untouched. All gates green (107 / tsc / build / biome). Two Minor non-blockers: AuditDefense doesn't clear a stale defense pack on persona switch (header updates, body doesn't); and Acme & Selera yield identical obligation calendars (only Sinar is distinct) so the "three different calendars" demo value is really two-plus-one. Ready for Gate-2 commit authorization.

---

## [25/06/26] — Redesign Wave 1 (RW-1…RW-6: app shell · drawer · footer · LogoMark · dashboard hub · theme toggle · 404)

**Branch:** working tree vs `main` (uncommitted). Diff surface: `git diff main --stat -- frontend/` → 4 modified (`App.tsx` +11/−103, the 3 consoles +2/−2 each) + 5 new files (`layouts/AppShell.tsx`, `hooks/useTheme.ts`, `components/icons.tsx`, `pages/Dashboard.tsx`, `pages/NotFound.tsx`).

**Verdict:** Approve

Clean, surgical, fully non-regressive. The headline risks — console behavior drift (#1) and a forked persona state (#2) — are both confirmed _not_ present. All gates green. No Critical/Major/Minor findings; two informational notes only.

### #1 — Console non-regression (PASS, highest priority)

`git diff main --unified=0` on `ObligationRadar/FilingStudio/AuditDefense.tsx` shows **exactly 2 changed lines each**, and they are _only_ the wrapper swap:

- `ObligationRadar.tsx:31` / `:132` — `<div className="app-shell">` → `<>` … `</div>` → `</>`
- `FilingStudio.tsx:394` / `:634` — same
- `AuditDefense.tsx:55` / `:435` — same

No logic, data-fetching, `useEntity`/`PersonaContext`, HITL flow (classify→start→approve→resume), `CitationPanel`/`SovereignBadge`/`VerifiedBadge`, or BE-18 fabrication-rejection code is touched anywhere in the three files. The `app-shell` class is not lost — it moves to a single owner, `<main className="app-shell">` in `AppShell.tsx:185`, so page layout/padding is preserved and double-wrapping is avoided. The consoles now render a Fragment, which is correct under the `<Outlet/>`.

### #2 — PersonaContext single-source (PASS)

No forked persona state. `App.tsx:12` still wraps the tree in `<ActivePersonaProvider>`; the new topbar entity-switcher (`AppShell.tsx:126-150`) reads `const { persona, setPersona } = useActivePersona()` (`:37`) and calls `setPersona(next)` (`:130`) against the _same_ `PersonaContext.tsx` provider (`setPersona` from `useState`, `PersonaContext.tsx:18-19`). `Dashboard.tsx:33` and the profile popover (`AppShell.tsx:167`) consume the same `useActivePersona().persona`. The old inline `PersonaPicker` was deleted from `App.tsx` (net −103 lines) — not duplicated. Switching the entity drives all three consoles through the one context, identical to pre-wave behavior.

### #3 — Routing (PASS)

`App.tsx:14-22`: a single layout route `<Route element={<AppShell/>}>` with `index → <Dashboard/>` (so `/` is the hub; the old `/`→`/obligations` redirect is gone, as intended), `/obligations`, `/filing`, `/audit-defense`, and `path="*" → <NotFound/>` — all children render under the shell's `<Outlet/>` (`AppShell.tsx:186`), so a bad URL hits the **in-shell** 404 (verified: NotFound sits inside the same layout route). `VITE_DEMO_MODE` banner (`AppShell.tsx:13-30`, gated on `=== '1'`) and `VITE_API_MOCK` MOCK chip (`:100-112`, gated on `=== '1'`) are carried verbatim from the old `App.tsx` into the new shell and render in-place.

### #4 — Theme toggle (PASS)

`useTheme.ts` sets/removes `data-theme="dark"` on `document.documentElement` (`:21-25`), which matches the canonical selector `[data-theme="dark"]` in `tokens.css:35` exactly. Persistence via `localStorage['cukaipandai-theme']` (`:45`); initial state reads stored→system (`:17`). First-paint safe for this Vite SPA: `localStorage`/`matchMedia` are accessed inside `useState` initializers and effects that only run client-side (no SSR). System-preference listener is correctly gated off once the user has an explicit stored choice (`:28-41`). No literal colors in the new components except `Dashboard.tsx:61` `rgba(0,0,0,0.22)` — a hover _box-shadow_ (not a fg/bg color), theme-agnostic by design and matching the existing `--shadow` idiom; does not break dark mode. Informational only.

### #5 — Build hygiene (PASS)

`App.tsx` has zero orphaned imports/dead code — `NavLink`/`Navigate`/`useActivePersona`/`PERSONAS`/`navStyle`/`isMock`/`isDemoMode` all moved to `AppShell.tsx` where they're used; `App.tsx` imports only what it references. `tokens.css` is **unchanged** vs `main` (drawer/footer/topbar/popover classes already existed on `main`; `git diff main -- frontend/src/styles/tokens.css` is empty). All AppShell-referenced classes resolve in `tokens.css`.

### Findings

None blocking.

**Informational (no action):**

- `Dashboard.tsx:61` — `rgba(0,0,0,0.22)` literal in an inline hover `boxShadow`. Theme-agnostic (a translucent drop-shadow, not a themed color), so it does not break dark mode; matches the existing shadow convention. No fix required.
- `icons.tsx:9` carries a `biome-ignore lint/a11y/noSvgWithoutTitle` justified by the `aria-hidden` parent span — legitimate; biome passes clean.

**Smoke test:** `cd frontend && bunx tsc --noEmit` → **exit 0** · `bun run build` (`tsc -b && vite build`) → **53 modules transformed, dist/ emitted, exit 0** · `bunx biome check frontend/src` (from repo root) → **16 files checked, 0 errors** · console diff audit (`git diff main --unified=0`) → **2 wrapper-only lines per console, no functional change** · `data-theme` selector parity → `useTheme` writes `data-theme="dark"`, `tokens.css:35` reads it.

**Return to PM:** **Approve.** Wave 1 is surgical and non-regressive — the two highest-risk checks pass cleanly: each console changed _exactly_ 2 lines (outer `app-shell` wrapper → Fragment, no logic/HITL/citation/fabrication code touched), and the new topbar entity-switcher writes to the _same_ `ActivePersonaProvider`/`setPersona` (no forked persona state). Routing is correct (`/`→Dashboard hub, consoles under `<Outlet/>`, in-shell 404), the theme toggle's `data-theme="dark"` matches `tokens.css`, DEMO/MOCK gating is carried over verbatim, `App.tsx` has no orphaned imports, and `tokens.css` is untouched. All gates green (tsc 0 / build 53-modules / biome 0). No Critical/Major/Minor findings — ready for Gate-2 commit authorization.

---

## [25/06/26] — Wave 2 — Dashboard hub depth (Upcoming Deadlines · Entity Snapshot · Trust strip) `[FE]`

**Branch:** `main` (working tree, uncommitted). Changed: `frontend/src/pages/Dashboard.tsx` (+381), `frontend/src/api/client.ts` (per-persona mock obligations, mock-only). `git diff main --stat -- frontend/` confirms **exactly 2 files** — no sprawl.

**Verdict:** Approve

The hub deepens cleanly and non-regressively. The greeting + 3 action cards are unchanged; the new panels both trace their dynamic data to `getObligations`/`getEntity` (no fabricated activity/timestamps); the live request path is untouched (mock change is fully gated behind `MOCK_MODE`); the countdown math is correct around every boundary; persona switch re-fetches both panels; and no literal colors were introduced. All three gates green. No Critical/Major/Minor findings — only two informational notes below.

### Smoke test (all green — this session)

- `cd frontend && bunx tsc --noEmit` → **exit 0, clean.**
- `cd frontend && bun run build` (`tsc -b && vite build`) → **53 modules transformed, dist/ emitted, exit 0.**
- `bunx biome check frontend/src` (from repo root) → **"Checked 16 files, no fixes applied", exit 0.**
- `git diff main --stat -- frontend/` → **2 files** (`Dashboard.tsx`, `api/client.ts`) only. Surgical.

### Review focus — all PASS

1. **Non-regression / live path untouched — PASS.** `getObligations` (`client.ts:451-454`) is unchanged on the live branch: `if (MOCK_MODE) return MOCK_OBLIGATIONS_BY_TIN[tin] ?? MOCK_OBLIGATIONS` else `post('/entities/${tin}/obligations', { ssm })`. `MOCK_MODE = import.meta.env.VITE_API_MOCK === '1'` (`client.ts:6`); with the flag off, the mock lookup is never reached and the real POST (body `{ ssm }`, matching `main.py`) is identical to before. The mock change is **mock-only and did not leak into live behavior.** Greeting (`Dashboard.tsx:28-33,399`), the 3 action cards (`:404-460`, routes `/obligations`,`/filing`,`/audit-defense`), and persona wiring (`useActivePersona`, `:394`) are intact — the cards block is unchanged except a `{/* Action cards */}` comment.

2. **Countdown correctness — PASS (no off-by-one).** `countdown()` (`:36-48`) normalizes both `today` (`new Date()`) and `due` to local midnight via `setHours(0,0,0,0)`, then `diffDays = Math.round((due - today) / 86_400_000)`. Boundaries: `< 0` → "Xd overdue" + `overdue:true`; `=== 0` → "Due today"; `=== 1` → "Due tomorrow"; else "in Xd". Midnight-aligning both ends before differencing means no fractional-day off-by-one mislabels today/tomorrow; `Math.round` absorbs any DST ±1h skew. Colour mapping is correct: overdue → `--rust` (badge border+text `:146-147`, pill `:184-185`); urgent (`isUrgent`, `:116-124`, `<= 30` days and not overdue) → `--mustard`; otherwise `--ink-soft`. `isUrgent` recomputes the same midnight-diff as `countdown` (consistent threshold).

3. **No fabricated data — PASS.** The only static content is `TRUST_ITEMS` (the trust strip, `:345-349` — explicitly allowed) and the `SnapshotPanel` footer label "Seeded · BE-8 / getEntity" (`:337`). Every dynamic value — deadline rows (form, type, rule_id, config_version, due_date, countdown) and snapshot rows (entity_type, msic_codes, gross_income, sst_registered, basis period, employee_count, paid_up_capital, tin) — is read from the `ObligationCalendar`/`EntityTaxProfile` responses. **No invented "recent activity", no fake timestamps, no synthesized numbers.**

4. **Persona repaint — PASS.** `DeadlinesPanel` carries `key={persona.tin}` (`:472`) AND keys its `useEffect` on `[tin, ssm]` (`:79`), resetting `loading/error/calendar` before each fetch — switching persona re-fetches deadlines. `SnapshotPanel` carries `key={`snap-${persona.tin}`}` (`:473`) and internally `useEntity()` re-fetches on `resolvedTin` change (`useEntity.ts:30`). Both panels repaint per persona. The three persona TINs in `personas.ts` (`C2581234509`/`C7654321098`/`C3219876540`) each have a matching dataset in `MOCK_OBLIGATIONS_BY_TIN` (`client.ts:170-274`), so persona switching shows genuinely distinct deadlines in mock mode; unknown TINs fall back to ACME (`?? MOCK_OBLIGATIONS`, `:277`).

5. **Theming — PASS.** `git diff main --unified=0 | grep '^+'` for `#hex`/`rgba(` → **0 matches in added lines.** All colour, border, font, and spacing values use `var(--*)` tokens, so dark mode holds. (The lone `rgba(0,0,0,0.22)` in the action-card hover handler, `Dashboard.tsx:423`, is **pre-existing in `main`** on an untouched line — out of scope for this diff, not introduced here.)

6. **Loading / empty / error — PASS.** `DeadlinesPanel` has all four states: `loading` → barber + "Loading obligations…" (`:91-98`); `error` → message in `--rust` (`:100-104`); empty → "No obligations found." (`:106-110`); populated → sorted list (`:112-196`). The `.catch((err: Error) => setError(err.message))` surfaces a live-call failure without a white-screen. `SnapshotPanel` mirrors loading/error/populated states (`:252-323`). Live calls can be slow; the loading state covers it.

### Findings

**Critical / Major / Minor:** none.

**Informational (no action — by design or latent until a future live path):**

- `Dashboard.tsx:128` — [informational] Deadline rows use `key={ob.rule_id}`. In each mock persona the `rule_id` values are unique, so the React key is stable today. The `ObligationCalendar` contract does not _guarantee_ `rule_id` uniqueness within a calendar, so a future live response that returns two rows sharing a `rule_id` (e.g. two periods under one rule) would collide keys. Not a bug now; if it surfaces at live-swap, key on `${ob.rule_id}-${ob.due_date}` or the array index-stable form. Noted, not blocking.
- `Dashboard.tsx:116-124` — [informational] `isUrgent` recomputes the midnight day-diff inline rather than reusing `countdown()`'s already-computed value. Harmless duplication (same result); a one-line cleanup could return `diffDays` from `countdown` and derive urgency from it. Cosmetic only.

### Verified clean (no action)

- **Surgical:** changes confined to the new hub panels + the mock obligations map. No tax figures, citations, core math, or HITL code touched. No edits to `App.tsx`, `tokens.css`, `useEntity.ts`, or the consoles. New mock `status: 'overdue'` values are display-only (`Obligation.status` is typed `string`); they do not feed any computation.
- **No orphaned imports:** `useEffect`/`useState`/`Link`/`useActivePersona`/`ObligationCalendar`/`getObligations`/`useEntity` are all used.

**Return to PM:** **Approve.** Wave 2 is non-regressive and contract-clean — the live request path is byte-for-byte unchanged (the new per-persona obligations are gated entirely behind `MOCK_MODE`), the countdown math is correct at every boundary (no today/tomorrow off-by-one), both panels re-fetch on persona switch and show distinct data, no fabricated activity/timestamps leak in (only the allowed static trust strip), and no literal colors were added so dark mode holds. All three gates green (tsc 0 · build 53 modules · biome 0 errors); diff is exactly the 2 expected files. No Critical/Major/Minor findings — ready for Gate-2 commit authorization.

---

## [25/06/26] — Wave 3: Entry Journey (Marketing Landing + Auth/Guest Gate + Routing Restructure)

**Verdict: APPROVE (with one minor advisory).**

**Scope reviewed:** working-tree diff vs `main` for `frontend/`. New files `MarketingShell.tsx/.css`, `Landing.tsx/.css`, `LoginGate.tsx/.css`; modified `App.tsx` (route restructure) and `AppShell.tsx` (internal links `/` → `/dashboard`). Diff stat: only `App.tsx` (+11/-1) and `AppShell.tsx` (+8/-3) are tracked-file changes; the rest are new untracked files.

### Verify gates — all GREEN

- `bunx tsc --noEmit` → exit 0 (clean).
- `bun run build` → green (`tsc -b && vite build`, 59 modules, built in 1.69s).
- `bunx biome check frontend/src` → "Checked 22 files. No fixes applied." → 0 errors.
- `git diff main --stat -- frontend/src/pages/Dashboard.tsx` → **EMPTY**. Hub content (deadlines/snapshot/cards/countdown/persona fetch) is byte-for-byte unchanged; it is simply served at `/dashboard` now. PASS.

### Review focus — results

1. **Non-regression — PASS.** `Dashboard.tsx`, `PersonaContext.tsx`, `hooks/useTheme.ts`, and `components/icons` are all unchanged vs `main` (empty diff stat). Dashboard hub fetch logic + PersonaContext untouched as required. The 3 consoles, persona switching, AppShell drawer/topbar/footer, in-shell 404, BE-18 money-shot, sovereign badge are all served under the unchanged `AppShell` — no functional regression. The only AppShell edits are the three internal `to="/"` → `to="/dashboard"` link targets (brand lockup x2 + drawer "Dashboard" NavLink).

2. **Routing correctness — PASS.** `App.tsx:18-31`: `/` (`index`) and `/login` render under `<MarketingShell>` (no AppShell); `/dashboard`, `/obligations`, `/filing`, `/audit-defense`, and `*` render under `<AppShell>`. The two route groups are sibling, non-overlapping `<Route element>` blocks — no path renders under two shells. The `*` 404 stays inside the AppShell group (`:30`). Grep for `Navigate`/`navigate(` shows **no leftover `/`→hub or `/`→`/obligations` redirect** anywhere (the only `navigate()` is LoginGate's guest CTA → `/dashboard`). No route conflict.

3. **No hard auth guard — PASS.** All app routes are plain `<Route>` elements with no guard wrapper / redirect-to-login. Deep-linking to `/dashboard`, `/obligations`, etc. works without authentication. `cp_entered_as_guest` (`LoginGate.tsx:10`) is **only written, never read** anywhere in `frontend/src` (grep confirms a single occurrence) — it does NOT gate any route. The guest CTA's `localStorage.setItem` is wrapped in try/catch and degrades gracefully if storage is unavailable.

4. **Internal links — PASS.** AppShell brand lockup (topbar + drawer) and the drawer "Dashboard" NavLink now point to `/dashboard` (not `/`). Landing CTAs (`Landing.tsx:152`, `:232`) → `/login`; MarketingShell "Get Started" (`:28`) → `/login`; LoginGate guest CTA → `/dashboard`. MarketingShell brand lockup (`:14`) and LoginGate brand (`LoginGate.tsx:21`) point to `/` (the landing) — correct, since `/` is now the marketing landing, not the hub. **No dead links to the old `/` hub.**

5. **Theming / literal colors — PASS (app-shell + tokens clean), with advisory.** `tokens.css` and `AppShell.css` are unchanged vs `main` — **no token-file or shared-shell pollution.** Literal hex appears only in the new marketing-page-scoped CSS (`Landing.css`, `LoginGate.css`), which is the lower-risk location flagged as acceptable. Build is green and the marketing CSS defines its own `[data-theme="dark"]` variants, so dark-mode legibility is not broken. **Advisory (non-blocking):** several literal hexes DUPLICATE existing tokens and should prefer the token for drift-resistance:
   - `#1c1b19` = `--ink` (light) — `Landing.css:70,106,153,161,396,450,505,532`.
   - `#e9edf3` = `--ink` (dark) — `Landing.css:111,169`; `LoginGate.css:50,60,74`.
   - `#57534a` = `--ink-soft` (light) — `Landing.css:127`.
   - `#97a3b6` = `--ink-soft` (dark) — `Landing.css:133`.
   - `#41526e` = `--denim` (light) — `Landing.css:92,116`.
   - `#93a7d6` = `--denim` (dark) — `Landing.css:97,120`.
   - `#ece7d8` = `--paper` (light) — referenced in `Landing.css:454` (`#ece7d8`).
   - `#1d2430` = `--window` (dark) — `Landing.css:576`.
     Note `#1d2634` (`Landing.css:576`/`LoginGate.css:35`) is NOT a token (distinct from `--window` `#1d2430`) — that one is a genuine marketing-only shade, fine as a literal. **Fix (optional, low priority):** swap the duplicating literals above for their `var(--*)` token. Not a blocker — marketing-scoped, dark mode holds, build green.

6. **Copy rules — PASS on Title Case; advisory on em-dashes.** Landing/Login headings are Title Case (`Every Tax Figure, Cited and Verified.`, `Three Consoles. One Sovereign Stack.`, `Built for Malaysia. Verified at Every Step.`, `Welcome`). **Advisory (non-blocking):** em-dashes (`—`) appear in Landing body/mock copy at `Landing.tsx:17,61,62,102,107`. The task brief asks for none in user-facing landing copy; however the **pre-existing codebase already uses em-dashes in user-facing copy** (e.g. the rendered `AppShell.tsx:27` "DEMO MODE — running on seeded fixtures" banner; Dashboard has 5). So this matches the established repo convention rather than introducing a new inconsistency. If the no-em-dash rule is to be enforced, apply it repo-wide (separate task); replacing here only would diverge from the live shell. Not a blocker.

### Findings summary

- **Critical / Major:** none.
- **Minor (advisory, optional):**
  - `Landing.css` / `LoginGate.css` (lines listed in focus #5) — literal hexes duplicating `--ink`/`--ink-soft`/`--denim`/`--paper`/`--window`; prefer the `var(--*)` token. Marketing-scoped, dark mode holds, not blocking.
  - `Landing.tsx:17,61,62,102,107` — em-dashes in user-facing copy; consistent with existing repo convention (AppShell/Dashboard already use them). Address repo-wide if enforcing the rule, not piecemeal.
- **Informational:** `MarketingShell.tsx:51` uses an inline `style={{...}}` on the footer meta — identical to the existing `AppShell.tsx:252` footer pattern (same markup), so it matches existing style, not a new smell.

### Verified clean (no action)

- Route groups are non-overlapping; `*` 404 stays under AppShell; no double-shell rendering; no leftover `/`→hub redirect.
- No auth guard blocks deep-linking; guest flag is write-only.
- All new imports used; `tsc`/`biome`/`build` all green.
- `tokens.css` + `AppShell.css` untouched — no shared-surface color pollution.

**Return to PM:** **Approve.** Wave 3 entry-journey is non-regressive — the dashboard hub and all consoles are byte-for-byte unchanged and simply relocated to `/dashboard`, routing is correct with two clean non-overlapping shell groups, there is no hard auth guard (guest flag is write-only, deep-linking works), and all internal links repoint correctly with no dead `/`-hub links. All three gates green (tsc 0 · build 59 modules · biome 0). The only findings are two **non-blocking advisories** — marketing-scoped literal hexes that duplicate existing tokens (prefer `var(--*)`), and em-dashes in landing copy that match the existing repo convention. Ready for Gate-2 commit authorization; the advisories can be folded into a follow-up polish task.

---

## [25/06/26] — Wave 4: Filing Studio Stepper (FilingStudio.tsx rewrite)

**Branch:** working tree (uncommitted). Diff scope: `frontend/src/pages/FilingStudio.tsx` (+ `docs/plan.md`, `docs/progress.md`).

**Verdict:** Approve

**Diff scope confirmed:** `git diff main --stat` shows only `FilingStudio.tsx` + two docs. `git diff main -- frontend/src/api/client.ts` is **empty** — client.ts unchanged. No collateral changes to other consoles, tokens.css, or shared surfaces.

**Non-regression (priority #1) — every prior capability preserved:**

- classify via `classifyTrialBalance`; sovereign badge from `classifyResult.sovereign`/`active_model` (line 655, `Stage1Detail`) — kept.
- HITL graph `startFiling` → Approve/Reject → `resumeFiling(tin, thread_id, approved)` (lines 741/754) — kept. The 404/error path is handled: `handleApprove` catch maps `404` to "Filing thread not found or already finalized." (line 760) and routes to `{tag:'error'}` rather than throwing — no white-screen.
- `risk_flags` rendered with per-flag severity color/label (`RiskFlagList`, lines 303–338; severity drives border + tag color) — kept.
- 96px hero `tax_payable` numeral (line 436) — kept. Honest-number IA preserved: `LIABILITY_KEYS` vs `UPSTREAM_KEYS` split into "Computed Liability" / "Supporting Figures" sections (lines 400–506) — kept.
- per-figure `FigureTrace` `<details>` exposing rule_id/config_version/inputs (`FigureTraceRow`, lines 340–395) — kept.
- one-shot `getFormC` fallback (`handleOneShot`, line 765) — kept; `approved: !requires_approval` mapping is byte-identical to the pre-rewrite handler (not a new behavior).

**GROUNDING CONSTRAINT (critical) — PASS:** `grep clause_id|clause_ids|citation` over FilingStudio.tsx returns 0 matches. No clause-IDs or citations are rendered on Form C figure rows; provenance is limited to the FigureTrace (rule_id/config_version/inputs). Matches the pre-rewrite behavior.

**Contract integrity (priority #2) — PASS:** Consumes the same shapes from the unchanged client.ts: `ClassifyResponse{line_items, sovereign, active_model}`, `FilingStartResponse{thread_id, computation, requires_approval, risk_flags}`, `FilingResumeResponse{approved, computation}`, `FormCResponse{computation, requires_approval, risk_flags}`, `FigureTrace{value, inputs, rule_id, config_version}`. No invented fields; tsc clean confirms structural match.

**State-machine correctness — PASS:** Single `Phase` discriminated union drives the flow. Classify input (textarea) renders only in `idle`/`error`; Start/One-Shot buttons render only in `classified`; `handleApprove` guards `phase.tag !== 'pending_approval'`; "Start Over" resets to `classified` (preserving classify) or `idle`; persona switch (`useEffect` on `persona.tin`) resets rawText + classify + lineItems + phase. No reachable inconsistent/stuck state.

**Mock + live — PASS:** Textarea pre-fills from `persona.demoRawText` (lines 682, 689); mock branches live entirely in the unchanged client.ts (`MOCK_MODE`), so both paths are unaffected by the rewrite.

**Copy + theming — PASS:** 0 em-dashes in user-facing copy. Stage headings Title Case ("Classify Line Items", "Compute Form C", "Risk Assessment", "Human Approval", "Finalized"). Colors are tokens-only (`var(--denim)`, `var(--rust)`, `var(--mustard)`, `var(--ink)`, etc.) — no literal hex.

**Findings (non-blocking):**

- `FilingStudio.tsx:41` — [nit] The `classified` phase variant carries a `classify: ClassifyResponse` payload that the render path never reads (component reads the separate `classifyResult` state instead). Harmless redundant source-of-truth; could drop the payload from the union for clarity. No behavioral impact.

**Smoke test:**

- `cd frontend && bunx tsc --noEmit` → exit 0 (clean).
- `cd frontend && bun run build` → green, 59 modules transformed, built in 1.83s.
- `bunx biome check frontend/src` (from root) → 0 errors, 22 files checked.

**Return to PM:** **Approve.** The Filing Studio stepper rewrite is non-regressive — all prior capabilities (classify + sovereign badge, HITL start/resume with graceful 404 handling, severity-coded risk flags, 96px tax_payable hero, honest-number liability/supporting IA, per-figure FigureTrace, one-shot fallback) are preserved, the grounding constraint holds (no clause-IDs/citations on figure rows), and the contract is intact (client.ts byte-for-byte unchanged, same response shapes consumed, no invented fields). State machine is sound with no stuck states; copy/theming clean. All three gates green. One non-blocking nit (a redundant unused union payload). Ready for Gate-2 commit authorization.

## [25/06/26] — Redesign Wave 5: polish & cohesion (responsive topbar · ObligationRadar 2-col rewrite · FilingStudio dead-code nit) `[FE]`

**Branch:** working tree vs `main` (uncommitted). Diff surface: `git diff main --stat -- frontend/` → 4 modified (`layouts/AppShell.tsx` +2/−0, `styles/tokens.css` +17/−0, `pages/ObligationRadar.tsx` +237/−70, `pages/FilingStudio.tsx` +3/−3) + `docs/{plan,progress}.md`. No new files, no sprawl.

**Verdict:** Approve

The surface is exactly the four files claimed plus docs. ObligationRadar is a faithful presentational rewrite over the same `ObligationCalendar`/`Obligation` shapes — same fetch, same persona wiring, no invented fields, all `oblig.*` rule_ids still shown, and a correct countdown/overdue computation. The tokens.css change is additive and scoped to a new `@media (max-width: 480px)` block. The FilingStudio nit is a clean union-field removal with no residual reference. All three gates green (tsc / build / biome). No Critical/Major/Minor findings. Recommend authorizing.

### ObligationRadar non-regression (highest priority — VERIFIED line-by-line vs `main`)

- **Same fetch contract, unchanged.** Both data hooks are byte-identical to the pre-change file: `useEntity()` for the active entity, and a `useEffect([entity])` that spreads `entity.*` into `getObligations(entity.tin, {…})`. I diffed the old file (`git show main:…`) against the new — lines 1-48 (imports, hook, the `getObligations` body, the `[entity]` dep) are unchanged. So the persona switch still repaints (new `entity` from `useEntity` → effect re-fires → obligations re-fetch), exactly as the FE-8 verdict confirmed. **No data dropped, no fields invented.**
- **Consumes the real shapes only.** The card reads `entity.{tin,gross_income,entity_type,msic_codes,sst_registered,basis_period_start,basis_period_end,employee_count,paid_up_capital}` — every one exists on `EntityTaxProfile` (`client.ts:32-43`). The obligations list reads `ob.{form,obligation_type,rule_id,config_version,due_date,status}` — every one exists on `Obligation` (`client.ts:45-52`). No field is fabricated; tsc (exit 0) confirms.
- **`oblig.*` rule_ids still rendered.** Each row shows `{ob.rule_id} · {ob.config_version}` (`:244`) and keys on `ob.rule_id` (`:193`) — same as the old `:131`. The audit-trail provenance the radar exists to show is intact.
- **Countdown/overdue logic — CORRECT.** `countdown()` (`:14-25`) midnight-normalizes both today and the due date (`setHours(0,0,0,0)`) before differencing, then `Math.round`s the day delta — so DST/partial-day drift can't produce an off-by-one. `<0` → "Nd overdue" + `overdue:true`; `0` → "Due today"; `1` → "Due tomorrow"; else "in Nd". The `isUrgent` pill threshold (`:181-189`) re-derives the same midnight-normalized delta and lights `--mustard` for `0 < days <= 30`, `--rust` for overdue, `--ink-soft` otherwise — internally consistent with `countdown`. This is a fresh, self-contained implementation (not present in the old file, which rendered the raw `due_date` string) and it is correct.
- **Obligations sorted by due date** (`:52`, `localeCompare` on ISO `due_date`) — stable for `YYYY-MM-DD` strings; purely presentational, drops nothing.
- **Loading/error/empty states preserved.** Error window, loading window, and the `{entity && …}` guard mirror the old structure; the obligations column additionally guards `!data && !displayError` (barber) and `sorted.length > 0`. Empty list → no rows, no crash.

### tokens.css change is additive + scoped (VERIFIED)

- The only change is a new `@media (max-width: 480px)` block (`:1217-1231`) inserted **before** the existing `@media (prefers-reduced-motion: reduce)` block. It adds three rules: `.topbar-wordmark{display:none}`, `.topbar-mock-chip{display:none}`, `.topbar-entity-select{max-width:100px;font-size:10px}`. `git diff` confirms **+17/−0** — no existing rule, token, or media query was modified or deleted.
- **No desktop impact.** `.topbar-mock-chip` and `.topbar-entity-select` are _new_ classnames (confirmed absent from `main`'s AppShell, present only as the JSX hooks added in this diff) and have **no rules outside the 480px block**, so at desktop width they are no-op classes — desktop topbar rendering is unchanged. `.topbar-wordmark` pre-existed and only gains a mobile `display:none`. The pre-existing `.proof-grid` collapse to one column at ≤900px (`:1155`) is reused by the rewrite — unchanged.
- **No literal hex, tokens/sizes only.** The block uses `display`, `max-width:100px`, `font-size:10px` — no color literals. No em-dashes introduced (added lines containing `—` → 0 across all four files; the 4 in tokens.css + 2 in AppShell are pre-existing comments).

### FilingStudio nit (VERIFIED — no orphan, no broken stepper)

- The `classified` union variant dropped its `classify: ClassifyResponse` field (`:38`), and both constructors that set it (`:727`, `:775`) now emit `{ tag: 'classified' }`. **No `phase.classify` access exists anywhere** (grep → 0) — the stepper reads the separate `classifyResult` state (`useState<ClassifyResponse|null>`, `:683`) and threads it through `deriveStages(phase, classifyResult)` / `Stage1Detail`, none of which touch the union field. So the removed field was genuinely dead; the stepper is unaffected.
- `ClassifyResponse` is still legitimately imported and used (5 refs: import, `deriveStages` param, `ComputationPanel` prop, `Stage1Detail` prop, the `classifyResult` state) — the import is **not** orphaned by the removal. tsc (exit 0) confirms no dangling reference.

### No regressions elsewhere (VERIFIED)

- AppShell change is purely the two added classnames (`topbar-mock-chip`, `topbar-entity-select`) on existing elements — `git diff` shows **+2/−0**, no logic, no JSX structure, no other attribute touched. The hamburger/drawer, theme toggle, persona picker, and MOCK chip all render identically at desktop.
- Build transformed **59 modules** (vs 48 at FE-8) and `dist/` emitted — the filing stepper, audit money-shot, dashboard hub, landing/login, 404 all compile and bundle clean.

### Verified clean (no action)

- **Surgical:** every changed line traces to the task (responsive media block, the radar rewrite, the union-field removal, the two JSX classname hooks). No tax figures, citations, core math, or the honesty/fabrication path touched. No backend change.
- **No AI attribution:** `git diff main -- frontend/ | grep -iE 'co-authored|generated with|claude code|noreply@anthropic|🤖'` → 0 matches.

### Findings

**Critical:** none. **Major:** none. **Minor:** none.

**Informational (no action — by design / pre-existing, NOT introduced here):**

- `frontend/src/pages/ObligationRadar.tsx:32-48` — [informational] On a persona switch the effect does not reset `data`/`error` to `null`, so the previous persona's obligations remain visible for the one render between the new `entity` arriving and the new `getObligations` resolving (the loading window also shows during that window since `useEntity` flips `loading` true). This transient is **identical to the pre-change file** (the old effect had the same shape) and matches the AuditDefense stale-pack pattern already logged at FE-8 M1 — it is not introduced by this rewrite. Optional future polish: `setData(null)` at the top of the effect. Not blocking.
- Visual aesthetics (the 2-column layout, badge/pill styling, spacing) intentionally NOT assessed — owned by the PM screenshot review per the task non-goals.

**Smoke test:** `cd frontend && bunx tsc --noEmit` → **exit 0, clean** · `bun run build` (`tsc -b && vite build`) → **59 modules transformed, dist/ emitted, exit 0** · `bunx biome check frontend/src` (from root) → **"Checked 22 files, no fixes applied", exit 0** · `git diff main --stat -- frontend/` → 4 files (AppShell +2 / tokens +17 / ObligationRadar +237/−70 / FilingStudio +3/−3), no sprawl · added-line em-dash scan → 0 · added-line hex-literal scan (480px block) → 0 · `phase.classify` access → 0 · all `entity.*`/`ob.*` fields exist on `EntityTaxProfile`/`Obligation` · tokens used by the rewrite (`--rust`,`--denim`,`--mustard`,`--ink`,`--ink-soft`,`--font-display`,`--font-mono`,`--font-body`,`--border`) all defined.

**Return to PM:** **Approve.** The diff is exactly the four claimed files + docs, no sprawl. ObligationRadar is a faithful presentational rewrite — the fetch (`useEntity` + `getObligations` spreading `entity.*`) and persona-repaint wiring are byte-identical to `main`, it consumes only real `EntityTaxProfile`/`Obligation` fields (no invented data), all `oblig.*` rule_ids + config_versions are still shown, and the new countdown/overdue logic is correct (midnight-normalized, `Math.round`ed, urgent-pill threshold consistent). The tokens.css change is additive and scoped to a new `@media (max-width:480px)` block — no existing rule/token altered, no desktop impact, tokens-only (no hex, no em-dash). The FilingStudio union-field removal leaves no `phase.classify` reference and doesn't orphan the `ClassifyResponse` import; the stepper reads `classifyResult`. All three gates green (tsc / 59-module build / biome 22 files). No Critical/Major/Minor. Ready for Gate-2 commit authorization.

---

## [25/06/26] — Settings page (`/settings`) + profile popover + drawer reorder + persona-default persistence `[FE]`

**Branch:** `main` (working tree, uncommitted). Changed: `frontend/src/{App.tsx,PersonaContext.tsx,layouts/AppShell.tsx}` + new `frontend/src/pages/{Settings.tsx,Settings.css}` + `docs/progress.md`.

**Verdict:** Approve with comments

The highest-priority concern — the `PersonaContext` initial-state change — is **SAFE**, verified against every failure mode (missing key, invalid/stale TIN, type-narrowing). No regression to persona switching or any console consuming `useActivePersona`. Settings genuinely persists (theme via existing `useTheme`; default entity to `cp_default_persona` + `setPersona`; Reset clears both keys + reloads). Profile popover, Sign Out, drawer reorder, and route placement all behave as specified. All three gates green. One Minor copy nit (em-dash in user-visible prose) and one Minor UX note (Reset full-page reload) — neither blocks the commit.

### #1 — PersonaContext non-regression (highest priority — VERIFIED SAFE)

- **Missing key:** `window.localStorage.getItem('cp_default_persona')` returns `null` → `if (tin)` is false → `readDefaultPersona()` returns `DEFAULT_PERSONA` (`PersonaContext.tsx:9-16`). No crash.
- **Invalid / stale TIN (the key case the brief flags):** a stored TIN no longer in `PERSONAS` → `PERSONAS.find(p => p.tin === tin)` returns `undefined` → `if (found)` false → falls through to `DEFAULT_PERSONA`. Clean fallback, **no crash**, and the return type stays `Persona` (never `undefined`) so the `useState<Persona>` initializer is sound.
- **No SSR/`window` hazard:** this is a Vite SPA; `readDefaultPersona` runs at provider mount, exactly mirroring the pre-existing `useTheme.readStoredTheme()` (`useTheme.ts:7-10`) which already reads `window.localStorage` at init. No new SSR surface introduced.
- **Lazy initializer is correct:** `useState<Persona>(readDefaultPersona)` passes the function reference (lazy init), so it runs once at mount — not on every render. Not `useState(readDefaultPersona())`. Correct React idiom.
- **Switching unchanged:** `setPersona` is still the raw `useState` setter shared via context. The topbar entity switcher (`AppShell.tsx:128-153`) and Settings (`Settings.tsx:17`) both call the same `setPersona`; all consoles read `useActivePersona().persona`. The only behavioral delta vs `main` is the **initial** value now honoring a persisted default — switching, repaint, and consumer wiring are byte-identical. Verified `useActivePersona` consumers (ObligationRadar/FilingStudio/AuditDefense via `useEntity`/persona) are untouched (`git status` shows no console files modified).
- **Default-vs-session split is intentional and correct:** the topbar switcher writes ONLY to context (session-scoped); Settings writes context **and** `cp_default_persona` (persists across reloads). This matches the design — a topbar switch shouldn't permanently change the startup default.

### #2 — Settings persists (VERIFIED, no fabricated/backend settings)

- **Theme:** uses the existing `useTheme()` hook and its `cukaipandai-theme` key (`useTheme.ts:3,45`); the checkbox reflects `theme === 'dark'` and calls `toggleTheme` (`Settings.tsx:58`), which persists + applies instantly. No new theme key invented.
- **Default entity:** `handleDefaultPersonaChange` guards `PERSONAS.find` (no-op on unknown TIN), writes `cp_default_persona`, and calls `setPersona` so the change is both persisted and live (`Settings.tsx:13-18`).
- **Reset:** clears exactly the two real keys (`PREF_KEYS = ['cukaipandai-theme', 'cp_default_persona']`) then `window.location.reload()` (`Settings.tsx:7,20-25`). Reload is needed because clearing the keys doesn't retroactively reset the in-memory `theme`/`persona` state — the reload makes both re-derive from the (now-empty) storage. Correct, if blunt (see Minor).
- **No backend dependency:** Settings imports only `PersonaContext`, `useTheme`, `PERSONAS` — pure client-side prefs. The About block is static copy + a GitHub link. No tax figure, rate, or citation introduced (citation discipline N/A here).

### #3 — Profile popover + Sign Out (VERIFIED)

- **Sign Out** clears `cp_entered_as_guest` (the only writer is `LoginGate.tsx:10`; this is the matching clear) and `navigate('/')` (`AppShell.tsx:186-190`) — closes the popover first. Routing to `/` lands on the public Landing (MarketingShell), consistent with a sign-out.
- **Settings** action closes the popover and `navigate('/settings')` (`AppShell.tsx:176-179`).
- **Outside-click / Escape close is pre-existing** (`AppShell.tsx:51-67`, `pointerdown` + `keydown` on the `topbarControlsRef` container) — unchanged by this diff; both new buttons live inside that ref so the handler still applies.
- **Settings reachable ONLY via the popover:** confirmed no `/settings` `NavLink` in the drawer (the old "Settings (Wave 2)" placeholder is removed). `grep` for `/settings` in the drawer block → none. The catch-all `*` route is correctly ordered AFTER `/settings` in `App.tsx:31-32`, so `/settings` resolves to the page, not NotFound.
- Both popover buttons reuse the pre-existing `.popover-action` class (`styles/tokens.css:334`), so Sign Out is styled, not bare.

### #4 — Drawer order (VERIFIED)

- Drawer now renders **Workspace (Dashboard)** above **Compliance (Obligations / Filing / Audit Defense)** (`AppShell.tsx:229-256`). The old order (Compliance-first, Workspace+placeholder last) is gone. No Settings item in the drawer. The `drawer-placeholder` "Settings (Wave 2)" div was removed cleanly (no orphaned class usage left in this file).

### #5 — Hygiene (VERIFIED)

- **`/settings` under AppShell:** the route sits inside `<Route element={<AppShell />}>` (`App.tsx:26-33`), so the Settings page gets the full shell chrome (topbar, drawer, banner).
- **Tokens-only colors:** `Settings.css` has 34 `var(--…)` references and **zero** literal `#`/`rgb`/`hsl`/named colors. Clean.
- **Title Case headings:** `Settings`, `Workspace Preferences` (kicker), and the card heads `Appearance` / `Workspace` / `About` / `Reset` are all Title Case / single-word. OK.
- **Consoles, shell, theme toggle untouched:** `git status` shows only the 3 edited files + 2 new Settings files + `docs/progress.md`. No console/`useEntity`/`useTheme`/`tokens.css` edits — no sprawl.

### Findings

**Critical:** none. **Major:** none.

**Minor (non-blocking):**

- `frontend/src/pages/Settings.tsx:98` — [minor, copy] The About prose contains a literal em-dash: `"… cited Form C filing, and audit-defense — every figure traceable …"`. The task's hygiene bar says "no em-dashes," and this is the ONLY em-dash in **user-visible rendered text** across the FE (all other em-dashes in the tree are in code comments, an existing convention). → Fix: replace `—` with `; ` or a period: `"… and audit-defense. Every figure is traceable to a verified YA2026 source."`. Cosmetic; does not affect runtime or gates.
- `frontend/src/pages/Settings.tsx:24` — [minor, UX note only] Reset uses `window.location.reload()` to re-derive `theme`/`persona` from cleared storage. It works correctly, but a full-page reload is a heavier UX than calling the in-memory setters (e.g. `setPersona(DEFAULT_PERSONA)` + reset theme). Acceptable for a prefs reset; the reload guarantees a clean re-derive of every persisted bit. Leave as-is unless the PM wants a softer reset. Not blocking.

**Informational (no action):**

- The topbar entity switcher remains **session-only** (writes context, not `cp_default_persona`), so switching the entity in the topbar does NOT change the persisted startup default — only Settings does. This is the intended split, called out here so it isn't mistaken for an inconsistency.
- `DEFAULT_PERSONA_KEY` is exported from `PersonaContext` and re-imported by `Settings.tsx:1` (single source of truth for the key string) — good, no string duplication.

### Verified clean (no action)

- **Surgical:** every changed line traces to the task (route add, lazy-init persona read, popover actions, drawer reorder, new Settings page/CSS). No tax figures, citations, core math, or backend touched. No console files modified.
- **No AI attribution:** `git diff main -- frontend/ && (untracked Settings files) | grep -iE 'co-authored|generated with|claude code|noreply@anthropic|🤖'` → 0 matches.

**Smoke test:** `cd frontend && bunx tsc --noEmit` → **exit 0, clean** · `bun run build` (`tsc -b && vite build`) → **61 modules transformed, dist/ emitted, exit 0** · `bunx biome check frontend/src` → **"Checked 24 files, no fixes applied", exit 0** · `git diff main --stat -- frontend/` → 3 tracked files (App +2 / PersonaContext +13/−2 / AppShell +26/−13) + 2 new Settings files, no console sprawl · `cp_entered_as_guest` writers/clearers → set by LoginGate, cleared by Sign Out only · Settings.css hex/rgb/hsl scan → 0 · user-visible em-dash scan → 1 (Settings.tsx:98) · `.popover-action`/`.topbar-popover`/`.profile-summary` all defined in tokens.css.

**Return to PM:** **Approve with comments.** The PersonaContext initial-state change (the flagged priority) is safe end-to-end: missing key, invalid/stale TIN, and type-narrowing all fall back to `DEFAULT_PERSONA` with no crash; the lazy `useState(readDefaultPersona)` initializer runs once; persona switching and all `useActivePersona` consumers are byte-identical to `main`. Settings persists real prefs only (theme key `cukaipandai-theme`, default entity `cp_default_persona`, Reset clears both + reloads) — nothing fabricated or backend-dependent. Profile popover Settings→`/settings` and Sign Out→clears `cp_entered_as_guest`+routes `/` both correct; outside-click/Escape close is pre-existing; Settings is popover-only (no drawer item). Drawer reordered Workspace-above-Compliance, `/settings` is under AppShell. All gates green (tsc / 61-module build / biome 24 files), no sprawl into consoles. Two Minor non-blockers: one user-visible em-dash (Settings.tsx:98) and the Reset full-page reload (works, slightly heavy). No Critical/Major. Ready for Gate-2 commit authorization; the em-dash fix is a trivial optional follow-up.

---

## [25/06/26] — Wave A: auth rework (`/sign-in`, `/sign-up`, `/privacy`; `/login` redirect) `[FE]`

**Branch:** `main` (working tree, uncommitted). 3 tracked modified (`App.tsx`, `layouts/MarketingShell.tsx`, `pages/Landing.tsx`) + 6 new (`pages/AuthScreen.tsx`, `pages/Auth.css`, `pages/SignIn.tsx`, `pages/SignUp.tsx`, `pages/Privacy.tsx`, `pages/Privacy.css`) + docs.

**Verdict:** Approve with comments

Routing is correct, the prior clip bug is fixed (auth pages render full-screen OUTSIDE MarketingShell), the guest flow is a byte-identical non-regression of the old LoginGate, the tagline is gone from auth, Privacy copy is honest, and hygiene holds (tokens-only, no user-facing em-dashes). All three gates green. One Minor non-blocker: the old `LoginGate.tsx`/`LoginGate.css` remain on disk as orphaned dead code (self-acknowledged by PG) and a stale comment in `MarketingShell.css:1` still references LoginGate. No Critical/Major.

### Review focus (all PASS)

1. **No dead links / routing correctness — PASS.**
   - `grep -rn "/login" frontend/src` → the ONLY hit is the redirect target `App.tsx:32` (`<Route path="/login" element={<Navigate to="/sign-in" replace />} />`) + its comment at `:31`. No CTA still points to `/login`.
   - All CTAs repointed: `Landing.tsx:149` ("Get Started") + `Landing.tsx:229` ("Open the Demo") + `MarketingShell.tsx:28` ("Get Started") all → `/sign-in`. Verified by diff.
   - Sign-in↔sign-up cross-links work: `AuthScreen.tsx:97` (`/sign-up` from sign-in) and `:101` (`/sign-in` from sign-up), gated on `isSignIn`. `SignIn`/`SignUp` are thin wrappers over the shared `AuthScreen` with `mode` prop — so both render identical, correct cross-links.
   - **"Continue as Guest" on BOTH `/sign-in` and `/sign-up`** → since both use `AuthScreen`, `continueAsGuest` (`AuthScreen.tsx:9-16`) sets `localStorage.cp_entered_as_guest='1'` then `navigate('/dashboard', {replace:true})` — present on both routes. Confirmed.
   - `/privacy` reachable: footer link `MarketingShell.tsx:50` + auth legal link `AuthScreen.tsx:107` (`<Link to="/privacy">`). Route registered under MarketingShell (`App.tsx:24`), renders in `.marketing-main` Outlet (topbar + footer present).
   - **`LoginGate` fully de-wired:** `App.tsx` has no LoginGate import; `grep -rl LoginGate src --include=*.tsx --include=*.ts | grep -v LoginGate.tsx` → no importers (orphaned). Confirmed NOT in the build graph (65 modules; LoginGate excluded).

2. **Tagline removed from auth — PASS.** `AuthScreen.tsx` contains no "YA2026 · decision-support, not legal advice." line (the old `lg-legal` is gone). The string still lives in `MarketingShell.tsx:53` (footer) and `AppShell.tsx:268` — explicitly allowed.

3. **Guest flow non-regression — PASS (byte-identical).** `AuthScreen.continueAsGuest` (`:9-16`) is character-for-character the old `LoginGate.continueAsGuest` (`LoginGate.tsx:8-15`): same key, same value, same `navigate('/dashboard', {replace:true})`, same try/catch. `AppShell.tsx:188` reads/removes `cp_entered_as_guest` on Sign Out only; AppShell does NOT gate or redirect on the flag, so `/dashboard` stays directly reachable. No regression.

4. **Privacy content is honest — PASS.** No fabricated legal/compliance claims. Production-scope statements are conditional ("would process…", "In a real deployment…"); prototype statements are factual (fixture-only, no persistence beyond browser session). Sovereignty claim is correctly scoped to _inference_ ("No data is sent outside Malaysia **for inference**", `Privacy.tsx:25-27`) — consistent with the plan's Q9 caveat that only the (not-yet-deployed, fixture-fallback) Neon persistence layer is SG-region; the prototype processes no real data, so no overclaim. PDPA 2010 reference is generic and accurate; decision-support disclaimer present (`:54`). No certifications invented.

5. **Hygiene — PASS.**
   - User-facing em-dashes: none. The only `—` hits are in `Auth.css` comments (`:1,119,184`) — not rendered copy.
   - Tokens-only colors: `grep -nE '#[0-9a-fA-F]{3,8}' Auth.css Privacy.css` → 0. Both stylesheets use only `var(--…)` tokens; dark mode switches automatically.
   - Title Case headings: "Welcome Back" / "Create Account" / "Privacy Policy" / "Sovereign Inference" / "What We Collect" / "Citation Gate" / "Your PDPA Rights" — all Title Case.
   - Full-screen render (the prior bug): auth routes are registered OUTSIDE the MarketingShell route group (`App.tsx:28-29` vs the `<Route element={<MarketingShell />}>` block at `:22-25`); `Auth.css:3-7` `.auth` is `min-height:100vh; display:grid; grid-template-columns:1fr 1fr` — a true full-viewport 50:50 split, NOT clipped inside `.marketing-main`'s constrained/padded container. Bug fixed.

6. **No app regressions — PASS.** `git diff main --stat -- frontend/` = exactly `App.tsx` (+13/−4), `MarketingShell.tsx` (+2/−1), `Landing.tsx` (+2/−2) plus the 6 new auth/privacy files. AppShell/consoles/Dashboard/Settings/ObligationRadar/FilingStudio/AuditDefense untouched. Landing still builds and routes.

### Findings

**Critical:** none. **Major:** none.

**Minor (non-blocking):**

- `frontend/src/pages/LoginGate.tsx` + `frontend/src/pages/LoginGate.css` — [minor, dead code] No longer imported or routed (orphaned; not in the build graph). PG self-flagged this as "can be cleaned up later." Per Karpathy/surgical convention, pre-existing-but-now-orphaned files MAY be left, but since these were orphaned _by this change_ removing them would be the cleaner close. → Optional fix: delete both files in this PR (or a fast follow). Not blocking — they do not ship in the bundle and cannot 404 (no route).
- `frontend/src/layouts/MarketingShell.css:1` — [trivial, stale comment] Header comment still reads "standalone layout for Landing + LoginGate (no AppShell)" though LoginGate is no longer routed through MarketingShell (and the auth pages are now outside it). → Optional: update to "Landing + Privacy". Cosmetic.

**Informational (no action):**

- SSO + email/password inputs are intentionally `disabled aria-disabled` "coming soon" placeholders; "Continue as Guest" is the one live action. Matches the prelim scope (no real auth backend). Correct.
- `AuthScreen.tsx:107` privacy link uses RR `<Link>` (client-side); footer GitHub link correctly uses a raw `<a target=_blank rel=noreferrer>`. Consistent.

### Verified clean (no action)

- **Surgical:** every changed line traces to the task (route table, CTA hrefs, footer privacy link, new auth/privacy files). No tax figures, citations, core math, or backend touched. No console files modified.
- **No AI attribution:** scan of the diff + new files for `co-authored|generated with|claude code|noreply@anthropic|🤖` → 0 matches.
- **progress.md** entry (`[25/06/26] — Wave A auth rework`) is accurate and honestly records the LoginGate orphan + the clip-bug root cause.

**Smoke test:** `cd frontend && bunx tsc --noEmit` → **exit 0, clean** · `bun run build` (`tsc -b && vite build`) → **65 modules transformed, dist/ emitted, exit 0** · `bunx biome check frontend/src` → **"Checked 30 files, no fixes applied", exit 0** · `grep -rn "/login" frontend/src` → only the `App.tsx:32` redirect (+comment) · `grep -rl LoginGate` → no importers (orphaned) · em-dash scan of new files → CSS comments only, 0 in copy · hex scan of `Auth.css`/`Privacy.css` → 0 · `git diff main --stat -- frontend/` → 3 tracked + 6 new auth/privacy files, no console sprawl.

**Return to PM:** **Approve with comments.** Routing is correct — `/login` survives only as the `<Navigate to="/sign-in" replace>` redirect, every CTA repoints to `/sign-in`, sign-in↔sign-up cross-links and "Continue as Guest" both work on both auth routes, and `/privacy` is reachable from the footer and the auth legal line. The prior clip bug is fixed: auth pages render full-screen via a `100vh` 50:50 grid OUTSIDE MarketingShell. The guest flow is a byte-identical non-regression (sets `cp_entered_as_guest`, routes to `/dashboard`; AppShell doesn't gate on it). The auth tagline is removed; Privacy copy is honest (inference-scoped sovereignty, fixture-only, generic PDPA, decision-support disclaimer — no fabricated claims). Hygiene holds (tokens-only, Title Case, no user-facing em-dashes). All gates green (tsc / 65-module build / biome 30 files); no sprawl into the app shell/consoles. Two Minor non-blockers: orphaned `LoginGate.tsx`/`.css` (recommend deleting in this PR) and a stale `MarketingShell.css:1` comment. No Critical/Major. Ready for Gate-2 commit authorization.

---

## [25/06/26] — Wave B: notification system (bell list + transient toasts) `[FE]`

**Branch:** `main` (working tree, uncommitted). 7 tracked modified (`App.tsx`, `components/icons.tsx`, `layouts/AppShell.tsx`, `pages/{AuditDefense,FilingStudio,Settings}.tsx`, `styles/tokens.css`) **+ 1 NEW UNTRACKED file `src/notifications.tsx`** (does not appear in `git diff main` — see note below).

**Verdict:** Approve with comments

No toast/render loops exist — every fire path is guarded and the effect deps are stable. The AppShell popover refactor is a clean non-regression: profile (Settings/Sign Out), bell, mutual exclusion, outside-click + Escape, entity switcher, theme, drawer, and brand links all work. Triggers tie to real events/data only (deadline seeds derive from `getObligations`; no fabricated content). All three gates green. No Critical/Major. Findings are one process note (the new file is untracked, so `git diff main` reviews an incomplete surface — it MUST be `git add`-ed before commit) plus a few Minor hygiene items.

### Process note (must address before commit — NOT a code defect)

- `frontend/src/notifications.tsx` is **untracked (`??`)**, so `git diff main -- frontend/` shows only 7 files and **omits the entire 208-line provider**. `git diff main --stat` therefore under-reports the surface. The file builds (it is imported by `App.tsx`/`AppShell.tsx`/the 3 pages and the build resolves it), so this is purely a staging gap. → **Before the Gate-2 commit, `git add frontend/src/notifications.tsx`** or it will be left out of the PR and `main` will not compile. I reviewed it by reading the working-tree file directly.

### #1 — No toast/render loops (highest priority — VERIFIED, no loop path)

- **All context callbacks have stable identity.** `dismissToast` (`useCallback []`), `pushToast` (`[dismissToast]`), `notify` (`[pushToast]`), `toast` (`[pushToast]`), `markAllRead` (`[]`), `dismiss` (`[]`), `seedDeadlines` (`[]`) — every dep chain bottoms out at a stable callback, so none change across renders (`notifications.tsx:52-142`).
- **The AppShell seeding effect re-runs ONLY on a genuine persona change.** Deps are `[persona.tin, persona.label, persona.ssm, seedDeadlines, notify]` (`AppShell.tsx:90`). `persona` is always one of the module-constant `PERSONAS` objects (`PersonaContext.tsx:29` lazy-init + `setPersona(PERSONAS.find(...))` at `AppShell.tsx:199`), so `persona.ssm`/`persona.label` keep **referential identity** between renders unless the persona actually switches. No new object identity per render → the effect does not re-fire on re-render.
- **Persona-switch toast fires only on a real TIN change, never on mount.** `prevTinRef` starts `null`; the toast is gated `if (prevTinRef.current !== null && prevTinRef.current !== tin)` (`AppShell.tsx:71`) — `null` on first run suppresses the mount toast; it is set to `tin` at `:77`. Correct.
- **Seeding fires exactly once per TIN per session.** `seededTinRef` guards `if (seededTinRef.current === tin) return` then sets it (`AppShell.tsx:80-81`); the provider's `seededRef` Set additionally dedupes per `form:due_date` key (`notifications.tsx:106,126`). On persona switch both are reset (`_clearSeeds()` + `seededTinRef = null`, `AppShell.tsx:74-75`). No re-seed on re-render.
- **Action toasts fire only in user-initiated async resolve handlers, never in a render-phase effect.** FilingStudio `notify` is inside the `handleApprove` try-block after `await` (`FilingStudio.tsx` approve/reject branch); AuditDefense `notify` is inside the `.then()` of the defense fetch and gated on `mode === 'fabrication'` + `rejected.length > 0`; Settings `toast` is inside the `onChange` handler `handleDefaultPersonaChange`. None run during render.
- **The two intentional reset effects** in FilingStudio/AuditDefense carry a `biome-ignore useExhaustiveDependencies` and key off persona — pre-existing pattern, they do not call `notify`/`toast`.

### #2 — AppShell popover refactor non-regression (VERIFIED)

- **`profileOpen: boolean` → `activePopover: 'notifications'|'profile'|null` is mutually exclusive by construction** — a single state holding one of three values; opening one (`toggle*` sets the other-or-null) cannot leave both open (`AppShell.tsx:53,123-136`).
- **Profile popover still works.** Settings button → `setActivePopover(null)` + `navigate('/settings')` (`:299-302`); Sign Out → `setActivePopover(null)` + `localStorage.removeItem('cp_entered_as_guest')` + `navigate('/')` (`:306-313`) — byte-identical guest-flow logout to the prior version.
- **Outside-click + Escape close both popovers.** One effect keyed on `activePopover` adds `keydown`(Escape→null) + `pointerdown`(outside `topbarControlsRef`→null) and cleans both up on change/unmount (`:103-119`). Because both the bell and profile live inside the same `topbarControlsRef` container (`:167`), a click on either button is "inside" and handled by the button's own `toggle`, while a click anywhere else closes. Correct.
- **Bell opens → `markAllRead()`** inside the click handler (`:126-129`) so the unread badge clears on view; this is user-initiated, not a render effect.
- **Entity switcher, theme toggle, drawer, brand links intact.** The `<select>` (`:195-220`), theme button (`:184-192`), hamburger/drawer (`:145-156,330-376`), and brand `<Link to="/dashboard">` (`:159,340`) are unchanged from `main` except for living beside the new bell. Drawer Escape effect (`:93-100`) is separate and unchanged.

### #3 — Triggers tie to real events/data only (VERIFIED)

- **Deadline seeds derive from real obligations.** `getObligations(tin, ssm)` (`AppShell.tsx:83`, signature `client.ts:495`) → `seedDeadlines(cal.obligations)`; each notification's kind/body is **computed** from the real `status` field + `diffDays` arithmetic against `due_date` (`notifications.tsx:104-134`). Overdue→error, ≤30d→warning, further-out→skipped (noise control). No hardcoded notification content; titles/bodies interpolate the real `form`/`due_date`.
- **Action triggers fire on actual events.** Filing finalize/return on the real HITL approve/reject resolution; fabrication-rejection only when the **computed** `verified=false` row is present (`AuditDefense.tsx:44-52`) — consistent with the deterministic-gate honesty invariant from the prior BE-18/FE-6 verdicts; default-entity change on the real Settings `onChange`. Network errors are swallowed silently (`AppShell.tsx:87-89`) so a failed fetch does not spam toasts.

### #4 — State hygiene (VERIFIED)

- **IDs are stable + unique.** `nextId()` = `` `${Date.now()}-${counter++}` `` (`notifications.tsx:40-41`); a module-level monotonic `counter` guarantees uniqueness even within the same millisecond (the prior batch-seed loop adds several in one tick). **No array-index keys** — every list/toast uses `key={n.id}`/`key={t.id}` (`AppShell.tsx:258`, `notifications.tsx:187`).
- **`unreadCount`/`markAllRead`/`dismiss` correct.** `unreadCount = notifications.filter(n => !n.read).length` (`:149`); `markAllRead` maps `read:true`; `dismiss` filters by id; "Clear all" iterates `dismiss(n.id)` (`AppShell.tsx:246`). Badge caps at `9+` (`:234`).
- **Lists are bounded** — both `notify` and `seedDeadlines` `.slice(0, 30)` (`:71,138`).
- **No timer leak of consequence, but see Minor.** Toast auto-dismiss uses `setTimeout(() => dismissToast(id), 4000)` (`:60`); manual dismiss filters the toast out so the later timeout is a harmless no-op (filter on an absent id). See Minor M1 re: not clearing timers on unmount.

### #5 — Non-regression elsewhere + hygiene (VERIFIED)

- **Provider placement is safe.** `<NotificationProvider>` wraps `<BrowserRouter>` inside `<ActivePersonaProvider>` (`App.tsx`), so `useNotifications` is available to every routed page incl. consoles/dashboard/guest flow; the `ToastContainer` renders once at the provider root (`notifications.tsx:156`). Guest flow (`/dashboard` reachable, Sign Out clears the flag) unchanged.
- **Tokens-only colors.** `grep -nE '#[0-9a-fA-F]{3,8}'` over `notifications.tsx`/`AppShell.tsx`/`icons.tsx` → 0; added `tokens.css` lines → 0 hex. `kindColor`/`kindDotColor` map to `var(--mustard|--rust|--denim)` only.
- **No user-facing em-dashes** in the new strings (titles/bodies use hyphens); the only `—` occurrences are in code comments.
- **Title Case titles.** "Entity Switched", "Fabricated Citation Rejected", "Filing Finalized", "Filing Returned", "Default Entity Updated", "{form} Deadline" — all Title Case.
- **No AI attribution** in the diff (grep → 0).

### Findings

**Critical:** none. **Major:** none.

**Minor (non-blocking):**

- `frontend/src/notifications.tsx:60` — [minor, timer hygiene] The toast `setTimeout` handle is never stored or cleared. On `NotificationProvider` unmount (in this SPA the provider lives for the whole session, so it never actually unmounts — hence not Major) any in-flight 4s timeouts fire after teardown and call `setState` on an unmounted tree → a benign React "state update on unmounted component" warning in the worst case. → Optional fix: keep a `Set<timeoutId>` ref, clear it in a `useEffect(() => () => timers.forEach(clearTimeout), [])`, and `clearTimeout` in `dismissToast`. Not blocking for the prelim (single long-lived provider).
- `frontend/src/notifications.tsx:145-147` — [minor, code smell] `_clearSeeds` is monkey-patched onto the `seedDeadlines` callback via `as unknown as { _clearSeeds }` and reassigned on every provider render, then reached through another `as unknown` cast in `AppShell.tsx:74`. It is functionally correct and loop-safe (the callback identity is stable; the reassignment just swaps the closure), but it hides a side-channel through a function object's property. → Optional cleaner shape: expose `clearSeeds` as its own `useCallback` in the context value (alongside `seedDeadlines`) rather than attaching it to the callback. Cosmetic; no behavior change.
- `frontend/src/notifications.tsx:98` — [trivial, dead param] `seedDeadlines` declares a second param `_tinKey?: string` that is never used (and the caller passes only `cal.obligations`). Underscore-prefixed so biome is quiet. → Optional: drop the unused param. Harmless.
- `frontend/src/notifications.tsx:171` vs `:169` — [trivial, design note] `warning` and `success` both map to `var(--mustard)` in `kindColor`/`kindDotColor`, so a warning and a success toast are color-indistinguishable (they differ only by the `WARN`/`OK` text label). Intentional within the 4-token palette; note only.

**Informational (no action):**

- `notify()` opening the bell does NOT auto-open the popover — it only increments the badge + fires a toast; the user opens the bell to read history. Matches the spec (`notify` = bell+toast). Correct.
- The persona-switch uses `notify` (bell+toast, persists in history) while Settings default-change uses `toast` (transient only) — a deliberate, sensible split (a switch is a stateful event worth logging; a pref change is ephemeral feedback).

### Verified clean (no action)

- **Surgical:** every changed line traces to the notification feature — provider, bell UI + popover refactor, 4 trigger sites, icon, and CSS. No tax figures, citations, core math, backend, or unrelated console logic touched. Routing table unchanged except the provider wrap.
- **Build graph:** `notifications.tsx` is imported and resolved (build = 66 modules, up from 65); no orphan.

**Smoke test:** `cd frontend && bunx tsc --noEmit` → **exit 0, clean** · `bun run build` (`tsc -b && vite build`) → **66 modules transformed, dist/ emitted, exit 0** · `bunx biome check frontend/src` → **"Checked 29 files, no fixes applied", exit 0** · `git status` → `notifications.tsx` **untracked** + 7 tracked modified (no sprawl) · hex scan of new/changed TSX + added CSS → **0** · em-dash scan of new strings → **0 in copy** (comments only) · AI-attribution scan → **0** · `getObligations(tin, ssm)` signature matches the AppShell call · loop trace → all fire paths guarded (stable callbacks, ref-guarded effect, user-initiated handlers).

**Return to PM:** **Approve with comments.** Priority #1 (loops): clean — all context callbacks are stable `useCallback`s, the seeding effect's deps are module-constant persona references so it re-runs only on a genuine switch, the persona-switch toast is `prevTinRef`-gated against mount, seeding is double-guarded (`seededTinRef` + per-key `seededRef` Set), and every action toast fires inside a user-initiated async handler — no path re-fires on re-render. Priority #2 (popover refactor): clean non-regression — `activePopover` makes bell/profile mutually exclusive, profile Settings/Sign Out work (logout byte-identical), one effect closes both on Escape + outside-click, and the entity switcher/theme/drawer/brand links are untouched. Triggers tie to real `getObligations` data and real events (no fabricated content); IDs are unique and never array-index; colors are tokens-only; titles Title Case; no AI attribution. All gates green (tsc / 66-module build / biome 29 files). **One must-do before commit: `git add frontend/src/notifications.tsx` — it is currently untracked, so the diff under-reports the surface and `main` would fail to compile without it.** Four Minor/trivial non-blockers (toast timers not cleared on unmount; `_clearSeeds` monkey-patch smell; unused `_tinKey` param; warning/success share `--mustard`). No Critical/Major. Ready for Gate-2 once the new file is staged.

---

## [25/06/26] — Wave C: Landing Hero Image + FAQ (items 1 + 6)

**Scope:** `frontend/` — new `faqData.ts` (21 Q/A, 5 categories, 5 featured), `pages/Faq.tsx`+`Faq.css`, `public/marketing/hero-background.webp`; modified `Landing.tsx`/`Landing.css` (hero bg + scrim, featured-FAQ section), `App.tsx` (`/faq` route), `layouts/AppShell.tsx` (FAQ nav link).

**Verdict:** Approve

The diff is clean, honest, and surgical. Content-honesty (#2) and untracked-files (#1) — the two priority checks — both pass. No blocking findings.

### Hard gates (all PASS)

- **tsc:** `cd frontend && bunx tsc --noEmit` → exit 0, clean.
- **build:** `bun run build` → `tsc -b && vite build` green (69 modules, dist emitted; `dist/marketing/hero-background.webp` copied).
- **biome:** `bunx biome check frontend/src` → 32 files, **0 errors**.

### #1 Staging trap (CONFIRMED — action for PM)

`git status` confirms **4 untracked paths** that MUST be staged or `main` breaks (TS won't compile — `Faq.tsx`/`faqData.ts` are imported by `App.tsx` and `Landing.tsx`; `/faq` 404s without the route's component; hero loses its image):

- `frontend/src/faqData.ts`
- `frontend/src/pages/Faq.tsx`
- `frontend/src/pages/Faq.css`
- `frontend/public/marketing/hero-background.webp` (untracked under `frontend/public/` — `git status` shows the dir, not the file)

The `.webp` is a valid `RIFF/WebP VP8 1672x941` image, 74.9 KB. All four are imports/assets of already-modified tracked files, so a partial stage would break the build — stage the full set together.

### #2 FAQ content honesty (PASS — priority)

Read all 21 answers. **No fabricated rates, thresholds, prices, statistics, or legal guarantees.** Sovereignty is correctly scoped to _inference/processing_ throughout, never an unqualified "all data stays in Malaysia" storage claim (matches spec §7.3 honest framing — persistence is on Neon SG, only inference is in-country):

- `faqData.ts:52` ("Where Does the AI Inference Run?") — "your tax data is **reasoned over** within Malaysia" → scoped to inference. Correct.
- `faqData.ts:57` ("What Does Sovereign Inference Mean Here?") — "sensitive financial figures are **processed** under Malaysian jurisdiction" → scoped. Correct.
- `faqData.ts:131` ("How Is My Data Handled?") — "designed to keep sensitive tax data **processed** in-country via sovereign inference" → no storage/residency claim; adds demo-fixtures caveat. Correct.
- `faqData.ts:91` ("What Year Are the Figures Based On?") — explicitly "We do not publish invented rates in this FAQ" → exemplary; cites YA2026 as the assessment year (matches spec) without inventing a number.
- `faqData.ts:104`/`108`/`62`/`67`/`75`/`81` — "decision support, not an auto-filer", "not legal or tax advice", deterministic-core-owns-the-math, citation-gate-rejects-fabrications: all align with `docs/trd.md` / spec, no overclaim.

### #3 Search + filter (PASS)

`Faq.tsx:11-18` — filters by `q`+`a`, case-insensitive (`.toLowerCase()`); category chips filter; combined search+category via `&&`; empty query short-circuits (`!needle`) so no crash; count `filtered.length` with correct singular/plural (`:85`); empty state + Clear Filters renders (`:88-94`). `key={item.q}` is stable. Correct.

### #4 Routing / nav (PASS)

`App.tsx:40` — `/faq` is nested under the `<AppShell />` parent route (gets shell chrome). `AppShell.tsx:360-362` — "FAQ" `NavLink` is in the **Workspace** drawer section. `Landing.tsx` "See All Questions" `Link to="/faq"` (`Link` already imported `:2`). Featured set derived from `FAQ_ITEMS.filter(featured)` (5 items). Correct.

### #5 Hero legibility (PASS)

`Landing.css` — hero composites a per-theme scrim gradient over `url("/marketing/hero-background.webp") center / cover`. Light: paper-tone `rgba(236,231,216,0.86)`; dark: ink `rgba(16,20,28,0.9)` / inline `0.97→0.12` directional. Text keeps `var(--ink)`, so no white-on-white / black-on-dark. rgba scrims over the image are acceptable per brief.

### #6 Hygiene / non-regression (PASS)

- **No em-dashes** in `faqData.ts` / `Faq.tsx` copy (grep clean).
- **Title Case** headings throughout (FAQ questions, "Straight Answers, No Fabrication.", "See All Questions", "Clear Filters").
- **Tokens elsewhere:** new dark-theme `.lp-faq { background: #161d29 }` (`Landing.css:688`) is a literal hex, but it matches the file's **pre-existing** dark tonal-ramp pattern (`.lp-how #1d2634`, `.lp-trust/.lp-finale #0c1018`) — no `--window`-dark token exists, so this is consistent with existing style, not a regression. Note only, no fix required.
- Landing's other sections, AppShell chrome, and the three consoles are untouched (diff is additive: +36 tsx, +139 css).

**Smoke test:** `bunx tsc --noEmit` (exit 0) · `bun run build` (green, webp copied to dist) · `bunx biome check frontend/src` (0 errors).

---

## [25/06/26] — Wave D · Dashboard Redesign (data-driven hero · quick-access rail · balanced overview) `[FE]`

**Branch:** `main` (working tree, uncommitted). Surface: `frontend/src/pages/Dashboard.tsx` (restructured) + `frontend/src/styles/tokens.css` (+325 additive `.dash-*` block) + docs (`progress.md`, `test.md`). `git diff main --stat -- frontend/` confirms exactly these two FE files — **no sprawl** into other pages/shell/consoles.

**Verdict:** Approve

The redesign is data-faithful end-to-end: every figure on the page (hero, status summary, deadlines, snapshot) derives from a real `getObligations(persona.tin, persona.ssm)` + `getEntity` call. No fabricated activity, metrics, or timestamps. `leadObligation()` is correct (most-overdue wins, else nearest-upcoming), the countdown/overdue math reuses the prior-correct `daysUntil`, persona switch cleanly re-fetches + repaints, the all-caught-up and empty/error states all render without crashing, and the tokens.css change is purely additive + scoped + token-only. All three gates green. No Critical/Major findings; a couple of Minor notes below are non-blocking. Recommend authorizing the commit.

### Hard gates (all PASS)

- **tsc --noEmit:** exit 0, clean.
- **bun run build:** green — `tsc -b && vite build`, 69 modules transformed, `dist/` emitted in 2.33s.
- **biome check frontend/src:** 32 files, **0 errors**.

### Review focus — findings

**1. Real data only (priority) — VERIFIED.**

- Hero (`PrimaryAction`) renders only from `lead: Obligation | null` + `overdueCount` (both computed from the live `calendar.obligations`). The rail shows `lead.rule_id` / `lead.config_version` — real provenance, not invented (`Dashboard.tsx:132-135`).
- `StatusSummary` (`:447-471`): `total`, `overdue`, `next due` all computed from `calendar.obligations` — returns `null` while loading/null so no placeholder numbers flash.
- `DeadlinesPanel` (`:188-319`): maps real `calendar.obligations`, sorted by `daysUntil`.
- `SnapshotPanel` (`:323-443`): every row from a real `entity` field (`entity_type`, `msic_codes`, `sst_registered`, `basis_period_*`, `employee_count`, `paid_up_capital`, `gross_income`, `tin`) via `useEntity`/`getEntity`. No invented KPIs.
- `leadObligation()` (`:52-59`): overdue items filtered (`daysUntil < 0`), most-overdue sorted first; else nearest-upcoming by ascending `daysUntil`. Correct.
- Countdown/overdue math (`daysUntil`/`countdown`, `:15-30`) normalises both dates to local midnight before the day-delta — same correct logic as the prior slice. No fabrication anywhere.

**2. Persona switch non-regression — VERIFIED.** The fetch effect is keyed on `[persona.tin, persona.ssm]` (`:482-495`) and clears `calendar` + sets `loading` before each fetch, so no stale paint. `persona` is selected from the static module-level `PERSONAS` array (`PersonaContext.tsx` reads from `./personas`), so `persona.ssm` is a **stable reference per persona** — the effect fires exactly once per switch (no miss, no over-fire). `SnapshotPanel` additionally carries `key={`snap-${persona.tin}`}` (`:519`) forcing a remount; redundant with `useEntity`'s own `resolvedTin`-keyed effect but harmless. Hero/summary/deadlines/snapshot all repaint on switch.

**3. tokens.css additive + scoped + token-only — VERIFIED.** Diff is `+325 / -0` (raw `grep -cE '^\-[^-]'` → 0 removed lines); file grew 1348 → 1673. The new block (`:1330-1653`) is inserted _before_ the pre-existing `@media (prefers-reduced-motion)` block, which is carried through unchanged as context (NOT duplicated — only one reduced-motion block exists in the file). All selectors are `.dash-*` / scoped descendants — no existing class or `:root` token altered. Colors use tokens throughout (`--denim`, `--rust`, `--paper`, `--ink`, `--ink-soft`, `--mustard`, `--window`, `--border`, `--shadow`, `--radius`, fonts); the only literal colors are `rgba(...)` shadow/border opacities (e.g. `4px 4px 0 rgba(28,27,25,.22)`, `border-left: 1px solid rgba(236,231,216,.28)`) — no opaque hex duplicating a named token. All inline styles in the panels (`:204-438`) likewise reference token vars only.

**4. Loading / empty / error — VERIFIED.** The obligations fetch has explicit `loading` + `error` state; `DeadlinesPanel` renders distinct loading (barber + "Loading obligations…"), error (`--rust` message), and empty ("No obligations found.") branches and never indexes into an undefined list (`calendar ? […] : []`, `:193`). The all-caught-up hero (`lead === null`) renders its own copy + "Open Obligation Calendar →" CTA without crashing (`:71-86`). `obligations = calendar?.obligations ?? []` (`:497`) guards the null-calendar case so `leadObligation([])` returns `null` cleanly. No crash on empty.

**5. Non-regression + hygiene — VERIFIED.** Surface = Dashboard.tsx + tokens.css (+docs) only. No em-dashes in any user-visible copy (em-dashes appear solely in tokens.css comment headers, matching the file's pre-existing house style). Headings are Title Case ("What You Can Do", "Upcoming Deadlines", "Entity Snapshot"). All links resolve to real routes — hero/quick-access target `/obligations`, `/filing`, `/audit-defense`, each present in `App.tsx:41-43`; deadlines/calendar footer link → `/obligations`.

### Minor notes (non-blocking)

- `Dashboard.tsx:519` — [trivial] The `key={`snap-${persona.tin}`}` remount of `SnapshotPanel` is redundant with `useEntity`'s `resolvedTin`-keyed effect (the panel would re-fetch on switch regardless). Harmless; leaving it is fine.
- `Dashboard.tsx:204-438` — [minor, style] The two overview panels use extensive inline `style={{…}}` objects rather than scoped `.dash-*` classes like the hero/console rail. All values are token-backed so there's no token-discipline or theming issue, but it's a stylistic inconsistency with the rest of the new block. Out of scope for this slice (visual polish owned by the later ui-ux pass) — note only, no fix required.
- `SnapshotPanel` footer "Seeded · BE-8 / getEntity" (`:439`) is a provenance label, not fabricated data — correct and honest about the source.

### Verified clean (no action)

- **No invented data:** grepped the new render paths — every number/string traces to a real `Obligation` or `EntityTaxProfile` field. No hardcoded activity feed, fake timestamps, or placeholder metrics.
- **Layout:** grids use `minmax(0, 1.55fr) minmax(260px, 1fr)` with `min-width:0` on flex/grid children and `overflow:hidden`/`text-overflow:ellipsis` on the form badge (`:253-256`), so no overflow on long type labels; `@media (max-width:900px)` collapses both grids to single-column and hides the vertical hero rail. No visible broken-grid/overflow bug in code.
- **No removed/altered existing CSS:** `-0` lines; pre-existing reduced-motion block intact.

**Return to PM:** **Approve.** Dashboard redesign is data-faithful (real `getObligations`+`getEntity` only — zero fabrication), persona switch re-fetches without stale paint, and the tokens.css change is purely additive + scoped + token-only. All three gates green (tsc clean · build 69 modules · biome 0 errors); empty/loading/error/all-caught-up states all handled; routes correct; no sprawl. No Critical/Major findings — recommend authorizing the commit.

**Smoke test:** `bunx tsc --noEmit` (exit 0) · `bun run build` (green, 69 modules) · `bunx biome check frontend/src` (0 errors).

---

## [26/06/26] — USABILITY + END-TO-END JOURNEY REWORK (Waves J0–J4: BE-J1/J2, JR-1…JR-8) `[BE]` `[FE]`

**Branch:** `main` (working tree, uncommitted). 19 modified + 9 untracked. Reviewed: `backend/api/{main,persistence}.py`, `backend/pyproject.toml`, `backend/uv.lock`, new `backend/tests/api/test_{create_entity,upload}_endpoint.py` + `trial_balance.{csv,xlsx,pdf}`; `frontend/src/{App.tsx,PersonaContext.tsx,api/client.ts,hooks/useEntity.ts}`, `frontend/src/layouts/{AppShell,WizardLayout}.tsx`, `frontend/src/pages/{AuditDefense,AuthScreen,Dashboard,FilingStudio,ObligationRadar,Settings,CustomCompany,Welcome}.tsx`, new `frontend/src/components/JourneyProgress.tsx`.

**Verdict: APPROVE WITH COMMENTS** — Gate-2 PASS for the demo. One **major** FE↔BE contract mismatch (`createEntity` body shape) defeats live BE persistence but is fully masked by the fallback-first design (custom entities work end-to-end from localStorage); one **minor** uncaught-500 edge on `POST /entities` not reachable through the UI. Neither blocks the demo. Both should be fixed before relying on live `POST /entities`. All hard gates green.

### Per-area PASS/FAIL

| Area                                                    | Verdict                          | Notes                                                                                                                                                                                                             |
| ------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BE-J1 `POST /entities` (create/upsert/persist)          | **PASS w/ comments**             | 200+echo, 422 on bad ssm, upsert-safe, in-memory fallback never crashes. See M1 (FE body mismatch) + m1 (non-dict ssm → 500).                                                                                     |
| BE-J2 `POST …/documents/upload` (file→text→classify)    | **PASS**                         | CSV/XLSX/PDF extract in-process (csv/openpyxl/pypdf), 415/422/502 guards correct, identical `ClassifyResponse` shape, no foreign API. `tin` not looked up → custom TIN never 404s.                                |
| Deps + uv.lock                                          | **PASS**                         | `pypdf`, `openpyxl`, `python-multipart` added to pyproject; `uv.lock` +592 lines incl. pypdf/openpyxl/python-multipart/et-xmlfile. `python-multipart` correctly present (FastAPI `UploadFile` requires it).       |
| JR-1 white-screen invariant (custom TIN resolution)     | **PASS**                         | `useEntity` resolves `customPersonas` match BEFORE `getEntity` — no mock throw, no live 404. Every former `PERSONAS` static reader (AppShell, Settings, Dashboard) now uses context `personas`.                   |
| JR-2 wizard chrome (reuse, no fork)                     | **PASS**                         | `WizardLayout` mounts the real consoles via `<Outlet/>`; no copied console bodies. Entity-pin is "intent-documented" not enforced (acceptable known limit — don't switch persona mid-wizard).                     |
| JR-3 welcome + flags/routing                            | **PASS**                         | `cp_journey_done` gates `/welcome` vs `/dashboard`; both on-ramps + skip wired; `/start/custom` route exists (no dead-end).                                                                                       |
| JR-4 connective tissue (JourneyProgress)                | **PASS**                         | Single shared component (JourneyMap/JourneyStrip/WhatNext) reused in 3 places, no divergent copies; footers appended additively; progress derives from the real flag only.                                        |
| JR-5 Audit-Defense rework                               | **PASS**                         | Free-text + 3 chips + FE-simulated 4-stage pipeline + pack-shape preview + elevated fabrication money-shot. Two-tier trace, 502 handler, persona-reset, SovereignBadge, `notify()` all preserved.                 |
| JR-6 custom-company form                                | **PASS w/ comments**             | Captures all `EntityTaxProfile` fields, `addCustomPersona` (localStorage) + best-effort `createEntity` (non-blocking), 422 surfaced as friendly note. Live BE write currently always 422s — see M1.               |
| JR-7 file-upload UI + paste fallback                    | **PASS**                         | `uploadDocument` uses `FormData` with NO JSON content-type; drop zone + browse + paste all functional; upload error reverts to idle with friendly message (no white-screen).                                      |
| JR-8 Obligations calendar + payoff                      | **PASS**                         | Calendar + headline derived entirely from `data.obligations`; year span computed from real `due_date`s; overdue flagged `--rust`. No fabricated rate/threshold/amount.                                            |
| JR-9 (deferred)                                         | **PASS (correctly NOT shipped)** | Plan box left `[ ]`; grep for band rates / "how this was taxed" / what-if → 0 hits. No half-built band card.                                                                                                      |
| Sign-Out / flag correctness (JR-Q5)                     | **PASS**                         | Sign-Out removes ONLY `cp_entered_as_guest`; KEEPS `cp_journey_done` and does NOT clear `cp_custom_entities` — matches the brief.                                                                                 |
| Grounding / citation discipline                         | **PASS**                         | No fabricated tax figure/rate/threshold in any new FE. Example-query strings (RM4,800 etc.) are user-typed labels into a free-text box, not asserted figures; all verdicts/citations/exposure come from API data. |
| Non-regression (consoles/HITL/badge/notifications/auth) | **PASS**                         | Filing stepper/HITL/96px hero/FigureTrace/one-shot/badge, Audit two-tier/502, Obligations list/snapshot, notifications, auth/guest, Settings all intact. Wizard reuses consoles.                                  |
| AI attribution                                          | **PASS**                         | `git diff HEAD` grep for co-authored/generated-with/claude-code/noreply@anthropic/🤖 → 0.                                                                                                                         |

### Findings

**Major (fix before relying on live `POST /entities`; NOT a demo blocker):**

- `frontend/src/api/client.ts:567` (`createEntity`) ↔ `backend/api/main.py:116` (`create_entity`) — [major] **Body-shape contract mismatch.** FE does `post('/entities', ssm)` → sends the SSM fields **flat** as the JSON body. BE does `req.get("ssm", {})` → expects `{ssm: {...}}`. Verified empirically: flat body → **422**, wrapped body → **200**. So in LIVE mode every custom-company server write returns 422 and the user sees the "could not save to server" note (`CustomCompany.tsx:199-201`). The demo is unaffected because the design is fallback-first (`addCustomPersona` runs first, local entity stays fully usable, consoles thread the inline `ssm`), and in MOCK mode `createEntity` is a no-op echo — but JR-6's acceptance criterion "with BE up it also lands via `POST /entities`" is NOT met. → Fix EITHER: change FE to `post('/entities', { ssm })`, OR change BE to accept a flat body (e.g. `_profile(req)` directly, or type the endpoint with a `{ssm: dict}` schema). Pick one and align. (The PG flagged "verify createEntity hits the same path" — path is correct; the **body shape** is the mismatch.)

**Minor (non-blocking):**

- `backend/api/main.py:117` (`_profile` via `create_entity`) — [minor] **Uncaught 500 on non-dict `ssm`.** `EntityTaxProfile(**ssm)` raises `TypeError` (not `ValidationError`) when `ssm` is a string/list/number, and the 422 handler only catches `ValidationError` → `POST /entities {"ssm":"x"}` returns **500**. Not reachable via the FE (which always sends an object), and the other endpoints are immune because their typed Pydantic request models reject a non-dict `ssm` with 422 before `_profile` runs — `/entities` is the only endpoint taking `req: dict` untyped. → Fix: add `TypeError` to the caught tuple in `_profile`, or type the endpoint with a Pydantic model (`class CreateEntityReq(BaseModel): ssm: dict`), which also fixes M1's contract ambiguity at the same time.

- `frontend/src/layouts/WizardLayout.tsx:44-63` — [minor, accepted] The "entity pin" is documentation-of-intent (a `useRef` that is never read) rather than an enforced guard; if a user switches persona via the topbar mid-wizard, `FilingStudio` will still reset (its own `persona.tin` effect fires). Acceptable per the plan ("the real protection is: don't switch persona mid-wizard"); the empty `useEffect` at `:60-63` is dead but harmless. Note only.

### Smoke test

- `cd backend && uv run pytest -q` → **116 passed, 1 warning** (pre-existing Starlette/httpx deprecation). Matches the expected count; the 9 new BE-J1/J2 tests (5 upload + 4 create) all green; existing suite unregressed.
- `cd frontend && bunx tsc --noEmit` → **exit 0, clean.**
- `cd frontend && bun run build` → **`tsc -b && vite build`, 73 modules transformed, dist/ emitted, exit 0.**
- `bunx biome check frontend/src` (from repo root) → **"Checked 36 files. No fixes applied", exit 0.**
- Empirical contract probes: flat `/entities` body → 422; wrapped `{ssm}` → 200; non-dict `ssm` → 500 (m1); upload `tin` not looked up (no 404 on custom TIN); `uv.lock` shows pypdf/openpyxl/python-multipart/et-xmlfile.

**Return to PM:** **APPROVE WITH COMMENTS (Gate-2 PASS).** The journey rework is contract-faithful and demo-safe: the JR-1 white-screen invariant holds (custom TIN resolves from local state before any network call), every former static-PERSONAS reader uses the context list, the wizard reuses consoles with no forked logic, all non-regression surfaces (HITL/badge/two-tier trace/502/notifications/auth) are intact, and grounding is clean (no fabricated figures; JR-9 correctly deferred with no half-built artifact). Gates all green: pytest **116**, tsc clean, build 73 modules, biome 0 errors. **One major** (`createEntity` sends a flat body but BE-J1 expects `{ssm}` → live persistence silently 422s; masked by fallback-first localStorage, so the demo works) and **one minor** (non-dict `ssm` → uncaught 500, unreachable via UI). A single fix — typing `/entities` with a `{ssm: dict}` Pydantic model and sending `{ ssm }` from the FE — closes both. Neither blocks the live demo; recommend approving the commit with the two-line fix as a fast follow before depending on live `POST /entities`.

---

## [26/06/26] — WALKTHROUGH-FEEDBACK REWORK (Waves 0-4)

**Branch:** `feat/walkthrough-rework` (5 commits, uncommitted to `main`). Reviewed `git diff main...HEAD` (30 files, +4784/-2518): BE foundation (guest auth + per-user entity/filing CRUD), FE refinements + Tooltip, entity/persona-on-backend + guest token, filing dashboard, conversational audit assistant.

**Verdict: APPROVE (Gate-2 PASS)** — ship-safe to a live-deploying `main`. Two MINOR copy nits + one MINOR robustness note below; none block. No blockers, no majors.

### Smoke test (all gates green)

- `cd backend && uv run pytest -q` → **158 passed, 1 warning in 11.42s** (was 118; +40 new: guest auth, /me/entity, /me/filings). **0 regressions.**
- `cd frontend && bunx tsc --noEmit` → **exit 0, clean.**
- `cd frontend && bun run build` → **`tsc -b && vite build`, 81 modules transformed, dist/ emitted, exit 0.**
- `bunx biome check frontend/src` → **"Checked 44 files. No fixes applied", exit 0.**
- BE contract probes (in-memory fallback, `DATABASE_URL=`): `POST /auth/guest` → 200, `sub == GUEST_USER_ID`; idempotent seed → exactly **1** guest row after 3x ensure; `/me/entity` 401 (no token) · 404 (never-saved) · 200 (put→get) · **422** (bad ssm, not 500) · 401 (garbage token); `/me/filings` create→list→get→multi-delete round-trip, foreign id → 404, multi-delete foreign id → no-op. **No uncaught-500 path found.**

### Per-area results (PASS/FAIL)

| Area                                                                         | Verdict        | Notes                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **W0 — `POST /auth/guest` (shared user, idempotent)**                        | PASS           | `GUEST_USER_ID="guest-shared"` single source; `ensure_guest()` keeps fixed id, idempotent (1 row); endpoint re-seeds defensively so it never 500s.                                                                                                                                                                    |
| **W0 — `GET/PUT /me/entity`**                                                | PASS           | `_owner` dep 401s without bearer (via `_bearer_user`); 422 on bad ssm (`_profile`); 404 before first save; per-`sub` isolated; `UserEntityRepository` fallback-first.                                                                                                                                                 |
| **W0 — `/me/filings` CRUD**                                                  | PASS           | create/list/get/single+multi-delete, owner-scoped, 401/404/422 correct, multi-delete skips foreign ids (no-op verified), `FilingRepository` fallback-first. Additive `filing_records` table (existing `filings` untouched).                                                                                           |
| **W0 — tests**                                                               | PASS           | 40 new tests incl. per-`sub` isolation, foreign-id no-op, 401/404/422. Hermetic (force in-memory).                                                                                                                                                                                                                    |
| **FE — bearer on authed calls**                                              | PASS           | `authHeaders()` attaches `Authorization: Bearer` to every `get`/`post`/PUT/DELETE.                                                                                                                                                                                                                                    |
| **FE — `continueAsGuest()` → `/auth/guest`**                                 | PASS           | Now async; `authGuest()` → `persist`-style token store in `cp_token`; `isGuest` flag; `AuthScreen.onGuest` awaits before navigating.                                                                                                                                                                                  |
| **W2 — Custom entity from `GET /me/entity` (not localStorage)**              | PASS           | `PersonaContext` hydrates "Custom" from `getMyEntity()`; `cp_custom_entities` + `cp_active_persona` data stores **gone** (confirmed: no key in `src`).                                                                                                                                                                |
| **W2 — `CustomCompany.tsx` persists via backend** _(flagged uncertain)_      | **PASS**       | Submit calls `addCustomPersona(persona)` → which calls `putMyEntity(p.ssm)` (PUT /me/entity, best-effort) + sets active persona to Custom, then navigates to `/start/obligations`. Confirmed end-to-end.                                                                                                              |
| **W2 — `/entity` PUT + active Custom; seeds pristine**                       | PASS           | `Entity.tsx` awaits PUT then `activateCustomPersona`; `PERSONAS` never mutated; 422 surfaced.                                                                                                                                                                                                                         |
| **W3 — `/filing` records dashboard**                                         | PASS           | `FilingStudio.tsx` is now the list (newest first, single-row open, checkbox multi-select + Delete, empty state, New Filing CTA, heading InfoTip, no WhatNext).                                                                                                                                                        |
| **W3 — `/filing/new` one-shot**                                              | PASS           | Drives `getFormC` (one-shot); no start/resume, no Human Approval stage; saves via `saveFiling` → navigates `/filing/[id]`; guided trial-balance input + paste fallback. Uses **`entity.tin`** (not `persona.tin`).                                                                                                    |
| **W3 — deterministic-core trust note + per-figure trace**                    | PASS           | Explicit "computed by the deterministic, rule-based core -- not the AI" copy; `TechnicalDetails` per-figure `rule_id`/`config_version`/inputs disclosure.                                                                                                                                                             |
| **W3 — `/filing/[id]` saved record**                                         | PASS           | 96px RM hero (`ComputationPanel`) on top + collapsible `TechnicalDetailsDisclosure` pipeline at bottom; reuses primitives, not forked.                                                                                                                                                                                |
| **W4 — Audit Assistant picker + empty state**                                | PASS           | Picks saved filing from `/me/filings`; empty state links `/filing/new`; trust headline + InfoTip preserved.                                                                                                                                                                                                           |
| **W4 — chat, seeded questions, evidence, fabrication**                       | PASS           | Per-message `getAuditDefense(filing.tin, query, evidence, inject)`; evidence + ≤5 suggested questions derived from `rec.computation.fields` (real figures); Trust Demo turn surfaces `verified=false` BLOCKED stamp + `notify()`; 502 → assistant error turn without breaking thread; switching filing resets thread. |
| **X — wizard sequence**                                                      | PASS           | `WIZARD_STEPS`: `/start/obligations` → `/start/filing/new` → `/start/audit-defense`; Finish/Skip → `/dashboard` (only at end). `/start/filing/new` route mounts `FilingNew`.                                                                                                                                          |
| **X — "Reset all data" non-destructive**                                     | PASS           | `UI_PREF_KEYS = [theme, cp_journey_done]` only; no `/me/*` DELETE; navigates `/welcome`; confirm copy states saved company/filings unaffected.                                                                                                                                                                        |
| **X — light theme default**                                                  | PASS           | `useTheme`: `readStoredTheme() ?? 'light'`; no `systemTheme()`; media listener removed.                                                                                                                                                                                                                               |
| **X — floating `?` true bottom-right + scoped**                              | PASS           | `position:fixed; bottom:20; right:20`; `WALKTHROUGH_ROUTES` = dashboard/analytics/obligations/filing(+/\*)/audit-defense/entity; hidden on settings/faq/about/marketing/auth.                                                                                                                                         |
| **X — nav groups**                                                           | PASS           | Workspace (Dashboard, Analytics) · Compliance (Obligations, Filing, Audit Defense, Entity) · Essentials (Settings, FAQ, About). Topbar `<select>` + drawer `X` removed.                                                                                                                                               |
| **X — no fabricated tax figures**                                            | PASS           | All filing figures from `getFormC`/core computation; audit figures from `rec.computation.fields`; only hardcoded RM is the labelled fabricated decoy (`ITA-1967-s999-FAKE RM50,000`) in the Trust Demo.                                                                                                               |
| **X — non-regression (auth, notifications, marketing, FAQ, brand, journey)** | PASS           | Registered email/pwd + Google flows untouched; Entity-Switched toast + deadline re-seed intact in AppShell; WhatNext fully removed (no orphan imports); BE-18 money-shot + sovereign badge + two-tier trace preserved.                                                                                                |
| **X — no em-dashes in NEW user-facing copy**                                 | **MINOR FAIL** | 2 new user-facing strings carry em-dashes (see findings).                                                                                                                                                                                                                                                             |

### Findings

- `frontend/src/pages/AuditDefense.tsx:144` — **[minor]** New user-facing JSX copy uses an em-dash: `verified=false — fabricated clause IDs cannot pass.` → replace `—` with `-` or rephrase. (Violates the "no em-dashes in new copy" gate; cosmetic.)
- `frontend/src/pages/Entity.tsx:60,302` — **[minor]** New file carries em-dashes in user-facing strings: the MSIC validation message `... — must be 4-5 digits` (copied from `CustomCompany`) and `... active entity — the seed remains selectable`. → swap `—` for `-`. (Cosmetic; `CustomCompany`'s identical pre-existing strings are out of this rework's "new copy" scope.)
- `frontend/src/pages/AuthScreen.tsx:99-106` + `frontend/src/AuthContext.tsx:107-118` — **[minor / by-design]** If `continueAsGuest()`'s live `POST /auth/guest` throws, `onGuest` swallows it and still navigates; no token is stored, so subsequent `/me/*` calls would 401. This is the intended best-effort/fallback-first degradation (mock never throws; a reachable BE returns a token; `getMyEntity().catch()` handles 401/404 gracefully → empty Custom). No fix required for the demo; note for live hardening.
- `backend/api/main.py:208` (`_owner`) — **[minor / robustness]** Re-decodes the token and returns `claims["sub"]`; a (hypothetical) token minted without a `sub` would `KeyError` → 500. Unreachable today (every `create_token` sets `sub`), so informational only. Could use `claims.get("sub")` + 401 for defense-in-depth.

**Return to PM:** **APPROVE — Gate-2 PASS.** All five waves are contract-faithful and demo-safe: BE suite **158/158** (was 118, +40, zero regressions), FE `tsc`/`build`/`biome` all green, empirical probes confirm 401/422/404 boundaries with no uncaught-500 path, guest seed is idempotent with a stable `sub`, the `CustomCompany` backend-persistence path (the flagged-uncertain item) is confirmed via `addCustomPersona → putMyEntity`, all business data is off localStorage, the wizard/reset/theme/nav/`?`-scope cross-cutting items all match spec, and no fabricated tax figures exist (the only decoy is the labelled BE-18 trust demo). The only defects are **3 minor em-dashes in new copy** and **2 informational robustness notes** — none block a live-deploying merge. Recommend authorizing the squash-merge; the em-dash swaps can land as a trivial fast-follow.

---

## [27/06/26] — BE-2.1 (PR-A): filing draft/pending persistence + `status` field + nullable computation + PATCH upgrade `[BE]`

**Branch:** `feat/filing-draft-persistence` (working tree, uncommitted vs `main`). Files: `backend/migrations/neon_schema.sql`, `backend/api/schemas.py`, `backend/api/persistence.py`, `backend/api/main.py`, `backend/tests/api/test_filing_drafts.py` (new, 13 tests), one edited line in `backend/tests/api/test_me_filings_endpoint.py`.

**Verdict:** Approve with comments

The draft→final lifecycle is correct, additive, and Chaos-safe; the migration is purely additive on both the fresh-install and ALTER paths; per-owner isolation, 401/404/422 boundaries, and fallback-first all hold; the suite is green at **193**. One **Major** spec-fidelity gap: `status` is typed `str` with **no `draft|final` validation**, so a bogus `status='foo'` is silently stored (empirically confirmed). Decision #2 / the BE-2.1 schema bullet say `status` is `draft | final` — the value is currently unconstrained at the boundary. Not a runtime crash and the FE only ever sends the two valid values, but it violates the stated contract and is a 1-line fix. Two Minor notes below. None block `main`, but I recommend the human ask PG to add the `Literal` constraint before merge since this PR ships alone into the shared backend lane and the column will outlive the FE that feeds it.

### Smoke test (green)

- `cd backend && uv run pytest -q` → **193 passed, 1 warning** (pre-existing Starlette/httpx `TestClient` deprecation, unrelated). Matches the expected 193.
- No AI attribution in the diff (`co-authored|generated with|claude code|noreply@anthropic|robot-emoji` → 0).

### Required-behavior verification (against plan BE-2.1 + TRD §7a)

1. **Migration safety (critical) — PASS.** `neon_schema.sql`: the fresh-install `CREATE TABLE IF NOT EXISTS filing_records` now carries `status text NOT NULL DEFAULT 'final'` + `raw_text text`; **and** two idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements for pre-existing tables. The `_ensure_table` inline DDL in `persistence.py:266-275` agrees field-for-field (same inline `CREATE` + same two `ALTER` guards). No column is dropped, renamed, or retyped; `computation jsonb` stays nullable as-is. Existing rows backfill `status='final'` (Postgres applies the `DEFAULT` to existing rows on `ADD COLUMN ... NOT NULL DEFAULT`) and `raw_text=NULL`. The migration-safety note is present both in the SQL (`:70-79`) and is required in the PR body. **Additive and Chaos-safe — touches only `filing_records` + its repo/endpoints, not auth/entity/obligation paths.**

2. **Schema / Pydantic — PASS (with the Major caveat on `status`).** `FilingRecordReq.computation` is now `dict | None = None` (optional end-to-end); `status: str = "final"` keeps legacy finalized POSTs valid by default; `raw_text: str | None = None`. New `FilingRecordPatch` has all-optional fields (`computation`, `risk_flags`, `line_items`, `status`, `label`, `raw_text`). A bad-typed `computation` ("not-a-dict") → **422** confirmed. **Gap:** neither `FilingRecordReq.status` nor `FilingRecordPatch.status` is a `Literal["draft","final"]` — see Finding M1.

3. **Repository — PASS.** `create` threads `status` (default `"final"` if absent) + `raw_text` into both the in-memory record and the Neon `INSERT` (now 9 columns); `list`/`get` SELECT `COALESCE(status,'final')` + `raw_text` (legacy DB rows backfill) and the in-memory paths run through the new `_coalesce` helper (backfills `status`/`raw_text` for pre-existing in-memory records). New `update(owner, rec_id, patch) -> dict | None` is **owner-scoped**: in-memory-first match by id, then best-effort Neon `UPDATE ... WHERE id=%s AND user_id=%s RETURNING ...`; returns the merged record or `None` when not owned/absent. Fallback-first preserved (in-memory mutated before the DB attempt; DB error → in-memory stays consistent), matching the existing `create` pattern. Empirically: a foreign id → `None`/404 with **no mutation of the real owner's row** (confirmed).

4. **Endpoint — PASS.** `PATCH /me/filings/{rec_id}` resolves the owner via `_owner` (401 without a token — confirmed for both missing and malformed tokens), strips `None` patch keys, calls `update`, and 404s when `update` returns `None` (missing id and foreign id both → 404, confirmed). 422 on a bad body (confirmed). Upgrades the **same** record id draft→final: list length unchanged at 1 (test `test_patch_list_length_unchanged` + empirical). One record, not a duplicate.

5. **Tests — PASS.** `test_filing_drafts.py` genuinely covers draft-create (id + `status='draft'` + null computation), draft-in-list (+ `raw_text` round-trip), PATCH-to-final-same-id (+ `raw_text` preserved, not overwritten), list-length-unchanged, foreign-owner 404, missing-id 404, no-token 401, bad-computation 422, legacy-record-without-status → backfills `final` (via direct `_mem` injection — a real legacy shape), legacy-final-POST defaults `final`, per-owner isolation, and multi-delete on a draft. The edited `_BAD_BODY` in `test_me_filings_endpoint.py` (`{"tin":"X"}` → `{"tin":"X","computation":"not-a-dict"}`) is a **legitimate** consequence of `computation` becoming optional: the old body relied on `computation` being _required_ to force a 422; now that it is optional, the test correctly switches to a _type_ violation to still exercise the 422 path. Not a masked regression — `test_post_filing_validation_422` still asserts 422.

6. **No regression / boundaries — PASS.** Deterministic core (`core/`) untouched; no secrets; per-owner isolation intact (a foreign `sub` sees `[]`, cannot PATCH); no auth/entity/obligation behavior changed. Full suite 193/193.

### Findings

**Major (spec fidelity; recommend fixing before merge — not a runtime blocker):**

- `backend/api/schemas.py:9` (`FilingRecordReq.status`) + `:18` (`FilingRecordPatch.status`) — **[major]** `status` is `str`, not validated against `draft|final`. Empirically a `POST`/`PATCH` with `status='foo'`/`'bogus'` is **silently stored** and surfaces in `list`/`get` (probed: `CREATE bogus status: 200 -> foo`; `PATCH bogus status: 200 -> bogus`; the bad value then appears in the records list). Decision #2 and the BE-2.1 schema bullet specify `status` is `draft | final`. Because this PR ships alone into the shared backend lane and the column outlives the FE that feeds it, an unconstrained `status` lets garbage persist (and would let a future caller, or a hand-rolled request, poison the `/filing` status filter FE-2.5 relies on). → Fix: type both as `Literal["draft", "final"]` (with the existing default), so an out-of-set value returns the consistent 422 envelope. ~1 line each; add one assertion (`POST status='foo' → 422`).

**Minor (informational / by-design):**

- `backend/api/main.py:268` (`patch_my_filing`) — **[minor / by-design]** the patch dict comprehension drops every `None` value (`if v is not None`), so a PATCH can **never explicitly null** `computation`, `raw_text`, `label`, etc. — only set them to a non-null value. This is exactly right for the draft→final upgrade (you fill `computation`, you never clear it), and it is what makes "partial patch" safe (omitted fields are untouched). Flagging only because it means there is no way to revert a record's `computation` to `NULL` via this endpoint; no current use case needs that. No fix required.
- `backend/api/persistence.py:391-401` (`update` Neon branch) — **[minor / informational]** when `DATABASE_URL` is set but the row exists only in memory (not yet flushed to Neon, or written in a prior fallback window), the `UPDATE ... RETURNING` finds no row and the method returns `mem_rec` (the in-memory-merged record), which is the correct fallback-first behavior. Worth a one-line note that, in the rare in-memory-only-then-DB-up transition, the Neon row stays stale until the next `create`/`delete` reconciles — acceptable for the prelim's best-effort durability (DB-down ≠ demo-down), consistent with the existing `create` semantics. No fix required.

### Edge-case probes (beyond the test file)

- **Empty-body PATCH** (`{}`) → **200 no-op**, returns the unchanged record with the same id (patch dict is empty → `update` merges nothing in memory; the Neon branch's `if set_parts:` guard skips the SQL). Reasonable (idempotent no-op rather than 422). Note: this means PATCHing a _missing_ id with an empty body against an in-memory repo returns `None` → 404 correctly; against a live DB the empty-`set_parts` path skips the UPDATE and returns `mem_rec` (None for a foreign/absent id) → 404. Consistent.
- **Final → draft** via PATCH → **allowed** (`200`, status flips back to `draft`). No rule in the plan forbids a downgrade; acceptable.
- **Draft with `computation=None` in `list`** → appears correctly with `status='draft'`, `computation: null` (confirmed). FE renders "N/A" tax payable per FE-2.5.
- **`status` validation** → **NOT enforced** (the Major above).

**Return to PM:** **Approve with comments — Gate-2.** BE-2.1 is correct, additive, and Chaos-safe: migration is additive on both the fresh `CREATE` and the `ALTER IF NOT EXISTS` paths (existing rows backfill `final`, `computation` stays nullable, nothing dropped/retyped); `computation` is optional end-to-end; `PATCH /me/filings/{id}` upgrades the **same** record draft→final (one record, list length unchanged); per-owner isolation + 401/404/422 + fallback-first all verified empirically; **193/193** tests green (the expected count). The one defect worth fixing before merge is **Major M1: `status` is unvalidated `str`** — a bogus `status='foo'` is silently stored, violating the `draft|final` contract; a 1-line `Literal` fixes it. Two Minor notes are by-design (None-stripping patch; in-memory-only-then-DB-up staleness). No Critical, no regression, no AI attribution. Recommend the human authorize the squash-merge **after** the `Literal` tightening (or accept M1 as a fast-follow if they prefer to unblock FE-2.4/2.5 now).

---

## [27/06/26] — PR-B: WALKTHROUGH-2 FE refinements (FE-2.1/2.2/2.3/2.4/2.5/2.7)

**Branch:** `feat/walkthrough2-fe` (uncommitted working tree vs `main`). **FE-2.6 intentionally NOT in this PR** (deferred to PR-C) — verified the file is still `AuditDefense.tsx`, route still `/audit-defense`, plan boxes 6a/6b/6c remain `[ ]`.

**Verdict:** **Approve with comments** (PASS). All three hard gates green; every approved checkbox is genuinely satisfied against the locked Gate-1 resolutions. No Critical, no Major, no regression to the money-shot / sovereign badge / auth / wizard / Neon paths. The findings are all Minor/Trivial dead-code-and-cosmetic items that can land in this PR or as a fast follow.

### Hard gates (all PASS)

- **`bunx tsc --noEmit`** → exit 0, clean.
- **`bun run build`** (`tsc -b && vite build`) → exit 0; 83 modules; `dist/` emitted (js 358 kB / 101 kB gz); 0 warnings.
- **`bunx biome check frontend/src`** → 46 files checked, **0 errors, 0 warnings**.

### CRITICAL regression probe (the `/audit-assistant` entry) — CLEAR

`WALKTHROUGH_ROUTES` (`AppShell.tsx:9-18`) gained `/audit-assistant`, but that array is consumed **only** by `isWalkthroughRoute()` (`:20-22`) — a passive matcher that decides whether the `?` walkthrough button shows on the current path. It is **not** a nav-link generator. The drawer Audit NavLink still points to `/audit-defense` with label "Audit Defense" (`AppShell.tsx:497-498`); `App.tsx:64,72` still define `/audit-defense`; no `/audit-assistant` route exists and **nothing links to it**. Therefore the entry does **NOT** create a user-visible nav link that 404s — it is harmless premature config. **No other dangling links:** wordmark `to="/"` resolves to the `index` Landing route (`App.tsx:36`); all drawer NavLinks resolve. **Does not block.** (Finding T3 below: remove the premature entry or defer it to PR-C with the rename.)

### Per-task verification vs locked resolutions

- **FE-2.1 Tooltip (global) — PASS.** `maxWidth` is viewport-relative (`Math.min(280, vw - 2*MARGIN)`, `Tooltip.tsx:36`) applied to the bubble before measuring; BOTH axes clamped after measure incl. a real **bottom-edge** clamp (`:50-52`) on top of the top-flip (`:46-48`); `reposition` re-runs on `scroll`+`resize` while open with listener cleanup on close (`:65-71`); component/`InfoTip` API + `aria-describedby`/`role="tooltip"`/Escape untouched. Edge-reasoning: at all four edges the clamps compose correctly (top→flip-below→clamp-bottom; left/right hard-clamped to `MARGIN`). The static `maxWidth:280` was removed from inline style and re-applied imperatively within the same rAF, so no flash. No regression to existing InfoTip callers.
- **FE-2.2 dividers (global) — PASS (with cosmetic notes T1/T2).** New `.row-list` / `.row-div-list` helpers (`tokens.css:1733-1773`) use the **full-width-top-border** technique (`* + *` → `border-top`; `:last-child` → no bottom border). Because `.window` carries no horizontal padding (`tokens.css:95-102`) and the rows are full-width with their own padding, the top border reaches both window outlines = full-bleed, and the last-row/window-border collision is removed. Inline per-row `border*` were **replaced** (not duplicated) in FilingStudio records, AuditDefense picker, Analytics lists, FilingPipeline StageRow, FilingRecord stages — confirmed via diff.
- **FE-2.3 Analytics (LOCKED option b) — PASS.** "Overdue Exposure" stays the single primary visual (bars retained); "Status Breakdown" + "By Form Type" collapsed into one `StatusAndFormCounts` component rendering compact count rows in a 2-col grid (bars removed). All data retained (overdue / within-30 / on-track counts + per-form counts). InfoTips remain on `.titlebar` headings only; the page `<h1>` carries none. Token-CSS only; loading/error/empty states intact.
- **FE-2.4 /filing/new (consumes PR-A) — PASS.** `createDraftFiling` (POST status:'draft', computation:null) on classify holds `draftId` in state (best-effort try/catch — a BE hiccup does not block classify); on compute `upgradeFiling(draftId, {…status:'final'})` upgrades the SAME record then navigates to `/filing/${targetId}`; a `saveFiling` fallback covers the no-draft case (BE was down at classify) — one record either way. Manual "Save Filing"/"Start Over" block + `handleSave` + the `'saving'` phase tag are removed (no orphans; `handleReset` is correctly **retained** — its surviving caller is the pre-compute "Start Over" at `FilingNew.tsx:593`, a different button). Result-view order = Computed → (Risk) → Pipeline → technical-details (`:613-651`), mirroring `FilingRecord.tsx`. Provenance prose folded into the Computed-card heading `InfoTip` via the new `ComputationPanel headingTip` prop (`FilingPipeline.tsx:209-233`) — on a card heading, never an `<h1>`. **FULL RESUME** works: a draft `/filing/[id]` redirects (`FilingRecord.tsx:178-181`) to `/filing/new?resume=<id>`, which restores `raw_text` + `draftId` (`FilingNew.tsx` resume effect). `client.ts` types match the PR-A contract: `computation: FormComputation | null`, `status:'draft'|'final'`, `raw_text?: string|null`, PATCH via `upgradeFiling`. Mock store carries `status`/`raw_text` and supports draft-create + by-id PATCH merge (demoable with no backend).
- **FE-2.5 /filing filters — PASS.** Form-type (`computation?.form ?? tin`) + status (All/Pending=draft/Final) + sort (newest/oldest/tax-payable) selects, all `aria-label`'d and keyboard-usable. Select-all + Delete operate on the derived **visible** `sorted` set (`toggleAll`/`allSelected` rewritten against `sorted`); "No filings match" empty state; New-Filing CTA retained. Draft rows show a mustard **Pending** pill + N/A tax payable and still link to `/filing/[id]`. Mock create-draft → lists under the Pending filter.
- **FE-2.7 sidebar (LOCKED OQ-7) — PASS (with Minor M1).** Entity NavLink moved ABOVE Obligations (`AppShell.tsx:485-490`). Desktop-only invisible `.drawer-hotzone` (`tokens.css` `@media (pointer:fine) and (min-width:768px)`, `display:none` otherwise) opens the existing drawer on `onMouseEnter` (`:450-456`) — no `onMouseLeave`, so it never auto-collapses. Closes via the existing backdrop `onClick={closeDrawer}` (`:465`) + Escape (`:237`) + nav-click — matching the lock. Wordmark (topbar `:289-292` + drawer brand `:469`) routes to `/`. Hamburger still opens (and sets `drawerPinned`). Mobile drawer/backdrop/Escape unchanged. Hotzone is hidden on touch (`pointer:coarse`) = desktop/pointer:fine only, as required.

### Findings

**Minor**

- **M1 — `AppShell.tsx:190` `drawerPinned` is dead state.** It is declared and written (`setDrawerPinned(true)` in the hamburger handler, `setDrawerPinned(false)` in `closeDrawer`) but its **value is never read** anywhere (`grep drawerPinned` across `frontend/src` returns only the declaration). The Gate-1 lock (close-on-click-outside, never on cursor-leave) means there is no auto-collapse path for it to guard, so it has zero behavioral effect. The PG self-flagged this in `progress.md` but left the dead state in. Biome does not flag it (the setter is "used"). → Suggested fix: remove `drawerPinned`/`setDrawerPinned` entirely (and the two setter calls), OR — if the PO actually wants a manual "pin" that survives a future cursor-leave behavior — wire it into a guard. Not blocking; the observable behavior already matches OQ-7.

**Trivial**

- **T1 — `tokens.css:1726-1731` comment is inaccurate.** The `.row-list` comment says the full-bleed is achieved "via negative-margin so the 1px line reaches the .window left/right outline", but the implementation uses plain full-width top borders (no negative margin). The result is still correct full-bleed; only the comment is misleading. → Reword the comment to describe the full-width-row technique actually used.
- **T2 — `FilingPipeline.tsx:236-330` `ComputationPanel` section bands not converted.** The plan's FE-2.2 enumerated "ComputationPanel section bands (`:230,266,291`)" among the targets, but only `StageRow`'s `borderBottom` was removed/converted. The section-header bands ("Computed Liability"/"Supporting Figures") still use inline `borderBottom`/`borderTop`. These are full-width section-header strips (not inter-row dividers) directly inside the window, so they are already full-bleed and do NOT collide with the window bottom border — leaving them is visually correct. → Optional: note as a knowingly-skipped sub-target; no visual defect.
- **T3 — `AppShell.tsx:17` premature `/audit-assistant` in `WALKTHROUGH_ROUTES`.** Harmless (see CRITICAL probe above — it is not a nav link and cannot 404), but it is dead config until PR-C lands the rename. → Either drop it now or let it ride with the PR-C rename; documented in `progress.md` deviations.

### Edge cases reasoned (no defects found)

- **Tooltip at all four viewport edges** — top-flip then bottom-clamp compose; left/right hard-clamped to `MARGIN`; responsive `maxWidth` prevents the far-right `.titlebar-meta` overflow that motivated FE-2.1. OK.
- **Resume when a draft has no `raw_text`** — `if (rec.raw_text) setRawText(...)` leaves `rawText` at the persona demo default and still sets `draftId`, so the user resumes into an editable flow against the correct record (graceful degradation). OK; documented as expected.
- **Filters + delete on a filtered subset** — select-all/Delete bind to `sorted` (visible) only; hidden rows are never selected or deleted; clearing a filter restores them. OK.
- **Hotzone on touch devices** — `.drawer-hotzone` is `display:none` outside `@media (pointer:fine) and (min-width:768px)`; no touch/tap can trigger it. OK.
- **Draft form-type bucketing** — a draft (null computation) buckets under its `tin`; its later final buckets under `form`. Minor UX inconsistency, but matches the plan's stated `?? tin` fallback. Acceptable.

### Non-regression

Money-shot path (BE-18 fabricated-citation rejection in Audit), sovereign badge, real auth (`AuthContext`/`ensureSession` guest mint), wizard, notifications, Neon/fallback client behavior all untouched. `App.tsx` routes unchanged. No tax figure/citation/rate introduced or altered. No `console.log`/debug leftovers. UI copy is em-dash-free (all em-dashes in the diff are in code/JSX comments, which the convention permits). Plan ticks match implementation (FE-2.1/2.2/2.3/2.4/2.5/2.7 `[x]`; FE-2.6 `[ ]`); `progress.md` has an honest dated entry incl. the self-flagged `drawerPinned` deviation.

**Smoke test:** `cd frontend && bunx tsc --noEmit` exit 0 · `bun run build` exit 0 (83 modules) · `bunx biome check frontend/src` 0 errors/0 warnings.

**Return to PM:** **Approve with comments — Gate-2.** PR-B is correct and complete against the locked Gate-1 resolutions for FE-2.1/2.2/2.3/2.4/2.5/2.7; FE-2.6 is correctly deferred (file/route/plan-boxes confirm it). All three hard gates pass. The CRITICAL `/audit-assistant` probe is **clear** — it lives only in the passive `WALKTHROUGH_ROUTES` matcher, is not a rendered nav link, and cannot 404. The only substantive note is **Minor M1: `drawerPinned` is dead state** (declared + written, never read; zero behavioral effect under OQ-7) — recommend deleting it (or wiring it) in this PR; the three Trivial items are cosmetic. No Critical, no Major, no regression. Recommend the human authorize the squash-merge, optionally after the 1-line `drawerPinned` cleanup.
