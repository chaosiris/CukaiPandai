export type ClauseCategory = "Deduction" | "Non-deductible" | "Procedure" | "Penalty";

export type Clause = {
  clause_id: string;
  source: string;
  category: ClauseCategory;
  text: string;
};

export const CLAUSE_CATEGORIES: ClauseCategory[] = [
  "Deduction",
  "Non-deductible",
  "Procedure",
  "Penalty",
];

// `clause_id`, `source` and `text` mirror the backend law corpus seed VERBATIM
// (core/fixtures/lawcorpus_seed.json) — guarded by corpus-parity.test.ts, which fails on any drift.
// `category` is a UI-only annotation used for the filter chips; it has no backend counterpart.
export const CLAUSES: Clause[] = [
  {
    clause_id: "ITA-1967-s33(1)",
    source: "Income Tax Act 1967 s.33(1)",
    category: "Deduction",
    text: "Adjusted income: deductions wholly and exclusively incurred in the production of gross income are allowable.",
  },
  {
    clause_id: "ITA-1967-s39",
    source: "Income Tax Act 1967 s.39",
    category: "Non-deductible",
    text: "Deductions not allowed, including certain private and capital expenditure and a portion of entertainment expenditure.",
  },
  {
    clause_id: "ITA-1967-s107C",
    source: "Income Tax Act 1967 s.107C",
    category: "Procedure",
    text: "Estimate of tax payable (CP204) and payment by monthly instalments.",
  },
  {
    clause_id: "ITA-1967-s112",
    source: "Income Tax Act 1967 s.112",
    category: "Penalty",
    text: "Penalty for failure to furnish return or give notice of chargeability.",
  },
  {
    clause_id: "ITA-1967-s113",
    source: "Income Tax Act 1967 s.113",
    category: "Penalty",
    text: "Penalty for incorrect returns or understatement of income.",
  },
];
