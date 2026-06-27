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
  // State/FT ISO code (e.g. SGR, KUL) — drives state-specific holiday shifting; omit for national only.
  state?: string
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
  state?: string
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

export interface AuditDefenseResponse extends DefensePack, RouteInfo {
  /** Pandai's conversational answer (PR-C); falls back to exposure_note on older BE. */
  answer?: string
  /** Up to 3 follow-up question suggestions (may contain empty-string padding — filter on FE). */
  followups?: string[]
}

/** A single persisted conversation turn (PR-C BE-2.3). */
export interface ConversationTurn {
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  ts?: string
}

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
  commencement_date: '2018-03-01',
  state: 'SGR'
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
  commencement_date: '2018-03-01',
  state: 'SGR'
}

// Per-persona mock obligations — keyed by TIN so persona switching shows different deadlines.
// These mirror derive_obligations() in backend/core/obligations.py exactly:
//   Form C (income_tax / oblig.income_tax.formc): always; due = last day of 7th month after FYE
//   CP204  (income_tax / oblig.income_tax.cp204): always; due = basis_period_start - 30 days
//   MyInvois (einvoice / oblig.einvoice.phase): if gross_income >= 1,000,000; due = basis_period_start
//   SST-02 (sst / oblig.sst.return): if sst_registered; due = basis_period_end
//   CP39  (employer_mtd / oblig.employer.mtd): if employee_count > 0; due = basis_period_start
// config_version matches ya_2026.yaml: 'YA2026.1'
// Filing/payment deadlines roll off weekends + public holidays, state-aware via the entity's state
// (Acme=SGR, Sinar=KUL, Selera=PNG); the MyInvois mandate-start is NOT shifted.
const MOCK_OBLIGATIONS_BY_TIN: Record<string, ObligationCalendar> = {
  // Acme: gross_income=5,000,000; sst_registered=true; employee_count=12
  // basis_period 2025-01-01–2025-12-31; commencement 2018-03-01 (not in basis period)
  // Form C due: 2025-12-31 + 7m → last day of Jul 2026 = 2026-07-31
  // CP204  due: 2025-01-01 - 30d = 2024-12-02
  // MyInvois: 5,000,000 in the [5m,25m) band → mandatory_from = 2025-07-01 (mandate, not shifted)
  // SST-02: sst_registered → due = basis_period_end = 2025-12-31 (Wed, no shift)
  // CP39: employees → basis_period_start 2025-01-01 = New Year (SGR) → shifts to 2025-01-02
  [ACME_TIN]: {
    entity_tin: ACME_TIN,
    obligations: [
      {
        obligation_type: 'income_tax',
        form: 'C',
        due_date: '2026-07-31',
        rule_id: 'oblig.income_tax.formc',
        config_version: 'YA2026.1',
        status: 'pending'
      },
      {
        obligation_type: 'income_tax',
        form: 'CP204',
        due_date: '2024-12-02',
        rule_id: 'oblig.income_tax.cp204',
        config_version: 'YA2026.1',
        status: 'overdue'
      },
      {
        obligation_type: 'einvoice',
        form: 'MyInvois',
        due_date: '2025-07-01',
        rule_id: 'oblig.einvoice.phase',
        config_version: 'YA2026.1',
        status: 'overdue'
      },
      {
        obligation_type: 'sst',
        form: 'SST-02',
        due_date: '2025-12-31',
        rule_id: 'oblig.sst.return',
        config_version: 'YA2026.1',
        status: 'overdue'
      },
      {
        obligation_type: 'employer_mtd',
        form: 'CP39',
        due_date: '2025-01-02',
        rule_id: 'oblig.employer.mtd',
        config_version: 'YA2026.1',
        status: 'overdue'
      }
    ]
  },
  // Sinar: gross_income=380,000; sst_registered=false; employee_count=3
  // basis_period 2025-01-01–2025-12-31; commencement 2022-04-01 (not in basis period)
  // Form C due: 2025-12-31 + 7m = 2026-07-31
  // CP204  due: 2025-01-01 - 30d = 2024-12-02
  // MyInvois: 380,000 < 1,000,000 → OMITTED
  // SST-02: sst_registered=false → OMITTED
  // CP39: 3 employees → basis_period_start 2025-01-01 = New Year (KUL) → shifts to 2025-01-02
  C7654321098: {
    entity_tin: 'C7654321098',
    obligations: [
      {
        obligation_type: 'income_tax',
        form: 'C',
        due_date: '2026-07-31',
        rule_id: 'oblig.income_tax.formc',
        config_version: 'YA2026.1',
        status: 'pending'
      },
      {
        obligation_type: 'income_tax',
        form: 'CP204',
        due_date: '2024-12-02',
        rule_id: 'oblig.income_tax.cp204',
        config_version: 'YA2026.1',
        status: 'overdue'
      },
      {
        obligation_type: 'employer_mtd',
        form: 'CP39',
        due_date: '2025-01-02',
        rule_id: 'oblig.employer.mtd',
        config_version: 'YA2026.1',
        status: 'overdue'
      }
    ]
  },
  // Selera: gross_income=2,500,000; sst_registered=true; employee_count=45
  // basis_period 2024-04-01–2025-03-31; commencement 2019-09-01 (not in basis period)
  // Form C due: 2025-03-31 + 7m → last day of Oct 2025 = 2025-10-31
  // CP204  due: 2024-04-01 - 30d = 2024-03-02 (Sat) → shifts to 2024-03-04
  // MyInvois: 2,500,000 in the [1m,5m) band → mandatory_from = 2026-01-01 (mandate, not shifted)
  // SST-02: sst_registered → basis_period_end 2025-03-31 = Hari Raya (PNG) → shifts to 2025-04-02
  // CP39: 45 employees → due = basis_period_start = 2024-04-01
  C3219876540: {
    entity_tin: 'C3219876540',
    obligations: [
      {
        obligation_type: 'income_tax',
        form: 'C',
        due_date: '2025-10-31',
        rule_id: 'oblig.income_tax.formc',
        config_version: 'YA2026.1',
        status: 'overdue'
      },
      {
        obligation_type: 'income_tax',
        form: 'CP204',
        due_date: '2024-03-04',
        rule_id: 'oblig.income_tax.cp204',
        config_version: 'YA2026.1',
        status: 'overdue'
      },
      {
        obligation_type: 'einvoice',
        form: 'MyInvois',
        due_date: '2026-01-01',
        rule_id: 'oblig.einvoice.phase',
        config_version: 'YA2026.1',
        status: 'overdue'
      },
      {
        obligation_type: 'sst',
        form: 'SST-02',
        due_date: '2025-04-02',
        rule_id: 'oblig.sst.return',
        config_version: 'YA2026.1',
        status: 'overdue'
      },
      {
        obligation_type: 'employer_mtd',
        form: 'CP39',
        due_date: '2024-04-01',
        rule_id: 'oblig.employer.mtd',
        config_version: 'YA2026.1',
        status: 'overdue'
      }
    ]
  }
}

