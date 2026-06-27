from datetime import date

from core.computation import compute_form_c
from core.models import EntityTaxProfile, LineItem


def _p(**kw):
    b = dict(
        tin="C1234567890", entity_type="sdn_bhd", msic_codes=["46900"], paid_up_capital=1_000_000,
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


def test_exempt_income_excluded():
    # Single-tier dividends are exempt -> excluded from business income, never taxed.
    items = [
        LineItem(code="rev_sales", description="Sales", amount=200_000, category="income"),
        LineItem(code="oth_dividend_income", description="Dividend", amount=50_000, category="exempt_income"),
    ]
    fc = compute_form_c(_p(), items, 2026)
    assert fc.fields["business_income"].value == 200_000
    assert fc.fields["chargeable_income"].value == 200_000
    assert fc.fields["tax_payable"].value == 31_000


def test_capital_allowance_plant_machinery():
    # Plant & machinery: 20% IA + 14% AA = 34% year-1 allowance on RM100,000 = RM34,000.
    items = [
        LineItem(code="rev_sales", description="Sales", amount=500_000, category="income"),
        LineItem(code="cos_purchases", description="Purchases", amount=100_000, category="deductible"),
        LineItem(code="ca_plant_machinery", description="Machine", amount=100_000, category="capital_allowance"),
    ]
    fc = compute_form_c(_p(), items, 2026)
    assert fc.fields["capital_allowances"].value == 34_000
    assert fc.fields["statutory_income"].value == 366_000  # 400,000 adjusted - 34,000 CA
    assert fc.fields["chargeable_income"].value == 366_000


def test_capital_allowance_ict_higher_rate():
    # ICT/software accelerated CA: 40% IA + 20% AA = 60% year-1 on RM50,000 = RM30,000.
    items = [
        LineItem(code="rev_sales", description="Sales", amount=300_000, category="income"),
        LineItem(code="ca_ict_software", description="Laptops", amount=50_000, category="capital_allowance"),
    ]
    fc = compute_form_c(_p(), items, 2026)
    assert fc.fields["capital_allowances"].value == 30_000
    assert fc.fields["chargeable_income"].value == 270_000


def test_balancing_charge_adds_to_statutory():
    items = [
        LineItem(code="rev_sales", description="Sales", amount=200_000, category="income"),
        LineItem(code="ca_balancing_charge", description="Balancing charge", amount=30_000, category="capital_allowance"),
    ]
    fc = compute_form_c(_p(), items, 2026)
    assert fc.fields["statutory_income"].value == 230_000
    assert fc.fields["chargeable_income"].value == 230_000


def test_small_value_assets_sme_uncapped_vs_non_sme_capped():
    sva = LineItem(code="ca_small_value", description="Small tools", amount=30_000, category="capital_allowance")
    rev = LineItem(code="rev_sales", description="Sales", amount=200_000, category="income")
    sme = compute_form_c(_p(), [rev, sva], 2026)
    assert sme.fields["capital_allowances"].value == 30_000  # SME exempt from the RM20k aggregate cap
    non_sme = compute_form_c(_p(paid_up_capital=5_000_000, gross_income=80_000_000), [rev, sva], 2026)
    assert non_sme.fields["capital_allowances"].value == 20_000  # non-SME capped at RM20,000


def test_secretarial_taxfiling_capped_at_15k():
    items = [
        LineItem(code="rev_sales", description="Sales", amount=300_000, category="income"),
        LineItem(code="cos_purchases", description="Purchases", amount=50_000, category="deductible"),
        LineItem(code="prof_secretarial_taxfiling", description="Secretarial + tax", amount=25_000, category="special_deduction"),
    ]
    fc = compute_form_c(_p(), items, 2026)
    # further deduction capped at 15,000 -> adjusted = 300,000 - 50,000 - 15,000
    assert fc.fields["adjusted_income"].value == 235_000


def test_donation_capped_at_10pct_aggregate_income():
    items = [
        LineItem(code="rev_sales", description="Sales", amount=300_000, category="income"),
        LineItem(code="cos_purchases", description="Purchases", amount=100_000, category="deductible"),
        LineItem(code="rel_approved_donations", description="Donation", amount=50_000, category="special_deduction"),
    ]
    fc = compute_form_c(_p(), items, 2026)
    # aggregate income 200,000; donation capped at 10% = 20,000 -> total 180,000
    assert fc.fields["aggregate_income"].value == 200_000
    assert fc.fields["total_income"].value == 180_000
    assert fc.fields["chargeable_income"].value == 180_000


def test_zakat_capped_at_2_5pct_aggregate_income():
    items = [
        LineItem(code="rev_sales", description="Sales", amount=300_000, category="income"),
        LineItem(code="cos_purchases", description="Purchases", amount=100_000, category="deductible"),
        LineItem(code="rel_zakat", description="Zakat", amount=10_000, category="special_deduction"),
    ]
    fc = compute_form_c(_p(), items, 2026)
    # aggregate income 200,000; zakat capped at 2.5% = 5,000 -> chargeable 195,000
    assert fc.fields["chargeable_income"].value == 195_000
