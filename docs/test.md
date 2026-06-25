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
