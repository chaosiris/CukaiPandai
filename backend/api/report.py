"""Filing draft-pack generator — renders a finalized Form C filing into a printable PDF.

The pack is a PREPARATION AID (a tax-computation working paper a Malaysian SME reviews and hands to
LHDN / their tax agent). Malaysia runs a self-assessment system: the taxpayer or an authorised agent
files Form C / e-C via MyTax. CukaiPandai never submits on anyone's behalf — every page is watermarked
"DRAFT - NOT FOR SUBMISSION" and the pack carries the compliance disclaimer.

`build_report_html` is pure (testable without native libraries); `render_pdf` lazily imports WeasyPrint
so a missing system library degrades to a 503 at the endpoint rather than crashing the whole API.

Sections (LHDN HK-1 / tax-agent working-paper convention, researched 2026-06-27):
  cover -> entity particulars -> tax computation working sheet -> capital allowance schedule
  -> line-item schedule -> Form C field summary -> disclaimer.
"""

from __future__ import annotations

import html as _html

from core.tax_accounts import by_code

_CATEGORY_GROUPS = [
    ("income", "Income"),
    ("exempt_income", "Exempt / non-taxable income (excluded)"),
    ("deductible", "Allowable deductions"),
    ("special_deduction", "Reliefs / further deductions"),
    ("capital_allowance", "Capital-allowance assets"),
    ("non_deductible", "Non-allowable items (added back)"),
]

_ENTITY_TYPE_LABEL = {
    "sdn_bhd": "Private limited company (Sdn Bhd)",
    "bhd": "Public limited company (Bhd)",
    "plc": "Public limited company",
    "company": "Company",
    "llp": "Limited liability partnership (LLP)",
    "partnership": "Partnership",
    "sole_proprietor": "Sole proprietor",
}


def _esc(v: object) -> str:
    return _html.escape(str(v if v is not None else ""))


def _rm(value: float | None) -> str:
    if value is None:
        return "-"
    v = round(float(value))
    return f"({abs(v):,})" if v < 0 else f"{v:,}"


def _field(fields: dict, key: str) -> float | None:
    f = fields.get(key)
    return f.get("value") if isinstance(f, dict) else None


def _ws_row(label: str, value: float | None, *, bold: bool = False, indent: bool = False, paren: bool = False) -> str:
    cls = " class='ws-total'" if bold else ""
    pad = " style='padding-left:18px'" if indent else ""
    amt = "" if value is None else (f"({abs(round(value)):,})" if (paren or value < 0) else f"{round(value):,}")
    return f"<tr{cls}><td{pad}>{_esc(label)}</td><td class='num'>{amt}</td></tr>"


