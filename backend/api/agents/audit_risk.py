from __future__ import annotations

from core.computation import is_sme
from core.config_loader import load_ya_config
from core.models import FormComputation, RiskFlag


def assess_risk(
    computation: FormComputation,
    profile,
    declared_income: float,
    myinvois_turnover: float | None,
    ya: int = 2026,
) -> list[RiskFlag]:
    """Deterministic pre-flight checks that flag common LHDN audit triggers before filing."""
    flags: list[RiskFlag] = []
    ci = computation.fields["chargeable_income"].value
    tax_field = computation.fields.get("tax_payable")
    tax = tax_field.value if tax_field else None

    # 1. Declared income vs MyInvois e-invoice turnover (under-reporting signal). Distinguish
    #    "no MyInvois data" (None → skip) from "genuinely zero turnover" (0 with positive income → flag).
    if myinvois_turnover is not None:
        if myinvois_turnover == 0:
            if declared_income > 0:
                flags.append(RiskFlag(
                    code="turnover_mismatch", severity="high",
                    message=f"Declared income {declared_income} but MyInvois turnover is zero"))
        elif abs(declared_income - myinvois_turnover) / myinvois_turnover > 0.10:
            flags.append(RiskFlag(
                code="turnover_mismatch", severity="high",
                message=f"Declared income {declared_income} differs >10% from MyInvois turnover {myinvois_turnover}"))

    # 2. Negative chargeable income.
    if ci < 0:
        flags.append(RiskFlag(
            code="negative_chargeable", severity="high",
            message="Chargeable income is negative"))

    # 3. Chargeable income is a tiny fraction of declared gross income — a large cross-source gap
    #    worth verifying (heavy deductions/allowances, or an SSM-gross vs filing reconciliation issue).
    if declared_income > 0 and (declared_income - ci) / declared_income > 0.90:
        flags.append(RiskFlag(
            code="gross_chargeable_gap", severity="medium",
            message=(
                f"Chargeable income ({ci:.0f}) is under 10% of declared gross income "
                f"({declared_income:.0f}) — verify deductions/allowances and reconcile sources")))

    # 4. Positive chargeable income but zero tax payable (verify reliefs/rebates).
    if tax is not None and ci > 0 and tax == 0:
        flags.append(RiskFlag(
            code="zero_tax_positive_income", severity="medium",
            message="Positive chargeable income but zero tax payable — verify reliefs/rebates"))

    # 5. SME status (informational): paid-up > RM2.5m OR gross business income > RM50m means the
    #    company is NOT an SME, so chargeable income is taxed at the flat non-SME rate (not the
    #    15/17/24% bands). Surfaced so the user sees WHY the SME bands don't apply. Needs the profile
    #    (skipped when None, e.g. in isolated unit tests). NOTE: the >20% foreign-ownership SME
    #    disqualifier (YA2024) is not modelled — there is no ownership field yet.
    if profile is not None:
        cfg = load_ya_config(ya)
        if not is_sme(profile, cfg):
            it = cfg["income_tax"]
            reasons = []
            if profile.paid_up_capital > it["sme_paidup_max"]:
                reasons.append(
                    f"paid-up capital RM{profile.paid_up_capital:,.0f} exceeds RM{it['sme_paidup_max']:,.0f}")
            if profile.gross_income > it["sme_gross_max"]:
                reasons.append(
                    f"gross income RM{profile.gross_income:,.0f} exceeds RM{it['sme_gross_max']:,.0f}")
            flags.append(RiskFlag(
                code="not_sme_flat_rate", severity="low",
                message=(
                    "Not an SME for the preferential rate (" + "; ".join(reasons)
                    + f") — chargeable income is taxed at the flat {it['non_sme_rate'] * 100:.0f}% rate.")))

    # 6. Deterministic add-backs the engine applied (transparency — surfaces the rules a naive
    #    classifier gets wrong, so the user sees the correction was made and why).
    ent = computation.fields.get("entertainment_50pct_addback")
    if ent is not None and ent.value > 0:
        flags.append(RiskFlag(
            code="entertainment_restricted", severity="low",
            message=(
                f"Client/business entertainment restricted to 50% (s.39(1)(l)) — "
                f"RM{ent.value:,.0f} added back to chargeable income.")))
    epf = computation.fields.get("epf_excess_addback")
    if epf is not None and epf.value > 0:
        flags.append(RiskFlag(
            code="epf_excess_addback", severity="medium",
            message=(
                f"Employer EPF/approved-fund contribution exceeds the 19% cap (s.34(4)) — "
                f"RM{epf.value:,.0f} added back as non-deductible.")))

    return flags
