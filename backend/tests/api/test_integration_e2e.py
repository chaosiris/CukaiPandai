"""Point 1 — full agentic pipeline end-to-end, no network, no API keys.

Drives the whole demo storyline on the seeded Acme entity using FakeLLMClient
(scripted, deterministic) + the FastAPI TestClient, so the demo is regression-locked
and runnable offline. The only thing this does NOT cover is a live-model smoke test
(provider keys required) — that is deferred until keys are available.
"""
from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient
from langgraph.types import Command

from core.citations import ground_citation
from core.computation import compute_form_c
from core.evidence import EvidenceVault
from core.lawcorpus import LawCorpus
from core.models import Citation, EntityTaxProfile, LineItem
from core.obligations import derive_obligations

from api.agents.audit_defense import build_defense
from api.agents.audit_risk import assess_risk
from api.agents.documents import classify_line_items
from api.agents.profiler import build_profile
from api.connectors.myinvois import MyInvoisClient
from api.graph import build_filing_graph
from api.llm import FakeLLMClient
from api.main import app, get_llm

_FIX = Path("core/fixtures")
SSM = json.loads((_FIX / "entity_acme.json").read_text())
CORPUS = LawCorpus.load(_FIX / "lawcorpus_seed.json")

# Scripted LLM output the document-understanding agent would return for the trial balance.
_LINE_ITEMS_JSON = (
    '[{"code":"rev_sales","description":"Revenue","amount":500000,"category":"income"},'
    '{"code":"cos_purchases","description":"Allowable operating expenses","amount":300000,"category":"deductible"}]'
)


def test_e2e_demo_pipeline_runs_offline():
    """profiler → obligations → documents → compute → audit-risk → audit-defense → evidence."""
    # 1. Profiler assembles the entity profile and derives turnover from MyInvois.
    myinvois = MyInvoisClient(str(_FIX / "myinvois_acme.json"))
    profile = build_profile(SSM, myinvois)
    assert profile.tin == "C2581234509"

    # 2. Obligation radar — the seeded mid-size SME owes income tax, e-invoice, SST, employer.
    calendar = derive_obligations(EntityTaxProfile(**SSM), 2026)
    types = {o.obligation_type for o in calendar.obligations}
    assert {"income_tax", "einvoice", "sst", "employer_mtd"} <= types
    assert any(o.form == "C" for o in calendar.obligations)

    # 3. Document understanding — classify the trial balance into line items.
    items = classify_line_items("...trial balance text...", FakeLLMClient([_LINE_ITEMS_JSON]))
    assert [i.category for i in items] == ["income", "deductible"]

    # 4. Cited filing — deterministic Form C, golden figure.
    fc = compute_form_c(EntityTaxProfile(**SSM), items, 2026)
    assert fc.fields["chargeable_income"].value == 200_000
    assert fc.fields["tax_payable"].value == 31_000

    # 5. Audit-risk pre-flight — MyInvois (RM120k) vs declared gross is a turnover mismatch.
    turnover = myinvois.derive_turnover(myinvois.search_documents(SSM["tin"]), SSM["tin"])
    flags = assess_risk(fc, profile=None, declared_income=SSM["gross_income"], myinvois_turnover=turnover)
    assert any(f.code == "turnover_mismatch" for f in flags)

    # 6. Audit-defense — cited pack mapped to s.33(1), with penalty exposure note.
    defense_llm = FakeLLMClient([
        '{"contested_item":"Repairs RM4,800","claim":"deductible under s.33(1)","clause_ids":["ITA-1967-s33(1)"]}',
        "YES",
    ])
    pack = build_defense(
        "Justify your RM4,800 repairs deduction",
        evidence=[("tax_payable", "trial_balance_acme", "ITA-1967-s33(1)")],
        llm=defense_llm, corpus=CORPUS,
    )
    assert pack.citations[0].verified is True
    assert "s.112" in pack.exposure_note or "s.113" in pack.exposure_note

    # 7. Evidence vault — figure linked to its source doc + clause, audit trail recorded.
    vault = EvidenceVault()
    vault.link("tax_payable", "trial_balance_acme", "ITA-1967-s33(1)")
    vault.log_action("agent:computation", "compute_form_c", "h1")
    vault.log_action("human:controller", "approve", "h2")
    assert ("trial_balance_acme", "ITA-1967-s33(1)") in vault.links_for("tax_payable")
    assert [t["action"] for t in vault.audit_trail()] == ["compute_form_c", "approve"]


def test_e2e_fake_citation_is_rejected():
    """The integrity gate: a fabricated clause never passes, even end-to-end."""
    cit = ground_citation(Citation(claim="bogus", clause_ids=["ITA-1967-s999(fake)"]), CORPUS)
    assert cit.verified is False

    pack = build_defense(
        "Justify a deduction with a made-up clause",
        evidence=[],
        llm=FakeLLMClient(['{"contested_item":"X","claim":"bogus","clause_ids":["ITA-1967-s999(fake)"]}']),
        corpus=CORPUS,
    )
    assert pack.citations[0].verified is False


def test_e2e_filing_graph_pauses_for_human_then_finalizes():
    """LangGraph orchestrator stops at the human-approval interrupt, resumes to the golden figure."""
    graph = build_filing_graph(FakeLLMClient([]))
    cfg = {"configurable": {"thread_id": "e2e-1"}}
    items = [
        {"code": "4000", "description": "Revenue", "amount": 500000, "category": "income"},
        {"code": "5000", "description": "Expenses", "amount": 300000, "category": "deductible"},
    ]
    paused = graph.invoke({"profile_ssm": SSM, "line_items": items}, cfg)
    assert paused["__interrupt__"]  # halted awaiting approval

    final = graph.invoke(Command(resume={"approved": True}), cfg)
    assert final["approved"] is True
    assert final["computation"]["fields"]["tax_payable"]["value"] == 31_000


def test_e2e_through_fastapi_endpoints():
    """Same storyline across the HTTP contract Tuna builds against."""
    client = TestClient(app)

    r = client.post("/entities/C2581234509/obligations", json={"ssm": SSM})
    assert r.status_code == 200
    forms = {o["obligation_type"] for o in r.json()["obligations"]}
    assert {"income_tax", "einvoice", "sst", "employer_mtd"} <= forms

    items = [
        {"code": "4000", "description": "Revenue", "amount": 500000, "category": "income"},
        {"code": "5000", "description": "Expenses", "amount": 300000, "category": "deductible"},
    ]
    r = client.post("/entities/C2581234509/filings/form-c", json={"ssm": SSM, "line_items": items})
    body = r.json()
    assert body["requires_approval"] is True
    assert body["computation"]["fields"]["tax_payable"]["value"] == 31_000

    app.dependency_overrides[get_llm] = lambda: FakeLLMClient([
        '{"contested_item":"Repairs","claim":"deductible under s.33(1)","clause_ids":["ITA-1967-s33(1)"]}',
        "YES",
    ])
    try:
        r = client.post(
            "/entities/C2581234509/audit-defense",
            json={"query": "Justify repairs", "evidence": [["tax_payable", "tb", "ITA-1967-s33(1)"]]},
        )
        assert r.json()["citations"][0]["verified"] is True
    finally:
        app.dependency_overrides.clear()
