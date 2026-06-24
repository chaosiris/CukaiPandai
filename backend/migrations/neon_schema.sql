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
