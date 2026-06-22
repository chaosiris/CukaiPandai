# CukaiPandai Deterministic Core — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the stack-independent, deterministic Python core of CukaiPandai — the obligation rules engine, tax computation engine, law/citation store, evidence vault, and seeded data — with every tax figure traceable and TDD-verified.

**Architecture:** A pure-Python package `core` (no web framework, no LLM, no cloud) that any backend (FastAPI/ADK/etc.) can import. Tax rules/rates/deadlines are versioned config keyed to Year of Assessment (YA); engines are deterministic and emit a full computation trace; the LLM/agent layer (Plan 2) calls into this core but never replaces its math.

**Tech Stack:** Python 3.12, Pydantic v2, PyYAML, pytest. (Stack-independent core — Plans 2/3 add FastAPI + model adapter + Next.js once the team confirms the stack.)

## Global Constraints
- **Determinism:** rates/bands/thresholds/deadlines come ONLY from versioned config; no figure is hardcoded in logic and no LLM is called in this package.
- **Traceability:** every computed figure carries `FigureTrace{value, inputs, rule_id, config_version}`.
- **YA-keyed config:** all tax parameters are keyed by Year of Assessment; an unknown YA raises, never guesses.
- **⚠verify figures:** YA2026 numbers below are research-grounded but must be reconciled vs LHDN before the deck (see `docs/superpowers/research/2026-06-19-tax-obligation-determination.md`). Encoded as config so a correction = a config edit, not a code change.
- **No network/secrets** in this package.
- **Execution note:** the CukaiPandai git repo does not exist yet; at execution time `git init` in the repo first, then the per-task `git commit` steps apply. Do not commit into the NexHack scratch dir.

## File Structure
```
core/
  __init__.py
  models.py            # Pydantic models (T2)
  config/
    ya_2026.yaml        # rates/bands/thresholds/obligation rules for YA2026 (T3)
  config_loader.py     # load + validate YA config (T3)
  obligations.py       # Obligation Rules Engine (T4)
  deadlines.py         # deadline calculator + holiday shift (T5)
  computation.py       # Tax Computation Engine — Form C (T6)
  lawcorpus.py         # clause store loader + lookup (T7)
  citations.py         # deterministic citation grounding/verifier (T8)
  evidence.py          # Evidence Vault + append-only audit log (T9)
  fixtures/
    entity_acme.json     # seeded synthetic entity (SSM profile + employees etc.) (T10)
    trial_balance_acme.json
    myinvois_acme.json   # UBL-2.1-shaped e-invoice fixtures
    lawcorpus_seed.json  # curated ITA 1967 + Public Ruling clauses (T7)
pyproject.toml         # package + pytest config (T1)
tests/
  test_models.py · test_config_loader.py · test_obligations.py · test_deadlines.py
  test_computation.py · test_lawcorpus.py · test_citations.py · test_evidence.py
  test_integration_core.py
```

---

### Task 1: Package scaffold

**Files:**
- Create: `pyproject.toml`, `core/__init__.py`, `tests/test_smoke.py`

**Interfaces:**
- Produces: importable package `core` with `__version__: str`.

- [ ] **Step 1: Write the failing test**
```python
# tests/test_smoke.py
import core

def test_package_version():
    assert isinstance(core.__version__, str)
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pytest tests/test_smoke.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'core'`
- [ ] **Step 3: Write minimal implementation**
```toml
# pyproject.toml
[project]
name = "cukaipandai-core"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = ["pydantic>=2.7", "pyyaml>=6.0"]
[tool.pytest.ini_options]
pythonpath = ["."]
```
```python
# core/__init__.py
__version__ = "0.1.0"
```
- [ ] **Step 4: Run test to verify it passes**
Run: `pip install -e . && pytest tests/test_smoke.py -v`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add pyproject.toml core/__init__.py tests/test_smoke.py
git commit -m "chore: scaffold core package"
```

---

### Task 2: Core domain models

**Files:**
- Create: `core/models.py`
- Test: `tests/test_models.py`

**Interfaces:**
- Produces:
  - `EntityTaxProfile{tin:str, entity_type:str, msic_codes:list[str], paid_up_capital:float, gross_income:float, employee_count:int, sst_registered:bool, basis_period_start:date, basis_period_end:date, commencement_date:date|None}`
  - `Obligation{obligation_type:str, form:str, due_date:date, rule_id:str, config_version:str, status:str="pending"}`
  - `ObligationCalendar{entity_tin:str, obligations:list[Obligation]}`
  - `LineItem{code:str, description:str, amount:float, category:str}`
  - `FigureTrace{value:float, inputs:list[str], rule_id:str, config_version:str}`
  - `FormComputation{form:str, fields:dict[str,FigureTrace]}`
  - `Clause{clause_id:str, text:str, source:str}`
  - `Citation{claim:str, clause_ids:list[str], verified:bool=False}`

- [ ] **Step 1: Write the failing test**
```python
# tests/test_models.py
from datetime import date
from core.models import EntityTaxProfile, FigureTrace, FormComputation

