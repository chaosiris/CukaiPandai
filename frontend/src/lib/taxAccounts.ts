// Canonical chart of fixed tax accounts for the structured Form C filing input.
// MIRROR of backend/core/tax_accounts.py — keep codes/labels/categories in sync.
// Drives the two-level manual-entry picker (group -> account) and the per-account hints.
// The deterministic core (backend) keys the YA2026 computation off the same `code`/`category`.

export type AccountCategory =
  | 'income'
  | 'exempt_income'
  | 'deductible'
  | 'non_deductible'
  | 'capital_allowance'
  | 'special_deduction'

export interface TaxAccount {
  code: string
  label: string
  group: string
  category: AccountCategory
  note: string
}

// Ordered groups — the first level of the picker.
export const TAX_GROUPS: string[] = [
  'Revenue',
  'Other income',
  'Cost of sales',
  'Staff costs',
  'Premises & utilities',
  'Repairs & maintenance',
  'Administrative & general',
  'Selling & marketing',
  'Finance costs',
  'Professional fees',
  'Depreciation & amortisation',
  'Non-deductible add-backs',
  'Capital-allowance assets',
  'Donations & reliefs'
]

// Short human label for each category (for the row badge).
export const CATEGORY_LABEL: Record<AccountCategory, string> = {
  income: 'Taxable income',
  exempt_income: 'Exempt income',
  deductible: 'Deductible',
  non_deductible: 'Add-back',
  capital_allowance: 'Capital allowance',
  special_deduction: 'Relief / further deduction'
}

