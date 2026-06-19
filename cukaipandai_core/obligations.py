from __future__ import annotations

from cukaipandai_core.config_loader import load_ya_config
from cukaipandai_core.deadlines import cp204_deadline, form_c_deadline
from cukaipandai_core.models import EntityTaxProfile, Obligation, ObligationCalendar


def derive_obligations(profile: EntityTaxProfile, ya: int) -> ObligationCalendar:
    cfg = load_ya_config(ya)
    ver = cfg["version"]
    obs: list[Obligation] = []

    obs.append(Obligation(
        obligation_type="income_tax", form="C",
        due_date=form_c_deadline(profile.basis_period_end),
        rule_id="oblig.income_tax.formc", config_version=ver))
    obs.append(Obligation(
        obligation_type="income_tax", form="CP204",
        due_date=cp204_deadline(profile.basis_period_start, profile.commencement_date),
        rule_id="oblig.income_tax.cp204", config_version=ver))

    if any(profile.gross_income >= p["min_turnover"] for p in cfg["einvoice_phases"]):
        obs.append(Obligation(
            obligation_type="einvoice", form="MyInvois",
            due_date=profile.basis_period_start,
            rule_id="oblig.einvoice.phase", config_version=ver))

    if profile.sst_registered:
        obs.append(Obligation(
            obligation_type="sst", form="SST-02",
            due_date=profile.basis_period_end,
            rule_id="oblig.sst.return", config_version=ver))

    if profile.employee_count > 0:
        obs.append(Obligation(
            obligation_type="employer_mtd", form="CP39",
            due_date=profile.basis_period_start,
            rule_id="oblig.employer.mtd", config_version=ver))

    return ObligationCalendar(entity_tin=profile.tin, obligations=obs)