def test_entity_profile_roundtrip():
    p = EntityTaxProfile(tin="C123", entity_type="sdn_bhd", msic_codes=["46900"],
        paid_up_capital=1_000_000, gross_income=8_000_000, employee_count=20,
        sst_registered=False, basis_period_start=date(2025,1,1),
        basis_period_end=date(2025,12,31), commencement_date=date(2018,3,1))
    assert p.entity_type == "sdn_bhd"

def test_form_computation_holds_traces():
    fc = FormComputation(form="C", fields={"tax_payable": FigureTrace(
        value=100.0, inputs=["chargeable_income"], rule_id="cit.rate.sme", config_version="YA2026.1")})
    assert fc.fields["tax_payable"].rule_id == "cit.rate.sme"
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pytest tests/test_models.py -v`
Expected: FAIL — `ModuleNotFoundError: core.models`
- [ ] **Step 3: Write minimal implementation**
```python
# core/models.py
from __future__ import annotations
from datetime import date
from pydantic import BaseModel

class EntityTaxProfile(BaseModel):
    tin: str
    entity_type: str
    msic_codes: list[str]
    paid_up_capital: float
    gross_income: float
    employee_count: int
    sst_registered: bool
    basis_period_start: date
    basis_period_end: date
    commencement_date: date | None = None

class Obligation(BaseModel):
    obligation_type: str
    form: str
    due_date: date
    rule_id: str
    config_version: str
    status: str = "pending"

class ObligationCalendar(BaseModel):
    entity_tin: str
    obligations: list[Obligation]

class LineItem(BaseModel):
    code: str
    description: str
    amount: float
    category: str

class FigureTrace(BaseModel):
    value: float
    inputs: list[str]
    rule_id: str
    config_version: str

class FormComputation(BaseModel):
    form: str
    fields: dict[str, FigureTrace]

class Clause(BaseModel):
    clause_id: str
    text: str
    source: str

class Citation(BaseModel):
    claim: str
    clause_ids: list[str]
    verified: bool = False
```
- [ ] **Step 4: Run test to verify it passes**
Run: `pytest tests/test_models.py -v`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add core/models.py tests/test_models.py
git commit -m "feat: add core domain models"
```

---

### Task 3: YA config + loader

**Files:**
- Create: `core/config/ya_2026.yaml`, `core/config_loader.py`
- Test: `tests/test_config_loader.py`

**Interfaces:**
- Produces: `load_ya_config(ya:int) -> dict` (raises `ValueError` for unknown YA); config dict has keys `version, income_tax{sme_paidup_max, sme_gross_max, sme_bands:[{upto,rate}], non_sme_rate}, einvoice_phases:[{min_turnover,max_turnover,mandatory_from}], sst{registration_threshold}`.

