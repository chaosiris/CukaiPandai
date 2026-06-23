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


def test_treatment_rejects_fabricated_clause():
    item = LineItem(code="5000", description="Repairs", amount=4800, category="deductible")
    llm = FakeLLMClient(['{"claim":"deductible under s.999","clause_ids":["ITA-1967-s999(fake)"]}'])
    cit = cite_treatment(item, llm, C)
    assert cit.verified is False
