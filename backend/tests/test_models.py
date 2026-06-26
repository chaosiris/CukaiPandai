from datetime import date

from core.models import EntityTaxProfile, FigureTrace, FormComputation


def test_entity_profile_roundtrip():
    p = EntityTaxProfile(
        tin="C1234567890", entity_type="sdn_bhd", msic_codes=["46900"],
        paid_up_capital=1_000_000, gross_income=8_000_000, employee_count=20,
        sst_registered=False, basis_period_start=date(2025, 1, 1),
        basis_period_end=date(2025, 12, 31), commencement_date=date(2018, 3, 1),
    )
    assert p.entity_type == "sdn_bhd"


def test_form_computation_holds_traces():
    fc = FormComputation(form="C", fields={"tax_payable": FigureTrace(
        value=100.0, inputs=["chargeable_income"], rule_id="cit.rate.sme", config_version="YA2026.1")})
    assert fc.fields["tax_payable"].rule_id == "cit.rate.sme"
