"""Deterministic Form C corporate-tax engine (authoritative; no LLM).

Implements the YA2026 ascertainment chain for a resident company from structured line items:

  business income (taxable receipts; exempt income excluded)
    - allowable deductions (s.33(1))
    - further/double deductions (R&D, training, export, ESG; secretarial capped)
  = ADJUSTED INCOME
    + balancing charge  - capital allowances (Sch 3 IA+AA, balancing allowance, unabsorbed CA b/f)
  = STATUTORY INCOME (>= 0)
    - current-year adjusted loss
  = AGGREGATE INCOME
    - b/f business loss  - zakat (<=2.5% AI)  - approved donations (<=10% AI)  - group relief
  = TOTAL INCOME  ==  CHARGEABLE INCOME (a company has no personal reliefs)
    -> SME two-tier rate / flat 24%
  = TAX PAYABLE

Rates/caps live in core/config/ya_2026.yaml (cited). Account treatment (category, ca_class,
relief_key) comes from core/tax_accounts.py. Line items whose code is outside the taxonomy fall
back to category-only handling so legacy/free-form inputs still compute.
"""

from __future__ import annotations

from core.config_loader import load_ya_config
from core.models import EntityTaxProfile, FigureTrace, FormComputation, LineItem
from core.tax_accounts import (
    CAPITAL_ALLOWANCE,
    DEDUCTIBLE,
    INCOME,
    SPECIAL_DEDUCTION,
    by_code,
)


def is_sme(profile: EntityTaxProfile, cfg: dict) -> bool:
    it = cfg["income_tax"]
    return profile.paid_up_capital <= it["sme_paidup_max"] and profile.gross_income <= it["sme_gross_max"]


def _sum(items: list[LineItem], category: str) -> float:
    return sum(i.amount for i in items if i.category == category)


def _capital_allowances(items: list[LineItem], profile: EntityTaxProfile, cfg: dict) -> tuple[float, float]:
    """Return (total capital-allowance deduction, total balancing charge) for the Sch 3 stage."""
    ca_cfg = cfg.get("capital_allowances", {})
    sme = is_sme(profile, cfg)
    allowance = 0.0  # IA+AA + balancing allowance + unabsorbed CA b/f (all reduce statutory income)
    charge = 0.0  # balancing charges (add to statutory income)
    sva_total = 0.0  # small-value assets aggregated for the SME/non-SME cap test

    for it in items:
        if it.category != CAPITAL_ALLOWANCE:
            continue
        acct = by_code(it.code)
        klass = acct.ca_class if acct and acct.ca_class else it.code
        amt = it.amount
        if klass == "balancing_charge":
            charge += amt
        elif klass in ("balancing_allowance", "unabsorbed_bf"):
            allowance += amt
        elif klass == "small_value":
            sva_total += amt
        elif klass in ca_cfg:
            rule = ca_cfg[klass]
            cap = rule.get("cost_cap_rm", 0)
            qe = min(amt, cap) if cap and cap > 0 else amt
            allowance += qe * (rule.get("ia", 0.0) + rule.get("aa", 0.0))
        # unknown ca class -> grant no allowance (safe; never over-claims)

    if sva_total:
        rule = ca_cfg.get("small_value", {})
        rate = rule.get("rate", 1.0)
        agg_cap = rule.get("aggregate_cap_rm", 0)
        # SMEs are exempt from the aggregate cap (unlimited 100%); non-SMEs are capped.
        allowed = sva_total if (sme or not agg_cap) else min(sva_total, agg_cap)
        allowance += allowed * rate

    return allowance, charge


def _further_and_below_line(items: list[LineItem], cfg: dict) -> tuple[float, dict[str, float]]:
    """Split special_deduction items into adjusted-income further deductions and below-the-line s.44 reliefs."""
    r = cfg.get("reliefs", {})
    further = 0.0
    below = {"losses": 0.0, "zakat": 0.0, "donations": 0.0, "group_relief": 0.0}
    for it in items:
        if it.category != SPECIAL_DEDUCTION:
            continue
        acct = by_code(it.code)
        key = acct.relief_key if acct and acct.relief_key else it.code
        amt = it.amount
        if key == "secretarial_taxfiling":
            further += min(amt, r.get("secretarial_taxfiling_cap_rm", amt))
        elif key == "esg":
            further += min(amt, r.get("esg_further_deduction_cap_rm", amt))
        elif key in ("rnd", "double_deduction_labour", "export_promotion"):
            further += amt  # the additional ('less') deduction the user has already quantified
        elif key == "approved_donations":
            below["donations"] += amt
        elif key == "zakat":
            below["zakat"] += amt
        elif key == "group_relief":
            below["group_relief"] += amt
        elif key == "business_losses":
            below["losses"] += amt
        else:
            further += amt  # unknown special deduction -> treat conservatively as a further deduction
    return further, below


