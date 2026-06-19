from pathlib import Path

from cukaipandai_core.citations import ground_citation
from cukaipandai_core.lawcorpus import LawCorpus
from cukaipandai_core.models import Citation

C = LawCorpus.load(Path("cukaipandai_core/fixtures/lawcorpus_seed.json"))


def test_real_clauses_verified():
    cit = ground_citation(
        Citation(claim="Repairs deductible under s.33(1)", clause_ids=["ITA-1967-s33(1)"]), C
    )
    assert cit.verified is True


def test_planted_fake_citation_rejected():
    cit = ground_citation(
        Citation(claim="bogus", clause_ids=["ITA-1967-s33(1)", "ITA-1967-s999(fake)"]), C
    )
    assert cit.verified is False
