"""Canonical chart of fixed tax accounts for the structured Form C filing input.

This is the single source of truth for the line-item taxonomy: the structured manual-entry
picker (two-level: group -> account), the constrained upload classifier, and the deterministic
engine all key off these account codes. Every account maps to a `category` the engine consumes:

  income            taxable business / other-source receipts (added to gross income)
  exempt_income     booked as accounting income but NOT taxable (excluded; a "less" line)
  deductible        allowable s.33(1) outgoings (subtracted to reach adjusted income)
  non_deductible    add-backs: in the accounts but not tax-deductible (excluded from deductions)
  capital_allowance Schedule 3 assets / balancing items / unabsorbed CA (statutory-income stage)
  special_deduction further/double deductions + below-the-line s.44 reliefs (their own stages)

`ca_class` (capital_allowance rows) and `relief_key` (special_deduction rows) link an account to
its rate/cap in `core/config/ya_2026.yaml`. Notes paraphrase the YA2026 tax treatment with the
governing ITA 1967 section; figures live in the cited config, never here.

Sources: LHDN Form C working sheet + Public Rulings, cross-checked vs PwC/EY/KPMG/Deloitte/
Grant Thornton/Crowe Malaysia tax guides (research 2026-06-27).
"""

from __future__ import annotations

from pydantic import BaseModel

# --- category constants (LineItem.category values the engine understands) ---
INCOME = "income"
EXEMPT_INCOME = "exempt_income"
DEDUCTIBLE = "deductible"
NON_DEDUCTIBLE = "non_deductible"
CAPITAL_ALLOWANCE = "capital_allowance"
SPECIAL_DEDUCTION = "special_deduction"

CATEGORIES = frozenset(
    {INCOME, EXEMPT_INCOME, DEDUCTIBLE, NON_DEDUCTIBLE, CAPITAL_ALLOWANCE, SPECIAL_DEDUCTION}
)

# Ordered group names — drive the first level of the manual-entry picker.
GROUPS: list[str] = [
    "Revenue",
    "Other income",
    "Cost of sales",
    "Staff costs",
    "Premises & utilities",
    "Repairs & maintenance",
    "Administrative & general",
    "Selling & marketing",
    "Finance costs",
    "Professional fees",
    "Depreciation & amortisation",
    "Non-deductible add-backs",
    "Capital-allowance assets",
    "Donations & reliefs",
]


class TaxAccount(BaseModel):
    code: str
    label: str
    group: str
    category: str
    note: str = ""
    # capital_allowance rows: links to ya_2026.yaml capital_allowances[ca_class].
    ca_class: str | None = None
    # special_deduction rows: links to ya_2026.yaml reliefs[relief_key].
    relief_key: str | None = None
    # Special engine rule applied to a deductible row, deterministically:
    #   "entertainment_50" -> only 50% is deductible (s.39(1)(l)); the engine adds back the other 50%.
    #   "epf_capped"       -> deduction capped at the statutory % of remuneration (s.34(4)); excess added back.
    treatment: str | None = None


