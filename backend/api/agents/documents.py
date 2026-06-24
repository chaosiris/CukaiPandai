from __future__ import annotations

from core.models import LineItem

from api.jsonio import loads_relaxed
from api.llm import LLMClient

_SYS = (
    "You classify accounting line items for Malaysian corporate tax. "
    'Return ONLY a JSON object {"line_items": [{"code","description","amount","category"}]}; '
    "category in {income, deductible, non_deductible}."
)


def classify_line_items(raw_text: str, llm: LLMClient) -> list[LineItem]:
    # JSON-object mode (BE-9): on a live HTTP path the model must return parseable JSON.
    out = llm.complete(_SYS, raw_text, json_schema={"type": "object"})
    data = loads_relaxed(out)
    rows = data["line_items"] if isinstance(data, dict) else data  # tolerate a bare array too
    return [LineItem(**li) for li in rows]