// Fallback for unknown TINs
const MOCK_OBLIGATIONS = MOCK_OBLIGATIONS_BY_TIN[ACME_TIN]

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

// Per-persona mock classify responses keyed by TIN (TD-J1 mock fidelity).
// Each set uses the entity's own gross_income as the revenue figure — not a static Acme amount.
// Line items are the user's own input categories/amounts; no invented tax rates or thresholds.
const MOCK_CLASSIFY_BY_TIN: Record<string, ClassifyResponse> = {
  // Acme: gross_income=5,000,000; 12 employees. Codes map to the fixed tax-account taxonomy.
  [ACME_TIN]: {
    line_items: [
      { code: 'rev_sales', description: 'Sales / turnover', amount: 5000000, category: 'income' },
      {
        code: 'staff_salaries',
        description: 'Salaries, wages, bonuses & commissions',
        amount: 2000000,
        category: 'deductible'
      },
      { code: 'rep_maintenance', description: 'Repairs & maintenance', amount: 4800, category: 'deductible' },
      {
        code: 'dep_depreciation',
        description: 'Depreciation of property, plant & equipment',
        amount: 120000,
        category: 'non_deductible'
      }
    ],
    sovereign: true,
    active_model: 'nemo-super'
  },
  // Sinar: gross_income=380,000; 3 employees
  C7654321098: {
    line_items: [
      { code: 'rev_sales', description: 'Sales / turnover', amount: 380000, category: 'income' },
      {
        code: 'staff_salaries',
        description: 'Salaries, wages, bonuses & commissions',
        amount: 120000,
        category: 'deductible'
      },
      {
        code: 'admin_software_saas',
        description: 'Software subscriptions / SaaS / e-invoicing',
        amount: 18000,
        category: 'deductible'
      },
      {
        code: 'admin_office_supplies',
        description: 'Printing, stationery, postage & supplies',
        amount: 9600,
        category: 'deductible'
      }
    ],
    sovereign: true,
    active_model: 'nemo-super'
  },
  // Selera: gross_income=2,500,000; 45 employees
  C3219876540: {
    line_items: [
      { code: 'rev_sales', description: 'Sales / turnover', amount: 2500000, category: 'income' },
      {
        code: 'staff_salaries',
        description: 'Salaries, wages, bonuses & commissions',
        amount: 900000,
        category: 'deductible'
      },
      {
        code: 'cos_purchases',
        description: 'Purchases of goods / raw materials',
        amount: 850000,
        category: 'deductible'
      },
      { code: 'prem_rent', description: 'Business premises rent / lease', amount: 120000, category: 'deductible' },
      {
        code: 'prem_utilities',
        description: 'Utilities (electricity, water, gas)',
        amount: 48000,
        category: 'deductible'
      }
    ],
    sovereign: true,
    active_model: 'nemo-super'
  }
}

