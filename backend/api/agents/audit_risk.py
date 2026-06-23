from __future__ import annotations

from core.models import FormComputation, RiskFlag


def assess_risk(computation: FormComputation, profile, declared_income: float,
                myinvois_turnover: float) -> list[RiskFlag]:
    flags: list[RiskFlag] = []
    if myinvois_turnover and abs(declared_income - myinvois_turnover) / myinvois_turnover > 0.10:
        flags.append(RiskFlag(
            code="turnover_mismatch", severity="high",
            message=f"Declared income {declared_income} differs >10% from MyInvois turnover {myinvois_turnover}"))
    ci = computation.fields["chargeable_income"].value
    if ci < 0:
        flags.append(RiskFlag(code="negative_chargeable", severity="high",
                              message="Chargeable income is negative"))
    return flags
