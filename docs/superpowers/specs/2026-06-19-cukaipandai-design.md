# CukaiPandai — Design Document

> Status: **validated in brainstorming (2026-06-19)**, ready for `writing-plans`. Produced via the Superpowers brainstorming flow. Consolidates the locked decisions; supersedes the inception drafts ([../../prd.md](../../prd.md), [../../trd.md](../../trd.md), and the former project-idea draft now folded into [../../cukaipandai-spec.md](../../cukaipandai-spec.md)) where they differ. Research backing: [../research/2026-06-19-tax-obligation-determination.md](../research/2026-06-19-tax-obligation-determination.md) and [../../initial-analysis/](../../initial-analysis/).

## 1. Overview

**CukaiPandai** — _smart tax, audit-ready_ — is an **agentic tax-assurance platform** for Malaysian enterprises and their licensed tax agents. It (a) **derives** which tax obligations an entity has, (b) prepares **cited** filings where every figure links to its source document **and** the Income Tax Act / Public-Ruling clause that justifies it, (c) flags **audit risk before filing**, and (d) on an LHDN audit query, **auto-assembles a cited defense pack**.

**Locked decisions (do not re-litigate):** name = CukaiPandai; Track 1 (Agentic AI for Internal Enterprise Operations); audit-defense-first positioning; deterministic-core + LLM-agents + human-in-the-loop architecture.

**Core design principle — generality lives in config, not code.** The engine is obligation-agnostic: each tax obligation (income tax, SST, e-invoice, WHT, employer/MTD…) is a **rule config**, so the platform is widely applicable and adding a tax = adding config, not re-architecting. _"Depth beats breadth"_ (NexHack brief) → build the general engine, **demo breadth** via a multi-obligation radar, **demo depth** on corporate income tax + the audit-defense hero.

## 2. Scope

**MVP (hackathon, 3–4 wks, must be demoable):**

- General **Obligation Rules Engine** + **Tax Computation Engine** (config-driven; income-tax config fully implemented).
- **Obligation Radar** deriving _multiple_ obligations for the seeded entity (income tax, e-invoice phase, SST, employer/MTD) — breadth on screen.
- **Cited Filing Studio** — deep end-to-end on **corporate income tax (Form C / CP204)**: doc ingest → treatment-with-citations → computation → citation-verify → audit-risk → human approve.
- **Audit-Defense Agent (hero)** — paste an LHDN query → cited defense pack + exposure (s.112/113).
- **Evidence Vault** + immutable audit log; **Citation Verifier**; pluggable **model adapter** (incl. ILMU sovereign mode toggle).

**Out of scope (MVP) / roadmap:** live MyTax submission; full SST/WHT/CGT/TP computation (configs stubbed, not fully built); multi-entity tax-agent console; e-invoice issuance at scale; billing.

## 3. Architecture & components

Stack-neutral (stack TBD by team — see §10). Components communicate through explicit interfaces so each is testable in isolation.

| Component                        | Type                   | Input → Output                                     | Notes                                                                                                |
| -------------------------------- | ---------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Profiler**                     | LLM + connectors       | entity id (TIN/BRN) → `EntityTaxProfile`           | Pulls SSM (mock), MyInvois (sandbox/fixtures), MySST (mock), uploads                                 |
| **Obligation Rules Engine**      | **Deterministic**      | `EntityTaxProfile` → `ObligationCalendar`          | Versioned config keyed to Year of Assessment; each obligation carries `rule_id`+`config_version`     |
| **Document-understanding agent** | LLM (multimodal) + OCR | files → normalized `LineItem[]` / extracted fields | Trial balance, receipts, invoices, EA forms, LHDN letters (BM/EN)                                    |
| **Deductibility reasoner**       | LLM + RAG              | `LineItem` → `{treatment, cited_clause_ids[]}`     | RAG over ITA 1967 + Public Rulings (stable clause IDs)                                               |
| **Tax Computation Engine**       | **Deterministic**      | treated items + profile → `FormComputation`        | Rates/bands/thresholds = config; emits per-figure trace `{value, inputs[], rule_id, config_version}` |
| **Audit-Risk agent**             | rules + LLM            | draft return + MyInvois ledger → `RiskFlag[]`      | Trigger checks, MyInvois mismatch, ratio anomalies (DOSM baselines)                                  |
| **Audit-Defense agent**          | LLM + RAG + tools      | LHDN query + Vault → `DefensePack`                 | Interpret → retrieve evidence → reason → draft cited response + exposure                             |
| **Citation Verifier**            | LLM critic + lookup    | any `cited_clause_id` + claim → `verified: bool`   | Re-checks clause supports the claim; **blocks** unsupported before human sees it                     |
| **Evidence Vault**               | store                  | —                                                  | Append-only `figure ↔ document ↔ clause`; immutable audit log of agent actions + human approvals     |
| **Model adapter**                | service                | OpenAI-compatible                                  | Routes by task/mode: deep-reasoning model (Claude/Gemini) + **ILMU Claw sovereign mode**             |
| **Orchestrator**                 | agent graph            | goal → coordinated run                             | plan→act→decide; **human-approval interrupt** before file/send                                       |

