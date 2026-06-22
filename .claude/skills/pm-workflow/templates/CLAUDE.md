# CLAUDE.md

> **Read `docs/roles.md` first** — it defines your role, boundaries, and the gates in this project's PM-orchestrated workflow.

---

## Project

**{{PROJECT_NAME}}** — {{ONE_LINE_PURPOSE}}

{{OPTIONAL_CONTEXT_PARAGRAPH}}

---

## Architecture

{{ARCHITECTURE_SUMMARY — or: "See `docs/trd.md` (canonical). Do not create `docs/architecture.md`."}}

### Repo layout

```
{{REPO_LAYOUT}}
```

---

## Tech Stack

{{TECH_STACK — frameworks, languages, key libraries, infra, deploy target. Pin versions where they matter.}}

---

## Commands

```bash
{{COMMON_COMMANDS — install, dev, build, lint, test, deploy}}
```

---

## Code Style

- **Naming:** {{NAMING_CONVENTIONS}}
- **Types:** {{TYPE_RULES — e.g. "No `any`; prefer `unknown` + narrowing; Zod/Pydantic at boundaries."}}
- **Error handling:** Validate at system boundaries; do not wrap internal framework calls in try/catch.
- **Comments:** Default to none. Comment only when the _why_ is non-obvious. Never describe _what_ the code does.
- **Changes are surgical:** touch only what the task requires; match existing style; don't refactor what isn't broken.

---

## Working Conventions

- **CLI-first.** Configure via CLI tools over GUI where possible.
- **Commit gate.** Agents never push to origin without explicit human authorization at **Gate 2**. {{AGENT_COMMIT_POLICY}}
- **Log progress.** After each task, PG appends a dated entry to `docs/progress.md` and ticks `docs/plan.md`.
- **No secrets in repo.** `.env.example` committed, `.env` gitignored.

---

## Critical Do-Nots

- **Do not** `git push --force`, rewrite published history, or delete branches.
- **Do not** commit or push without explicit human authorization (Gate 2).
- **Do not** create `docs/architecture.md` — architecture lives in `docs/trd.md` if present.
{{PROJECT_SPECIFIC_DO_NOTS}}

---

## Agent Workflow & Documentation Protocol

This project runs the **PM → PL → PG → QA** pipeline defined in `docs/roles.md`, with two human gates:

1. **PL** writes `docs/plan.md` (after brainstorming).
2. **Gate 1** — PM shows the plan + open questions to the human for approval.
3. **PG** implements the approved tasks; ticks `docs/plan.md`, logs `docs/progress.md`.
4. **QA** reviews the diff into `docs/test.md` with a verdict.
5. **Gate 2** — PM relays the verdict. Reject → back to PG. Approve → PM proposes a Conventional Commit message and asks the human to authorize commit + push.

Reference `docs/prd.md` (requirements) and `docs/trd.md` (architecture/contracts) when they exist.

---

## Re-Read Discipline

Start every session by reading, in order: `docs/roles.md` → tail of `docs/progress.md` → `docs/plan.md` (open tasks) → `docs/prd.md`/`docs/trd.md` only when touching the matching domain. Do not rely on memory from prior sessions.

---

## Git Commit Convention

[Conventional Commits](https://www.conventionalcommits.org/): `<type>[scope]: <description>` — single imperative sentence, no trailing period. Allowed types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`. The PM proposes the message at Gate 2; the human authorizes the commit.
