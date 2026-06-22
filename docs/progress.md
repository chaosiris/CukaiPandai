# PROGRESS

> Append-only log. **PG** adds a dated entry after each task; **QA** records test/build results. Newest at the bottom.
>
> Shared across the team; tag each entry with its lane — **BE** · **FE** · **TD**. Design & decisions → [`cukaipandai-spec.md`](cukaipandai-spec.md); the plan → [`plan.md`](plan.md).

Format:

```
## [DD/MM/YY] — <Task Name>

- What changed (brief).
- Files touched.
- Test/build status.
```

---

## [23/06/26] — Baseline status snapshot `[VERIFIED 2026-06-23]`

- **BE — Deterministic core (`core/`):** obligation engine, computation engine, deadlines (holiday-shift), citation gate, law-corpus loader, YA2026 config (figures verified + cited), Pydantic models, seeded Acme fixtures. **TDD.**
- **BE — Agentic API (`api/`):** 6 agents (profiler, documents, deductibility, audit_risk, audit_defense, citation_critic) + LangGraph filing graph with HITL `interrupt` + FastAPI (3 live POST endpoints + `/health`) + `LLMClient` adapter (Anthropic / OpenAI-compat / Fake). **TDD.** Known gaps: graph not yet endpoint-mounted; `assess_risk` is two threshold checks and not imported by `main.py`; `_OpenAICompatClient.complete()` does not pass `response_format`; `make_llm()` is single-provider (no routing/fallback yet).
- **TD — Tests:** **40 automated tests pass** incl. an offline end-to-end pipeline test (`tests/api/test_integration_e2e.py`: profiler → compute → audit-defense, all on `FakeLLMClient`).
- **TD — Infra:** Docker compose + CI (GitHub Actions: pytest + Docker build); image is **Render**-deployable as-is.
- **Files touched:** `core/`, `api/`, `tests/`, `pyproject.toml`, `Dockerfile`, `docker-compose.yml`, `docs/`.
- **Test/build status:** **40 passed** (pytest) `[VERIFIED 2026-06-23]`.

### Verification results (baseline)

| Check                       | Result                                                                                                                                                                                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Automated tests**         | **40 passed** `[VERIFIED 2026-06-23]` (pytest), incl. the offline e2e pipeline test (`tests/api/test_integration_e2e.py`).                                                                                                                                                                  |
| **YA2026 tax figures**      | Verified vs LHDN/RMCD with citations `[VERIFIED]` — SME bands 15/17/24% (paid-up ≤ RM2.5m AND gross ≤ RM50m), non-SME 24%, e-invoice phases (exemption raised to RM1m from 2026, final phase cancelled), SST/CGT/TP/WHT annotated in `ya_2026.yaml` with a provenance file.                 |
| **Seeded demo correctness** | Acme TIN `C2581234509`; `chargeable_income RM200,000` → `tax_payable RM31,000` (15% × 150k + 17% × 50k) — asserted in `tests/api/test_endpoints.py` and `test_graph.py`. Audit query _"Justify your RM4,800 repairs deduction"_ → cited pack; fabricated citation rejected by the verifier. |
| **Live endpoints**          | 3 POST endpoints live (`/entities/{tin}/obligations`, `/filings/form-c`, `/audit-defense`) + `/health`. LangGraph orchestrator with HITL `interrupt` exists in `api/graph.py` (exercised in tests; **not yet endpoint-mounted**).                                                           |
| **ILMU API compatibility**  | `[VERIFIED 2026-06-23]` (browser) — tri-SDK base URLs, `sk-` key, `nemo-super`/`ilmu-nemo-nano` support chat + SSE + tool-use + JSON mode; Claw tier gates to those two text models, PAYG unlocks vision/embeddings. Existing `_OpenAICompatClient` integrates by base-url+key+model swap.  |
| **MyInvois sandbox**        | **OAuth verified live 2026-06-23** (token + `/api/v1.0/documenttypes` both HTTP 200) with real sandbox creds; `/documents/recent` returns 0 docs for the test TIN, so the demo uses the fixture.                                                                                            |
| **Other gov APIs**          | SSM/MySST seeded (paid / no API); data.gov.my MSIC + BNM FX confirmed free/callable. Intended hackathon scoping, stated transparently (spec §10).                                                                                                                                           |

### Verified vs. assumed (baseline)

- **Verified live (browser):** ILMU as a sovereign Malaysian platform (100% in-country residency) · tri-SDK base URLs (`/v1`, `/anthropic`, `/gemini`), one `sk-` key · model catalogue · Claw-vs-PAYG plan split · capability matrix · early-access free banner + "Claw Starter ~RM27/seat/month" · ILMU BM capability · MyInvois sandbox OAuth. Sources cited (docs 403 bots): `docs.ilmu.ai`, `console.ilmu.ai/pricing`, `ytlailabs.com`, `preprod-api.myinvois.hasil.gov.my`.
- **Verified in repo / via pytest:** 40 tests pass incl. offline e2e · the deterministic↔AI split · `make_llm()` is single-provider with no routing/fallback · `_OpenAICompatClient.complete()` does not pass `response_format` · `assess_risk` is two threshold checks, not imported by `main.py` · 3 live POST endpoints + `health` · LangGraph HITL graph exists but not endpoint-mounted · seeded Acme figures · MyInvois fixture-backed (live OAuth path still a `NotImplementedError` stub) · SSM/MySST seeded · YA2026 config annotated with verified figures + provenance.
- **Researched / cited (carried from inception, not re-fetched):** competitive landscape · the obligation-derivation finding (no government endpoint returns a company's obligation set) · the no-public-filing-API boundary · MyInvois sandbox/OAuth2 facts and SSM/MySST access nature.
- **Assumed / deferred:** spec Assumptions A1–A6 (spec §12) + the plan's open questions ([`plan.md`](plan.md)). None architectural; all cheap to resolve.
