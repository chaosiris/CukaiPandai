from __future__ import annotations

import calendar
from datetime import date, timedelta

import holidays as _holidays


def _add_months(d: date, months: int) -> date:
    m = d.month - 1 + months
    y = d.year + m // 12
    m = m % 12 + 1
    return date(y, m, min(d.day, calendar.monthrange(y, m)[1]))


def form_c_deadline(fye: date) -> date:
    seventh = _add_months(fye.replace(day=1), 7)
    return date(seventh.year, seventh.month, calendar.monthrange(seventh.year, seventh.month)[1])


def cp204_deadline(basis_start: date, commencement: date | None, estimate_days_before: int = 30) -> date:
    # s.107C: a new company files within 3 months of commencement; an ongoing company submits the
    # estimate `estimate_days_before` days (statutorily 30) before the basis period starts.
    if commencement and basis_start <= commencement <= _add_months(basis_start, 12):
        return _add_months(commencement, 3)
    return basis_start - timedelta(days=estimate_days_before)


def shift_for_holidays(d: date, holidays: set[date]) -> date:
    while d.weekday() >= 5 or d in holidays:
        d += timedelta(days=1)
    return d


def malaysia_holidays(years, subdiv: str | None = None) -> set[date]:
    """Malaysian public holidays for the given year(s) from the `holidays` package
    (offline, no network). `subdiv` accepts a state code (e.g. 'SGR') for state holidays."""
    return set(_holidays.Malaysia(years=list(years), subdiv=subdiv).keys())


def shift_for_malaysian_holidays(d: date, subdiv: str | None = None) -> date:
    """Shift a deadline past weekends and real Malaysian public holidays."""
    hols = malaysia_holidays([d.year, d.year + 1], subdiv=subdiv)
    return shift_for_holidays(d, hols)
