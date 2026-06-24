# CukaiPandai — Runbook (run · deploy · demo)

## 1. Run the backend (FastAPI)

Run from the `backend/` directory (required — the law-corpus fixtures resolve relative to CWD).

```bash
cd backend
uv sync --extra dev              # creates .venv and installs all deps
uv run pytest -q                 # expect: 40 passed (offline — uses FakeLLMClient, no key)
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

| Var                          | Sovereign (ILMU — primary)             | Sovereign escalation (same gateway) | Direct Claude (flagged opt-in) |
| ---------------------------- | -------------------------------------- | ----------------------------------- | ------------------------------ |
| `LLM_PROVIDER`               | `openai`                               | —                                   | —                              |
| `LLM_BASE_URL`               | `https://api.ilmu.ai/v1`               | —                                   | —                              |
| `LLM_MODEL`                  | `nemo-super`                           | —                                   | —                              |
| `LLM_API_KEY`                | ILMU `sk-…`                            | —                                   | —                              |
| `LLM_ESCALATION_MODEL`       | (blank = pure-ILMU, the prelim default)| larger ILMU model (in-country)      | —                              |
| `LLM_ALLOW_DIRECT_ANTHROPIC` | —                                      | —                                   | `1` (off by default)           |
| `ANTHROPIC_API_KEY`          | —                                      | —                                   | Anthropic key                  |

Prelim is **pure-ILMU (Q6)** — leave the escalation vars blank and `make_llm()` returns a bare sovereign ILMU client (no router). A **direct Claude route leaves Malaysia** (breaks data residency) — enable only deliberately and state it in the deck. `pytest` uses `FakeLLMClient` → no key needed; a live key is only required for real agent runs.

**MyInvois (LHDN e-invoicing) sandbox — optional (the demo uses fixtures):**

| Var                                                                | Value                                       |
| ------------------------------------------------------------------ | ------------------------------------------- |
| `MYINVOIS_BASE_URL`                                                | `https://preprod-api.myinvois.hasil.gov.my` |
| `MYINVOIS_TIN` · `MYINVOIS_CLIENT_ID` · `MYINVOIS_CLIENT_SECRET_1` | sandbox creds (preprod MyTax portal)        |

## 4. Deploy (Vercel + Render)

- **Frontend → Vercel:** root directory `frontend/`; set `VITE_API_BASE_URL` to the Render backend URL; Vite build → static SPA.
- **Backend → Render:** deploy `backend/Dockerfile` with build context `backend/`; set `LLM_*` (and optional `MYINVOIS_*`) as Render env vars; health check `/health`. CI now uses uv (`uv sync --extra dev` + `uv run pytest -q`).
  - **Run a single Uvicorn worker.** The HITL filing graph (`/filings/form-c/start` → `/resume`) uses an in-process `MemorySaver`, so paused approvals are not shared across workers and do not survive a restart. For production beyond the demo, swap in a durable checkpointer (SQLite/Postgres).
- Localhost is acceptable for the prelim submission.

## 5. Demo flow (matches the video script)

1. Onboard **Acme** (seed: `backend/core/fixtures/entity_acme.json` + `myinvois_acme.json`).
2. **Obligations** → calendar (Form C, e-invoice, SST, employer).
3. **Form C** (trial balance `backend/core/fixtures/trial_balance_acme.json`) → cited computation; `tax_payable = RM31,000`.
4. **Audit-defense** → paste _"Justify your RM4,800 repairs deduction"_ → cited DefensePack (s.33(1)) + exposure note; show the **citation verifier rejecting a fabricated clause**.
5. (Optional) flip **sovereign mode** (`LLM_PROVIDER=openai` + ILMU base URL) to show in-country inference.

> If the frontend isn't ready, drive the same flow through **`/docs`** (Swagger) — the cited JSON still tells the story.
