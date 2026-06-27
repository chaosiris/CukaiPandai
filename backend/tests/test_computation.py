from datetime import date

import pytest
from pydantic import ValidationError

from core.computation import compute_form_c
from core.models import EntityTaxProfile, LineItem
from core.tax_accounts import by_code


def _item(code: str, amount: float) -> LineItem:
    """Build a line item the way the real system does — category pinned from the taxonomy."""
    acct = by_code(code)
    return LineItem(code=code, description=acct.label, amount=amount, category=acct.category)


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


def test_client_entertainment_auto_restricted_to_50pct():
    items = [_item("rev_sales", 500_000), _item("sell_entertainment_clients", 15_000)]
    fc = compute_form_c(_p(), items, 2026)
    assert fc.fields["entertainment_50pct_addback"].value == 7_500  # the disallowed half, added back
    assert fc.fields["chargeable_income"].value == 492_500  # 500,000 - 7,500 deductible half


def test_staff_entertainment_is_fully_deductible():
    items = [_item("rev_sales", 500_000), _item("staff_entertainment", 8_000)]
    fc = compute_form_c(_p(), items, 2026)
    assert "entertainment_50pct_addback" not in fc.fields  # staff carve-out is NOT restricted
    assert fc.fields["chargeable_income"].value == 492_000  # 500,000 - 8,000 (full)


def test_employer_epf_capped_at_19pct_of_remuneration():
    items = [_item("rev_sales", 2_000_000), _item("staff_salaries", 900_000), _item("staff_epf", 200_000)]
    fc = compute_form_c(_p(), items, 2026)
    # cap = 19% x 900,000 = 171,000; excess 29,000 added back
    assert fc.fields["epf_excess_addback"].value == 29_000
    assert fc.fields["chargeable_income"].value == 929_000  # 2,000,000 - 900,000 - 171,000


def test_employer_epf_under_cap_fully_deductible():
    items = [_item("rev_sales", 2_000_000), _item("staff_salaries", 900_000), _item("staff_epf", 117_000)]
    fc = compute_form_c(_p(), items, 2026)
    assert "epf_excess_addback" not in fc.fields
    assert fc.fields["chargeable_income"].value == 983_000  # 2,000,000 - 900,000 - 117,000


def test_full_classification_scenario():
    # The 20-line user scenario: depreciation / unapproved donations / general provisions excluded
    # (added back); client entertainment 50%-restricted; staff entertainment 100%; approved donation
    # within the 10% cap; EPF under the 19% cap.
    items = [
        _item("rev_sales", 5_000_000),
        _item("rev_other_operating", 50_000),
        _item("cos_purchases", 1_800_000),
        _item("staff_salaries", 900_000),
        _item("staff_epf", 117_000),
        _item("staff_socso_eis_hrdf", 12_000),
        _item("prem_rent", 120_000),
        _item("prem_utilities", 36_000),
        _item("rep_maintenance", 18_000),
        _item("dep_depreciation", 150_000),
        _item("staff_entertainment", 8_000),
        _item("sell_entertainment_clients", 15_000),
        _item("rel_approved_donations", 20_000),
        _item("nd_donations_pl", 5_000),
        _item("admin_bank_charges", 3_000),
        _item("prof_legal_revenue", 40_000),
        _item("sell_travel", 25_000),
        _item("fin_interest", 30_000),
        _item("admin_bad_debts_specific", 12_000),
        _item("nd_general_provisions", 8_000),
    ]
    fc = compute_form_c(_p(), items, 2026)
    assert fc.fields["entertainment_50pct_addback"].value == 7_500
    assert "epf_excess_addback" not in fc.fields  # 117,000 < 19% x 900,000
    assert fc.fields["chargeable_income"].value == 1_901_500


def test_balancing_charge_applies_on_adjusted_loss():
    # COMP-1: a balancing charge must be added even when the business is in an adjusted loss.
    items = [_item("rev_sales", 100_000), _item("cos_purchases", 150_000), _item("ca_balancing_charge", 80_000)]
    fc = compute_form_c(_p(), items, 2026)
    # adjusted -50,000 + balancing charge 80,000 -> statutory 30,000 (charge not dropped)
    assert fc.fields["statutory_income"].value == 30_000
    assert fc.fields["chargeable_income"].value == 30_000


def test_group_relief_ignored_for_sme():
    # COMP-2: s.44A group relief requires non-SME; an SME claimant's group relief is dropped.
    items = [_item("rev_sales", 300_000), _item("cos_purchases", 100_000), _item("rel_group_relief", 50_000)]
    fc = compute_form_c(_p(), items, 2026)  # _p() is an SME (paid-up 1m, gross 500k)
    assert fc.fields["chargeable_income"].value == 200_000  # group relief ignored


def test_group_relief_allowed_for_non_sme():
    items = [_item("rev_sales", 3_000_000), _item("rel_group_relief", 50_000)]
    fc = compute_form_c(_p(paid_up_capital=5_000_000, gross_income=80_000_000), items, 2026)
    assert fc.fields["chargeable_income"].value == 2_950_000  # non-SME -> relief deducted


def test_epf_disallowed_when_no_remuneration():
    # COMP-3: with no remuneration line the 19% cap base is 0, so employer EPF is fully added back.
    items = [_item("rev_sales", 100_000), _item("staff_epf", 50_000)]
    fc = compute_form_c(_p(), items, 2026)
    assert fc.fields["epf_excess_addback"].value == 50_000
    assert fc.fields["chargeable_income"].value == 100_000


def test_negative_line_item_amount_rejected():
    # COMP-4: amounts are positive magnitudes; a negative is rejected at the boundary.
    with pytest.raises(ValidationError):
        LineItem(code="rev_sales", description="Sales", amount=-100_000, category="income")