function makeMockClassify(tin: string, entityProfile?: EntityTaxProfile): ClassifyResponse {
  if (MOCK_CLASSIFY_BY_TIN[tin]) return MOCK_CLASSIFY_BY_TIN[tin]
  // Custom entity: derive revenue from gross_income; keep other lines proportional (taxonomy codes)
  const revenue = entityProfile?.gross_income ?? 1000000
  return {
    line_items: [
      { code: 'rev_sales', description: 'Sales / turnover', amount: revenue, category: 'income' },
      {
        code: 'staff_salaries',
        description: 'Salaries, wages, bonuses & commissions',
        amount: Math.round(revenue * 0.35),
        category: 'deductible'
      },
      {
        code: 'admin_office_supplies',
        description: 'Printing, stationery, postage & supplies',
        amount: Math.round(revenue * 0.12),
        category: 'deductible'
      }
    ],
    sovereign: true,
    active_model: 'nemo-super'
  }
}

// Keep as fallback for callers that don't have a TIN context
const MOCK_CLASSIFY: ClassifyResponse = MOCK_CLASSIFY_BY_TIN[ACME_TIN]

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

function makeMockDefense(injectFabricated: boolean, query?: string): AuditDefenseResponse {
  const isFollowup = query && query.length > 0
  const answerBody = injectFabricated
    ? 'The clause ITA-1967-s999-FAKE you cited does not exist in the verified law corpus. The deterministic ground_citation gate has rejected it. Your RM4,800 repairs deduction is legitimately supported under Section 33(1)(a) of the Income Tax Act 1967, which covers outgoings wholly and exclusively incurred in the production of gross income.'
    : isFollowup
      ? 'Based on the figures in your filing, here is the relevant guidance for your question. The deduction you are asking about falls within the scope of Malaysian tax law as verified in the law corpus. Your filing shows consistent figures that support the claimed treatment. Where LHDN raises a query, citing the relevant ITA section and your supporting invoices is the appropriate response.'
      : 'No material audit risk has been identified for the RM4,800 repairs and maintenance deduction. This amount is categorised as revenue expenditure under Section 33(1)(a) of the Income Tax Act 1967. Outgoings wholly and exclusively incurred in the production of gross income are deductible. Ensure you retain the relevant invoices and contracts as supporting documentation in the event of an LHDN query.'

  return {
    query: query ?? 'Justify your RM4,800 repairs deduction',
    items: [
      {
        contested_item: 'RM4,800 repairs and maintenance deduction',
        evidence: [['invoice', 'INV-2025-0042: Office plumbing repair RM4,800']]
      }
    ],
    citations: injectFabricated
      ? [MOCK_DEFENSE_VERIFIED_CITATION, MOCK_DEFENSE_FAKE_CITATION]
      : [MOCK_DEFENSE_VERIFIED_CITATION],
    exposure_note: answerBody,
    answer: answerBody,
    followups: [
      'What supporting documents should I keep for this deduction?',
      'Is there a threshold above which capital allowances apply instead?',
      'How does LHDN typically audit repairs and maintenance claims?'
    ],
    sovereign: true,
    active_model: 'nemo-super'
  }
}