- [ ] **Step 1: Write the failing test**
```python
# tests/test_config_loader.py
import pytest
from core.config_loader import load_ya_config

def test_loads_ya2026():
    cfg = load_ya_config(2026)
    assert cfg["version"].startswith("YA2026")
    assert cfg["income_tax"]["non_sme_rate"] == 0.24

def test_unknown_ya_raises():
    with pytest.raises(ValueError):
        load_ya_config(1999)
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pytest tests/test_config_loader.py -v`
Expected: FAIL — `ModuleNotFoundError: core.config_loader`
- [ ] **Step 3: Write minimal implementation**
```yaml
# core/config/ya_2026.yaml   (⚠verify all figures vs LHDN)
version: "YA2026.1"
income_tax:
  sme_paidup_max: 2500000
  sme_gross_max: 50000000
  sme_bands:
    - {upto: 150000, rate: 0.15}
    - {upto: 600000, rate: 0.17}   # next RM450k (150k->600k)
    - {upto: null,  rate: 0.24}
  non_sme_rate: 0.24
einvoice_phases:
  - {min_turnover: 100000000, max_turnover: null,      mandatory_from: "2024-08-01"}
  - {min_turnover: 25000000,  max_turnover: 100000000, mandatory_from: "2025-01-01"}
  - {min_turnover: 5000000,   max_turnover: 25000000,  mandatory_from: "2025-07-01"}
  - {min_turnover: 1000000,   max_turnover: 5000000,   mandatory_from: "2026-01-01"}
sst:
  registration_threshold: 500000
```
```python
# core/config_loader.py
from __future__ import annotations
from pathlib import Path
import yaml

_CONFIG_DIR = Path(__file__).parent / "config"

def load_ya_config(ya: int) -> dict:
    path = _CONFIG_DIR / f"ya_{ya}.yaml"
    if not path.exists():
        raise ValueError(f"No tax config for YA{ya}")
    return yaml.safe_load(path.read_text(encoding="utf-8"))
```
- [ ] **Step 4: Run test to verify it passes**
Run: `pytest tests/test_config_loader.py -v`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add core/config/ya_2026.yaml core/config_loader.py tests/test_config_loader.py
git commit -m "feat: add YA2026 tax config and loader"
```

---

### Task 4: Obligation Rules Engine

**Files:**
- Create: `core/obligations.py`
- Test: `tests/test_obligations.py`

**Interfaces:**
- Consumes: `EntityTaxProfile` (T2), `load_ya_config` (T3), `compute_form_c_deadline`/`compute_cp204_deadline` (T5 — import lazily; for T4 use `date` placeholders via deadline module).
- Produces: `derive_obligations(profile:EntityTaxProfile, ya:int) -> ObligationCalendar`. Emits obligation_types from {`income_tax`,`einvoice`,`sst`,`employer_mtd`} per rules: income_tax always (form "C" + "CP204"); einvoice if `gross_income >= phase.min_turnover`; sst if `sst_registered`; employer_mtd if `employee_count>0`.

- [ ] **Step 1: Write the failing test**
```python
# tests/test_obligations.py
from datetime import date
from core.models import EntityTaxProfile
from core.obligations import derive_obligations

def _profile(**kw):
    base = dict(tin="C1", entity_type="sdn_bhd", msic_codes=["46900"],
        paid_up_capital=1_000_000, gross_income=8_000_000, employee_count=20,
        sst_registered=True, basis_period_start=date(2025,1,1),
        basis_period_end=date(2025,12,31), commencement_date=date(2018,3,1))
    base.update(kw); return EntityTaxProfile(**base)

def test_full_profile_derives_all():
    cal = derive_obligations(_profile(), 2026)
    types = {o.obligation_type for o in cal.obligations}
    assert {"income_tax","einvoice","sst","employer_mtd"} <= types

def test_no_employees_no_sst():
    cal = derive_obligations(_profile(employee_count=0, sst_registered=False, gross_income=200_000), 2026)
    types = {o.obligation_type for o in cal.obligations}
    assert "employer_mtd" not in types and "sst" not in types and "einvoice" not in types
    assert "income_tax" in types
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pytest tests/test_obligations.py -v`
Expected: FAIL — `ModuleNotFoundError: core.obligations`
- [ ] **Step 3: Write minimal implementation**
```python
# core/obligations.py
from __future__ import annotations
from core.models import EntityTaxProfile, Obligation, ObligationCalendar
from core.config_loader import load_ya_config
from core.deadlines import form_c_deadline, cp204_deadline

def derive_obligations(profile: EntityTaxProfile, ya: int) -> ObligationCalendar:
    cfg = load_ya_config(ya); ver = cfg["version"]; obs: list[Obligation] = []
    obs.append(Obligation(obligation_type="income_tax", form="C",
        due_date=form_c_deadline(profile.basis_period_end), rule_id="oblig.income_tax.formc", config_version=ver))
    obs.append(Obligation(obligation_type="income_tax", form="CP204",
        due_date=cp204_deadline(profile.basis_period_start, profile.commencement_date),
        rule_id="oblig.income_tax.cp204", config_version=ver))
    if any(profile.gross_income >= p["min_turnover"] for p in cfg["einvoice_phases"]):
        obs.append(Obligation(obligation_type="einvoice", form="MyInvois",
            due_date=profile.basis_period_start, rule_id="oblig.einvoice.phase", config_version=ver))
    if profile.sst_registered:
        obs.append(Obligation(obligation_type="sst", form="SST-02",
            due_date=profile.basis_period_end, rule_id="oblig.sst.return", config_version=ver))
    if profile.employee_count > 0:
        obs.append(Obligation(obligation_type="employer_mtd", form="CP39",
            due_date=profile.basis_period_start, rule_id="oblig.employer.mtd", config_version=ver))
    return ObligationCalendar(entity_tin=profile.tin, obligations=obs)
