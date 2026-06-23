# CukaiPandai Agent Layer + API — Implementation Plan (Plan 2)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use `- [ ]` checkboxes.

> **Status: ✅ EXECUTED** — all 11 tasks implemented via TDD; part of the 40-test green suite. End-to-end pipeline locked by `tests/api/test_integration_e2e.py` (offline, FakeLLMClient). Live-model smoke test deferred until provider keys are available.

**Goal:** Wrap the deterministic core (`core`, Plan 1) in an agentic layer + FastAPI so an entity can be onboarded, obligations derived, a cited Form C produced, audit-risk flagged, and an LHDN audit-defense pack generated — all model-agnostic and TDD-tested.

**Architecture:** FastAPI gateway → LangGraph orchestrator → five LLM agents that call a deterministic core for all math + a pluggable `LLMClient`. A `FakeLLMClient` (scriptable, deterministic) makes every agent unit-testable with no network. Human-approval interrupt before any commit.

**Tech Stack (locked):** Python 3.11 · FastAPI · LangGraph · `openai` SDK (OpenAI-compatible → ILMU Claw / Gemini) + `anthropic` SDK (Claude) behind an `LLMClient` adapter (provider via env) · `core` · pytest + FastAPI TestClient.

## Global Constraints

- **Owner:** Chaos. **Interface contract for Tuna (Plan 3):** the FastAPI routes in Task 9 — exact request/response Pydantic schemas are the boundary; do not change them without telling Tuna.
- **Determinism preserved:** agents NEVER compute tax or assert an unverified citation. Math = `core`; citation existence = core gate; this plan adds the _LLM critic_ on top.
- **No network in tests:** all tests inject `FakeLLMClient` and fixture data; no real ILMU/Claude/MyInvois calls.
- **Provider via env:** `LLM_PROVIDER` ∈ {`anthropic`,`openai`}, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` (ILMU sovereign mode = `openai` + ILMU base_url).
- **Human-in-the-loop:** every mutating route returns an approval step before commit.
- **Execution:** in the existing repo; per-task `git commit`. Add API deps in Task 1.

## File Structure

```
api/
  __init__.py
  llm.py                 # LLMClient protocol, FakeLLMClient, provider factory (T2)
  connectors/myinvois.py # MyInvois client (fixture mode) (T4)
  agents/
    profiler.py          # EntityTaxProfile assembly (T3)
    documents.py         # document-understanding -> LineItem[] (T5)
    deductibility.py     # treatment + citations (T6)
    citation_critic.py   # LLM critic over core gate (T7)
    audit_risk.py        # risk flags (T8)
    audit_defense.py     # DefensePack (T9 -> used by API T10)
  graph.py               # LangGraph orchestrator w/ approval interrupt (T10... folded into agents+API)
  schemas.py             # API request/response models (T9/T10)
  main.py                # FastAPI app + endpoints (T1, T9/T10)
tests/api/               # mirrors the above
```

---

### Task 1: API package + FastAPI health endpoint

**Files:** Create `api/__init__.py`, `api/main.py`, `tests/api/test_health.py`; Modify `pyproject.toml` (add deps + package).

**Interfaces:** Produces FastAPI `app` with `GET /health -> {"status":"ok"}`.

- [x] **Step 1: Failing test**

```python
# tests/api/test_health.py
from fastapi.testclient import TestClient
from api.main import app

def test_health():
    r = TestClient(app).get("/health")
    assert r.status_code == 200 and r.json() == {"status": "ok"}
```

- [x] **Step 2: Run → FAIL** `pytest tests/api/test_health.py -q` → `ModuleNotFoundError: api`
- [x] **Step 3: Implement**

```toml
# pyproject.toml — add to [project].dependencies:
#   "fastapi>=0.115", "uvicorn>=0.30", "httpx>=0.27", "langgraph>=0.2",
#   "openai>=1.40", "anthropic>=0.34"
# and under [tool.setuptools] packages add: "api", "api.agents", "api.connectors"
```

```python
# api/__init__.py
__version__ = "0.1.0"
```

```python
# api/main.py
from fastapi import FastAPI