// Module-scoped in-memory mock store for conversation history keyed by filing id.
const _mockConversations: Record<string, ConversationTurn[]> = {}

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
    const msgs = Array.isArray(body.detail)
      ? body.detail.map((d) => `${d.loc.join('.')}: ${d.msg}`).join('; ')
      : String(body.detail)
    const err = new Error(`Validation error: ${msgs}`) as Error & { validationDetail?: ValidationErrorDetail[] }
    if (Array.isArray(body.detail)) err.validationDetail = body.detail
    throw err
  }
  // Other errors: surface the FastAPI `detail` string when present (e.g. "Invalid email or password").
  let message = `${res.status} ${res.statusText}`
  try {
    const body = (await res.json()) as { detail?: unknown }
    if (typeof body.detail === 'string') message = body.detail
  } catch {
    // non-JSON body; keep the status line
  }
  throw new Error(message)
}

/** Attach the bearer token (if signed in) to every request. */
function authHeaders(): Record<string, string> {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

/**
 * Guarantee a session token before an authenticated `/me/*` request. The app is guest-first: a user
 * can reach the consoles via the demo persona / journey path (or after their token was cleared)
 * without ever clicking "Continue as Guest", which previously made `/me/*` fail with
 * "Missing bearer token". Mint a shared-guest token on demand instead. Best-effort: if the mint
 * fails, the caller still surfaces its own auth error. Concurrent callers de-dupe on one in-flight mint.
 */
let _guestMint: Promise<void> | null = null
async function ensureSession(): Promise<void> {
  if (MOCK_MODE || getToken()) return
  if (!_guestMint) {
    _guestMint = authGuest()
      .then((res) => {
        setToken(res.token)
        // Persist the guest markers so AuthContext hydrates consistently on the next load
        // (keys mirror AuthContext: cp_user + cp_entered_as_guest).
        try {
          localStorage.setItem('cp_user', JSON.stringify(res.user))
          localStorage.setItem('cp_entered_as_guest', '1')
        } catch {
          // localStorage unavailable — the token in memory still authorizes this session
        }
        // Notify AuthContext so the in-session UI (profile popover) flips to Guest immediately,
        // without waiting for a reload. AuthContext subscribes to this event.
        try {
          window.dispatchEvent(new CustomEvent<AuthUser>('cp:guest-session', { detail: res.user }))
        } catch {
          // non-browser env (e.g. SSR/tests) — no-op
        }
      })
      .catch(() => {
        // leave tokenless — the /me call will surface its own error
      })
      .finally(() => {
        _guestMint = null
      })
  }
  await _guestMint
}

// A failed fetch (server unreachable / cold-started / suspended on free hosting) rejects with a
// TypeError before any HTTP response. Surface a calm "still booting" message instead of the raw
// browser "NetworkError when attempting to fetch resource".
const SERVER_BOOTING_MESSAGE =
  'The server is still starting up. Free-tier hosting can take up to a minute to wake on the first request -- please wait for it to boot, then refresh.'

async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await globalThis.fetch(input, init)
  } catch {
    throw new Error(SERVER_BOOTING_MESSAGE)
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await safeFetch(`${BASE_URL}${path}`, { headers: { ...authHeaders() } })
  return handleResponse<T>(res)
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await safeFetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  })
  return handleResponse<T>(res)
}

// --- Public API ---

// Mock entity profiles for all three FE-8 personas — keyed by TIN so the picker
// works in mock mode without hitting the backend.
const MOCK_ENTITIES: Record<string, EntityTaxProfile> = {
  [ACME_TIN]: MOCK_ENTITY,
  C7654321098: {
    tin: 'C7654321098',
    entity_type: 'sdn_bhd',
    msic_codes: ['62010'],
    paid_up_capital: 100000,
    gross_income: 380000,
    employee_count: 3,
    sst_registered: false,
    basis_period_start: '2025-01-01',
    basis_period_end: '2025-12-31',
    commencement_date: '2022-04-01',
    state: 'KUL'
  },
  C3219876540: {
    tin: 'C3219876540',
    entity_type: 'sdn_bhd',
    msic_codes: ['56101'],
    paid_up_capital: 500000,
    gross_income: 2500000,
    employee_count: 45,
    sst_registered: true,
    basis_period_start: '2024-04-01',
    basis_period_end: '2025-03-31',
    commencement_date: '2019-09-01',
    state: 'PNG'
  }
}