def tax_payable(chargeable: float, profile: EntityTaxProfile, cfg: dict) -> FigureTrace:
    it = cfg["income_tax"]
    if not is_sme(profile, cfg):
        return FigureTrace(value=round(chargeable * it["non_sme_rate"], 2), inputs=["chargeable_income"],
                           rule_id="cit.rate.non_sme", config_version=cfg["version"])
    tax = 0.0
    prev = 0.0
    remaining = chargeable
    for band in it["sme_bands"]:
        cap = band["upto"]
        slab = remaining if cap is None else min(remaining, cap - prev)
        if slab <= 0:
            break
        tax += slab * band["rate"]
        remaining -= slab
        if cap is None:
            break
        prev = cap
    return FigureTrace(value=round(tax, 2), inputs=["chargeable_income"],
                       rule_id="cit.rate.sme", config_version=cfg["version"])


def compute_form_c(profile: EntityTaxProfile, items: list[LineItem], ya: int) -> FormComputation:
    cfg = load_ya_config(ya)
    ver = cfg["version"]
    r = cfg.get("reliefs", {})

    business_income = _sum(items, INCOME)
    deductions = _sum(items, DEDUCTIBLE)
    further, below = _further_and_below_line(items, cfg)

    # Stage 2 -> adjusted income (a negative result is a current-year adjusted loss).
    adjusted = business_income - deductions - further

    # Stage 3 -> statutory income (>= 0): + balancing charge, - capital allowances.
    ca_allowance, balancing_charge = _capital_allowances(items, profile, cfg)
    if adjusted >= 0:
        statutory = max(0.0, adjusted + balancing_charge - ca_allowance)
        current_year_loss = 0.0
    else:
        statutory = 0.0
        current_year_loss = -adjusted

    # Stage 4 -> aggregate income (single business source; other-source income is folded into
    # business income as a deliberate SME-estimate simplification).
    aggregate = max(0.0, statutory - current_year_loss)

    # Stage 5 -> total income: s.44 below-the-line deductions in statutory order; the donation (10%)
    # and zakat (2.5%) caps are measured against AGGREGATE income, not the running balance.
    ai = aggregate
    running = aggregate
    running -= min(below["losses"], running)
    running -= min(below["zakat"], ai * r.get("zakat_aggregate_income_cap_pct", 0.0), running)
    running -= min(below["donations"], ai * r.get("donation_aggregate_income_cap_pct", 0.0), running)
    running -= min(below["group_relief"], running)
    total = max(0.0, running)

    # Stage 6 -> chargeable income (a company has no personal reliefs: chargeable = total).
    chargeable = total
    tp = tax_payable(chargeable, profile, cfg)

    def fig(value: float, inputs: list[str], rule_id: str) -> FigureTrace:
        return FigureTrace(value=round(value, 2), inputs=inputs, rule_id=rule_id, config_version=ver)

    fields = {
        "business_income": fig(business_income, ["income"], "cit.business_income"),
        "adjusted_income": fig(adjusted, ["business_income", "deductible", "special_deduction"], "cit.adjusted_income"),
        "capital_allowances": fig(ca_allowance, ["capital_allowance"], "cit.capital_allowances"),
        "statutory_income": fig(statutory, ["adjusted_income", "capital_allowances"], "cit.statutory_income"),
        "aggregate_income": fig(aggregate, ["statutory_income"], "cit.aggregate_income"),
        "total_income": fig(total, ["aggregate_income", "special_deduction"], "cit.total_income"),
        "chargeable_income": fig(chargeable, ["total_income"], "cit.chargeable_income"),
        "tax_payable": tp,
    }
    return FormComputation(form="C", fields=fields)
