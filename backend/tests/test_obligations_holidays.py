"""Task B — obligation due-dates roll off weekends + public holidays (national, and state-aware).

The MyInvois mandate-start is an implementation date, not a roll-to-next-working-day deadline,
so it is intentionally NOT shifted.
"""
from __future__ import annotations

from datetime import date

import holidays
from core.models import EntityTaxProfile
from core.obligations import derive_obligations


def _profile(**kw):
    base = dict(
        tin="C1234567890", entity_type="sdn_bhd", msic_codes=["46900"],
        paid_up_capital=1_000_000, gross_income=8_000_000, employee_count=20,
        sst_registered=True, basis_period_start=date(2025, 1, 1),
        basis_period_end=date(2025, 12, 31), commencement_date=date(2018, 3, 1),
    )
    base.update(kw)
    return EntityTaxProfile(**base)


def _by_form(cal) -> dict:
    return {o.form: o.due_date for o in cal.obligations}


def test_deadlines_avoid_weekends_and_national_holidays():
    cal = derive_obligations(_profile(), 2026)
    nat = set(holidays.Malaysia(years=[2024, 2025, 2026, 2027]))
    for o in cal.obligations:
        if o.form == "MyInvois":
            continue  # mandate-start, intentionally not shifted
        assert o.due_date.weekday() < 5, f"{o.form} fell on a weekend: {o.due_date}"
        assert o.due_date not in nat, f"{o.form} fell on a public holiday: {o.due_date}"


def test_new_year_deadline_shifts_off_the_holiday():
    # 1 Jan (New Year) is observed in Selangor (SGR) — not a *national* holiday — so use SGR.
    cal = _by_form(derive_obligations(_profile(basis_period_start=date(2025, 1, 1), state="SGR"), 2026))
    assert cal["CP39"] != date(2025, 1, 1)
    assert cal["CP39"].weekday() < 5


def test_myinvois_mandate_is_not_shifted():
    cal = _by_form(derive_obligations(_profile(basis_period_start=date(2025, 1, 1), state="SGR"), 2026))
    assert cal["MyInvois"] == date(2025, 1, 1)  # implementation date stays put
    assert cal["CP39"] != cal["MyInvois"]  # the deadline shifted, the mandate did not


def test_state_specific_holiday_shifts_only_with_state():
    """A weekday holiday that exists in Selangor but not nationally shifts a deadline only when
    the entity's state is set to SGR — proving state-aware shifting works."""
    nat = set(holidays.Malaysia(years=2026))
    sgr = set(holidays.Malaysia(years=2026, subdiv="SGR"))
    state_only = sorted(d for d in (sgr - nat) if d.weekday() < 5)
    assert state_only, "expected at least one weekday Selangor-only holiday in 2026"
    d = state_only[0]
    end = date(d.year, 12, 31)
    nat_cal = _by_form(derive_obligations(_profile(basis_period_start=d, basis_period_end=end, state=None), 2026))
    sgr_cal = _by_form(derive_obligations(_profile(basis_period_start=d, basis_period_end=end, state="SGR"), 2026))
    assert nat_cal["CP39"] == d  # national view: d is an ordinary working day
    assert sgr_cal["CP39"] > d  # Selangor view: d is a public holiday -> rolls forward