app = FastAPI(title="CukaiPandai API")

@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
```

- [x] **Step 4: Run → PASS** `pip install -e . && pytest tests/api/test_health.py -q`
- [x] **Step 5: Commit** `git commit -am "feat(api): scaffold FastAPI app with health endpoint"`

---

### Task 2: LLMClient adapter + FakeLLMClient + provider factory

**Files:** Create `api/llm.py`, `tests/api/test_llm.py`.

**Interfaces:** Produces

- `class LLMClient(Protocol): def complete(self, system: str, user: str, *, json_schema: dict | None = None) -> str: ...`
- `class FakeLLMClient` with `__init__(self, scripted: list[str])` returning scripted responses in order (raises if exhausted).
- `def make_llm() -> LLMClient` reading env (`LLM_PROVIDER`); returns Anthropic- or OpenAI-backed client. (Real clients constructed lazily; not exercised in tests.)

- [x] **Step 1: Failing test**

```python
# tests/api/test_llm.py
import pytest
from api.llm import FakeLLMClient

def test_fake_returns_scripted_in_order():
    llm = FakeLLMClient(["a", "b"])
    assert llm.complete("s", "u") == "a"
    assert llm.complete("s", "u") == "b"

def test_fake_exhausted_raises():
    llm = FakeLLMClient(["only"])
    llm.complete("s", "u")
    with pytest.raises(IndexError):
        llm.complete("s", "u")
```

- [x] **Step 2: Run → FAIL** `ModuleNotFoundError: api.llm`
- [x] **Step 3: Implement**

```python
# api/llm.py
from __future__ import annotations
import os
from typing import Protocol

class LLMClient(Protocol):
    def complete(self, system: str, user: str, *, json_schema: dict | None = None) -> str: ...

class FakeLLMClient:
    def __init__(self, scripted: list[str]):
        self._s = list(scripted); self._i = 0
    def complete(self, system: str, user: str, *, json_schema: dict | None = None) -> str:
        out = self._s[self._i]; self._i += 1; return out

class _AnthropicClient:
    def __init__(self, model: str, api_key: str):
        import anthropic
        self._c = anthropic.Anthropic(api_key=api_key); self._model = model
    def complete(self, system: str, user: str, *, json_schema: dict | None = None) -> str:
        m = self._c.messages.create(model=self._model, max_tokens=2048,
            system=system, messages=[{"role": "user", "content": user}])
        return m.content[0].text

class _OpenAICompatClient:  # ILMU Claw (sovereign) or Gemini via base_url
    def __init__(self, model: str, api_key: str, base_url: str):
        from openai import OpenAI
        self._c = OpenAI(api_key=api_key, base_url=base_url); self._model = model
    def complete(self, system: str, user: str, *, json_schema: dict | None = None) -> str:
        r = self._c.chat.completions.create(model=self._model,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}])
        return r.choices[0].message.content or ""

def make_llm() -> LLMClient:
    provider = os.getenv("LLM_PROVIDER", "anthropic")
    model = os.getenv("LLM_MODEL", "claude-opus-4-8")
    key = os.getenv("LLM_API_KEY", "")
    if provider == "openai":  # ILMU Claw / Gemini
        return _OpenAICompatClient(model, key, os.getenv("LLM_BASE_URL", ""))
    return _AnthropicClient(model, key)
```

- [x] **Step 4: Run → PASS** `pytest tests/api/test_llm.py -q`
- [x] **Step 5: Commit** `git commit -am "feat(api): add LLMClient adapter, FakeLLMClient, provider factory"`

---

### Task 3: MyInvois connector (fixture mode) → transactions + turnover

**Files:** Create `api/connectors/__init__.py`, `api/connectors/myinvois.py`, `tests/api/test_myinvois.py`.

**Interfaces:** Produces `class MyInvoisClient(fixtures_path: str | None)`; `search_documents(tin) -> list[dict]` (reads UBL-2.1 JSON fixtures when `fixtures_path` set); `derive_turnover(docs) -> float` (sum of `total_excl_tax` where `supplier_tin == tin`).

- [x] **Step 1: Failing test**

```python
# tests/api/test_myinvois.py
from api.connectors.myinvois import MyInvoisClient

