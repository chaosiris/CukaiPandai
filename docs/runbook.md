# CukaiPandai — Runbook (run · deploy · demo)

## 1. Run the backend (FastAPI)

Run from the `backend/` directory (required — the law-corpus fixtures resolve relative to CWD).

```bash
cd backend
uv sync --extra dev              # creates .venv and installs all deps
uv run pytest -q                 # expect: 105 passed (offline — uses FakeLLMClient, no key)
uv run uvicorn api.main:app --reload   # http://localhost:8000  (Swagger: /docs)
```

pip still works as a fallback: `pip install -e ".[dev]"` then `pytest -q` / `uvicorn api.main:app --reload`.

- **Health:** `GET /health` → `{"status":"ok"}`
- **Endpoints:** `POST /entities/{tin}/obligations` · `POST /entities/{tin}/filings/form-c` · `POST /entities/{tin}/audit-defense`

## 2. Run the frontend (Vite + React — ProofRank devkit stack)

> Lives in `frontend/` (Vite 5 + React 18 + TypeScript + React Router 7, Bun). Three consoles: Obligation Radar · Filing Studio · Audit-Defense.

```bash
cd frontend
bun install
cp ../.env.example .env          # set VITE_API_BASE_URL=http://localhost:8000
bun run dev                      # http://localhost:5173
```

`VITE_API_MOCK=1` in `.env` lets the UI run without a backend (mock data served client-side).

## 3. Environment (`.env` — copy from `.env.example` at repo root; never commit real secrets)

**Model layer (`api/llm.py`) — ILMU-first; escalation stays sovereign by default:**

| Var                          | Sovereign (ILMU — primary)              | Sovereign escalation (same gateway) | Direct Claude (flagged opt-in) |
| ---------------------------- | --------------------------------------- | ----------------------------------- | ------------------------------ |
| `LLM_PROVIDER`               | `openai`                                | —                                   | —                              |
| `LLM_BASE_URL`               | `https://api.ilmu.ai/v1`                | —                                   | —                              |
| `LLM_MODEL`                  | `nemo-super`                            | —                                   | —                              |
| `LLM_API_KEY`                | ILMU `sk-…`                             | —                                   | —                              |
| `LLM_ESCALATION_MODEL`       | (blank = pure-ILMU, the prelim default) | larger ILMU model (in-country)      | —                              |
| `LLM_ALLOW_DIRECT_ANTHROPIC` | —                                       | —                                   | `1` (off by default)           |
| `ANTHROPIC_API_KEY`          | —                                       | —                                   | Anthropic key                  |

Prelim is **pure-ILMU (Q6)** — leave the escalation vars blank and `make_llm()` returns a bare sovereign ILMU client (no router). A **direct Claude route leaves Malaysia** (breaks data residency) — enable only deliberately and state it in the deck. `pytest` uses `FakeLLMClient` → no key needed; a live key is only required for real agent runs.

**MyInvois (LHDN e-invoicing) sandbox — optional (the demo uses fixtures):**

| Var                                                                | Value                                       |
| ------------------------------------------------------------------ | ------------------------------------------- |
| `MYINVOIS_BASE_URL`                                                | `https://preprod-api.myinvois.hasil.gov.my` |
| `MYINVOIS_TIN` · `MYINVOIS_CLIENT_ID` · `MYINVOIS_CLIENT_SECRET_1` | sandbox creds (preprod MyTax portal)        |

## 4. CI/CD

### Gated pipeline (`.github/workflows/deploy.yml`)

Every push to `main` and every PR against `main` runs the `test` job (backend + frontend). Deploys only fire on `push` to `main` once tests pass.

**Job graph:**

```
test ──────────────────────────────── deploy-frontend (push to main only)
  └─── docker-build ─── deploy-backend (push to main only)
```

| Job               | Runs on             | Trigger                       |
| ----------------- | ------------------- | ----------------------------- |
| `test`            | PR + push           | always                        |
| `docker-build`    | push (after `test`) | always                        |
| `deploy-backend`  | push to `main` only | `needs: [test, docker-build]` |
| `deploy-frontend` | push to `main` only | `needs: test`                 |

