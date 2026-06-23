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
