"""Generate realistic sample financial documents for the Filing Studio upload demo.

Reads the verified, taxonomy-aligned financials in `sample_financials.json` (produced + arithmetic/
taxonomy-verified by a multi-agent workflow) and renders, per demo persona, into
`frontend/public/fixtures/`:

  {key}-income-statement.pdf  -- a detailed MPERS Statement of Profit or Loss
  {key}-trial-balance.csv     -- an AutoCount-style trial balance export

Layout is patterned on real Malaysian documents (KPMG / Radiant Rainbow MPERS illustrative
statements; AutoCount / SQL Account trial-balance exports). These are MOCK documents for testing
the document-extraction pipeline -- the registration numbers are fabricated but format-realistic.

Run (needs fpdf2, a dev-only fixture dependency):  python backend/scripts/gen_sample_docs.py
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parents[2]
DATA = Path(__file__).resolve().parent / "sample_financials.json"
OUT = ROOT / "frontend" / "public" / "fixtures"

# Fabricated-but-realistic SSM registration details + period wording per persona.
PERSONA_META = {
    "acme": {
        "reg_no": "201801012345",
        "roc": "1287456-A",
        "fye_text": "31 December 2025",
        "fye_short": "31/12/2025",
    },
    "sinar": {
        "reg_no": "202201098765",
        "roc": "1467890-K",
        "fye_text": "31 December 2025",
        "fye_short": "31/12/2025",
    },
    "selera": {
        "reg_no": "201901045678",
        "roc": "1334567-T",
        "fye_text": "31 March 2025",
        "fye_short": "31/03/2025",
    },
}

LM = 20.0
LABEL_W = 118.0
AMT_W = 52.0
ROW_H = 5.2


def _amt(v: float, *, paren: bool = False) -> str:
    if paren or v < 0:
        return f"({abs(v):,.0f})"
    return f"{v:,.0f}"


def _section(pdf: FPDF, title: str) -> None:
    pdf.set_font("Helvetica", "B", 9.5)
    pdf.set_x(LM)
    pdf.cell(LABEL_W + AMT_W, ROW_H, title, new_x="LMARGIN", new_y="NEXT")


def _row(pdf: FPDF, label: str, amount: float | None, *, bold: bool = False, indent: float = 6.0, paren: bool = False) -> None:
    pdf.set_font("Helvetica", "B" if bold else "", 9.5 if bold else 9)
    pdf.set_x(LM + indent)
    pdf.cell(LABEL_W - indent, ROW_H, label, new_x="RIGHT", new_y="TOP")
    pdf.cell(AMT_W, ROW_H, "" if amount is None else _amt(amount, paren=paren), align="R", new_x="LMARGIN", new_y="NEXT")


def _rule(pdf: FPDF, *, double: bool = False) -> None:
    y = pdf.get_y() + 0.4
    x1, x2 = LM + LABEL_W + 8, LM + LABEL_W + AMT_W
    pdf.set_line_width(0.2)
    pdf.line(x1, y, x2, y)
    if double:
        pdf.line(x1, y + 0.8, x2, y + 0.8)
    pdf.ln(1.6)


def render_pdf(key: str, data: dict, meta: dict) -> Path:
    m = data["meta"]
    sub = data["pnl_subtotals"]
    pnl = data["pnl"]
    by_section: dict[str, list[dict]] = {}
    for li in pnl:
        by_section.setdefault(li["section"], []).append(li)

    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(True, margin=15)
    pdf.set_margins(LM, 18, LM)
    pdf.add_page()

    # Header block (MPERS convention: name / registration no / incorporated / title / period).
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 7, m["company_name"].upper(), align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 5, f"Registration No : {meta['reg_no']} ({meta['roc']})", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 5, "(Incorporated in Malaysia)", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 6, "Statement of Profit or Loss and Other Comprehensive Income", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 5, f"for the financial year ended {meta['fye_text']}", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    # Column head (RM once at the column head).
    pdf.set_font("Helvetica", "", 9)
    pdf.set_x(LM)
    pdf.cell(LABEL_W, ROW_H, "", new_x="RIGHT", new_y="TOP")
    pdf.cell(AMT_W, ROW_H, "RM", align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)

    # Revenue
    _section(pdf, "Revenue")
    for li in by_section.get("revenue", []):
        _row(pdf, li["label"], li["amount"])
    if len(by_section.get("revenue", [])) > 1:
        _rule(pdf)
        _row(pdf, "", sub["revenue"], bold=True)
    pdf.ln(1)

    # Cost of sales
    if by_section.get("cost_of_sales"):
        _section(pdf, "Less: Cost of sales")
        for li in by_section["cost_of_sales"]:
            _row(pdf, li["label"], li["amount"], paren=True)
        _rule(pdf)
        _row(pdf, "", sub["cost_of_sales"], bold=True, paren=True)
        pdf.ln(1)

    # Gross profit
    _row(pdf, "Gross profit", sub["gross_profit"], bold=True, indent=0.0)
    pdf.ln(1)

    # Other income
    other = by_section.get("other_income", [])
    if other:
        _section(pdf, "Add: Other income")
        for li in other:
            _row(pdf, li["label"], li["amount"])
        pdf.ln(1)

    # Expenses (operating + depreciation + finance; subtotal == total_operating_expenses)
    expenses = by_section.get("operating_expenses", []) + by_section.get("depreciation", []) + by_section.get("finance_costs", [])
    _section(pdf, "Less: Expenses")
    for li in expenses:
        _row(pdf, li["label"], li["amount"], paren=True)
    _rule(pdf)
    _row(pdf, "", sub["total_operating_expenses"], bold=True, paren=True)
    pdf.ln(1)

    # Profit before taxation
    _row(pdf, "Profit before taxation", sub["profit_before_tax"], bold=True, indent=0.0)
    _rule(pdf, double=True)

    pdf.set_font("Helvetica", "I", 7.5)
    pdf.ln(3)
    pdf.multi_cell(
        0,
        4,
        "These accounts are prepared for illustration and tax-filing demonstration. Taxation has not been "
        "provided above; depreciation is added back and capital allowances are claimed in the tax computation.",
    )

    out = OUT / f"{key}-income-statement.pdf"
    pdf.output(str(out))
    return out


def _acc_no(row: dict, counters: dict[str, int]) -> str:
    code = row.get("account_code")
    label = row["label"].lower()
    fixed = {
        "300-000": ("receivable", "debtor"),
        "330-400": ("inventory", "stock"),
        "340-000": ("prepay", "deposit"),
        "400-000": ("payable", "creditor"),
        "410-000": ("accrual",),
        "450-000": ("loan", "borrowing", "term loan"),
        "100-000": ("share capital", "paid-up"),
        "150-000": ("retained",),
        "150-100": ("profit for the year",),
        "320-000": ("cash in hand",),
    }
    if not code:
        for acc, keys in fixed.items():
            if any(k in label for k in keys):
                return acc
        if "cash" in label or "bank" in label:
            band = "312"
        elif "property" in label or "plant" in label or "equipment" in label:
            band = "200"
        else:
            band = "490"
    elif code.startswith("rev_"):
        band = "500"
    elif code.startswith("oth_"):
        band = "550"
    elif code.startswith("cos_"):
        band = "700"
    else:
        band = "900"
    counters[band] = counters.get(band, 0) + 1
    return f"{band}-{counters[band] * 10:03d}"


def render_csv(key: str, data: dict, meta: dict) -> Path:
    m = data["meta"]
    tb = data["trial_balance"]
    totals = data["tb_totals"]
    counters: dict[str, int] = {}

    out = OUT / f"{key}-trial-balance.csv"
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["User ID: ADMIN"])
        w.writerow(["TRIAL BALANCE"])
        w.writerow([f"{m['company_name']} ({meta['roc']})"])
        w.writerow([f"As At {meta['fye_short']}"])
        w.writerow([])
        w.writerow(["AccNo", "Description", "Debit", "Credit"])
        for row in tb:
            acc = _acc_no(row, counters)
            debit = f"{row['debit']:.2f}" if row["debit"] else ""
            credit = f"{row['credit']:.2f}" if row["credit"] else ""
            w.writerow([acc, row["label"], debit, credit])
        w.writerow(["", "TOTAL", f"{totals['total_debit']:.2f}", f"{totals['total_credit']:.2f}"])
    return out


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    personas = json.loads(DATA.read_text(encoding="utf-8"))
    for p in personas:
        key = p["key"]
        meta = PERSONA_META[key]
        pdf_path = render_pdf(key, p["data"], meta)
        csv_path = render_csv(key, p["data"], meta)
        print(f"{key}: {pdf_path.name} ({pdf_path.stat().st_size} B) + {csv_path.name} ({csv_path.stat().st_size} B)")


if __name__ == "__main__":
    main()