**What `test` checks:**

- Backend: `uv sync --extra dev` then `uv run pytest -q` (working-directory `backend`)
- Frontend: `bun install --frozen-lockfile`, `bunx tsc --noEmit`, `bun run build`, `bunx biome check frontend/src`

**Deploy mechanism:**

- Backend: `curl -fsS -X POST "$RENDER_DEPLOY_HOOK_URL"` (fails the job if the hook call fails)
- Frontend: `vercel pull --yes --environment=production` → `vercel build --prod` → `vercel deploy --prebuilt --prod`

**Required GitHub repository secrets (add in Settings → Secrets → Actions):**

| Secret                   | Where to get it                                                           |
| ------------------------ | ------------------------------------------------------------------------- |
| `RENDER_DEPLOY_HOOK_URL` | Render dashboard → your service → Settings → Deploy Hook → copy the URL   |
| `VERCEL_TOKEN`           | Vercel dashboard → Account Settings → Tokens → Create token               |
| `VERCEL_ORG_ID`          | `team_CwktsdBSB9TLrdwdCV3dZRbg` (the Vercel team/org ID; not sensitive)   |
| `VERCEL_PROJECT_ID`      | `prj_0KnVQwxUPBqML8k4KjgPQv1iaYTE` (the Vercel project ID; not sensitive) |

**Live URLs:**

- Frontend: `https://cukaipandai.vercel.app`
- Backend: `https://cukaipandai-api.onrender.com`

**Render native auto-deploy:** while the gated pipeline is being validated, Render's native auto-deploy may still be ON (it triggers a Render build on every push to `main` independently of the hook). Once the first green pipeline run is confirmed in the Actions tab, **turn off Render's native auto-deploy** in the Render dashboard (Settings → Auto-Deploy → Off) so the deploy hook becomes the sole trigger. Until then, two deploys will fire on each push (harmless but redundant).

**Manual CLI deploy fallback (§4a/§4b below)** remains the documented fallback if CI is unavailable.

**PRs on forks / without secrets:** on pull_request events the `deploy-backend` and `deploy-frontend` jobs are guarded by `if: github.ref == 'refs/heads/main' && github.event_name == 'push'` and are **skipped entirely** — PRs run tests only and stay green without any secrets being set.

**Graceful secret-absence (push to main before secrets are configured):** both deploy jobs skip cleanly (exit 0, green) when their secrets are unset — `deploy-backend` warns and exits 0 if `RENDER_DEPLOY_HOOK_URL` is empty; `deploy-frontend` warns and skips all Vercel steps if `VERCEL_TOKEN` is empty. This means the workflow can be merged before the 4 secrets are added to the repo; the deploy steps activate automatically once secrets are present. Until then, Render's native auto-deploy covers the backend.

**Gitleaks false positive:** a `gitleaks` scan over full history is clean. The single `generic-api-key` hit at `docs/plan.md:292` is a verified false positive — it is prose referring to "psycopg/SQLAlchemy over the Postgres connection string", not a credential.

**GitHub Environments:** the `deploy-frontend` and `deploy-backend` jobs target GitHub Environments (`production` → Vercel, `backend` → Render), so the repo's Deployments panel and Settings → Environments section populate automatically on each push-to-main deploy run.

---

## 5. Deployment

### 5a. Render (backend — Docker, free tier)

**One-time setup in the Render dashboard:**

1. New Web Service → connect the GitHub repo → root directory `backend/`, Docker runtime.
2. Build context: `backend/` (Render sets this when the root directory is set).
3. Health check path: `/health`.
4. Set env vars (table below) — do **not** commit real secrets.

**Env vars to set in the Render dashboard:**

