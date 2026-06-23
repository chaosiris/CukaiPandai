// Typed API client for CukaiPandai backend.
// Types mirror backend Pydantic models in backend/core/models.py and backend/api/schemas.py.
// Set VITE_API_MOCK=1 in .env to use the mock mode (no backend required).

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const MOCK_MODE = import.meta.env.VITE_API_MOCK === '1'

// --- Shared request types (mirror backend/api/schemas.py) ---

export interface SsmProfile {
  tin: string
  entity_type: string
  msic_codes: string[]
  paid_up_capital: number
  gross_income: number
  employee_count: number
  sst_registered: boolean
  basis_period_start: string
  basis_period_end: string
  commencement_date?: string
}

export interface LineItem {
  code: string
  description: string
  amount: number
  category: string
}

// --- Response types (mirror backend/core/models.py) ---

export interface Obligation {
  obligation_type: string
  form: string
  due_date: string
  rule_id: string
  config_version: string
  status: string
}

export interface ObligationCalendar {
  entity_tin: string
  obligations: Obligation[]
}

export interface FigureTrace {
  value: number
  inputs: string[]
  rule_id: string
  config_version: string
}

export interface FormComputation {
  form: string
  fields: Record<string, FigureTrace>
}

export interface FormCResponse {
  computation: FormComputation
  requires_approval: boolean
}

export interface Citation {
  claim: string
  clause_ids: string[]
  verified: boolean
}

export interface DefensePack {
  query: string
  items: Record<string, unknown>[]
  citations: Citation[]
  exposure_note: string
}

// --- Mock data ---

const MOCK_TIN = 'C2581234509'

const MOCK_OBLIGATIONS: ObligationCalendar = {
  entity_tin: MOCK_TIN,
  obligations: [
    {
      obligation_type: 'corporate_tax',
      form: 'Form C',
      due_date: '2026-07-31',
      rule_id: 'ITA_s77A',
      config_version: 'ya_2026_v1',
      status: 'pending'
    },
    {
      obligation_type: 'estimated_tax',
      form: 'CP204',
      due_date: '2026-01-31',
      rule_id: 'ITA_s107C',
      config_version: 'ya_2026_v1',
      status: 'pending'
    }
  ]
}

const MOCK_FORM_C: FormCResponse = {
  computation: {
    form: 'Form C',
    fields: {
      gross_income: { value: 500000, inputs: ['revenue'], rule_id: 'ITA_s4', config_version: 'ya_2026_v1' },
      adjusted_income: {
        value: 450000,
        inputs: ['gross_income', 'allowable_deductions'],
        rule_id: 'ITA_s33',
        config_version: 'ya_2026_v1'
      },
      chargeable_income: {
        value: 200000,
        inputs: ['adjusted_income', 'capital_allowances'],
        rule_id: 'ITA_s43',
        config_version: 'ya_2026_v1'
      },
      tax_payable: { value: 31000, inputs: ['chargeable_income'], rule_id: 'ITA_s4_sch1', config_version: 'ya_2026_v1' }
    }
  },
  requires_approval: true
}

const MOCK_DEFENSE: DefensePack = {
  query: 'Justify your RM4,800 repairs deduction',
  items: [
    {
      clause_id: 'ITA_s33_1a',
      text: 'Wholly and exclusively incurred in the production of gross income',
      source: 'ITA 1967 s33(1)(a)'
    }
  ],
  citations: [
    { claim: 'Repairs deduction RM4,800 allowed under ITA s33(1)(a)', clause_ids: ['ITA_s33_1a'], verified: true }
  ],
  exposure_note: 'No material audit risk identified for this deduction.'
}

// --- Fetch helpers ---

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

// --- Public API ---

export async function getObligations(tin: string, ssm: SsmProfile): Promise<ObligationCalendar> {
  if (MOCK_MODE) return MOCK_OBLIGATIONS
  return post<ObligationCalendar>(`/entities/${tin}/obligations`, { ssm })
}

export async function getFormC(tin: string, ssm: SsmProfile, line_items: LineItem[]): Promise<FormCResponse> {
  if (MOCK_MODE) return MOCK_FORM_C
  return post<FormCResponse>(`/entities/${tin}/filings/form-c`, { ssm, line_items })
}

export async function getAuditDefense(tin: string, query: string, evidence: [string, string][]): Promise<DefensePack> {
  if (MOCK_MODE) return MOCK_DEFENSE
  return post<DefensePack>(`/entities/${tin}/audit-defense`, { query, evidence })
}
