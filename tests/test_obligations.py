from datetime import date

from cukaipandai_core.models import EntityTaxProfile
from cukaipandai_core.obligations import derive_obligations


def _profile(**kw):
    base = dict(
        tin="C1", entity_type="sdn_bhd", msic_codes=["46900"],
        paid_up_capital=1_000_000, gross_income=8_000_000, employee_count=20,
        sst_registered=True, basis_period_start=date(2025, 1, 1),
        basis_period_end=date(2025, 12, 31), commencement_date=date(2018, 3, 1),
    )
    base.update(kw)
    return EntityTaxProfile(**base)


def test_full_profile_derives_all():
    cal = derive_obligations(_profile(), 2026)
    types = {o.obligation_type for o in cal.obligations}
    assert {"income_tax", "einvoice", "sst", "employer_mtd"} <= types


def test_no_employees_no_sst_no_einvoice():
    cal = derive_obligations(
        _profile(employee_count=0, sst_registered=False, gross_income=200_000), 2026
    )
    types = {o.obligation_type for o in cal.obligations}
    assert "employer_mtd" not in types
    assert "sst" not in types
    assert "einvoice" not in types
    assert "income_tax" in types
