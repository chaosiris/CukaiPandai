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
