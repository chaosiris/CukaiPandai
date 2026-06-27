// JR-6 — "Use my own company" form.
// EN-2: now calls addCustomPersona (which does PUT /me/entity) instead of the old
// localStorage addCustomPersona + createEntity path.
// On success, navigates to /start/obligations so the user immediately sees their data.
// Fully open in guest mode (PO decision JR-Q2).

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActivePersona } from '../PersonaContext'
import type { SsmProfile } from '../api/client'
import { MY_STATES } from '../lib/states'
import { validateTin } from '../lib/tin'
import type { Persona } from '../personas'

const ENTITY_TYPES = [
  { value: 'sdn_bhd', label: 'Sdn Bhd' },
  { value: 'bhd', label: 'Bhd (Public)' },
  { value: 'sole_proprietor', label: 'Sole Proprietor' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llp', label: 'LLP' }
]

interface FormValues {
  tin: string
  entity_type: string
  state: string
  msic_codes: string
  paid_up_capital: string
  gross_income: string
  employee_count: string
  sst_registered: boolean
  basis_period_start: string
  basis_period_end: string
  commencement_date: string
}

const INITIAL: FormValues = {
  tin: '',
  entity_type: 'sdn_bhd',
  state: '',
  msic_codes: '',
  paid_up_capital: '',
  gross_income: '',
  employee_count: '',
  sst_registered: false,
  basis_period_start: '2025-01-01',
  basis_period_end: '2025-12-31',
  commencement_date: ''
}

function required(v: string): string | null {
  return v.trim() ? null : 'Required'
}

function positiveNum(v: string): string | null {
  if (!v.trim()) return 'Required'
  const n = Number(v)
  if (Number.isNaN(n) || n < 0) return 'Must be a non-negative number'
  return null
}

function validateMsic(v: string): string | null {
  if (!v.trim()) return 'Required'
  const parts = v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length === 0) return 'Enter at least one MSIC code'
  const invalid = parts.filter((p) => !/^\d{4,5}$/.test(p))
  if (invalid.length > 0) return `Invalid MSIC code(s): ${invalid.join(', ')} — must be 4-5 digits`
  return null
}

type FieldErrors = Partial<Record<keyof FormValues, string>>

function validate(v: FormValues): FieldErrors {
  return {
    tin: validateTin(v.tin, v.entity_type) ?? undefined,
    msic_codes: validateMsic(v.msic_codes) ?? undefined,
    paid_up_capital: positiveNum(v.paid_up_capital) ?? undefined,
    gross_income: positiveNum(v.gross_income) ?? undefined,
    employee_count: positiveNum(v.employee_count) ?? undefined,
    basis_period_start: required(v.basis_period_start) ?? undefined,
    basis_period_end: required(v.basis_period_end) ?? undefined
  }
}

function hasErrors(e: FieldErrors): boolean {
  return Object.values(e).some(Boolean)
}

interface FieldProps {
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}

function Field({ label, error, hint, children }: FieldProps) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      {/* biome-ignore lint/a11y/noLabelWithoutControl: label text is a visual sibling; inputs below carry their own accessible names */}
      <label
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: error ? 'var(--rust)' : 'var(--ink-soft)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em'
        }}
      >
        {label}
      </label>
      {children}
      {error && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--rust)' }}>{error}</span>}
      {hint && !error && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-soft)' }}>{hint}</span>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontFamily: 'var(--font-mono)',
  fontSize: 13,
  padding: '8px 10px',
  border: 'var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--screen)',
  color: 'var(--ink)'
}

const inputErrorStyle: React.CSSProperties = {
  ...inputStyle,
  borderColor: 'var(--rust)'
}