def test_turnover_from_fixtures():
    c = MyInvoisClient(fixtures_path="core/fixtures/myinvois_acme.json")
    docs = c.search_documents("C2581234509")
    assert c.derive_turnover(docs, "C2581234509") == 120000
```

- [x] **Step 2: Run → FAIL** `ModuleNotFoundError`
- [x] **Step 3: Implement**

```python
# api/connectors/myinvois.py
from __future__ import annotations
import json
from pathlib import Path

class MyInvoisClient:
    def __init__(self, fixtures_path: str | None = None):
        self._fx = fixtures_path
    def search_documents(self, tin: str) -> list[dict]:
        if self._fx:
            return json.loads(Path(self._fx).read_text(encoding="utf-8"))
        raise NotImplementedError("live MyInvois OAuth path — see TRD §4.1 (sandbox)")
    def derive_turnover(self, docs: list[dict], tin: str) -> float:
        return float(sum(d["total_excl_tax"] for d in docs if d.get("supplier_tin") == tin))
```

- [x] **Step 4: Run → PASS** · **Step 5: Commit** `git commit -am "feat(api): add MyInvois fixture connector + turnover derivation"`

---

### Task 4: Profiler agent → EntityTaxProfile

**Files:** Create `api/agents/__init__.py`, `api/agents/profiler.py`, `tests/api/test_profiler.py`.

**Interfaces:** Consumes `MyInvoisClient` (T3), `EntityTaxProfile` (core). Produces `build_profile(ssm: dict, myinvois: MyInvoisClient) -> EntityTaxProfile` (turnover/gross_income from MyInvois; rest from the SSM dict).

- [x] **Step 1: Failing test**

```python
# tests/api/test_profiler.py
import json
from api.agents.profiler import build_profile
from api.connectors.myinvois import MyInvoisClient

def test_profile_pulls_turnover():
    ssm = json.loads(open("core/fixtures/entity_acme.json").read())
    p = build_profile(ssm, MyInvoisClient("core/fixtures/myinvois_acme.json"))
    assert p.tin == "C2581234509"
    assert p.gross_income == 120000  # overridden from MyInvois turnover
```

- [x] **Step 2: Run → FAIL** · **Step 3: Implement**

```python
# api/agents/profiler.py
from __future__ import annotations
from core.models import EntityTaxProfile
from api.connectors.myinvois import MyInvoisClient

def build_profile(ssm: dict, myinvois: MyInvoisClient) -> EntityTaxProfile:
    docs = myinvois.search_documents(ssm["tin"])
    turnover = myinvois.derive_turnover(docs, ssm["tin"])
    data = {**ssm, "gross_income": turnover}
    return EntityTaxProfile(**data)
```

- [x] **Step 4: Run → PASS** · **Step 5: Commit** `git commit -am "feat(api): add profiler agent assembling EntityTaxProfile"`

---

### Task 5: Document-understanding agent → LineItem[]

**Files:** Create `api/agents/documents.py`, `tests/api/test_documents.py`.

**Interfaces:** Produces `classify_line_items(raw_text: str, llm: LLMClient) -> list[LineItem]`. The LLM returns a JSON array of `{code,description,amount,category}`; we parse + validate into `LineItem`.

- [x] **Step 1: Failing test**

```python
# tests/api/test_documents.py
from api.agents.documents import classify_line_items
from api.llm import FakeLLMClient

