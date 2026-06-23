from __future__ import annotations

from core.models import FormComputation, RiskFlag


def assess_risk(
    computation: FormComputation,
    profile,
    declared_income: float,
    myinvois_turnover: float | None,
) -> list[RiskFlag]:
    """Deterministic pre-flight checks that flag common LHDN audit triggers before filing."""
    flags: list[RiskFlag] = []
    ci = computation.fields["chargeable_income"].value
    tax_field = computation.fields.get("tax_payable")
    tax = tax_field.value if tax_field else None

    # 1. Declared income diverges from the MyInvois e-invoice turnover (under-reporting signal).
    if myinvois_turnover and abs(declared_income - myinvois_turnover) / myinvois_turnover > 0.10:
        flags.append(RiskFlag(
            code="turnover_mismatch", severity="high",
            message=f"Declared income {declared_income} differs >10% from MyInvois turnover {myinvois_turnover}"))

    # 2. Negative chargeable income.
    if ci < 0:
        flags.append(RiskFlag(
            code="negative_chargeable", severity="high",
            message="Chargeable income is negative"))

    # 3. Deductions exceed 90% of declared income (aggressive-deduction trigger).
    if declared_income and (declared_income - ci) / declared_income > 0.90:
        flags.append(RiskFlag(
            code="high_deduction_ratio", severity="medium",
            message=f"Deductions exceed 90% of declared income ({declared_income}) — verify allowability"))

    # 4. Positive chargeable income but zero tax payable (verify reliefs/rebates).
    if tax is not None and ci > 0 and tax == 0:
        flags.append(RiskFlag(
            code="zero_tax_positive_income", severity="medium",
            message="Positive chargeable income but zero tax payable — verify reliefs/rebates"))

    return flags
