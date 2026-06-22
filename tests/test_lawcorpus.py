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
