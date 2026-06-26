-- DO-4 — Neon Postgres schema for CukaiPandai persistence (prelim: managed Neon, SG region;
-- prod: self-hosted/MY-region Postgres with this identical schema — a deploy-config swap).
--
-- LangGraph HITL checkpoints (BE-15) are created by PostgresSaver.setup() over the DIRECT
-- (unpooled) endpoint at startup — NOT defined here. This file covers BE-16 + BE-17.
-- Apply over the unpooled endpoint:  psql "$DATABASE_URL_UNPOOLED" -f migrations/neon_schema.sql

-- BE-16 — EvidenceVault (HASHES, not raw payloads — the residency mitigation).
CREATE TABLE IF NOT EXISTS links (
    figure_id   text,
    document_id text,
    clause_id   text
);
CREATE TABLE IF NOT EXISTS audit (
    id           serial PRIMARY KEY,
    actor        text,
    action       text,
    payload_hash text
);

-- BE-17 — domain data (seeded from core/fixtures/*; the fixtures remain the demo fallback).
CREATE TABLE IF NOT EXISTS entities (
    tin  text PRIMARY KEY,
    data jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS filings (
    id          serial PRIMARY KEY,
    tin         text REFERENCES entities(tin),
    computation jsonb NOT NULL,
    approved    boolean,
    created_at  timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS defense_packs (
    id         serial PRIMARY KEY,
    tin        text,
    query      text,
    pack       jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Auth users — password HASHES only (PBKDF2-HMAC), never raw passwords. provider = 'password'|'google'|'guest'.
-- The app also creates this lazily (UserRepository._ensure_table); included here for psql provisioning.
CREATE TABLE IF NOT EXISTS users (
    id            text PRIMARY KEY,
    email         text UNIQUE NOT NULL,
    name          text,
    password_hash text,
    provider      text NOT NULL DEFAULT 'password',
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- EP-1 — per-user entity profiles keyed by JWT sub. Additive; does not alter existing tables.
CREATE TABLE IF NOT EXISTS user_entities (
    user_id    text PRIMARY KEY,
    data       jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- EP-2 — per-user filing records. Additive; does not alter the existing filings table.
-- id is a server-assigned uuid hex; user_id is the JWT sub.
CREATE TABLE IF NOT EXISTS filing_records (
    id         text PRIMARY KEY,
    user_id    text NOT NULL,
    tin        text,
    label      text,
    computation jsonb,
    risk_flags  jsonb,
    line_items  jsonb,
    created_at  timestamptz NOT NULL DEFAULT now(),
    -- BE-2.1 (additive): status tracks draft→final lifecycle; raw_text stores the
    -- original trial-balance input for full resume. Existing rows backfill status='final'
    -- and raw_text=NULL — no row becomes invalid; computation stays nullable as-is.
    status     text NOT NULL DEFAULT 'final',
    raw_text   text
);

-- BE-2.1 — additive migration for existing filing_records tables (idempotent).
-- Existing rows backfill status='final'; computation was already nullable; no column is
-- dropped or retyped. Safe to run on any DB that has filing_records already created.
ALTER TABLE filing_records ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'final';
ALTER TABLE filing_records ADD COLUMN IF NOT EXISTS raw_text text;