/** GET /entities/{tin} — fetch a seeded entity profile (BE-8). 404 on unknown TIN. */
export async function getEntity(tin: string): Promise<EntityTaxProfile> {
  if (MOCK_MODE) {
    const profile = MOCK_ENTITIES[tin]
    if (!profile) throw new Error(`404 Entity ${tin} not found`)
    return profile
  }
  return get<EntityTaxProfile>(`/entities/${tin}`)
}

/** POST /entities/{tin}/obligations — derive the YA2026 obligation calendar. */
// Mock-mode obligation derivation — mirrors backend core/obligations.py so a CUSTOM company in
// mock mode gets its OWN calendar (which forms apply + dates from its basis period) instead of
// falling back to a seeded persona. Weekend-only shift (the FE has no public-holiday data; the
// seeded personas keep their exact, public-holiday-shifted dates from MOCK_OBLIGATIONS_BY_TIN).
function _isoDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function _rollWeekend(d: Date): Date {
  const x = new Date(d.getTime())
  while (x.getUTCDay() === 0 || x.getUTCDay() === 6) x.setUTCDate(x.getUTCDate() + 1)
  return x
}
function mockDeriveObligations(ssm: SsmProfile): ObligationCalendar {
  const v = 'YA2026.1'
  const start = new Date(`${ssm.basis_period_start}T00:00:00Z`)
  const end = new Date(`${ssm.basis_period_end}T00:00:00Z`)
  const now = Date.now()
  const obs: Obligation[] = []
  const add = (form: string, obligation_type: string, rule_id: string, due: Date, shift = true) => {
    const d = shift ? _rollWeekend(due) : due
    obs.push({
      obligation_type,
      form,
      due_date: _isoDay(d),
      rule_id,
      config_version: v,
      status: d.getTime() < now ? 'overdue' : 'pending'
    })
  }
  // Form C: last day of the 7th month after the financial year-end.
  add(
    'C',
    'income_tax',
    'oblig.income_tax.formc',
    new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 7 + 1, 0))
  )
  // CP204: commencement + 3m if commencement falls within the basis year, else basis_start - 30 days.
  let cp204 = new Date(start.getTime())
  cp204.setUTCDate(cp204.getUTCDate() - 30)
  if (ssm.commencement_date) {
    const comm = new Date(`${ssm.commencement_date}T00:00:00Z`)
    const plus12 = new Date(Date.UTC(start.getUTCFullYear() + 1, start.getUTCMonth(), start.getUTCDate()))
    if (comm >= start && comm <= plus12) {
      cp204 = new Date(Date.UTC(comm.getUTCFullYear(), comm.getUTCMonth() + 3, comm.getUTCDate()))
    }
  }
  add('CP204', 'income_tax', 'oblig.income_tax.cp204', cp204)
  // MyInvois mandate-start = the matching turnover phase's statutory date (mirrors backend DEAD-3);
  // not holiday-shifted. Below RM1m turnover is exempt (omitted).
  const mandate =
    ssm.gross_income >= 100_000_000
      ? '2024-08-01'
      : ssm.gross_income >= 25_000_000
        ? '2025-01-01'
        : ssm.gross_income >= 5_000_000
          ? '2025-07-01'
          : ssm.gross_income >= 1_000_000
            ? '2026-01-01'
            : null
  if (mandate) add('MyInvois', 'einvoice', 'oblig.einvoice.phase', new Date(`${mandate}T00:00:00Z`), false)
  if (ssm.sst_registered) add('SST-02', 'sst', 'oblig.sst.return', end)
  if (ssm.employee_count > 0) add('CP39', 'employer_mtd', 'oblig.employer.mtd', start)
  return { entity_tin: ssm.tin, obligations: obs }
}