```
- [ ] **Step 4: Run test to verify it passes**
Run: `pytest tests/test_obligations.py -v`
Expected: PASS (requires Task 5's `deadlines.py`; implement T5 first or stub `form_c_deadline`/`cp204_deadline` then replace)
- [ ] **Step 5: Commit**
```bash
git add core/obligations.py tests/test_obligations.py
git commit -m "feat: add obligation rules engine"
```

---

### Task 5: Deadline calculator

**Files:**
- Create: `core/deadlines.py`
- Test: `tests/test_deadlines.py`

**Interfaces:**
- Produces:
  - `form_c_deadline(fye:date) -> date` — last day of the 7th month after FYE.
  - `cp204_deadline(basis_start:date, commencement:date|None) -> date` — `commencement+3 months` if commenced within this basis period, else `basis_start - 30 days`.
  - `shift_for_holidays(d:date, holidays:set[date]) -> date` — push to next non-weekend, non-holiday day.

- [ ] **Step 1: Write the failing test**
```python
# tests/test_deadlines.py
from datetime import date
from core.deadlines import form_c_deadline, cp204_deadline, shift_for_holidays

def test_form_c_seven_months_after_fye():
    assert form_c_deadline(date(2025,12,31)) == date(2026,7,31)

def test_cp204_30_days_before_basis():
    assert cp204_deadline(date(2025,1,1), date(2018,3,1)) == date(2024,12,2)

def test_shift_skips_weekend_and_holiday():
    # 2026-07-31 is a Friday; make it + Sat/Sun + Mon holiday -> Tue 2026-08-04
    assert shift_for_holidays(date(2026,7,31), {date(2026,8,3)}) == date(2026,7,31)  # Fri is fine
    assert shift_for_holidays(date(2026,8,1), {date(2026,8,3)}) == date(2026,8,4)    # Sat->skip Sun->skip Mon(hol)->Tue
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pytest tests/test_deadlines.py -v`
Expected: FAIL — `ModuleNotFoundError: core.deadlines`
- [ ] **Step 3: Write minimal implementation**
```python
# core/deadlines.py
from __future__ import annotations
from datetime import date, timedelta
import calendar

def _add_months(d: date, months: int) -> date:
    m = d.month - 1 + months; y = d.year + m // 12; m = m % 12 + 1
    return date(y, m, min(d.day, calendar.monthrange(y, m)[1]))

def form_c_deadline(fye: date) -> date:
    seventh = _add_months(fye.replace(day=1), 7)
    return date(seventh.year, seventh.month, calendar.monthrange(seventh.year, seventh.month)[1])

def cp204_deadline(basis_start: date, commencement: date | None) -> date:
    if commencement and basis_start <= commencement <= _add_months(basis_start, 12):
        return _add_months(commencement, 3)
    return basis_start - timedelta(days=30)

def shift_for_holidays(d: date, holidays: set[date]) -> date:
    while d.weekday() >= 5 or d in holidays:
        d += timedelta(days=1)
    return d
```
- [ ] **Step 4: Run test to verify it passes**
Run: `pytest tests/test_deadlines.py -v`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add core/deadlines.py tests/test_deadlines.py
git commit -m "feat: add deadline calculator with holiday shift"
```

---

### Task 6: Tax Computation Engine (Form C)

**Files:**
- Create: `core/computation.py`
- Test: `tests/test_computation.py`

**Interfaces:**
- Consumes: `EntityTaxProfile` (T2), `LineItem` (T2), `load_ya_config` (T3).
- Produces:
  - `is_sme(profile, cfg) -> bool`
  - `chargeable_income(items:list[LineItem]) -> FigureTrace` (sum of category=="income" minus category=="deductible").
  - `tax_payable(chargeable:float, profile, cfg) -> FigureTrace` (apply SME bands or flat non-SME rate).
  - `compute_form_c(profile, items, ya) -> FormComputation` with fields `chargeable_income`, `tax_payable`.

