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
        ('Here is the JSON:\n```json\n{"a": 1}\n```', {"a": 1}),  # fence embedded in prose
        ('Sure!\n```\n[1, 2]\n```\nHope that helps', [1, 2]),     # prose before and after
    ],
)
def test_loads_relaxed_variants(raw, expected):
    assert loads_relaxed(raw) == expected


def test_loads_relaxed_rejects_non_json():
    with pytest.raises(ValueError):
        loads_relaxed("not json at all")
