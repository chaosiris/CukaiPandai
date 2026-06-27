// FE-8 — Canonical demo personas. Each matches its backend entity fixture exactly.
// The ssm shape must agree with backend/core/fixtures/entity_*.json so the obligations
// endpoint and getEntity response tell one coherent story per persona.

import { ACME_SSM, ACME_TIN, type SsmProfile } from './api/client'

export interface Persona {
  tin: string
  label: string
  ssm: SsmProfile
  /** Pre-filled structured line items for the Filing Studio (taxonomy account codes). */
  demoItems: { code: string; amount: number }[]
}

/** Empty SSM placeholder for My Company before the user fills in their details. */
export const EMPTY_CUSTOM_SSM: SsmProfile = {
  tin: '',
  entity_type: 'sdn_bhd',
  msic_codes: [],
  paid_up_capital: 0,
  gross_income: 0,
  employee_count: 0,
  sst_registered: false,
  basis_period_start: '',
  basis_period_end: '',
  commencement_date: ''
}

/** Returns true when the entity has no valid TIN (blank or malformed). */
export function isEntityIncomplete(ssm: SsmProfile): boolean {
  // Matches the LHDN TIN format used by lib/tin.ts (prefix + 8-12 digits), so 2-letter prefixes
  // (PT/IG/etc.) load their obligations instead of being treated as an empty placeholder.
  return !/^[A-Z]{1,2}[0-9]{8,12}$/.test(ssm.tin)
}

export const PERSONAS: Persona[] = [
  {
    tin: ACME_TIN,
    label: 'Acme Trading (Demo)',
    ssm: ACME_SSM,
    demoItems: [
      { code: 'rev_sales', amount: 5000000 },
      { code: 'staff_salaries', amount: 2000000 },
      { code: 'rep_maintenance', amount: 4800 },
      { code: 'dep_depreciation', amount: 120000 }
    ]
  },
  {
    tin: 'C7654321098',
    label: 'Sinar Digital (Demo)',
    ssm: {
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
    demoItems: [
      { code: 'rev_sales', amount: 380000 },
      { code: 'staff_salaries', amount: 120000 },
      { code: 'admin_software_saas', amount: 18000 },
      { code: 'dep_depreciation', amount: 12000 }
    ]
  },
  {
    tin: 'C3219876540',
    label: 'Selera Kita (Demo)',
    ssm: {
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
    },
    demoItems: [
      { code: 'rev_sales', amount: 2500000 },
      { code: 'staff_salaries', amount: 900000 },
      { code: 'cos_purchases', amount: 800000 },
      { code: 'prem_rent', amount: 120000 },
      { code: 'prem_utilities', amount: 60000 }
    ]
  }
]

export const DEFAULT_PERSONA = PERSONAS[0]
