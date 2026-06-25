# PLAN

> Owned by **PL**. The PM presents this at **Gate 1** for the human to approve before any implementation.
>
> **Structure:** uniformly **phase-oriented** — top-level sections are PHASES in execution order, and **every task carries an explicit lane tag** in its heading. **Completed work (`[x]`) is summarized concisely under [`## Done — completed phases`](#done--completed-phases)**; full per-task detail lives in [`progress.md`](progress.md). Open tasks keep their full breakdown below. Design & decisions → [`cukaipandai-spec.md`](cukaipandai-spec.md); current status → [`progress.md`](progress.md).
>
> **Lane tags:** `[BE]` = backend · `[FE]` = frontend · `[DO]` = devops/infra (tooling · CI · deploy) · `[TD]` = testing & docs. A task is tagged by its **primary** lane; cross-lane touches are noted inline.
>
> **Phases:** **Phase 0** Monorepo Restructure → **DONE** (PR #1) · **Phase 1** AI layer + core gaps → **DONE** (BE-1…BE-4, TD-1/TD-2) · **Phase 2** Frontend consoles + FE-prereq BE (BE-8/9/10) + sovereign RAG (BE-12/13/14) → **DONE** (FE-1…FE-6) · **Phase 3** Deploy/demo/submission (BE-6/7/18, FE-8, Neon DO-4 + BE-15/16/17) — partly done, deploy + TD open · **Redesign Waves 1–5 + Wave A–D** → **DONE** (app shell, journey, consoles, settings, notifications, auth, FAQ, dashboard) · **USABILITY + END-TO-END JOURNEY REWORK** → **DONE** (front door + wizard + Audit-Defense + custom-company + file-upload + enrichment + Wave J5 polish + auth) · **WALKTHROUGH-FEEDBACK REWORK** → the NEW work this Gate-1 (3-page UX rework + per-user persistence + conversational Audit Assistant + general refinements, phased into 4 waves).

---

## Done — completed phases (concise; full detail in `progress.md`)

> Every item here is **`[x]` complete and verified** (118 backend tests green; FE builds clean: `tsc --noEmit` + `bun run build` + `biome`). Summarized per the header's convention so the open work + the new walkthrough rework stay readable. **No open task is in this list.**

- **Phase 0 `[DO]` — Monorepo restructure (DONE, PR #1).** Root Bun/biome/husky/commitlint/prettier tooling; `backend/` (api+core+tests+Docker, uv) + `frontend/` (Vite 5 + React 18 + RR7 + token-CSS) split; CI; `.env.example` at root.
- **Phase 1 `[BE]`/`[TD]` — AI layer + core gaps (DONE; 79 tests).** BE-1 ILMU-first `RoutingLLMClient` + JSON mode + live spike (resolves Q1; critic = the weak step, escalation deferred per Q6). BE-2 HITL filing graph over FastAPI (`…/filings/form-c/start` + `/resume`, golden `tax_payable RM31,000`, MemorySaver flagged non-durable → BE-15). BE-3 `assess_risk` → 4 deterministic checks wired (`gross_chargeable_gap` fires on Acme). BE-4 live MSIC (`GET /reference/msic/{code}` via data.gov.my) + holidays deadline-shift. TD-1 prd/trd reconciled. TD-2 routing + endpoint tests.
- **Phase 2 `[BE]` — FE-prereq + sovereign RAG (DONE; 100 tests).** BE-8 `GET /entities/{tin}` (404 on unknown). BE-9 `POST …/documents/classify` (raw text → `LineItem[]`, JSON-mode, 502-guarded; resolves Q7). BE-10 consistent **422** envelope (`_profile`/`_line_items` at the boundary). BE-7 CORS (`CORS_ORIGINS`/`FRONTEND_ORIGIN`). BE-12/13/14 sovereign RAG (expanded 15-clause corpus with section/page/url; committed numpy index via `scripts/build_rag_index.py` + local static `model2vec`; `core/rag.py` fail-open retriever; `ground_citation` stays authoritative — fabricated IDs still `verified=false` with RAG on). BE-6 `route_info()` → `{sovereign, active_model}` on `/audit-defense` + `/classify`.
- **Phase 2 `[FE]` — the three consoles (DONE; FE-1…FE-6).** FE-1 typed `api/client.ts` covering all routes + mock mode + `RiskFlag`/RAG-`Citation`/422 types; `useEntity` + canonical Acme seed. FE-2 Obligation console. FE-3 Filing Studio (classify → HITL `start`→approve→`resume`, 96px hero `tax_payable`, honest-number IA, per-figure `FigureTrace` `<details>`, risk flags). FE-4 Audit-Defense (cited pack, `CitationPanel` + verified/unverified badge, two-tier trace, 502-safe, live fabricated-citation rejection). FE-5 live sovereign badge. FE-6 live-swap + the 3 QA carry-forwards.
- **Phase 3 (partial) — BE-18 + FE-8 + Neon (DONE; 107 tests).** BE-18 opt-in `inject_fabricated` (the live money-shot). FE-8 3 seed personas + DEMO MODE banner. DO-4 + BE-15/16/17 Neon SG persistence **verified end-to-end** (durable `PostgresSaver`; EvidenceVault hashes-not-payloads; `EntityRepository` + fixtures fallback; DB-down ≠ demo-down). DO-5 gated CI/CD `deploy.yml`.
- **Redesign Waves 1–5 `[FE]` (DONE).** App shell, dashboard depth, entry journey, Filing 5-stage stepper, responsive topbar.
- **Waves A–D + Settings `[FE]` (DONE).** Auth rework pages, notifications, landing hero + FAQ, dashboard command-center, Settings.
- **USABILITY + END-TO-END JOURNEY REWORK `[FE]`/`[BE]`/`[TD]` (DONE; 118 tests).** BE-J1 `POST /entities` (create custom entity, fallback-first). BE-J2 `POST …/documents/upload` (CSV/XLSX/PDF → classify; uv.lock updated). JR-1 PersonaContext runtime custom-entity list (localStorage) + custom-TIN resolution in `useEntity`. JR-2 `WizardLayout` (3-step wizard wrapping reused consoles). JR-3 `Welcome` first-run screen + `cp_journey_done`. JR-4 `JourneyProgress` (welcome map · dashboard strip · per-console `WhatNext`). JR-5 Audit-Defense free-text + chips + FE-simulated pipeline + pack-shape preview + fabrication headline. JR-6 `CustomCompany` form (all `EntityTaxProfile` fields). JR-7 Filing drop-zone (paste fallback). JR-8 Obligations calendar viz + payoff headline. JR-9 SME-band framing. **Wave J5 polish** (plain-language relabels, machine-ID de-emphasis, per-persona mock classify, soften OVERDUE framing). **Real backend auth** (`api/auth.py` PBKDF2 + HS256 JWT + Google SSO config-gated; `UserRepository` Neon+fallback; `/auth/signup`·`/login`·`/google`·`/me`; `AuthContext`/`AuthProvider`; guest flag).

---

## Open Questions / Assumptions (carried)

_Phase-0 RQ1–RQ6 RESOLVED; Phase-1 spike resolved Q1, partially Q2. Q6 RESOLVED (pure-ILMU); Q7 RESOLVED (classify endpoint); Q8 RESOLVED (local static embeddings + committed numpy index + authoritative gate); Q9 RESOLVED (managed Neon Postgres, SG, with sovereignty caveat + self-hosted-MY prod path + fixtures fallback). Q3 RESOLVED at the FE-1 gate. **Q4 (BE — exact MyInvois paths + SSM CSD fields) and Q5 (TD — final ⚠verify) RESOLVED (TD-6, 26/06/26, AI-assisted; human tax-pro glance still advisable). The Journey-Rework JR-Q1…JR-Q5 were resolved during that wave.**_

- [x] **Q4 (BE)** — MyInvois prod paths + SSM CSD fields. → `sdk.myinvois.hasil.gov.my/api`; SSM CSD `[ROADMAP]`.
- [x] **Q5 / TD-6 (TD)** — YA2026 figures + RAG clauses re-verified (26/06/26); ONE e-invoicing enforcement-date correction; no computation value changed; **107/107** then **118** green.

---

## Phase 3 — remaining OPEN tasks (deploy + demo + docs)

> The BE additions + FE + Neon + DO-5 CI are **done**. What remains is the **human-gated deploy** + the **demo/docs** lane. (Unchanged by this Gate-1; the walkthrough rework lands before the final cut.)

### DO-2 `[DO]` — Deploy BE → Render _(agent config done; HUMAN deploy open)_

- [x] Dockerfile `$PORT` binding; runbook env-var table documented.
- [ ] **HUMAN:** Render Web Service (root `backend/`, Docker, Free, `/health`); set env (`LLM_*`, `CORS_ORIGINS`, `MYINVOIS_BASE_URL`, `DATABASE_URL`/`_UNPOOLED`, `AUTH_JWT_SECRET`) → verify: `/health` 200; URL captured.
- [ ] **Cold-start (DQ2):** pre-warm `/health` ~1 min before the demo.
- [ ] **CORS reconcile:** append the prod Vercel URL to `CORS_ORIGINS` + redeploy.

**Acceptance criteria:** BE live on Render, `/health` passes, URL captured, CORS open to prod, RAG loads-or-fails-open within 256MB, cold-start mitigated.

### DO-1 `[DO]` — Deploy FE → Vercel _(agent config done; HUMAN deploy open)_

- [x] `frontend/vercel.json` SPA rewrite; build contract; runbook Vercel section.
- [ ] **HUMAN:** `vercel link` (root `frontend/`, Vite, `dist`); set Production env (`VITE_API_BASE_URL`, `VITE_API_MOCK=0`, `VITE_DEMO_MODE`/`VITE_SOVEREIGN`, `VITE_GOOGLE_CLIENT_ID` if SSO live) → `vercel --prod`; capture URL → feed to DO-2 CORS.

**Acceptance criteria:** FE on Vercel, deep-link refresh resolves, prod URL drives Render.

### DO-3 `[DO]` — Deploy smoke / live click-through _(open)_

- [ ] Pre-warm + load; entity + ≥3 obligations; classify → cited Form C; audit-defense cited pack + live `verified=false`; sovereign badge; DB-down fallback holds → verify: full demo works on deployed URLs.

### DO-5 `[DO]` — Gated CI/CD pipeline _(agent done; HUMAN secrets open)_

- [x] `deploy.yml`; `ci.yml` deleted; runbook CI/CD section.
- [ ] **HUMAN:** add the 4 GitHub secrets; confirm first green run; turn off Render native auto-deploy.

### TD-3 `[TD]` — Pitch-deck README + demo script _(open)_

- [ ] Pitch-deck README (problem / market / pricing / roadmap) folding YA2026 figures, the ILMU pricing caveat, the pure-ILMU sovereignty story, the "decision-support, not legal advice" guardrail → verify: README covers all four sections.
- [ ] **Neon + Google-SSO sovereignty framing (Q9 — do NOT overclaim):** state prelim persistence = managed Neon SG (not MY), hashes-not-payloads, prod = self-hosted MY; Google SSO = US dependency (config-gated) → verify: no "all data stays in Malaysia" unqualified.
- [ ] **≤7:00 demo script** → verify: maps to live beats; fabrication mechanism stated.

**Acceptance criteria:** README + ≤7:00 demo script exist; residency caveats honest; fabrication-rejection mechanism stated.

### TD-4 `[TD]` — Demo dry-run + record + submit _(open; needs DO-1/2/3 green)_

- [ ] Timed dry-run (<7:00 on deployed stack); record the cut; submit repo + README + video + Vercel link → verify: submission received.

### FE-7 `[FE]` — Styling polish to devkit tokens _(polish; cut candidate; open)_

- [ ] Consistent devkit-class polish across consoles → verify: matches the design system; build stays green.

### BE-5 `[BE]` — Wire + live-test escalation (sovereign-preferred) — **DEFERRED post-prelim**

- [ ] Prefer `LLM_ESCALATION_MODEL` on the same ILMU gateway; direct-Anthropic is the flagged non-sovereign opt-in → verify (post-prelim). **Prelim: intentionally NOT done (Q6 pure-ILMU).**

### STRETCH — SSE streamed stepper _(FE-9 + BE-11; OFF the critical path; #1 in cut-order)_

- [ ] **BE-11:** SSE `…/filings/form-c/stream`. **FE-9:** consume as a live stepper; degrade to the non-streamed stepper on `error`.

---

# WALKTHROUGH-FEEDBACK REWORK `[FE]` `[BE]` `[TD]`

> **NEW section — FINALIZED for autonomous execution.** Owned by **PL**. Brainstorming complete; PL findings verified against the code on disk **26/06/26**. A substantial UX + feature rework of the three main pages plus general refinements, driven by a first-time non-technical finance-manager walkthrough. **All major directions are LOCKED and all open questions are RESOLVED as locked decisions below — there is NO Gate 1; PG executes all five waves (0–4) autonomously.**
>
> **Hard gates on every FE task:** `bunx tsc --noEmit` clean · `bun run build` green · `bunx biome check frontend/src` 0 errors. **On every BE task:** `cd backend && uv run pytest -q` (must not regress **118**; new tests added). **Non-regression (every task):** the working consoles, the **BE-18 fabricated-citation money-shot**, the **sovereign badge**, real **auth** (`AuthContext` + `/auth/*`), `tokens.css`/design system, notifications, the wizard (`WizardLayout`/`Welcome`), deploy, and the Neon layer stay behaviourally intact. **Reuse `tokens.css` classes** + existing primitives (the `FilingStudio` `StageRow`/`deriveStages`/`ComputationPanel`/`TechnicalDetails` patterns, `CitationPanel`, `SovereignBadge`, `VerifiedBadge`, `JourneyProgress`, `CustomCompany` form fields); **no new large CSS, no Tailwind/shadcn.**

## Walkthrough Rework — Locked Decisions (FINAL; do NOT re-open)

1. **Guest = a single publicly-shared BACKEND user that persists to Neon.** Today "Continue as Guest" is purely client-side (`AuthContext.continueAsGuest` only sets `cp_entered_as_guest`; no backend call, no JWT). FINAL: seed one fixed shared guest identity in the backend (`users` table / `UserRepository`); `POST /auth/guest` issues a JWT for it via `auth.create_token(sub,email,name)`; `continueAsGuest()` calls it and stores the token exactly like login, so every subsequent request carries the shared guest JWT. **Consequence (PO's explicit intent for a demo account): guest data is shared/public across ALL guests** — stated honestly in the deck/docs.
2. **Persistence is BACKEND-ONLY for business data — no localStorage for data.** ALL business data — entity-profile edits AND filing records — persists to Neon keyed by the JWT `sub` (guests = the shared guest id; registered users = their id). The old localStorage custom-entity store (`cp_custom_entities`) + active-persona selection MOVE to the backend per-user entity profile (`GET/PUT /me/entity`); PersonaContext's "Custom" entity is backend-backed. **localStorage retains ONLY UI prefs: theme (`cukaipandai-theme`) + the onboarding flag (`cp_journey_done`).** All per-user endpoints require a valid JWT (401 without); the FE ALWAYS has one now (guest or registered). Fallback-first preserved (Neon when `DATABASE_URL` set, else in-memory) so tests/demo never hard-crash.
3. **Audit Defense = a conversational "Audit Assistant" tied to a selected filing record.** Pick a saved filing → "Defend this filing" → a chat to ask how to justify any figure → suggested questions seeded from THAT filing's actual figures → each answer is citation-grounded (one `/audit-defense` request per message, the filing's figures threaded as `evidence`); the deterministic fabricated-citation rejection stays the trust signal. **Depends on filing records (Wave 3 → Wave 4).** No new BE endpoint (the chat/turn state is FE-only; `/audit-defense` already takes free-text `query` + `evidence`).
4. **Onboarding/tour sequence:** `/welcome` → `/start/obligations` → `/start/filing/new` → `/start/audit-defense` → `/dashboard`. **The dashboard is reached only at the very end**; the filing step is the NEW `/filing/new` creation route. `WizardLayout`, Welcome's "Try sample data", the walkthrough modal's "Yes, restart onboarding", and "Reset all data" all use this sequence.
5. **Phased delivery (Waves 0–4), testable + shippable between waves.** **Wave 0** BE foundation (guest auth + shared user; `GET/PUT /me/entity`; `/me/filings` CRUD — all keyed to JWT `sub`, fallback-first, tests). **Wave 1** FE quick refinements + reusable Tooltip + GR-1…GR-9 general items + wizard-sequence + light-theme default. **Wave 2** `/entity` page + persona-model-on-backend + wire `continueAsGuest`→`/auth/guest`. **Wave 3** Filing dashboard `/filing` + `/filing/new` + `/filing/[id]` wired to `/me/filings`. **Wave 4** conversational Audit Assistant tied to a saved filing. **BE foundation (Wave 0) is sequenced first; the Tooltip is a Wave-1 primitive reused everywhere; Audit (W4) depends on filing records (W3).**

## Resolved Open Questions (BAKED IN as locked decisions — no Gate 1)

- **GQ-A — Filing guided-input UX → LOCKED:** a guided "trial balance" panel — a labelled instruction ("Provide your trial balance — one account per line"), a one-line format example, the persona's `demoRawText` pre-filled in the textarea (paste = the always-works fallback), and the CSV/XLSX/PDF file-drop kept as a clearly-secondary option (BE-J2). Removes the confusing open "paste any text / drop anything" framing; keeps both real input paths. (FM-2.)
- **GQ-B — Filing "compare" → LOCKED DEFER:** ship view-back + the records list + open-a-record now (FM-1/FM-3); a side-by-side comparison view is a documented follow-on, **not built** in this rework. (FM-3.)
- **GQ-C — guest vs localStorage boundary → SUPERSEDED** by Decisions #1/#2: there is no guest-localStorage data path; guests are a shared backend user and ALL data goes to Neon keyed by JWT `sub`. No guest→account migration in the prelim (out of scope).
- **GQ-D — removing the topbar selector + Human-Approval → LOCKED no-loss:** entity selection stays in Settings/Workspace + on `/entity`; the active persona drives every console. The Filing rework is one-shot on the FE (`/filing/new` uses `getFormC`); the HITL `/start`+`/resume` BE endpoints + their tests **remain untouched** (capability retained/demonstrable, just unused by `/filing/new`). (GR-2, FM-2.)
- **GQ-E — Tooltip → LOCKED:** one token-CSS `Tooltip`/`InfoTip` that opens on hover AND keyboard focus, dismisses on blur/mouse-leave/Escape, is edge-aware (no viewport clipping), links the bubble via `aria-describedby`; no browser-native `title=`, no new dependency. (UI-1.)

## Walkthrough Rework — Triage (PL findings, verified against the code 26/06/26)

**W0 — guest is client-only today; auth identity is JWT-`sub` + `email`; NO route guard.** `continueAsGuest` only sets `cp_entered_as_guest` (`AuthContext.tsx:97-104`); there is **no `/auth/guest`, no shared guest user row, no guest JWT**. `auth.create_token(sub, email, name)` puts the user id in `sub` (`auth.py:56-67`); `_bearer_user(authorization)` resolves a user dict from `Authorization: Bearer` (`main.py:127-137`). `App.tsx` does not wrap the AppShell in a `RequireAuth`. **Decisions #1/#2 require: a shared guest user + `POST /auth/guest`; `continueAsGuest` stores a real token; per-user endpoints derive the owner from the bearer (`sub`) and 401 without one; the FE always carries a token (guest or registered).** EP-0/EP-1/EP-2 own the BE; AUTH-FE owns the FE wiring.

**W1 — `POST /entities` + `EntityRepository.create()` are GLOBAL-by-TIN, not per-user** (`main.py:180-188`, `persistence.py:117-135`). The `CustomCompany` create flow + `test_create_entity_endpoint.py` depend on this global path. **Do NOT repurpose it** — add NEW per-user entity-profile endpoints (`GET/PUT /me/entity`) so the 118 tests stay green; the per-user store is keyed by JWT `sub`. EP-1 owns this.

**W2 — filing-record persistence is GREENFIELD.** The Neon `filings` table exists in `migrations/neon_schema.sql:26-32` but there is **no `FilingRepository`, no save/list/delete endpoints, and no FE record store.** The FilingStudio computes a result and discards it on `Start Over`/persona switch (`FilingStudio.tsx:682-687, 811-813`). EP-2 + FM-\* own this.

**W3 — FilingStudio is one coupled page that resets on `persona.tin`** (`FilingStudio.tsx:682-687`) and offers BOTH the HITL `start`/`resume` path AND the one-shot `getFormC` path (`client.ts:564-579`). The feedback splits `/filing` into a **records dashboard** + `/filing/new` (creation, **one-shot only — drop the Human-Approval stage**) + `/filing/[id]` (saved record). The one-shot `getFormC` already returns the same `computation`, so dropping HITL on the FE is a wiring change, not a BE change. FM-\* own this.

**W4 — Audit-Defense is ALREADY free-text + chips + simulated pipeline (JR-5).** The locked rework converts it to a **multi-turn, filing-tied** assistant. The backend `/audit-defense` is single `query`→pack and already accepts free-text `query` + `evidence` (`schemas.py:34-37`) — the chat is FE-multi-turn, **one request per user message**, with the selected filing's figures passed as `evidence`. **Zero new BE endpoint required**; `inject_fabricated` (BE-18) is preserved as a labelled trust-demo turn. AD-\* own this.

**W5 — the persona model currently uses a localStorage custom-entity list** (`cp_custom_entities` + `cp_active_persona`, `PersonaContext.tsx:9-101`). Decision #2 MOVES this to the backend: the "Custom" persona is now hydrated from `GET /me/entity` and written via `PUT /me/entity`; localStorage keeps only theme + `cp_journey_done`. `CustomCompany`'s field/validation patterns are reused by `/entity`. EN-\* own this.

**W6 — the topbar entity `<select>`, the drawer `x`, and the `?` button position all live in `AppShell.tsx`.** Selector `AppShell.tsx:318-344`; drawer close (`drawer-close`, label "x") `:473-475`; the `?` is at `bottom: 176` and is **always rendered** (`:518-546`). FINAL: selector removed (entity set only in Settings/Workspace), drawer `x` removed, `?` pinned **true bottom-right** + visible ONLY on Workspace+Compliance pages. GR-\* own this.

**W7 — `useTheme` defaults to `systemTheme()`** when nothing is stored (`useTheme.ts:17-18`). FINAL: default to **light**. GR-8 owns this.

**W8 — `WhatNext` is the "what next →" card to REMOVE from the three consoles** (`JourneyProgress.tsx:216-277`; rendered at `ObligationRadar.tsx:565`, `FilingStudio.tsx:1132`, `AuditDefense.tsx:845`). The Dashboard `JourneyStrip`/`JourneyMap` (the ①②③ progress) **stay**. Removing `WhatNext` usages must not orphan the import per the surgical-orphan rule. GR-\* + page tasks own this.

**W9 — the Wave-0 BE endpoints are independent of the FE chrome.** They land first and the FE builds against the contract mock-first (the team's established pattern). EP-0/EP-1/EP-2 run in **parallel within Wave 0**; the FE features that consume them (AUTH-FE guest token, EN-2 entity persistence, FM/AD records) wire mock-first then live.

## Walkthrough Rework — Waves & Sequencing

- **Wave 0 `[BE]` (foundation; gates all per-user FE work):** **EP-0** shared guest user seed + `POST /auth/guest` · **EP-1** `GET/PUT /me/entity` (per-user, JWT-`sub`-keyed, fallback-first) · **EP-2** `/me/filings` CRUD (create/list/get/delete + multi-delete, JWT-`sub`-keyed, fallback-first). All with tests; suite stays ≥118.
- **Wave 1 `[FE]` (quick refinements + Tooltip primitive + wizard sequence + light default):** **UI-1** reusable `Tooltip`/`InfoTip` · **OB-1** Obligations refinements · **GR-1…GR-9** general items (incl. the wizard-sequence GR-9 + light-theme GR-8).
- **Wave 2 `[FE]` (entity page + persona-on-backend + guest token wiring):** **AUTH-FE** `continueAsGuest`→`POST /auth/guest` (store token like login) · **EN-1** `/entity` page (view + edit, Compliance nav) · **EN-2** persona model backed by `GET/PUT /me/entity` ("Custom" on edit; localStorage data store removed).
- **Wave 3 `[FE]` (filing management + records on backend):** **FM-1** `/filing` records dashboard (list + single/multi-select + delete) · **FM-2** `/filing/new` (one-shot pipeline, guided input, "computed by the deterministic core" clarity) · **FM-3** `/filing/[id]` saved-record results + save-on-finalize → `/me/filings`.
- **Wave 4 `[FE]` (conversational Audit Assistant; depends on W3 records):** **AD-1** saved-filing picker → "Defend this filing" · **AD-2** chat + seeded questions from the filing's figures + per-message `/audit-defense` (figures as evidence) + fabrication trust signal.
- **TD throughout:** **TD-W0** (Wave-0 endpoint + guest-auth tests fold into EP-0/EP-1/EP-2) · **TD-W2** (mock fidelity for the new flows) · **TD-W3** (demo-script + trd update for the new pages + endpoints + the shared-guest caveat).

---

## Wave 0 — BE foundation (guest auth + shared user + per-user data CRUD)

### EP-0 `[BE]` — Shared guest user + `POST /auth/guest` _(Wave 0; gates all guest persistence)_

**Purpose / issue:** Decision #1: "Continue as Guest" must become a real backend session on a single publicly-shared guest identity so guest data persists to Neon keyed by the JWT `sub`. Today there is no `/auth/guest`, no shared guest row, no guest JWT (W0).

- [x] Add a fixed shared guest identity constant in `api/auth.py` (or `api/main.py`): `GUEST_USER_ID` (a stable string, e.g. `"guest-shared"`) + `GUEST_EMAIL = "guest@cukaipandai.local"` + `GUEST_NAME = "Guest"` → verify: the constants exist and are referenced by the seed + the endpoint (single source of truth).
- [x] Idempotently seed the shared guest into `UserRepository` at startup (in `main.py`, next to `_USER_REPO`, `main.py:75-77`): if `get_by_email(GUEST_EMAIL)` is None, create it with the fixed id (no password; `provider="guest"`); reuse the existing repo (Neon when `DATABASE_URL` set, else in-memory) — **fallback-first** → verify: after startup `get_by_email(GUEST_EMAIL)` returns a row with `id == GUEST_USER_ID`; re-running the seed does not duplicate or error; works with and without `DATABASE_URL`. _(NOTE: `UserRepository.create` generates a uuid id; add an optional `id` arg OR a dedicated `ensure_guest()` so the guest keeps the FIXED id — the per-user data key must be stable across restarts.)_
- [x] Add `POST /auth/guest` returning `{token, user}` via `_auth_response` for the shared guest (mint the JWT with `sub=GUEST_USER_ID`, `email=GUEST_EMAIL`, `name=GUEST_NAME`, reusing `auth.create_token`, `auth.py:56-67`; never leak a hash) → verify: `POST /auth/guest` → 200 with a token; `GET /auth/me` with that token → the guest user; `decode_token(token)["sub"] == GUEST_USER_ID`.
- [x] **`[TD]` tests** (`tests/api/test_auth.py` or a new `test_guest_auth.py`, hermetic in-memory): `/auth/guest` returns a token + the guest user; `/auth/me` round-trips it; the guest `sub` is the fixed id; the seed is idempotent (two startups → one guest row) → verify: `uv run pytest -q` green at **≥118**; existing 118 unchanged.

**Acceptance criteria:** a single shared guest user is idempotently seeded; `POST /auth/guest` issues a JWT for it with a stable `sub`; `/auth/me` resolves it; fallback-first; tests added; suite green. **The data implication (guest data is shared/public) is documented in TD-W3.**

### EP-1 `[BE]` — Per-user entity profile `GET/PUT /me/entity` (JWT-`sub`-keyed, fallback-first) _(Wave 0; parallel; gates EN-2)_

**Purpose / issue:** Decision #2: a user's **entity-profile edits** (incl. the "Custom" entity that used to live in `cp_custom_entities`) persist to Neon keyed by the JWT `sub` (guest = the shared guest id; registered = their id). The existing `POST /entities` is GLOBAL-by-TIN (W1) and must NOT change.

- [x] Add an auth dependency `_owner(authorization)` in `api/main.py` (reuse `_bearer_user`, `main.py:127-137`) returning the owner key = the JWT `sub` (`claims["sub"]`); **401 without a valid bearer** → verify: no/invalid token → 401; a valid guest OR registered token → resolves the `sub`.
- [x] Add `PUT /me/entity` taking `{ssm}` (reuse `EntityCreateReq` + `_profile` → **422** on bad input, `main.py:100-105`), persisting the validated `EntityTaxProfile` under the owner key; return the stored profile → verify: valid PUT (with token) → 200 + echo; bad ssm → 422; no token → 401.
- [x] Add `GET /me/entity` returning the owner's saved profile, or **404** if none saved yet → verify: after a PUT, GET (same token) returns it; a different `sub` does NOT see it; no token → 401; never-saved → 404.
- [x] Add a per-user store to `api/persistence.py` — `UserEntityRepository` with `get(owner)` / `put(owner, data)`: Neon table `user_entities(user_id text PRIMARY KEY, data jsonb)` (additive migration) when `DATABASE_URL` is set, pooled psycopg; **fallback-first** in-memory dict keyed by owner; any DB error → in-memory (mirror `EntityRepository`, `persistence.py:98-135`) → verify: with DB set the row persists + survives a fresh repo; with it unset, put+get round-trips in-memory without raising.
- [x] **Migration (additive only):** add `CREATE TABLE IF NOT EXISTS user_entities (...)` to `migrations/neon_schema.sql`; do NOT alter existing tables → verify: the file adds the table; existing schema untouched.
- [x] **`[TD]` tests** (`tests/api/test_me_entity_endpoint.py`): 401 without token; 200 put→get round-trip (in-memory); 422 on bad ssm; per-`sub` isolation (one token cannot read another `sub`'s profile); 404 before first save → verify: `uv run pytest -q` green at **≥118**.

**Acceptance criteria:** `GET/PUT /me/entity` derive the owner from the JWT `sub`, persist per-owner (Neon when configured, in-memory fallback otherwise), 401 without a token, 422 on bad input, per-owner isolated, with tests; the global `POST /entities` + all prior tests untouched; suite green.

### EP-2 `[BE]` — Filing-records CRUD `/me/filings` (JWT-`sub`-keyed, fallback-first) _(Wave 0; parallel; gates FM-1/FM-3 + Wave 4)_

**Purpose / issue:** Decision #2: saved **filing records** persist per-owner so the user can view records back. Greenfield (W2). Add a `FilingRepository` + CRUD endpoints keyed to the JWT `sub`.

- [x] Define a stored record shape — a Pydantic `FilingRecord` in `api/schemas.py`: `{id, user_id, tin, label, computation, risk_flags, line_items?, created_at}` (`computation` = the `FormComputation`-shaped dict; `id` = server uuid hex) → verify: the model validates a finalized payload; bad payload → 422 at the boundary.
- [x] Add `POST /me/filings` (owner from `_owner`; body = the record minus `id`/`user_id`/`created_at`) → stores + returns the record with its `id` → verify: 200 with token returns a record incl. `id`; no token → 401; bad body → 422.
- [x] Add `GET /me/filings` (list the owner's records, newest first) and `GET /me/filings/{id}` (one; **404** if not owned/absent) → verify: list returns only the owner's records; get-by-id returns the full record; a foreign id → 404; no token → 401.
- [x] Add `DELETE /me/filings/{id}` (single) and `DELETE /me/filings` with body `{ids:[...]}` (multi-delete) → verify: single delete removes one + 404s on re-get; multi-delete removes the listed ids; a foreign id is a no-op/404, never deletes another owner's record.
- [x] Add `FilingRepository` to `api/persistence.py` — `create(owner, rec)` / `list(owner)` / `get(owner, id)` / `delete(owner, ids)`: Neon when `DATABASE_URL` set (the `filings` table exists, `migrations/neon_schema.sql:26-32`; **additively** add `id text`/`user_id text`/`label text` columns OR a new `filing_records` table so the existing schema isn't broken), pooled psycopg; **fallback-first** in-memory dict keyed by owner; any DB error → in-memory → verify: with DB set, records persist + survive a fresh repo; with it unset, create/list/get/delete round-trip in-memory without raising.
- [x] **Migration (additive only):** add the `id`/`user_id`/`label` columns (or `filing_records`) to `migrations/neon_schema.sql`; do NOT destructively alter the existing `filings` columns → verify: additive; existing tables intact.
- [x] **`[TD]` tests** (`tests/api/test_me_filings_endpoint.py`): 401 without token; create→list→get round-trip (in-memory); per-`sub` isolation; single + multi delete; 404 on foreign id; 422 on bad body → verify: `uv run pytest -q` green at **≥118**.

**Acceptance criteria:** `/me/filings` create/list/get/delete (+ multi-delete) derive the owner from the JWT `sub`, persist per-owner (Neon when configured, in-memory fallback otherwise), 401 without a token, per-owner isolated, additive to the schema, with tests; suite green.

**Wave-0 exit:** EP-0/EP-1/EP-2 green (`pytest ≥118`, new tests added); guest sessions + per-owner entity + filing CRUD all work on the shared-guest and registered `sub`; the BE is shippable and unblocks every per-user FE wire.

---

## Wave 1 — Quick UI Refinements + Tooltip primitive + wizard sequence + light default

### UI-1 `[FE]` — Reusable floating Tooltip + InfoTip (`ⓘ`) primitive _(Wave 1; gating for all tooltip work; GQ-E locked)_

**Purpose / issue:** Custom floating tooltips (NOT browser-native `title`) on calendar cells + an info-`ⓘ` at the right of EVERY card heading. Today the calendar uses native `title=` (`ObligationRadar.tsx:170`).

- [x] Add `frontend/src/components/Tooltip.tsx` exporting `Tooltip` (wraps any trigger; shows a floating bubble on **hover AND keyboard focus**) and `InfoTip` (a small `ⓘ` `<button>` trigger with a tooltip), token-CSS only (reuse `--window`/`--ink-soft`/`--border`/`--shadow`/`--radius`; no new large CSS file) → verify: a `Tooltip`/`InfoTip` renders, opens on hover and on focus, closes on blur/mouse-leave/Escape; positioned so it does not clip at viewport edges.
- [x] **A11y:** the trigger is a real focusable element (`<button type="button">` for `InfoTip`); the bubble is linked via `aria-describedby` (or the trigger carries `aria-label`); Escape dismisses; no reliance on `title=` → verify: tab to the trigger shows the tip; screen-reader name present; `biome` a11y rules pass.
- [x] **No layout shift / overlay:** the bubble is absolutely/fixed-positioned with a high z-index under modals (below the z-300 walkthrough, above content) → verify: opening a tip does not reflow the card; it overlays neighbours.

**Acceptance criteria:** a single reusable `Tooltip` + `InfoTip` (hover + focus, ESC, edge-aware, a11y-correct, token-CSS) exists and is the basis for every tooltip in this rework; build/type/lint clean.

### OB-1 `[FE]` — Obligation Calendar (`/obligations`) refinements _(Wave 1; uses UI-1)_

**Purpose / issue:** One-line page description; custom floating tooltips on calendar cells; an info-`ⓘ` on every card heading; move the "form codes explained" content into the Filing-Obligations card-heading tooltip; move the "N obligations · M overdue · next due… demo clock" summary into a tooltip (off the body); move "Entity Snapshot" OFF this page (it becomes `/entity`, Wave 2); remove the "What Next" card.

- [x] One-line page description under the heading (token-CSS; reflects the active entity; no fabricated figure) → verify: renders under `<h1>`; entity-aware.
- [x] Replace the calendar cells' native `title=` (`ObligationRadar.tsx:170`) with the UI-1 `Tooltip` on each date/badge cell (form · due date · type) → verify: hover/focus shows the custom bubble; no `title=` remains on calendar cells.
- [x] Add an `InfoTip` (`ⓘ`) at the **right of every card heading** on the page → verify: each card titlebar shows a focusable `ⓘ` with a relevant explanation.
- [x] Move the **"Form codes explained"** glossary (`ObligationRadar.tsx:408-451`) INTO the Filing-Obligations card-heading `InfoTip`; remove the inline `<details>` → verify: the glossary now lives in the heading tip; `git diff` shows the content moved, not duplicated.
- [x] Move the **`ObligationSummary`** block ("N obligations · M overdue · next due {date}" + the demo-clock note, `ObligationRadar.tsx:34-73, 307`) OFF the body into a heading `InfoTip` → verify: the summary is reachable via a tip, not in the page flow; counts still derive from real `/obligations` data.
- [x] **Move "Entity Snapshot" OFF this page:** remove the left-column Entity-Snapshot card (`ObligationRadar.tsx:312-391`); the obligations list fills the freed space → verify: no Entity-Snapshot on `/obligations`; the page renders with calendar + obligations; the content lives on `/entity` (EN-1).
- [x] Remove the **"What Next"** card (`<WhatNext>` at `ObligationRadar.tsx:565-569`); drop the orphaned import → verify: no WhatNext footer; no orphaned import.

**Acceptance criteria:** `/obligations` shows a one-line description, custom tooltips on calendar cells, a heading `ⓘ` on every card (carrying the form-codes glossary + the moved summary), no Entity-Snapshot, no "What Next"; figures stay sourced from `/obligations`; build/type/lint clean.

### GR-1 `[FE]` — Dashboard: hide "Journey" card once the walkthrough is complete _(Wave 1)_

- [x] Gate `<JourneyStrip>` on `!readJourneyDone()` (helper exists, `Dashboard.tsx:470-476`) → verify: with `cp_journey_done` set the strip is absent; clearing it brings it back.

**Acceptance criteria:** the Dashboard journey strip hides once the walkthrough is complete; build/type/lint clean.

### GR-2 `[FE]` — Remove the topbar entity selector (entity set only in Settings/Workspace) _(Wave 1)_

- [x] Remove the topbar entity `<select>` (`AppShell.tsx:318-344`); keep `useActivePersona()` for the profile-popover label only → verify: no topbar selector; switching entity still works from Settings → Workspace; the active persona drives all consoles.
- [x] **Non-regression:** the AppShell persona-switch side-effects (deadline re-seed + "Entity Switched" toast, `AppShell.tsx:190-214`) still fire when the entity changes from Settings → verify: changing the default entity re-seeds deadlines + toasts as before.

**Acceptance criteria:** the topbar selector is gone; entity selection lives only in Settings/Workspace; switch side-effects intact; build/type/lint clean.

### GR-3 `[FE]` — Remove the drawer 'X' close button _(Wave 1)_

- [x] Remove the `drawer-close` button (`AppShell.tsx:473-475`); the drawer still closes via backdrop-click + Escape (`AppShell.tsx:217-224, 455-461`) → verify: no 'X'; backdrop + Escape still close.

**Acceptance criteria:** the drawer 'X' is gone; backdrop + Escape intact; build/type/lint clean.

### GR-4 `[FE]` — Walkthrough `?` button: pin true bottom-right, scope to Workspace + Compliance _(Wave 1)_

- [x] Reposition the `?` to true bottom-right (small fixed `bottom`/`right` offsets) at all breakpoints, clear of the fixed footer → verify: at mobile + desktop the button sits bottom-right and does not overlap footer/content.
- [x] Scope visibility via `useLocation()` to the Workspace+Compliance routes (`/dashboard`, `/analytics`, `/obligations`, `/filing` (+ `/filing/*`), `/audit-defense`, `/entity`) → verify: the `?` shows on those only; hidden on `/settings`, `/faq`, `/about`, marketing, auth.

**Acceptance criteria:** the `?` is pinned true bottom-right at all sizes and appears only on Workspace+Compliance pages; the walkthrough modal still opens; build/type/lint clean.

### GR-5 `[FE]` — Dashboard: remove demo-clock text + Entity-Snapshot card; expand "What You Can Do"; align card bottoms _(Wave 1)_

- [x] Remove the `StatusSummary` demo-clock line from the head (`Dashboard.tsx:518` / `StatusSummary` 428-468) → verify: no "N obligations · …demo clock" text in the head.
- [x] Remove the **Entity-Snapshot** panel (`SnapshotPanel`, `Dashboard.tsx:319-424, 528`) → verify: no Entity-Snapshot on `/dashboard` (it lives on `/entity`).
- [x] Expand the **"What You Can Do"** cards (`QuickAccess`, `Dashboard.tsx:165-185`) to fill the freed space (re-flow the grid) → verify: the cards fill the row; balanced at desktop + mobile.
- [x] Align the bottom edge of the "Audit Defense" card with the bottom of "Upcoming Deadlines" (equal-height row / flex stretch) → verify: at desktop width the two bottoms line up.

**Acceptance criteria:** the Dashboard drops the demo-clock text + Entity-Snapshot, expands QuickAccess, and aligns the Audit-Defense / Upcoming-Deadlines bottoms; counts still derive from real `/obligations`; build/type/lint clean.

### GR-6 `[FE]` — Settings: remove "About" section; match the two reset-button colours _(Wave 1)_

- [x] Remove the "About" `<section>` (`Settings.tsx:106-124`) → verify: no About card; Appearance / Workspace / Reset still render.
- [x] Make "Reset all preferences" use the same colour/class as "Reset all data" (apply `settings-reset-btn--full` to both, or unify) → verify: both reset buttons render the same colour.

**Acceptance criteria:** Settings has no About section and both reset buttons share one colour; reset behaviours otherwise unchanged (but see GR-9 for the new "Reset all data" scope); build/type/lint clean.

### GR-7 `[FE]` — Remove the "What Next" card from Filing + Audit Defense _(Wave 1)_

- [x] Remove `<WhatNext>` from `FilingStudio.tsx` (`:1132`) and `AuditDefense.tsx` (`:845`); drop the unused `WhatNext` import in each → verify: no WhatNext footer on `/filing` or `/audit-defense`; no orphaned import; build/type/lint clean. _(Filing & Audit are heavily reworked in W3/W4; this is the minimal W1 removal so each later diff stays focused — FM-*/AD-* must not re-add it.)_

**Acceptance criteria:** neither Filing nor Audit Defense shows a "What Next" card; build/type/lint clean.

### GR-8 `[FE]` — Light theme as the default (not system preference) _(Wave 1)_

- [x] Change the unstored default in `useTheme` from `systemTheme()` to `'light'` (`useTheme.ts:17-18`); keep the stored-preference read + the toggle + persistence; keep the media-query listener gated by `hasStoredTheme` → verify: with no `cukaipandai-theme` stored the app loads light regardless of OS; toggling to dark persists; reload respects the stored choice; no flash of dark; lint clean (no unused symbols).

**Acceptance criteria:** light is the default theme for a fresh user; stored preference + toggle still work; build/type/lint clean.

### GR-9 `[FE]` — Onboarding sequence end-to-end + "Reset all data" must NOT wipe Neon _(Wave 1; Decisions #4 + #2)_

**Purpose / issue:** The tour sequence is `/welcome` → `/start/obligations` → `/start/filing/new` → `/start/audit-defense` → `/dashboard` (dashboard only at the very end; the filing step is the NEW `/filing/new`). And per Decision #2, "Reset all data" must clear ONLY local UI prefs + replay onboarding — it must NOT wipe the shared guest's Neon data (destructive on a shared account).

- [x] Update `WizardLayout` `WIZARD_STEPS` (`WizardLayout.tsx:21-25`) so step 2 routes to `/start/filing/new` (the new creation route, FM-2) instead of `/start/filing`; keep the Step-X-of-3 chrome + next/back + skip; Finish/Skip still set `cp_journey_done` + go to `/dashboard` → verify: the tour runs welcome → obligations → filing/new → audit-defense → dashboard; the dashboard is reached only at Finish. _(NOTE: step 2 still points to `/start/filing` for now; `TODO(Wave 3)` comment added per plan; FM-2 repoints it.)_
- [x] Update the `/start` route children in `App.tsx` (`App.tsx:59-63`) so the wizard's filing step mounts the `/filing/new` creation flow (FM-2) under the wizard chrome (e.g. `path="filing/new"`), not the old single FilingStudio → verify: `/start/filing/new` renders the creation flow inside the wizard; standalone `/filing/new` (FM-2) also works. _(NOTE: deferred to Wave 3 per plan — FM-2 creates the route; `TODO` comment in WizardLayout.)_
- [x] Update Welcome's "Try sample data" CTA (`Welcome.tsx:34-38`) + any "restart onboarding" entry (the walkthrough modal "Yes, Show Me", `AppShell.tsx:23-31`) to land on `/welcome` → first step `/start/obligations` (sequence start) → verify: both entries begin the tour at the welcome/obligations step.
- [x] **"Reset all data" rescope (`Settings.tsx:31-41`, `handleResetAllData`):** clear ONLY local UI prefs — `cukaipandai-theme` + `cp_journey_done` (and any other pure-UI key) — to replay onboarding; **do NOT** call any DELETE on `/me/*` and **do NOT** clear backend data; navigate to `/welcome`. Add a one-line note in the button copy that it resets onboarding + preferences (not your saved company/filings, which are shared on the guest account) → verify: clicking it clears theme + `cp_journey_done`, lands on `/welcome`, and leaves `/me/entity` + `/me/filings` data intact (a re-fetch still returns them).
- [x] **Remove dead localStorage data keys from reset/anywhere:** since `cp_custom_entities` + `cp_active_persona` move to the backend (EN-2), ensure the reset + Settings no longer reference them as data (only theme + `cp_journey_done` remain local) → verify: no localStorage data key beyond theme + `cp_journey_done` is read/written for business data.

**Acceptance criteria:** the guided tour follows `/welcome → /start/obligations → /start/filing/new → /start/audit-defense → /dashboard`; "Reset all data" clears only local UI prefs + replays onboarding and never deletes Neon data; no business data persists to localStorage; build/type/lint clean.

**Wave-1 exit:** UI-1, OB-1, GR-1…GR-9 green (`tsc`/`build`/`biome`); the quick refinements, the Tooltip primitive, the corrected tour sequence, the light default, and the non-destructive reset are all in; the app is shippable.

---

## Wave 2 — `/entity` page + persona-on-backend + guest token wiring

### AUTH-FE `[FE]` — `continueAsGuest` → `POST /auth/guest` (store token like login) _(Wave 2; wires EP-0; gates per-user FE persistence)_

**Purpose / issue:** Decision #1: guest must become a real backend session. Today `continueAsGuest` only sets `cp_entered_as_guest` (`AuthContext.tsx:97-104`) — no token. Make it call `POST /auth/guest` and persist the returned token exactly like login so every request carries the shared guest JWT.

- [ ] Add `authGuest()` to `client.ts` (mock branch: return a `mockAuth('guest@cukaipandai.local','guest','Guest')` so mock mode still works; live: `post('/auth/guest', {})`) → verify: typed method exists; mock returns a token+user; live calls `/auth/guest`.
- [ ] Rewire `AuthContext.continueAsGuest()` to be async: call `authGuest()`, then `persist({token,user})` (the existing login persist path, `AuthContext.tsx:78-88`) so the guest token lands in `cp_token` and `authHeaders()` attaches it; keep an `isGuest` UI flag (set it true alongside the token) → verify: clicking "Continue as Guest" stores a real token; subsequent `/me/*` requests carry the bearer; `isGuest` is true; `getToken()` returns the guest JWT.
- [ ] **Hydration:** on mount, the existing `authMe()` path (`AuthContext.tsx:45-75`) now also validates a guest token (the guest is a real user) → verify: a reload with a stored guest token resolves the guest via `/auth/me` (live) or the stored session (mock), without redirect flicker.
- [ ] **Sign-out:** signing out clears the guest token like any session (`AuthContext.tsx:105-115`) → verify: sign-out drops the token; re-entering as guest mints a fresh shared-guest token.
- [ ] **Non-regression:** registered email/password + Google flows are unchanged; the only change is that guest now also gets a token → verify: login/signup/google still work; the AppShell profile popover shows "Guest" for the guest session.

**Acceptance criteria:** `continueAsGuest` mints + stores a shared-guest JWT via `POST /auth/guest`; every request carries a token (guest or registered); hydration + sign-out handle the guest token; registered flows unchanged; mock-first; build/type/lint clean.

### EN-1 `[FE]` — `/entity` page: view + edit the active company (Compliance nav) _(Wave 2; reuses CustomCompany fields)_

**Purpose / issue:** A NEW `/entity` page under **Compliance** to view + edit the active company. The Entity-Snapshot content removed from `/obligations` (OB-1) and `/dashboard` (GR-5) moves here, plus inline editing of all `EntityTaxProfile` fields. Edits write to the user's profile only (never seed fixtures) and persist per Decision #2 (EN-2).

- [ ] Add `frontend/src/pages/Entity.tsx` + a `/entity` route under the AppShell (`App.tsx`); add "Entity" to the **Compliance** drawer group (`AppShell.tsx:489-500`, after Audit Defense) → verify: `/entity` routes and renders; the nav shows Workspace→(Dashboard, Analytics), Compliance→(Obligations, Filing, Audit Defense, **Entity**), Essentials→(Settings, FAQ, About).
- [ ] One-line page description + a **view** of the active entity (reuse the Entity-Snapshot layout removed from Obligations/Dashboard: gross-income hero + field rows) driven by `useEntity()` → verify: shows the active entity's fields; a heading `ⓘ` (UI-1) explains the snapshot.
- [ ] An **edit** affordance capturing all `EntityTaxProfile` fields (reuse the `CustomCompany` field set + validation, `CustomCompany.tsx:13-139`) pre-filled from the active entity → verify: the form pre-fills; validation blocks bad input with inline messages.
- [ ] **Non-regression:** the page never mutates a seed fixture — edits flow through the persona model (EN-2); `personas.ts` `PERSONAS` stay pristine → verify: editing then "Reset all data" (GR-9 clears only local UI, but the backend "Custom" entity is separate from the seeds) leaves the built-in three pristine in `personas.ts`.

**Acceptance criteria:** `/entity` (under Compliance) views + edits the active company's full profile, reusing the snapshot layout + `CustomCompany` fields, with a heading `ⓘ`; seeds stay pristine; build/type/lint clean. _(Persistence is EN-2.)_

### EN-2 `[FE]` — Persona model backed by `GET/PUT /me/entity` ("Custom" on edit; localStorage data store removed) _(Wave 2; wires EP-1)_

**Purpose / issue:** Decision #2: the "Custom" entity moves from localStorage (`cp_custom_entities`) to the backend per-user profile. Editing any default entity in `/entity`, OR using own details from `/welcome` (the `CustomCompany` flow), switches the active persona to a **"Custom"** clone backed by `GET/PUT /me/entity`; seeds stay pristine; localStorage keeps only theme + `cp_journey_done`.

- [ ] Add `getMyEntity()` / `putMyEntity(ssm)` to `client.ts` (mock branch: an in-memory/module-scoped mock store keyed to the current mock user so the flow works in `VITE_API_MOCK=1`; live: `get('/me/entity')` / `post`-or-`put('/me/entity',{ssm})`) → verify: typed methods exist; mock round-trips; live calls `/me/entity` with the bearer.
- [ ] Refactor `PersonaContext` (`PersonaContext.tsx`) so the "Custom" persona is sourced from the backend, NOT `cp_custom_entities`: on mount (after auth is ready), best-effort `getMyEntity()` → if present, build + expose the "Custom" persona in the merged list and honour it as active; **remove the `cp_custom_entities` localStorage read/write** and the `cp_active_persona` data store (active selection for a registered/guest user follows the saved backend "Custom" entity; the built-in three remain selectable) → verify: a saved custom entity hydrates from the backend across reload/device; no `cp_custom_entities` key is written; the built-in three still switch.
- [ ] On save in `/entity` (EN-1) or submit in `CustomCompany`: build a **"Custom"** `Persona` clone from the edited fields and call `putMyEntity(ssm)` (best-effort, fallback-first per Q9 — never block the UI on a transient BE error), then set it active in context → verify: editing Acme's fields creates/activates a "Custom" persona via `PUT /me/entity`; `personas.ts` `PERSONAS` unchanged; the seed Acme remains selectable; with the BE up the entity persists; mock mode works with no backend.
- [ ] Update `CustomCompany.tsx` (`:195-205`) to call `putMyEntity` instead of `addCustomPersona`+`createEntity`(localStorage) → verify: the welcome "use my own company" flow persists to the backend and activates the entity; navigates into the tour at `/start/obligations`.
- [ ] **422 surfacing:** a live 422 from `PUT /me/entity` shows field detail (`.validationDetail`, `client.ts:480-482`) but keeps the entity editable → verify: a bad live save shows field errors.

**Acceptance criteria:** the "Custom" entity is backend-backed (`GET/PUT /me/entity`), hydrates across reload/device, switches the active persona on edit, never mutates seed fixtures, and removes the `cp_custom_entities`/`cp_active_persona` localStorage data store (only theme + `cp_journey_done` remain local); mock-first; build/type/lint clean.

**Wave-2 exit:** AUTH-FE, EN-1, EN-2 green (`tsc`/`build`/`biome`); guest sessions carry a token, `/entity` views+edits, and the "Custom" entity persists to Neon per `sub`; seeds pristine; the app is shippable.

---

## Wave 3 — Filing management dashboard + records on backend

### FM-1 `[FE]` — `/filing` records dashboard (list + single/multi-select + delete) _(Wave 3; wires EP-2)_

**Purpose / issue:** `/filing` becomes a **records dashboard** — a list of the user's saved filings with single + multi-select and delete; an empty state with a CTA to `/filing/new`. One-line description; a heading `ⓘ`; no "What Next".

- [ ] Refactor `frontend/src/pages/FilingStudio.tsx` into a route set: the creation engine → `/filing/new` (FM-2), the saved-record view → `/filing/[id]` (FM-3), and **`/filing`** → a new records-dashboard component (extract shared types/helpers; **reuse, don't fork** `ComputationPanel`/`TechnicalDetails` into `/filing/[id]`) → verify: `/filing`, `/filing/new`, `/filing/[id]` all route; `git diff` shows the computation-render code reused, not duplicated.
- [ ] `/filing` lists the user's saved records (newest first) with key fields (label, tax payable, created date, risk-flag count); a "New Filing" CTA → `/filing/new`; an empty state when none → verify: records list; empty state + CTA when none.
- [ ] Single-select (row → `/filing/[id]`) + multi-select (checkboxes) + a **Delete selected** action → verify: a row opens its record; select + Delete removes them; the list updates.
- [ ] Add `listFilings()` / `deleteFilings(ids)` to `client.ts` (mock branch: read/delete from a module-scoped mock store so the dashboard works in `VITE_API_MOCK=1`; live: `/me/filings`) → verify: mock lists/deletes from local state; live round-trips `/me/filings`.
- [ ] One-line description + a heading `ⓘ` (UI-1); **no** `WhatNext` card → verify: description + `ⓘ` present; no WhatNext.

**Acceptance criteria:** `/filing` is a records dashboard (list + single/multi-select + delete, empty state, CTA), backed by `/me/filings` (mock-first), with a description + heading `ⓘ` and no WhatNext; build/type/lint clean.

### FM-2 `[FE]` — `/filing/new` creation: one-shot pipeline (drop Human-Approval) + guided input + "how this was calculated" _(Wave 3; GQ-A locked)_

**Purpose / issue:** After "Classify", show the **"Filing Pipeline" only**, running Classify → Compute → **Risk Assessment** (DROP "Human Approval"; use the one-shot `/form-c` path). **Guided input** (their trial balance, with format guidance). **"How this was calculated" clarity** — computed by the deterministic rule-based core, NOT the AI, with the per-figure trace accessible.

- [ ] Drive `/filing/new` off the **one-shot** path (`getFormC`, `client.ts:564-567`) — remove the HITL `start`/`resume` + the "Human Approval" stage from the FE flow; `deriveStages` base drops `approval` → pipeline is **Classify → Compute → Risk Assessment → (Finalized)** (`FilingStudio.tsx:100-107`) → verify: classifying then computing runs one-shot; no "Human Approval" stage; `tax_payable` still resolves (golden RM31,000 for Acme); the `/start`+`/resume` client methods remain but are unused here (GQ-D).
- [ ] **Guided input (GQ-A):** replace the "drop a CSV/XLSX/PDF or paste any text" framing (`FilingStudio.tsx:834-958`) with a guided panel — a labelled instruction ("Provide your trial balance — one account per line"), a one-line format example, the persona's `demoRawText` pre-filled in the textarea (paste = the always-works fallback), the CSV/XLSX/PDF file-drop kept clearly-secondary (BE-J2) → verify: the input reads as "provide your trial balance" with format guidance; paste works; file-drop still works.
- [ ] **"How this was calculated" clarity:** an explicit, visible statement that **the tax figure is computed by the deterministic rule-based core, not the AI** (the AI only classifies line items), and the per-figure deterministic trace (rule + config version + source) in an accessible, clearly-signposted disclosure (not over-hidden) → verify: a first-time user can see the number is rule-computed + can open the per-figure trace (`rule_id`/`config_version`/inputs); no fabricated figure.
- [ ] On finalize, persist the record (FM-3) and navigate to `/filing/[id]` → verify: completing a filing lands on its `/filing/[id]` view and the record appears in the dashboard.
- [ ] **Non-regression:** the classified-line-items panel, the sovereign badge, the 96px hero, the risk-flag list still render; no WhatNext → verify: those work on `/filing/new`.

**Acceptance criteria:** `/filing/new` runs the one-shot Classify→Compute→Risk pipeline (no Human-Approval), uses a guided trial-balance input with paste fallback, makes the deterministic-core provenance explicit + the per-figure trace discoverable, and routes to `/filing/[id]` on finalize; build/type/lint clean.

### FM-3 `[FE]` — `/filing/[id]` saved-record results + save-on-finalize → `/me/filings` _(Wave 3; wires EP-2; GQ-B defer)_

**Purpose / issue:** `/filing/[id]` shows a saved record — a **headline tax-payable card on top**, then the "Filing Pipeline" card at the bottom (through "Finalized") with a small dropdown to expand/collapse the technical details. Records persist (Decision #2) so the user can view them back; **comparison is deferred (GQ-B)**.

- [ ] `/filing/[id]` loads the record (`getFiling(id)` from EP-2; mock-first) and renders: a **headline tax-payable card on top** (reuse the 96px hero / `ComputationPanel`, `FilingStudio.tsx:396-525`), then the **"Filing Pipeline" card at the bottom** through "Finalized" with a small dropdown to expand/collapse the technical details (reuse `TechnicalDetails`, `FilingStudio.tsx:528-637`) → verify: a saved record shows the headline first + the pipeline/technical details collapsed at the bottom; the per-figure trace is reachable.
- [ ] **Save on finalize:** when `/filing/new` finalizes, persist the record (`saveFiling(rec)` → `POST /me/filings`; mock-first) and route to its `/filing/[id]` → verify: a finalized filing appears in the `/filing` list and is openable at `/filing/[id]`; live saves round-trip `/me/filings`; mock works with no backend.
- [ ] Add `saveFiling(rec)` / `getFiling(id)` to `client.ts` (mock branch = the module-scoped mock store from FM-1) → verify: typed methods exist; mock returns from local state; live uses `/me/filings`.
- [ ] **Compare = DEFERRED (GQ-B):** deliver view-back + the records list (FM-1) only; no side-by-side comparison view in this rework → verify: view-back works for all records; no comparison UI is added.

**Acceptance criteria:** `/filing/[id]` renders a saved record (headline on top, pipeline + collapsible technical details at the bottom); finalizing persists to `/me/filings` and routes to the record; records are revisitable; comparison deferred; build/type/lint clean.

**Wave-3 exit:** FM-1/FM-2/FM-3 green (`tsc`/`build`/`biome`); a user can create a filing (one-shot, guided, provenance-clear), see it saved to `/me/filings`, list/select/delete records, and open a saved record; the app is shippable. **These records are the prerequisite for Wave 4.**

---

## Wave 4 — Audit Defense conversational "Audit Assistant"

### AD-1 `[FE]` — Filing-record picker → "Defend this filing" _(Wave 4; depends on Wave 3 records)_

**Purpose / issue:** Decision #3: Audit Defense is a conversational assistant **tied to a selected filing record**. Entry: pick a saved filing → "Defend this filing".

- [ ] At `/audit-defense`, when no filing is selected, show a **picker** of the user's saved filing records (reuse the FM-1 source: `/me/filings`; mock-first), each with a "Defend this filing" action; an empty state linking to `/filing/new` when none → verify: the picker lists the user's records; selecting one enters the assistant; with none, the empty state + link show.
- [ ] One-line description + a heading `ⓘ` (UI-1); preserve the **fabrication trust headline** ("Why This Is Trustworthy", `AuditDefense.tsx:369-396`) → verify: description + `ⓘ` present; the trust framing remains; no WhatNext.
- [ ] **Non-regression:** `SovereignBadge`, `CitationPanel`, `VerifiedBadge`, and the 502 handler stay available → verify: those primitives render in the reworked page.

**Acceptance criteria:** `/audit-defense` starts with a saved-filing picker ("Defend this filing"), with a description + heading `ⓘ`, the trust headline preserved, and no WhatNext; build/type/lint clean.

### AD-2 `[FE]` — Chat assistant: seeded questions from the filing's figures + citation-grounded answers _(Wave 4; reuses /audit-defense per message; NO BE change)_

**Purpose / issue:** Once a filing is selected, a **chat interface** lets the user ask how to justify any figure; **suggested questions are pre-seeded from THAT filing's actual figures**; each answer is citation-grounded (one `/audit-defense` request per message, the filing's figures threaded as `evidence`); the deterministic fabricated-citation rejection stays the trust signal. **Backend `/audit-defense` already accepts free-text `query` + `evidence` (W4) — zero BE change; chat/turn state is FE-only.**

- [ ] Build a chat UI (message list + input) scoped to the selected record: each user message → one `getAuditDefense(tin, query, evidence, injectFabricated)` call (`client.ts:592-604`), where `evidence` carries the selected filing's relevant figures (e.g. `["chargeable_income","RM200,000"]`, `["tax_payable","RM31,000"]` derived from the record's `computation.fields`) → verify: asking a question returns a citation-grounded pack rendered as an assistant turn; the conversation accumulates; figures trace to the selected record (no fabricated numbers).
- [ ] **Seeded suggested questions** derived from the filing's figures (e.g. "How do you justify the RM4,800 repairs deduction?", "Is the RM120,000 depreciation deductible?", "Why is chargeable income RM200,000?") as tappable chips that pre-fill/send → verify: the suggestions reference real figures from the selected record; tapping one sends it; switching the selected filing re-seeds them.
- [ ] **Fabrication trust signal preserved:** keep a labelled "Trust Demo" affordance that sends `inject_fabricated=true` (BE-18) and surfaces the deterministic `verified=false` rejection as an assistant turn + the existing `notify()` (`AuditDefense.tsx:331-340`) → verify: the trust-demo turn shows the rejected fabricated clause stamped REJECTED alongside the genuine VERIFIED citation; the live money-shot is unchanged in mock + live.
- [ ] Render each assistant turn with `CitationPanel` + `VerifiedBadge` + the two-tier trace (reuse `AuditDefense.tsx:623-843`) and the `SovereignBadge`; a 502 on a turn shows a clear error without breaking the conversation → verify: citations, badges, trace, and badge render per turn; a 502 surfaces gracefully.
- [ ] **Non-regression:** record switch resets the conversation cleanly; the deterministic gate stays authoritative → verify: switching the selected filing clears the chat; the gate still rejects fabrication.

**Acceptance criteria:** the Audit Assistant is a multi-turn chat tied to a selected filing record, with suggested questions seeded from that filing's figures, citation-grounded answers (one `/audit-defense` call per message, figures as evidence), the fabricated-citation rejection preserved as the trust signal, and clean reset on record switch; **no backend change**; build/type/lint clean.

**Wave-4 exit:** AD-1/AD-2 green (`tsc`/`build`/`biome`); the conversational Audit Assistant works end-to-end (mock + live) tied to Wave-3 records; the BE-18 money-shot is intact; the app is shippable.

---

## TD throughout (folds into the waves)

### TD-W0 `[TD]` — Wave-0 endpoint + guest-auth tests _(Wave 0; fold into EP-0/EP-1/EP-2)_

- [ ] EP-0 (`/auth/guest` + idempotent seed + stable guest `sub`), EP-1 (`/me/entity` round-trip + per-`sub` isolation + 401/422/404), EP-2 (`/me/filings` CRUD + per-`sub` isolation + 401/404/422 + multi-delete) tests as specified → verify: `uv run pytest -q` green at **≥118**; existing 118 unchanged.

### TD-W2 `[TD]` — Mock fidelity for the new flows _(throughout)_

- [ ] Keep mock fixtures in sync: a mock `authGuest`, a module-scoped mock `getMyEntity/putMyEntity` (EN-2), a module-scoped mock filing-records store (FM-1/FM-3), the Audit-Assistant per-message mock (AD-2 reuses `makeMockDefense`) → verify: a full mock run (welcome → wizard [obligations → filing/new → audit-defense] → dashboard; /entity edit; /filing list + /filing/[id]; /audit-defense chat incl. the trust-demo turn) works with no backend.

**Acceptance criteria:** every new flow works fully in mock mode; no fabricated fixture data (line items stay the user's own categories/amounts; tax figures stay core-computed).

### TD-W3 `[TD]` — Docs + demo-script update _(after the FE waves)_

- [ ] Note the new endpoints in `trd.md` §7a (`POST /auth/guest`; `GET/PUT /me/entity`; `POST/GET/DELETE /me/filings`) + the JWT-`sub` keying + fallback-first + the new `/entity` and `/filing/[id]` routes; **state honestly that the guest account is shared/public and all guest data persists to Neon SG** (same residency caveat; do NOT overclaim) → verify: §7a lists the endpoints; the shared-guest + residency caveats are honest.
- [ ] Update the demo script (TD-3/TD-4) to reflect the corrected tour (welcome → obligations → filing/new → audit-defense → dashboard) + the reworked pages (Obligations tooltips · Filing records dashboard + one-shot creation + the "computed by the deterministic core" trust beat · the conversational Audit Assistant tied to a saved filing) → verify: the script maps to the live journey; the fabrication mechanism (BE-18) is stated.

**Acceptance criteria:** the trd + demo script reflect the new pages, routes, per-user + guest endpoints, and the shared-guest caveat; no fabricated figures.

---
