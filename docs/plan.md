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

---

## Phase 1 — AI layer + core gaps → **DONE** (79 tests pass)

> **COMPLETE.** BE-1 (ILMU-first `RoutingLLMClient` + JSON mode + live spike), BE-2 (HITL filing graph mounted over FastAPI: `…/filings/form-c/start` + `…/resume`), BE-3 (`assess_risk` → 4 deterministic checks, wired; `risk_flags` in responses), BE-4 (live MSIC `GET /reference/msic/{code}` via data.gov.my + holidays-backed deadline shift), TD-1 (prd/trd reconciled — the gate **TD-5** depended on), TD-2 (routing + endpoint tests). **79 backend tests pass.** Per-task routing decided (resolves Q1). Full detail → [`progress.md`](progress.md). **Carry-forward:** the Claude-escalation path is wired but stays dormant for the prelim — **Q6 resolved pure-ILMU**, so the critic runs on `nemo-super` and live-validating the escalation is the post-prelim **BE-5**; `shift_for_malaysian_holidays` lives in `deadlines.py` but is deliberately not wired into `derive_obligations` output (preserves the demo's golden due dates). **MemorySaver is flagged non-durable in `api/main.py` → made durable in Phase 3 (BE-15).**

### BE-1 `[BE]` — AI-layer stack (ILMU-first routing) — **DONE**

- [x] Buy ILMU Claw Starter (RM27) — seat active, `sk-` key issued.
- [x] Run the 4-prompt spike (`nemo-super`) across profiler / documents / deductibility / audit-defense / citation-critic — per-task table captured in `progress.md`; weak step identified (**citation-critic**), resolving **Q1**. _(Claude head-to-head deferred — Q6 resolved pure-ILMU → post-prelim **BE-5**.)_
- [x] Build `RoutingLLMClient` (ILMU-first → the configured secondary on error + on `escalate=True` for the critic) — unit tests cover primary / failover / escalate / no-fallback. _(The escalate path stays dormant for the prelim per Q6; the mechanism is retained for post-prelim BE-5 — the secondary defaults to a sovereign ILMU model, with direct-Claude a flagged opt-in.)_
- [x] Add `response_format={"type":"json_object"}` to `_OpenAICompatClient`; JSON-mode parses. Spike-driven fix: JSON agents constrained to `LawCorpus.ids()`; relaxed JSON parse via `api/jsonio.loads_relaxed`. _(Note: `documents.classify_line_items` does NOT yet pass `json_schema` — wired in **BE-9** when it goes on an HTTP path. The `allowed = ", ".join(corpus.ids())` full-ID dump in `deductibility`/`audit_defense` is what **BE-13** replaces with RAG-retrieved candidates.)_

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

> Mostly `[FE]` (the Vercel deploy is split out to **DO-1**), plus three **FE-prereq `[BE]` tasks surfaced by the gap sweep** — **BE-8** (`GET /entities/{tin}`), **BE-9** (trial-balance classify endpoint), **BE-10** (consistent 422 error envelope) — and a committed **sovereign RAG `[BE]` workstream** (**BE-12/BE-13/BE-14**) that runs **parallel to the FE spine, NOT on the FE critical path**. Builds on the **R-FE-2** scaffold (Phase 0) + the live Phase-1 backend. **Gating task: FE-1.** **Sequencing from the gap sweep: BE-8 → FE-2, BE-9 → FE-3, BE-10 alongside FE-1.**
>
> **Layak UX patterns (PO-adopted) live as acceptance bullets on FE-3/FE-4** — the cited-results "trust trio" (citation `<details>` panel + verified/unverified badge · honest-number IA · 96px hero numeral) and the two-tier Audit-Defense trace. **Grounded constraint (from the gap sweep): render each citation where it actually exists** — the Filing Studio's per-figure trace is the **`FigureTrace`** (`value`+`inputs`+`rule_id`+`config_version`); **clause-level citations live only in the audit-defense `DefensePack.citations[{claim,clause_ids,verified}]`**. Do **not** promise clause cites on the form-c figures. _(RAG (BE-13) enriches the audit-defense citation with the verbatim passage + precise page ref, which FE-4's `<details>` panel surfaces — but only where the data exists.)_
>
> **Reality check (verified this session against `backend/api/main.py` + `schemas.py` + `core/models.py` + `core/lawcorpus.py` + `core/citations.py` + the two RAG-consuming agents):** live routes are `GET /health`, `POST …/obligations`, `POST …/filings/form-c`, `POST …/audit-defense`, `POST …/filings/form-c/start`, `GET /reference/msic/{code}`, `POST …/filings/form-c/resume`. **No `GET /entities/{tin}`** (BE-8), **no classify endpoint** (BE-9), **no CORS** (BE-7), bad `ssm`/`line_items` → **uncaught 500 not 422** (BE-10). The law corpus is a **5-clause `lawcorpus_seed.json`**; `Clause` is `{clause_id, text, source}` (**no section/page/url fields yet** → BE-12 extends the model); both `deductibility.cite_treatment` and `audit_defense.build_defense` feed the model `allowed = ", ".join(corpus.ids())` (the full-ID dump RAG replaces); `ground_citation` checks `corpus.exists(cid)` (the authoritative gate).

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

