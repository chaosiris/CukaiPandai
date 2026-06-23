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
