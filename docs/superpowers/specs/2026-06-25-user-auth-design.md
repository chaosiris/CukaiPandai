# User Auth — SSO (Google) + email/password + guest (design)

**Date:** 2026-06-25 · **Lane:** BE + FE · **Branch:** `feat/user-auth` (PR → `main`)

## Goal

Make the existing `/sign-in` and `/sign-up` pages (`frontend/src/pages/AuthScreen.tsx`) functional. Today guest works (a `localStorage` flag); SSO + email/password are disabled "coming soon" stubs. Implement **real backend auth** (FastAPI + JWT + a Neon `users` table, fallback-first) with three methods: **Google SSO**, **email/password**, **guest**. Add a route guard that still lets guests in.

## Decisions (locked with PO)

- **Real backend auth** (not client-only mock) — FastAPI endpoints, hashed passwords, signed JWT, Neon `users` table with an in-memory fallback (mirrors BE-15/16/17 "DB-down ≠ demo-down").
- **Google-only SSO**, **config-gated**: the full real flow is built; the button works in mock mode now and goes live when `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID` are set. Google is a US service → **state the residency caveat in the deck** (same class as the Neon-SG caveat).
- **Route guard allows guests** — app routes require a session OR the guest flag; else redirect to `/sign-in`. The demo never blocks.
- **No new hard backend deps** — stdlib **HS256 JWT** + **PBKDF2-HMAC** password hashing (so no network `uv lock` is forced). `google-auth` is an **optional extra** (`[project.optional-dependencies].auth-google`), lazy-imported; absent/ unconfigured → `/auth/google` returns 503.
- **Mock-first FE preserved** — `VITE_API_MOCK=1` uses a simulated session so the FE still runs with no backend; `=0` uses the real API.

## Backend

- `api/auth.py` — `hash_password`/`verify_password` (PBKDF2-HMAC-SHA256, per-user salt, embedded params), `create_token`/`decode_token` (HS256 via `AUTH_JWT_SECRET`, `exp`), `verify_google_id_token` (lazy `google.oauth2.id_token`; `None` if unconfigured/invalid).
- `UserRepository` (in `api/persistence.py`) — `get_by_email`, `create`, `upsert_oauth`; Neon `users` table when `DATABASE_URL` set, else a process-level in-memory dict. Stores `password_hash` only (never the password).
- Routes in `api/main.py`: `POST /auth/signup` (409 dup) · `POST /auth/login` (401 bad creds) · `POST /auth/google` (503 if unconfigured) · `GET /auth/me` (Bearer token → user; 401 invalid). Request models in `api/schemas.py`.
- `migrations/neon_schema.sql` — `users(id, email unique, name, password_hash, provider, created_at)`.
- `.env.example` — `AUTH_JWT_SECRET`, `GOOGLE_CLIENT_ID`.

## Frontend

- `AuthContext.tsx` — `{user, token, isAuthed, isGuest}` + `signIn/signUp/signInWithGoogle/signOut/continueAsGuest`. Token in `localStorage('cp_token')`; hydrate on mount via `/auth/me` (real) or stored session (mock).
- `api/client.ts` — `authSignup/authLogin/authGoogle/authMe` (+ mock variants); attach `Authorization: Bearer` when a token is present.
- `AuthScreen.tsx` — enable email/password inputs + submit, real **Google Identity Services** button, keep guest; validation + loading + error states.
- `RequireAuth.tsx` — allow `isAuthed || isGuest`, else redirect to `/sign-in`. Wrap the AppShell routes in `App.tsx`; wrap the app in `AuthProvider`.
- `AppShell.tsx` — show the signed-in user; sign-out clears token + guest flag via the context.
- `.env` / Vite — `VITE_GOOGLE_CLIENT_ID`.

## Testing

- `tests/api/test_auth.py`: signup → login → me happy path; duplicate email 409; bad creds 401; `/auth/me` invalid/missing token 401; `/auth/google` unconfigured 503; password hash roundtrip + wrong-password reject; JWT roundtrip + expiry; all in fallback (no-DB) mode.
- FE: `tsc --noEmit` + `bun run build` clean.

## Caveats (state honestly in the deck)

- Google SSO is a **US dependency** → residency caveat (mirror the Neon-SG framing). Email/password + JWT stay in-country (user row in Neon-SG; same caveat as the rest of persistence).
- The dev `AUTH_JWT_SECRET` default is insecure — production must set a real secret.

## Out of scope (prelim)

Password reset, email verification, refresh-token rotation, multi-tenant orgs/roles, account settings UI beyond sign-out.
