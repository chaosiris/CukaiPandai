import json
from pathlib import Path

from cukaipandai_core.citations import ground_citation
from cukaipandai_core.computation import compute_form_c
from cukaipandai_core.evidence import EvidenceVault
from cukaipandai_core.lawcorpus import LawCorpus
from cukaipandai_core.models import Citation, EntityTaxProfile, LineItem
from cukaipandai_core.obligations import derive_obligations

FIX = Path("cukaipandai_core/fixtures")


def test_core_end_to_end_golden():
    entity = json.loads((FIX / "entity_acme.json").read_text())
    tb = json.loads((FIX / "trial_balance_acme.json").read_text())
    profile = EntityTaxProfile(**entity)
    items = [LineItem(**li) for li in tb]

    cal = derive_obligations(profile, 2026)
    assert any(o.form == "C" for o in cal.obligations)

    fc = compute_form_c(profile, items, 2026)
    assert fc.fields["tax_payable"].value == 31_000  # Acme: chargeable 200k, SME bands

    corpus = LawCorpus.load(FIX / "lawcorpus_seed.json")
    cit = ground_citation(
        Citation(claim="expenses deductible under s.33(1)", clause_ids=["ITA-1967-s33(1)"]), corpus
    )
    assert cit.verified

    v = EvidenceVault()
    v.link("tax_payable", "trial_balance_acme", "ITA-1967-s33(1)")
    assert v.links_for("tax_payable")