export const TAX_ACCOUNTS: TaxAccount[] = [
  // Revenue
  {
    code: 'rev_sales',
    label: 'Sales / turnover',
    group: 'Revenue',
    category: 'income',
    note: 'Gross trading/retail/manufacturing turnover, net of returns and discounts; top-line business income.'
  },
  {
    code: 'rev_service_fees',
    label: 'Service / consulting fees',
    group: 'Revenue',
    category: 'income',
    note: 'Fees from services, consulting, professional work and retainers.'
  },
  {
    code: 'rev_subscription',
    label: 'Subscription / SaaS revenue',
    group: 'Revenue',
    category: 'income',
    note: 'Recurring licence/support income; only the earned portion for the year is income.'
  },
  {
    code: 'rev_contract',
    label: 'Contract revenue (construction / long-term)',
    group: 'Revenue',
    category: 'income',
    note: 'Long-term contract and variation revenue recognised over time.'
  },
  {
    code: 'rev_commission',
    label: 'Commission / distributor income',
    group: 'Revenue',
    category: 'income',
    note: 'Commission earned as agent or distributor.'
  },
  {
    code: 'rev_other_operating',
    label: 'Other operating / incidental income',
    group: 'Revenue',
    category: 'income',
    note: 'Scrap sales, recoveries, rebilled disbursements and other incidental trading receipts.'
  },

  // Other income
  {
    code: 'oth_interest_income',
    label: 'Interest income',
    group: 'Other income',
    category: 'income',
    note: 'Taxable; brought in at the aggregate-income stage (a separate source unless money-lending).'
  },
  {
    code: 'oth_rental_income',
    label: 'Rental income',
    group: 'Other income',
    category: 'income',
    note: 'Usually investment income unless letting is a business; matched against its outgoings.'
  },
  {
    code: 'oth_dividend_income',
    label: 'Dividend income (single-tier, exempt)',
    group: 'Other income',
    category: 'exempt_income',
    note: 'Single-tier Malaysian dividends are exempt — excluded from the computation, never re-taxed.'
  },
  {
    code: 'oth_gain_disposal',
    label: 'Gain on disposal of fixed assets',
    group: 'Other income',
    category: 'exempt_income',
    note: 'Capital in nature; excluded. Disposal instead triggers a balancing charge/allowance.'
  },
  {
    code: 'oth_forex_gain_realised',
    label: 'Realised forex gain (trade)',
    group: 'Other income',
    category: 'income',
    note: 'Realised forex gain on revenue/trade items is taxable.'
  },
  {
    code: 'oth_forex_gain_unrealised',
    label: 'Unrealised forex gain',
    group: 'Other income',
    category: 'exempt_income',
    note: 'Not taxable until realised — excluded from income.'
  },
  {
    code: 'oth_grants',
    label: 'Government grants & subsidies',
    group: 'Other income',
    category: 'income',
    note: 'Revenue grants generally taxable; specific gazetted grants are exempt.'
  },
  {
    code: 'oth_bad_debts_recovered',
    label: 'Bad debts recovered',
    group: 'Other income',
    category: 'income',
    note: 'Taxable when the original write-off was previously allowed as a deduction.'
  },

  // Cost of sales
  {
    code: 'cos_opening_stock',
    label: 'Opening stock / inventory',
    group: 'Cost of sales',
    category: 'deductible',
    note: 'Component of cost of goods sold (opening + purchases - closing).'
  },
  {
    code: 'cos_purchases',
    label: 'Purchases of goods / raw materials',
    group: 'Cost of sales',
    category: 'deductible',
    note: 'Stock-in-trade and raw materials wholly & exclusively for the business, net of returns.'
  },
  {
    code: 'cos_closing_stock',
    label: 'Closing stock / inventory',
    group: 'Cost of sales',
    category: 'income',
    note: 'Credited back against cost of goods sold (increases adjusted income).'
  },
  {
    code: 'cos_direct_labour',
    label: 'Direct labour / production wages',
    group: 'Cost of sales',
    category: 'deductible',
    note: 'Wages of production/site/kitchen staff producing income.'
  },
  {
    code: 'cos_freight_duty',
    label: 'Carriage inwards, freight & import duty',
    group: 'Cost of sales',
    category: 'deductible',
    note: 'Inbound shipping, customs clearance and import duty capitalised into stock cost.'
  },
  {
    code: 'cos_subcontractor',
    label: 'Subcontractor / outsourced production',
    group: 'Cost of sales',
    category: 'deductible',
    note: 'Direct subcontracted work; disallowed if withholding tax on non-residents is unpaid.'
  },
  {
    code: 'cos_materials_overhead',
    label: 'Direct materials & site/factory overhead',
    group: 'Cost of sales',
    category: 'deductible',
    note: 'Direct materials, plant hire and indirect production overhead (excl. embedded depreciation).'
  },
  {
    code: 'cos_cloud_licences',
    label: 'Cloud hosting / third-party licence (cost of revenue)',
    group: 'Cost of sales',
    category: 'deductible',
    note: 'SaaS/IT direct cost of revenue; check withholding tax on non-resident royalties/services.'
  },

  // Staff costs
  {
    code: 'staff_salaries',
    label: 'Salaries, wages, bonuses & commissions',
    group: 'Staff costs',
    category: 'deductible',
    note: 'Admin/general employee remuneration wholly & exclusively incurred.'
  },
  {
    code: 'staff_directors_remuneration',
    label: "Directors' fees & remuneration",
    group: 'Staff costs',
    category: 'deductible',
    note: 'Deductible if for services rendered; excessive amounts in controlled companies may be disallowed.'
  },
  {
    code: 'staff_epf',
    label: 'EPF / approved-fund (employer)',
    group: 'Staff costs',
    category: 'deductible',
    note: 'Deductible but capped at 19% of remuneration; enter any excess as the EPF add-back.'
  },
  {
    code: 'staff_socso_eis_hrdf',
    label: 'SOCSO, EIS & HRD Corp levy (employer)',
    group: 'Staff costs',
    category: 'deductible',
    note: 'Employer statutory contributions and the HRDF levy.'
  },
  {
    code: 'staff_welfare_medical',
    label: 'Staff medical, insurance & welfare',
    group: 'Staff costs',
    category: 'deductible',
    note: 'Employee medical/insurance/amenities and staff entertainment (annual dinner, family day) are 100% deductible.'
  },
  {
    code: 'staff_training',
    label: 'Staff training & development',
    group: 'Staff costs',
    category: 'deductible',
    note: 'Ordinary training is a single deduction; approved training instead claims a double deduction (see reliefs).'
  },

  // Premises & utilities
  {
    code: 'prem_rent',
    label: 'Business premises rent / lease',
    group: 'Premises & utilities',
    category: 'deductible',
    note: 'Rent of office/factory/shop used for the business.'
  },
  {
    code: 'prem_utilities',
    label: 'Utilities (electricity, water, gas)',
    group: 'Premises & utilities',
    category: 'deductible',
    note: 'Business running cost; private-use / home-office portion disallowed.'
  },
  {
    code: 'prem_communications',
    label: 'Telephone, internet & communications',
    group: 'Premises & utilities',
    category: 'deductible',
    note: 'Business telecom/broadband/postage; apportion out the private-use portion.'
  },
  {
    code: 'prem_quit_rent',
    label: 'Quit rent & assessment',
    group: 'Premises & utilities',
    category: 'deductible',
    note: 'Quit rent (cukai tanah) and assessment (cukai pintu) on business premises.'
  },
  {
    code: 'prem_services',
    label: 'Cleaning, security & premises services',
    group: 'Premises & utilities',
    category: 'deductible',
    note: 'Outsourced cleaning, pest control, security and strata/service charges on business premises.'
  },

  // Repairs & maintenance
  {
    code: 'rep_maintenance',
    label: 'Repairs & maintenance (premises, plant, vehicles)',
    group: 'Repairs & maintenance',
    category: 'deductible',
    note: 'Revenue repairs that restore (not improve/enlarge) an asset; improvements are added back.'
  },
  {
    code: 'rep_motor_running',
    label: 'Motor vehicle running expenses',
    group: 'Repairs & maintenance',
    category: 'deductible',
    note: 'Fuel, road tax, insurance, servicing of business vehicles; private-use portion disallowed.'
  },

  // Administrative & general
  {
    code: 'admin_office_supplies',
    label: 'Printing, stationery, postage & supplies',
    group: 'Administrative & general',
    category: 'deductible',
    note: 'Routine office consumables and postage/courier; capital items go to capital allowances.'
  },
  {
    code: 'admin_software_saas',
    label: 'Software subscriptions / SaaS / e-invoicing',
    group: 'Administrative & general',
    category: 'deductible',
    note: 'Recurring cloud/SaaS and MyInvois compliance costs; outright purchases are capital.'
  },
  {
    code: 'admin_insurance',
    label: 'General business insurance',
    group: 'Administrative & general',
    category: 'deductible',
    note: 'Fire/liability/PI/marine premiums; keyman only as term-life with the company as beneficiary.'
  },
  {
    code: 'admin_subscriptions',
    label: 'Subscriptions & membership fees',
    group: 'Administrative & general',
    category: 'deductible',
    note: 'Trade/professional subscriptions; club entrance/joining fees are capital and non-deductible.'
  },
  {
    code: 'admin_bank_charges',
    label: 'Bank charges & commissions',
    group: 'Administrative & general',
    category: 'deductible',
    note: 'Bank service, transaction, facility and merchant/card-processing fees on the business account.'
  },
  {
    code: 'admin_bad_debts_specific',
    label: 'Specific bad debts written off (trade)',
    group: 'Administrative & general',
    category: 'deductible',
    note: 'Trade debts specifically identified as irrecoverable; non-trade write-offs are not deductible.'
  },
  {
    code: 'admin_royalties',
    label: 'Royalties payable',
    group: 'Administrative & general',
    category: 'deductible',
    note: 'Deductible if for the business; disallowed if withholding tax is unpaid.'
  },

  // Selling & marketing
  {
    code: 'sell_advertising',
    label: 'Advertising & promotion',
    group: 'Selling & marketing',
    category: 'deductible',
    note: 'General advertising/digital/branding; approved export promotion may double-deduct (see reliefs).'
  },
  {
    code: 'sell_promo_gifts',
    label: 'Promotional gifts & samples',
    group: 'Selling & marketing',
    category: 'deductible',
    note: 'Logo gifts and free samples are 100% deductible; other client gifts may fall under the 50% entertainment limit.'
  },
  {
    code: 'sell_commission',
    label: 'Sales commission to agents / dealers',
    group: 'Selling & marketing',
    category: 'deductible',
    note: 'Deductible; watch withholding tax on payments to non-resident agents.'
  },
  {
    code: 'sell_carriage_outwards',
    label: 'Carriage outwards / delivery & distribution',
    group: 'Selling & marketing',
    category: 'deductible',
    note: 'Outward freight/delivery to customers and marketplace fees.'
  },
  {
    code: 'sell_travel',
    label: 'Business travel & accommodation',
    group: 'Selling & marketing',
    category: 'deductible',
    note: 'Business travel/lodging; the leave-passage element is non-deductible.'
  },
  {
    code: 'sell_entertainment_allowed',
    label: 'Client entertainment (deductible 50%)',
    group: 'Selling & marketing',
    category: 'deductible',
    note: 'Only 50% of general client entertainment is deductible; enter the restricted half as the entertainment add-back.'
  },

  // Finance costs
  {
    code: 'fin_interest',
    label: 'Interest on borrowings (loan / overdraft)',
    group: 'Finance costs',
    category: 'deductible',
    note: 'Deductible where borrowings produce gross income; restricted for non-business and cross-border related interest.'
  },
  {
    code: 'fin_hp_interest',
    label: 'Hire purchase interest',
    group: 'Finance costs',
    category: 'deductible',
    note: 'The interest/finance-charge element is deductible; the principal attracts capital allowances instead.'
  },
  {
    code: 'fin_lease_charges',
    label: 'Operating lease / trade finance charges',
    group: 'Finance costs',
    category: 'deductible',
    note: 'Operating lease rentals and trade-finance costs; passenger-car lease rentals are capped.'
  },

  // Professional fees
  {
    code: 'prof_audit_accounting',
    label: 'Audit, accounting & bookkeeping fees',
    group: 'Professional fees',
    category: 'deductible',
    note: 'Statutory audit and routine accounting/bookkeeping fees.'
  },
  {
    code: 'prof_legal_revenue',
    label: 'Legal & professional fees (revenue)',
    group: 'Professional fees',
    category: 'deductible',
    note: 'Revenue-nature fees; capital matters (acquisitions, incorporation, restructuring) are added back.'
  },
  {
    code: 'prof_management_fees',
    label: 'Consultancy / management fees',
    group: 'Professional fees',
    category: 'deductible',
    note: "Arm's-length fees; related-party fees must meet transfer-pricing tests; non-resident payments may attract withholding tax."
  },
  {
    code: 'prof_secretarial_taxfiling',
    label: 'Secretarial & tax filing fees',
    group: 'Professional fees',
    category: 'special_deduction',
    note: 'Deductible but capped at RM15,000 combined per year; the excess is added back automatically.'
  },

  // Depreciation & amortisation
  {
    code: 'dep_depreciation',
    label: 'Depreciation of property, plant & equipment',
    group: 'Depreciation & amortisation',
    category: 'non_deductible',
    note: 'Accounting depreciation is always added back; relief is given via capital allowances instead.'
  },
  {
    code: 'dep_amortisation',
    label: 'Amortisation of intangibles / goodwill / leasehold',
    group: 'Depreciation & amortisation',
    category: 'non_deductible',
    note: 'Amortisation of goodwill, intangibles and leasehold land is capital in nature and added back.'
  },

  // Non-deductible add-backs
  {
    code: 'nd_epf_excess',
    label: 'Excess EPF over the statutory cap',
    group: 'Non-deductible add-backs',
    category: 'non_deductible',
    note: 'Employer EPF contributions exceeding 19% of remuneration are added back.'
  },
  {
    code: 'nd_entertainment_50',
    label: 'Client entertainment (disallowed 50%)',
    group: 'Non-deductible add-backs',
    category: 'non_deductible',
    note: 'The restricted 50% of general entertainment is added back; pairs with the 50%-allowed selling line.'
  },
  {
    code: 'nd_leave_passage',
    label: 'Employee leave passage',
    group: 'Non-deductible add-backs',
    category: 'non_deductible',
    note: 'Leave passage (employee holiday travel/accommodation) is specifically disallowed.'
  },
  {
    code: 'nd_general_provisions',
    label: 'General provisions & impairments (doubtful debts, stock, warranty)',
    group: 'Non-deductible add-backs',
    category: 'non_deductible',
    note: 'General/collective provisions and impairments are added back until realised; only specific items qualify.'
  },
  {
    code: 'nd_fines_penalties',
    label: 'Fines, penalties & compounds',
    group: 'Non-deductible add-backs',
    category: 'non_deductible',
    note: 'Statutory fines, compounds and late-payment penalties are added back.'
  },
  {
    code: 'nd_income_tax',
    label: 'Income tax & deferred tax expense',
    group: 'Non-deductible add-backs',
    category: 'non_deductible',
    note: 'Malaysian income tax and tax penalties charged in the P&L are non-deductible; deferred tax also added back.'
  },
  {
    code: 'nd_private_capital',
    label: 'Private / domestic & capital expenditure in the P&L',
    group: 'Non-deductible add-backs',
    category: 'non_deductible',
    note: 'Drawings, private outlay and any capital sums charged to the P&L are added back; relief via capital allowances.'
  },
  {
    code: 'nd_forex_loss_unrealised',
    label: 'Unrealised foreign exchange loss',
    group: 'Non-deductible add-backs',
    category: 'non_deductible',
    note: 'Added back (not deductible until realised); realised revenue forex loss is deductible.'
  },
  {
    code: 'nd_loss_disposal',
    label: 'Loss on disposal of fixed assets',
    group: 'Non-deductible add-backs',
    category: 'non_deductible',
    note: 'Capital loss on asset disposal is added back; relief is via a balancing allowance.'
  },
  {
    code: 'nd_wht_unpaid',
    label: 'Withholding-tax-defaulted payments to non-residents',
    group: 'Non-deductible add-backs',
    category: 'non_deductible',
    note: 'Payments to non-residents are disallowed until the withholding tax is remitted.'
  },
  {
    code: 'nd_interest_restriction',
    label: 'Interest restriction (non-business / related-party)',
    group: 'Non-deductible add-backs',
    category: 'non_deductible',
    note: 'Interest on funds used for non-business assets, and excess cross-border related interest, is restricted.'
  },
  {
    code: 'nd_donations_pl',
    label: 'Donations charged to the P&L (all types)',
    group: 'Non-deductible add-backs',
    category: 'non_deductible',
    note: 'All donations expensed in the accounts are added back; approved donations are claimed separately below the line.'
  },
  {
    code: 'nd_esos',
    label: 'Cost of employee share options (ESOS)',
    group: 'Non-deductible add-backs',
    category: 'non_deductible',
    note: 'Accounting ESOS expense is added back; deduction is allowed only on actual issuance.'
  },

  // Capital-allowance assets
  {
    code: 'ca_plant_machinery',
    label: 'Plant & machinery',
    group: 'Capital-allowance assets',
    category: 'capital_allowance',
    note: 'Schedule 3 general plant & machinery: 20% initial + 14% annual allowance, in lieu of depreciation.'
  },
  {
    code: 'ca_motor_vehicles',
    label: 'Motor vehicles',
    group: 'Capital-allowance assets',
    category: 'capital_allowance',
    note: '20% + 20%; private passenger-car qualifying cost capped (RM50,000 base); commercial vehicles uncapped.'
  },
  {
    code: 'ca_furniture_office',
    label: 'Furniture, fittings & office equipment',
    group: 'Capital-allowance assets',
    category: 'capital_allowance',
    note: 'Schedule 3: 20% initial + 10% annual allowance, claimed in lieu of depreciation.'
  },
  {
    code: 'ca_ict_software',
    label: 'Computers, ICT equipment & software',
    group: 'Capital-allowance assets',
    category: 'capital_allowance',
    note: 'Accelerated capital allowance: 40% initial + 20% annual.'
  },
  {
    code: 'ca_small_value',
    label: 'Small-value assets (<= RM2,000 each)',
    group: 'Capital-allowance assets',
    category: 'capital_allowance',
    note: '100% allowance in the year of purchase; aggregate cap lifted for SMEs (unlimited).'
  },
  {
    code: 'ca_industrial_building',
    label: 'Industrial / qualifying building',
    group: 'Capital-allowance assets',
    category: 'capital_allowance',
    note: 'Industrial Building Allowance: 10% initial + 3% annual; land and most commercial buildings do not qualify.'
  },
  {
    code: 'ca_renovation',
    label: 'Qualifying renovation & refurbishment',
    group: 'Capital-allowance assets',
    category: 'capital_allowance',
    note: 'The general renovation deduction expired end-2022; no automatic YA2026 allowance is applied.'
  },
  {
    code: 'ca_balancing_charge',
    label: 'Balancing charge on disposal',
    group: 'Capital-allowance assets',
    category: 'capital_allowance',
    note: 'When disposal proceeds exceed tax residual value, this is ADDED back, increasing statutory income.'
  },
  {
    code: 'ca_balancing_allowance',
    label: 'Balancing allowance on disposal',
    group: 'Capital-allowance assets',
    category: 'capital_allowance',
    note: 'When tax residual value exceeds proceeds, this is deducted, reducing statutory income.'
  },
  {
    code: 'ca_unabsorbed_bf',
    label: 'Unabsorbed capital allowances b/f',
    group: 'Capital-allowance assets',
    category: 'capital_allowance',
    note: 'Capital allowances carried forward, deducted against statutory income from the same business.'
  },

  // Donations & reliefs
  {
    code: 'rel_approved_donations',
    label: 'Approved cash donations & gifts',
    group: 'Donations & reliefs',
    category: 'special_deduction',
    note: 'Deducted from aggregate income, capped at 10% of aggregate income (some government gifts uncapped).'
  },
  {
    code: 'rel_zakat',
    label: 'Zakat perniagaan (business zakat)',
    group: 'Donations & reliefs',
    category: 'special_deduction',
    note: 'Business zakat deduction restricted to 2.5% of aggregate income.'
  },
  {
    code: 'rel_rnd',
    label: 'R&D expenditure (approved)',
    group: 'Donations & reliefs',
    category: 'special_deduction',
    note: 'Approved R&D qualifies for a double deduction; enter the additional deduction amount.'
  },
  {
    code: 'rel_double_deduction_labour',
    label: 'Approved training / disabled-employee / internship',
    group: 'Donations & reliefs',
    category: 'special_deduction',
    note: 'Double deduction for approved training and qualifying employee/internship programmes.'
  },
  {
    code: 'rel_export_promotion',
    label: 'Export / market development',
    group: 'Donations & reliefs',
    category: 'special_deduction',
    note: 'Qualifying approved export-promotion expenses eligible for a double deduction.'
  },
  {
    code: 'rel_esg',
    label: 'ESG / sustainability expenditure',
    group: 'Donations & reliefs',
    category: 'special_deduction',
    note: 'Qualifying ESG expenditure eligible for a further deduction up to RM50,000 per year.'
  },
  {
    code: 'rel_business_losses',
    label: 'Business losses (current-year & b/f)',
    group: 'Donations & reliefs',
    category: 'special_deduction',
    note: 'Adjusted loss set off against income; unabsorbed losses carry forward up to 10 years.'
  },
  {
    code: 'rel_group_relief',
    label: 'Group relief (surrendered loss)',
    group: 'Donations & reliefs',
    category: 'special_deduction',
    note: 'Up to 70% of a related company’s current-year loss; both companies must have paid-up capital above RM2.5m (not SMEs).'
  }
]

const _byCode = new Map(TAX_ACCOUNTS.map((a) => [a.code, a]))

export function accountByCode(code: string): TaxAccount | undefined {
  return _byCode.get(code)
}

export function accountsInGroup(group: string): TaxAccount[] {
  return TAX_ACCOUNTS.filter((a) => a.group === group)
}
