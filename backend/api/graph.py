from __future__ import annotations

from typing import TypedDict

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
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


def build_filing_graph(llm, checkpointer=None):
    """Compile the HITL filing graph. ``checkpointer`` defaults to an in-process MemorySaver
    (tests/offline); pass a durable Postgres checkpointer (BE-15) in production."""
    g = StateGraph(S)
    g.add_node("compute", _compute)
    g.add_node("approval", _approval)
    g.add_edge(START, "compute")
    g.add_edge("compute", "approval")
    g.add_edge("approval", END)
    return g.compile(checkpointer=checkpointer or MemorySaver())
