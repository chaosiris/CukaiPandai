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

export interface EntityTaxProfile {
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

export interface RiskFlag {
  code: string
  message: string
  severity: string
}

export interface FormCResponse {
  computation: FormComputation
  requires_approval: boolean
  risk_flags: RiskFlag[]
}

export interface FilingStartResponse {
  thread_id: string
  computation: FormComputation
  requires_approval: boolean
  risk_flags: RiskFlag[]
}

export interface FilingResumeResponse {
  approved: boolean
  computation: FormComputation
}

export interface Citation {
  claim: string
  clause_ids: string[]
  verified: boolean
  // RAG provenance fields (BE-13); optional — guard for null in render
  section?: string
  page_ref?: string
  url?: string
  passage?: string
}

export interface DefensePack {
  query: string
  items: Record<string, unknown>[]
  citations: Citation[]
  exposure_note: string
}

/** route_info() fields from the backend — present on /audit-defense and /classify ONLY */
export interface RouteInfo {
  sovereign: boolean
  active_model: string
}

export interface AuditDefenseResponse extends DefensePack, RouteInfo {}

export interface ClassifyResponse extends RouteInfo {
  line_items: LineItem[]
}

/** FastAPI 422 validation error envelope — detail[].loc/.msg/.type */
export interface ValidationErrorDetail {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface ApiValidationError {
  detail: ValidationErrorDetail[]
}

// --- Canonical seeded Acme entity (BE-8; all pages drive this, not page-local stubs) ---
// Real values from core/fixtures/entity_acme.json
export const ACME_TIN = 'C2581234509'

// SSM profile for seeded Acme — used in mock calls that require an ssm body
export const ACME_SSM: SsmProfile = {
  tin: ACME_TIN,
  entity_type: 'sdn_bhd',
  msic_codes: ['46900'],
  paid_up_capital: 1000000,
  gross_income: 5000000,
  employee_count: 12,
  sst_registered: true,
  basis_period_start: '2025-01-01',
  basis_period_end: '2025-12-31',
  commencement_date: '2018-03-01'
}

// --- Mock data (VITE_API_MOCK=1) — all data keyed to seeded Acme ---

const MOCK_ENTITY: EntityTaxProfile = {
  tin: ACME_TIN,
  entity_type: 'sdn_bhd',
  msic_codes: ['46900'],
  paid_up_capital: 1000000,
  gross_income: 5000000,
  employee_count: 12,
  sst_registered: true,
  basis_period_start: '2025-01-01',
  basis_period_end: '2025-12-31',
  commencement_date: '2018-03-01'
}

const MOCK_OBLIGATIONS: ObligationCalendar = {
  entity_tin: ACME_TIN,
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
    },
    {
      obligation_type: 'withholding_tax',
      form: 'CP37',
      due_date: '2026-02-28',
      rule_id: 'ITA_s109',
      config_version: 'ya_2026_v1',
      status: 'pending'
    }
  ]
}