TAX_ACCOUNTS: list[TaxAccount] = [
    # --- Revenue (s.4(a)/s.24 business income) ---
    TaxAccount(code="rev_sales", label="Sales / turnover", group="Revenue", category=INCOME,
               note="Gross trading/retail/manufacturing turnover, net of returns and discounts; top-line business income (s.4(a)/s.24)."),
    TaxAccount(code="rev_service_fees", label="Service / consulting fees", group="Revenue", category=INCOME,
               note="Fees from services, consulting, professional work and retainers; business income on performance."),
    TaxAccount(code="rev_subscription", label="Subscription / SaaS revenue", group="Revenue", category=INCOME,
               note="Recurring licence/support income; only the earned portion for the YA is income (deferred sits in contract liabilities)."),
    TaxAccount(code="rev_contract", label="Contract revenue (construction / long-term)", group="Revenue", category=INCOME,
               note="Long-term contract and variation revenue recognised over time (MPERS s.23); taxed when recognised."),
    TaxAccount(code="rev_commission", label="Commission / distributor income", group="Revenue", category=INCOME,
               note="Commission earned as agent/distributor; business income."),
    TaxAccount(code="rev_other_operating", label="Other operating / incidental income", group="Revenue", category=INCOME,
               note="Scrap sales, recoveries, rebilled disbursements and other incidental trading receipts (s.4(a))."),

    # --- Other income ---
    TaxAccount(code="oth_interest_income", label="Interest income", group="Other income", category=INCOME,
               note="Taxable under s.4(c) (separate source) unless a money-lending business; brought in at the aggregate-income stage."),
    TaxAccount(code="oth_rental_income", label="Rental income", group="Other income", category=INCOME,
               note="Usually s.4(d) investment income unless letting is a business (s.4(a)); matched against its outgoings."),
    TaxAccount(code="oth_dividend_income", label="Dividend income (single-tier, exempt)", group="Other income", category=EXEMPT_INCOME,
               note="Single-tier Malaysian dividends are exempt; deducted out of the computation, not re-taxed."),
    TaxAccount(code="oth_gain_disposal", label="Gain on disposal of fixed assets", group="Other income", category=EXEMPT_INCOME,
               note="Capital in nature; excluded from income. Disposal instead triggers a Schedule 3 balancing charge/allowance."),
    TaxAccount(code="oth_forex_gain_realised", label="Realised forex gain (trade)", group="Other income", category=INCOME,
               note="Realised forex gain on revenue/trade items is taxable; capital forex gains are not."),
    TaxAccount(code="oth_forex_gain_unrealised", label="Unrealised forex gain", group="Other income", category=EXEMPT_INCOME,
               note="Not taxable until realised; excluded from income. Track separately from realised gains."),
    TaxAccount(code="oth_grants", label="Government grants & subsidies", group="Other income", category=INCOME,
               note="Revenue grants generally taxable; specific gazetted grants are exempt — flag the gazette order."),
    TaxAccount(code="oth_bad_debts_recovered", label="Bad debts recovered", group="Other income", category=INCOME,
               note="Taxable when the original write-off was previously allowed as a deduction (s.30)."),

    # --- Cost of sales (COGS) ---
    TaxAccount(code="cos_opening_stock", label="Opening stock / inventory", group="Cost of sales", category=DEDUCTIBLE,
               note="Component of COGS (opening + purchases - closing); valued at lower of cost or NRV (MPERS s.13)."),
    TaxAccount(code="cos_purchases", label="Purchases of goods / raw materials", group="Cost of sales", category=DEDUCTIBLE,
               note="Stock-in-trade and raw materials wholly & exclusively for the business (s.33(1)), net of returns/discounts."),
    TaxAccount(code="cos_closing_stock", label="Closing stock / inventory", group="Cost of sales", category=INCOME,
               note="Credited back against COGS (increases adjusted income); valued at lower of cost or NRV (s.35)."),
    TaxAccount(code="cos_direct_labour", label="Direct labour / production wages", group="Cost of sales", category=DEDUCTIBLE,
               note="Wages of production/site/kitchen staff producing income; deductible s.33(1), incl. EPF/SOCSO on these staff."),
    TaxAccount(code="cos_freight_duty", label="Carriage inwards, freight & import duty", group="Cost of sales", category=DEDUCTIBLE,
               note="Inbound shipping, customs clearance and import duty capitalised into stock cost; deductible via COGS."),
    TaxAccount(code="cos_subcontractor", label="Subcontractor / outsourced production", group="Cost of sales", category=DEDUCTIBLE,
               note="Direct subcontracted work; deductible if WHT (s.107D/s.109) is settled on non-residents, else disallowed (s.39(1)(j))."),
    TaxAccount(code="cos_materials_overhead", label="Direct materials & site/factory overhead", group="Cost of sales", category=DEDUCTIBLE,
               note="Direct materials, plant hire and indirect production overhead; deductible except embedded depreciation (add back)."),
    TaxAccount(code="cos_cloud_licences", label="Cloud hosting / third-party licence (cost of revenue)", group="Cost of sales", category=DEDUCTIBLE,
               note="SaaS/IT direct cost of revenue; deductible if WHT on non-resident royalties/services is settled."),

    # --- Staff costs ---
    TaxAccount(code="staff_salaries", label="Salaries, wages, bonuses & commissions", group="Staff costs", category=DEDUCTIBLE,
               note="Admin/general employee remuneration wholly & exclusively incurred; deductible s.33(1)."),
    TaxAccount(code="staff_directors_remuneration", label="Directors' fees & remuneration", group="Staff costs", category=DEDUCTIBLE,
               note="Deductible if for services rendered; excessive amounts in controlled companies may be disallowed."),
    TaxAccount(code="staff_epf", label="EPF / approved-fund (employer)", group="Staff costs", category=DEDUCTIBLE,
               treatment="epf_capped",
               note="Deductible but capped at 19% of remuneration (s.34(4)); the engine caps it automatically and adds back any excess."),
    TaxAccount(code="staff_socso_eis_hrdf", label="SOCSO, EIS & HRD Corp levy (employer)", group="Staff costs", category=DEDUCTIBLE,
               note="Employer statutory contributions and HRDF levy; deductible s.33(1)."),
    TaxAccount(code="staff_welfare_medical", label="Staff medical, insurance & welfare", group="Staff costs", category=DEDUCTIBLE,
               note="Employee medical/insurance/amenities; 100% deductible (proviso (i) to s.39(1)(l))."),
    TaxAccount(code="staff_entertainment", label="Staff entertainment (annual dinner, family day)", group="Staff costs", category=DEDUCTIBLE,
               note="Entertainment wholly for employees is 100% deductible (proviso (i) to s.39(1)(l)) -- NOT subject to the 50% client-entertainment restriction."),
    TaxAccount(code="staff_training", label="Staff training & development", group="Staff costs", category=DEDUCTIBLE,
               note="Ordinary training single deduction s.33(1); approved/qualifying training instead claims a double deduction (see reliefs)."),

    # --- Premises & utilities ---
    TaxAccount(code="prem_rent", label="Business premises rent / lease", group="Premises & utilities", category=DEDUCTIBLE,
               note="Rent of office/factory/shop used for the business; deductible s.33(1)."),
    TaxAccount(code="prem_utilities", label="Utilities (electricity, water, gas)", group="Premises & utilities", category=DEDUCTIBLE,
               note="Business running cost (s.33(1)); private-use/home-office portion disallowed (s.39(1)(a))."),
    TaxAccount(code="prem_communications", label="Telephone, internet & communications", group="Premises & utilities", category=DEDUCTIBLE,
               note="Business telecom/broadband/postage; deductible. Apportion out the private-use proportion."),
    TaxAccount(code="prem_quit_rent", label="Quit rent & assessment", group="Premises & utilities", category=DEDUCTIBLE,
               note="Quit rent (cukai tanah) and assessment (cukai pintu) on business/let premises; deductible."),
    TaxAccount(code="prem_services", label="Cleaning, security & premises services", group="Premises & utilities", category=DEDUCTIBLE,
               note="Outsourced cleaning, pest control, security, strata/service charge on business premises; deductible."),

    # --- Repairs & maintenance ---
    TaxAccount(code="rep_maintenance", label="Repairs & maintenance (premises, plant, vehicles)", group="Repairs & maintenance", category=DEDUCTIBLE,
               note="Revenue repairs that restore (not improve/enlarge) an asset are deductible s.33(1)(c); improvements added back."),
    TaxAccount(code="rep_motor_running", label="Motor vehicle running expenses", group="Repairs & maintenance", category=DEDUCTIBLE,
               note="Fuel, road tax, insurance, servicing of business vehicles; private-use portion disallowed."),

    # --- Administrative & general ---
    TaxAccount(code="admin_office_supplies", label="Printing, stationery, postage & supplies", group="Administrative & general", category=DEDUCTIBLE,
               note="Routine office consumables and postage/courier; deductible s.33(1). Capital items go to capital allowances."),
    TaxAccount(code="admin_software_saas", label="Software subscriptions / SaaS / e-invoicing", group="Administrative & general", category=DEDUCTIBLE,
               note="Recurring cloud/SaaS and MyInvois compliance costs are revenue and deductible; outright purchases are capital."),
    TaxAccount(code="admin_insurance", label="General business insurance", group="Administrative & general", category=DEDUCTIBLE,
               note="Fire/liability/PI/marine premiums deductible; keyman only as term-life, company beneficiary, no investment element."),
    TaxAccount(code="admin_subscriptions", label="Subscriptions & membership fees", group="Administrative & general", category=DEDUCTIBLE,
               note="Trade/professional subscriptions deductible; club entrance/joining fees are capital and non-deductible."),
    TaxAccount(code="admin_bank_charges", label="Bank charges & commissions", group="Administrative & general", category=DEDUCTIBLE,
               note="Bank service, transaction, facility and merchant/card-processing fees on the business account; deductible."),
    TaxAccount(code="admin_bad_debts_specific", label="Specific bad debts written off (trade)", group="Administrative & general", category=DEDUCTIBLE,
               note="Trade debts specifically identified as irrecoverable after reasonable steps; deductible s.34(2). Non-trade write-offs are not."),
    TaxAccount(code="admin_royalties", label="Royalties payable", group="Administrative & general", category=DEDUCTIBLE,
               note="Deductible if for the business; disallowed (s.39(1)(j)) if WHT (s.109) is unpaid — flag WHT status."),

    # --- Selling & marketing ---
    TaxAccount(code="sell_advertising", label="Advertising & promotion", group="Selling & marketing", category=DEDUCTIBLE,
               note="General advertising/digital/branding deductible s.33(1); approved export/overseas promotion may double-deduct (see reliefs)."),
    TaxAccount(code="sell_promo_gifts", label="Promotional gifts & samples", group="Selling & marketing", category=DEDUCTIBLE,
               note="Logo gifts and free samples 100% deductible (provisos to s.39(1)(l)); other client gifts may fall under the 50% entertainment limit."),
    TaxAccount(code="sell_commission", label="Sales commission to agents / dealers", group="Selling & marketing", category=DEDUCTIBLE,
               note="Deductible; watch WHT on payments to non-resident agents (s.109/109B) or the expense is disallowed (s.39(1)(j))."),
    TaxAccount(code="sell_carriage_outwards", label="Carriage outwards / delivery & distribution", group="Selling & marketing", category=DEDUCTIBLE,
               note="Outward freight/delivery to customers and marketplace fees; deductible s.33(1)."),
    TaxAccount(code="sell_travel", label="Business travel & accommodation", group="Selling & marketing", category=DEDUCTIBLE,
               note="Business travel/lodging deductible; the leave-passage element is non-deductible (s.39(1)(m))."),
    TaxAccount(code="sell_entertainment_clients", label="Client / business entertainment (50% restricted)", group="Selling & marketing", category=DEDUCTIBLE,
               treatment="entertainment_50",
               note="Enter the FULL client/business entertainment; only 50% is deductible (s.39(1)(l), PR 4/2015) -- the engine applies the 50% restriction and adds back the other half automatically."),

    # --- Finance costs ---
    TaxAccount(code="fin_interest", label="Interest on borrowings (loan / overdraft)", group="Finance costs", category=DEDUCTIBLE,
               note="Deductible (s.33(1)(a)) where borrowings produce gross income; restricted s.33(2) for non-business assets and s.140C cross-border."),
    TaxAccount(code="fin_hp_interest", label="Hire purchase interest", group="Finance costs", category=DEDUCTIBLE,
               note="The interest/finance-charge element is deductible; the principal attracts capital allowances instead."),
    TaxAccount(code="fin_lease_charges", label="Operating lease / trade finance charges", group="Finance costs", category=DEDUCTIBLE,
               note="Operating lease rentals and trade-finance costs deductible; passenger-car lease rentals capped (s.39(1)(k))."),

    # --- Professional fees ---
    TaxAccount(code="prof_audit_accounting", label="Audit, accounting & bookkeeping fees", group="Professional fees", category=DEDUCTIBLE,
               note="Statutory audit and routine accounting/bookkeeping fees; deductible s.33(1)."),
    TaxAccount(code="prof_legal_revenue", label="Legal & professional fees (revenue)", group="Professional fees", category=DEDUCTIBLE,
               note="Revenue-nature legal/professional fees deductible; capital matters (acquisitions, incorporation, restructuring) are not (add back)."),
    TaxAccount(code="prof_management_fees", label="Consultancy / management fees", group="Professional fees", category=DEDUCTIBLE,
               note="Arm's-length consultancy/management fees deductible; related-party fees must meet TP tests; non-resident payments may attract WHT."),
    TaxAccount(code="prof_secretarial_taxfiling", label="Secretarial & tax filing fees", group="Professional fees", category=SPECIAL_DEDUCTION,
               relief_key="secretarial_taxfiling",
               note="Deductible but capped combined per YA (P.U.(A) 162/2022); excess over the cap is added back."),

    # --- Depreciation & amortisation (always added back) ---
    TaxAccount(code="dep_depreciation", label="Depreciation of property, plant & equipment", group="Depreciation & amortisation", category=NON_DEDUCTIBLE,
               note="Accounting depreciation is always added back (s.39(1)(b)); relief is given via capital allowances instead."),
    TaxAccount(code="dep_amortisation", label="Amortisation of intangibles / goodwill / leasehold", group="Depreciation & amortisation", category=NON_DEDUCTIBLE,
               note="Amortisation of goodwill, intangibles and leasehold land is capital in nature and added back."),

    # --- Non-deductible add-backs ---
    TaxAccount(code="nd_epf_excess", label="Excess EPF over the statutory cap", group="Non-deductible add-backs", category=NON_DEDUCTIBLE,
               note="Employer EPF/approved-fund contributions exceeding the cap of remuneration are added back (s.34(4))."),
    TaxAccount(code="nd_leave_passage", label="Employee leave passage", group="Non-deductible add-backs", category=NON_DEDUCTIBLE,
               note="Leave passage (employee holiday travel/accommodation) is specifically disallowed (s.39(1)(m)); added back."),
    TaxAccount(code="nd_general_provisions", label="General provisions & impairments (doubtful debts, stock, warranty)", group="Non-deductible add-backs", category=NON_DEDUCTIBLE,
               note="General/collective provisions, stock obsolescence and impairments are added back until realised; only specific, evidenced items qualify (s.34(2))."),
    TaxAccount(code="nd_fines_penalties", label="Fines, penalties & compounds", group="Non-deductible add-backs", category=NON_DEDUCTIBLE,
               note="Statutory fines, compounds and late-payment penalties are not wholly & exclusively incurred; added back under s.39."),
    TaxAccount(code="nd_income_tax", label="Income tax & deferred tax expense", group="Non-deductible add-backs", category=NON_DEDUCTIBLE,
               note="Malaysian income tax and tax penalties charged in the P&L are non-deductible (s.39(1)(a)/(b)); deferred tax movement also added back."),
    TaxAccount(code="nd_private_capital", label="Private / domestic & capital expenditure in the P&L", group="Non-deductible add-backs", category=NON_DEDUCTIBLE,
               note="Drawings, private/domestic outlay and any capital sums charged to the P&L are added back (s.39(1)(a)-(d)); relief via capital allowances."),
    TaxAccount(code="nd_forex_loss_unrealised", label="Unrealised foreign exchange loss", group="Non-deductible add-backs", category=NON_DEDUCTIBLE,
               note="Added back (not deductible until realised); realised revenue forex loss is deductible."),
    TaxAccount(code="nd_loss_disposal", label="Loss on disposal of fixed assets", group="Non-deductible add-backs", category=NON_DEDUCTIBLE,
               note="Capital loss on PPE disposal is added back; relief is via a Schedule 3 balancing allowance."),
    TaxAccount(code="nd_wht_unpaid", label="WHT-defaulted payments to non-residents", group="Non-deductible add-backs", category=NON_DEDUCTIBLE,
               note="Interest/royalty/technical/contract payments to non-residents are disallowed (s.39(1)(f)/(i)/(j)) until the WHT is remitted."),
    TaxAccount(code="nd_interest_restriction", label="Interest restriction (non-business / related-party)", group="Non-deductible add-backs", category=NON_DEDUCTIBLE,
               note="Interest on funds used for non-business assets restricted (s.33(2)); excess cross-border related interest restricted (s.140C); added back."),
    TaxAccount(code="nd_donations_pl", label="Donations charged to the P&L (all types)", group="Non-deductible add-backs", category=NON_DEDUCTIBLE,
               note="All donations/sponsorships expensed in the accounts are added back; approved donations are claimed separately below the line (see reliefs)."),
    TaxAccount(code="nd_esos", label="Cost of employee share options (ESOS)", group="Non-deductible add-backs", category=NON_DEDUCTIBLE,
               note="Accounting ESOS expense is added back (Form C item 20); deduction is allowed only on actual issuance per LHDN guidelines."),

    # --- Capital-allowance assets (Schedule 3) ---
    TaxAccount(code="ca_plant_machinery", label="Plant & machinery", group="Capital-allowance assets", category=CAPITAL_ALLOWANCE,
               ca_class="plant_machinery",
               note="Schedule 3 general P&M: initial + annual allowance in lieu of depreciation."),
    TaxAccount(code="ca_motor_vehicles", label="Motor vehicles", group="Capital-allowance assets", category=CAPITAL_ALLOWANCE,
               ca_class="motor_vehicle",
               note="Initial + annual allowance; private passenger-car qualifying cost capped; commercial vehicles uncapped."),
    TaxAccount(code="ca_furniture_office", label="Furniture, fittings & office equipment", group="Capital-allowance assets", category=CAPITAL_ALLOWANCE,
               ca_class="furniture_office",
               note="Schedule 3 initial + annual allowance; claimed in lieu of depreciation."),
    TaxAccount(code="ca_ict_software", label="Computers, ICT equipment & software", group="Capital-allowance assets", category=CAPITAL_ALLOWANCE,
               ca_class="ict_software",
               note="Accelerated CA for ICT/customised software (written off over a few years)."),
    TaxAccount(code="ca_small_value", label="Small-value assets", group="Capital-allowance assets", category=CAPITAL_ALLOWANCE,
               ca_class="small_value",
               note="100% allowance in the year of purchase for assets at/under the per-asset cap; aggregate cap lifted for SMEs."),
    TaxAccount(code="ca_industrial_building", label="Industrial / qualifying building", group="Capital-allowance assets", category=CAPITAL_ALLOWANCE,
               ca_class="industrial_building",
               note="Industrial Building Allowance: initial + annual on qualifying buildings; land and most commercial buildings do not qualify."),
    TaxAccount(code="ca_renovation", label="Qualifying renovation & refurbishment", group="Capital-allowance assets", category=CAPITAL_ALLOWANCE,
               ca_class="renovation",
               note="Capitalised qualifying renovation/refurbishment of business premises claimed as accelerated CA under gazetted rules."),
    TaxAccount(code="ca_balancing_charge", label="Balancing charge on disposal", group="Capital-allowance assets", category=CAPITAL_ALLOWANCE,
               ca_class="balancing_charge",
               note="Where disposal proceeds exceed tax residual value, a balancing charge is ADDED (capped at allowances claimed), increasing statutory income."),
    TaxAccount(code="ca_balancing_allowance", label="Balancing allowance on disposal", group="Capital-allowance assets", category=CAPITAL_ALLOWANCE,
               ca_class="balancing_allowance",
               note="Where tax residual value exceeds proceeds, a balancing allowance is deducted, reducing statutory income."),
    TaxAccount(code="ca_unabsorbed_bf", label="Unabsorbed capital allowances b/f", group="Capital-allowance assets", category=CAPITAL_ALLOWANCE,
               ca_class="unabsorbed_bf",
               note="CA carried forward, deducted against statutory income from the same business source (continuity test for dormant companies)."),

    # --- Donations & reliefs (below the line / further deductions, s.44) ---
    TaxAccount(code="rel_approved_donations", label="Approved cash donations & gifts (s.44(6)-(11))", group="Donations & reliefs", category=SPECIAL_DEDUCTION,
               relief_key="approved_donations",
               note="Cash donations to approved institutions deducted from AGGREGATE INCOME, capped at a % of aggregate income (s.44(6)); some s.44(7)-(11) gifts uncapped."),
    TaxAccount(code="rel_zakat", label="Zakat perniagaan (business zakat)", group="Donations & reliefs", category=SPECIAL_DEDUCTION,
               relief_key="zakat",
               note="Business zakat deductible/rebated, restricted to a % of aggregate income (s.44(11A))."),
    TaxAccount(code="rel_rnd", label="R&D expenditure (approved s.34A/34B)", group="Donations & reliefs", category=SPECIAL_DEDUCTION,
               relief_key="rnd",
               note="Approved in-house (s.34A) and contract (s.34B) R&D qualify for a double deduction; the additional deduction is a 'less' line."),
    TaxAccount(code="rel_double_deduction_labour", label="Approved training / disabled-employee / internship double deduction", group="Donations & reliefs", category=SPECIAL_DEDUCTION,
               relief_key="double_deduction_labour",
               note="Double deduction for approved training, remuneration of disabled/senior/ex-convict employees and approved internship/scholarship programmes."),
    TaxAccount(code="rel_export_promotion", label="Export / market development (double deduction)", group="Donations & reliefs", category=SPECIAL_DEDUCTION,
               relief_key="export_promotion",
               note="Qualifying approved export-promotion/overseas market-development expenses eligible for a double deduction."),
    TaxAccount(code="rel_esg", label="ESG / sustainability expenditure", group="Donations & reliefs", category=SPECIAL_DEDUCTION,
               relief_key="esg",
               note="Qualifying ESG expenditure eligible for a further deduction up to the gazetted RM cap for the eligible YAs."),
    TaxAccount(code="rel_business_losses", label="Business losses (current-year & b/f)", group="Donations & reliefs", category=SPECIAL_DEDUCTION,
               relief_key="business_losses",
               note="Current-year adjusted loss set off against aggregate income (s.44(2)); unabsorbed losses carried forward subject to the cap and continuity test."),
    TaxAccount(code="rel_group_relief", label="Group relief (s.44A)", group="Donations & reliefs", category=SPECIAL_DEDUCTION,
               relief_key="group_relief",
               note="A capped % of current-year adjusted loss surrendered between related Malaysian companies (s.44A); the claimant deducts it from aggregate income."),
]

_BY_CODE: dict[str, TaxAccount] = {a.code: a for a in TAX_ACCOUNTS}


def by_code(code: str) -> TaxAccount | None:
    """Look up a tax account by its stable code (None if unknown)."""
    return _BY_CODE.get(code)


def by_group() -> dict[str, list[TaxAccount]]:
    """Accounts grouped by their group name, in GROUPS order — drives the two-level picker."""
    return {g: [a for a in TAX_ACCOUNTS if a.group == g] for g in GROUPS}


def allowed_codes() -> frozenset[str]:
    """The set of valid account codes (for upload-classifier constraint + validation)."""
    return frozenset(_BY_CODE)
