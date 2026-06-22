import type {
  DefensePack,
  FormComputation,
  LineItem,
  ObligationCalendar,
} from "./types";

// Deterministic demo data mirroring the seeded Acme entity (Form C tax_payable = RM31,000).
export const ACME_TIN = "C2581234509";

export const acmeSsm = {
  tin: ACME_TIN,
  entity_type: "sdn_bhd",
  msic_codes: ["46900"],
  paid_up_capital: 1_000_000,
  gross_income: 5_000_000,
  employee_count: 12,
  sst_registered: true,
  basis_period_start: "2025-01-01",
  basis_period_end: "2025-12-31",
  commencement_date: "2018-03-01",
};

export const acmeLineItems: LineItem[] = [
  { code: "4000", description: "Revenue", amount: 500_000, category: "income" },
  { code: "5000", description: "Allowable operating expenses", amount: 300_000, category: "deductible" },
];

export const acmeCalendar: ObligationCalendar = {
  entity_tin: ACME_TIN,
  obligations: [
    { obligation_type: "income_tax", form: "C", due_date: "2026-07-31", rule_id: "oblig.income_tax.formc", config_version: "YA2026.1", status: "pending" },
    { obligation_type: "income_tax", form: "CP204", due_date: "2024-12-02", rule_id: "oblig.income_tax.cp204", config_version: "YA2026.1", status: "pending" },
    { obligation_type: "einvoice", form: "MyInvois", due_date: "2025-01-01", rule_id: "oblig.einvoice.phase", config_version: "YA2026.1", status: "pending" },
    { obligation_type: "sst", form: "SST-02", due_date: "2025-12-31", rule_id: "oblig.sst.return", config_version: "YA2026.1", status: "pending" },
    { obligation_type: "employer_mtd", form: "CP39", due_date: "2025-01-01", rule_id: "oblig.employer.mtd", config_version: "YA2026.1", status: "pending" },
  ],
};

export const acmeFormC: FormComputation = {
  form: "C",
  fields: {
    chargeable_income: { value: 200_000, inputs: ["income", "deductible"], rule_id: "cit.chargeable_income", config_version: "YA2026.1" },
    tax_payable: { value: 31_000, inputs: ["chargeable_income"], rule_id: "cit.rate.sme", config_version: "YA2026.1" },
  },
};

export const acmeDefense: DefensePack = {
  query: "Justify your RM4,800 repairs deduction",
  items: [
    {
      contested_item: "Repairs & maintenance — RM4,800",
      evidence: [["tax_payable", "trial_balance_acme", "ITA-1967-s33(1)"]],
    },
  ],
  citations: [
    { claim: "Repairs wholly & exclusively incurred in producing gross income are deductible under s.33(1).", clause_ids: ["ITA-1967-s33(1)"], verified: true },
  ],
  exposure_note:
    "If the position is not sustained, exposure may arise under ITA 1967 s.113 (incorrect return) / s.112 (failure to furnish); human review required.",
};

// A fabricated-citation example — used to demo the integrity gate rejecting unsupported clauses.
export const fabricatedDefense: DefensePack = {
  query: "Justify entertainment as fully deductible (made-up clause)",
  items: [{ contested_item: "Client entertainment — RM12,000", evidence: [] }],
  citations: [
    { claim: "Fully deductible under s.999.", clause_ids: ["ITA-1967-s999(fake)"], verified: false },
  ],
  exposure_note:
    "Unverified citation — blocked by the citation gate. No proof shown; do not file on this basis.",
};
