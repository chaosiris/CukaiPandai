import json

from langgraph.types import Command

from api.graph import build_filing_graph
from api.llm import FakeLLMClient


def test_graph_pauses_for_approval_then_finalizes():
    g = build_filing_graph(FakeLLMClient([]))
    cfg = {"configurable": {"thread_id": "t1"}}
    items = [
        {"code": "4000", "description": "Rev", "amount": 500000, "category": "income"},
        {"code": "5000", "description": "Exp", "amount": 300000, "category": "deductible"},
    ]
    ssm = json.load(open("core/fixtures/entity_acme.json"))
    state = g.invoke({"profile_ssm": ssm, "line_items": items}, cfg)
    assert state.get("__interrupt__")  # paused awaiting approval

    final = g.invoke(Command(resume={"approved": True}), cfg)
    assert final["computation"]["fields"]["tax_payable"]["value"] == 31000