- [ ] **Step 1: Write the failing test**
```python
# tests/test_computation.py
from datetime import date
from core.models import EntityTaxProfile, LineItem
from core.computation import compute_form_c

def _p(**kw):
    b=dict(tin="C1",entity_type="sdn_bhd",msic_codes=["46900"],paid_up_capital=1_000_000,
        gross_income=500_000,employee_count=5,sst_registered=False,
        basis_period_start=date(2025,1,1),basis_period_end=date(2025,12,31),commencement_date=date(2018,3,1))
    b.update(kw); return EntityTaxProfile(**b)

def test_sme_band_computation_golden():
    items=[LineItem(code="rev",description="Revenue",amount=500_000,category="income"),
           LineItem(code="exp",description="Allowable expenses",amount=300_000,category="deductible")]
    fc=compute_form_c(_p(), items, 2026)
    # chargeable 200,000 -> 15% on 150k (22,500) + 17% on next 50k (8,500) = 31,000
    assert fc.fields["chargeable_income"].value == 200_000
    assert fc.fields["tax_payable"].value == 31_000
    assert fc.fields["tax_payable"].config_version == "YA2026.1"

def test_non_sme_flat_rate():
    items=[LineItem(code="rev",description="Revenue",amount=1_000_000,category="income")]
    fc=compute_form_c(_p(paid_up_capital=5_000_000, gross_income=80_000_000), items, 2026)
    assert fc.fields["tax_payable"].value == 240_000  # 24% flat
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pytest tests/test_computation.py -v`
Expected: FAIL — `ModuleNotFoundError: core.computation`
- [ ] **Step 3: Write minimal implementation**
```python
# core/computation.py
from __future__ import annotations
from core.models import EntityTaxProfile, LineItem, FigureTrace, FormComputation
from core.config_loader import load_ya_config

def is_sme(profile: EntityTaxProfile, cfg: dict) -> bool:
    it = cfg["income_tax"]
    return profile.paid_up_capital <= it["sme_paidup_max"] and profile.gross_income <= it["sme_gross_max"]

def chargeable_income(items: list[LineItem]) -> FigureTrace:
    inc = sum(i.amount for i in items if i.category == "income")
    ded = sum(i.amount for i in items if i.category == "deductible")
    return FigureTrace(value=inc - ded, inputs=["income","deductible"],
                       rule_id="cit.chargeable_income", config_version="")

def tax_payable(chargeable: float, profile: EntityTaxProfile, cfg: dict) -> FigureTrace:
    it = cfg["income_tax"]
    if not is_sme(profile, cfg):
        return FigureTrace(value=round(chargeable*it["non_sme_rate"],2), inputs=["chargeable_income"],
                           rule_id="cit.rate.non_sme", config_version=cfg["version"])
    tax=0.0; prev=0.0; remaining=chargeable
    for band in it["sme_bands"]:
        cap = band["upto"]
        slab = (remaining if cap is None else min(remaining, cap-prev))
        if slab <= 0: break
        tax += slab*band["rate"]; remaining -= slab; prev = cap if cap else prev
        if cap is None: break
    return FigureTrace(value=round(tax,2), inputs=["chargeable_income"],
                       rule_id="cit.rate.sme", config_version=cfg["version"])

def compute_form_c(profile: EntityTaxProfile, items: list[LineItem], ya: int) -> FormComputation:
    cfg = load_ya_config(ya)
    ci = chargeable_income(items); ci.config_version = cfg["version"]
    tp = tax_payable(ci.value, profile, cfg)
    return FormComputation(form="C", fields={"chargeable_income": ci, "tax_payable": tp})
```
- [ ] **Step 4: Run test to verify it passes**
Run: `pytest tests/test_computation.py -v`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add core/computation.py tests/test_computation.py
git commit -m "feat: add Form C tax computation engine with traces"
```

---

### Task 7: Law corpus + clause store

**Files:**
- Create: `core/lawcorpus.py`, `core/fixtures/lawcorpus_seed.json`
- Test: `tests/test_lawcorpus.py`

**Interfaces:**
- Produces: `LawCorpus.load(path) -> LawCorpus`; `LawCorpus.get(clause_id) -> Clause|None`; `LawCorpus.exists(clause_id) -> bool`. Seed contains real clause IDs e.g. `ITA-1967-s33(1)` (general deductions), `ITA-1967-s39` (non-deductibles), `ITA-1967-s107C` (CP204), `ITA-1967-s112`, `ITA-1967-s113`.

- [ ] **Step 1: Write the failing test**
```python
# tests/test_lawcorpus.py
from pathlib import Path
from core.lawcorpus import LawCorpus

