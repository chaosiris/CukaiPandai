from __future__ import annotations

import json

from core.models import LineItem

from api.llm import LLMClient

_SYS = (
    "You classify accounting line items for Malaysian corporate tax. "
    "Return ONLY a JSON array of {code,description,amount,category}; "
    "category in {income,deductible,non_deductible}."
)


def classify_line_items(raw_text: str, llm: LLMClient) -> list[LineItem]:
    out = llm.complete(_SYS, raw_text)
    return [LineItem(**li) for li in json.loads(out)]