**Purpose:** Get the existing Vite + React console shell building, then bring the typed API client up to the **actual** Phase-1+Phase-2 backend surface so every later console has real methods to call.

**Implementation:**

- [ ] Confirm the **R-FE-2** scaffold boots: `cd frontend && bun install && bun run dev` (Vite + React + RR7 + `tokens.css`); `tsc --noEmit` + `bun run build` clean → verify: dev server serves `/obligations`, `/filing`, `/audit-defense`; build is green.
- [ ] Extend `frontend/src/api/client.ts` to cover **every** shipped + new endpoint: `getEntity(tin)` (BE-8), `classifyTrialBalance(tin, raw_text)` (BE-9), `startFiling(tin, ssm, line_items)` → `{thread_id, computation, requires_approval, risk_flags}` + `resumeFiling(tin, thread_id, approved)` (BE-2), `getMsic(code)` (BE-4); add `risk_flags: RiskFlag[]` to the form-c types and a `RiskFlag` type (`{code, message, severity}` — exact shape from `core/models.py`); type the 422 error envelope (BE-10) → verify: `tsc --noEmit` clean; mock-mode fixtures exist for each new method.
- [ ] Keep **mock mode** (`VITE_API_MOCK=1`) mirroring every endpoint schema incl. the new entity/classify/HITL/MSIC/risk shapes → verify: all three routes render end-to-end in mock mode (resolves **Q3** at this gate).

**Acceptance criteria:** `frontend/` boots with 3 routed consoles; the typed client covers **all** shipped endpoints (entity, obligations, classify, form-c, form-c/start+resume, audit-defense, reference/msic) with mock fixtures, the `RiskFlag` type, the 422 envelope, and clean types.

### FE-2 `[FE]` — Obligation Calendar console _(needs BE-8)_

**Implementation:**

- [ ] Fetch the entity via `getEntity` (BE-8) for the header, then render the derived obligation set (Form C + CP204 + any seeded e-invoice/SST/employer rows) as a calendar/list with `due_date`, `form`, `status`, `rule_id` (the `ObligationCalendar` shape is already sufficient — `entity_tin` + `obligations[]`) → verify: Acme calendar renders from the obligations endpoint (mock + live).
- [ ] Pre-seed a couple of obligations so the calendar doesn't look thin (per spec §6.2 "weak beat" mitigation) → verify: ≥3 obligation rows show.

**Acceptance criteria:** Obligation Calendar displays the seeded entity header + obligations with form/deadline/status, populated enough to demo well.

### FE-3 `[FE]` — Cited Filing Studio (+ classify + human-approval gate + risk flags + Layak trust-trio) _(needs BE-9, BE-2)_

**Implementation:**