CORPUS = Path("core/fixtures/lawcorpus_seed.json")

def test_known_clause_exists():
    c = LawCorpus.load(CORPUS)
    assert c.exists("ITA-1967-s33(1)")
    assert "deduct" in c.get("ITA-1967-s33(1)").text.lower()

def test_unknown_clause_absent():
    c = LawCorpus.load(CORPUS)
    assert not c.exists("ITA-1967-s999(fake)")
    assert c.get("ITA-1967-s999(fake)") is None
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pytest tests/test_lawcorpus.py -v`
Expected: FAIL — `ModuleNotFoundError: core.lawcorpus`
- [ ] **Step 3: Write minimal implementation**
```json
// core/fixtures/lawcorpus_seed.json   (⚠verify wording vs ITA 1967)
[
  {"clause_id":"ITA-1967-s33(1)","source":"Income Tax Act 1967 s.33(1)","text":"Adjusted income: deductions wholly and exclusively incurred in the production of gross income are allowable."},
  {"clause_id":"ITA-1967-s39","source":"Income Tax Act 1967 s.39","text":"Deductions not allowed, including certain private and capital expenditure and a portion of entertainment expenditure."},
  {"clause_id":"ITA-1967-s107C","source":"Income Tax Act 1967 s.107C","text":"Estimate of tax payable (CP204) and payment by monthly instalments."},
  {"clause_id":"ITA-1967-s112","source":"Income Tax Act 1967 s.112","text":"Penalty for failure to furnish return or give notice of chargeability."},
  {"clause_id":"ITA-1967-s113","source":"Income Tax Act 1967 s.113","text":"Penalty for incorrect returns or understatement of income."}
]
```
```python
# core/lawcorpus.py
from __future__ import annotations
from pathlib import Path
import json
from core.models import Clause

class LawCorpus:
    def __init__(self, clauses: dict[str, Clause]): self._c = clauses
    @classmethod
    def load(cls, path: Path) -> "LawCorpus":
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        return cls({c["clause_id"]: Clause(**c) for c in data})
    def get(self, clause_id: str) -> Clause | None: return self._c.get(clause_id)
    def exists(self, clause_id: str) -> bool: return clause_id in self._c
```
- [ ] **Step 4: Run test to verify it passes**
Run: `pytest tests/test_lawcorpus.py -v`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add core/lawcorpus.py core/fixtures/lawcorpus_seed.json tests/test_lawcorpus.py
git commit -m "feat: add law corpus clause store with ITA seed"
```

---

### Task 8: Deterministic citation grounding

**Files:**
- Create: `core/citations.py`
- Test: `tests/test_citations.py`

**Interfaces:**
- Consumes: `Citation` (T2), `LawCorpus` (T7).
- Produces: `ground_citation(citation:Citation, corpus:LawCorpus) -> Citation` — sets `verified=True` ONLY if every `clause_id` exists in corpus; else `verified=False`. (The semantic "does the clause support the claim" LLM-critic is Plan 2; this is the deterministic existence gate it builds on.)