export async function getObligations(tin: string, ssm: SsmProfile): Promise<ObligationCalendar> {
  if (MOCK_MODE) {
    // Seeded personas use their exact baked calendar; a custom company derives its own from the SSM.
    const lookupTin = tin === 'CUSTOM' ? ssm.tin : tin
    return MOCK_OBLIGATIONS_BY_TIN[lookupTin] ?? mockDeriveObligations(ssm)
  }
  // Use the real SSM TIN in the URL path (not the 'CUSTOM' context key).
  const apiTin = tin === 'CUSTOM' ? ssm.tin : tin
  return post<ObligationCalendar>(`/entities/${apiTin}/obligations`, { ssm })
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
export async function classifyTrialBalance(
  tin: string,
  raw_text: string,
  profile?: EntityTaxProfile
): Promise<ClassifyResponse> {
  if (MOCK_MODE) return makeMockClassify(tin, profile ?? MOCK_ENTITIES[tin])
  return post<ClassifyResponse>(`/entities/${tin}/documents/classify`, { raw_text })
}

/** POST /entities/{tin}/audit-defense — build a citation-grounded defense pack. */
export async function getAuditDefense(
  tin: string,
  query: string,
  evidence: [string, string][],
  injectFabricated = false,
  filing_id?: string
): Promise<AuditDefenseResponse> {
  if (MOCK_MODE) {
    const res = makeMockDefense(injectFabricated, query)
    // Persist to mock conversation store if a filing_id is supplied
    if (filing_id) {
      if (!_mockConversations[filing_id]) _mockConversations[filing_id] = []
      _mockConversations[filing_id].push({ role: 'user', content: query, ts: new Date().toISOString() })
      _mockConversations[filing_id].push({
        role: 'assistant',
        content: res.answer ?? res.exposure_note,
        citations: res.citations,
        ts: new Date().toISOString()
      })
    }
    return res
  }
  return post<AuditDefenseResponse>(`/entities/${tin}/audit-defense`, {
    query,
    evidence,
    ...(injectFabricated && { inject_fabricated: true }),
    ...(filing_id && { filing_id })
  })
}

/** GET /me/filings/{id}/conversation — load the persisted conversation history for a filing. */
export async function getFilingConversation(id: string): Promise<ConversationTurn[]> {
  if (MOCK_MODE) return [...(_mockConversations[id] ?? [])]
  await ensureSession()
  return get<ConversationTurn[]>(`/me/filings/${id}/conversation`)
}

/** GET /reference/msic/{code} — look up an MSIC activity code (BE-4). */
export async function getMsic(code: string): Promise<Record<string, unknown>> {
  if (MOCK_MODE) return MOCK_MSIC
  return get<Record<string, unknown>>(`/reference/msic/${code}`)
}

/**
 * POST /entities/{tin}/documents/upload — multipart file upload → classify.
 * T6: does NOT use post<T>() (which sets Content-Type: application/json).
 * The browser sets the multipart/form-data boundary automatically.
 * Mock branch returns MOCK_CLASSIFY so the flow works with VITE_API_MOCK=1.
 */
export async function uploadDocument(tin: string, file: File, profile?: EntityTaxProfile): Promise<ClassifyResponse> {
  if (MOCK_MODE) return makeMockClassify(tin, profile ?? MOCK_ENTITIES[tin])
  const form = new FormData()
  form.append('file', file)
  const res = await safeFetch(`${BASE_URL}/entities/${tin}/documents/upload`, {
    method: 'POST',
    body: form
  })
  return handleResponse<ClassifyResponse>(res)
}

/**
 * POST /entities — create or replace a custom entity (BE-J1).
 * Body is the SSM profile. Returns the stored EntityTaxProfile.
 * Mock branch is a no-op echo — returns the ssm cast to EntityTaxProfile.
 */
export async function createEntity(ssm: SsmProfile): Promise<EntityTaxProfile> {
  if (MOCK_MODE) return ssm as EntityTaxProfile
  return post<EntityTaxProfile>('/entities', { ssm })
}

// --- Auth (real backend: hashed passwords + JWT + Google SSO; mock-simulated when VITE_API_MOCK=1) ---

export interface AuthUser {
  id: string
  email: string
  name: string | null
  provider: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

const TOKEN_KEY = 'cp_token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // localStorage unavailable; the session simply won't persist across reloads
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore
  }
}

