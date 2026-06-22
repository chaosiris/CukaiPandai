# CukaiPandai — Production Roadmap

From hackathon prototype → production tax-assurance platform. Each phase keeps the **non-negotiable guarantee**: deterministic tax math, every figure cited, citation verifier gating, human approval before any submission.

## Phase 0 — Hackathon MVP (now ✅)
- Deterministic core (obligation + computation engines, law corpus, citation gate, evidence vault).
- Agentic API (5 agents + LLM citation-critic, FastAPI, LangGraph HITL).
- YA2026 figures verified; 36 tests; seeded Acme demo.
- SSM/MySST mocked; MyInvois via fixtures.

## Phase 1 — Pilot-ready (0–3 months)
- **Frontend** (Plan 3): Obligation Radar, Cited Filing Studio, Audit-Defense console, approval UI.
- **Postgres + pgvector** (from SQLite); proper auth (tax-agent firm → multi-entity tenancy) + RBAC.
- **Docling** wired for real source-doc ingestion (trial balances, invoices, contracts).
- **MyInvois sandbox** live (within rate limits: Login 12 / Submit 100 / Get 60 / Details 125 RPM; honour 429 + Retry-After).
- Law corpus expanded: full ITA sections in scope + key Public Rulings, versioned + dated.
- Audit log → tamper-evident (hash-chained) export for LHDN.

## Phase 2 — Compliance-grade (3–9 months)
- **Live integrations**: SSM (CTOS/Infomina/MYDATA), MySST status, CTOS credit/risk.
- **Sovereign mode GA**: ILMU Claw in-country inference + data residency (PDPA) as the default for regulated/GLC buyers; per-tenant model routing.
- Coverage beyond Form C: **CP204/CP204A**, **SST-02**, **WHT (CP37 family)**, **CGT**, transfer-pricing doc thresholds.
- Quarterly **tax-config release process** (YA-keyed config, reviewed + signed off by a tax professional; regression golden tests per YA).
- SOC2-track controls; PDPA DPIA; pen-test.

## Phase 3 — Scale & autonomy (9–18 months)
- **Human-approved autonomous audit-defense** drafting across an agent's whole client book.
- Portfolio-level audit-risk analytics for tax-agent firms (benchmark a client vs cohort).
- Direct e-filing where LHDN APIs permit; otherwise guided submission + evidence export.
- Marketplace of jurisdiction packs (start MY; design the rules engine to be jurisdiction-pluggable).

## Cross-cutting (every phase)
- **Tax accuracy governance**: figures are config, never model-computed; each release reconciled vs LHDN/RMCD with citations; golden tests gate merges.
- **Responsible AI**: cited outputs, independent verifier, human sign-off, immutable audit trail.
- **Observability**: per-agent traces, citation-rejection metrics, cost/latency per provider.

## Key risks & mitigations
| Risk | Mitigation |
|---|---|
| Tax rules change mid-year | YA-keyed versioned config + dated law corpus + quarterly review |
| Gov data access is licensed/gated | Derivation-first design works without a single source; integrate providers incrementally |
| LLM hallucinates a citation/figure | Deterministic core + citation verifier + human approval (defense-in-depth) |
| Data sovereignty / PDPA | ILMU Claw sovereign mode — one env-var swap (OpenAI-compatible) |
| Liability for a wrong filing | Human-in-the-loop sign-off; full cited audit trail per figure |