- [ ] **Step 1: Write the failing test**
```python
# tests/test_citations.py
from pathlib import Path
from core.models import Citation
from core.lawcorpus import LawCorpus
from core.citations import ground_citation

C = LawCorpus.load(Path("core/fixtures/lawcorpus_seed.json"))

def test_real_clauses_verified():
    cit = ground_citation(Citation(claim="Repairs deductible under s.33(1)", clause_ids=["ITA-1967-s33(1)"]), C)
    assert cit.verified is True

def test_planted_fake_citation_rejected():
    cit = ground_citation(Citation(claim="bogus", clause_ids=["ITA-1967-s33(1)","ITA-1967-s999(fake)"]), C)
    assert cit.verified is False
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pytest tests/test_citations.py -v`
Expected: FAIL — `ModuleNotFoundError: core.citations`
- [ ] **Step 3: Write minimal implementation**
```python
# core/citations.py
from __future__ import annotations
from core.models import Citation
from core.lawcorpus import LawCorpus

def ground_citation(citation: Citation, corpus: LawCorpus) -> Citation:
    citation.verified = bool(citation.clause_ids) and all(corpus.exists(cid) for cid in citation.clause_ids)
    return citation
```
- [ ] **Step 4: Run test to verify it passes**
Run: `pytest tests/test_citations.py -v`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add core/citations.py tests/test_citations.py
git commit -m "feat: add deterministic citation grounding gate"
```

---

### Task 9: Evidence Vault + audit log

**Files:**
- Create: `core/evidence.py`
- Test: `tests/test_evidence.py`

**Interfaces:**
- Produces: `EvidenceVault(db_path=":memory:")` with `link(figure_id, document_id, clause_id)`, `links_for(figure_id) -> list[tuple]`, `log_action(actor, action, payload_hash)`, `audit_trail() -> list[dict]`. Audit log is append-only (no update/delete API).

- [ ] **Step 1: Write the failing test**
```python
# tests/test_evidence.py
from core.evidence import EvidenceVault

def test_link_and_retrieve():
    v = EvidenceVault()
    v.link("tax_payable", "trial_balance_acme", "ITA-1967-s33(1)")
    assert ("trial_balance_acme","ITA-1967-s33(1)") in v.links_for("tax_payable")

def test_audit_log_appends_in_order():
    v = EvidenceVault()
    v.log_action("agent:computation","compute_form_c","h1")
    v.log_action("human:controller","approve","h2")
    trail = v.audit_trail()
    assert [t["action"] for t in trail] == ["compute_form_c","approve"]
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pytest tests/test_evidence.py -v`
Expected: FAIL — `ModuleNotFoundError: core.evidence`
- [ ] **Step 3: Write minimal implementation**
```python
# core/evidence.py
from __future__ import annotations
import sqlite3

class EvidenceVault:
    def __init__(self, db_path: str = ":memory:"):
        self._c = sqlite3.connect(db_path)
        self._c.execute("CREATE TABLE IF NOT EXISTS links(figure_id TEXT, document_id TEXT, clause_id TEXT)")
        self._c.execute("CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT, action TEXT, payload_hash TEXT)")
        self._c.commit()
    def link(self, figure_id: str, document_id: str, clause_id: str) -> None:
        self._c.execute("INSERT INTO links VALUES(?,?,?)", (figure_id, document_id, clause_id)); self._c.commit()
    def links_for(self, figure_id: str) -> list[tuple]:
        return [(d, c) for d, c in self._c.execute("SELECT document_id,clause_id FROM links WHERE figure_id=?", (figure_id,))]
    def log_action(self, actor: str, action: str, payload_hash: str) -> None:
        self._c.execute("INSERT INTO audit(actor,action,payload_hash) VALUES(?,?,?)", (actor, action, payload_hash)); self._c.commit()
    def audit_trail(self) -> list[dict]:
        rows = self._c.execute("SELECT actor,action,payload_hash FROM audit ORDER BY id")
        return [{"actor": a, "action": ac, "payload_hash": h} for a, ac, h in rows]
```
- [ ] **Step 4: Run test to verify it passes**
Run: `pytest tests/test_evidence.py -v`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add core/evidence.py tests/test_evidence.py
git commit -m "feat: add evidence vault and append-only audit log"
```

---

### Task 10: Seeded entity + end-to-end core integration

**Files:**
- Create: `core/fixtures/entity_acme.json`, `trial_balance_acme.json`, `myinvois_acme.json`
- Test: `tests/test_integration_core.py`

**Interfaces:**
- Consumes: all prior modules.
- Produces: proves `profile → derive_obligations → compute_form_c → ground_citation → evidence` runs deterministically (no LLM) on the seeded entity and yields the golden figures.

