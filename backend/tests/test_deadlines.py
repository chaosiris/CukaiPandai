from datetime import date

from core.deadlines import cp204_deadline, form_c_deadline, shift_for_holidays


def test_form_c_seven_months_after_fye():
    assert form_c_deadline(date(2025, 12, 31)) == date(2026, 7, 31)


def test_cp204_30_days_before_basis():
    assert cp204_deadline(date(2025, 1, 1), date(2018, 3, 1)) == date(2024, 12, 2)


def test_shift_skips_weekend_and_holiday():
    # 2026-07-31 is a Friday -> unchanged
    assert shift_for_holidays(date(2026, 7, 31), {date(2026, 8, 3)}) == date(2026, 7, 31)
    # 2026-08-01 Sat -> Sun -> Mon (holiday) -> Tue 2026-08-04
    assert shift_for_holidays(date(2026, 8, 1), {date(2026, 8, 3)}) == date(2026, 8, 4)
