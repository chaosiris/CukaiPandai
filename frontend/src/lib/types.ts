// Mirror of the Plan 2 FastAPI schemas (the Chaos↔Tuna contract).
export type FigureTrace = {
  value: number;
  inputs: string[];
  rule_id: string;
  config_version: string;
};

export type FormComputation = {
  form: string;
  fields: Record<string, FigureTrace>;
};

export type Obligation = {
  obligation_type: string;
  form: string;
  due_date: string;
  rule_id: string;
  config_version: string;
  status: string;
};

export type ObligationCalendar = {
  entity_tin: string;
  obligations: Obligation[];
};

export type Citation = {
  claim: string;
  clause_ids: string[];
  verified: boolean;
};

export type DefenseItem = {
  contested_item: string;
  evidence: string[][];
};

export type DefensePack = {
  query: string;
  items: DefenseItem[];
  citations: Citation[];
  exposure_note: string;
};

export type LineItem = {
  code: string;
  description: string;
  amount: number;
  category: "income" | "deductible" | "non_deductible";
};

export type FormCResult = {
  computation: FormComputation;
  requires_approval: boolean;
};
