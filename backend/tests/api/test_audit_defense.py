from pathlib import Path

from api.agents.audit_defense import build_defense
from api.llm import FakeLLMClient
from core.lawcorpus import LawCorpus

C = LawCorpus.load(Path("core/fixtures/lawcorpus_seed.json"))


def test_defense_pack_is_cited():
    scripted = [
        '{"contested_item":"Repairs RM4,800","claim":"deductible under s.33(1)","clause_ids":["ITA-1967-s33(1)"]}',
        "YES",
    ]
    pack = build_defense(
        "Justify your RM4,800 repairs deduction",
        evidence=[("tax_payable", "trial_balance_acme", "ITA-1967-s33(1)")],
        llm=FakeLLMClient(scripted), corpus=C,
    )
    assert pack.citations[0].verified is True
    assert "s.112" in pack.exposure_note or "s.113" in pack.exposure_note
