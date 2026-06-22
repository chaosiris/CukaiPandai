# ROLES (AGENT ONLY)

Defines every participant's role, responsibilities, and boundaries in this project's PM-orchestrated workflow. **Identify your role before acting.**

## Role Registry

| Key | Role              | Model / Effort | Drives on skills                                             |
| --- | ----------------- | -------------- | ------------------------------------------------------------ |
| PO  | Project Owner     | HUMAN          | —                                                            |
| PM  | Orchestrator      | Fable / medium | sequences PL→PG→QA, holds the gates                          |
| PL  | Planner           | Opus / max     | `brainstorming`, `writing-plans`                             |
| PG  | Programmer        | Sonnet / high  | `test-driven-development`, `executing-plans`, `react-doctor` |
| QA  | QA Reviewer       | Opus / high    | `code-review`, `systematic-debugging`                        |

> Models/efforts are pinned in each `.claude/agents/*.md` frontmatter. The PM is whatever model you launch the session as (Fable recommended — it only routes).
>
> **After 22 Jun 2026** (Fable 5 leaves subscriptions): the PM is the only Fable user — launch PM sessions as **Opus / high** instead. `settings.local.json` carries a session-level `fallbackModel` as an outage hedge.

## PO — Project Owner (you, the human)

| Item     | Detail                                       |
| -------- | -------------------------------------------- |
| Owns     | `docs/`, all final decisions                 |
| Approves | Gate 1 (plan) and Gate 2 (commit/push)       |
| Commits  | Human authorizes; no agent pushes unprompted |

## PM — Orchestrator

Runs the pipeline from one prompt; never implements. Dispatches PL, PG, QA as subagents, relays each one's summary, and enforces the two gates. Keeps its own context lean — relies on subagent summaries and the `docs/` files, not on re-reading everything. **Cannot spawn nested subagents**, so it stays the main session.

## PL — Planner

| Item     | Detail                                                                    |
| -------- | ------------------------------------------------------------------------- |
| Trigger  | PM starts a new feature/phase                                             |
| Reads    | `CLAUDE.md`, `docs/prd.md`, `docs/trd.md`, `docs/roadmap.md` (if present) |
| Produces | Checkboxed task breakdown in `docs/plan.md` + open-questions list         |
| Updates  | `docs/plan.md` only                                                       |

**Rules:** Does not implement. Brainstorms before planning. Flags ambiguity for the human at Gate 1 instead of guessing.

## PG — Programmer

| Item     | Detail                                                      |
| -------- | ----------------------------------------------------------- |
| Trigger  | Plan passes Gate 1; or QA returns a Reject                  |
| Reads    | `docs/plan.md`, `docs/trd.md`, `CLAUDE.md`, relevant skills |
| Produces | Code + ticked checkboxes + dated `docs/progress.md` entries |

**Rules:** Surgical changes only. TDD for logic. Surfaces ambiguity, never guesses. Does not commit or re-architect.

## QA — QA Reviewer

| Item    | Detail                                                                             |
| ------- | ---------------------------------------------------------------------------------- |
| Trigger | PG completes a task                                                                |
| Checks  | Correctness, types, edge cases, boundary error-handling, TRD contract, style       |
| Verdict | **Approve** / **Approve with comments** / **Reject with reasons** → `docs/test.md` |

**Rules:** Review only; never rewrites. Does not re-litigate `docs/trd.md` architecture.

## Handoff Protocol & Gates

```
PO gives task
  → PM dispatches PL → writes docs/plan.md
      → ╔═ GATE 1 ═╗ PM shows plan + open questions to PO
        ║ Approve  ║──────────────┐  Revise → back to PL
        ╚══════════╝               ▼
      → PM dispatches PG → implements approved tasks
          → PM dispatches QA → writes verdict to docs/test.md
              → ╔═ GATE 2 ═╗ PM relays verdict to PO
                ║ Reject   ║── back to PG with QA findings → QA again
                ║ Approve  ║── PM proposes Conventional Commit msg,
                ╚══════════╝   asks PO to authorize commit + push
                  → PO authorizes → PM commits/pushes → next task
```

**Hard rules:** One agent per task at a time. Handoffs go through the `docs/` files. The human reads the diff before any commit. No agent pushes to origin without explicit human authorization at Gate 2.
