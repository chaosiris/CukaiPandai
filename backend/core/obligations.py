from __future__ import annotations

from core.config_loader import load_ya_config
from core.deadlines import cp204_deadline, form_c_deadline, shift_for_malaysian_holidays
from core.models import EntityTaxProfile, Obligation, ObligationCalendar


def derive_obligations(profile: EntityTaxProfile, ya: int) -> ObligationCalendar:
    cfg = load_ya_config(ya)
    ver = cfg["version"]
    obs: list[Obligation] = []

    # A filing/payment deadline that lands on a weekend or public holiday rolls to the next working
    # day. `profile.state` (an ISO subdiv code, e.g. SGR) adds that state's public holidays; None =
    # national + weekends only. The MyInvois mandate-start below is an implementation date, not a
    # roll-to-next-working-day deadline, so it is intentionally NOT shifted.
    def deadline(d):
        return shift_for_malaysian_holidays(d, subdiv=profile.state)

    obs.append(Obligation(
        obligation_type="income_tax", form="C",
        due_date=deadline(form_c_deadline(profile.basis_period_end)),
        rule_id="oblig.income_tax.formc", config_version=ver))
    obs.append(Obligation(
        obligation_type="income_tax", form="CP204",
        due_date=deadline(cp204_deadline(profile.basis_period_start, profile.commencement_date)),
        rule_id="oblig.income_tax.cp204", config_version=ver))

    if any(profile.gross_income >= p["min_turnover"] for p in cfg["einvoice_phases"]):
        obs.append(Obligation(
            obligation_type="einvoice", form="MyInvois",
            due_date=profile.basis_period_start,
            rule_id="oblig.einvoice.phase", config_version=ver))

    if profile.sst_registered:
        obs.append(Obligation(
            obligation_type="sst", form="SST-02",
            due_date=deadline(profile.basis_period_end),
            rule_id="oblig.sst.return", config_version=ver))

    if profile.employee_count > 0:
        obs.append(Obligation(
            obligation_type="employer_mtd", form="CP39",
            due_date=deadline(profile.basis_period_start),
            rule_id="oblig.employer.mtd", config_version=ver))

    return ObligationCalendar(entity_tin=profile.tin, obligations=obs)