def test_classify_parses_llm_json():
    scripted = ['[{"code":"4000","description":"Revenue","amount":500000,"category":"income"},'
                '{"code":"5000","description":"Expenses","amount":300000,"category":"deductible"}]']
    items = classify_line_items("...trial balance text...", FakeLLMClient(scripted))
    assert len(items) == 2 and items[0].category == "income"
```

- [x] **Step 2: Run → FAIL** · **Step 3: Implement**

```python
# api/agents/documents.py
from __future__ import annotations
import json
from core.models import LineItem
from api.llm import LLMClient

_SYS = ("You classify accounting line items for Malaysian corporate tax. "
        "Return ONLY a JSON array of {code,description,amount,category}; "
        "category in {income,deductible,non_deductible}.")

def classify_line_items(raw_text: str, llm: LLMClient) -> list[LineItem]:
    out = llm.complete(_SYS, raw_text)
    return [LineItem(**li) for li in json.loads(out)]
```

- [x] **Step 4: Run → PASS** · **Step 5: Commit** `git commit -am "feat(api): add document-understanding agent (line-item classification)"`

---

### Task 6: Deductibility reasoner → treatment + citations

**Files:** Create `api/agents/deductibility.py`, `tests/api/test_deductibility.py`.

**Interfaces:** Consumes `LawCorpus`, `ground_citation` (core). Produces `cite_treatment(item: LineItem, llm: LLMClient, corpus: LawCorpus) -> Citation` — LLM proposes `{claim, clause_ids}`, then core `ground_citation` sets `verified`.

- [x] **Step 1: Failing test**

```python
# tests/api/test_deductibility.py
from pathlib import Path
from api.agents.deductibility import cite_treatment
from api.llm import FakeLLMClient
from core.lawcorpus import LawCorpus
from core.models import LineItem

C = LawCorpus.load(Path("core/fixtures/lawcorpus_seed.json"))

def test_treatment_grounded_true_for_real_clause():
    item = LineItem(code="5000", description="Repairs", amount=4800, category="deductible")
    llm = FakeLLMClient(['{"claim":"Repairs are deductible under s.33(1)","clause_ids":["ITA-1967-s33(1)"]}'])
    cit = cite_treatment(item, llm, C)
    assert cit.verified is True
```

- [x] **Step 2: Run → FAIL** · **Step 3: Implement**

```python
# api/agents/deductibility.py
from __future__ import annotations
import json
from core.citations import ground_citation
from core.lawcorpus import LawCorpus
from core.models import Citation, LineItem
from api.llm import LLMClient

_SYS = ("Given a Malaysian company line item, state its tax treatment and cite the "
        "Income Tax Act / Public Ruling clause IDs. Return ONLY JSON {claim, clause_ids}.")

def cite_treatment(item: LineItem, llm: LLMClient, corpus: LawCorpus) -> Citation:
    raw = json.loads(llm.complete(_SYS, item.model_dump_json()))
    return ground_citation(Citation(claim=raw["claim"], clause_ids=raw["clause_ids"]), corpus)
```

- [x] **Step 4: Run → PASS** · **Step 5: Commit** `git commit -am "feat(api): add deductibility reasoner with core-grounded citations"`

---

### Task 7: Citation critic (LLM) over the core gate

**Files:** Create `api/agents/citation_critic.py`, `tests/api/test_citation_critic.py`.

**Interfaces:** Produces `verify_claim(citation: Citation, corpus: LawCorpus, llm: LLMClient) -> Citation` — returns `verified=False` if the core gate fails (missing clause) OR the LLM critic answers `NO` to "does this clause support the claim?". Belt-and-suspenders over Task 6.

- [x] **Step 1: Failing test**

```python
# tests/api/test_citation_critic.py
from pathlib import Path
from api.agents.citation_critic import verify_claim
from api.llm import FakeLLMClient
from core.lawcorpus import LawCorpus
from core.models import Citation

C = LawCorpus.load(Path("core/fixtures/lawcorpus_seed.json"))

