from __future__ import annotations

import calendar
from datetime import date, timedelta


def _add_months(d: date, months: int) -> date:
    m = d.month - 1 + months
    y = d.year + m // 12
    m = m % 12 + 1
    return date(y, m, min(d.day, calendar.monthrange(y, m)[1]))


def form_c_deadline(fye: date) -> date:
    seventh = _add_months(fye.replace(day=1), 7)
    return date(seventh.year, seventh.month, calendar.monthrange(seventh.year, seventh.month)[1])


def cp204_deadline(basis_start: date, commencement: date | None) -> date:
    if commencement and basis_start <= commencement <= _add_months(basis_start, 12):
        return _add_months(commencement, 3)
    return basis_start - timedelta(days=30)


def shift_for_holidays(d: date, holidays: set[date]) -> date:
    while d.weekday() >= 5 or d in holidays:
        d += timedelta(days=1)
    return d