def build_report_html(filing: dict, entity: dict | None, *, ya: int = 2026) -> str:
    """Build the self-contained HTML for the filing draft pack (no external assets)."""
    comp = filing.get("computation") or {}
    fields = comp.get("fields") or {}
    line_items = filing.get("line_items") or []
    risk_flags = filing.get("risk_flags") or []
    tin = filing.get("tin") or (entity or {}).get("tin") or "-"
    label = filing.get("label") or "Form C filing"

    company = label.split(" · ")[0] if " · " in label else label
    config_version = ""
    for f in fields.values():
        if isinstance(f, dict) and f.get("config_version"):
            config_version = f["config_version"]
            break

    business = _field(fields, "business_income")
    adjusted = _field(fields, "adjusted_income")
    ca = _field(fields, "capital_allowances")
    statutory = _field(fields, "statutory_income")
    aggregate = _field(fields, "aggregate_income")
    total = _field(fields, "total_income")
    chargeable = _field(fields, "chargeable_income")
    tax = _field(fields, "tax_payable")
    ent_addback = _field(fields, "entertainment_50pct_addback")
    epf_addback = _field(fields, "epf_excess_addback")

    deductions = (business - adjusted) if (business is not None and adjusted is not None) else None
    reliefs = (aggregate - total) if (aggregate is not None and total is not None) else None

    # --- Entity particulars rows ---
    ent_rows = [("Company", company), ("Income tax reference no. (TIN)", tin)]
    if entity:
        et = _ENTITY_TYPE_LABEL.get(str(entity.get("entity_type", "")).lower(), entity.get("entity_type"))
        ent_rows += [
            ("Entity type / residence", f"{et} · Resident"),
            ("Business code (MSIC)", ", ".join(entity.get("msic_codes") or []) or "-"),
            ("Basis period for YA", f"{entity.get('basis_period_start')} to {entity.get('basis_period_end')}"),
            ("Date of commencement", entity.get("commencement_date") or "-"),
            ("Paid-up ordinary share capital (RM)", _rm(entity.get("paid_up_capital"))),
            ("Gross business income (RM)", _rm(entity.get("gross_income"))),
            ("SST registered", "Yes" if entity.get("sst_registered") else "No"),
        ]
    ent_rows.append(("Year of Assessment", str(ya)))
    ent_rows.append(("Currency", "RM (Ringgit Malaysia)"))
    entity_html = "".join(
        f"<tr><td class='k'>{_esc(k)}</td><td class='v'>{v if k.endswith('(RM)') else _esc(v)}</td></tr>"
        for k, v in ent_rows
    )

    # --- Tax computation working sheet ---
    ws = [_ws_row("Business income (gross)", business, bold=True)]
    if deductions is not None:
        ws.append(_ws_row("Less: Allowable & further deductions", deductions, paren=True, indent=True))
    if ent_addback:
        ws.append(_ws_row("Add back: client entertainment restricted 50% (s.39(1)(l))", ent_addback, indent=True))
    if epf_addback:
        ws.append(_ws_row("Add back: employer EPF above the 19% cap (s.34(4))", epf_addback, indent=True))
    ws.append(_ws_row("Adjusted income", adjusted, bold=True))
    if ca:
        ws.append(_ws_row("Less: Capital allowances (Schedule 3)", ca, paren=True, indent=True))
    ws.append(_ws_row("Statutory income", statutory, bold=True))
    ws.append(_ws_row("Aggregate income", aggregate, bold=True))
    if reliefs:
        ws.append(_ws_row("Less: Approved donations / zakat / losses / group relief (s.44)", reliefs, paren=True, indent=True))
    ws.append(_ws_row("Total income = Chargeable income", chargeable, bold=True))
    ws.append(_ws_row("Tax payable, YA" + str(ya), tax, bold=True))
    ws_html = "".join(ws)

    # --- Capital allowance schedule (only if CA assets exist) ---
    ca_items = [li for li in line_items if li.get("category") == "capital_allowance"]
    ca_section = ""
    if ca_items:
        rows = "".join(
            f"<tr><td>{_esc(li.get('description'))}</td><td class='num'>{_rm(li.get('amount'))}</td></tr>"
            for li in ca_items
        )
        ca_section = f"""
        <h2>Capital Allowance Schedule (Schedule 3, ITA 1967)</h2>
        <table class="amounts"><thead><tr><th>Asset / class (qualifying expenditure)</th><th class="num">RM</th></tr></thead>
        <tbody>{rows}<tr class="ws-total"><td>Total capital allowance claimed (YA{ya})</td><td class="num">{_rm(ca)}</td></tr></tbody></table>
        <p class="note">Initial + annual allowances, motor-vehicle / small-value caps and balancing adjustments are applied per the YA{ya} Schedule-3 rates; the total above is deducted at the statutory-income stage.</p>
        """

    # --- Line-item schedule (the inputs, grouped) ---
    def _desc(li: dict) -> str:
        if li.get("description"):
            return str(li["description"])
        acct = by_code(li.get("code") or "")
        return acct.label if acct else str(li.get("code") or "-")

    li_sections = []
    for cat, heading in _CATEGORY_GROUPS:
        rows = [li for li in line_items if li.get("category") == cat]
        if not rows:
            continue
        body = "".join(
            f"<tr><td>{_esc(_desc(li))}</td><td class='num'>{_rm(li.get('amount'))}</td></tr>" for li in rows
        )
        subtotal = sum(float(li.get("amount") or 0) for li in rows)
        li_sections.append(
            f"<tr class='li-head'><td colspan='2'>{_esc(heading)}</td></tr>{body}"
            f"<tr class='li-sub'><td>Subtotal</td><td class='num'>{_rm(subtotal)}</td></tr>"
        )
    li_html = "".join(li_sections)

    # --- Form C field summary ---
    summary_rows = [
        ("Statutory income", statutory),
        ("Aggregate income", aggregate),
        ("Total income", total),
        ("Chargeable income", chargeable),
        ("Tax payable", tax),
    ]
    summary_html = "".join(
        f"<tr><td>{_esc(k)}</td><td class='num'>{_rm(v)}</td></tr>" for k, v in summary_rows
    )

    risk_html = ""
    if risk_flags:
        items = "".join(
            f"<li><strong>{_esc(f.get('severity', '').upper())}</strong> — {_esc(f.get('message'))}</li>"
            for f in risk_flags
        )
        risk_html = f"<h2>Pre-flight Risk Notes</h2><ul class='risk'>{items}</ul>"

    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Form C Draft Pack — {_esc(company)}</title>