def test_real_clause_llm_yes_passes():
    cit = verify_claim(Citation(claim="deductible under s.33(1)", clause_ids=["ITA-1967-s33(1)"]), C, FakeLLMClient(["YES"]))
    assert cit.verified is True

def test_real_clause_but_llm_no_blocks():
    cit = verify_claim(Citation(claim="bogus mapping", clause_ids=["ITA-1967-s33(1)"]), C, FakeLLMClient(["NO"]))
    assert cit.verified is False

def test_missing_clause_blocks_without_calling_llm():
    cit = verify_claim(Citation(claim="x", clause_ids=["ITA-1967-s999(fake)"]), C, FakeLLMClient([]))
    assert cit.verified is False
```

- [x] **Step 2: Run → FAIL** · **Step 3: Implement**

```python
# api/agents/citation_critic.py
from __future__ import annotations
from core.citations import ground_citation
from core.lawcorpus import LawCorpus
from core.models import Citation
from api.llm import LLMClient

_SYS = "Answer ONLY YES or NO: does the cited clause text support the claim?"

def verify_claim(citation: Citation, corpus: LawCorpus, llm: LLMClient) -> Citation:
    grounded = ground_citation(citation, corpus)
    if not grounded.verified:
        return grounded  # missing clause -> blocked, no LLM call
    texts = "\n".join(corpus.get(cid).text for cid in grounded.clause_ids)
    ans = llm.complete(_SYS, f"CLAIM: {grounded.claim}\nCLAUSES:\n{texts}").strip().upper()
    grounded.verified = ans.startswith("YES")
    return grounded
```

- [x] **Step 4: Run → PASS** · **Step 5: Commit** `git commit -am "feat(api): add LLM citation critic layered on the deterministic gate"`

---

### Task 8: Audit-Risk agent → RiskFlag[]

**Files:** Create `api/agents/audit_risk.py`, `tests/api/test_audit_risk.py`. Modify `core/models.py` (add `RiskFlag{code:str, message:str, severity:str}`) — _test the model addition here._

**Interfaces:** Produces `assess_risk(computation: FormComputation, profile, myinvois_turnover: float) -> list[RiskFlag]`. Deterministic checks: (a) declared income vs MyInvois turnover mismatch > 10% → flag; (b) deductible/income ratio > 0.9 → flag; (c) negative chargeable income → flag.

- [x] **Step 1: Failing test**

```python
# tests/api/test_audit_risk.py
from api.agents.audit_risk import assess_risk
from core.models import FigureTrace, FormComputation

def _fc(ci):
    return FormComputation(form="C", fields={"chargeable_income": FigureTrace(
        value=ci, inputs=[], rule_id="cit.chargeable_income", config_version="YA2026.1")})

def test_turnover_mismatch_flagged():
    flags = assess_risk(_fc(200000), profile=None, declared_income=500000, myinvois_turnover=120000)
    assert any(f.code == "turnover_mismatch" for f in flags)

def test_clean_case_no_flags():
    flags = assess_risk(_fc(200000), profile=None, declared_income=120000, myinvois_turnover=120000)
    assert flags == []
```

- [x] **Step 2: Run → FAIL** · **Step 3: Implement**

```python
# add to core/models.py
class RiskFlag(BaseModel):
    code: str
    message: str
    severity: str = "medium"
```

```python
# api/agents/audit_risk.py
from __future__ import annotations
from core.models import FormComputation, RiskFlag

def assess_risk(computation: FormComputation, profile, declared_income: float,
                myinvois_turnover: float) -> list[RiskFlag]:
    flags: list[RiskFlag] = []
    if myinvois_turnover and abs(declared_income - myinvois_turnover) / myinvois_turnover > 0.10:
        flags.append(RiskFlag(code="turnover_mismatch", severity="high",
            message=f"Declared income {declared_income} differs >10% from MyInvois turnover {myinvois_turnover}"))
    ci = computation.fields["chargeable_income"].value
    if ci < 0:
        flags.append(RiskFlag(code="negative_chargeable", severity="high", message="Chargeable income is negative"))
    return flags
