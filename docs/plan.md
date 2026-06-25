# PLAN

> Owned by **PL**. The PM presents this at **Gate 1** for the human to approve before any implementation.
>
> **Structure:** uniformly **phase-oriented** — top-level sections are PHASES in execution order, and **every task carries an explicit lane tag** in its heading. **Completed work (`[x]`) is summarized concisely under [`## Done — completed phases`](#done--completed-phases)**; full per-task detail lives in [`progress.md`](progress.md). Open tasks keep their full breakdown below. Design & decisions → [`cukaipandai-spec.md`](cukaipandai-spec.md); current status → [`progress.md`](progress.md).
>
> **Lane tags:** `[BE]` = backend · `[FE]` = frontend · `[DO]` = devops/infra (tooling · CI · deploy) · `[TD]` = testing & docs. A task is tagged by its **primary** lane; cross-lane touches are noted inline.
>
> **Phases:** **Phase 0** Monorepo Restructure → **DONE** (PR #1) · **Phase 1** AI layer + core gaps → **DONE** (BE-1…BE-4, TD-1/TD-2) · **Phase 2** Frontend consoles + FE-prereq BE (BE-8/9/10) + sovereign RAG (BE-12/13/14) → **DONE** (FE-1…FE-6) · **Phase 3** Deploy/demo/submission (BE-6/7/18, FE-8, Neon DO-4 + BE-15/16/17) — partly done, deploy + TD open · **Redesign Waves 1–5 + Wave A–D** → **DONE** (app shell, journey, consoles, settings, notifications, auth, FAQ, dashboard) · **USABILITY + END-TO-END JOURNEY REWORK** → the NEW work this Gate-1 (front door + wizard + Audit-Defense rework + custom-company + file-upload + enrichment + connective tissue, with 2 scoped BE endpoints).

---

## Done — completed phases (concise; full detail in `progress.md`)

> Every item here is **`[x]` complete and verified** (107 backend tests green; FE builds clean: `tsc --noEmit` + `bun run build` + `biome`). Summarized per the header's convention so the open work + the new journey rework stay readable. **No open task is in this list.**

- **Phase 0 `[DO]` — Monorepo restructure (DONE, PR #1).** Root Bun/biome/husky/commitlint/prettier tooling; `backend/` (api+core+tests+Docker, uv) + `frontend/` (Vite 5 + React 18 + RR7 + token-CSS) split; CI; `.env.example` at root.
- **Phase 1 `[BE]`/`[TD]` — AI layer + core gaps (DONE; 79 tests).** BE-1 ILMU-first `RoutingLLMClient` + JSON mode + live spike (resolves Q1; critic = the weak step, escalation deferred per Q6). BE-2 HITL filing graph over FastAPI (`…/filings/form-c/start` + `/resume`, golden `tax_payable RM31,000`, MemorySaver flagged non-durable → BE-15). BE-3 `assess_risk` → 4 deterministic checks wired (`gross_chargeable_gap` fires on Acme). BE-4 live MSIC (`GET /reference/msic/{code}` via data.gov.my) + holidays deadline-shift. TD-1 prd/trd reconciled. TD-2 routing + endpoint tests.
- **Phase 2 `[BE]` — FE-prereq + sovereign RAG (DONE; 100 tests).** BE-8 `GET /entities/{tin}` (404 on unknown). BE-9 `POST …/documents/classify` (raw text → `LineItem[]`, JSON-mode, 502-guarded; resolves Q7). BE-10 consistent **422** envelope (`_profile`/`_line_items` at the boundary). BE-7 CORS (`CORS_ORIGINS`/`FRONTEND_ORIGIN`). BE-12/13/14 sovereign RAG (expanded 15-clause corpus with section/page/url; committed numpy index via `scripts/build_rag_index.py` + local static `model2vec`; `core/rag.py` fail-open retriever; `ground_citation` stays authoritative — fabricated IDs still `verified=false` with RAG on). BE-6 `route_info()` → `{sovereign, active_model}` on `/audit-defense` + `/classify`.
- **Phase 2 `[FE]` — the three consoles (DONE; FE-1…FE-6).** FE-1 typed `api/client.ts` covering all 9 routes + mock mode + `RiskFlag`/RAG-`Citation`/422 types; `useEntity` + canonical Acme seed. FE-2 Obligation console (entity header + obligations). FE-3 Filing Studio (classify → HITL `start`→approve→`resume`, 96px hero `tax_payable`, honest-number IA, per-figure `FigureTrace` `<details>`, risk flags). FE-4 Audit-Defense (cited pack, `CitationPanel` + verified/unverified badge, two-tier trace, 502-safe, live fabricated-citation rejection). FE-5 live sovereign badge (`SovereignBadge` off `route_info()`). FE-6 live-swap + the 3 QA carry-forwards (mock `items` shape, query-branched mock, fabrication path).
- **Phase 3 (partial) — BE-18 + FE-8 + Neon (DONE; 107 tests).** BE-18 opt-in `inject_fabricated` (planted out-of-corpus cite → real gate stamps `verified=false`; the live money-shot). FE-8 3 seed personas (`PersonaContext` + `personas.ts`) + DEMO MODE banner + entity picker. DO-4 + BE-15/16/17 Neon SG persistence **verified end-to-end** (durable `PostgresSaver` checkpointer over pooled/unpooled; EvidenceVault hashes-not-payloads; `EntityRepository` with fixtures fallback; **DB-down ≠ demo-down** confirmed). DO-5 gated CI/CD `deploy.yml` (human secrets/cutover steps remain).
- **Redesign Waves 1–5 `[FE]` (DONE).** W1 app shell (`AppShell` topbar + slide-in drawer + denim footer + inline-SVG `LogoMark` + theme toggle), routed consoles under `<Outlet/>`, Dashboard hub, in-shell 404. W2 dashboard depth (per-persona deadlines + entity snapshot). W3 entry journey (`MarketingShell` + Landing + auth/guest gate). W4 Filing Studio 5-stage stepper (`deriveStages` over the `Phase` union; no SSE). W5 responsive topbar + console cohesion.
- **Waves A–D + Settings `[FE]` (DONE).** Wave-A auth rework (`/sign-in` `/sign-up` `/privacy`, guest → `/dashboard`). Wave-B notifications (bell + toasts, `notifications.tsx`). Wave-C landing hero image + FAQ (`/faq` + `faqData.ts`). Wave-D dashboard command-center redesign (`leadObligation`/`StatusSummary` payoff). Settings page (`/settings`, theme + default-entity + about) + profile popover.

---

## Open Questions / Assumptions (carried)

_Phase-0 RQ1–RQ6 RESOLVED; Phase-1 spike resolved Q1, partially Q2. Q6 RESOLVED (pure-ILMU); Q7 RESOLVED (classify endpoint); Q8 RESOLVED (local static embeddings + committed numpy index + authoritative gate); Q9 RESOLVED (managed Neon Postgres, SG, with sovereignty caveat + self-hosted-MY prod path + fixtures fallback). Q3 RESOLVED at the FE-1 gate (consoles reached demo quality). **Q4 (BE — exact MyInvois paths + SSM CSD fields) and Q5 (TD — final ⚠verify of YA2026 figures + RAG clauses) remain open** and resolve during TD-4/TD-6._

- [ ] **Q4 (BE)** — Exact current-year MyInvois API paths + the SSM CSD field set (production upgrade). → `sdk.myinvois.hasil.gov.my/api`; SSM CSD is `[ROADMAP]`, out of scope for the prelim.
- [ ] **Q5 (TD)** — Re-`⚠verify` all YA2026 rates/thresholds/deadlines **+ the expanded RAG corpus clauses** before the deck (Budget/gazette can change them). → reconcile vs LHDN/RMCD/ITA; owned by **TD-6**.

> The Phase-2 FE re-scope questions (FQ1–FQ5) and the deploy-iteration questions (DQ1–DQ6) were resolved during Phase-2/Phase-3 execution (FQ: mock-first → single live-bind; FE-5 folds into FE-4; env names `VITE_API_BASE_URL`/`VITE_API_MOCK`/`VITE_DEMO_MODE`; seed-reconciled Acme; HITL leads. DQ: BE-18 inject = the live money-shot (DQ1=A); Render free + pre-warm; fixtures-first then Neon; one PR; manual then CI; prod-URL-only CORS). The Redesign-Wave-1 questions (RW-Q1…RW-Q8) were resolved (drawer; drawer-only; hub at `/dashboard`; theme toggle included; inline-SVG logo; adapt-minimal AppShell; no W1 landing; minimal footer).

---

## Phase 3 — remaining OPEN tasks (deploy + demo + docs)

> The BE additions (BE-6/7/18) + FE-8 + Neon (DO-4/BE-15/16/17) + DO-5 CI are **done** (above). What remains is the **human-gated deploy** + the **demo/docs** lane.

### DO-2 `[DO]` — Deploy BE → Render _(agent config done; HUMAN deploy open)_

- [x] Dockerfile `$PORT` binding (`--port ${PORT:-8000}`); runbook env-var table documented.
- [ ] **HUMAN:** Render login → New Web Service → connect repo → root `backend/`, Docker, **Free**, single instance, health-check `/health`; set env (`LLM_PROVIDER=openai`, `LLM_BASE_URL=https://api.ilmu.ai/v1`, `LLM_API_KEY=<sk->`, `LLM_MODEL=nemo-super`, `CORS_ORIGINS=http://localhost:5173` + prod Vercel URL, `MYINVOIS_BASE_URL=…preprod…`; escalation vars unset; `DATABASE_URL`/`_UNPOOLED` set since Neon is verified) → verify: deployed `/health` 200; public URL captured.
- [ ] **Cold-start (DQ2):** pre-warm `/health` ~1 min before the demo → verify: pre-warmed `/health` fast.
- [ ] **CORS reconcile:** append the stable prod Vercel URL to `CORS_ORIGINS` + redeploy (env-only) → verify: prod origin not blocked; unlisted rejected.

**Acceptance criteria:** BE live on Render (free, single-instance, `$PORT`), `/health` passes, URL captured, CORS open to the prod Vercel origin, RAG loads-or-fails-open within 256MB, cold-start mitigated. _(Live URL already in the runbook: `https://cukaipandai-api.onrender.com`.)_

### DO-1 `[DO]` — Deploy FE → Vercel _(agent config done; HUMAN deploy open)_

- [x] `frontend/vercel.json` SPA rewrite; build contract (Vite, `bun run build`, `dist`); runbook Vercel section.
- [ ] **HUMAN:** `vercel login` → `vercel link` → root `frontend/`, Vite, `dist`; set Production env `VITE_API_BASE_URL=<render url>`, `VITE_API_MOCK=0`, `VITE_DEMO_MODE`/`VITE_SOVEREIGN` as chosen → `vercel --prod`; capture stable prod URL → feed to DO-2 CORS reconcile → verify: prod URL drives the live backend.

**Acceptance criteria:** FE on Vercel (root `frontend/`, SPA rewrite, mock off), deep-link refresh resolves, prod URL drives Render. _(Live URL: `https://cukaipandai.vercel.app`.)_

### DO-3 `[DO]` — Deploy smoke / live click-through _(TD lane; open)_

- [ ] Pre-warm + load (no CORS error, no cold-start timeout); entity + ≥3 obligations; classify → cited Form C HITL `start`→approve→`resume` (golden `tax_payable RM31,000`); audit-defense cited pack + the **live `verified=false`** fabricated-citation rejection (BE-18 inject); live sovereign badge; DB-down fallback holds → verify: the whole demo flow works end-to-end on the deployed URLs.

**Acceptance criteria:** deployed FE+BE complete the full demo flow over the network, including the live fabricated-citation rejection and the sovereign badge; prod-only breakage caught early.

### DO-5 `[DO]` — Gated CI/CD pipeline _(agent done; HUMAN secrets open)_

- [x] `deploy.yml` (test → docker-build → deploy-backend/-frontend); `ci.yml` deleted; runbook CI/CD section.
- [ ] **HUMAN:** add the 4 GitHub secrets (`RENDER_DEPLOY_HOOK_URL`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`); confirm the first green run; turn off Render native auto-deploy.

### TD-3 `[TD]` — Pitch-deck README + demo script _(open)_

- [ ] Pitch-deck README (problem / market / pricing / roadmap) folding YA2026 figures, the ILMU pricing caveat (Q2/A1), the pure-ILMU sovereignty story (incl. sovereign RAG; bge-m3/pgvector scale path; BE-5 sovereign escalation roadmap; direct-Claude a flagged opt-in), the "decision-support, not legal advice" guardrail → verify: README covers all four sections.
- [ ] **Neon sovereignty framing (Q9 — do NOT overclaim):** state in the deck + prd/trd that prelim persistence = managed Neon SG (not MY), hashes-not-payloads, prod = self-hosted MY identical schema → verify: no "all data stays in Malaysia" unqualified.
- [ ] **≤7:00 demo script** (per the NEW journey — see TD-J3): welcome → ①②③ → sample-data → wizard (Obligations payoff → Filing cited Form C + HITL → Audit Defense fabrication money-shot via BE-18) → graduate to Dashboard → verify: script maps to the live beats; the fabrication mechanism is stated.

**Acceptance criteria:** README + ≤7:00 demo script exist; the Neon residency caveat is honest in deck + prd/trd; the script states how the fabricated-citation rejection is produced live.

### TD-4 `[TD]` — Demo dry-run + record + final ⚠verify + submit _(open; needs DO-1/2/3 green)_

- [ ] Timed dry-run (<7:00 on the deployed stack); record the YouTube cut (≤7:00); **final ⚠verify** of all figures + RAG clauses (closes Q5/TD-6); submit repo + README deck + YouTube + Vercel link before 28 Jun → verify: submission received.

### TD-6 `[TD]` — Final ⚠verify of YA2026 figures + RAG clauses _(open; resolves Q5)_

- [ ] Re-`⚠verify` SME bands (15/17/24%), the RM1m e-invoice exemption, CP204/Form C deadlines, the seeded `tax_payable RM31,000`, **and every RAG-corpus clause (text + section + page + URL)** vs LHDN/RMCD/ITA; update provenance if anything moved → verify: each figure + clause has a current cited source.

### FE-7 `[FE]` — Styling polish to devkit tokens _(polish; cut candidate; open)_

- [ ] Consistent devkit-class polish across consoles → verify: matches the design system; build stays green. _(Largely overtaken by the Redesign Waves; remaining as optional polish.)_

### BE-5 `[BE]` — Wire + live-test escalation (sovereign-preferred) — **DEFERRED post-prelim**

- [ ] Prefer `LLM_ESCALATION_MODEL` on the same ILMU gateway (in-country); direct-Anthropic is the flagged non-sovereign opt-in → verify (post-prelim): a valid s.33(1) critic call returns `verified=true` via escalation; the deterministic rejection is unaffected. **Prelim: intentionally NOT done (Q6 pure-ILMU).**

### STRETCH — SSE streamed stepper _(FE-9 + BE-11; OFF the critical path; #1 in cut-order)_

- [ ] **BE-11:** SSE `…/filings/form-c/stream` (`step_started`/`result`/`narrative`/`technical`/`done`/`error`) → verify: events in order; `/start`→`/resume` unchanged.
- [ ] **FE-9:** consume the stream as a live stepper; degrade to the non-streamed Wave-4 stepper on `error` → verify: animates live; falls back cleanly. _(The Wave-4 non-streamed stepper already ships, so this is pure upgrade.)_

---

# USABILITY + END-TO-END JOURNEY REWORK `[FE]` `[BE]` `[TD]`

> **NEW section — the work this Gate-1 approves.** Owned by **PL**. A usability + end-to-end user-journey rework layered on the shipped product (AppShell · MarketingShell · Landing · `/sign-in` `/sign-up` `/privacy` · Dashboard Wave-D · the three consoles · `PersonaContext`/`useEntity` · the typed `api/client.ts` with 9 routes + mock mode · notifications · Settings · Faq · 107 backend tests · Render + Neon SG). **All major decisions are LOCKED** (brainstorming complete — recap below). The plan encodes them as surgical, lane-tagged, checkboxed tasks with `verify:` criteria + a Gate-1 open-questions list. **Plan only — no code.**
>
> **Hard gates on every FE task:** `bunx tsc --noEmit` clean · `bun run build` green · `bunx biome check frontend/src` 0 errors. **On every BE task:** `cd backend && uv run pytest -q` (must not regress **107**; new tests added). **Non-regression (every task):** the working consoles, the **BE-18 fabricated-citation money-shot**, the **FE-5 sovereign badge**, `tokens.css`/design system, notifications, auth/guest, Settings, deploy, and the Neon layer (DO-4/BE-15/16/17) stay byte-for-byte behaviourally intact. **Reuse `tokens.css` classes** + the existing primitives (`FilingStudio` stepper pattern, `CitationPanel`, `SovereignBadge`, `VerifiedBadge`); **no new large CSS, no Tailwind/shadcn.**

## Journey Rework — Locked Decisions (recap; do NOT re-open)

1. **Front door = a dedicated first-run welcome screen** (after Continue as Guest): one-line payoff · the ①②③ journey map showing each step's OUTPUT · two on-ramps — "Try sample data" (Acme/Sinar/Selera) OR "Use my own company". Hands into the guided wizard.
2. **Journey = a strict guided 3-step wizard** (Obligations → Filing → Audit Defense) with next/back + progress, for first-timers. **Reconciliation (JR-Q1 confirms):** the wizard is first-run CHROME that **WRAPS** the existing three console components (reuse, don't fork) with a `Step X of 3` header + next/back; the same consoles stay independently reachable for returning users; completing/skipping graduates to the command-center Dashboard. **No duplicated console logic.**
3. **Audit-Defense rework:** free-text "ask about any figure" box PLUS canned example chips · a watchable pipeline (Retrieve law → Ground claim → Verify citations → Reject fabrications) mirroring Filing's stepper · a pack-SHAPE preview BEFORE running · the fabricated-citation rejection framed as the headline trust payoff · keep `inject_fabricated`.
4. **Custom company = real build.** FE: a "Use my own company" form capturing all `EntityTaxProfile` fields → becomes a 4th selectable entity in the switcher/`PersonaContext`, threaded as the `ssm` body through obligations/filing/audit (all already accept it). **NEW BE — `POST /entities`:** validate ssm → `EntityTaxProfile`, persist to Neon (`entities` table), add `EntityRepository.create()`; keep fixtures fallback; must not regress 107 tests; add tests. FE also caches the custom entity in localStorage so it survives reload even if the BE write is skipped/unavailable (fallback-first).
5. **Real file upload = real build.** **NEW BE — `POST /entities/{tin}/documents/upload`** (multipart `UploadFile`): extract text from PDF/CSV/XLSX (add deps e.g. pypdf + pandas/openpyxl) → call existing `classify_line_items` → return the same `ClassifyResponse`; add tests with small fixture files; **uv.lock update required** (mirrors prior `holidays`/`model2vec`/`psycopg` lock fixes). FE: drag-and-drop zone in the custom-company / Filing classify step; **PASTE-text remains the always-works fallback.**
6. **Scope = enrich results too.** Obligations gets a YA2026 schedule/calendar visualization + payoff headline; a light "what-if"/savings framing only where cheap and grounded (e.g. Filing's SME-rate band breakdown already present). **Enrichment stays grounded — NO fabricated numbers/rates/thresholds; every figure stays sourced via the deterministic core.** Anything needing extra recompute calls is lower-priority.
7. **Connective tissue:** every console previews its payoff up front and ends with a "what next →" handoff (Obligations→Filing→Defense→Dashboard); the Dashboard shows the ①②③ journey progress.

## Journey Rework — Triage (PL findings, verified against the code on disk 26/06/26)

**T0 — consoles are coupled to `PersonaContext` via `useEntity()`.** `useEntity(tin?)` (`hooks/useEntity.ts:10-12`) resolves via `getEntity(resolvedTin = tin ?? persona.tin)`. In mock mode `getEntity` **throws** for any TIN not in `MOCK_ENTITIES` (`client.ts:485-492`); live → **404** (`main.py:116-118`). **Highest-risk point:** a custom TIN is in neither map, so consoles **white-screen** unless resolution reads a locally-cached custom profile **before** the network. JR-1 owns this.

**T1 — `PERSONAS` is a static `const`** (`personas.ts:15-66`); the switcher renders that import (AppShell `<select>` `AppShell.tsx:215-219`; Settings; Dashboard). A runtime custom persona needs `PersonaContext` to own an appended list in state (persisted), and every reader to use the context list. JR-1 owns this.

**T2 — `FilingStudio` resets ALL state on `persona.tin` change** (`FilingStudio.tsx:690-695`). The wizard must NOT switch persona mid-run; it pins one entity for the whole run. JR-2 owns this.

**T3 — guest entry goes straight to `/dashboard`.** `AuthScreen` "Continue as Guest" sets `cp_entered_as_guest` → `/dashboard` (Sign-Out clears it, `AppShell.tsx:311`). The welcome + wizard insert between guest-entry and the dashboard, first-run only — a **new** flag (`cp_journey_done`) distinct from `cp_entered_as_guest`. JR-2/JR-3 own this.

**T4 — no step-event/SSE surface.** `/audit-defense` + `/classify` are single synchronous calls. The Audit "watchable pipeline" must be **FE-simulated** over the one request — the `FilingStudio` `deriveStages` pattern (`FilingStudio.tsx:98-221`), NOT the STRETCH BE-11 SSE. JR-5 owns this.

**T5 — the Audit query is ALREADY free-text on the backend.** `AuditDefenseReq` = `{query: str, evidence: list[list[str]], inject_fabricated: bool}` (`schemas.py:15-18`). Free-text box + chips just vary `query`/`evidence` → **zero BE change**; fabrication works via `inject_fabricated` (BE-18). JR-5 reuses both.

**T6 — multipart can NOT go through the JSON client helper.** `post<T>()` sets `Content-Type: application/json` + `JSON.stringify` (`client.ts:443-450`). Upload needs a separate `FormData` fetch path (JR-7), mock branch returns a canned `ClassifyResponse` → FE builds mock-first before BE-J2 lands.

**T7 — enrichment data largely already exists.** Dashboard Wave-D computes the obligation payoff (`leadObligation`/`StatusSummary`); the Filing computation carries the SME-band rule trace. So JR-8/JR-9 are **surfacing + reframing grounded data**, not new computation. Any recompute-backed what-if is lower-priority (JR-Q4).

**T8 — the new BE endpoints are independent of the FE chrome.** `POST /entities` + `POST …/documents/upload` land on their own; the FE builds against the contract mock-first (the team's established pattern). BE-J1/BE-J2 run **in parallel** to the FE waves.

## Journey Rework — Waves & Sequencing

- **Wave J0 `[BE]` (parallel, no FE dep):** **BE-J1** `POST /entities` · **BE-J2** `POST …/documents/upload` (+ uv.lock + fixtures + tests). Unblocks JR-1/JR-6 live persistence + JR-7 live file-drop.
- **Wave J1 `[FE]` (foundation; gating):** **JR-1** PersonaContext holds a runtime custom entity (state + localStorage); `useEntity` resolves it before the network → prerequisite for JR-6 + the 4th-entity switcher.
- **Wave J2 `[FE]` (journey spine):** **JR-2** wizard chrome · **JR-3** first-run welcome + routing/flags · **JR-4** connective tissue + Dashboard ①②③ progress.
- **Wave J3 `[FE]` (on-ramps + Audit rework):** **JR-5** Audit-Defense rework · **JR-6** custom-company form (JR-1 + BE-J1, mock-first) · **JR-7** file-upload UI (BE-J2, mock-first; paste fallback).
- **Wave J4 `[FE]` (grounded enrichment):** **JR-8** Obligations calendar viz + payoff headline · **JR-9** light grounded what-if (lower-priority; cut-tolerant).
- **TD throughout:** **TD-J1** (mock fidelity + journey-state) · **TD-J3** (demo-script + docs). BE endpoint tests fold into BE-J1/BE-J2.

### BE-J1 `[BE]` — `POST /entities` (create + persist custom entity; fixtures + Neon, fallback-first) _(Wave J0; parallel)_

**Purpose / issue:** A user-entered profile threads through `/obligations`, `/filings/form-c*`, `/audit-defense` with zero backend change (all accept inline `ssm`), but there's **no way to persist** a created entity — `EntityRepository` only has `.get()` (`persistence.py:104-114`) and the Neon `entities` table is intentionally empty (fixtures serve reads). Add a create path. **Stay fallback-first (Q9 caveat #2); don't collide with the Neon layer beyond this.**

- [x] Add `POST /entities` taking the SSM body, validating via `_profile` → **422** on bad input (reuse `main.py:91-96`) into `EntityTaxProfile`; persist via a new `EntityRepository.create(data)`; return the stored profile (`model_dump(mode="json")`) → verify: valid POST → 200 + echo; a later `GET /entities/{tin}` returns it; malformed body → 422 (not 500).
- [x] Add `EntityRepository.create(data: dict)` (`api/persistence.py`): write to Neon `entities` (`tin` + `data` jsonb, mirroring `.get()` at `persistence.py:108-111`) when `DATABASE_URL` set, reusing the pooled psycopg settings; **fallback-first** — when DB absent/unreachable, store into the in-memory `_fixtures` dict so create works for the demo and `GET` round-trips in-process → verify: with DB set, the row persists + survives a fresh repo; with it unset, create+get round-trips in-memory without raising.
- [x] **Upsert policy:** create-or-replace on an existing TIN so re-submitting the wizard doesn't 500 on a duplicate key → verify: posting the same TIN twice succeeds (replaces); no unhandled DB error.
- [x] **`[TD]` tests:** 200 create→get; 422 on bad ssm; upsert on duplicate; in-memory fallback (no `DATABASE_URL`) → verify: `uv run pytest -q` green at **≥107**; existing 107 unchanged.

**Acceptance criteria:** `POST /entities` validates → persists (Neon when configured, in-memory fixtures otherwise) → readable via `GET /entities/{tin}`; 422 on bad input; upsert-safe; fully fallback-first; suite green. **Does not touch BE-15/16/17 or the checkpointer.**

### BE-J2 `[BE]` — `POST /entities/{tin}/documents/upload` (file → text → classify) _(Wave J0; parallel)_

**Purpose / issue:** `documents/classify` accepts pasted text only (`ClassifyReq.raw_text`, `schemas.py:26-27`; agent takes a `str`, `documents.py:15`). Add a real multipart upload that extracts text from PDF/CSV/XLSX → feeds the **same** `classify_line_items` → returns the **same** `ClassifyResponse`. **Paste-text stays the fallback.**

- [x] Add `POST /entities/{tin}/documents/upload` taking `UploadFile` (FastAPI `File(...)`); read bytes → extract text by type: CSV (stdlib/pandas), XLSX (`openpyxl`/pandas), PDF (`pypdf`); concatenate → `classify_line_items(raw_text, llm)` (DI'd `get_llm`) → return `{line_items, **route_info()}` (identical to `/classify`, `main.py:138-145`) → verify: uploading a small CSV/XLSX/PDF fixture returns classified `LineItem[]` + route fields, identical in shape to `/classify`.
- [x] **Guard rails:** 502 on unparseable model output (reuse `_PARSE_ERRORS`, `main.py:143-144`); 415/422 on unsupported/empty file with clear detail → verify: an unsupported type + a corrupt file both return a clean 4xx/502, not 500.
- [x] **Deps + uv.lock (the recurring footgun):** add `pypdf`, `openpyxl` and/or `pandas` to `backend/pyproject.toml`; **run `cd backend && uv lock`** (mirrors the BE-4/BE-12/BE-15 lock fixes that bit the deploy) → verify: `uv sync` installs them; `git status` shows `uv.lock` updated.
- [x] **`[TD]` tests + fixtures:** tiny `trial_balance.csv`/`.xlsx`/`.pdf` (Acme-consistent) + tests asserting each extracts → classifies (FakeLLMClient) to the expected `LineItem[]`; unsupported file → 4xx → verify: `uv run pytest -q` green at **≥107**; the formats confirmed at JR-Q3 are covered.

**Acceptance criteria:** a multipart upload extracts text from the agreed formats (JR-Q3) → classifies via the existing agent → returns the `ClassifyResponse` shape; 502/4xx-guarded; deps added **and uv.lock updated**; fixtures + tests added; suite green. **Paste-text `/classify` unchanged.**

### JR-1 `[FE]` — PersonaContext holds a runtime custom entity; `useEntity` resolves it _(Wave J1; gating)_

**Purpose / issue:** A custom company must become a 4th selectable entity, but `PERSONAS` is static (`personas.ts:15`) and `useEntity` calls `getEntity(tin)` which throws/404s for a non-seeded TIN (T0, T1). Make `PersonaContext` own a persisted custom persona, expose the combined list, and resolve a cached custom profile **before** the network — so the custom company never white-screens.

- [x] Extend `PersonaContext` (`PersonaContext.tsx`): add `customPersonas: Persona[]` state seeded from localStorage (key `cp_custom_entities`) + `addCustomPersona(p)` (appends, persists, `setPersona(p)`); expose derived `personas = [...PERSONAS, ...customPersonas]` → verify: an added custom persona persists across reload + appears in the context list; the built-in three unchanged.
- [x] Point every `PERSONAS`-reading site at the context list: the AppShell `<select>` (`AppShell.tsx:215-219`), Settings default-entity, Dashboard → verify: topbar/Settings/Dashboard show the custom entity as a 4th option; selecting it sets it active.
- [x] Make resolution custom-aware: in `useEntity` (or a thin wrapper), when the resolved TIN matches a `customPersonas` entry, return its `ssm` **directly** (it's `EntityTaxProfile`-shaped) **without** `getEntity`; built-in TINs still go through `getEntity` → verify: switching to the custom entity renders all three consoles (no throw/404) in mock + live; switching back behaves exactly as before.
- [x] **Non-regression:** existing switch side-effects (FilingStudio reset on `persona.tin`; AppShell deadline re-seed + "Entity Switched" toast, `AppShell.tsx:66-90`) fire for the custom entity too → verify: selecting it resets the pipeline + re-seeds deadlines + toasts, identical to a built-in switch.

**Acceptance criteria:** `PersonaContext` owns a persisted custom-entity list; switcher/Settings/Dashboard render it as a 4th entity; `useEntity` resolves a custom TIN from local state before any network call so consoles never white-screen; built-in personas + all switch side-effects unchanged; build/type/lint clean.

### JR-2 `[FE]` — Guided 3-step wizard chrome wrapping the existing consoles _(Wave J2; JR-Q1 confirms)_

**Purpose / issue:** First-timers need a strict guided journey wrapping the existing console components, not forking them (Locked #2; T2). Build a `WizardLayout` rendering a progress header + the active console + a next/back footer, pinning one entity for the run, then graduating to the Dashboard.

- [x] Add `frontend/src/layouts/WizardLayout.tsx` (under the AppShell or a minimal shell per JR-Q1) at `/start/obligations`, `/start/filing`, `/start/audit-defense`, each rendering the **existing** `<ObligationRadar/>`/`<FilingStudio/>`/`<AuditDefense/>` via `<Outlet/>` or direct mount — **reuse, not copy** → verify: each step shows the real console with full live behaviour (classify→HITL, fabrication money-shot, sovereign badge) unchanged; `git diff` shows no copy of any console body.
- [x] Wizard chrome: a `Step X of 3` progress header (share JR-4's ①②③ component) + a footer Back / Next (step 3 = "Finish") + a persistent "Skip the tour" → verify: Next/Back move between steps; progress reflects the step; Skip + Finish both graduate.
- [x] **Pin one entity (T2):** the wizard does NOT change persona between steps (FilingStudio would reset, `FilingStudio.tsx:690`). The active entity is whatever the welcome chose, fixed across Back/Next → verify: Obligations→Filing→back→Filing keeps the same entity (document the one acceptable reset: leaving+re-entering Filing).
- [x] **Graduation:** Finish/Skip sets `cp_journey_done` (T3) + navigates to `/dashboard`; standalone console routes stay reachable → verify: after Finish/Skip the user lands on the Dashboard + a reload does NOT re-enter the wizard; standalone routes still work.
- [x] **Non-regression:** standalone `/obligations` `/filing` `/audit-defense` + the AppShell drawer/topbar untouched → verify: returning-user navigation identical to today.

**Acceptance criteria:** a 3-step wizard wraps the reused console components with Step-X-of-3 + next/back + skip, pins one entity, graduates to the Dashboard via a first-run flag; no console logic duplicated; standalone routes + shell unchanged; build/type/lint clean.

### JR-3 `[FE]` — First-run welcome screen + journey routing/flags _(Wave J2; depends on JR-2)_

**Purpose / issue:** After guest entry, a first-run user should land on a dedicated welcome (payoff + ①②③ OUTPUT map + two on-ramps), not the dashboard (Locked #1; T3).

- [x] Add `frontend/src/pages/Welcome.tsx` (token-CSS): a one-line payoff, the **①②③ map** (each step's OUTPUT — "1 See your YA2026 deadlines · 2 File a cited Form C · 3 Build an audit-ready defense"; shares JR-4's component), and **two on-ramps** — "Try sample data" (persona picker over the built-in three → sets active persona → wizard step 1) and "Use my own company" (→ JR-6 form → wizard) → verify: renders the payoff + ①②③ + both on-ramps; each enters the wizard with the right entity.
- [x] **Routing + flags (T3):** "Continue as Guest" routes a first-run user (no `cp_journey_done`) to `/welcome`; a returning user goes straight to `/dashboard` as today; add `/welcome` to the router → verify: a fresh guest sees `/welcome`; after finishing/skipping the flag is set + a later entry/reload goes to `/dashboard`; clearing it re-enables welcome.
- [x] **Escape hatch:** a "Skip to dashboard" link (sets the flag, no wizard) so the journey is never a hard gate → verify: it sets the flag + lands on `/dashboard`.
- [x] **Non-regression:** `cp_entered_as_guest` + Sign-Out (clears it, `AppShell.tsx:311`) unchanged; `cp_journey_done` is independent → verify: Sign-Out then re-guest behaves correctly (see JR-Q5).

**Acceptance criteria:** a first-run welcome (payoff + ①②③ OUTPUT map + sample-data and own-company on-ramps + a skip) sits between guest-entry and the dashboard, gated by `cp_journey_done`; returning users bypass it; no hard gate; existing flags unchanged; build/type/lint clean.

### JR-4 `[FE]` — Connective tissue: per-console "what next →" + Dashboard ①②③ progress _(Wave J2)_

**Purpose / issue:** Each console should preview its payoff up front + end with a "what next →" handoff, and the Dashboard shows the ①②③ progress (Locked #7).

- [x] One reusable `JourneyProgress`/`WhatNext` component (token-CSS) used in three places: welcome (JR-3), the Dashboard ①②③ map (done/active), and a per-console footer card → verify: the same component renders in all three without divergent copies.
- [x] A **"what next →" footer** appended to each console body (additive, no internal redesign): Obligations → `/filing`; Filing → `/audit-defense`; Audit Defense → `/dashboard` → verify: each shows the correct handoff link; routes correctly; `git diff` shows only the appended footer.
- [x] **①②③ progress** on the Dashboard (Wave-D): a compact strip with done/active derived cheaply from `cp_journey_done` or simple breadcrumbs (do NOT invent per-step completion that isn't tracked) → verify: the strip renders; state derives from real flags.
- [x] **No fabrication:** any figure shown is pulled from the real endpoints already on the page → verify: no hardcoded tax figure/rate/threshold in new copy.

**Acceptance criteria:** a shared journey-progress component drives the welcome map, the Dashboard ①②③ strip, and the per-console handoffs; consoles gain only an appended footer; progress derives from real flags; no fabricated figures; build/type/lint clean.

### JR-5 `[FE]` — Audit-Defense rework: free-text + chips + simulated pipeline + pack-shape preview _(Wave J3; headline trust payoff)_

**Purpose / issue:** Rework the 2-button console (`AuditDefense.tsx:80-146`) to the locked design. The query is already free-text on the backend (T5); the pipeline is FE-simulated (T4) — **no BE change.**

- [x] **Free-text + chips:** replace the two fixed buttons with a free-text input (bound to `getAuditDefense(tin, query, evidence, injectFabricated)`, `client.ts:525-537`) PLUS canned example **chips** that pre-fill the box (e.g. "Justify the RM4,800 repairs deduction", "Is this depreciation deductible?", and the labelled fabricated-clause trust-demo chip that sets `inject_fabricated=true`) → verify: a custom question + each chip build a pack; the fabrication chip drives `inject_fabricated`.
- [x] **Watchable pipeline (FE-simulated, T4):** a 4-stage stepper — **Retrieve law → Ground claim → Verify citations → Reject fabrications** — derived over the single request, mirroring `FilingStudio` `deriveStages` (`FilingStudio.tsx:98-221`; reuse `StageRow` + the `--denim`/`--mustard`/`--rust`/`--ink-soft` colours) → verify: submitting animates the four stages to COMPLETE; the fabrication path flips the final stage to "Rejected"/BLOCKED; a derived animation, not a streamed contract.
- [x] **Pack-shape preview BEFORE running:** a greyed "what you'll get" preview (narrative + N citations with badges + exposure note) before a query runs → verify: preview renders before submission + is replaced by the real pack.
- [x] **Fabrication = headline:** elevate the existing rejection callout (`AuditDefense.tsx:150-185`) to the centrepiece ("the AI cannot fabricate a citation and have it pass — the deterministic gate stamps `verified=false`"); keep `CitationPanel`/`VerifiedBadge` + the `notify()` on rejection (`AuditDefense.tsx:46-55`) → verify: the fabrication beat reads as the trust headline; the BE-18 money-shot unchanged live + mock.
- [x] **Non-regression:** keep the two-tier trace (`AuditDefense.tsx:225-444`), the 502 handler, the persona-switch reset (`AuditDefense.tsx:24-29`), the `SovereignBadge` → verify: cited pack, two-tier trace, 502 path, badge, reset all still work.

**Acceptance criteria:** Audit Defense offers a free-text box + chips, a FE-simulated 4-stage pipeline over the single request, a pack-shape preview, and frames the fabricated-citation rejection as the headline; the `inject_fabricated` money-shot, two-tier trace, 502, badge, reset preserved; **no backend change**; build/type/lint clean.

### JR-6 `[FE]` — "Use my own company" form (all `EntityTaxProfile` fields) _(Wave J3; depends on JR-1; wires BE-J1 mock-first)_

**Purpose / issue:** Capture a real custom company → make it the active 4th entity → thread it through the consoles via the inline `ssm`. Cache in localStorage so it survives reload even if the BE write is skipped (Locked #4; fallback-first).

- [x] Add a custom-company form (`frontend/src/pages/CustomCompany.tsx`, reachable from the welcome on-ramp and/or the switcher) capturing **all** `EntityTaxProfile` fields (`client.ts:32-43`): `tin`, `entity_type`, `msic_codes[]`, `paid_up_capital`, `gross_income`, `employee_count`, `sst_registered`, `basis_period_start`, `basis_period_end`, `commencement_date?`; basic validation (required, numeric coercion, TIN hint) → verify: captures every field + blocks an empty/invalid submit with inline messages.
- [x] On submit: build a `Persona` (`{tin, label, ssm, demoRawText}`; `demoRawText` empty/placeholder, see JR-7) + call **`addCustomPersona`** (JR-1) → persists + active; **then best-effort** `POST /entities` (BE-J1) but the FE does NOT block on/fail from the server write (fallback-first, T8) → verify: submitting adds it to the switcher + active + localStorage; with BE up it also lands via `POST /entities`; with BE down/mock it still works from local state.
- [x] **Mock-first:** in `VITE_API_MOCK=1` the `POST /entities` call is a no-op/echo → verify: the whole flow (form → active entity → all three consoles via the inline `ssm`) works in mock mode.
- [x] **422 surfacing:** a live 422 surfaces field detail (`.validationDetail`, `client.ts:426-436`) next to the field but keeps the local entity usable → verify: a bad live submit shows field errors yet the local entity stays selectable.

**Acceptance criteria:** a form captures all `EntityTaxProfile` fields, makes the company the active 4th entity (via JR-1, localStorage-persisted), best-effort persists via `POST /entities` without blocking, threads through all consoles, works mock-first, surfaces live 422 gracefully; build/type/lint clean.

### JR-7 `[FE]` — File-upload UI (drag-and-drop → `POST …/documents/upload`); paste stays the fallback _(Wave J3; wires BE-J2 mock-first)_

**Purpose / issue:** A drag-and-drop zone in the Filing classify step uploads a trial-balance file (BE-J2) and feeds the classified result into filing — while **paste-text remains the always-works fallback** (Locked #5; T6).

- [x] Add `uploadDocument(tin, file): Promise<ClassifyResponse>` in `client.ts` that POSTs `FormData` **without** `post<T>()` (T6 — no JSON content-type); the mock branch returns `MOCK_CLASSIFY` → verify: typed method exists; mock returns a `ClassifyResponse`; live sends multipart.
- [x] Add a drop zone to Filing Stage-01 (`FilingStudio.tsx:806-851`, the textarea block) accepting the confirmed subset (JR-Q3) → call `uploadDocument` → feed `line_items` into the existing flow (set `classifyResult`/`lineItems`, → `classified` phase) → verify: dropping a file classifies + proceeds to Compute exactly as paste does.
- [x] **Paste fallback (hard requirement):** the textarea + "Classify" stay functional; on upload failure (4xx/502) show a clear error + allow paste → verify: with the endpoint absent/erroring, paste still classifies; the drop zone shows a friendly error, no white-screen.
- [x] **Non-regression:** the FilingStudio stepper, HITL gate, 96px hero, FigureTrace details, one-shot fallback, sovereign badge untouched → verify: the full filing flow works unchanged whether input came from paste or upload.

**Acceptance criteria:** a drop zone uploads the confirmed formats to `POST …/documents/upload` (dedicated multipart method, mock-first), feeds classified items into the existing flow, degrades to the paste fallback on any error; the stepper otherwise unchanged; build/type/lint clean.

### JR-8 `[FE]` — Obligations enrichment: YA2026 calendar viz + payoff headline (grounded) _(Wave J4)_

**Purpose / issue:** Obligations gains a YA2026 calendar visualization + a payoff headline on top of the existing list (Locked #6). Pure-FE over existing grounded data (T7) — no recompute, no fabrication.

- [x] Add a **YA2026 calendar/timeline** to `ObligationRadar.tsx` rendering `data.obligations` (`{form, due_date, status, rule_id}`) along a year/quarter or month grid (token-CSS; reuse `.window` + the form-badge/countdown idioms at `ObligationRadar.tsx:177-285`) → verify: real obligations positioned by `due_date`, overdue flagged (`--rust`), no invented entries.
- [x] Add a **payoff headline** (reuse Dashboard Wave-D `leadObligation`/`StatusSummary`: "N obligations · M overdue · next due {date}") so the console previews its payoff (ties to JR-4) → verify: reflects real counts/next-due for the active entity; updates on persona/custom switch.
- [x] **Grounding (hard rule):** every figure/date is from `/obligations`; no fabricated rate/threshold/amount → verify: code review finds no hardcoded tax figure; all dates trace to `due_date`.

**Acceptance criteria:** a grounded YA2026 calendar + payoff headline over existing obligation data, reusing the Dashboard status pattern; no recompute, no fabricated figures; works for all entities incl. custom; build/type/lint clean.

### JR-9 `[FE]` — Light grounded "what-if"/savings framing _(Wave J4; LOWER-PRIORITY; cut-tolerant)_

**Purpose / issue:** Surface a light grounded framing where cheap — e.g. the SME-band breakdown already in the Filing computation (Locked #6). Recompute-backed what-ifs are lower-priority (JR-Q4), cut first if behind.

- [ ] Surface the **SME-band breakdown** implicit in the computation (the `tax_payable` figure derives from 15/17/24% bands; the rule trace is on the figure): a small "how this was taxed" card on the Filing result using the **existing** figures (no new call) → verify: reflects the real `computation.fields` band figures; no number invented.
- [ ] **Defer recompute-backed what-ifs** (sliders re-calling `/form-c`) to a documented follow-on unless JR-Q4 says otherwise → verify: no new recompute round-trip added.
- [ ] **Grounding (hard rule):** only figures the core already returned → verify: no fabricated rate/threshold; band percentages match `ya_2026.yaml` (cross-check at TD-J3 / the TD-6 gate).

**Acceptance criteria:** a light grounded SME-band framing on the Filing result using only already-computed figures; recompute what-ifs deferred; no fabricated numbers; build/type/lint clean. **Cut-tolerant.**

### TD-J1 `[TD]` — Mock fidelity + journey-state tests _(throughout)_

- [ ] Keep mock fixtures in sync: a custom-entity mock path (JR-1/JR-6), a `MOCK` upload returning `ClassifyResponse` (JR-7), the Audit chips/simulated-pipeline mock behaviour (JR-5) → verify: a full mock run (welcome → wizard → custom company → upload → filing → audit fabrication) works with no backend.
- [ ] Add coverage (or document a manual check) for the journey flag (`cp_journey_done`) + custom-persona persistence → verify: flag + persistence behave correctly across reload.

**Acceptance criteria:** the new flows work fully in mock mode; journey flags + custom-entity persistence covered (test or documented); no fabricated fixture data.

### TD-J3 `[TD]` — Journey docs + demo-script update _(after the FE waves)_

- [ ] Update the demo script (TD-3/TD-4) to lead with the new journey (welcome → ①②③ → sample-data → wizard → graduate); note custom-company + file-upload as the "use your own data" follow-on → verify: the script maps to the live journey; the fabrication mechanism (BE-18) stated.
- [ ] Note the new endpoints in `trd.md` §7a (`POST /entities` create; `POST …/documents/upload`); confirm the upload/extract path is sovereign (in-process, no foreign API) → verify: §7a lists both; no sovereignty overclaim.
- [ ] **⚠verify hook:** JR-9 band percentages + any enrichment figure fold into the TD-6 / Q5 gate → verify: enrichment figures are on the ⚠verify checklist.

**Acceptance criteria:** the demo script + trd reflect the new journey + the two new endpoints; enrichment figures on the ⚠verify checklist; no sovereignty overclaim.

---

## Wave J5 — Usability Polish (post-SUS)

> **PG-only section — implemented 26/06/26.** SUS score was 65/100 pre-wave. All tasks below are complete and verified (118 backend tests green; FE: `tsc --noEmit` clean, `bun run build` 73 modules, `biome check` 0 errors).

- [x] **P0 #3 `[BE]` — `createEntity` body-shape bug + 500 edge:** Added `EntityCreateReq(ssm: dict)` Pydantic model to `api/schemas.py`; updated `create_entity` in `api/main.py` to use typed `req: EntityCreateReq` instead of `req: dict`; FE `createEntity` in `client.ts` now sends `{ ssm }` wrapped (was flat). Added 2 new tests: missing `ssm` key → 422; flat body → 422 (not 500). Suite: 118 passed.
- [x] **P0 #5 `[FE]` — Trust-Demo citation-ID consistency:** `FABRICATION_QUERY` and `FABRICATION_EVIDENCE` in `AuditDefense.tsx` now use the canonical `ITA-1967-s999-FAKE` throughout (was `ITA s99_ZZ`). The mock `MOCK_DEFENSE_FAKE_CITATION` already used `ITA-1967-s999-FAKE`. All three surfaces (query text, BLOCKED banner, rejected chip) now show one consistent ID.
- [x] **P0 #1 `[FE]` — Plain-language relabel + remove leaked dev labels + de-emphasize machine IDs + glosses:**
  - Removed "Seeded · BE-8 / getEntity" from `Dashboard.tsx` entity snapshot.
  - Renamed "Start Filing (HITL)" → "File With Review" and "One-Shot (No Gate)" → "File Without Review" in `FilingStudio.tsx`.
  - Replaced "HITL · ILMU nemo-super" kicker in Dashboard with "Review and Approve · ILMU nemo-super".
  - Updated `ObligationRadar.tsx` WhatNext copy to remove "HITL gate".
  - Removed always-visible `rule_id`/`config_version` from: Dashboard hero rail (replaced with "YA2026" / "LHDN-sourced"); Dashboard obligation rows; ObligationRadar obligation rows; `FigureTraceRow` always-visible topline in FilingStudio; hero numeral sub-line in FilingStudio. All remain inside existing `<details>` blocks.
  - Replaced `rule_id and config_version` in `Landing.tsx` and `Privacy.tsx` with plain-language equivalents.
  - Added "Form codes explained" `<details>` disclosure in ObligationRadar obligations list with plain-language glosses for Form C, CP204, SST-02, CP39, MyInvois.
  - Enhanced `hint` text in `CustomCompany.tsx` for TIN (LHDN gloss), MSIC (full name gloss), SST (Sales and Service Tax gloss), Basis Period (financial year gloss in titlebar).
- [x] **P0 #2 `[FE]` — Mock fidelity: per-persona classify line items:** Replaced static `MOCK_CLASSIFY` with `MOCK_CLASSIFY_BY_TIN` keyed by TIN (Acme/Sinar/Selera each have their own line items with their own `gross_income` as revenue). Added `makeMockClassify(tin, profile?)` that falls through to a `gross_income`-derived set for custom entities. `classifyTrialBalance` and `uploadDocument` now call `makeMockClassify(tin, MOCK_ENTITIES[tin])` in mock mode. Grounded: these are the user's own input categories/amounts, not invented figures.
- [x] **P1 #4 `[FE]` — Soften first-run OVERDUE framing:** Added a context note below the overdue count in `ObligationSummary` (`ObligationRadar.tsx`) and `StatusSummary` (`Dashboard.tsx`) when `overdueCount > 0`: "Dates shown are for the sample basis period. OVERDUE status reflects the demo clock." Obligation logic unchanged; genuine overdue status preserved.

---

## Journey Rework — Open Questions for Gate 1 (PL surfaces; PO decides)

> Each has a recommended default so implementation can proceed if unanswered. **JR-Q1, JR-Q3, JR-Q5** are load-bearing.

- [ ] **JR-Q1 — Confirm the wizard WRAPS the existing consoles (vs a standalone forked wizard).** **PL strongly recommends WRAP** (Locked #2): a `WizardLayout` mounts the **reused** consoles at `/start/*` with a Step-X-of-3 header + next/back; the consoles stay reachable at `/obligations` etc.; Finish/Skip → `/dashboard` — **no duplicated logic** (T2: FilingStudio resets on persona switch, so the wizard pins one entity). A standalone fork doubles the maintenance/regression surface in a tight window. **Confirm WRAP**, or request a standalone wizard. _(Sub-confirm: `/start/obligations` etc. acceptable; wizard under the AppShell chrome or a minimal distraction-free shell?)_
- [ ] **JR-Q2 — Custom-company form fully open in guest mode, or gated?** **PL recommends fully open** — no real auth (guest-only), the demo benefits from "try your own numbers", the entity is cached locally + best-effort persisted. Gating contradicts the no-hard-auth-guard pattern. **Confirm fully open**, or specify a gate (e.g. only after the sample tour).
- [ ] **JR-Q3 — File-upload formats: must-have vs nice-to-have for the demo?** **PL recommends CSV must-have** (cheapest, most reliable), **XLSX strong second** (common for trial balances via `openpyxl`/pandas), **PDF nice-to-have** (`pypdf` is unreliable on scanned/complex PDFs — a live-judge risk). Paste is the fallback regardless. **PL recommends CSV+XLSX shipped, PDF best-effort (cut first if flaky).** Confirm the set. _(Drives BE-J2 deps + fixtures + tests.)_
- [ ] **JR-Q4 — How far to take what-if/enrichment vs defer?** **PL recommends grounded-only, no-recompute for the prelim** (JR-8 calendar + payoff; JR-9 surfaces the existing SME-band trace) and **defers** recompute-backed what-ifs (sliders re-calling `/form-c`) to a documented follow-on — protecting the no-fabrication guarantee + the window. **Confirm grounded-no-recompute**, or authorize a specific recompute-backed what-if (with the extra build + ⚠verify cost).
- [ ] **JR-Q5 — Require BE persistence for the demo, or rely on localStorage if the Neon write fails?** **PL recommends localStorage-first / BE best-effort** (Locked #4, matching Q9 caveat #2 "DB-down ≠ demo-down"): the custom entity is fully usable from local state; `POST /entities` persists when up but the FE never blocks on/fails from it. Requiring a live write re-introduces a demo hard-dependency the persistence design avoids. **Confirm localStorage-first / BE best-effort**, or require a successful BE persist first. _(Sub-question: should **Sign-Out** reset `cp_journey_done` + clear custom entities so a fresh demo re-enters welcome/wizard? PL recommends **yes — Sign-Out resets the journey** for clean repeat demos; confirm.)_

---
