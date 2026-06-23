"""BE-4 — MSIC reference lookup (data.gov.my connector, fixture mode for offline tests)."""
from __future__ import annotations

from api.connectors.msic import MsicClient

C = MsicClient(fixtures_path="core/fixtures/msic_sample.json")


def test_lookup_5digit_item():
    e = C.lookup("46901")
    assert e is not None
    assert e["item"] == "46901"
    assert "aquarium" in e["desc_en"].lower()


def test_lookup_5digit_padded_falls_back_to_class():
    # Acme's "46900" is the class 4690 padded to 5 digits.
    e = C.lookup("46900")
    assert e is not None
    assert e["class"] == "4690"
    assert "wholesale" in e["desc_en"].lower()


def test_lookup_unknown_returns_none():
    assert C.lookup("99999") is None


def test_lookup_division_and_section_by_level():
    div = C.lookup("46")
    assert div is not None and div["digits"] == 2
    sec = C.lookup("G")
    assert sec is not None and sec["digits"] == 1


def test_coarse_code_does_not_spuriously_match_an_item():
    # division "62" has no division-level row here; must NOT return the 62010 item row.
    assert C.lookup("62") is None
