"""BE-14 — sovereign RAG: golden retrieval, fail-open, and the gate-still-rejects invariant."""
from __future__ import annotations

from pathlib import Path

import pytest

from core import rag
from core.lawcorpus import LawCorpus
from core.models import LineItem

from api.agents import deductibility
from api.agents.deductibility import cite_treatment
from api.llm import FakeLLMClient

C = LawCorpus.load(Path("core/fixtures/lawcorpus_seed.json"))


def test_golden_retrieval_finds_repairs_ruling():
    if rag._embedder() is None:  # no static embedder available in this env → skip (fail-open covers it)
        pytest.skip("model2vec embedder unavailable")
    hits = rag.retrieve("repairs and renewals of assets deduction", k=3)
    assert any(h["clause_id"] == "PR-6/2019" for h in hits)


def test_retrieve_fails_open_when_index_missing(monkeypatch):
    monkeypatch.setattr(rag, "_index", lambda: None)
    assert rag.retrieve("anything at all") == []


def test_agent_falls_back_to_full_corpus_when_rag_off(monkeypatch):
    monkeypatch.setattr(deductibility, "retrieve", lambda *a, **k: [])
    item = LineItem(code="5000", description="Repairs", amount=4800, category="deductible")
    llm = FakeLLMClient(['{"claim":"deductible under s.33(1)","clause_ids":["ITA-1967-s33(1)"]}'])
    cit = cite_treatment(item, llm, C)
    assert cit.verified is True  # grounded against the full corpus despite RAG returning []


def test_gate_rejects_fabricated_clause_with_rag_on():
    item = LineItem(code="5000", description="Repairs", amount=4800, category="deductible")
    llm = FakeLLMClient(['{"claim":"bogus","clause_ids":["ITA-1967-s999(fake)"]}'])
    cit = cite_treatment(item, llm, C)
    assert cit.verified is False  # the deterministic gate is unchanged by RAG
