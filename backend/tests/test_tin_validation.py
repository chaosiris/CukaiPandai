"""TIN prefix/format validation on EntityTaxProfile (Task A).

A TIN must be a valid LHDN prefix + 8-12 digits, and for the constrained entity types the prefix
must match (Sdn Bhd/Bhd -> C, partnership -> D, LLP -> PT, sole proprietor -> IG).
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


def test_valid_company_tin():
    assert _profile().tin == "C2581234509"


def test_tin_is_normalized_to_uppercase():
    assert _profile(tin="c2581234509").tin == "C2581234509"


def test_invalid_prefix_rejected():
    with pytest.raises(ValidationError):
        _profile(tin="Z2581234509")  # Z is not an LHDN prefix


def test_too_few_digits_rejected():
    with pytest.raises(ValidationError):
        _profile(tin="C123")


def test_non_digit_body_rejected():
    with pytest.raises(ValidationError):
        _profile(tin="C25812ABCD9")


def test_company_with_non_C_prefix_rejected():
    with pytest.raises(ValidationError):
        _profile(tin="CS81234509", entity_type="sdn_bhd")  # CS is a co-op, not a Sdn Bhd
    with pytest.raises(ValidationError):
        _profile(tin="D4800990020", entity_type="sdn_bhd")


def test_partnership_requires_D_prefix():
    assert _profile(tin="D4800990020", entity_type="partnership").tin == "D4800990020"
    with pytest.raises(ValidationError):
        _profile(tin="C4800990020", entity_type="partnership")


def test_llp_requires_PT_prefix():
    assert _profile(tin="PT1234567809", entity_type="llp").tin == "PT1234567809"


def test_sole_proprietor_requires_IG_prefix():
    assert _profile(tin="IG1234567890", entity_type="sole_proprietor").tin == "IG1234567890"


def test_plc_requires_C_prefix():
    assert _profile(tin="C1234567890", entity_type="plc").tin == "C1234567890"
    with pytest.raises(ValidationError):
        _profile(tin="D4800990020", entity_type="plc")


def test_unconstrained_entity_type_accepts_any_valid_prefix():
    # entity_type not in the prefix map -> only the format/prefix is checked, no type tie
    assert _profile(tin="F1234567809", entity_type="association").tin == "F1234567809"
