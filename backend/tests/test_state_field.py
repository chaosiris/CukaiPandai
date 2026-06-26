"""Optional `state` (Malaysian state/FT ISO code) on EntityTaxProfile (Task C).

Drives state-specific public-holiday shifting. Optional (None = national only); validated against
the codes the `holidays` package accepts when present.
"""
from __future__ import annotations

import pytest
from pydantic import ValidationError

from core.models import EntityTaxProfile

BASE = {
    "tin": "C2581234509",
    "entity_type": "sdn_bhd",
    "msic_codes": ["46900"],
    "paid_up_capital": 1_000_000.0,
    "gross_income": 5_000_000.0,
    "employee_count": 12,
    "sst_registered": True,
    "basis_period_start": "2025-01-01",
    "basis_period_end": "2025-12-31",
}


def _profile(**over):
    return EntityTaxProfile(**{**BASE, **over})


def test_state_omitted_defaults_to_none():
    assert _profile().state is None


def test_valid_state_accepted():
    assert _profile(state="SGR").state == "SGR"


def test_state_is_normalized_to_uppercase():
    assert _profile(state="png").state == "PNG"


def test_empty_state_becomes_none():
    assert _profile(state="").state is None


def test_unknown_state_rejected():
    with pytest.raises(ValidationError):
        _profile(state="XYZ")
