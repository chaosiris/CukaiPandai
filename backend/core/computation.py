from __future__ import annotations

from core.config_loader import load_ya_config
from core.models import EntityTaxProfile, FigureTrace, FormComputation, LineItem


def is_sme(profile: EntityTaxProfile, cfg: dict) -> bool:
    it = cfg["income_tax"]
    return profile.paid_up_capital <= it["sme_paidup_max"] and profile.gross_income <= it["sme_gross_max"]


def chargeable_income(items: list[LineItem]) -> FigureTrace:
    inc = sum(i.amount for i in items if i.category == "income")
    ded = sum(i.amount for i in items if i.category == "deductible")
    return FigureTrace(value=inc - ded, inputs=["income", "deductible"],
                       rule_id="cit.chargeable_income", config_version="")


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
    ci = chargeable_income(items)
    ci.config_version = cfg["version"]
    tp = tax_payable(ci.value, profile, cfg)
    return FormComputation(form="C", fields={"chargeable_income": ci, "tax_payable": tp})
