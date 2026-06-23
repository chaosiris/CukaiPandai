from __future__ import annotations

import pytest

from api.jsonio import loads_relaxed


@pytest.mark.parametrize(
    "raw, expected",
    [
        ('{"a": 1}', {"a": 1}),
        ('[1, 2, 3]', [1, 2, 3]),
        ('```json\n{"a": 1}\n```', {"a": 1}),
        ('```\n{"a": 1}\n```', {"a": 1}),
        ('```json {"a": 1} ```', {"a": 1}),          # single line, language tag
        ('  {"a": 1}  ', {"a": 1}),                    # surrounding whitespace
    ],
)
def test_loads_relaxed_variants(raw, expected):
    assert loads_relaxed(raw) == expected


def test_loads_relaxed_rejects_non_json():
    with pytest.raises(ValueError):
        loads_relaxed("not json at all")