function mockAuth(email: string, provider = 'password', name?: string): AuthResponse {
  const lower = email.toLowerCase()
  return {
    token: `mock-jwt.${btoa(lower)}`,
    user: { id: `mock-${btoa(lower).slice(0, 12)}`, email: lower, name: name ?? lower.split('@')[0], provider }
  }
}

/** POST /auth/signup — create an account, returns {token, user}. */
export async function authSignup(email: string, password: string, name?: string): Promise<AuthResponse> {
  if (MOCK_MODE) {
    if (!email.includes('@') || password.length < 8) {
      throw new Error('Enter a valid email and a password of at least 8 characters')
    }
    return mockAuth(email, 'password', name)
  }
  return post<AuthResponse>('/auth/signup', { email, password, name })
}

/** POST /auth/login — sign in with email + password. */
export async function authLogin(email: string, password: string): Promise<AuthResponse> {
  if (MOCK_MODE) {
    if (!email.includes('@') || password.length < 1) throw new Error('Enter your email and password')
    return mockAuth(email)
  }
  return post<AuthResponse>('/auth/login', { email, password })
}

/** POST /auth/google — exchange a Google ID token for our session. */
export async function authGoogle(idToken: string): Promise<AuthResponse> {
  if (MOCK_MODE) return mockAuth('demo.user@gmail.com', 'google', 'Demo User')
  return post<AuthResponse>('/auth/google', { id_token: idToken })
}

/** POST /auth/guest — mint a shared-guest JWT (no body). Mock returns a fake token+user. */
export async function authGuest(): Promise<AuthResponse> {
  if (MOCK_MODE) {
    return {
      token: 'mock-guest',
      user: { id: 'guest-shared', email: 'guest@cukaipandai.local', name: 'Guest', provider: 'guest' }
    }
  }
  return post<AuthResponse>('/auth/guest', {})
}

/** GET /auth/me — resolve the current user from the stored bearer token (real mode only). */
export async function authMe(): Promise<AuthUser> {
  return get<AuthUser>('/auth/me')
}

// --- Per-user entity profile (EP-1; EN-2) ---

// Module-scoped in-memory mock store for the guest/demo entity profile.
let _mockMyEntity: EntityTaxProfile | null = null

/** GET /me/entity — fetch the current user's saved entity profile (404 if none). */
export async function getMyEntity(): Promise<EntityTaxProfile> {
  if (MOCK_MODE) {
    if (!_mockMyEntity) throw new Error('404 No entity profile saved')
    return _mockMyEntity
  }
  await ensureSession()
  return get<EntityTaxProfile>('/me/entity')
}

/** PUT /me/entity — save the current user's entity profile. Returns the stored profile. */
export async function putMyEntity(ssm: SsmProfile): Promise<EntityTaxProfile> {
  if (MOCK_MODE) {
    _mockMyEntity = { ...ssm }
    return _mockMyEntity
  }
  await ensureSession()
  const res = await safeFetch(`${BASE_URL}/me/entity`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ ssm })
  })
  return handleResponse<EntityTaxProfile>(res)
}

// --- Filing records (EP-2; FM-1/FM-2/FM-3) ---

/** A saved filing record as returned by /me/filings. */
export interface FilingRecord {
  id: string
  user_id: string
  tin: string
  label: string
  computation: FormComputation | null
  risk_flags: RiskFlag[]
  line_items?: LineItem[]
  raw_text?: string | null
  status: 'draft' | 'final'
  created_at: string
}

// Module-scoped in-memory mock store for filing records (newest first).
let _mockFilings: FilingRecord[] = []
let _mockFilingSeq = 1

function _mockFilingId(): string {
  return `mock-filing-${String(_mockFilingSeq++).padStart(3, '0')}`
}

/** GET /me/filings — list the current user's filing records, newest first. */
export async function listFilings(): Promise<FilingRecord[]> {
  if (MOCK_MODE) return [..._mockFilings]
  await ensureSession()
  return get<FilingRecord[]>('/me/filings')
}

