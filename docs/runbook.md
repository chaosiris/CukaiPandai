# CukaiPandai — Runbook (run · deploy · demo · final day)

## 1. Run locally (no Docker)
```bash
python -m venv .venv && . .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -e .
pytest -q                                         # expect: 40 passed
uvicorn api.main:app --reload                     # http://localhost:8000  (Swagger: /docs)
```
- **Health:** `GET /health` → `{"status":"ok"}`.
- **Endpoints:** `POST /entities/{tin}/obligations` · `POST /entities/{tin}/filings/form-c` · `POST /entities/{tin}/audit-defense`.

## 2. Run with Docker
```bash
docker compose up --build       # API on http://localhost:8000
```
> ⚠ The Dockerfile is authored but **not yet built in CI** — build once on a Docker-capable machine and confirm `/health` before relying on it for the demo.

## 2b. Frontend (Next.js consoles)
```bash
cd frontend
npm install
npm test            # 28 component/api tests
npm run dev         # http://localhost:3000  (landing · /entities /obligations /filing /audit-defense /corpus · /faq /settings /pricing)
```
- **Mock-by-default** — the UI runs end-to-end with **no backend** (seeded Acme; Form C = RM31,000).
- To hit the live API instead: set `NEXT_PUBLIC_API_MOCK=0` and `NEXT_PUBLIC_API_BASE=http://localhost:8000`.
- Sovereign badge: `NEXT_PUBLIC_SOVEREIGN=1`. Light/dark toggle is in the top bar.

## 3. Model / sovereign mode (env)
| Var | Default | Notes |
|---|---|---|
| `LLM_PROVIDER` | `anthropic` | `openai` = ILMU Claw / Gemini (OpenAI-compatible) |
| `LLM_MODEL` | `claude-opus-4-8` | e.g. ILMU model id in sovereign mode |
| `LLM_BASE_URL` | — | ILMU Claw base URL (sovereign) |
| `LLM_API_KEY` | — | provider key |
Tests use `FakeLLMClient` → **no key needed** for `pytest`. A live model is only needed for real agent runs.

## 4. Demo flow (matches the video script)
1. Onboard **Acme** (seed: `core/fixtures/entity_acme.json` + `myinvois_acme.json`).
2. **Obligations** → calendar (Form C, e-invoice, SST, employer).
3. **Form C** (trial balance `core/fixtures/trial_balance_acme.json`) → cited computation; `tax_payable = RM31,000`.
4. **Audit-defense** → paste *"Justify your RM4,800 repairs deduction"* → cited DefensePack (s.33(1)) + exposure note; show the **citation verifier rejecting a fake clause**.
- If the frontend isn't ready: drive the same flow through **`/docs`** (Swagger) — the cited JSON still tells the story.

## 5. Submission checklist (due 26 Jun 2026, 11:59 PM — NexHack Rule 6)
- [ ] **Pitch deck in README** — ✅ `README.md` (rubric-aligned).
- [ ] **7-min YouTube demo video** — script in [`demo-video-script.md`](demo-video-script.md); record, time to **≤7:00** (−2 marks/30s over), upload unlisted, add link to README + form.
- [ ] **GitHub repo** — ✅ exists. **Make it PUBLIC before submitting** (Settings → General → Danger Zone → Change visibility; or `gh repo edit chaosiris/CukaiPandai --visibility public`). *(Cannot be done with plain `git` — repo-owner action.)*
- [ ] **Deployment link (optional)** — localhost acceptable: `uvicorn api.main:app` or `docker compose up`.
- [ ] **⚠ Final figure reconcile** vs LHDN (see figures-verification doc) before recording.

## 6. Physical final checklist (if top-10; announced 4 Jul → final 10 Jul, Xenber)
- [ ] Working prototype runs **offline / on localhost** (don't depend on conference Wi-Fi or live gov APIs — use seeded fixtures).
- [ ] Deterministic demo rehearsed end-to-end (obligations → cited filing → audit-defense) < the slot.
- [ ] Laptop + charger + HDMI/USB-C adapter; backup of the repo + a recorded demo as fallback.
- [ ] Pitch deck (the README, or a slide export) + a 1-page leave-behind.
- [ ] Be ready for **technical + business** Q&A: deterministic-core guarantee, citation verifier, ILMU sovereignty, obligation-derivation, pricing, adoption roadmap, and what's mocked vs live.
- [ ] Know the verified figures + the ⚠ open items (don't overclaim live integrations).

## 7. Known limitations to state honestly (don't overclaim)
- SSM/MySST are **mocked** in the MVP (licensed/no public API); MyInvois uses **fixtures** unless sandbox creds are wired.
- Frontend is **in progress** (Plan 3); the engine + agentic API are built & tested.
- Tax figures are **YA2026, verified June 2026** — reconcile before production.
