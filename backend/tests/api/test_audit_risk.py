from api.agents.audit_risk import assess_risk
from core.models import FigureTrace, FormComputation


def _fc(ci):
    return FormComputation(form="C", fields={"chargeable_income": FigureTrace(
        value=ci, inputs=[], rule_id="cit.chargeable_income", config_version="YA2026.1")})


def test_turnover_mismatch_flagged():
    flags = assess_risk(_fc(200000), profile=None, declared_income=500000, myinvois_turnover=120000)
    assert any(f.code == "turnover_mismatch" for f in flags)


def test_clean_case_no_flags():
    flags = assess_risk(_fc(200000), profile=None, declared_income=120000, myinvois_turnover=120000)
    assert flags == []


def test_negative_chargeable_flagged():
    flags = assess_risk(_fc(-5000), profile=None, declared_income=100000, myinvois_turnover=100000)
    assert any(f.code == "negative_chargeable" for f in flags)


def test_gross_chargeable_gap_flagged():
    # declared gross 1,000,000 but only 50,000 chargeable → >90% gap.
    flags = assess_risk(_fc(50000), profile=None, declared_income=1_000_000, myinvois_turnover=None)
    assert any(f.code == "gross_chargeable_gap" for f in flags)


def test_zero_turnover_with_declared_income_flags_mismatch():
    flags = assess_risk(_fc(200000), profile=None, declared_income=500000, myinvois_turnover=0)
    assert any(f.code == "turnover_mismatch" for f in flags)


def test_negative_declared_income_does_not_trip_gap():
    # negative declared income must not invert the ratio into a spurious flag.
    flags = assess_risk(_fc(50000), profile=None, declared_income=-100, myinvois_turnover=None)
    assert not any(f.code == "gross_chargeable_gap" for f in flags)


def test_zero_tax_with_positive_income_flagged():
    fc = FormComputation(form="C", fields={
        "chargeable_income": FigureTrace(value=100000, inputs=[], rule_id="cit.chargeable_income", config_version="YA2026.1"),
        "tax_payable": FigureTrace(value=0, inputs=[], rule_id="cit.rate.sme", config_version="YA2026.1"),
    })
    flags = assess_risk(fc, profile=None, declared_income=100000, myinvois_turnover=100000)
    assert any(f.code == "zero_tax_positive_income" for f in flags)


def test_turnover_check_skipped_when_turnover_none():
    flags = assess_risk(_fc(200000), profile=None, declared_income=500000, myinvois_turnover=None)
    assert not any(f.code == "turnover_mismatch" for f in flags)
