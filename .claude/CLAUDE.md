# CLAUDE.md

> **Read `docs/roles.md` first** — it defines your role, boundaries, and the gates in this project's PM-orchestrated workflow.

---

## Project

**CukaiPandai** — sovereign, citation-grounded AI tax-assurance for Malaysian SMEs (obligation calendar · cited Form C filing · audit-defense).

Every figure is traceable to a verified YA2026 source; fabricated citations are rejected by a verifier gate. The deterministic core is authoritative; the agent layer orchestrates but never invents numbers or law.

---

## Architecture

See `docs/trd.md` (canonical) and `docs/cukaipandai-spec.md` (design). Do not create `docs/architecture.md`.

Two layers: a **deterministic core** (`core/`) that owns all tax math, deadlines, citations and law-corpus lookups, and an **agentic API** (`api/`) that wraps it — 6 agents + a LangGraph filing graph with a HITL `interrupt`, exposed over FastAPI. The LLM is routed **ILMU-first** (sovereign `nemo-super`) with **Claude** as failover/escalation.

---

## Tech Stack

- **Backend:** Python ≥3.11 · Pydantic 2 · FastAPI + Uvicorn · LangGraph · httpx · `openai`/`anthropic` SDKs. Package manager: **uv** (primary). Deploy → **Render** (Docker image is deploy-ready).
- **Frontend:** Vite 5 + React 18 + TS + React Router 7 + token-CSS, reusing the ProofRank devkit design system; Bun. Deploy → **Vercel**.
- **LLM routing:** ILMU `nemo-super` primary (sovereign) → Claude failover/escalation.
- **Connectors:** MyInvois → full fixture; data.gov.my MSIC is the only live external call (spec §10).

---

## Common Commands

Run backend commands from the `backend/` directory (CWD-relative fixture paths).

```bash
# install (editable core + dev deps) — run from backend/
cd backend && uv sync --extra dev

# run the API (dev) — run from backend/
cd backend && uv run uvicorn api.main:app --reload

# tests — run from backend/
cd backend && uv run pytest -q

# pip fallback (also works): pip install -e ".[dev]"

# docker
cd backend && docker compose up --build
```

---

## Code Style

- **Naming:** snake_case for Python; descriptive module-level names matching `core/`/`api/` convention.
- **Types:** Pydantic at all system boundaries; no untyped dicts crossing the core↔api seam. The deterministic core stays pure (no LLM calls).
- **Error handling:** Validate at system boundaries; do not wrap internal framework calls in try/catch.
- **Comments:** Default to none. Comment only when the _why_ is non-obvious. Never describe _what_ the code does.
- **Changes are surgical:** touch only what the task requires; match existing style; don't refactor what isn't broken.

---

## Working Conventions

- **CLI-first.** Configure via CLI tools over GUI where possible.
- **Commit gate.** Agents may create commits and push **only after explicitly asking the human and receiving approval at Gate 2** — never unprompted, never `--force`.
- **Log progress.** After each task, PG appends a dated entry to `docs/progress.md` and ticks `docs/plan.md`.
- **No secrets in repo.** `.env.example` committed, `.env` gitignored.
- **Citation discipline.** Never introduce a tax figure, rate, threshold, or legal reference without a verified source; the citation verifier must be able to reject fabrications.

---

## Critical Do-Nots

- **Do not** `git push --force`, rewrite published history, or delete branches.
- **Do not** commit or push without explicitly asking the human and getting approval at Gate 2.
- **Do not** create `docs/architecture.md` — architecture lives in `docs/trd.md`.
- **Do not** let the agent layer compute tax figures or invent citations — that is the deterministic core's job (`core/`).

---

## Agent Workflow & Documentation Protocol

This project runs the **PM → PL → PG → QA** pipeline defined in `docs/roles.md`, with two human gates:

1. **PL** writes `docs/plan.md` (after brainstorming).
2. **Gate 1** — PM shows the plan + open questions to the human for approval.
3. **PG** implements the approved tasks; ticks `docs/plan.md`, logs `docs/progress.md`.
4. **QA** reviews the diff into `docs/test.md` with a verdict.
5. **Gate 2** — PM relays the verdict. Reject → back to PG. Approve → PM proposes a Conventional Commit message and asks the human to authorize commit + push.

Reference `docs/prd.md` (requirements) and `docs/trd.md` (architecture/contracts) when they exist. `plan.md`/`progress.md` are shared across the team and organized by the four lanes — **BE** (backend) · **FE** (frontend) · **DO** (devops/infra — tooling · CI · deploy) · **TD** (testing & docs).

---

## Re-Read Discipline

Start every session by reading, in order: `docs/roles.md` → tail of `docs/progress.md` → `docs/plan.md` (open tasks) → `docs/prd.md`/`docs/trd.md` only when touching the matching domain. Do not rely on memory from prior sessions.

---

## Git Commit Convention

[Conventional Commits](https://www.conventionalcommits.org/): `<type>[scope]: <description>` — single imperative sentence, no trailing period. Allowed types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`. The PM proposes the message at Gate 2; the human authorizes the commit.

---

<!-- andrej-karpathy-skills -->

## Karpathy Coding Guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

<!-- andrej-karpathy-skills -->

---

<!-- rtk-instructions v2 -->

## RTK — Rust Token Killer

### Golden Rule

**Only if `rtk` is installed** (`which rtk`) — not all teammates have it. If it's missing, visit the [source repository](https://github.com/rtk-ai/rtk) to install for the agent type or environment.

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:

```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

### RTK Commands by Workflow

#### Build & Compile (80-90% savings)

```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

#### Test (60-99% savings)

```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

#### Git (59-80% savings)

```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

#### GitHub (26-87% savings)

```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

#### JavaScript/TypeScript Tooling (70-90% savings)

```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

#### Files & Search (60-75% savings)

```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

#### Analysis & Debug (70-90% savings)

```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

#### Infrastructure (85% savings)

```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

#### Network (65-70% savings)

```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

#### Meta Commands

```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

### Token Savings Overview

| Category         | Commands                       | Typical Savings |
| ---------------- | ------------------------------ | --------------- |
| Tests            | vitest, playwright, cargo test | 90-99%          |
| Build            | next, tsc, lint, prettier      | 70-87%          |
| Git              | status, log, diff, add, commit | 59-80%          |
| GitHub           | gh pr, gh run, gh issue        | 26-87%          |
| Package Managers | pnpm, npm, npx                 | 70-90%          |
| Files            | ls, read, grep, find           | 60-75%          |
| Infrastructure   | docker, kubectl                | 85%             |
| Network          | curl, wget                     | 65-70%          |

Overall average: **60-90% token reduction** on common development operations.

<!-- /rtk-instructions -->

---