/** POST /me/filings — save a filing record. Returns the stored record with its id. */
export async function saveFiling(body: {
  tin: string
  label?: string
  computation: FormComputation
  risk_flags?: RiskFlag[]
  line_items?: LineItem[]
}): Promise<FilingRecord> {
  if (MOCK_MODE) {
    const rec: FilingRecord = {
      id: _mockFilingId(),
      user_id: 'mock-user',
      tin: body.tin,
      label: body.label ?? `Filing ${_mockFilingSeq - 1}`,
      computation: body.computation,
      risk_flags: body.risk_flags ?? [],
      line_items: body.line_items,
      raw_text: null,
      status: 'final',
      created_at: new Date().toISOString()
    }
    _mockFilings = [rec, ..._mockFilings]
    return rec
  }
  await ensureSession()
  return post<FilingRecord>('/me/filings', body)
}

/** POST /me/filings — create a draft record (no computation yet). Returns the stored draft with its id. */
export async function createDraftFiling(body: {
  tin: string
  label?: string
  line_items?: LineItem[]
  raw_text?: string
}): Promise<FilingRecord> {
  if (MOCK_MODE) {
    const rec: FilingRecord = {
      id: _mockFilingId(),
      user_id: 'mock-user',
      tin: body.tin,
      label: body.label ?? `Draft ${_mockFilingSeq - 1}`,
      computation: null,
      risk_flags: [],
      line_items: body.line_items,
      raw_text: body.raw_text ?? null,
      status: 'draft',
      created_at: new Date().toISOString()
    }
    _mockFilings = [rec, ..._mockFilings]
    return rec
  }
  await ensureSession()
  return post<FilingRecord>('/me/filings', { ...body, status: 'draft', computation: null })
}

/** PATCH /me/filings/{id} — upgrade a draft to final (or update any field). */
export async function upgradeFiling(
  id: string,
  patch: {
    computation?: FormComputation | null
    risk_flags?: RiskFlag[]
    line_items?: LineItem[]
    raw_text?: string | null
    status?: 'draft' | 'final'
    label?: string
  }
): Promise<FilingRecord> {
  if (MOCK_MODE) {
    const idx = _mockFilings.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error(`404 Filing ${id} not found`)
    _mockFilings[idx] = { ..._mockFilings[idx], ...patch }
    return _mockFilings[idx]
  }
  await ensureSession()
  const res = await safeFetch(`${BASE_URL}/me/filings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(patch)
  })
  return handleResponse<FilingRecord>(res)
}

/** GET /me/filings/{id} — fetch a single filing record. Throws on 404. */
export async function getFiling(id: string): Promise<FilingRecord> {
  if (MOCK_MODE) {
    const rec = _mockFilings.find((r) => r.id === id)
    if (!rec) throw new Error(`404 Filing ${id} not found`)
    return rec
  }
  await ensureSession()
  return get<FilingRecord>(`/me/filings/${id}`)
}

/** GET /me/filings/{id}/report — the Form C draft-pack PDF (a preparation aid; never submitted). */
export async function getFilingReport(id: string): Promise<Blob> {
  if (MOCK_MODE) {
    throw new Error('The draft pack is generated by the live backend — open the deployed app to download it.')
  }
  await ensureSession()
  const res = await safeFetch(`${BASE_URL}/me/filings/${id}/report`, { headers: { ...authHeaders() } })
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const body = await res.json()
      detail = body.detail ?? detail
    } catch {
      // non-JSON error body; keep the status code
    }
    throw new Error(detail)
  }
  return res.blob()
}

/** DELETE /me/filings/{id} — delete a single filing. Returns {deleted: id}. */
export async function deleteFiling(id: string): Promise<{ deleted: string }> {
  if (MOCK_MODE) {
    _mockFilings = _mockFilings.filter((r) => r.id !== id)
    return { deleted: id }
  }
  await ensureSession()
  const res = await safeFetch(`${BASE_URL}/me/filings/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() }
  })
  return handleResponse<{ deleted: string }>(res)
}

/** DELETE /me/filings (body: {ids}) — delete multiple filings. Returns {deleted: ids}. */
export async function deleteFilings(ids: string[]): Promise<{ deleted: string[] }> {
  if (MOCK_MODE) {
    _mockFilings = _mockFilings.filter((r) => !ids.includes(r.id))
    return { deleted: ids }
  }
  await ensureSession()
  const res = await safeFetch(`${BASE_URL}/me/filings`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ ids })
  })
  return handleResponse<{ deleted: string[] }>(res)
}
