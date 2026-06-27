from __future__ import annotations

import math

from core.models import LineItem
from core.tax_accounts import TAX_ACCOUNTS, by_code

from api.jsonio import loads_relaxed
from api.llm import LLMClient

# The model is constrained to the fixed tax-account taxonomy: it must map every extracted row to one
# of these codes and drop anything that is not a genuine accounting line. The category is NOT trusted
# from the model — it is taken authoritatively from the taxonomy for the chosen code.
_CATALOGUE = "\n".join(f"{a.code}: {a.label}" for a in TAX_ACCOUNTS)
_SYS = (
    "You extract accounting line items from a Malaysian company's financial statement, income statement "
    "or trial balance and map each to a FIXED chart of tax accounts. "
    "Use ONLY these account codes; map each extracted line to the single closest code:\n"
    f"{_CATALOGUE}\n\n"
    "Rules:\n"
    "- DROP any row that is not a genuine accounting line item with a numeric amount (skip section "
    "headings, subtotals/totals, page numbers, dates, narrative notes, and anything non-financial).\n"
    "- Give the amount as a positive number (strip currency symbols and thousands separators).\n"
    "- If no code is a reasonable match for a row, DROP that row rather than inventing a code.\n"
    'Return ONLY a JSON object {"line_items": [{"code", "description", "amount"}]} using codes from the list above.'
)


def classify_line_items(raw_text: str, llm: LLMClient) -> list[LineItem]:
    # JSON-object mode (BE-9): on a live HTTP path the model must return parseable JSON.
    out = llm.complete(_SYS, raw_text, json_schema={"type": "object"})
    data = loads_relaxed(out)
    rows = data["line_items"] if isinstance(data, dict) else data  # tolerate a bare array too

    items: list[LineItem] = []
    for li in rows:
        if not isinstance(li, dict):
            continue
        acct = by_code(str(li.get("code", "")).strip())
        if acct is None:
            continue  # constrained to the taxonomy: drop unknown/hallucinated codes
        try:
            amount = float(li.get("amount"))
        except (TypeError, ValueError):
            continue  # drop rows without a usable numeric amount (non-financial noise)
        if not math.isfinite(amount) or amount == 0:
            continue  # reject NaN/Infinity and zero-value rows
        items.append(
            LineItem(
                code=acct.code,
                description=str(li.get("description") or acct.label),
                amount=amount,
                category=acct.category,  # category is authoritative from the taxonomy, never the model
            )
        )
    return items