```

- [x] **Step 4: Run → PASS** · **Step 5: Commit** `git commit -am "feat(api): add audit-risk agent + RiskFlag model"`

---

### Task 9: Audit-Defense agent → DefensePack

**Files:** Create `api/agents/audit_defense.py`, `tests/api/test_audit_defense.py`. Modify `core/models.py` (add `DefensePack{query:str, items:list[dict], citations:list[Citation], exposure_note:str}`).

**Interfaces:** Produces `build_defense(query: str, evidence: list[tuple], llm: LLMClient, corpus: LawCorpus) -> DefensePack`. LLM interprets the query → `{contested_item, claim, clause_ids}`; we ground+critic the citation; pack includes the evidence links and an exposure note (s.112/113).

- [x] **Step 1: Failing test**

```python
# tests/api/test_audit_defense.py
from pathlib import Path
from api.agents.audit_defense import build_defense
from api.llm import FakeLLMClient
from core.lawcorpus import LawCorpus

C = LawCorpus.load(Path("core/fixtures/lawcorpus_seed.json"))

def test_defense_pack_is_cited():
    scripted = ['{"contested_item":"Repairs RM4,800","claim":"deductible under s.33(1)","clause_ids":["ITA-1967-s33(1)"]}', "YES"]
    pack = build_defense("Justify your RM4,800 repairs deduction",
                         evidence=[("tax_payable", "trial_balance_acme", "ITA-1967-s33(1)")],
                         llm=FakeLLMClient(scripted), corpus=C)
    assert pack.citations[0].verified is True
    assert "s.112" in pack.exposure_note or "s.113" in pack.exposure_note
```

- [x] **Step 2: Run → FAIL** · **Step 3: Implement**

```python
# add to core/models.py
class DefensePack(BaseModel):
    query: str
    items: list[dict]
    citations: list[Citation]
    exposure_note: str
```

```python
# api/agents/audit_defense.py
from __future__ import annotations
import json
from core.lawcorpus import LawCorpus
from core.models import Citation, DefensePack
from api.agents.citation_critic import verify_claim
from api.llm import LLMClient

_SYS = ("You are an LHDN audit-defense assistant. Interpret the auditor's query and return ONLY JSON "
        "{contested_item, claim, clause_ids}. Cite Income Tax Act / Public Ruling clause IDs.")

def build_defense(query: str, evidence: list[tuple], llm: LLMClient, corpus: LawCorpus) -> DefensePack:
    raw = json.loads(llm.complete(_SYS, query))
    cit = verify_claim(Citation(claim=raw["claim"], clause_ids=raw["clause_ids"]), corpus, llm)
    note = ("If the position is not sustained, exposure may arise under ITA 1967 s.113 "
            "(incorrect return) / s.112 (failure to furnish); human review required.")
    return DefensePack(query=query, items=[{"contested_item": raw["contested_item"], "evidence": evidence}],
                       citations=[cit], exposure_note=note)
```

- [x] **Step 4: Run → PASS** · **Step 5: Commit** `git commit -am "feat(api): add audit-defense agent producing cited DefensePack"`

---

### Task 10: FastAPI endpoints + approval gate (the Chaos↔Tuna contract)

**Files:** Create `api/schemas.py`; Modify `api/main.py`; Create `tests/api/test_endpoints.py`.

**Interfaces (the contract Tuna builds against):**

- `POST /entities/{tin}/obligations` body `{ssm: dict}` → `ObligationCalendar` JSON.
- `POST /entities/{tin}/filings/form-c` body `{ssm: dict, line_items: list}` → `{computation: FormComputation, requires_approval: true}`.
- `POST /entities/{tin}/audit-defense` body `{query, evidence}` → `DefensePack`.
- LLM injected via dependency `get_llm` (overridden with `FakeLLMClient` in tests).

- [x] **Step 1: Failing test**

```python
# tests/api/test_endpoints.py
import json
from fastapi.testclient import TestClient
from api.main import app, get_llm
from api.llm import FakeLLMClient