| Var                                                                | Value / note                                                                                                                                                     |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LLM_PROVIDER`                                                     | `openai`                                                                                                                                                         |
| `LLM_BASE_URL`                                                     | `https://api.ilmu.ai/v1`                                                                                                                                         |
| `LLM_API_KEY`                                                      | ILMU `sk-…` key                                                                                                                                                  |
| `LLM_MODEL`                                                        | `nemo-super`                                                                                                                                                     |
| `LLM_ESCALATION_MODEL`                                             | leave **unset** (pure-ILMU prelim; no escalation)                                                                                                                |
| `LLM_ALLOW_DIRECT_ANTHROPIC`                                       | leave **unset**                                                                                                                                                  |
| `MYINVOIS_BASE_URL`                                                | `https://preprod-api.myinvois.hasil.gov.my` (optional — demo uses fixtures)                                                                                      |
| `MYINVOIS_TIN` · `MYINVOIS_CLIENT_ID` · `MYINVOIS_CLIENT_SECRET_1` | sandbox creds (optional)                                                                                                                                         |
| `CORS_ORIGINS`                                                     | `https://<your-project>.vercel.app,http://localhost:5173` — **must include the Vercel prod URL once known**; exact-match, no wildcards (credentials are enabled) |
| `DATABASE_URL`                                                     | leave **unset** for the prelim — backend degrades to fixtures/in-memory by design; add Neon connection string later (DO-4)                                       |

**`$PORT` note:** the container start command is `uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}`. Render injects `$PORT` at runtime; the default `8000` is used for local `docker run` without `-e PORT`.

**Single-worker requirement:** the HITL filing graph (`/filings/form-c/start` → `/resume`) uses an in-process `MemorySaver` — do **not** scale to multiple workers until BE-15 (durable Neon checkpointer) lands. On the Render free tier this is automatic (1 instance).

**Free-tier cold start:** the service spins down after ~15 min idle and takes ~30–60s to wake. Pre-warm before a demo: `curl https://<your-service>.onrender.com/health` ~1 min before the first judge interaction, or keep a browser tab open on `/docs`.

**Redeploy:** Render auto-deploys from the connected branch on every push. To trigger manually: Render dashboard → Manual Deploy.

---

### 5b. Vercel (frontend — Vite SPA)

**One-time setup:**

```bash
cd frontend
bunx vercel link          # link to your Vercel project (first time only)
```

**Set env vars (Vercel dashboard or CLI):**

```bash
bunx vercel env add VITE_API_BASE_URL   # https://<your-service>.onrender.com
bunx vercel env add VITE_API_MOCK       # 0 for live, 1 for mock-only
```

| Var                 | Live deploy                           | Mock / local            |
| ------------------- | ------------------------------------- | ----------------------- |
| `VITE_API_BASE_URL` | `https://<your-service>.onrender.com` | `http://localhost:8000` |
| `VITE_API_MOCK`     | `0`                                   | `1`                     |

**Deploy to production:**

```bash
cd frontend
bunx vercel --prod
```

**SPA deep-link rewrite:** `frontend/vercel.json` contains a catch-all rewrite (`/(.*) → /index.html`) so client-side routes (`/obligations`, `/filing`, `/audit-defense`) resolve on hard refresh or direct URL. Vercel serves real files (JS/CSS assets under `/assets/`) before evaluating rewrites, so static assets are unaffected.

**CORS note:** add the stable Vercel prod URL (`https://<your-project>.vercel.app`) to `CORS_ORIGINS` on Render. Per-deploy preview URLs rotate and are not covered by exact-match CORS — demo from the prod URL, not a preview.

## 6. Demo flow (matches the video script)

1. Onboard **Acme** (seed: `backend/core/fixtures/entity_acme.json` + `myinvois_acme.json`).
2. **Obligations** → calendar (Form C, e-invoice, SST, employer).
3. **Form C** (trial balance `backend/core/fixtures/trial_balance_acme.json`) → cited computation; `tax_payable = RM31,000`.
4. **Audit-defense** → paste _"Justify your RM4,800 repairs deduction"_ → cited DefensePack (s.33(1)) + exposure note; show the **citation verifier rejecting a fabricated clause**.
5. (Optional) flip **sovereign mode** (`LLM_PROVIDER=openai` + ILMU base URL) to show in-country inference.

> If the frontend isn't ready, drive the same flow through **`/docs`** (Swagger) — the cited JSON still tells the story.