- [ ] **Step 1: Write the failing test**
```python
# tests/test_integration_core.py
import json
from pathlib import Path
from core.models import EntityTaxProfile, LineItem, Citation
from core.obligations import derive_obligations
from core.computation import compute_form_c
from core.lawcorpus import LawCorpus
from core.citations import ground_citation
from core.evidence import EvidenceVault

def test_core_end_to_end_golden():
    entity = json.loads(Path("core/fixtures/entity_acme.json").read_text())
    tb = json.loads(Path("core/fixtures/trial_balance_acme.json").read_text())
    profile = EntityTaxProfile(**entity)
    items = [LineItem(**li) for li in tb]
    cal = derive_obligations(profile, 2026)
    assert any(o.form == "C" for o in cal.obligations)
    fc = compute_form_c(profile, items, 2026)
    assert fc.fields["tax_payable"].value == 31_000  # golden (Acme: chargeable 200k SME)
    corpus = LawCorpus.load(Path("core/fixtures/lawcorpus_seed.json"))
    cit = ground_citation(Citation(claim="expenses deductible under s.33(1)", clause_ids=["ITA-1967-s33(1)"]), corpus)
    assert cit.verified
    v = EvidenceVault(); v.link("tax_payable","trial_balance_acme","ITA-1967-s33(1)")
    assert v.links_for("tax_payable")
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pytest tests/test_integration_core.py -v`
Expected: FAIL — fixtures missing → `FileNotFoundError`
- [ ] **Step 3: Write minimal implementation**
```json
// core/fixtures/entity_acme.json
{"tin":"C2581234509","entity_type":"sdn_bhd","msic_codes":["46900"],
 "paid_up_capital":1000000,"gross_income":500000,"employee_count":12,"sst_registered":true,
 "basis_period_start":"2025-01-01","basis_period_end":"2025-12-31","commencement_date":"2018-03-01"}
```
```json
// core/fixtures/trial_balance_acme.json
[{"code":"4000","description":"Revenue","amount":500000,"category":"income"},
 {"code":"5000","description":"Allowable operating expenses","amount":300000,"category":"deductible"}]
```
```json
// core/fixtures/myinvois_acme.json
[{"uuid":"INV-0001","supplier_tin":"C2581234509","buyer_tin":"C9990001112",
  "classification":"022","tax_type":"01","tax_amount":0,"total_excl_tax":120000,"total_incl_tax":120000}]
```
- [ ] **Step 4: Run test to verify it passes**
Run: `pytest -v`
Expected: PASS (all suites green)
- [ ] **Step 5: Commit**
```bash
git add core/fixtures/*.json tests/test_integration_core.py
git commit -m "test: add seeded entity and core end-to-end integration test"
```

---

## Self-Review

**1. Spec coverage:** Obligation Rules Engine ✓ (T4) · Tax Computation Engine + traces ✓ (T6) · YA-keyed config ✓ (T3) · law corpus + stable clause IDs ✓ (T7) · deterministic citation gate ✓ (T8, LLM-critic deferred to Plan 2 by design) · Evidence Vault + audit log ✓ (T9) · seeded data ✓ (T10) · deadlines/holiday-shift ✓ (T5). Deferred-by-plan (Plan 2/3, explicitly): LLM agents (profiler, doc-understanding, deductibility, audit-risk, audit-defense), FastAPI, model adapter, frontend. No in-scope core requirement is unassigned.
**2. Placeholder scan:** No "TBD/TODO/handle edge cases" — every code/test step has real code; ⚠verify markers point at *config values to confirm*, not missing implementation.
**3. Type consistency:** `EntityTaxProfile`, `LineItem`, `FigureTrace`, `FormComputation`, `Citation`, `Clause` names + fields are consistent T2→T10; `derive_obligations`, `compute_form_c`, `ground_citation`, `LawCorpus.exists/get`, `EvidenceVault.link/links_for/log_action/audit_trail` signatures match across tasks. Note: T4 imports T5's `form_c_deadline`/`cp204_deadline` — implement **T5 before T4** (or stub) — flagged in T4 Step 4.

## Notes for Plans 2 & 3
- **Plan 2 (Agent layer + API):** OpenAI-compatible model adapter (env: `MODEL_BASE_URL`, `MODEL_API_KEY`, `MODEL_NAME`; ILMU sovereign-mode = swap base_url/key); agents (profiler, doc-understanding, deductibility→produces `Citation`+`LineItem.category`, audit-risk, audit-defense→`DefensePack`); LLM citation-critic layered on T8's deterministic gate; FastAPI endpoints wrapping the core; MyInvois sandbox connector.
- **Plan 3 (Frontend):** Next.js — Obligation Calendar, Cited Filing Studio, Audit-Defense console. **Hold for the user's visual reference images + confirmed stack;** structure components so styling slots in without touching data/logic.