Frontend: **Obligation Calendar**, **Cited Filing Studio** (approval inbox), **Audit-Defense console**.

## 4. Data model (core)

`entities`, `obligation_profiles`, `obligations`, `documents`, `transactions`, `computations` (per-figure trace), `citations` (clause_id + verified), `audit_cases`, `evidence_links` (figure↔doc↔clause), `audit_log` (append-only). Full field list in [../../trd.md](../../trd.md) §8.

## 5. Data flow

**Filing:** onboard → Profiler builds `EntityTaxProfile` → Obligation Rules Engine → `ObligationCalendar` (deadlines holiday-shifted) → Filing Studio: doc-understanding → deductibility(+citations) → Computation Engine → Citation Verifier → Audit-Risk → **human approve** → Evidence Vault. **Audit-defense:** paste LHDN query → Audit-Defense agent retrieves Vault + ledger → reasons + computes exposure → DefensePack → Citation Verifier → **human approve/export.**

## 6. Agentic flow & deterministic gates

LLM agents never compute final tax or assert an unverified citation. The **deterministic engines compute and gate**; the **Citation Verifier gates** citations; the **human gates** filing/sending. This is the "deterministic agentic AI, policy-locked, audit-logged" pattern. (Agent topology in [../../cukaipandai-spec.md](../../cukaipandai-spec.md) §7.)

## 7. Model layer (pluggable; ILMU sovereign mode)

Single OpenAI-compatible adapter. **Default:** strongest available model for deep reasoning (Claude Opus 4.8 or Gemini 2.5/3.x — per team stack choice). **Sovereign mode:** route to **ILMU Claw** (Malaysian-hosted, OpenAI-compatible, BM/Manglish) for in-country data residency (PDPA). Deterministic engines are model-independent. Evidence: [../research/2026-06-19-tax-obligation-determination.md], ILMU OpenAI-compat `/v1/chat/completions` (console.ilmu.ai).

## 8. Demo data strategy

Seeded synthetic entity: SSM profile JSON + trial balance + **MyInvois sandbox or JSON fixtures (UBL 2.1 shape)**; curated **ITA 1967 + Public Rulings subset** as the law corpus (stable clause IDs); **mock SSM/MySST/MyTax** (licensed / no public API). Deterministic, reproducible scenarios for a flawless live run.

## 9. Testing strategy (TDD — RED→GREEN→REFACTOR)

- **Computation engine:** golden-file tests (known entity profile + items → known Form C figures).
- **Obligation rules engine:** profile → expected obligation set (table-driven).
- **Citation Verifier:** planted **fake citations must be rejected**; valid ones pass.
- **Audit-Defense:** seeded query → asserts the pack cites the correct evidence + clause.
  Every implementation task in the plan has a failing test written first.

## 10. Decisions (locked) & remaining assumptions

- **Tech stack — LOCKED:** FastAPI (Py 3.11) · LangGraph (HITL interrupts) · `LLMClient` adapter = `openai` SDK (OpenAI-compatible → ILMU Claw sovereign mode / Gemini) + `anthropic` SDK (Claude), provider via env · SQLite (MVP) → Postgres+pgvector (prod) · Docling for docs · Next.js + Tailwind + shadcn/ui · Docker. Rationale: ILMU is OpenAI-compatible, so the adapter makes ILMU/Claude/Gemini swappable by config — best sovereignty story, no GCP/ADK lock-in, lean for 2 devs. Full detail: [../../trd.md](../../trd.md) §12.
- **Team — LOCKED:** 2 developers — **Chaos** (backend/agents: Plans 1✅ & 2) and **Tuna** (frontend/demo: Plan 3). Ownership + the FastAPI interface contract in [../../prd.md](../../prd.md) §3 and [../../trd.md](../../trd.md) §2.1/§7a.
- **Remaining to obtain:** MyInvois sandbox credentials + ILMU Claw seat (mock until then); ⚠verify exact YA2026 tax figures vs LHDN.

## 11. Open ⚠verify list (reconcile vs LHDN/RMCD before the deck)

YA2026 SME rate bands + SME qualifying thresholds; SST registration thresholds/scope; CGT/TP thresholds; exact MyInvois prod host + endpoint schema + rate limits; SSM CSD field names. (Tracked in [../../trd.md](../../trd.md) §13 and the research doc.)

## 12. References

- Research: [../research/2026-06-19-tax-obligation-determination.md](../research/2026-06-19-tax-obligation-determination.md)
- Inception: [../../cukaipandai-spec.md](../../cukaipandai-spec.md), [../../prd.md](../../prd.md), [../../trd.md](../../trd.md), [../../initial-analysis/](../../initial-analysis/)
- Sources: LHDN https://www.hasil.gov.my/en/ · MyInvois SDK https://sdk.myinvois.hasil.gov.my/ · SSM https://www.ssm-einfo.my/ · MySST https://mysst.customs.gov.my/ · data.gov.my https://developer.data.gov.my/ · ILMU https://console.ilmu.ai/
