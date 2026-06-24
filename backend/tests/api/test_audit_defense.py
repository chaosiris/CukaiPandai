from pathlib import Path

import pytest

from api.agents.audit_defense import _FAKE_CLAUSE_ID, build_defense
from api.llm import FakeLLMClient
from core.lawcorpus import LawCorpus

C = LawCorpus.load(Path("core/fixtures/lawcorpus_seed.json"))

_SCRIPTED = [
    '{"contested_item":"Repairs RM4,800","claim":"deductible under s.33(1)","clause_ids":["ITA-1967-s33(1)"]}',
    "YES",
]


def test_defense_pack_is_cited():
    pack = build_defense(
        "Justify your RM4,800 repairs deduction",
        evidence=[("tax_payable", "trial_balance_acme", "ITA-1967-s33(1)")],
        llm=FakeLLMClient(_SCRIPTED), corpus=C,
    )
    assert pack.citations[0].verified is True
    assert "s.112" in pack.exposure_note or "s.113" in pack.exposure_note


def test_inject_fabricated_false_is_unchanged():
    """Default path (flag absent/False) produces a single citation, no probe."""
    pack = build_defense(
        "Justify your RM4,800 repairs deduction",
        evidence=[],
        llm=FakeLLMClient(_SCRIPTED), corpus=C,
        inject_fabricated=False,
    )
    assert len(pack.citations) == 1
    assert pack.citations[0].verified is True
    assert all(cid != _FAKE_CLAUSE_ID for cit in pack.citations for cid in cit.clause_ids)


def test_inject_fabricated_true_appends_rejected_probe():
    """inject_fabricated=True: >=2 citations, exactly one fake rejected by the real gate."""
    # The probe has a non-existent clause_id so ground_citation short-circuits (no extra LLM call).
    pack = build_defense(
        "Justify your RM4,800 repairs deduction",
        evidence=[],
        llm=FakeLLMClient(_SCRIPTED), corpus=C,
        inject_fabricated=True,
    )
    assert len(pack.citations) >= 2

    real_cits = [c for c in pack.citations if _FAKE_CLAUSE_ID not in c.clause_ids]
    fake_cits = [c for c in pack.citations if _FAKE_CLAUSE_ID in c.clause_ids]

    assert len(fake_cits) == 1, "exactly one probe citation"
    assert fake_cits[0].verified is False, "gate must reject the fabricated clause"
    assert any(c.verified is True for c in real_cits), "at least one real citation verified=true"


def test_fake_clause_id_genuinely_absent_from_corpus():
    """Confirm the planted ID is not in the corpus (gate rejects it because it doesn't exist)."""
    assert not C.exists(_FAKE_CLAUSE_ID)
    assert _FAKE_CLAUSE_ID not in C.ids()
