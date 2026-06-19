from datetime import date

from cukaipandai_core.computation import compute_form_c
from cukaipandai_core.models import EntityTaxProfile, LineItem


def _p(**kw):
    b = dict(
        tin="C1", entity_type="sdn_bhd", msic_codes=["46900"], paid_up_capital=1_000_000,
        gross_income=500_000, employee_count=5, sst_registered=False,
        basis_period_start=date(2025, 1, 1), basis_period_end=date(2025, 12, 31),
        commencement_date=date(2018, 3, 1),
    )
    b.update(kw)
    return EntityTaxProfile(**b)


def test_sme_band_computation_golden():
    items = [
        LineItem(code="rev", description="Revenue", amount=500_000, category="income"),
        LineItem(code="exp", description="Allowable expenses", amount=300_000, category="deductible"),
    ]
    fc = compute_form_c(_p(), items, 2026)
    # chargeable 200,000 -> 15% x150k (22,500) + 17% x50k (8,500) = 31,000
    assert fc.fields["chargeable_income"].value == 200_000
    assert fc.fields["tax_payable"].value == 31_000
    assert fc.fields["tax_payable"].config_version == "YA2026.1"


def test_non_sme_flat_rate():
    items = [LineItem(code="rev", description="Revenue", amount=1_000_000, category="income")]
    fc = compute_form_c(_p(paid_up_capital=5_000_000, gross_income=80_000_000), items, 2026)
    assert fc.fields["tax_payable"].value == 240_000  # 24% flat
