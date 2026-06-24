# PLAN

> Owned by **PL**. The PM presents this at **Gate 1** for the human to approve before any implementation.
>
> **Structure:** uniformly **phase-oriented** — top-level sections are PHASES in execution order, and **every task carries an explicit lane tag** in its heading. Completed work is summarized concisely under [`## Done`](#done). Design & decisions → [`cukaipandai-spec.md`](cukaipandai-spec.md); current status → [`progress.md`](progress.md).
>
> **Lane tags:** `[BE]` = backend · `[FE]` = frontend · `[DO]` = devops/infra (tooling · CI · deploy) · `[TD]` = testing & docs. A task is tagged by its **primary** lane; cross-lane touches are noted inline.
>
> **Phases:** **Phase 0** — Monorepo Restructure (devops/infra) → **DONE** (PR #1, merged to `main`) · **Phase 1** — AI layer + core gaps → **DONE** (BE-1…BE-4, TD-1/TD-2; 79 tests) · **Phase 2** — Frontend consoles + FE-prereq backend (BE-8/BE-9/BE-10) + **sovereign RAG workstream (BE-12/13/14, parallel to the FE spine)** · **Phase 3** — Deploy, demo & submission (incl. BE-6 sovereign field + BE-7 CORS + FE-8 demo personas + **Neon Postgres persistence migration (DO-4 + BE-15/16/17, off the FE critical path)**; FE-9/BE-11 stretch). See [`## Timeline / milestones`](#timeline--milestones) for the dated path to **28 Jun 2026**.

---

## Open Questions / Assumptions

_PL lists anything ambiguous here for the human to resolve at Gate 1. Phase-0 restructure questions **RQ1–RQ6 are RESOLVED**; the Phase-1 spike resolved **Q1** and partially **Q2**. The escalation decision **Q6 is RESOLVED at Gate 1 (pure-ILMU)**; trial-balance ingestion **Q7 is RESOLVED (add the endpoint)**; RAG-scaling **Q8 is RESOLVED (local static embeddings + committed numpy index + authoritative gate)**; persistence **Q9 is RESOLVED (managed Neon Postgres full data layer, with a sovereignty caveat + self-hosted-MY prod path + a fixtures fallback)**. **Q3–Q5** remain open and resolve during their named tasks._

### Resolved this cycle (Phase-1 spike + Gate 1)

- [x] **Q1 (BE) — RESOLVED by the BE-1 spike.** Per-task routing is **decided**: `documents` (classify) and `deductibility` (cite) stay on `nemo-super`; the **citation-critic is the one weak step** (it answered NO on a clearly-supported s.33(1) claim live). `audit-defense` grounds correctly but its verdict is gated by the critic, so the critic is the single escalation point. _(Per Q6, escalation is deferred for the prelim — the critic runs on `nemo-super` and the deterministic gate carries the trust demo.)_
- [~] **Q2 (BE) — PARTIALLY RESOLVED.** ILMU early-access is **free during early access** (banner verified); whether tokens are **metered** under "Claw Starter ~RM27/seat/month" is **still unconfirmed** (treated as a seat/access fee per `[ASSUMPTION] A1`). Re-check `console.ilmu.ai/pricing` before the pricing slide (folds into **TD-3** + **TD-6**). Not a blocker.
- [x] **Q6 (BE) — RESOLVED at Gate 1 → PURE-ILMU for the prelim (stay fully sovereign).** For the 28 Jun submission CukaiPandai stays **100% on ILMU `nemo-super`**: the **fabricated-citation trust demo runs on the deterministic clause-ID gate** (`ground_citation`, no LLM), and we **accept `nemo-super`'s weaker semantic-critic** on the "valid claim shows ✓verified" badge. **Rationale:** (1) it makes the sovereignty story airtight — _every_ call is in-country, no asterisk; (2) the 4-day window favours cutting a non-critical integration; (3) it is **demo-safe** because the money-shot is the deterministic gate, which already works on pure ILMU. **Consequence:** **BE-5 (wire + live-test the escalation — sovereign ILMU model preferred; direct-Claude a flagged opt-in) is DEFERRED to post-prelim** — kept as a documented future task, **OUT of the 28 Jun critical path** (no secondary configured for the prelim; no PAYG/`ANTHROPIC_API_KEY` needed).
- [x] **Q7 (BE) — RESOLVED at Gate 1 → ADD the trial-balance ingestion endpoint.** `form-c` today takes structured `line_items: list[dict]`, but the `documents.classify_line_items` agent (raw text → `LineItem[]`) is **not exposed over HTTP** — so the Filing Studio can't go raw trial-balance → classified items → Form C. **Decision: expose it** (task **BE-9**) so the demo shows the document-understanding beat end-to-end. **Caveat surfaced by the code:** `documents.classify_line_items` calls `llm.complete(_SYS, raw_text)` **without** `json_schema=`, so it does **not** use JSON mode — putting it on a live HTTP path means its parse reliability now matters; **BE-9 includes wiring JSON mode** for it.
- [x] **Q8 (BE) — RESOLVED at Gate 1 → sovereign RAG = LOCAL STATIC EMBEDDINGS + committed numpy index; the deterministic clause-ID gate stays authoritative.** The TRD named pgvector as the RAG store; for the prelim that is **explicitly the scale path, not the build**. **Decision:** an offline-built, committed numpy index (`vectors.npz` + `chunks.json`) loaded at runtime via `lru_cache`, cosine top-k by matrix-multiply, **fail-open** (errors → `[]`, never raise); embeddings are **local static `model2vec`/potion** (~30–60MB token→vector lookup, no transformer at inference) so it fits **Render free tier (256MB RAM)** — `bge-m3` (~2GB) and `e5-small` (~300MB) both blow it. Fully sovereign (in-process, **no foreign API — not Google/Gemini, not a remote call**). **Upgrade path (roadmap):** `e5-small` / **`bge-m3` (ILMU's own embedding model)** on a ≥512MB Render tier or ILMU-hosted `bge-m3` on PAYG — a one-line model swap. RAG **retrieves candidate clauses + threads the precise page/section ref into the `Citation`**; it **never decides figures or eligibility**, and `ground_citation` still rejects any cited ID not in the corpus. Tasks: **BE-12/BE-13/BE-14**. **RAG stays on the committed-numpy index for the prelim — NOT a Postgres pgvector store (Q9)** — to keep it fail-open + independent of DB uptime + sovereign.
- [x] **Q9 (DO/BE) — RESOLVED at Gate 1 → MANAGED NEON POSTGRES, FULL DATA LAYER (PO directive, over PL's recorded pushback), WITH A PROMINENT SOVEREIGNTY CAVEAT + A FIXTURES FALLBACK.** Persist the operational + domain data — LangGraph HITL checkpoints (**BE-15**), the EvidenceVault audit log (**BE-16**), and entities + saved filings + audit-defense packs (**BE-17**) — in **managed Neon serverless Postgres (AWS `ap-southeast-1` Singapore region, free tier)**; provisioning + schema + env is **DO-4**. Neon is **plain Postgres via a connection string** (psycopg/SQLAlchemy) — no vendor bundle / no separate SDK. **Three mandatory caveats, recorded honestly (not dropped):** **(1) Sovereignty —** managed Neon has **no Malaysian region** (nearest = AWS Singapore), which is **in tension with CukaiPandai's "sovereign-by-default / data-stays-in-MY (PDPA)" thesis**; this is a **documented limitation**, mitigated by (a) EvidenceVault storing payload **hashes, not raw payloads**, and (b) the **prod sovereign path = self-hosted / MY-region plain Postgres with the identical schema — residency becomes a deploy-config swap, not a re-architecture** (Neon being _pure Postgres with no vendor lock_ makes that lift to a MY-hosted Postgres _cleaner_ than a bundled provider would). A `[TD]` sub-task makes TD-3 + prd/trd state this accurately (prelim = managed SG; prod = self-hosted MY) so the deck does not overclaim full sovereignty or read as a contradiction. **(2) Demo resilience (hard requirement) —** the hero beats (cited Form C, audit-defense, fabricated-citation rejection) run on deterministic seeded data and **must NOT hard-depend on Neon being up**; a fixtures/in-memory fallback keeps **DB-down ≠ demo-down** even if persistence is fully cut. **Neon demo-reliability PLUS:** Neon **scales compute to zero when idle but never permanently pauses** the project (cold start ≈ sub-second), which is _better_ for an intermittently-used demo than a provider that pauses a free project after ~7 days — so this provider choice _reduces_ demo risk. **(3) RAG stays on the committed numpy index (Q8) — NOT moved to a Postgres pgvector store** for the prelim (fail-open + DB-independent + sovereign); pgvector-on-Neon is noted as a _prod consolidation_ option only. **Rationale for Neon:** no-pause free tier (intermittent-demo friendly) + pure-Postgres minimal surface + identical app code ⇒ a clean future lift to a MY-region Postgres. **PL note (recorded):** PL flagged this as a real workstream added to a 4-day crunch with a sovereignty tension; the PO accepted. It sits **off the FE critical path** and **high in the cut-order** (degrades to fixtures/in-memory).

### Carried feature questions (Q3–Q5, still open)

- [ ] **Q3 (FE)** — Can the Vite + React console reach demo quality in the time left, or do we narrate a partial UI + lean on the API/tests? → decide at the **FE-1** confirm-scaffold gate (the scaffold already exists from R-FE-2, so the risk is feature-completeness/polish, not boot).
- [ ] **Q4 (BE)** — Exact current-year MyInvois API paths + the SSM CSD field set (for the production upgrade). → `sdk.myinvois.hasil.gov.my/api`; SSM CSD plan is `[ROADMAP]`, **out of scope for the prelim**.
- [ ] **Q5 (TD)** — Re-`⚠verify` all YA2026 rates/thresholds/deadlines before the deck (Budget/gazette can change them). → reconcile vs LHDN/RMCD; provenance file already cites sources. Owned by **TD-6** (final ⚠verify pass). _(Now also covers the expanded RAG corpus clauses — see BE-12's `[TD]` sub-part.)_

### Open for Gate 1 — this cycle (Phase-2 FE re-scope; PL surfaces, PO decides)

> Raised by PL while re-scoping FE-1→FE-4 against the **real** backend now on `main`. None are blockers; each has a recommended default so the FE spine can proceed if unanswered.

- [ ] **FQ1 (FE) — Mock-first or live-bind first?** The scaffold runs on `VITE_API_MOCK=1` (App.tsx:6) and the backend is fully live locally. **PL recommends mock-first** for FE-1→FE-4 (deterministic, no cold-start, no ILMU key needed in the FE loop) then a single live-bind at **FE-6** once **DO-2** yields the Render URL — this matches the critical path. Confirm, or do you want FE-3/FE-4 built straight against `localhost:8000` (needs the BE running + an ILMU `sk-` key for `/classify` + `/audit-defense`)?
- [ ] **FQ2 (FE) — Does FE-5 (sovereign badge) bind now or at FE-6?** BE-6 already ships `route_info()` on `/audit-defense` + `/classify` (`{sovereign, active_model}`). **PL recommends wiring the badge during FE-4** (the audit-defense response is the natural carrier) reading the live field, with a truthful static fallback in mock mode — rather than a separate later pass. Confirm FE-5 folds into FE-4, or stays a standalone step after FE-6.
- [ ] **FQ3 (FE/DO) — API base-URL + flag env-var names — confirm the contract.** Client reads `VITE_API_BASE_URL` (default `http://localhost:8000`) and `VITE_API_MOCK` (`'1'` ⇒ mock) — client.ts:5-6; backend CORS default allows `http://localhost:5173` (main.py:44). FE-8 references `VITE_DEMO_MODE` (not yet read anywhere). **PL recommends locking exactly these three names now** (`VITE_API_BASE_URL`, `VITE_API_MOCK`, `VITE_DEMO_MODE`) so DO-1/DO-2 and the mock fixtures agree. Confirm, or rename before FE-1.
- [ ] **FQ4 (FE) — Demo entity TIN mismatch in the scaffold pages.** The scaffold's `DEMO_SSM` uses `msic_codes: ['62010']` + `gross_income: 500000` (ObligationRadar.tsx:9-10, FilingStudio.tsx:9-10), but the seeded entity at `core/fixtures/entity_acme.json` / BE-8 is `msic_codes ['46900']` + `gross_income 5_000_000` (and `tax_payable RM31,000` keys off the seeded figures). For the **live** path FE-2/FE-3 must drive the **seeded** profile (via `getEntity`), not the page-local stub. **PL recommends FE-1 replaces the page-local `DEMO_SSM` stubs with the BE-8 `getEntity` fetch** so mock and live agree on one canonical Acme. Confirm.
- [ ] **FQ5 (FE) — `/form-c` (synchronous) vs `/start`+`/resume` (HITL) in the Filing Studio.** Both exist: `/form-c` returns `{computation, requires_approval, risk_flags}` in one shot (main.py:122); `/start`→`/resume` is the interactive HITL gate (main.py:153,175). FE-3's Layak acceptance needs the **HITL gate** (start→approve→resume). **PL recommends FE-3 uses `/start`+`/resume` as the primary path** (the demo's human-approval beat) and keeps `/form-c` only as a non-interactive fallback. Confirm the studio leads with HITL, not the one-shot compute.

### Open for Gate 1 — DEPLOY ITERATION (Render + Vercel live-swap; PL surfaces, PO decides)

> Raised by PL scoping the **deployment iteration** (DO-2 Render → FE-6 live-swap → DO-1 Vercel → DO-3 smoke). Each has a recommended default so the deploy can proceed if unanswered. **DQ1 is the load-bearing one** (the live trust money-shot).

- [ ] **DQ1 (BE/FE) — How is the LIVE fabricated-citation rejection proven? (THE money-shot — must resolve.)** The mock hardcodes a `verified=false` row (`client.ts:272-276`), but **live `build_defense` instructs the model to "Cite ONLY from these valid clause IDs" and returns a SINGLE citation** (`audit_defense.py:16-25,34`) — so a live fabrication query almost certainly returns `verified=true`, and the planted-fake **never appears live**. The deterministic gate (`ground_citation` → `corpus.exists`, `citations.py:7-11`) is real and correct, but live nothing exercises its reject branch. Options: **(A — PL recommends) add a tiny BE inject path (`BE-18`)** — an optional `inject_fabricated: bool` flag (or a dedicated demo query) on `/audit-defense` that appends a known out-of-corpus citation (e.g. `ITA_s99_ZZ`) to `citations[]` **before** `ground_citation` runs, so the **real gate** stamps it `verified=false` live, end-to-end, on the real corpus (~5–10 lines; honest because the fabrication is a deliberate, labeled "what if the AI hallucinated a cite" inject); **(B)** FE-only — in live mode the fabrication beat shows only the verified path and the rejection is demoed in **mock** mode (zero BE risk, but the money-shot runs on the mock, weakening "live trust"); **(C)** rejected — engineer a query to trick the model into a bad ID (unreliable; the system prompt actively prevents it). **PL recommends (A) via a new `BE-18`, sequenced before/with FE-6; fall back to (B) if BE-18 is cut.** Confirm A or B.
- [ ] **DQ2 (DO) — Render free tier vs paid for the live demo?** Free = 256MB RAM + **spins down after ~15 min idle → ~30–60s cold start on first hit** (a real risk during a live judge walkthrough). **PL recommends free tier** (the RAG/model2vec sizing targets it; cost-free for a prelim) **with a cold-start mitigation**: hit `/health` ~1 min before the demo to pre-warm, or keep a browser tab open. If a guaranteed-warm demo matters more than $0, a paid instance (no spin-down) is the alternative. Confirm free + pre-warm, or paid.
- [ ] **DQ3 (DO) — Deploy Neon now, or fixtures-only first?** The backend degrades to fixtures/in-memory when `DATABASE_URL` is absent (`main.py:64,70`; DB-down ≠ demo-down by design). **PL recommends fixtures-only for the FIRST deploy** (no `DATABASE_URL` set on Render) — prove the live demo end-to-end, then add Neon (DO-4 + BE-15/16/17) as a **follow-on env-var add + redeploy** if the BE lane has room. This keeps the deploy critical path short and independent of DB uptime. Confirm fixtures-first, or wire Neon in the same deploy.
- [ ] **DQ4 (DO/FE) — Does FE-6 (live-swap) ship behind the same PR as the Vercel config (`vercel.json` + `DO-1`), or separately?** The live-swap is config-only (env vars) + the 3 carry-forward FE edits; the Vercel deploy needs `vercel.json`. **PL recommends ONE PR** — `vercel.json` + the FE-6 carry-forward edits + docs land together, then the human deploys (DO-1) from that PR — because the carry-forward edits and the deploy are verified by the same smoke pass (DO-3) and splitting them doubles the review/gate cycles in a 4-day window. Confirm single PR, or split FE-6 from the Vercel config.
- [ ] **DQ5 (DO) — CI deploy step, or manual CLI deploy for the prelim?** **PL recommends manual** for the prelim — `render` auto-deploys from the connected GitHub repo on push to `main` (zero CI work), and Vercel deploys via `vercel --prod` (or its Git integration). A GitHub Actions deploy step (Render deploy hook / Vercel token) is **post-prelim polish**, not worth the secret-management + debug cost in the time left. Confirm manual, or add a CI deploy job.
- [ ] **DQ6 (DO) — Exact production CORS origin + preview policy.** `CORS_ORIGINS` is an exact-match comma list (`main.py:42-49`, `allow_credentials=True` so a `*` wildcard is **not** allowed with credentials). Vercel gives a **stable prod URL** (`https://<project>.vercel.app`) plus **per-deploy preview URLs** (`https://<project>-<hash>-<scope>.vercel.app`) that change every push — exact-match CORS won't cover rotating previews. **PL recommends:** set `CORS_ORIGINS` to the **stable prod `*.vercel.app` URL + `http://localhost:5173`**, demo on the **prod** URL (not a preview), and treat preview-CORS as out of scope for the prelim. (If previews must work, the cleaner fix is a regex-origin allow — a small `main.py` change — but PL recommends deferring it.) Confirm the prod-URL-only policy, or request preview-CORS support.

---

## Phase 1 — AI layer + core gaps → **DONE** (79 tests pass)

> **COMPLETE.** BE-1 (ILMU-first `RoutingLLMClient` + JSON mode + live spike), BE-2 (HITL filing graph mounted over FastAPI: `…/filings/form-c/start` + `…/resume`), BE-3 (`assess_risk` → 4 deterministic checks, wired; `risk_flags` in responses), BE-4 (live MSIC `GET /reference/msic/{code}` via data.gov.my + holidays-backed deadline shift), TD-1 (prd/trd reconciled — the gate **TD-5** depended on), TD-2 (routing + endpoint tests). **79 backend tests pass.** Per-task routing decided (resolves Q1). Full detail → [`progress.md`](progress.md). **Carry-forward:** the Claude-escalation path is wired but stays dormant for the prelim — **Q6 resolved pure-ILMU**, so the critic runs on `nemo-super` and live-validating the escalation is the post-prelim **BE-5**; `shift_for_malaysian_holidays` lives in `deadlines.py` but is deliberately not wired into `derive_obligations` output (preserves the demo's golden due dates). **MemorySaver is flagged non-durable in `api/main.py` → made durable in Phase 3 (BE-15).**

### BE-1 `[BE]` — AI-layer stack (ILMU-first routing) — **DONE**

- [x] Buy ILMU Claw Starter (RM27) — seat active, `sk-` key issued.
- [x] Run the 4-prompt spike (`nemo-super`) across profiler / documents / deductibility / audit-defense / citation-critic — per-task table captured in `progress.md`; weak step identified (**citation-critic**), resolving **Q1**. _(Claude head-to-head deferred — Q6 resolved pure-ILMU → post-prelim **BE-5**.)_
- [x] Build `RoutingLLMClient` (ILMU-first → the configured secondary on error + on `escalate=True` for the critic) — unit tests cover primary / failover / escalate / no-fallback. _(The escalate path stays dormant for the prelim per Q6; the mechanism is retained for post-prelim BE-5 — the secondary defaults to a sovereign ILMU model, with direct-Claude a flagged opt-in.)_
- [x] Add `response_format={"type":"json_object"}` to `_OpenAICompatClient`; JSON-mode parses. Spike-driven fix: JSON agents constrained to `LawCorpus.ids()`; relaxed JSON parse via `api/jsonio.loads_relaxed`. _(Note: `documents.classify_line_items` does NOT yet pass `json_schema`; wired in **BE-9** when it goes on an HTTP path. The `allowed = ", ".join(corpus.ids())` full-ID dump in `deductibility`/`audit_defense` is what **BE-13** replaces with RAG-retrieved candidates.)_

**Met:** ILMU-first routing with a configured-secondary failover (sovereign by default), working JSON mode, per-task escalation decided.

### BE-2 `[BE]` — HITL LangGraph mounted on FastAPI — **DONE**

- [x] `POST …/filings/form-c/start` runs the graph to the human-approval `interrupt` → `{thread_id, computation, requires_approval, risk_flags}`; `POST …/resume` resumes via `Command(resume={approved})`. Module-level graph + `MemorySaver` persists the paused state across the two calls; unknown/finalized `thread_id` → 404. Golden `tax_payable` RM31,000 flows through both.

**Met:** the human-approval gate is reachable over HTTP, not just in tests. **Deploy note:** `MemorySaver` is in-process → **single Uvicorn worker on Render** (see **DO-2**); made durable via the Neon Postgres checkpointer in **BE-15** (lifts the single-worker + non-durable constraint).

### BE-3 `[BE]` — `assess_risk` deepened + wired — **DONE**

- [x] 4 deterministic checks: `turnover_mismatch` (>10% vs MyInvois), `negative_chargeable`, `gross_chargeable_gap` (honest gross-vs-chargeable gap; renamed from `high_deduction_ratio` in the audit), `zero_tax_positive_income`. Wired into the live `form-c` endpoint **and** the HITL `/start` (so the reviewer sees `risk_flags`). On seeded Acme (RM5m declared vs RM200k chargeable) the `gross_chargeable_gap` flag fires. Flags shape: `{code, message, severity}` (clean for FE rendering).

**Met:** `assess_risk` runs 4 checks and is invoked on the live API path(s).

### BE-4 `[BE]` — Real connectors (MSIC + holidays) — **DONE**

- [x] `MsicClient` (`api/connectors/msic.py`): level-based lookup vs **data.gov.my** (`?id=msic`, follow-redirects, cached singleton `get_msic`), fixture mode for offline tests; `GET /reference/msic/{code}` (404 on unknown). Live verified: `46900 → class 4690`. `core/deadlines.py` gains `malaysia_holidays()` + `shift_for_malaysian_holidays()` (offline `holidays` package).
- [ ] Docling doc ingestion `[ROADMAP]` — **out of scope for the prelim.**

**Met:** MSIC + holidays use real sources; Docling deferred to roadmap.

### TD-1 `[TD]` — Reconcile `prd.md` + `trd.md` — **DONE** _(the gate TD-5 depended on)_

- [x] prd/trd reflect: Vite/devkit frontend · deploy **Vercel + Render** · **team of 3** · MyInvois **full fixture** + MSIC live · **ILMU-first** routing · uv + `backend/`+`frontend/` monorepo. No stale Next.js/shadcn/two-dev/Default-Claude remnants.

**Met:** prd/trd match the current architecture and team decisions.

### TD-2 `[TD]` — Tests for routing + new endpoints — **DONE**

- [x] Tests for `RoutingLLMClient` + the new endpoints (routing, JSON-mode, graph start/resume, risk, MSIC, jsonio); suite green at **79**.

**Met:** new routing + endpoints are covered and the suite is green.

---

## Phase 2 — Frontend consoles + FE-prereq backend + sovereign RAG

> Mostly `[FE]` (the Vercel deploy is split out to **DO-1**), plus three **FE-prereq `[BE]` tasks surfaced by the gap sweep** — **BE-8** (`GET /entities/{tin}`), **BE-9** (trial-balance classify endpoint), **BE-10** (consistent 422 error envelope) — and a committed **sovereign RAG `[BE]` workstream** (**BE-12/BE-13/BE-14**) that runs **parallel to the FE spine, NOT on the FE critical path**. Builds on the **R-FE-2** scaffold (Phase 0) + the live Phase-1 backend. **Gating task: FE-1.** **Sequencing from the gap sweep: BE-8 → FE-2, BE-9 → FE-3, BE-10 alongside FE-1.** **STATUS 25/06/26 — the FE-prereq BE all LANDED:** BE-8/9/10 ✓, BE-7 (CORS) ✓, BE-12/13/14 (RAG) ✓, BE-6 (route field) ✓ are on `main` (100 tests). **So Phase 2 is now FE-only: FE-1→FE-4 are the open work; their BE seams are all live on disk.**
>
> **Layak UX patterns (PO-adopted) live as acceptance bullets on FE-3/FE-4** — the cited-results "trust trio" (citation `<details>` panel + verified/unverified badge · honest-number IA · 96px hero numeral) and the two-tier Audit-Defense trace. **Grounded constraint (from the gap sweep, RE-CONFIRMED against `core/models.py`): render each citation where it actually exists** — the Filing Studio's per-figure trace is the **`FigureTrace`** (`value`+`inputs`+`rule_id`+`config_version`, `models.py:42-46`); **clause-level citations live only in the audit-defense `DefensePack.citations[{claim,clause_ids,verified}]`** (`models.py:63-71`). Do **not** promise clause cites on the form-c figures. _(RAG (BE-13) enriches the audit-defense `Citation` with `passage` + `page_ref`/`section`/`url` (`models.py:68-71`), which FE-4's `<details>` panel surfaces — but only where the data exists.)_
>
> **Reality check — RE-VERIFIED 25/06/26 against the REAL backend now on `main`** (`backend/api/main.py`, `api/schemas.py`, `api/llm.py`, `api/agents/audit_risk.py`, `core/models.py`). The Phase-1 + Phase-2-BE work has **landed**, so the old "not built yet" snapshot is superseded — **all nine routes ship**: `GET /health` (`main.py:102`), `GET /entities/{tin}` (`main.py:107`, BE-8 ✓), `POST …/obligations` (`main.py:117`), `POST …/filings/form-c` (`main.py:122`), `POST …/documents/classify` (`main.py:134`, BE-9 ✓), `POST …/audit-defense` (`main.py:144`), `POST …/filings/form-c/start` (`main.py:153`), `POST …/filings/form-c/resume` (`main.py:175`), `GET /reference/msic/{code}` (`main.py:186`). **CORS is live** (`CORSMiddleware`, env `CORS_ORIGINS`/`FRONTEND_ORIGIN`, default `http://localhost:5173`, `allow_credentials=True` — `main.py:42-53`, BE-7 ✓). **422 envelope is live** — `_profile`/`_line_items` catch `ValidationError` → `HTTPException(422, detail=e.errors())` on `/obligations`, `/form-c`, `/start` (`main.py:87-99`, BE-10 ✓). The law `Clause` model **now carries `section`/`page_ref`/`url`** (`models.py:54-60`, BE-12 ✓) and `Citation` carries threaded `section`/`page_ref`/`url`/`passage` (`models.py:63-71`, BE-13 ✓); the corpus is the expanded 15-clause seed; `ground_citation` → `corpus.exists(cid)` stays the authoritative gate (RAG never bypasses it). **Exact field names the FE binds (load-bearing):** `FigureTrace` = `{value, inputs, rule_id, config_version}` (`models.py:42-46`); `RiskFlag` = `{code, message, severity}` (`models.py:74-77`, `severity` defaults `"medium"`); `route_info()` = `{sovereign: bool, active_model: str}` (`llm.py:12-13,81-83`) — a pure-ILMU `_OpenAICompatClient` returns `sovereign=True` (`"ilmu.ai" in base_url`) and `active_model=<model>` (e.g. `nemo-super`). **Response-envelope facts that drive the FE wiring:** `/form-c` → `{computation, requires_approval, risk_flags}` (`main.py:127-131`); `/start` → `{thread_id, computation, requires_approval, risk_flags}` (`main.py:167-172`); `/resume` → `{approved, computation}` (`main.py:183`); `/audit-defense` → `{**DefensePack, **route_info()}` (`main.py:150`); `/classify` → `{line_items, **route_info()}` (`main.py:141`). **So `sovereign`/`active_model` appear ONLY on `/audit-defense` + `/classify`** — NOT on `/form-c*` (no model runs there; the compute node is deterministic).

### BE-8 `[BE]` — `GET /entities/{tin}` profile endpoint _(FE prereq; sequence before FE-2)_

**Purpose:** All current entity routes are POST `…/{tin}/…`; there is **no way to fetch an entity's profile** (TIN, entity_type, MSIC, paid-up, gross_income/turnover, basis period) for the FE to render the "onboard Acme" shell + the Obligation Radar header. The seed already exists at `core/fixtures/entity_acme.json` (`tin C2581234509`, `msic_codes ["46900"]`, `gross_income 5_000_000`) — this just serves it.

**Implementation:**

- [x] Add `GET /entities/{tin}` returning the seeded `EntityTaxProfile` (load `core/fixtures/entity_acme.json`, validate via `EntityTaxProfile`, `model_dump(mode="json")`); **404** when `tin` doesn't match a seeded entity → verify: `GET /entities/C2581234509` returns the profile with the right MSIC/gross_income; an unknown TIN returns 404.
- [x] Add a small test asserting the 200 shape + the 404 → verify: suite stays green.

**Acceptance criteria:** the FE can fetch a seeded entity profile over HTTP to render onboarding + the calendar header; unknown TIN → 404. _(FE-8 personas may extend this to multiple seeded TINs; **BE-17** later moves the read behind a Neon-backed repository seeded from this fixture, with the fixture as fallback.)_

### BE-9 `[BE]` — Trial-balance ingestion (classify) endpoint _(FE prereq; sequence before FE-3; resolves Q7)_

**Purpose:** Expose `documents.classify_line_items` (raw text → `LineItem[]`) over HTTP so the Filing Studio can drop **raw trial-balance text → classified line items → Form C** — the document-understanding demo beat. A real raw fixture exists (`core/fixtures/trial_balance_acme.json`).

**Implementation:**

- [x] Add `POST /entities/{tin}/documents/classify` taking `{raw_text: str}` (new `ClassifyReq` in `schemas.py`), calling `classify_line_items(raw_text, llm)` (DI'd `get_llm`), returning `{line_items: LineItem[]}` → verify: posting the Acme trial-balance text returns classified `LineItem[]` that feed straight into `/filings/form-c`.
- [x] **Wire JSON mode for `documents`** (the Q7 caveat): pass a `json_schema` to `llm.complete` in `classify_line_items` and keep parsing via `loads_relaxed` (already used) so the live HTTP path is reliable → verify: a JSON-mode classify call parses on `nemo-super`.
- [x] Wrap the parse in the same controlled-error story as `/audit-defense` (return **502** on unparseable model output, not 500) → verify: forced unparseable output yields a 502 with a clear detail.

**Acceptance criteria:** raw trial-balance text classifies to `LineItem[]` over HTTP (JSON-mode, 502-guarded), chainable into `form-c`; resolves **Q7**.

### BE-10 `[BE]` — Consistent request-validation error envelope (422) _(FE-forms prereq; alongside FE-1)_

**Purpose:** Today `EntityTaxProfile(**req.ssm)` / `LineItem(**li)` raise `ValidationError` **inside** the handlers (`obligations`, `form-c`, `/start`) → FastAPI returns an **uncaught 500**, while `/audit-defense` returns its own 502 — an inconsistent error story the FE forms can't reliably surface. Give the FE a predictable **422** with field detail for bad input.

**Implementation:**

- [x] Validate `ssm` and `line_items` at the boundary — either type the request bodies as the Pydantic models directly (so FastAPI emits the standard **422**), or catch `ValidationError` in those handlers and `raise HTTPException(422, detail=...)` → verify: posting a malformed `ssm` to `/obligations` and `/filings/form-c` returns **422** (not 500) with which-field detail; valid payloads behave exactly as before.
- [x] Add tests asserting 422 on bad input for the entity routes → verify: suite stays green (existing 200-path tests unchanged).

**Acceptance criteria:** bad request bodies return a consistent **422** with field detail across the entity routes; the FE forms can render validation errors instead of a generic 500.

### BE-12 `[BE]` (+ `[TD]` verification sub-part) — Law-corpus expansion + offline RAG index build _(committed; parallel to FE; resolves Q8 build-side)_

**Purpose:** Grow the 5-clause seed into a real, citable corpus and build the **committed numpy index** the runtime retriever loads. This is the content+build foundation for sovereign RAG.

**Implementation:**

- [x] **Extend the `Clause` model** (`core/models.py`) with provenance fields: `section`, `page_ref`, `url` (and keep `source`, `text`, `clause_id`) → verify: `LawCorpus.load` parses the extended clauses; existing 5 clauses still load (backfill their fields).
- [x] **Expand `core/fixtures/lawcorpus_seed.json`** from 5 clauses to a real **ITA 1967 + Public-Rulings** clause set, **each clause carrying source doc + section + page + URL** → verify: the corpus loads N≫5 clauses, each with a non-empty `clause_id`/`section`/`page_ref`/`url`.
- [x] **`[TD]` / cross-lane — ⚠verify the clause content.** Every added clause's text + section + page must be confirmed against the official source (ITA 1967, LHDN Public Rulings). This is content+verification work, not just code — owned with the product/tax-verify contributor and folded into the **Q5/TD-6** ⚠verify gate → verify: each clause has a ⚠verified citation in the provenance file; no unverified clause ships.
- [x] **Add `scripts/build_rag_index.py`** — clause/PDF text → chunk → **local static `model2vec`/potion** embed → L2-normalize → write `vectors.npz` (float32 matrix) + `chunks.json` (chunk text + `clause_id` + `section` + `page_ref` + `url`); committed under e.g. `core/fixtures/rag/` → verify: running the script regenerates a deterministic index whose row count matches the chunk count; `chunks.json` carries the page/section provenance.
- [x] **Deps + gitignore:** add `model2vec` (or equivalent static-embedding lib) to `backend/pyproject.toml` (numpy is already present via the test suite); ensure `vectors.npz` + `chunks.json` are **committed, NOT gitignored** → verify: `git check-ignore core/fixtures/rag/vectors.npz` returns nothing; `uv sync` installs the embedder.

**Acceptance criteria:** an expanded ⚠verified corpus (with section/page/URL per clause) and a reproducible offline build script that commits `vectors.npz` + `chunks.json` (with page-ref provenance) using local static embeddings; index artifacts are committed, not ignored.

### BE-13 `[BE]` — Runtime retriever + agent wiring (gate stays authoritative) _(committed; parallel to FE; resolves Q8 runtime-side)_

**Purpose:** Retrieve the _relevant_ clauses to hand the model (replacing the full-ID dump), thread the precise page ref into the `Citation`, and keep the deterministic gate + curated fallback intact (Layak's belt-and-braces).

**Implementation:**

- [x] **Retriever module** (e.g. `core/rag.py`): `lru_cache` load of `vectors.npz` + `chunks.json` + the static embedder; `retrieve(query, k, *, clause_filter=None) -> list[chunk]` = embed query → L2-normalize → cosine top-k by matrix-multiply; supports a per-clause/section filter; **fail-open** — any error (missing index, embedder load failure) returns `[]`, never raises → verify: a golden query returns the expected top-k clauses; with the index absent it returns `[]` without raising.
- [x] **Wire into `deductibility.cite_treatment` + `audit_defense.build_defense`:** replace `allowed = ", ".join(corpus.ids())` with the **retrieved candidate clause IDs** (fall back to the full-ID list if retrieval returns `[]`), and **prepend** the RAG-retrieved citation (verbatim passage + threaded `page_ref`/`section`/`url`) to the curated/hardcoded citation — RAG-retrieved is _additive_, never the sole source → verify: with RAG on, the model is constrained to retrieved IDs and the resulting `Citation` carries the real page ref; with RAG off (`[]`), behavior is exactly today's full-ID-dump path.
- [x] **Gate unchanged + provenance threaded:** `ground_citation`/`verify_claim` still reject any cited ID not in `corpus` (RAG does **not** bypass the gate); thread the chunk's real `page_ref`/`section`/`url` into the `Citation` (improving on Layak, which hardcoded `page_ref="Local RAG retrieval"` and lost the page) → verify: a fabricated clause-ID is still `verified=false` with RAG on; a valid retrieved citation shows its precise page/section.

**Acceptance criteria:** retrieval feeds the agents relevant candidate clauses with precise page-ref provenance threaded into the `Citation`; `ground_citation` stays authoritative (fabricated IDs still rejected); retrieval miss degrades gracefully to the existing constrain-to-corpus + curated-citation path. **RAG never decides figures or eligibility.**

### BE-14 `[BE]` — RAG tests (golden + fail-open + gate-still-rejects invariant) _(committed; parallel to FE)_

**Purpose:** Lock the RAG behavior and, critically, prove the trust guarantee survives RAG.

**Implementation:**

- [x] **Golden retrieval test:** a known query returns the expected clause(s) in top-k → verify: assertion passes against the committed index.
- [x] **Fail-open test:** with no index / no embedder, `retrieve(...)` returns `[]` and the agents fall back to the full-ID-dump path without raising → verify: agents still produce a (curated-fallback) citation when RAG is unavailable.
- [x] **Gate-invariant test:** with RAG **on**, a fabricated/non-corpus clause-ID is still rejected by `ground_citation` (`verified=false`) — the planted-fake-citation guarantee is unchanged → verify: the fabricated-citation test passes identically with RAG enabled.

**Acceptance criteria:** golden retrieval, fail-open, and the gate-still-rejects-fabrication invariant are all covered; the suite stays green with RAG on.

### FE-1 `[FE]` — Confirm scaffold + extend the typed client to the real surface _(gating)_

**Purpose:** Get the existing Vite + React console shell building, then bring the typed API client up to the **actual** Phase-1+Phase-2 backend surface so every later console has real methods to call. **On-disk reality (verified 25/06/26):** the scaffold exists at `frontend/src/` — `App.tsx` (RR7 router, routes `/obligations` → `ObligationRadar`, `/filing` → `FilingStudio`, `/audit-defense` → `AuditDefense`, `/` redirects to `/obligations`; a `MOCK` chip when `VITE_API_MOCK==='1'`), `pages/{ObligationRadar,FilingStudio,AuditDefense}.tsx` (each already fetches its endpoint + renders a basic list), `api/client.ts`, `styles/tokens.css`, `main.tsx`. So FE-1 is **extend**, not scaffold.

**Implementation:**

- [x] Confirm the scaffold boots: `cd frontend && bun install && bun run dev` (Vite + React + RR7 + `tokens.css`); `tsc --noEmit` + `bun run build` clean → verify: dev server serves `/obligations`, `/filing`, `/audit-defense` (the three routes registered in `App.tsx:55-57`); build is green.
- [x] **Extend `frontend/src/api/client.ts`** to the real surface. The current client only has `getObligations`, `getFormC`, `getAuditDefense` (client.ts:154-167) and its types are **stale vs what shipped** — add/correct:
  - `getEntity(tin)` → `GET /entities/${tin}` returning `EntityTaxProfile` (new type mirroring `core/models.py:8-18`; **404** on unknown) — **[DRIFT]** no such method today (BE-8 shipped) → verify: typed `getEntity` returns the seeded Acme profile.
  - `classifyTrialBalance(tin, raw_text)` → `POST /entities/${tin}/documents/classify` with body `{raw_text}`; response is `{line_items: LineItem[], sovereign: boolean, active_model: string}` (`main.py:141` spreads `route_info()`) — **[DRIFT]** no method today (BE-9 shipped) → verify: typed call returns classified `LineItem[]` + the route fields.
  - `startFiling(tin, ssm, line_items)` → `POST …/filings/form-c/start` → `{thread_id, computation, requires_approval, risk_flags}` and `resumeFiling(tin, thread_id, approved)` → `POST …/filings/form-c/resume` → `{approved, computation}` (`main.py:167-172,183`) — **[DRIFT]** no HITL methods today (BE-2 shipped) → verify: typed start/resume round-trip in mock mode.
  - `getMsic(code)` → `GET /reference/msic/${code}` (BE-4) — optional for the FE spine; type loosely (`Record<string, unknown>`) since the data.gov.my row shape is dynamic → verify: typed call present.
  - **Add a `RiskFlag` type `{code, message, severity}`** (exact shape, `models.py:74-77`) and **fix `FormCResponse`** — it is missing `risk_flags` (client.ts:58-61) but `/form-c` returns it (`main.py:130`) → **[DRIFT]** stale type → verify: `FormCResponse` includes `risk_flags: RiskFlag[]`.
  - **Extend the `Citation` type** with the RAG provenance fields now present on the model: `section?`, `page_ref?`, `url?`, `passage?` (all optional — `models.py:68-71`) → **[DRIFT]** client `Citation` (client.ts:63-67) omits them; FE-4's `<details>` page-ref binds to `page_ref`/`passage` → verify: type carries the optional provenance fields.
  - **Add a typed 422 error shape** (FastAPI `{detail: [{loc, msg, type}, ...]}` — what `e.errors()` serializes to, `main.py:92`) so forms can surface field errors instead of a bare `Error(status)` (the current `post()` throws `new Error('${status} ${statusText}')`, client.ts:148) → verify: a 422 is parsed into field detail, not a generic string.
- [x] **Reconcile the demo entity to the seed (FQ4).** Replace the page-local `DEMO_SSM` stubs (`msic_codes ['62010']`, `gross_income 500000` — ObligationRadar.tsx:5-15, FilingStudio.tsx:5-15) with a single canonical Acme sourced from `getEntity('C2581234509')` (seed = `msic_codes ['46900']`, `gross_income 5_000_000`) so mock and live agree and `tax_payable RM31,000` keys off the real seed → verify: both pages drive the seeded profile, not the divergent stub.
- [x] Keep **mock mode** (`VITE_API_MOCK=1`, read at client.ts:6) mirroring **every** endpoint schema incl. the new entity/classify/HITL/MSIC/risk shapes and the `sovereign`/`active_model` fields on the AI responses → verify: all three routes render end-to-end in mock mode (resolves **Q3** at this gate).

**Acceptance criteria:** `frontend/` boots with 3 routed consoles; the typed client covers **all** shipped endpoints (entity, obligations, classify, form-c, form-c/start+resume, audit-defense, reference/msic) with mock fixtures, the `RiskFlag` type, the RAG-extended `Citation` type, the `sovereign`/`active_model` fields on `/audit-defense`+`/classify`, a typed 422 envelope, and clean `tsc --noEmit`. The four stale-client **[DRIFT]** items above are corrected.

### FE-2 `[FE]` — Obligation Calendar console _(needs BE-8 — shipped)_

> **Seam confirmed:** `GET /entities/{tin}` (BE-8, `main.py:107`) → `EntityTaxProfile`; `POST …/obligations` (`main.py:117`) → `ObligationCalendar` = `{entity_tin, obligations[]}` where each `Obligation` = `{obligation_type, form, due_date, rule_id, config_version, status}` (`models.py:21-31`). The scaffold page (`ObligationRadar.tsx`) already renders the list off `getObligations` keyed on `rule_id` — FE-2 adds the **entity header** (currently a hardcoded `DEMO_TIN` kicker, ObligationRadar.tsx:31) and richer rows.

**Implementation:**

- [x] Fetch the entity via `getEntity` (BE-8) for the header (TIN, entity_type, MSIC, basis period), then render the derived obligation set as a calendar/list using the real fields — `form`, `obligation_type`, `due_date`, `status`, `rule_id` (the `ObligationCalendar` shape is already sufficient; the scaffold maps `data.obligations` at ObligationRadar.tsx:61) → verify: the Acme calendar renders the entity header from `getEntity` + obligations from `/obligations` (mock + live).
- [x] Pre-seed/ensure a couple of obligations so the calendar doesn't look thin (per spec §6.2 "weak beat" mitigation) — `derive_obligations(profile, 2026)` is the source; if it returns <3 rows for Acme, enrich the seed or the mock fixture (the mock already has Form C + CP204, client.ts:80-100) → verify: ≥3 obligation rows show.

**Acceptance criteria:** Obligation Calendar displays the seeded **entity header (from `getEntity`)** + obligations with form/deadline/status/rule*id, populated enough to demo well. *(No `sovereign`/`active_model` here — these are non-AI deterministic endpoints.)\_

### FE-3 `[FE]` — Cited Filing Studio (+ classify + human-approval gate + risk flags + Layak trust-trio) _(needs BE-9, BE-2 — both shipped)_

> **Seams confirmed:** classify = `POST …/documents/classify` → `{line_items, sovereign, active_model}` (`main.py:134-141`); HITL = `POST …/filings/form-c/start` → `{thread_id, computation, requires_approval, risk_flags}` then `POST …/filings/form-c/resume` → `{approved, computation}` (`main.py:153-183`); one-shot = `POST …/filings/form-c` → `{computation, requires_approval, risk_flags}` (`main.py:122`). The scaffold `FilingStudio.tsx` currently calls only `getFormC` (one-shot) and renders `computation.fields` as a flat list (FilingStudio.tsx:65-82) — FE-3 adds classify, the HITL gate, risk flags, and the Layak trio. **PL recommends leading with `/start`+`/resume` (FQ5).**

**Implementation:**

- [x] Drop raw trial-balance text → `classifyTrialBalance` (BE-9) → show the classified `LineItem[]` → feed into the filing → verify: the Acme trial-balance text classifies and flows into `/start`.
- [x] Render Form C with `tax_payable RM31,000` and **per-figure traces** — each field of `computation.fields` (a `dict[str, FigureTrace]`, `models.py:49-51`) shows `value` + `inputs` + `rule_id` + `config_version` (the `FigureTrace` money-shot; this is the figure→rule trace, the spec's "every figure cited" beat — **clause-level per-figure citations are an audit-defense feature, NOT in the form-c response**) → verify: every field shows its `value`/`inputs`/`rule_id`/`config_version`.
- [x] Surface the **`risk_flags`** (`{code, message, severity}` — `models.py:74-77`) returned by `/start` (and `/form-c`) so the reviewer sees audit-risk context before approving — show the `gross_chargeable_gap` flag firing on the seeded Acme (RM5m gross vs RM200k chargeable; `audit_risk.py:39`) → verify: at least one risk flag renders with its `severity`.
- [x] Wire the **HITL approval gate**: `startFiling` → render the interrupt (`requires_approval` from the response) → `resumeFiling(approved=true)` resumes and shows the finalized computation → verify: approval resumes the graph and the studio reflects the approved result (uses BE-2; `/resume` returns `{approved, computation}`). **Note:** an unknown/finalized `thread_id` → **404** (`main.py:181`) — handle it (don't white-screen).
- [x] **(Layak) Per-figure trace `<details>` panel:** each Form C figure expands to its **`FigureTrace`** detail (the `rule_id` + `config_version` + the `inputs` array it derived from — exactly what the form-c response carries); click-to-expand, collapsed by default → verify: expanding a figure shows its `rule_id`/`config_version`/`inputs` trace. _(Do NOT render clause-IDs here — they aren't in `FigureTrace`/the form-c response.)_
- [x] **(Layak) Honest-number IA:** lay out _tax payable / computed liability_ (`fields.tax_payable`) in its own visually distinct section, separated from upstream figures (`gross_income`/`adjusted_income`/`chargeable_income`) and any reliefs/credits, so the headline figure stays unambiguous → verify: the liability figure and the supporting figures render in separate, visually distinct sections.
- [x] **(Layak) 96px hero numeral** for the headline figure (`fields.tax_payable.value`) → verify: the headline numeral renders at the hero scale (~96px) and stays legible/responsive.

**Acceptance criteria:** raw text classifies into the studio (via `/classify`); Form C renders with a **96px hero `tax_payable`**, an **honest-number IA** (liability separated from the supporting figures), and a **per-figure `<details>` trace panel showing the `FigureTrace` (`value`/`inputs`/`rule_id`/`config_version` — no clause-IDs)**; the `risk_flags` are visible with severity; and an interactive approval gate drives the real `/start`→`/resume` graph (404-safe). _(The `sovereign`/`active_model` from `/classify` can feed the FE-5 badge — see FQ2.)_

### FE-4 `[FE]` — Audit-Defense console (hero) + live fabricated-citation rejection + two-tier trace _(Layak)_

> **Seam confirmed:** `POST …/audit-defense` → `{**DefensePack, sovereign, active_model}` (`main.py:144-150`). `DefensePack` = `{query, items: list[dict], citations: Citation[], exposure_note}` (`models.py:80-85`); each `Citation` = `{claim, clause_ids, verified, section?, page_ref?, url?, passage?}` (`models.py:63-71`). **The scaffold `AuditDefense.tsx` already renders the citations list with a verified/unverified badge** (`verified-stamp` / `unverified-stamp`, AuditDefense.tsx:60-74) + the exposure note — so FE-4 **extends** the scaffold with the `<details>` panel (page-ref/passage), the two-tier trace, the live-rejection demo, the 502 handler, and the sovereign badge. **`items` is loosely-typed `list[dict]` — render defensively** (the scaffold doesn't render `items` yet).

**Implementation:**

- [x] Turn a pasted query (e.g. _"Justify your RM4,800 repairs deduction"_, the scaffold's `DEMO_QUERY`, AuditDefense.tsx:5) into a cited `DefensePack` — render `items` (loosely-typed `list[dict]`, render defensively over `Object.entries`), `citations`, and the `exposure_note` (s.112/113) → verify: a cited pack renders from `/audit-defense`.
- [x] Show the **verifier rejecting a fabricated citation live** — a claim whose `clause_ids` reference an ID **not in the corpus** comes back `verified=false` and is visibly blocked (this is the deterministic `ground_citation` → `corpus.exists` gate — **the prelim trust money-shot, runs on pure ILMU per Q6, unchanged by RAG per BE-13/BE-14**; the scaffold already styles `verified=false` as a `REJECTED` stamp, AuditDefense.tsx:64-66) → verify: a fabricated citation is visibly rejected in the UI. _(NOTE — the mock fakes this with a hardcoded `verified=false` row; whether it reproduces LIVE is **DQ1/BE-6**, resolved at the FE-6 live-swap — see FE-6.)_
- [x] Handle the controlled **502** from `/audit-defense` (unparseable model output — `main.py:148-149`) gracefully (don't white-screen; the current `post()` throws a bare `Error`, client.ts:148) → verify: a forced 502 shows a friendly error, not a crash.
- [x] **(Layak) Citation `<details>` panel + verified/unverified badge** on every `DefensePack.citations` entry: show the `claim`, its `clause_ids`, and — **when RAG/BE-13 populated them** — the `passage` + precise `page_ref`/`section`/`url` (the real fields on `Citation`, `models.py:68-71`; all optional, so guard for `null`), with click-to-open; a **badge distinguishes `verified=true` from `verified=false`** (scaffold already does the badge, extend it with the expandable detail) → verify: a passed citation shows a "verified" badge + expandable clause detail (with `page_ref`/`passage` when present); a rejected one shows a clearly-different "unverified/rejected" badge.
- [x] **(Layak) Two-tier trace — lay narration + collapsible "technical details":** a plain-language narration of the defense, plus a collapsible transcript that surfaces the **deterministic-core trace** (figure → `rule_id`/`config_version` → citation/clause) for the cited figures → verify: the lay layer reads as prose; expanding "technical details" reveals the figure→rule→citation trace.

**Acceptance criteria:** Audit-Defense produces a cited pack with a **per-citation `<details>` panel + verified/unverified badge** (surfacing `passage`/`page_ref` when RAG populated them, guarded for `null`), a **two-tier trace** (lay narration + collapsible deterministic-core technical transcript), **visibly rejects a fabricated citation** (the `verified=false` gate — live-reliable per DQ1/BE-6 at FE-6), and degrades gracefully on a 502 parse failure. _(The response's `sovereign`/`active_model` (`main.py:150`) is the natural source for the FE-5 badge — see FQ2.)_

### FE-5 `[FE]` — Live sovereign-mode indicator _(depends on BE-6 — shipped)_

> **RESOLVED at Gate 1 → live, not hardcoded.** The indicator binds to the real `sovereign`/`active_model` fields **BE-6** added to AI responses. **Verified on disk:** `/audit-defense` (`main.py:150`) and `/classify` (`main.py:141`) both spread `**llm.route_info()` → `{sovereign: bool, active_model: str}` (`llm.py:12-13,81-83`). Under **pure-ILMU** (Q6) these read `sovereign=true`, `active_model="nemo-super"` (or whatever ILMU model served the call) for every request — BE-6 earns its place by making the claim **evidence-backed** (read off the route the request actually took) rather than a hardcoded label. **The fields are absent on the deterministic endpoints (`/obligations`, `/form-c*`)** — the badge should bind to an AI response (audit-defense or classify), not the calendar. **Sequence: BE-6 → FE-5; PL recommends folding FE-5 into FE-4 (FQ2).**

**Implementation:**

- [x] Read the `sovereign`/`active_model` fields off an AI response (audit-defense or classify) and render an "in-country (ILMU `<active_model>`)" badge in the console chrome (the field is the source of truth, so if a route ever escalated it would read its real model honestly); in mock mode, show a truthful static `sovereign=true` / `nemo-super` fallback → verify: the indicator reflects the **actual** per-request route reported by the backend, showing sovereign-ILMU for the prelim's pure-ILMU calls.

**Acceptance criteria:** UI shows the real, backend-reported route for each AI call — sovereign (ILMU) for the prelim — sourced from BE-6's `sovereign`/`active_model` fields on `/audit-defense`+`/classify`, not a constant. _(The RAG layer (BE-12/13) is also fully sovereign — local static embeddings, no foreign API — so inference + retrieval are in-country; the **Neon persistence** layer is the one **non-MY-region** dependency (Q9), handled honestly in the deck per BE-17's `[TD]` sub-task.)_

### FE-6 `[FE]` — Swap mock → live API (+ resolve the 3 QA carry-forward items) _(DEPLOY-ITERATION; needs DO-2's Render URL + DQ1/BE-18)_

> The Vercel **deploy** half is **DO-1**. This task is the **live-API swap** plus the three carry-forward items QA flagged on the Phase-2 FE spine (`docs/test.md`, 25/06/26) that are **latent until live** and must be closed here. **Sequence: DO-2 (Render URL) → FE-6 → DO-1.** Per **DQ4**, PL recommends FE-6's FE edits + `vercel.json` (DO-1's config) ship in ONE PR. **Split — clearly — agent-doable vs human-only:**
>
> **AGENT steps (config + code + verify):**

**Implementation:**

- [ ] **Point the client at live.** Set `VITE_API_MOCK=0` + `VITE_API_BASE_URL=<render url from DO-2>` (the client reads both at `client.ts:5-6`); for local verification an agent uses `frontend/.env.local` (gitignored) — the deployed values are set by the **human** in the Vercel dashboard (DO-1) → verify: with the live values, `getEntity`/`getObligations`/`classifyTrialBalance`/`startFiling`+`resumeFiling`/`getAuditDefense` all hit the Render API (Network tab shows the Render origin, not mock returns).
- [ ] **Verify every console against the LIVE backend, not the mock** — walk all three routes end-to-end against `<render url>`: entity + obligations render; classify → Form C HITL `start`→approve→`resume` completes (golden `tax_payable RM31,000`); audit-defense returns a cited pack; the FE-5 sovereign badge reads the **live** `route_info()` (`sovereign=true`/`nemo-super`), not the mock fallback → verify: each beat works on live; the 404 (finalized thread) + 502 (unparseable) error windows still degrade gracefully against the real API.
- [x] **[QA carry-forward #1 — the money-shot] Prove the LIVE fabricated-citation rejection yields `verified=false`.** Live `build_defense` constrains the model to corpus IDs and returns a single citation (`audit_defense.py:16-25,34`), so a plain fabrication query will **not** reliably produce a `verified=false` row — the rejection must be driven by **DQ1's chosen mechanism**: if **(A)** is approved, call `/audit-defense` with the `BE-18` inject (`inject_fabricated=true` or the dedicated demo query) so the **real deterministic gate** stamps the planted `ITA_s99_ZZ`-style cite `verified=false` live; wire the FE fabrication button (`AuditDefense.tsx:30-31`) to that path → verify: against the **live** Render API, the fabrication beat returns a citation with `verified=false` and the UI shows the REJECTED stamp — i.e. the trust money-shot is real on live, not just mock. _(If DQ1 resolves to **(B)**, this bullet changes to: the live fabrication button shows only the verified path, and the rejection is narrated/run in mock mode — record that explicitly in the demo script, TD-3.)_
- [x] **[QA carry-forward #2 — mock fidelity] Align `MOCK_DEFENSE.items` to the real shape.** Change the mock `items` (`client.ts:255-261`) from `[{clause_id, text, source}]` to the live `build_defense` shape `[{contested_item, evidence}]` (`audit_defense.py:33`, e.g. `[{ contested_item: 'Repairs deduction RM4,800', evidence: [['invoice','INV-2025-0042: …']] }]`) so mock and live agree and a teammate reading the mock isn't misled → verify: mock and live `items` have the same key shape; `AuditDefense.tsx`'s defensive `Object.entries(item)` render is unaffected; `tsc --noEmit` + `bun run build` clean.
- [x] **[QA carry-forward #3 — mock↔live tightening] Branch the mock on query so the standard path matches live.** Today both buttons receive the identical `MOCK_DEFENSE` (a verified AND a rejected row), so the "standard defense query" wrongly shows a rejected citation in mock; branch `getAuditDefense`'s mock on the query (`client.ts:367-373`) so the **standard** query returns only the verified citation and only the **fabrication** query returns the rejected one — matching the live behavior under DQ1 → verify: in mock mode the standard query shows no rejected row; the fabrication query does; the rejection callout (already gated to `activeQuery==='fabrication'`, `AuditDefense.tsx:130`) and the citations list now agree.

> **HUMAN steps (Vercel dashboard / account — see DO-1):** set `VITE_API_BASE_URL`, `VITE_API_MOCK=0`, `VITE_SOVEREIGN` in the Vercel project's Environment Variables and trigger the deploy. Agents cannot set dashboard env vars or authenticate Vercel.

**Acceptance criteria:** all consoles run on the live Render API end-to-end (CORS via BE-7 + the DO-2/DO-1 origin reconciliation); the **live** fabricated-citation rejection is proven to yield `verified=false` (DQ1/BE-18 path) — or, if DQ1=(B), the rejection is explicitly demoed in mock and noted in TD-3; the mock `items` shape matches live `[{contested_item, evidence}]`; and the mock branches on query so standard-vs-fabrication parity holds with live. The three `docs/test.md` carry-forward items are closed. _(Deploy handled by **DO-1/DO-2**.)_

### FE-7 `[FE]` — Styling pass to the devkit design tokens _(polish; cut candidate)_

**Implementation:**

- [ ] Polish to the ProofRank devkit tokens (the **real** `tokens.css` copied in R-FE-2, imported once in `main.tsx`) — use the existing devkit classes (`.window`, `.titlebar`, `.req-list`, `.requirement-row`, `.evidence`, `.verified-stamp`, `.barber`, already used across the three scaffold pages) consistently across the 3 consoles → verify: consoles match the design system; `bun run build` stays green.

**Acceptance criteria:** UI is consistent with the devkit token system and still builds clean. _(This is polish — see the Timeline cut list; functional styling from FE-1…FE-4 suffices for the demo if a day slips.)_

---

## Phase 3 — Deploy, demo & submission

> Mixed `[DO]` + `[TD]` + in-scope `[BE]` (BE-6 sovereign field, **BE-7 CORS — deploy-critical**, **BE-18 fabricated-citation inject for the live money-shot — DQ1**), a small demo-prep `[FE]` (**FE-8**), a committed **Neon Postgres persistence migration** (**DO-4 + BE-15/16/17**, off the FE critical path), one deferred `[BE]` (BE-5), and a clearly-marked **STRETCH** pair (**FE-9** + **BE-11** SSE — off the critical path). **CORS (BE-7) + deploy are committed** — both services go up (**DO-2** BE → Render, **DO-1** FE → Vercel) and are smoke-verified end-to-end (**DO-3**). **BE-7 must land before/with DO-1/DO-2.** **Render-RAM note:** the RAG index (BE-12/13) is sized for the **256MB free tier** via local static embeddings; DO-2 confirms it loads or fails open. **BE-5 (escalation — sovereign-preferred) is DEFERRED post-prelim** (Q6 = pure-ILMU). See [`## Timeline / milestones`](#timeline--milestones) for **critical-path** vs **cut-first**.
>
> **DEPLOY-ITERATION ORDER (this cycle, dependency-sorted):** `BE-18 (if DQ1=A) → DO-2 (Render) → FE-6 (live-swap + 3 carry-forwards) → CORS reconcile (Render env, DO-2/DO-1) → DO-1 (Vercel) → DO-3 (live smoke)`. Each task below marks **HUMAN-only** steps (account auth · dashboard env · project linking) vs **AGENT** steps (config files · `vercel.json` · Dockerfile `$PORT` · build · docs). The human has standing GitHub auth but must personally authenticate **Render** and **Vercel**.

### BE-7 `[BE]` — CORS middleware _(DEPLOY-CRITICAL; land before/with DO-1/DO-2)_

**Purpose:** There is **no CORS today** (verified — `main.py` has no `CORSMiddleware`/`add_middleware`). A browser request from the Vercel preview origin to the Render API will be **blocked** without it — a hard blocker for the deployed demo (and even for localhost, since the Vite dev server `:5173` and the API `:8000` are cross-origin).

**Implementation:**

- [x] Add FastAPI `CORSMiddleware` to `api/main.py` allowing the Vercel origin, configurable via env (`FRONTEND_ORIGIN` / `CORS_ORIGINS`, comma-split), and include `http://localhost:5173` for local dev; allow the methods/headers the FE uses (GET/POST, `Content-Type`) → verify: a cross-origin `OPTIONS` preflight + a `POST` from the configured origin succeed (no CORS error); an unlisted origin is rejected.
- [x] Document the env var in `.env.example` (cross-lane note for DO-2) → verify: `.env.example` lists `CORS_ORIGINS`/`FRONTEND_ORIGIN`.

**Acceptance criteria:** the deployed Vercel FE (and the localhost dev server) can call the API without CORS errors; allowed origins are env-configurable. **Deploy-iteration note:** because `CORS_ORIGINS` is read from env at startup (`main.py:42-49`), **adding the Vercel origin is an env-var change + redeploy on Render — NOT a code change** (see DO-2's CORS-reconcile step). Per **DQ6**, set it to the **stable prod `*.vercel.app` URL + `http://localhost:5173`** and demo on the prod URL.

### BE-18 `[BE]` — Live fabricated-citation inject (the trust money-shot, made live-reliable) _(DEPLOY-ITERATION; resolves DQ1=A; sequence before/with FE-6)_

> **NEW this cycle — only build if DQ1 resolves to (A).** Closes the single biggest live-demo risk QA flagged: the fabricated-citation rejection is the prelim's trust money-shot, but **live `build_defense` tells the model to "Cite ONLY from these valid clause IDs" and returns a single citation** (`audit_defense.py:16-25,34`), so a plain fabrication query yields `verified=true` — the planted-fake never appears live and the gate's reject branch is never exercised on the deployed stack. This adds a tiny, **honest** affordance that drives a known out-of-corpus citation through the **real** deterministic gate.

**Implementation:**

- [x] Add an optional `inject_fabricated: bool = False` to `AuditDefenseReq` (`api/schemas.py`) — OR accept a reserved demo query string; when set, **append** a known out-of-corpus `Citation` (e.g. `clause_ids=["ITA_s99_ZZ"]`, `claim="<planted fabricated citation>"`) to `citations[]` in `build_defense`/the `/audit-defense` handler **before** `ground_citation`/`verify_claim` runs, so the **real gate** (`citations.py:7-11` → `corpus.exists`) stamps it `verified=false` — never a hardcoded `false`, the gate decides → verify: `POST /entities/{tin}/audit-defense` with `inject_fabricated=true` returns a pack whose injected citation has `verified=false`, while the genuine citation stays `verified=true`; without the flag, behaviour is exactly today's (single genuine citation).
- [x] Keep it **off by default and clearly a demo inject** (a labeled "what if the AI hallucinated a citation" path, not silent) so the deck/script can narrate it honestly; the deterministic gate — not the inject — is what produces the rejection → verify: default `/audit-defense` is unchanged; the inject path is opt-in.
- [x] Add a test asserting the injected out-of-corpus cite is gated to `verified=false` and the genuine cite to `verified=true` in the same pack → verify: suite stays green (the existing fabricated-citation gate test is unaffected).

**Acceptance criteria:** an opt-in inject drives a known out-of-corpus citation through the authoritative `ground_citation` gate so the **live** (deployed) audit-defense beat reproducibly shows a `verified=false` rejection alongside a `verified=true` genuine cite — the trust money-shot proven on the real stack, not just the mock; default behaviour and the gate semantics are unchanged. **If DQ1=(B), this task is NOT built** (the rejection is demoed in mock + noted in TD-3).

### DO-2 `[DO]` — Deploy BE → Render _(committed; do this FIRST — FE depends on its URL)_

> Re-sequenced **ahead of DO-1**: the FE live-swap (**FE-6**) needs the Render URL, so the backend deploys first. The Docker image is already Render-deployable as-is. **Requires BE-7** so CORS is set for the Vercel origin. **Free tier per DQ2** (256MB; cold-start mitigated). **Fixtures-only per DQ3** (no `DATABASE_URL` for the first deploy).

**AGENT steps (config + verify — can be done without account auth):**

- [x] **Port binding.** The Dockerfile hardcodes `--port 8000` (`Dockerfile:17`); Render injects `$PORT` and routes to it. Propose making the `CMD` honor it — `uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}` (shell form) — so the service binds the port Render expects → verify: locally `PORT=10000 docker run …` serves `/health` on 10000; unset still serves 8000. _(PG applies the one-line Dockerfile edit; it's surgical and keeps local/`docker-compose` behaviour via the `:-8000` default.)_
- [ ] **(Optional) `render.yaml` blueprint** under `backend/` (env: docker, `dockerfilePath: ./Dockerfile`, `healthCheckPath: /health`, `plan: free`, `numInstances: 1`) so the service config is code-reviewed + reproducible — OR leave it dashboard-only (DQ5 = manual). PL recommends the blueprint for reproducibility but it's not required → verify: if added, `render.yaml` lints/parses and names `/health` + free + single-instance.
- [x] Document the **exact env-var set the human must enter** in `docs/runbook.md` (deploy section) so the dashboard step is copy-paste (see the table below) → verify: the runbook lists every required + optional var with example values.

**HUMAN steps (Render account — must be done by the PO; agents cannot authenticate Render):**

- [ ] **Authenticate + create the service.** `render login` (or the dashboard) → **New Web Service** → connect the GitHub repo (standing GitHub auth) → root directory `backend/`, runtime **Docker**, **Free** plan, **single instance**, health-check path **`/health`** → verify: the service builds the Docker image and the first deploy goes live.
- [ ] **Set env vars in the Render dashboard** (these are the values the human must enter — secrets never go in the repo):

  | Var                                      | Value (prelim)                                                  | Notes                                                                                                                               |
  | ---------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
  | `LLM_PROVIDER`                           | `openai`                                                        | ILMU is OpenAI-compatible                                                                                                           |
  | `LLM_BASE_URL`                           | `https://api.ilmu.ai/v1`                                        | sovereign gateway                                                                                                                   |
  | `LLM_API_KEY`                            | _ILMU `sk-…`_                                                   | **secret** — dashboard only                                                                                                         |
  | `LLM_MODEL`                              | `nemo-super`                                                    | or `ilmu-nemo-nano` for lighter                                                                                                     |
  | `CORS_ORIGINS`                           | `http://localhost:5173` _(prod Vercel URL appended after DO-1)_ | BE-7; **prod URL only per DQ6**                                                                                                     |
  | `MYINVOIS_BASE_URL`                      | `https://preprod-api.myinvois.hasil.gov.my`                     | fixture path; MyInvois is full-fixture                                                                                              |
  | _(escalation vars)_                      | **unset**                                                       | Q6 pure-ILMU — no `LLM_ESCALATION_*`, no `ANTHROPIC_API_KEY`                                                                        |
  | `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | **unset for the first deploy**                                  | DQ3 fixtures-first; degrades to fixtures (`main.py:64,70`). Add later (pooled runtime / unpooled `setup()`) if Neon is wired (DO-4) |

  → verify: deployed `/health` returns `{"status":"ok"}` (so the CWD-relative `core/fixtures/lawcorpus_seed.json` loads at `/app`); the resulting **public API URL** (`https://<service>.onrender.com`) is captured and handed to FE-6/DO-1.

- [ ] **Cold-start awareness (DQ2).** Note that the free tier **spins down after ~15 min idle** → first request after idle is ~30–60s; pre-warm by hitting `/health` ~1 min before the demo → verify: a pre-warmed `/health` responds fast; a cold `/health` eventually 200s (documents the behaviour for the demo).

**CORS reconcile (cross-lane BE/DO — after DO-1 yields the Vercel URL):**

- [ ] Append the **stable prod Vercel URL** to `CORS_ORIGINS` in the Render dashboard and redeploy (env change, **no code edit** — `main.py:42-49`) → verify: a browser request from the prod Vercel origin to Render is **not** CORS-blocked; an unlisted origin is rejected.

**Worker count + RAG fit:**

- [ ] Keep **`--workers 1`** while MemorySaver is in use (BE-2); multiple workers only become safe once BE-15's Neon checkpointer is live → verify: paused→resume works on the single-worker deploy.
- [ ] Confirm the committed RAG index + static embedder **load inside 256MB or fail open** (RAG is fail-open by design — errors → `[]`, never raise) → verify: deployed `/audit-defense` returns (with RAG providing a page-ref, or degraded to `[]`) without an OOM/crash.

**Acceptance criteria:** the BE is deployed to Render (free tier, single instance, Docker, `$PORT`-bound), `/health` passes, the public URL is captured, CORS is open to the prod Vercel origin (via the env reconcile), RAG loads-or-fails-open within 256MB, and the cold-start behaviour is understood + mitigated. _(Neon deferred per DQ3; if later wired, durable checkpoints come via BE-15.)_

### DO-1 `[DO]` — Deploy FE → Vercel _(committed)_

> Sequence **after FE-6** points the client at the live Render API. Per **DQ4**, the `vercel.json` + FE-6 carry-forward edits ship in one PR.

**AGENT steps (config + build + verify):**

- [x] **Create `frontend/vercel.json`** with the SPA catch-all rewrite React Router 7 needs (otherwise a hard refresh on `/obligations` or `/audit-defense` 404s): `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}` → verify: locally `bun run build` then serving `dist/` with the rewrite resolves a deep-link refresh on all three routes to `index.html` (no 404).
- [x] Confirm the build contract: framework **Vite**, build command `bun run build` (`tsc -b && vite build`), output dir **`dist`** (`frontend/package.json:8`) → verify: `cd frontend && bun run build` emits `dist/` clean; `tsc --noEmit` exit 0.
- [x] Document the exact Vercel project settings + env vars the human enters in `docs/runbook.md` → verify: the runbook's Vercel section lists root dir `frontend/`, the build/output settings, and the three `VITE_*` vars.

**HUMAN steps (Vercel account — must be done by the PO; agents cannot authenticate Vercel or set dashboard env):**

- [ ] **Authenticate + link the project.** `vercel login` → from `frontend/` run `vercel link` (or import the repo in the dashboard) → set **Root Directory = `frontend/`**, Framework **Vite**, Build `bun run build`, Output `dist` → verify: the project links and a first build succeeds.
- [ ] **Set the FE env vars in the Vercel dashboard** (Production scope): `VITE_API_BASE_URL=<render url from DO-2>`, `VITE_API_MOCK=0`, `VITE_SOVEREIGN=0` (or `1` per the FE-5 fallback choice) → verify: the production build reads them (`client.ts:5-6`) and the consoles call Render, not the mock.
- [ ] **Deploy to production** (`vercel --prod`, or the Git integration on push to `main` per DQ5) and capture the **stable prod URL** (`https://<project>.vercel.app`) → hand it back to DO-2's CORS reconcile → verify: the prod URL loads and the consoles run against the live Render API.

**Acceptance criteria:** the FE is deployed to Vercel (root `frontend/`, Vite, `dist`, SPA rewrite in `vercel.json`), the production env vars point at Render with mock off, deep-link refreshes resolve (no 404), and the captured prod URL drives the live backend (and is fed to the Render CORS allow-list).

### DO-3 `[DO]` — Deploy smoke / integration verify (live click-through) _(committed)_

**Purpose:** Prove the two deployed services actually talk end-to-end **on the live URLs** before the demo recording — not just that each is individually "up". This is the TD-team's go/no-go click-through checklist.

**Implementation (run from the live Vercel URL hitting live Render — TD lane):**

- [ ] **Pre-warm + load.** Hit Render `/health` to wake it (DQ2 cold-start), then open the prod Vercel URL → verify: the app loads with **no CORS error** in the console and **no cold-start timeout** on the first real call.
- [ ] **Entity + obligations.** The Obligation console renders the seeded Acme **entity header (from `getEntity`)** + ≥3 obligation rows (form/deadline/status/rule_id) → verify: header + obligations render from the live API.
- [ ] **Classify → cited Form C → HITL gate.** Drop the Acme trial-balance text → `classify` returns `LineItem[]` → the Filing Studio shows the **96px hero `tax_payable RM31,000`**, the honest-number IA, the per-figure `FigureTrace` `<details>`, and the `risk_flags` (`gross_chargeable_gap`) → run `start`→approve→`resume` → verify: the golden `tax_payable RM31,000` reproduces and the HITL approval finalizes the computation over the network.
- [ ] **Audit-defense + the LIVE fabricated-citation rejection (the money-shot).** A standard query returns a cited pack (with a precise page-ref if RAG is live); the fabrication path (DQ1/BE-18 inject, or DQ1=B mock-narrated) shows the **`verified=false` REJECTED** stamp from the deterministic gate → verify: the cited pack renders **and** the rejection reproduces on the deployed stack exactly as the demo script claims.
- [ ] **Sovereign badge.** The FE-5 indicator reflects the **real** per-request route (`sovereign=true` / `nemo-super`) read off the live `/audit-defense` (or `/classify`) `route_info()`, not the mock fallback → verify: the badge shows the live sovereign-ILMU route.
- [ ] **(If Neon is wired per DQ3)** Confirm the **DB-down fallback** still serves the hero beats (stop/ignore Neon → entity + Form C + audit-defense still return seeded data) → verify: DB-down ≠ demo-down holds on the deployed stack.

**Acceptance criteria:** the deployed FE+BE complete the whole demo flow end-to-end over the network — entity loads, obligations render, the filing HITL gate works, the **live** audit-defense fabricated-citation rejection shows `verified=false`, and the sovereign badge reflects the real route — capturing any prod-only breakage early; if Neon is wired, the persistence fallback is confirmed.

### DO-4 `[DO]` — Provision managed Neon Postgres + schema + env _(committed; off the FE critical path; do early so BE-15/16/17 can build)_

**Purpose:** Stand up the managed Neon serverless Postgres (AWS `ap-southeast-1` Singapore region, free tier) and the schema/connection the persistence tasks build on. Neon is **plain Postgres via a connection string** — no vendor SDK. **Sovereignty caveat: Singapore, not MY (Q9)** — prod path is self-hosted / MY-region Postgres with the identical schema. **Per DQ3, this is a FOLLOW-ON after the fixtures-first deploy is proven** — not part of the first Render deploy.

**Implementation:**

- [ ] Create the Neon project (free tier, region `aws-ap-southeast-1`); capture **`DATABASE_URL` (pooled, PgBouncer endpoint)** + **`DATABASE_URL_UNPOOLED` (direct endpoint)**; wire both into **Render** env (DO-2) + local `.env` + document in `.env.example` (no Supabase-style anon/service keys or Studio/PostgREST — Neon is just the connection string) → verify: a connection from local + Render reaches the DB over both endpoints. _(HUMAN-only: Neon account auth + project creation + capturing the connection strings into the Render + local env; agents document the var in `.env.example` but cannot create the account or set dashboard secrets.)_
- [ ] Author the SQL schema/migrations for the tables: LangGraph checkpoints (the checkpointer's own tables, BE-15), `audit` + `links` (EvidenceVault, BE-16 — mirroring the existing `core/evidence.py` columns: `audit(actor, action, payload_hash)`, `links(figure_id, document_id, clause_id)`), and `entities` / `filings` / `defense_packs` (BE-17) → verify: migrations apply cleanly to a fresh DB; schema matches the Pydantic models.
- [ ] **Access path = psycopg/SQLAlchemy over the Postgres connection string** (Neon has no SDK; LangGraph's `PostgresSaver` needs the raw connection); add `langgraph-checkpoint-postgres` + `psycopg[binary]` to `backend/pyproject.toml` → verify: `uv sync` installs them; a smoke query runs over the pooled string.

**Acceptance criteria:** a managed Neon project (SG free tier) with applied schema, pooled+unpooled connection env wired into Render + local + `.env.example`, and `psycopg` + `langgraph-checkpoint-postgres` installed — ready for BE-15/16/17. **Region limitation recorded (Q9); prod = self-hosted MY.**

### BE-15 `[BE]` — Durable LangGraph checkpointer (MemorySaver → Neon Postgres) _(committed; off the FE critical path; biggest robustness win)_

**Purpose:** Make paused HITL filing threads survive restart/redeploy. `api/graph.py` currently hard-compiles `g.compile(checkpointer=MemorySaver())` and `api/main.py` builds it once at module level; `main.py` already flags MemorySaver as non-durable + single-worker. Swap to a Neon-backed Postgres checkpointer.

**Implementation:**

- [ ] **Parameterize the checkpointer:** change `build_filing_graph(llm)` to accept/select a checkpointer (default keeps `MemorySaver` for tests/offline; production uses `PostgresSaver` from `langgraph-checkpoint-postgres` over the Neon `DATABASE_URL`) → verify: with the env set, the module-level `_FILING_GRAPH` uses the Postgres checkpointer; without it, it falls back to `MemorySaver` (tests unaffected).
- [ ] **Neon connection caveat (pooled = PgBouncer transaction mode):** psycopg auto-prepared statements break on the pooled endpoint → open the runtime connection with `{"autocommit": True, "prepare_threshold": 0, "row_factory": dict_row}`; run **`PostgresSaver.setup()` ONCE over the direct/unpooled `DATABASE_URL_UNPOOLED`**, serve runtime traffic over the **pooled `DATABASE_URL`**, and keep the app-side connection pool small (Render 256MB) → verify: `setup()` creates the checkpoint tables over the direct endpoint; runtime start/resume works over the pooled endpoint without a prepared-statement error.
- [ ] Add `langgraph-checkpoint-postgres` + `psycopg[binary]` to `backend/pyproject.toml` (coordinate with DO-4) → verify: `uv sync` installs them; the checkpoint tables exist.
- [ ] **Restart-survival test:** `start` a filing (pauses at interrupt) → simulate process restart (new graph instance / fresh checkpointer connection) → `resume` the same `thread_id` succeeds and returns the finalized computation → verify: the paused thread survives a restart (impossible with MemorySaver today).

**Acceptance criteria:** paused HITL filing threads persist in Neon Postgres and survive restart/redeploy (setup over the direct endpoint, runtime over the pooled endpoint with the transaction-mode psycopg settings); `MemorySaver` remains the offline/test default via a fallback; the start→(restart)→resume test passes.

### BE-16 `[BE]` — Durable EvidenceVault / audit log (sqlite `:memory:` → Neon Postgres) _(committed; off the FE critical path)_

**Purpose:** Persist the audit trail + evidence links beyond process memory. `core/evidence.py` is raw `sqlite3(":memory:")` with `links(figure_id, document_id, clause_id)` + `audit(actor, action, payload_hash)`. **Residency-mitigating detail: the vault stores payload HASHES, not raw payloads** (`log_action(actor, action, payload_hash)`) — so even on the SG-region DB, no raw financial payload leaves; only hashes + metadata persist.

**Implementation:**

- [ ] Back `EvidenceVault` with the Neon Postgres tables (keep the same method surface: `link`, `links_for`, `log_action`, `audit_trail`; reuse the pooled-endpoint psycopg settings from BE-15); keep a **sqlite/in-memory mode** as the default + fallback so tests and a DB-down demo still work → verify: writing + reading links/audit entries round-trips against Neon; with the DB unset, it falls back to in-memory without raising.
- [ ] Confirm the **hashes-not-payloads** property is preserved end-to-end (the residency mitigation) → verify: only `payload_hash` (never a raw payload) is written to the `audit` table.

**Acceptance criteria:** the EvidenceVault audit log + evidence links persist in Neon (hashes only), with an in-memory fallback; the existing `core/evidence.py` API and tests still pass.

### BE-17 `[BE]` — Domain data layer (entities + filings + defense packs) with fixtures fallback _(committed; off the FE critical path; carries caveat #2)_

**Purpose:** Persist the domain data and seed it from the existing fixtures, so the seeded Acme data lives in the DB and endpoints can read from it — **with the fixture/in-memory fallback that makes DB-down ≠ demo-down**. The deterministic core (config/law/computation) stays local — it is **not** "persistence."

**Implementation:**

- [ ] Add a **thin repository** over Neon for `entities`, saved `filings`, and `audit-defense packs` (reuse the pooled-endpoint psycopg settings from BE-15); **seed it from the existing fixtures** (`core/fixtures/entity_acme.json`, etc., + FE-8's extra personas) on startup/migration → verify: `GET /entities/{tin}` (BE-8) and any saved-filing read can serve from the DB-backed repository.
- [ ] **Fallback (caveat #2, hard requirement):** every repository read used by a hero beat falls back to the fixture/in-memory source when Neon is unreachable, so the cited Form C / audit-defense / fabricated-citation-rejection beats **never hard-depend on the DB** → verify: with Neon down, `GET /entities/{tin}` + the demo path still return the seeded data (DB-down ≠ demo-down).
- [ ] Keep the deterministic core local (no DB dependency for computation/law/citation gate) → verify: `compute_form_c`, the law corpus, and `ground_citation` run with the DB absent.

**Acceptance criteria:** entities/filings/defense-packs persist in Neon seeded from fixtures, **with a fixtures/in-memory fallback so the hero beats survive a DB outage**; the deterministic core stays DB-independent.

### BE-6 `[BE]` — Surface the active route on responses _(committed; prerequisite for the live FE-5)_

**Purpose:** Make the sovereign-mode indicator **live and evidence-backed** by reporting which client actually served each request. Under Q6 (pure-ILMU) this reports sovereign-ILMU for every call — but read off the real route, not hardcoded.

**Implementation:**

- [x] Have `RoutingLLMClient` record the route it took (`last_provider` / whether it escalated) and add a `sovereign: bool` + `active_model: str` field to the AI-backed responses (`/audit-defense`; `/documents/classify` from BE-9; and `/filings/form-c*` if a model runs) → verify: the field reports `nemo-super` / sovereign=true for the prelim's pure-ILMU calls; existing tests stay green (add a small test asserting the field is present and correct).

**Acceptance criteria:** AI responses report the active route so **FE-5** binds a live indicator; suite stays green.

### FE-8 `[FE]` — Seed personas + DEMO MODE _(small; demo-prep, near Phase-3 not on the FE-1→FE-4 spine)_

**Purpose:** De-risk the live judge walkthrough — let the presenter pick a known-good entity and make it visually obvious the demo runs on seeded data. A Layak-derived pattern the PO adopted.

**Implementation:**

- [ ] Add **2–3 selectable seed SME personas** (reuse/extend the Acme fixture — e.g. Acme wholesale + one services SME + one employer-heavy SME; just additional seeded `EntityTaxProfile`/trial-balance fixtures; if served live they extend BE-8's lookup / BE-17's seed, else FE mock fixtures) and an entity-picker in the console chrome → verify: switching persona re-renders the consoles with that entity's data.
- [ ] Add a **"DEMO MODE" banner** (driven by an env flag, e.g. `VITE_DEMO_MODE`) making it explicit the run is on seeded fixtures → verify: the banner shows when the flag is on and is absent otherwise.

**Acceptance criteria:** the presenter can select among 2–3 seed personas and a DEMO MODE banner clearly signals seeded data; nothing here blocks the core FE-1→FE-4 flow. _(Small; cut-tolerant — if time is short, ship Acme-only + the banner.)_

### TD-3 `[TD]` — Pitch-deck README + demo script _(incl. the Neon sovereignty-framing sub-task)_

**Implementation:**

- [ ] Write the pitch-deck README (problem / market / **pricing** / roadmap) — fold the YA2026 figures, the ILMU pricing caveat (Q2/A1), the **pure-ILMU sovereignty story** (every inference call in-country incl. **sovereign RAG** — local static embeddings, no foreign API; bge-m3/pgvector as the documented RAG scale path; a sovereign escalation a roadmap item — BE-5, direct-Claude a flagged non-sovereign opt-in), and the "decision-support, not legal advice" guardrail → verify: README covers all four sections.
- [ ] **`[TD]` Neon sovereignty framing (Q9 caveat — do NOT overclaim):** state accurately in TD-3 **and** in prd/trd that **persistence in the prelim uses managed Neon Postgres in Singapore (AWS ap-southeast-1), not Malaysia**, that **only payload hashes (not raw payloads) are stored** there, and that the **prod sovereign path is self-hosted / MY-region plain Postgres with the identical schema (a deploy-config swap — clean because Neon is pure Postgres with no vendor bundle)** → verify: the deck + prd/trd describe inference-is-sovereign-today vs persistence-is-SG-now/MY-in-prod without contradiction; no slide claims "all data stays in Malaysia" unqualified.
- [ ] Write a **≤7:00 demo script** ordered for impact per spec §6.2: classify trial balance → cited Form C → audit-defense pack (with the precise-page citation if RAG is live) → fabricated-citation rejection (the deterministic trust money-shot — **via the BE-18 inject if DQ1=A, else narrated in mock per DQ1=B**) → sovereign-by-default framing (live FE-5 badge) → HITL approval → verify: written script maps to the live console beats, and the fabricated-citation beat's mechanism (live inject vs mock) is stated.

**Acceptance criteria:** a pitch-deck README + a ≤7:00 demo script exist, **and the Neon residency caveat is stated honestly in the deck + prd/trd** (prelim SG / prod self-hosted MY; hashes-not-payloads); the demo script states how the fabricated-citation rejection is produced live (DQ1).

### TD-4 `[TD]` — Demo dry-run + record + final verify + submit

> The deploys are **DO-1/DO-2** and the integration check is **DO-3**; this task is the **rehearse → record → final ⚠verify → package/submit** pass. Depends on DO-1/DO-2/DO-3 being green.

**Implementation:**

- [ ] **Demo dry-run:** run the demo script live against the deployed stack and **time it** → verify: the run lands **under 7:00** and every scripted beat works on the deployed URLs.
- [ ] Record the YouTube video from the dry-run → verify: final cut is **≤7:00**.
- [ ] **Final `⚠verify` pass** on all figures (closes **Q5/TD-6**) — reconcile every rate/threshold/deadline + the seeded Acme figures + **the expanded RAG corpus clauses** vs LHDN/RMCD → verify: every figure and every cited clause reconciles to its cited source.
- [ ] Submit **repo + README deck + YouTube + Vercel link** → verify: submission received **before 28 Jun**.

**Acceptance criteria:** a timed dry-run, a ≤7:00 video, verified figures + clauses, and a completed submission with both services live.

### TD-5 `[TD]` — Expand the plan through submission — **DONE**

- [x] After **TD-1**, flesh out every remaining BE/FE/DO/TD task with steps, `→ verify` checks, acceptance criteria, and a dated timeline slot through 28 Jun; resolve Q1/Q2, raise then (at Gate 1) **resolve Q6 (pure-ILMU)**, **Q7 (classify endpoint)**, **Q8 (sovereign RAG)**, and **Q9 (managed Neon Postgres + caveats)**, fold the Gate-1 deploy + live-FE-5/BE-6 decisions, run a grounded FE↔BE gap sweep (BE-7/8/9/10), fold the **Layak UX patterns** (FE-3/FE-4 bullets; FE-8; FE-9/BE-11 stretch), add the committed **sovereign RAG workstream** (BE-12/13/14) and the **Neon persistence migration** (DO-4 + BE-15/16/17), and tick Phase 1 → Done → verify: every task from today to 28 Jun has a lane tag, acceptance criteria, and a timeline slot. _(This document.)_

**Met:** `plan.md` covers all work from now to the 28 Jun submission, lane-tagged with acceptance criteria and a timeline, with the Gate-1 decisions, the code-grounded gap-sweep tasks, the Layak UX patterns, the sovereign RAG workstream, and the Neon persistence migration folded in.

### TD-6 `[TD]` — Final ⚠verify of YA2026 figures + RAG clauses _(resolves Q5)_

> Folded into the **TD-4** record/verify pass but tracked as its own ID because it has a distinct owner (the product/tax-verify contributor) and a hard gate (no unverified figure/clause ships). **Now also covers the BE-12 corpus expansion** (every added clause's text/section/page).

**Implementation:**

- [ ] Re-`⚠verify` SME bands (15/17/24%), the RM1m e-invoice exemption, CP204/Form C deadlines, the seeded Acme `tax_payable RM31,000`, **and every clause added to the RAG corpus (text + section + page + URL)** vs current LHDN/RMCD/ITA sources; update the provenance file if anything moved → verify: each figure and each clause has a current, cited source; any change is reflected in `ya_2026.yaml` / `lawcorpus_seed.json` + provenance.

**Acceptance criteria:** all demo-visible YA2026 figures **and** all RAG corpus clauses are re-verified current and cited before the deck/video; resolves **Q5**.

### BE-5 `[BE]` — Wire + live-test the escalation (sovereign ILMU model preferred; direct-Claude is a flagged opt-in) — **DEFERRED post-prelim** _(NOT on the 28 Jun critical path)_

> **Q6 resolved pure-ILMU**, so this is a **documented future task**, not prelim work. The `escalate=True` mechanism already exists in `RoutingLLMClient`; this task lights it up once a Claude route is provisioned **after** the submission.

**Implementation (post-prelim):**

- [ ] **PREFER a sovereign escalation:** set `LLM_ESCALATION_MODEL` to a stronger model on the SAME ILMU gateway (stays in-country) — confirm `make_llm()` wraps ILMU in a `RoutingLLMClient` whose **secondary is also `_OpenAICompatClient`@ILMU**. A **direct Anthropic route** (`LLM_ALLOW_DIRECT_ANTHROPIC=1` + `ANTHROPIC_API_KEY`) is the **non-sovereign opt-in** (harden `_AnthropicClient` JSON-mode/escalate forwarding if used). First confirm on the ILMU console whether a stronger/Claude-class model is gateway-hosted → verify: a live critic call on a **valid** s.33(1) claim returns verified=true via the escalation path; the deterministic fabricated-citation rejection is unaffected.

**Acceptance criteria (post-prelim):** the citation-critic's "valid claim ✓verified" badge is reliable via the escalation path. **For the prelim this is intentionally NOT done** — the deterministic gate carries the trust demo on pure ILMU.

### STRETCH — SSE "watch-the-agent-think" streamed stepper _(FE-9 + BE-11; OFF the critical path)_

> **PO chose STRETCH, NOT committed.** Build **only if FE-1→FE-4 + deploy (DO-1/DO-2/DO-3) are on track.** **DEFAULT/fallback (always shipped):** **FE-3 ships a non-streamed stepped-progress UI** over the existing `form-c/start`→`resume` HITL flow — the streaming is a polish upgrade, not a requirement. **FE-9/BE-11 are #1 in the cut-order** (cut first if behind).

#### BE-11 `[BE]` — SSE event contract for streamed filing steps _(STRETCH)_

**Implementation:**

- [ ] Add an SSE endpoint (e.g. `GET /entities/{tin}/filings/form-c/stream`) emitting a typed event contract — `step_started` · `result` · `narrative` · `technical` · `done` · `error` — as the filing graph progresses → verify: a streamed run emits the events in order and terminates with `done` (or `error`); the existing `/start`→`/resume` HITL path is unchanged. _(Note: must not break the in-process `MemorySaver` single-worker constraint from BE-2, unless BE-15's durable checkpointer is in.)_

**Acceptance criteria (STRETCH):** an SSE stream surfaces the filing steps with the six-event contract; the non-streamed flow still works.

#### FE-9 `[FE]` — Streamed agent-step stepper UI _(STRETCH; consumes BE-11)_

**Implementation:**

- [ ] Consume the BE-11 SSE stream in the Filing Studio as a live stepper (step_started → result → narrative/technical → done/error) → verify: the stepper animates through the streamed steps live; on `error` it degrades to the non-streamed stepped-progress UI.

**Acceptance criteria (STRETCH):** the Filing Studio shows a live "watch-the-agent-think" stepper when streaming is available, and falls back to the FE-3 non-streamed stepped-progress UI otherwise.

---

## Timeline / milestones

> **Today = 24 Jun 2026; deadline = 28 Jun 2026 → 4 working days (Wed–Sun).** Net change since the last revision: the persistence provider is **Neon serverless Postgres** (was Supabase) — same Postgres-generic tasks (**DO-4 + BE-15/16/17**), **off the FE critical path**, with a **fixtures/in-memory fallback so DB-down ≠ demo-down**, the recorded **sovereignty caveat** (SG region now / self-hosted MY in prod, Q9), and a **demo-reliability plus** (Neon scales to zero but never permanently pauses → friendlier for an intermittent demo). This stacks on the already-committed **sovereign RAG** (BE-12/13/14) in the same BE lane. Phase 1 (the hard backend) is done; the risk is concentrated in **FE-3/FE-4 depth + the FE-prereq BE + RAG + persistence + deploy + recording** — a heavy BE lane against 4 days. Dates are targets; the **critical path** is marked ★. **Update 25/06/26: the entire FE-prereq + RAG + route-field BE (BE-6/7/8/9/10/12/13/14) has LANDED on `main` (100 tests) — Wed's BE column is effectively done, so the remaining critical path is the FE spine (FE-1→FE-4) → deploy.**

| Day | Date       | Lane focus   | Milestone (critical-path ★)                                                                         | Tasks                                                                                                                                                                                                                             |
| --- | ---------- | ------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wed | **24 Jun** | BE + FE + DO | ★ FE-prereq backend lands + console boots; RAG + Neon provisioning kicked off                       | **BE-8, BE-9, BE-10, BE-7** (thin); **FE-1**; **BE-12** (RAG corpus/build) + **DO-4** (Neon provision) start in parallel; **BE-6** if time                                                                                        |
| Thu | **25 Jun** | FE + BE      | ★ Three consoles render real beats (Layak); RAG retriever wired; durable checkpointer               | **FE-2, FE-3, FE-4, FE-5**; **BE-13/BE-14** (RAG); **BE-15** (durable Neon checkpointer — top persistence win) + **BE-16/BE-17** if lane has room; **TD-3** in parallel                                                           |
| Fri | **26 Jun** | FE → DO      | ★ Live-swap + both services deployed and talking (CORS; RAG loads-or-fails-open; DB fallback holds) | **BE-18** (if DQ1=A) → **DO-2** (Render, fixtures-first per DQ3) → **FE-6** (live-swap + 3 carry-forwards) → **DO-1** (Vercel, `vercel.json`) → **DO-3** smoke; **FE-8**; **FE-7** if ahead; **FE-9/BE-11 stretch only if green** |
| Sat | **27 Jun** | TD           | ★ Timed dry-run + record + final ⚠verify (figures + RAG clauses)                                    | **TD-4** dry-run + record, **TD-6** ⚠verify                                                                                                                                                                                       |
| Sun | **28 Jun** | TD           | ★ **SUBMIT** (repo + deck + video + Vercel link) — **buffer/contingency day**                       | **TD-4** submit                                                                                                                                                                                                                   |

**Critical path (FE spine + deploy, unchanged):** `{BE-7, BE-8, BE-9} → FE-1 → {FE-2 (BE-8), FE-3 (BE-9), FE-4} → {BE-18 if DQ1=A} → DO-2 (BE-7, Render URL) → FE-6 (live-swap + carry-forwards) → DO-1 (Vercel) → DO-3 (live smoke) → TD-4 (dry-run→record→submit)`. **The `{BE-7,8,9}` prefix is now DONE on `main`, so the live critical path starts at FE-1.** **Both the RAG workstream (BE-12→13→14) and the Neon migration (DO-4 → BE-15/16/17) are parallel BE/DO side-branches — NOT on the critical path.** RAG slips → fall back to the constrain-to-corpus gate; Neon slips → fall back to fixtures/in-memory (DB-down ≠ demo-down). **BE-10** pairs with FE-1; **BE-6→FE-5** and **FE-8** are small side-branches; **FE-9/BE-11 (SSE) are STRETCH**.

**Prelim-critical vs cut-first (if a day slips):**

- **Prelim-critical (committed, must ship):** BE-7 (CORS), BE-8, BE-9, FE-1, FE-2, FE-3 (incl. classify + HITL gate + Layak trust-trio), FE-4 (incl. the live deterministic fabricated-citation rejection — the trust money-shot — + two-tier trace), FE-5, FE-6 (live-swap + the 3 QA carry-forwards), **BE-18 (if DQ1=A — the live money-shot)**, BE-6, FE-8, DO-1, DO-2, DO-3, TD-3 (incl. the Q9 sovereignty-framing sub-task), TD-4, TD-6. **RAG (BE-12/13/14) and Neon persistence (DO-4 + BE-15/16/17) are committed but degrade safely** — see the cut-order.
- **Cut-first if behind (in priority order):** (1) **FE-9 + BE-11 (SSE stretch)** — never block; (2) **FE-7** styling polish; (3) **Neon persistence (DO-4 + BE-15/16/17)** — committed, but it **degrades to fixtures/in-memory cleanly (DB-down ≠ demo-down)**, so if the BE/DO lane overloads, cut it _before_ the FE spine — drop in this order: BE-17 domain layer first (endpoints keep reading fixtures), then BE-16 audit log (in-memory sqlite stays), keeping **BE-15 durable checkpointer** as the last-to-cut persistence item (it's the biggest robustness win and the cleanest); (4) **RAG depth (BE-12/13/14)** — degrades to the constrain-to-corpus + gate (shrink corpus, then drop wiring, keep BE-14's gate-invariant green); (5) the **Layak depth on FE-3/FE-4** (drop FE-3 `<details>` panel, then FE-4 technical transcript — keep the 96px hero + honest-number IA + live citation rejection + verified/unverified badge); (6) **FE-8** → Acme-only + DEMO MODE banner; (7) **BE-10** 422 envelope; (8) **FE-5/BE-6** live binding → static truthful badge; (9) **BE-9** classify beat → pre-classified fixtures; (10) **TD-3** deck depth (but NOT the Q9 sovereignty-framing sub-task — that is honesty-critical and stays). **If DQ1=B, BE-18 is not built** (rejection demoed in mock). **BE-5 already cut** (post-prelim). _Note: Neon + RAG are cut **above** the FE-spine protections precisely because both degrade to working fallbacks — neither may delay FE-1→FE-4 or deploy. **DB-down ≠ demo-down must hold even if Neon is fully cut.**_
- **Localhost contingency (deploy is committed, but keep the safety net):** prd/trd both state _localhost is acceptable for the prelim_. If Render/Vercel slips on Fri, record TD-4 against localhost and submit, then finalize the deploy. **Note:** BE-7 CORS is still required even on localhost (Vite `:5173` ↔ API `:8000` are cross-origin).

**Realism flag (explicit).** This revision keeps the **two real workstreams (Neon persistence + RAG) in the same BE/DO lane in a 4-day window — PL flagged the load; the PO accepted (Q9)**; the Supabase→Neon swap is provider-only and does not change the load. Honest assessment: **the BE/DO lane is the binding constraint**, not the FE spine. One backend dev cannot realistically land BE-7/8/9/10 (Wed) **and** RAG BE-12/13/14 **and** Neon DO-4 + BE-15/16/17 **and** BE-6 across Wed–Thu without either more hands or aggressive cutting. **What makes it survivable:** (1) **both new workstreams are off the FE critical path and degrade to working fallbacks** — RAG → constrain-to-corpus gate, Neon → fixtures/in-memory — so a slip costs robustness/persistence, _not_ a broken demo; (2) the **demo-resilience requirement is baked into the tasks** (BE-17 fallback + DO-3's DB-down check), so **DB-down ≠ demo-down** holds by construction even if persistence is fully cut, and **Neon's scale-to-zero-never-pause behaviour reduces** the intermittent-demo cold-start/pause risk vs a provider that suspends idle free projects; (3) within persistence, **BE-15 (durable checkpointer) is the single highest-value item** and the cleanest to land alone — if only one persistence task ships, ship BE-15. **Three threats to flag plainly:** (a) **lane overload** — the realistic outcome is that some of {RAG depth, Neon} gets cut; the cut-order puts them above the FE spine so the demo is protected; (b) **sovereignty honesty** — managed Neon is **SG, not MY**, in tension with the core thesis; this is **non-negotiably** stated in the deck + prd/trd (TD-3's Q9 sub-task) so the project doesn't overclaim — that sub-task is honesty-critical and is **not** a cut candidate; (c) **the Neon pooled-endpoint psycopg caveat** (PgBouncer transaction mode → `prepare_threshold=0` + `setup()` over the unpooled endpoint) is a real first-run gotcha — BE-15 encodes it so it isn't discovered live at deploy. **Net:** the FE spine + deploy + demo **hold with Sunday as a buffer**; the **committed-but-degradable BE workstreams (RAG, Neon) are the relief valves** — expect to ship BE-15 + RAG-core and to cut depth elsewhere if the single BE lane saturates. If the team can add a second backend hand for Wed–Thu, both workstreams become comfortably attainable. **Update 25/06/26 — the BE lane DID land (BE-6/7/8/9/10/12/13/14 on `main`, 100 tests); the binding constraint is now solely the FE spine FE-1→FE-4, which is the relief the realism flag hoped for.** **Deploy-iteration update 25/06/26 — the remaining open work is the deploy cycle: `BE-18 (if DQ1=A) → DO-2 → FE-6 → DO-1 → DO-3`, with the FE-6 carry-forwards and the live money-shot (DQ1) as the load-bearing risk; the human-only Render/Vercel auth + dashboard-env steps are the gating actions on Fri.**

---

## Done

> Completed work, terse. Full detail lives in [`progress.md`](progress.md). `[DECISION]` lines are PO-locked and must not be dropped.

### Phase 1 — AI layer + core gaps (BE-1…BE-4, TD-1/TD-2; merged to `main`)

ILMU-first AI layer landed and live-verified; **79 backend tests pass** (40 → 79). **BE-1:** `RoutingLLMClient` (ILMU-first → the configured secondary on error / on `escalate=True` for the critic), `_OpenAICompatClient` JSON mode, `api/jsonio.loads_relaxed`, live spike (`scripts/spike_ilmu.py`) — per-task routing decided (resolves Q1). **BE-2:** HITL filing graph mounted — `POST …/filings/form-c/start` + `…/resume` (module-level graph + in-process `MemorySaver` → single Uvicorn worker; made durable in BE-15). **BE-3:** `assess_risk` → 4 deterministic checks (`turnover_mismatch`, `negative_chargeable`, `gross_chargeable_gap`, `zero_tax_positive_income`), wired into `form-c` + `/start` (`risk_flags` `{code,message,severity}` in responses). **BE-4:** live MSIC `GET /reference/msic/{code}` (data.gov.my, cached singleton) + `holidays`-backed deadline-shift helpers in `core/deadlines.py`. **TD-1:** prd/trd reconciled to current decisions. **TD-2:** routing + endpoint tests green. **Carry-forward:** the escalation mechanism exists but is dormant for the prelim (Q6 = pure-ILMU; the secondary defaults to a sovereign ILMU model, direct-Claude a flagged opt-in; live-validation is post-prelim BE-5); holiday-shift not wired into obligation output (preserves golden due dates).

- **[DECISION] AI-layer feasibility CONFIRMED (live-verified)** — `nemo-super` runs the core loop sovereign-by-default: documents-classify ✓, deductibility cite verifies `ITA-1967-s33(1)` ✓, all agents parse JSON live. The **only** weak step is the citation-**critic** (false-negatived a valid claim). The fabricated-citation money-shot is the **deterministic clause-ID gate** (no LLM) → works on pure ILMU.
- **[DECISION] Q6 → PURE-ILMU for the 28 Jun prelim (Gate 1).** Stay 100% sovereign for inference: the deterministic clause-ID gate carries the trust demo; `nemo-super`'s weaker semantic-critic is accepted on the "valid claim ✓verified" badge. **Escalation (BE-5) is deferred post-prelim** — out of the critical path, no secondary (sovereign ILMU model preferred; direct-Claude a flagged opt-in) configured for the prelim. Rationale: airtight sovereignty story + 4-day window + demo-safe (money-shot is the deterministic gate).
- **[DECISION] Q7 → ADD the trial-balance ingestion endpoint (Gate 1).** Expose `documents.classify_line_items` over HTTP (**BE-9**, `POST …/documents/classify`) so the Filing Studio shows raw trial-balance → classified items → Form C; BE-9 also wires JSON mode for the `documents` agent (it lacked it). FE-3 consumes it.
- **[DECISION] Layak UX patterns adopted (PO-selected; Gate 1).** Fold the cited-results **trust-trio** (per-figure/citation `<details>` + verified/unverified badge · honest-number IA · 96px hero numeral) and the **two-tier Audit-Defense trace** (lay narration + collapsible deterministic-core technical transcript) into **FE-3/FE-4** as acceptance bullets; add **FE-8** (2–3 seed personas + DEMO MODE banner). **Grounded constraint:** clause-level cites render only where they exist — `DefensePack.citations` (FE-4); the Filing Studio figures show the `FigureTrace` (rule_id/config_version/inputs), not clause-IDs. The SSE "watch-the-agent-think" stepper (**FE-9/BE-11**) is **STRETCH, off the critical path**; the non-streamed stepped-progress UI is the default. The "demo-narrative inversion (MyGov-failure framing)" item was **not** selected — TD-3 unchanged on that point.
- **[DECISION] Sovereign RAG (Q8, Gate 1)** — **RAG = local static embeddings (`model2vec`/potion) + committed numpy index (`vectors.npz` + `chunks.json`, offline build → `lru_cache` runtime → cosine top-k → fail-open) + the deterministic clause-ID gate (`ground_citation`) STAYS AUTHORITATIVE; bge-m3/e5-small + pgvector = the documented scale path.** RAG retrieves candidate clauses (replacing the full-ID dump) and threads the verbatim passage + precise section/page ref into the `Citation` (improving on Layak, which lost the page); curated/hardcoded citations remain the prepended fallback (belt-and-braces); RAG **never decides figures or eligibility**. Fully sovereign — in-process, **no foreign API (not Google/Gemini, not a remote call)** — sized for the **Render 256MB free tier**. Tasks **BE-12/BE-13/BE-14**. **Committed but off the FE critical path — degrades safely to the existing gate. Stays on the numpy index, NOT a Postgres pgvector store (Q9).**
- **[DECISION] Neon persistence (Q9, Gate 1; PO directive over PL's recorded pushback)** — **managed Neon serverless Postgres (AWS `ap-southeast-1` Singapore region, free tier), FULL data layer:** LangGraph HITL checkpoints (**BE-15**, MemorySaver → `PostgresSaver` over Neon), EvidenceVault audit log (**BE-16**, sqlite `:memory:` → Neon, **hashes-not-payloads**), entities + filings + defense-packs (**BE-17**, seeded from fixtures); provisioning + schema + env is **DO-4**. Neon = **plain Postgres via a connection string** (psycopg/SQLAlchemy, `langgraph-checkpoint-postgres`), pooled `DATABASE_URL` + direct `DATABASE_URL_UNPOOLED` (run `PostgresSaver.setup()` over the direct endpoint; serve runtime over the pooled endpoint with `prepare_threshold=0` for PgBouncer transaction mode). **Rationale for Neon:** no-pause free tier (scales to zero but never permanently suspends → intermittent-demo friendly, ~sub-second cold start) + pure-Postgres minimal surface + identical app code ⇒ a clean future lift to a MY-region Postgres. **Sovereignty caveat (PROMINENT, documented limitation):** Neon has **no MY region** (nearest SG) — **in tension with the sovereign-by-default/PDPA thesis**; mitigated by (a) **payload hashes, not raw payloads**, and (b) the **prod sovereign path = self-hosted / MY-region plain Postgres, identical schema (residency = a deploy-config swap; cleaner because Neon has no vendor bundle)**. **A `[TD]` sub-task (in TD-3) states this honestly in the deck + prd/trd** (prelim SG / prod self-hosted MY) — must not overclaim full sovereignty. **Demo resilience (hard req):** the hero beats run on deterministic seeded data with a **fixtures/in-memory fallback — DB-down ≠ demo-down**. **RAG stays on the numpy index, NOT pgvector** (fail-open + DB-independent + sovereign); pgvector-on-Neon noted as a _prod consolidation_ option only. **Committed but off the FE critical path + high in the cut-order (degrades to fixtures/in-memory). PL recorded this as a real workstream added to a 4-day crunch with a sovereignty tension; the PO accepted.**

### Phase 0 — Monorepo Restructure (PR #1, merged to `main`, 23/06/26)

Clean strictly-modular monorepo rooted at `CukaiPandai/` (`backend/` + `frontend/` + root Bun/JS tooling + root conventions `CLAUDE.md`); no redundant paths. RQ1–RQ6 resolved at Gate 1. QA fix-pass M1–M6 applied. Hard gates green: **pytest 40 passed**; **FE `vite build` clean**.

- **`[DO]` — Root tooling + conventions** (R-DO-1…4): root `package.json` (private, Bun) with biome + husky + commitlint + lint-staged + prettier; `biome.json` (scoped to `frontend/**`, excludes `backend/**`); `commitlint.config.js` (Conventional, 8 allowed types); `.prettierrc` (mirrors devkit); `.husky/{pre-commit,commit-msg}`; `lint-staged`; `.vscode/settings.json`; `AGENTS.md` (`@CLAUDE.md`); merged root `.gitignore` (Python + JS/Bun + env); new root `CLAUDE.md` (references `docs/roles.md` + `.claude/CLAUDE.md`, carries the 4 PO-locked directives: pm-workflow path + source URL · PR-then-`gh`-self-merge + Gate 2 · read PRs/commits before each iteration · plan.md + progress.md are shared state, no task-list.md).
- **`[DO]` — Backend relocation + CI/Docker** (R-BE-1/2): `git mv` `api/` `core/` `tests/` `pyproject.toml` `Dockerfile` `docker-compose.yml` → `backend/` (history preserved, renames). CWD discipline (corpus path left unchanged; run from `backend/`); `ci.yml` `test` job pinned to `working-directory: backend`, docker-build job to `./backend`. `.env.example` stays at repo root. 40 tests still pass from the new layout.
- **`[FE]` — Frontend rebuild** (R-FE-1/2): deleted the wrong-stack Next.js 14 tree (10 routes, Tailwind, postcss, 13 vitest specs) — no salvage. Scaffolded fresh **Vite 5 + React 18 + TS + React Router 7 + token-CSS** SPA in `frontend/` (Bun; no Tailwind/shadcn); copied the **real** ProofRank devkit `tokens.css`; typed API client over the 3 endpoints with mock mode; 3 routed consoles (`/obligations`, `/filing`, `/audit-defense`). `tsc --noEmit` clean; `vite build` green.

### Baseline (pre-restructure, verified 23/06/26)

- **`[BE]` — Deterministic core (`core/`):** obligation + computation engines, deadlines (holiday-shift), citation gate, law-corpus loader, YA2026 config (figures verified + cited), Pydantic models, seeded Acme fixtures. TDD.
- **`[BE]` — Agentic API (`api/`):** 6 agents + LangGraph filing graph with HITL `interrupt` + FastAPI (3 live POST endpoints + `/health`) + `LLMClient` adapter (Anthropic / OpenAI-compat / Fake). TDD. _(Phase-1 closed the carried gaps: graph endpoint-mounted (BE-2); `assess_risk` → 4 checks + wired (BE-3); `_OpenAICompatClient` JSON mode + `RoutingLLMClient` (BE-1).)_
- **`[TD]` — Tests/infra:** 40 automated tests pass incl. an offline e2e pipeline (`tests/api/test_integration_e2e.py`); Docker compose + CI (pytest + Docker build); image is Render-deployable as-is.
- **Verified facts:** YA2026 figures reconciled vs LHDN/RMCD with provenance (SME bands 15/17/24%, e-invoice exemption raised to RM1m from 2026, final phase cancelled). Seeded demo: Acme TIN `C2581234509`, `chargeable_income RM200,000` → `tax_payable RM31,000`. ILMU API verified (tri-SDK base URLs, `sk-` key, `nemo-super` chat/SSE/tool-use/JSON). MyInvois sandbox OAuth verified live (HTTP 200; `/documents/recent` returns 0 docs → demo uses fixture).

### Decisions (PO-locked)

- **[DECISION] Backend package manager: uv (primary)** — `uv.lock` committed, CI (`astral-sh/setup-uv`) + `backend/Dockerfile` on uv; pip remains a fallback (standard pyproject).
- **[DECISION] Stack** — Backend: Python ≥3.11 · Pydantic 2 · FastAPI + Uvicorn · LangGraph · httpx → Render. Frontend: Vite 5 + React 18 + TS + React Router 7 + token-CSS (no Tailwind/shadcn), Bun → Vercel. Monorepo: `backend/` + `frontend/` under `CukaiPandai/`. **Persistence: managed Neon serverless Postgres (SG free tier) for the prelim; self-hosted/MY-region plain Postgres for prod (Q9).**
- **[DECISION] LLM routing** — **ILMU `nemo-super` primary** (sovereign, 100% in-country). **Escalation/failover stays sovereign by default** — a stronger model on the SAME ILMU gateway (`LLM_ESCALATION_MODEL`, one `sk-` key). A **direct Anthropic (Claude) call is a flagged non-sovereign opt-in** (`LLM_ALLOW_DIRECT_ANTHROPIC=1`, OFF by default — it leaves Malaysia). **For the 28 Jun prelim: PURE-ILMU** (Q6, Gate 1) — no escalation wired; the `escalate=True` mechanism exists but stays dormant (BE-5). _(Whether ILMU hosts a stronger/Claude-class model on the gateway is TBC on the ILMU console — see BE-5.)_
- **[DECISION] Trial-balance ingestion (Q7, Gate 1)** — expose `classify_line_items` over HTTP (**BE-9**) so the demo shows raw trial-balance → classified line items → Form C; wire JSON mode for the `documents` agent as part of it.
- **[DECISION] Layak UX (Gate 1)** — adopt the trust-trio + two-tier trace as FE-3/FE-4 acceptance bullets + FE-8 (seed personas + DEMO MODE); SSE stepper (FE-9/BE-11) is STRETCH/off-path with a non-streamed default; cites render only where they exist (DefensePack vs FigureTrace). MyGov-failure framing not adopted.
- **[DECISION] Sovereign RAG (Q8, Gate 1)** — **local static embeddings (`model2vec`) + committed numpy index + deterministic clause-ID gate authoritative; bge-m3/e5 + pgvector = scale path.** Offline build → `lru_cache` cosine top-k → fail-open; precise page/section ref threaded into the `Citation`; curated citation = prepended fallback; in-process, no foreign API, sized for Render 256MB. Tasks BE-12/BE-13/BE-14; committed but parallel to FE / off the critical path, degrades to the existing gate. Stays on the numpy index, not a Postgres pgvector store.
- **[DECISION] Neon persistence (Q9, Gate 1; PO over PL pushback)** — **managed Neon serverless Postgres (SG free tier), full data layer** (checkpoints BE-15 · audit log BE-16, hashes-not-payloads · entities/filings/packs BE-17, fixtures-seeded), provisioned by DO-4. **Plain Postgres via connection string** (psycopg + `langgraph-checkpoint-postgres`; pooled `DATABASE_URL` runtime + direct `DATABASE_URL_UNPOOLED` for `setup()`; `prepare_threshold=0` for PgBouncer). **Demo-reliability plus: scales to zero, never permanently pauses.** **Sovereignty caveat: SG not MY** — documented limitation, **prod = self-hosted/MY-region plain Postgres (identical schema, deploy-config swap, clean because no vendor bundle)**; TD-3 `[TD]` states this honestly in deck + prd/trd. **Demo resilience: fixtures/in-memory fallback — DB-down ≠ demo-down.** RAG stays on the numpy index (not pgvector). Off the FE critical path; high in the cut-order (degrades to fixtures/in-memory).
- **[DECISION] Connectors** — MyInvois = **full fixture** (live OAuth verified but `/documents/recent` empty); **data.gov.my MSIC** is the only live external call (BE-4, verified `46900→4690`); SSM/MySST seeded; BNM FX callable. Stated transparently (spec §10).
- **[DECISION] Team & timeline** — team of 3; target submission **28 Jun 2026** (repo + README deck + YouTube ≤7:00 + Vercel link). **CORS (BE-7) + deploy committed** (Vercel + Render); localhost retained as contingency only (and still needs BE-7 — Vite/API are cross-origin locally too).

---