<style>
  @page {{
    size: A4; margin: 18mm 16mm 20mm;
    @bottom-left {{ content: "DRAFT - Not for submission · CukaiPandai · YA{ya}"; font-size: 7.5pt; color: #7a8794; }}
    @bottom-right {{ content: "Page " counter(page) " of " counter(pages); font-size: 7.5pt; color: #7a8794; }}
  }}
  * {{ box-sizing: border-box; }}
  body {{ font-family: "DejaVu Sans", Arial, sans-serif; color: #1c1b19; font-size: 10pt; line-height: 1.45; }}
  .watermark-layer {{ position: fixed; inset: 0; z-index: 0; overflow: hidden; }}
  .watermark {{ position: absolute; left: 50%; font-size: 38pt; font-weight: 700; letter-spacing: 5pt;
    color: rgba(181, 80, 60, 0.08); white-space: nowrap; transform: translate(-50%, -50%) rotate(-30deg); }}
  .wm-top {{ top: 22%; }} .wm-mid {{ top: 52%; }} .wm-bot {{ top: 82%; }}
  .content {{ position: relative; z-index: 1; }}
  .draft-banner {{ display: inline-block; background: #b5503c; color: #fff; font-weight: 700;
    letter-spacing: 2pt; padding: 4pt 12pt; font-size: 11pt; border-radius: 3px; }}
  h1 {{ font-size: 19pt; margin: 10pt 0 2pt; }}
  h2 {{ font-size: 12pt; margin: 18pt 0 6pt; color: #41526e; border-bottom: 1.5pt solid #41526e; padding-bottom: 3pt; }}
  .sub {{ color: #57534a; font-size: 9.5pt; margin: 0 0 4pt; }}
  table {{ width: 100%; border-collapse: collapse; }}
  table.kv td {{ padding: 3.5pt 6pt; border-bottom: 0.5pt solid #e3ded0; vertical-align: top; }}
  table.kv td.k {{ color: #57534a; width: 46%; }} table.kv td.v {{ font-weight: 500; }}
  table.ws td {{ padding: 3.5pt 6pt; border-bottom: 0.5pt solid #eee; }}
  table.ws tr.ws-total td {{ font-weight: 700; border-top: 1pt solid #1c1b19; border-bottom: 1.5pt solid #1c1b19; }}
  table.amounts th, table.amounts td {{ padding: 3.5pt 6pt; border-bottom: 0.5pt solid #e3ded0; text-align: left; }}
  table.amounts th {{ background: #eef1f5; color: #41526e; font-size: 9pt; }}
  table.li tr.li-head td {{ background: #f3efe3; font-weight: 700; padding: 5pt 6pt; margin-top: 6pt; }}
  table.li tr.li-sub td {{ font-weight: 600; border-bottom: 1pt solid #cfc8b6; }}
  table.li td {{ padding: 3pt 6pt; }}
  td.num {{ text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }}
  .note {{ font-size: 8.5pt; color: #57534a; margin: 5pt 0 0; }}
  ul.risk {{ font-size: 9pt; margin: 4pt 0; padding-left: 16pt; }}
  .disclaimer {{ margin-top: 20pt; border: 1pt solid #b5503c; padding: 10pt 12pt; font-size: 8.8pt; color: #2a2925; background: #fbf3f0; }}
  .disclaimer strong {{ color: #b5503c; }}
</style></head>
<body>
  <div class="watermark-layer" aria-hidden="true">
    <span class="watermark wm-top">DRAFT - NOT FOR SUBMISSION</span>
    <span class="watermark wm-mid">DRAFT - NOT FOR SUBMISSION</span>
    <span class="watermark wm-bot">DRAFT - NOT FOR SUBMISSION</span>
  </div>
  <div class="content">
    <div class="draft-banner">DRAFT &nbsp;·&nbsp; NOT FOR SUBMISSION</div>
    <h1>Tax Computation — Form C</h1>
    <p class="sub">{_esc(company)} &nbsp;·&nbsp; Year of Assessment {ya} &nbsp;·&nbsp; Prepared by CukaiPandai{(' · config ' + _esc(config_version)) if config_version else ''}</p>

    <h2>1 · Entity Particulars</h2>
    <table class="kv">{entity_html}</table>

    <h2>2 · Tax Computation Working Sheet</h2>
    <table class="ws">{ws_html}</table>
    <p class="note">Figures computed by CukaiPandai's deterministic rule-based core (not AI). SME tiered rates (YA{ya}): first RM150,000 @ 15%, next RM450,000 @ 17%, balance @ 24% — or a flat 24% if the company is not an SME. Approved donations are capped at 10% and business zakat at 2.5% of aggregate income.</p>

    {ca_section}

    <h2>{'3' if not ca_items else '4'} · Schedule of Line Items</h2>
    <table class="li">{li_html}</table>

    {risk_html}

    <h2>Form C / e-C Field Summary</h2>
    <p class="note">Indicative mapping to the Form C / e-C boxes — for review before filing via MyTax. Re-confirm against the live form.</p>
    <table class="amounts"><thead><tr><th>Field</th><th class="num">RM</th></tr></thead><tbody>{summary_html}</tbody></table>

    <div class="disclaimer">
      <strong>DRAFT — FOR DISCUSSION PURPOSES ONLY. NOT FOR SUBMISSION.</strong><br/>
      This tax computation draft pack was prepared by CukaiPandai as a working aid to help the company review its
      estimated corporate income tax position for Year of Assessment {ya}. <strong>It is not an official return and
      has not been submitted to the Inland Revenue Board of Malaysia (LHDN / HASiL).</strong>
      Malaysia operates a self-assessment system: the company is responsible for computing, declaring and paying its
      own tax, and the Form C / e-C must be filed by the company or its <strong>authorised tax agent</strong> via the
      <strong>MyTax</strong> portal. <strong>No third party may submit this return on the company's behalf without
      proper authorisation.</strong> Figures are based on the information provided and remain subject to review and
      verification against the audited financial statements. Review this pack and consult a licensed tax agent or
      LHDN before filing. This document is decision-support, not professional tax advice.
    </div>
  </div>
</body></html>"""


def render_pdf(html_str: str) -> bytes:
    """Render the report HTML to PDF bytes via WeasyPrint (lazy import — raises if native libs absent)."""
    from weasyprint import HTML  # noqa: PLC0415 — lazy so a missing system lib doesn't break API import

    return HTML(string=html_str).write_pdf()