export default function CustomCompany() {
  const navigate = useNavigate()
  const { addCustomPersona } = useActivePersona()

  const [values, setValues] = useState<FormValues>(INITIAL)
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)

  const errors = validate(values)
  const visibleErrors: FieldErrors = {}
  for (const key of Object.keys(errors) as (keyof FormValues)[]) {
    if (submitted || touched[key]) visibleErrors[key] = errors[key]
  }

  function set(field: keyof FormValues, value: string | boolean) {
    setValues((v) => ({ ...v, [field]: value }))
  }

  function touch(field: keyof FormValues) {
    setTouched((t) => ({ ...t, [field]: true }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (hasErrors(errors)) return

    const msicList = values.msic_codes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const ssm: SsmProfile = {
      tin: values.tin.trim(),
      entity_type: values.entity_type,
      msic_codes: msicList,
      paid_up_capital: Number(values.paid_up_capital),
      gross_income: Number(values.gross_income),
      employee_count: Number(values.employee_count),
      sst_registered: values.sst_registered,
      basis_period_start: values.basis_period_start,
      basis_period_end: values.basis_period_end,
      ...(values.commencement_date ? { commencement_date: values.commencement_date } : {}),
      ...(values.state ? { state: values.state } : {})
    }

    const persona: Persona = {
      tin: ssm.tin,
      label: `My Company (${ssm.tin})`,
      ssm,
      demoItems: []
    }

    // EN-2: addCustomPersona does PUT /me/entity (best-effort) + sets active.
    // Navigate immediately — entity is active in context even if the BE write is still in flight.
    addCustomPersona(persona)
    navigate('/start/obligations', { replace: true })
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 0 80px' }}>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--ink-soft)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 8
          }}
        >
          CukaiPandai · Custom Company
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: 600,
            lineHeight: 1.2,
            color: 'var(--ink)',
            marginBottom: 8
          }}
        >
          Use My Own Company
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
          Enter your SSM profile. Your obligations, Form C filing, and audit defense will be grounded in your actual
          figures. Your company profile is saved to your session.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="window" style={{ marginBottom: 16 }}>
          <div className="titlebar">
            <span className="titlebar-title">Company Identity</span>
          </div>
          <div style={{ padding: '16px 18px', display: 'grid', gap: 14 }}>
            <Field
              label="Tax Identification Number (TIN)"
              error={visibleErrors.tin}
              hint="Your tax ID from LHDN. Prefix must match the entity type — C for Sdn Bhd/Bhd, D partnership, PT LLP, IG sole proprietor."
            >
              <input
                type="text"
                value={values.tin}
                onChange={(e) => set('tin', e.target.value.toUpperCase())}
                onBlur={() => touch('tin')}
                placeholder="C0000000001"
                style={visibleErrors.tin ? inputErrorStyle : inputStyle}
              />
            </Field>

            <Field label="Entity Type">
              <select
                value={values.entity_type}
                onChange={(e) => set('entity_type', e.target.value)}
                style={inputStyle}
              >
                {ENTITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="State / Federal Territory"
              hint="Optional — used for state-specific public-holiday deadline shifts. Leave blank for national only."
            >
              <select value={values.state} onChange={(e) => set('state', e.target.value)} style={inputStyle}>
                <option value="">— National only —</option>
                {MY_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="MSIC Codes"
              error={visibleErrors.msic_codes}
              hint="Malaysia Standard Industrial Classification — your business activity code(s). Comma-separated, e.g. 46900, 62010"
            >
              <input
                type="text"
                value={values.msic_codes}
                onChange={(e) => set('msic_codes', e.target.value)}
                onBlur={() => touch('msic_codes')}
                placeholder="46900"
                style={visibleErrors.msic_codes ? inputErrorStyle : inputStyle}
              />
            </Field>
          </div>
        </div>

        <div className="window" style={{ marginBottom: 16 }}>
          <div className="titlebar">
            <span className="titlebar-title">Financial Profile (YA2026)</span>
          </div>
          <div style={{ padding: '16px 18px', display: 'grid', gap: 14 }}>
            <Field
              label="Paid-Up Capital (RM)"
              error={visibleErrors.paid_up_capital}
              hint="SME cap RM2,500,000 — above this you're taxed at a flat 24% (not the 15/17/24% SME bands)."
            >
              <input
                type="number"
                min="0"
                value={values.paid_up_capital}
                onChange={(e) => set('paid_up_capital', e.target.value)}
                onBlur={() => touch('paid_up_capital')}
                placeholder="1000000"
                style={visibleErrors.paid_up_capital ? inputErrorStyle : inputStyle}
              />
            </Field>

            <Field
              label="Gross Income (RM)"
              error={visibleErrors.gross_income}
              hint="e-Invoice from RM1,000,000. SME gross cap RM50,000,000 — above it, taxed at a flat 24%."
            >
              <input
                type="number"
                min="0"
                value={values.gross_income}
                onChange={(e) => set('gross_income', e.target.value)}
                onBlur={() => touch('gross_income')}
                placeholder="5000000"
                style={visibleErrors.gross_income ? inputErrorStyle : inputStyle}
              />
            </Field>

            <Field
              label="Employee Count"
              error={visibleErrors.employee_count}
              hint="0 = nobody on payroll (a director taking director's fees isn't an employee)."
            >
              <input
                type="number"
                min="0"
                step="1"
                value={values.employee_count}
                onChange={(e) => set('employee_count', e.target.value)}
                onBlur={() => touch('employee_count')}
                placeholder="12"
                style={visibleErrors.employee_count ? inputErrorStyle : inputStyle}
              />
            </Field>

            <Field label="SST Registered" hint="Sales and Service Tax — check if your company is registered for SST">
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  color: 'var(--ink)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={values.sst_registered}
                  onChange={(e) => set('sst_registered', e.target.checked)}
                  style={{ accentColor: 'var(--denim)', width: 16, height: 16 }}
                />
                Yes, registered for SST
              </label>
            </Field>
          </div>
        </div>

        <div className="window" style={{ marginBottom: 16 }}>
          <div className="titlebar">
            <span className="titlebar-title">Basis Period</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--ink-soft)',
                letterSpacing: '0.04em'
              }}
            >
              your financial year for YA2026
            </span>
          </div>
          <div style={{ padding: '16px 18px', display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
              <Field label="Start Date" error={visibleErrors.basis_period_start}>
                <input
                  type="date"
                  value={values.basis_period_start}
                  onChange={(e) => set('basis_period_start', e.target.value)}
                  onBlur={() => touch('basis_period_start')}
                  style={visibleErrors.basis_period_start ? inputErrorStyle : inputStyle}
                />
              </Field>
              <Field label="End Date" error={visibleErrors.basis_period_end}>
                <input
                  type="date"
                  value={values.basis_period_end}
                  onChange={(e) => set('basis_period_end', e.target.value)}
                  onBlur={() => touch('basis_period_end')}
                  style={visibleErrors.basis_period_end ? inputErrorStyle : inputStyle}
                />
              </Field>
            </div>

            <Field label="Commencement Date (optional)" hint="Leave blank if not applicable">
              <input
                type="date"
                value={values.commencement_date}
                onChange={(e) => set('commencement_date', e.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>
        </div>

        {submitted && hasErrors(errors) && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--rust)',
              marginBottom: 16,
              padding: '10px 14px',
              border: '1px solid var(--rust)',
              borderRadius: 'var(--radius)'
            }}
          >
            Please fix the errors above before submitting.
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="submit"
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: 'var(--radius)',
              background: 'var(--denim)',
              color: 'var(--paper)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Add My Company and Start →
          </button>
          <button
            type="button"
            onClick={() => navigate('/welcome', { replace: true })}
            style={{
              padding: '10px 16px',
              border: 'var(--border)',
              borderRadius: 'var(--radius)',
              background: 'var(--window)',
              color: 'var(--ink-soft)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Back
          </button>
        </div>

        <p
          style={{
            marginTop: 20,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--ink-soft)',
            lineHeight: 1.5
          }}
        >
          YA2026 · decision-support, not legal advice
        </p>
      </form>
    </div>
  )
}
