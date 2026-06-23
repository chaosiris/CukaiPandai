# CukaiPandai — Root Conventions

**CukaiPandai** is a sovereign, citation-grounded AI tax-assurance tool for Malaysian SMEs (obligation calendar · cited Form C filing · audit-defense).

For agent onboarding, architecture, and the PM pipeline see:

- **Agent onboarding (roles, gates, code style):** [`.claude/CLAUDE.md`](.claude/CLAUDE.md)
- **Workflow and gate definitions:** [`docs/roles.md`](docs/roles.md)
- **Architecture and API contracts:** [`docs/trd.md`](docs/trd.md)
- **Requirements:** [`docs/prd.md`](docs/prd.md)

---

## Conventions

### 1 — PM skill (mandatory)

Agents in this workspace **must follow the PM skill** at `.claude/skills/pm-workflow/` (SOURCE: https://github.com/AlaskanTuna/pm-workflow) when implementing any new feature or phase.

### 2 — PRs first, then self-merge via `gh` (Gate 2 gated)

Every commit + push goes through a **PR first**. After QA approves (Gate 2), the agent self-merges into `main` via the `gh` CLI (`gh pr merge --squash --auto`). Never `--force`, never merge unprompted without explicit human authorization at Gate 2.

### 3 — Read GitHub state before each new iteration

Before implementing in a new iteration, **read the latest PRs and recent commit history** of the GitHub repo first via `gh` (`gh pr list`, `gh pr view`, `gh log` / `git log`). Do not rely on session memory.

### 4 — Shared team state: `plan.md` + `progress.md` (no task-list.md)

`docs/plan.md` and `docs/progress.md` are **shared team state** — update them for every plan and every action taken. There is **no** `task-list.md` in this repo; do not create one.
