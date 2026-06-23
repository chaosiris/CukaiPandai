"""BE-4 — deadline holiday-shift backed by the `holidays` package (Malaysia)."""
from __future__ import annotations

from datetime import date

from core.deadlines import malaysia_holidays, shift_for_malaysian_holidays


def test_malaysia_holidays_includes_national_day():
    h = malaysia_holidays([2026])
    assert h, "expected a non-empty Malaysian holiday set"
    assert date(2026, 8, 31) in h  # Hari Kebangsaan / National Day


def test_shift_moves_off_a_holiday_to_a_working_day():
    out = shift_for_malaysian_holidays(date(2026, 8, 31))  # National Day
    assert out != date(2026, 8, 31)
    assert out.weekday() < 5  # lands on a weekday
    assert out not in malaysia_holidays([2026, 2027])