const MOCK_FORM_C: FormCResponse = {
  computation: {
    form: 'Form C',
    fields: {
      gross_income: { value: 5000000, inputs: ['revenue'], rule_id: 'ITA_s4', config_version: 'ya_2026_v1' },
      adjusted_income: {
        value: 4800000,
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
  requires_approval: true,
  risk_flags: [
    {
      code: 'gross_chargeable_gap',
      message: 'Large gap between gross income (RM5,000,000) and chargeable income (RM200,000): deductions exceed 95%.',
      severity: 'high'
    }
  ]
}

const MOCK_FILING_START: FilingStartResponse = {
  thread_id: 'mock-thread-acme-001',
  computation: MOCK_FORM_C.computation,
  requires_approval: true,
  risk_flags: MOCK_FORM_C.risk_flags
}

const MOCK_FILING_RESUME: FilingResumeResponse = {
  approved: true,
  computation: MOCK_FORM_C.computation
}

const MOCK_CLASSIFY: ClassifyResponse = {
  line_items: [
    { code: 'REV', description: 'Trade revenue', amount: 5000000, category: 'revenue' },
    { code: 'SAL', description: 'Salaries and wages', amount: 2000000, category: 'expense' },
    { code: 'REP', description: 'Repairs and maintenance', amount: 4800, category: 'expense' },
    { code: 'DEP', description: 'Depreciation', amount: 120000, category: 'expense' }
  ],
  sovereign: true,
  active_model: 'nemo-super'
}

const MOCK_DEFENSE_VERIFIED_CITATION: Citation = {
  claim: 'Repairs deduction RM4,800 allowed under ITA s33(1)(a)',
  clause_ids: ['ITA_s33_1a'],
  verified: true,
  section: 'Section 33(1)(a)',
  page_ref: 'ITA 1967, p.47',
  url: 'https://www.hasil.gov.my/en/ita1967',
  passage: 'Outgoings and expenses wholly and exclusively incurred in the production of gross income.'
}

const MOCK_DEFENSE_FAKE_CITATION: Citation = {
  claim: '(integrity probe: fabricated clause, not a real citation)',
  clause_ids: ['ITA-1967-s999-FAKE'],
  verified: false
}

function makeMockDefense(injectFabricated: boolean): AuditDefenseResponse {
  return {
    query: 'Justify your RM4,800 repairs deduction',
    items: [
      {
        contested_item: 'RM4,800 repairs and maintenance deduction',
        evidence: [['invoice', 'INV-2025-0042: Office plumbing repair RM4,800']]
      }
    ],
    citations: injectFabricated
      ? [MOCK_DEFENSE_VERIFIED_CITATION, MOCK_DEFENSE_FAKE_CITATION]
      : [MOCK_DEFENSE_VERIFIED_CITATION],
    exposure_note:
      'No material audit risk identified for this deduction. The repairs are categorised as revenue expenditure under s33(1)(a) ITA 1967.',
    sovereign: true,
    active_model: 'nemo-super'
  }
}

const MOCK_MSIC: Record<string, unknown> = {
  code: '46900',
  description: 'Wholesale of other goods not elsewhere classified',
  section: 'G',
  division: '46',
  group: '469',
  class: '4690'
}

// --- Fetch helpers ---

/**
 * Parse a 422 validation error from FastAPI, returning a typed ApiValidationError
 * or re-throwing a plain Error for other HTTP failures.
 */
async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) return res.json() as Promise<T>
  if (res.status === 422) {
    const body = (await res.json()) as ApiValidationError
    const msgs = body.detail.map((d) => `${d.loc.join('.')}: ${d.msg}`).join('; ')
    const err = new Error(`Validation error: ${msgs}`) as Error & { validationDetail: ValidationErrorDetail[] }
    err.validationDetail = body.detail
    throw err
  }
  throw new Error(`${res.status} ${res.statusText}`)
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  return handleResponse<T>(res)
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return handleResponse<T>(res)
}

// --- Public API ---

/** GET /entities/{tin} — fetch a seeded entity profile (BE-8). 404 on unknown TIN. */
export async function getEntity(tin: string): Promise<EntityTaxProfile> {
  if (MOCK_MODE) {
    if (tin !== ACME_TIN) throw new Error(`404 Entity ${tin} not found`)
    return MOCK_ENTITY
  }
  return get<EntityTaxProfile>(`/entities/${tin}`)
}

/** POST /entities/{tin}/obligations — derive the YA2026 obligation calendar. */
export async function getObligations(tin: string, ssm: SsmProfile): Promise<ObligationCalendar> {
  if (MOCK_MODE) return MOCK_OBLIGATIONS
  return post<ObligationCalendar>(`/entities/${tin}/obligations`, { ssm })
}

/** POST /entities/{tin}/filings/form-c — one-shot synchronous computation (no HITL). */
export async function getFormC(tin: string, ssm: SsmProfile, line_items: LineItem[]): Promise<FormCResponse> {
  if (MOCK_MODE) return MOCK_FORM_C
  return post<FormCResponse>(`/entities/${tin}/filings/form-c`, { ssm, line_items })
}

/** POST /entities/{tin}/filings/form-c/start — run the HITL graph to the approval interrupt. */
export async function startFiling(tin: string, ssm: SsmProfile, line_items: LineItem[]): Promise<FilingStartResponse> {
  if (MOCK_MODE) return MOCK_FILING_START
  return post<FilingStartResponse>(`/entities/${tin}/filings/form-c/start`, { ssm, line_items })
}

/** POST /entities/{tin}/filings/form-c/resume — resume a paused thread with the approval decision. */
export async function resumeFiling(tin: string, thread_id: string, approved: boolean): Promise<FilingResumeResponse> {
  if (MOCK_MODE) return MOCK_FILING_RESUME
  return post<FilingResumeResponse>(`/entities/${tin}/filings/form-c/resume`, { thread_id, approved })
}

/** POST /entities/{tin}/documents/classify — classify raw trial-balance text into LineItem[]. */
export async function classifyTrialBalance(tin: string, raw_text: string): Promise<ClassifyResponse> {
  if (MOCK_MODE) return MOCK_CLASSIFY
  return post<ClassifyResponse>(`/entities/${tin}/documents/classify`, { raw_text })
}

/** POST /entities/{tin}/audit-defense — build a citation-grounded defense pack. */
export async function getAuditDefense(
  tin: string,
  query: string,
  evidence: [string, string][],
  injectFabricated = false
): Promise<AuditDefenseResponse> {
  if (MOCK_MODE) return makeMockDefense(injectFabricated)
  return post<AuditDefenseResponse>(`/entities/${tin}/audit-defense`, {
    query,
    evidence,
    ...(injectFabricated && { inject_fabricated: true })
  })
}

/** GET /reference/msic/{code} — look up an MSIC activity code (BE-4). */
export async function getMsic(code: string): Promise<Record<string, unknown>> {
  if (MOCK_MODE) return MOCK_MSIC
  return get<Record<string, unknown>>(`/reference/msic/${code}`)
}