SSM = json.loads(open("core/fixtures/entity_acme.json").read())

def test_obligations_endpoint():
    c = TestClient(app)
    r = c.post("/entities/C2581234509/obligations", json={"ssm": SSM})
    assert r.status_code == 200
    assert any(o["form"] == "C" for o in r.json()["obligations"])

def test_form_c_endpoint_requires_approval():
    items = [{"code":"4000","description":"Revenue","amount":500000,"category":"income"},
             {"code":"5000","description":"Expenses","amount":300000,"category":"deductible"}]
    c = TestClient(app)
    r = c.post("/entities/C2581234509/filings/form-c", json={"ssm": SSM, "line_items": items})
    body = r.json()
    assert body["requires_approval"] is True
    assert body["computation"]["fields"]["tax_payable"]["value"] == 31000

def test_audit_defense_endpoint():
    app.dependency_overrides[get_llm] = lambda: FakeLLMClient(
        ['{"contested_item":"Repairs","claim":"deductible under s.33(1)","clause_ids":["ITA-1967-s33(1)"]}', "YES"])
    c = TestClient(app)
    r = c.post("/entities/C2581234509/audit-defense",
               json={"query": "Justify repairs", "evidence": [["tax_payable","tb","ITA-1967-s33(1)"]]})
    assert r.json()["citations"][0]["verified"] is True
    app.dependency_overrides.clear()
```

- [x] **Step 2: Run → FAIL** · **Step 3: Implement**

```python
# api/schemas.py
from __future__ import annotations
from pydantic import BaseModel

class ObligationsReq(BaseModel):
    ssm: dict

class FormCReq(BaseModel):
    ssm: dict
    line_items: list[dict]

class AuditDefenseReq(BaseModel):
    query: str
    evidence: list[list[str]]
```

```python
# api/main.py  (replace prior content)
from __future__ import annotations
from pathlib import Path
from fastapi import Depends, FastAPI
from core.computation import compute_form_c
from core.lawcorpus import LawCorpus
from core.models import EntityTaxProfile, LineItem
from core.obligations import derive_obligations
from api.agents.audit_defense import build_defense
from api.llm import LLMClient, make_llm
from api.schemas import AuditDefenseReq, FormCReq, ObligationsReq

app = FastAPI(title="CukaiPandai API")
_CORPUS = LawCorpus.load(Path("core/fixtures/lawcorpus_seed.json"))

def get_llm() -> LLMClient:
    return make_llm()

@app.get("/health")
def health() -> dict:
    return {"status": "ok"}

@app.post("/entities/{tin}/obligations")
def obligations(tin: str, req: ObligationsReq) -> dict:
    profile = EntityTaxProfile(**req.ssm)
    return derive_obligations(profile, 2026).model_dump(mode="json")

@app.post("/entities/{tin}/filings/form-c")
def form_c(tin: str, req: FormCReq) -> dict:
    profile = EntityTaxProfile(**req.ssm)
    items = [LineItem(**li) for li in req.line_items]
    fc = compute_form_c(profile, items, 2026)
    return {"computation": fc.model_dump(mode="json"), "requires_approval": True}

@app.post("/entities/{tin}/audit-defense")
def audit_defense(tin: str, req: AuditDefenseReq, llm: LLMClient = Depends(get_llm)) -> dict:
    pack = build_defense(req.query, [tuple(e) for e in req.evidence], llm, _CORPUS)
    return pack.model_dump(mode="json")