- [ ] Drop raw trial-balance text → `classifyTrialBalance` (BE-9) → show the classified `LineItem[]` → feed into the filing → verify: the Acme trial-balance text classifies and flows into Form C.
- [ ] Render Form C with `tax_payable RM31,000` and **per-figure traces** — each field shows `value` + `inputs` + `rule_id` + `config_version` (the `FigureTrace` money-shot; this is the figure→rule trace, the spec's "every figure cited" beat — clause-level per-figure citations are an audit-defense feature, **not** in the form-c response) → verify: every field shows its trace.
- [ ] Surface the **`risk_flags`** (`{code, message, severity}`) returned by `/start` (and `/form-c`) so the reviewer sees audit-risk context before approving — show the `gross_chargeable_gap` flag firing on Acme → verify: at least one risk flag renders.
- [ ] Wire the **HITL approval gate**: `startFiling` → render the interrupt → `resumeFiling(approved=true)` resumes and shows the finalized computation → verify: approval resumes the graph and the studio reflects the approved result (uses BE-2).
- [ ] **(Layak) Per-figure citation `<details>` panel:** each Form C figure expands to its **`FigureTrace`** detail (the `rule_id` + `config_version` + the `inputs` it derived from — what the form-c response actually carries); click-to-expand, collapsed by default → verify: expanding a figure shows its rule*id/config_version/inputs trace. *(Do NOT render clause-IDs here — they aren't in the form-c response.)\_
- [ ] **(Layak) Honest-number IA:** lay out _tax payable / computed liability_ in its own visually distinct section, separated from any _reliefs / credits / refunds_ lines, so the headline figure stays unambiguous → verify: liability and reliefs/credits render in separate, visually distinct sections.
- [ ] **(Layak) 96px hero numeral** for the headline figure (`tax_payable`) → verify: the headline numeral renders at the hero scale (~96px) and stays legible/responsive.

**Acceptance criteria:** raw text classifies into the studio; Form C renders with a **96px hero `tax_payable`**, an **honest-number IA** (liability separated from reliefs/credits), and a **per-figure `<details>` trace panel showing the `FigureTrace` (rule_id/config_version/inputs — no clause-IDs)**; risk flags are visible; and an interactive approval gate drives the real `/start`→`/resume` graph.

### FE-4 `[FE]` — Audit-Defense console (hero) + live fabricated-citation rejection + two-tier trace _(Layak)_

**Implementation:**

- [ ] Turn a pasted query (e.g. _"Justify your RM4,800 repairs deduction"_) into a cited `DefensePack` — render `items` (`[{contested_item, evidence}]` — loosely-typed `list[dict]`, so render defensively), `citations` (`{claim, clause_ids, verified}`), and the `exposure_note` (s.112/113) → verify: cited pack renders from the audit-defense endpoint.
- [ ] Show the **verifier rejecting a fabricated citation live** — a claim citing a clause-ID **not in the corpus** renders `verified=false` and is visibly blocked (this is the deterministic `ground_citation` gate — **the prelim trust money-shot, runs on pure ILMU per Q6, and is unchanged by RAG per BE-13/BE-14**) → verify: a fabricated citation is visibly rejected in the UI.
- [ ] Handle the controlled **502** from `/audit-defense` (unparseable model output) gracefully (don't white-screen) → verify: a forced 502 shows a friendly error, not a crash.
- [ ] **(Layak) Citation `<details>` panel + verified/unverified badge** on every `DefensePack.citations` entry: show the `claim`, its `clause_ids`, the supporting passage **and (when RAG/BE-13 is on) the precise page/section ref**, with click-to-open; a **badge distinguishes verifier-passed (`verified=true`) from rejected (`verified=false`)** citations → verify: a passed citation shows a "verified" badge + expandable clause detail (with page ref if present); a rejected one shows a clearly-different "unverified/rejected" badge.
- [ ] **(Layak) Two-tier trace — lay narration + collapsible "technical details":** a plain-language narration of the defense, plus a collapsible transcript that surfaces the **deterministic-core computation trace** (figure → `rule_id`/`config_version` → citation/clause) for the cited figures → verify: the lay layer reads as prose; expanding "technical details" reveals the figure→rule→citation trace.

**Acceptance criteria:** Audit-Defense produces a cited pack with a **per-citation `<details>` panel + verified/unverified badge** (showing the precise page ref when RAG is on), a **two-tier trace** (lay narration + collapsible deterministic-core technical transcript), **visibly rejects a fabricated citation** live, and degrades gracefully on a model-parse failure.

### FE-5 `[FE]` — Live sovereign-mode indicator _(depends on BE-6)_

> **RESOLVED at Gate 1 → live, not hardcoded.** The indicator binds to the real `sovereign`/`active_model` field that **BE-6** adds to AI responses. Under the **pure-ILMU** decision (Q6) it will truthfully read **"sovereign — ILMU `nemo-super`"** for every call — BE-6 still earns its place by making that claim **evidence-backed** (read off the actual route the request took) rather than a hardcoded label. **Sequence: BE-6 → FE-5.**

**Implementation:**

- [ ] Read the `sovereign`/`active_model` field from BE-6 and render an "in-country (ILMU `nemo-super`)" badge in the console chrome (the field is the source of truth, so if a route ever escalated it would read "Claude" honestly) → verify: the indicator reflects the **actual** per-request route reported by the backend, showing sovereign-ILMU for the prelim's pure-ILMU calls.

**Acceptance criteria:** UI shows the real, backend-reported route for each AI call — sovereign (ILMU) for the prelim — sourced from BE-6's field, not a constant. _(The RAG layer (BE-12/13) is also fully sovereign — local static embeddings, no foreign API — so inference + retrieval are in-country; the **Neon persistence** layer is the one **non-MY-region** dependency (Q9), handled honestly in the deck per BE-17's `[TD]` sub-task.)_

### FE-6 `[FE]` — Swap mock → live API

> The Vercel **deploy** half is split out to **DO-1** (Phase 3). This task sequences the live-API swap only.

**Implementation:**

- [ ] Point the typed client at the live API (`VITE_API_MOCK=0`, `VITE_API_BASE_URL=<render url>`) → verify: all consoles (entity/obligations, classify/filing+HITL, audit-defense) work against real endpoints with CORS in place (cross-lane: **BE-7** must allow the Vercel origin — coordinate with DO-1/DO-2).

**Acceptance criteria:** Consoles run on the live API end-to-end (CORS via BE-7; deploy handled by **DO-1/DO-2**).

### FE-7 `[FE]` — Styling pass to the devkit design tokens _(polish; cut candidate)_

**Implementation:**

- [ ] Polish to the ProofRank devkit tokens (the **real** `tokens.css` copied in R-FE-2) — use the existing devkit classes (`.window`, `.titlebar`, `.req-list`, `.evidence`, `.verified-stamp`, `.barber`) consistently across the 3 consoles → verify: consoles match the design system; `bun run build` stays green.

**Acceptance criteria:** UI is consistent with the devkit token system and still builds clean. _(This is polish — see the Timeline cut list; functional styling from FE-1…FE-4 suffices for the demo if a day slips.)_

---

## Phase 3 — Deploy, demo & submission

> Mixed `[DO]` + `[TD]` + in-scope `[BE]` (BE-6 sovereign field, **BE-7 CORS — deploy-critical**), a small demo-prep `[FE]` (**FE-8**), a committed **Neon Postgres persistence migration** (**DO-4 + BE-15/16/17**, off the FE critical path), one deferred `[BE]` (BE-5), and a clearly-marked **STRETCH** pair (**FE-9** + **BE-11** SSE — off the critical path). **CORS (BE-7) + deploy are committed** — both services go up (**DO-2** BE → Render, **DO-1** FE → Vercel) and are smoke-verified end-to-end (**DO-3**). **BE-7 must land before/with DO-1/DO-2.** **Render-RAM note:** the RAG index (BE-12/13) is sized for the **256MB free tier** via local static embeddings; DO-2 confirms it loads or fails open. **BE-5 (escalation — sovereign-preferred) is DEFERRED post-prelim** (Q6 = pure-ILMU). See [`## Timeline / milestones`](#timeline--milestones) for **critical-path** vs **cut-first**.

### BE-7 `[BE]` — CORS middleware _(DEPLOY-CRITICAL; land before/with DO-1/DO-2)_

**Purpose:** There is **no CORS today** (verified — `main.py` has no `CORSMiddleware`/`add_middleware`). A browser request from the Vercel preview origin to the Render API will be **blocked** without it — a hard blocker for the deployed demo (and even for localhost, since the Vite dev server `:5173` and the API `:8000` are cross-origin).

**Implementation:**

- [x] Add FastAPI `CORSMiddleware` to `api/main.py` allowing the Vercel origin, configurable via env (`FRONTEND_ORIGIN` / `CORS_ORIGINS`, comma-split), and include `http://localhost:5173` for local dev; allow the methods/headers the FE uses (GET/POST, `Content-Type`) → verify: a cross-origin `OPTIONS` preflight + a `POST` from the configured origin succeed (no CORS error); an unlisted origin is rejected.
- [x] Document the env var in `.env.example` (cross-lane note for DO-2) → verify: `.env.example` lists `CORS_ORIGINS`/`FRONTEND_ORIGIN`.

**Acceptance criteria:** the deployed Vercel FE (and the localhost dev server) can call the API without CORS errors; allowed origins are env-configurable.

### DO-2 `[DO]` — Deploy BE → Render _(committed; do this first — FE depends on its URL)_

> Re-sequenced **ahead of DO-1**: the FE live-swap (**FE-6**) needs the Render URL, so the backend deploys first. The Docker image is already Render-deployable as-is. **Requires BE-7** so CORS is set for the Vercel origin.

**Implementation:**

- [ ] Create the Render service from `backend/` (Docker), set env (`LLM_*`, ILMU `sk-` key; `CORS_ORIGINS`=Vercel URL per BE-7; `DATABASE_URL` (pooled) / `DATABASE_URL_UNPOOLED` (direct) per DO-4 **if** persistence is wired; **no `ANTHROPIC_API_KEY` needed** for the prelim per Q6) → verify: deployed `/health` returns `{"status":"ok"}`.
- [ ] **Worker count:** stay `--workers 1` while MemorySaver is in use (BE-2); **once BE-15's Neon Postgres checkpointer is live, multiple workers become safe** (durable shared state) — note this but keep 1 for the demo unless BE-15 lands → verify: paused→resume works on the deployed worker config.
- [ ] Confirm CORS (BE-7) is live for the Vercel origin (cross-lane with FE-6), **and** that the committed RAG index + static embedder load inside the Render tier's RAM (fail-open if exceeded) → verify: a browser request from the Vercel preview is not CORS-blocked; deployed `/audit-defense` returns (with or without RAG) without an OOM.

**Acceptance criteria:** the BE is deployed to Render, `/health` passes, CORS open to the FE origin, RAG loads-or-fails-open, and (if BE-15 is in) durable checkpoints work.

### DO-1 `[DO]` — Deploy FE → Vercel _(committed)_

> Sequence after **FE-6** points the client at the live Render API.

**Implementation:**

- [ ] Deploy `frontend/` to Vercel (Bun build), set `VITE_API_BASE_URL=<render url>`, `VITE_API_MOCK=0`, `VITE_SOVEREIGN` → verify: preview URL loads and the consoles run against the live API.

**Acceptance criteria:** the FE is deployed to Vercel and the preview URL drives the live backend.

### DO-3 `[DO]` — Deploy smoke / integration verify _(committed)_

**Purpose:** Prove the two deployed services actually talk end-to-end before the demo recording — not just that each is individually "up".

**Implementation:**

- [ ] Run the full demo path against the **deployed** stack: get entity → obligations → classify trial balance → cited Form C (HITL start → approve → resume) → audit-defense (cited pack + fabricated-citation rejection) from the Vercel URL hitting Render → verify: each beat returns correctly over the network (no CORS, no cold-start timeout, golden `tax_payable RM31,000` and the live citation-rejection both reproduce; if RAG is live, a cited clause shows its page ref; **if Neon is wired, also verify the DB-down fallback still serves the hero beats**).

**Acceptance criteria:** the deployed FE+BE complete the whole demo flow end-to-end, capturing any prod-only breakage early; the persistence fallback is confirmed (DB-down ≠ demo-down).

### DO-4 `[DO]` — Provision managed Neon Postgres + schema + env _(committed; off the FE critical path; do early so BE-15/16/17 can build)_

**Purpose:** Stand up the managed Neon serverless Postgres (AWS `ap-southeast-1` Singapore region, free tier) and the schema/connection the persistence tasks build on. Neon is **plain Postgres via a connection string** — no vendor SDK. **Sovereignty caveat: Singapore, not MY (Q9)** — prod path is self-hosted / MY-region Postgres with the identical schema.

**Implementation:**

- [ ] Create the Neon project (free tier, region `aws-ap-southeast-1`); capture **`DATABASE_URL` (pooled, PgBouncer endpoint)** + **`DATABASE_URL_UNPOOLED` (direct endpoint)**; wire both into **Render** env (DO-2) + local `.env` + document in `.env.example` (no Supabase-style anon/service keys or Studio/PostgREST — Neon is just the connection string) → verify: a connection from local + Render reaches the DB over both endpoints.
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
- [ ] Write a **≤7:00 demo script** ordered for impact per spec §6.2: classify trial balance → cited Form C → audit-defense pack (with the precise-page citation if RAG is live) → fabricated-citation rejection (the deterministic trust money-shot) → sovereign-by-default framing (live FE-5 badge) → HITL approval → verify: written script maps to the live console beats.

**Acceptance criteria:** a pitch-deck README + a ≤7:00 demo script exist, **and the Neon residency caveat is stated honestly in the deck + prd/trd** (prelim SG / prod self-hosted MY; hashes-not-payloads).

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

> **Today = 24 Jun 2026; deadline = 28 Jun 2026 → 4 working days (Wed–Sun).** Net change since the last revision: the persistence provider is **Neon serverless Postgres** (was Supabase) — same Postgres-generic tasks (**DO-4 + BE-15/16/17**), **off the FE critical path**, with a **fixtures/in-memory fallback so DB-down ≠ demo-down**, the recorded **sovereignty caveat** (SG region now / self-hosted MY in prod, Q9), and a **demo-reliability plus** (Neon scales to zero but never permanently pauses → friendlier for an intermittent demo). This stacks on the already-committed **sovereign RAG** (BE-12/13/14) in the same BE lane. Phase 1 (the hard backend) is done; the risk is concentrated in **FE-3/FE-4 depth + the FE-prereq BE + RAG + persistence + deploy + recording** — a heavy BE lane against 4 days. Dates are targets; the **critical path** is marked ★.

| Day | Date       | Lane focus   | Milestone (critical-path ★)                                                                         | Tasks                                                                                                                                                                              |
| --- | ---------- | ------------ | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wed | **24 Jun** | BE + FE + DO | ★ FE-prereq backend lands + console boots; RAG + Neon provisioning kicked off                       | **BE-8, BE-9, BE-10, BE-7** (thin); **FE-1**; **BE-12** (RAG corpus/build) + **DO-4** (Neon provision) start in parallel; **BE-6** if time                                         |
| Thu | **25 Jun** | FE + BE      | ★ Three consoles render real beats (Layak); RAG retriever wired; durable checkpointer               | **FE-2, FE-3, FE-4, FE-5**; **BE-13/BE-14** (RAG); **BE-15** (durable Neon checkpointer — top persistence win) + **BE-16/BE-17** if lane has room; **TD-3** in parallel            |
| Fri | **26 Jun** | FE → DO      | ★ Live-swap + both services deployed and talking (CORS; RAG loads-or-fails-open; DB fallback holds) | **FE-6**; **DO-2** (Render, +Neon env if wired) then **DO-1** (Vercel); **DO-3** smoke (incl. DB-down fallback); **FE-8**; **FE-7** if ahead; **FE-9/BE-11 stretch only if green** |
| Sat | **27 Jun** | TD           | ★ Timed dry-run + record + final ⚠verify (figures + RAG clauses)                                    | **TD-4** dry-run + record, **TD-6** ⚠verify                                                                                                                                        |
| Sun | **28 Jun** | TD           | ★ **SUBMIT** (repo + deck + video + Vercel link) — **buffer/contingency day**                       | **TD-4** submit                                                                                                                                                                    |

**Critical path (FE spine + deploy, unchanged):** `{BE-7, BE-8, BE-9} → FE-1 → {FE-2 (BE-8), FE-3 (BE-9), FE-4} → FE-6 → DO-2 (BE-7) → DO-1 → DO-3 → TD-4 (dry-run→record→submit)`. **Both the RAG workstream (BE-12→13→14) and the Neon migration (DO-4 → BE-15/16/17) are parallel BE/DO side-branches — NOT on the critical path.** RAG slips → fall back to the constrain-to-corpus gate; Neon slips → fall back to fixtures/in-memory (DB-down ≠ demo-down). **BE-10** pairs with FE-1; **BE-6→FE-5** and **FE-8** are small side-branches; **FE-9/BE-11 (SSE) are STRETCH**.

**Prelim-critical vs cut-first (if a day slips):**

- **Prelim-critical (committed, must ship):** BE-7 (CORS), BE-8, BE-9, FE-1, FE-2, FE-3 (incl. classify + HITL gate + Layak trust-trio), FE-4 (incl. the live deterministic fabricated-citation rejection — the trust money-shot — + two-tier trace), FE-5, FE-6, BE-6, FE-8, DO-1, DO-2, DO-3, TD-3 (incl. the Q9 sovereignty-framing sub-task), TD-4, TD-6. **RAG (BE-12/13/14) and Neon persistence (DO-4 + BE-15/16/17) are committed but degrade safely** — see the cut-order.
- **Cut-first if behind (in priority order):** (1) **FE-9 + BE-11 (SSE stretch)** — never block; (2) **FE-7** styling polish; (3) **Neon persistence (DO-4 + BE-15/16/17)** — committed, but it **degrades to fixtures/in-memory cleanly (DB-down ≠ demo-down)**, so if the BE/DO lane overloads, cut it _before_ the FE spine — drop in this order: BE-17 domain layer first (endpoints keep reading fixtures), then BE-16 audit log (in-memory sqlite stays), keeping **BE-15 durable checkpointer** as the last-to-cut persistence item (it's the biggest robustness win and the cleanest); (4) **RAG depth (BE-12/13/14)** — degrades to the constrain-to-corpus + gate (shrink corpus, then drop wiring, keep BE-14's gate-invariant green); (5) the **Layak depth on FE-3/FE-4** (drop FE-3 `<details>` panel, then FE-4 technical transcript — keep the 96px hero + honest-number IA + live citation rejection + verified/unverified badge); (6) **FE-8** → Acme-only + DEMO MODE banner; (7) **BE-10** 422 envelope; (8) **FE-5/BE-6** live binding → static truthful badge; (9) **BE-9** classify beat → pre-classified fixtures; (10) **TD-3** deck depth (but NOT the Q9 sovereignty-framing sub-task — that is honesty-critical and stays). **BE-5 already cut** (post-prelim). _Note: Neon + RAG are cut **above** the FE-spine protections precisely because both degrade to working fallbacks — neither may delay FE-1→FE-4 or deploy. **DB-down ≠ demo-down must hold even if Neon is fully cut.**_
- **Localhost contingency (deploy is committed, but keep the safety net):** prd/trd both state _localhost is acceptable for the prelim_. If Render/Vercel slips on Fri, record TD-4 against localhost and submit, then finalize the deploy. **Note:** BE-7 CORS is still required even on localhost (Vite `:5173` ↔ API `:8000` are cross-origin).

**Realism flag (explicit).** This revision keeps the **two real workstreams (Neon persistence + RAG) in the same BE/DO lane in a 4-day window — PL flagged the load; the PO accepted (Q9)**; the Supabase→Neon swap is provider-only and does not change the load. Honest assessment: **the BE/DO lane is the binding constraint**, not the FE spine. One backend dev cannot realistically land BE-7/8/9/10 (Wed) **and** RAG BE-12/13/14 **and** Neon DO-4 + BE-15/16/17 **and** BE-6 across Wed–Thu without either more hands or aggressive cutting. **What makes it survivable:** (1) **both new workstreams are off the FE critical path and degrade to working fallbacks** — RAG → constrain-to-corpus gate, Neon → fixtures/in-memory — so a slip costs robustness/persistence, _not_ a broken demo; (2) the **demo-resilience requirement is baked into the tasks** (BE-17 fallback + DO-3's DB-down check), so **DB-down ≠ demo-down** holds by construction even if persistence is fully cut, and **Neon's scale-to-zero-never-pause behaviour reduces** the intermittent-demo cold-start/pause risk vs a provider that suspends idle free projects; (3) within persistence, **BE-15 (durable checkpointer) is the single highest-value item** and the cleanest to land alone — if only one persistence task ships, ship BE-15. **Three threats to flag plainly:** (a) **lane overload** — the realistic outcome is that some of {RAG depth, Neon} gets cut; the cut-order puts them above the FE spine so the demo is protected; (b) **sovereignty honesty** — managed Neon is **SG, not MY**, in tension with the core thesis; this is **non-negotiably** stated in the deck + prd/trd (TD-3's Q9 sub-task) so the project doesn't overclaim — that sub-task is honesty-critical and is **not** a cut candidate; (c) **the Neon pooled-endpoint psycopg caveat** (PgBouncer transaction mode → `prepare_threshold=0` + `setup()` over the unpooled endpoint) is a real first-run gotcha — BE-15 encodes it so it isn't discovered live at deploy. **Net:** the FE spine + deploy + demo **hold with Sunday as a buffer**; the **committed-but-degradable BE workstreams (RAG, Neon) are the relief valves** — expect to ship BE-15 + RAG-core and to cut depth elsewhere if the single BE lane saturates. If the team can add a second backend hand for Wed–Thu, both workstreams become comfortably attainable.

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