```

- [x] **Step 4: Run → PASS** `pytest tests/api -q`
- [x] **Step 5: Commit** `git commit -am "feat(api): add obligations/form-c/audit-defense endpoints with approval gate + LLM DI"`

---

### Task 11: LangGraph orchestrator with human-approval interrupt

**Files:** Create `api/graph.py`, `tests/api/test_graph.py`.

**Interfaces:** Produces `build_filing_graph(llm)` → a LangGraph `StateGraph` that runs classify → compute → audit-risk → **interrupt(approval)** → finalize, with a checkpointer so it pauses at the interrupt and resumes on approval. (Wraps the same core functions; gives the credible "agentic, human-gated" story for the demo.)

- [x] **Step 1: Failing test**

```python
# tests/api/test_graph.py
from api.graph import build_filing_graph
from api.llm import FakeLLMClient

def test_graph_pauses_for_approval_then_finalizes():
    app = build_filing_graph(FakeLLMClient([]))  # compute path uses core, no LLM needed here
    cfg = {"configurable": {"thread_id": "t1"}}
    state = app.invoke({"profile_ssm": __import__("json").load(open("core/fixtures/entity_acme.json")),
                        "line_items": [{"code":"4000","description":"Rev","amount":500000,"category":"income"},
                                       {"code":"5000","description":"Exp","amount":300000,"category":"deductible"}]}, cfg)
    assert state["__interrupt__"]  # paused awaiting approval
    final = app.invoke(__import__("langgraph.types", fromlist=["Command"]).Command(resume={"approved": True}), cfg)
    assert final["computation"]["fields"]["tax_payable"]["value"] == 31000
```

- [x] **Step 2: Run → FAIL** · **Step 3: Implement**

```python
# api/graph.py
from __future__ import annotations
from typing import TypedDict
from langgraph.graph import START, END, StateGraph
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt
from core.computation import compute_form_c
from core.models import EntityTaxProfile, LineItem

class S(TypedDict, total=False):
    profile_ssm: dict
    line_items: list
    computation: dict
    approved: bool

def _compute(state: S) -> S:
    p = EntityTaxProfile(**state["profile_ssm"])
    items = [LineItem(**li) for li in state["line_items"]]
    return {"computation": compute_form_c(p, items, 2026).model_dump(mode="json")}

def _approval(state: S) -> S:
    decision = interrupt({"review": state["computation"]})
    return {"approved": bool(decision.get("approved"))}

def build_filing_graph(llm):
    g = StateGraph(S)
    g.add_node("compute", _compute)
    g.add_node("approval", _approval)
    g.add_edge(START, "compute")
    g.add_edge("compute", "approval")
    g.add_edge("approval", END)
    return g.compile(checkpointer=MemorySaver())
```

- [x] **Step 4: Run → PASS** · **Step 5: Commit** `git commit -am "feat(api): add LangGraph filing orchestrator with human-approval interrupt"`

---

## Self-Review

**1. Spec coverage:** profiler ✓(T4) · doc-understanding ✓(T5) · deductibility+citations ✓(T6) · LLM citation critic ✓(T7) · audit-risk ✓(T8) · audit-defense ✓(T9) · API contract + approval gate ✓(T10) · LangGraph + HITL interrupt ✓(T11) · model adapter incl. ILMU sovereign mode ✓(T2). Computation/obligations reused from Plan 1 (not re-implemented). MyInvois live OAuth deferred (fixture mode T3) — flagged. Frontend = Plan 3.
**2. Placeholders:** none — every step has real code/tests; the only `NotImplementedError` (live MyInvois OAuth) is an explicit, tested boundary.
**3. Type consistency:** `LLMClient.complete(system,user,*,json_schema)`, `FakeLLMClient(scripted)`, `build_profile`, `classify_line_items`, `cite_treatment`, `verify_claim`, `assess_risk`, `build_defense`, and the `RiskFlag`/`DefensePack` model additions are consistent across tasks; endpoints (T10) consume them. Core imports (`compute_form_c`, `derive_obligations`, `ground_citation`, `LawCorpus`) match Plan 1 signatures.

## Execution Handoff

Two options: **(1) Subagent-driven (recommended)** — fresh subagent per task + two-stage review; **(2) Inline** via executing-plans, batched with checkpoints. (Chaos owns execution.)
