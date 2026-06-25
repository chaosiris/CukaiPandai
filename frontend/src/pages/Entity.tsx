// EN-1 — Entity page (/entity).
// Views and edits the active company's full EntityTaxProfile.
// Edits write to the backend via PUT /me/entity (EN-2); seeds stay pristine.
// Reuses the CustomCompany field set, validation helpers, and token-CSS styles.

import { useEffect, useState } from 'react'
import { useActivePersona } from '../PersonaContext'
import { type SsmProfile, putMyEntity } from '../api/client'
import { InfoTip } from '../components/Tooltip'
import { useEntity } from '../hooks/useEntity'

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
  msic_codes: string
  paid_up_capital: string
  gross_income: string
  employee_count: string
  sst_registered: boolean
  basis_period_start: string
  basis_period_end: string
  commencement_date: string
}

type FieldErrors = Partial<Record<keyof FormValues, string>>

function required(v: string): string | null {
  return v.trim() ? null : 'Required'
}

function positiveNum(v: string): string | null {
  if (!v.trim()) return 'Required'
  const n = Number(v)
  if (Number.isNaN(n) || n < 0) return 'Must be a non-negative number'
  return null
}

function validateTin(v: string): string | null {
  if (!v.trim()) return 'Required'
  if (!/^[A-Z][0-9]{10}$/.test(v.trim())) return 'TIN format: one letter + 10 digits (e.g. C0000000001)'
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
  if (invalid.length > 0) return `Invalid MSIC code(s): ${invalid.join(', ')}. Must be 4-5 digits`
  return null
}

function validate(v: FormValues): FieldErrors {
  return {
    tin: validateTin(v.tin) ?? undefined,
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

function fmt(n: number): string {
  return `RM ${n.toLocaleString('en-MY')}`
}

export default function Entity() {
  const { persona, activateCustomPersona, entityReady } = useActivePersona()
  const { entity, loading } = useEntity()

  const [values, setValues] = useState<FormValues | null>(null)
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  // Pre-fill form when the entity resolves.
  useEffect(() => {
    if (!entity) return
    setValues({
      tin: entity.tin,
      entity_type: entity.entity_type,
      msic_codes: entity.msic_codes.join(', '),
      paid_up_capital: String(entity.paid_up_capital),
      gross_income: String(entity.gross_income),
      employee_count: String(entity.employee_count),
      sst_registered: entity.sst_registered,
      basis_period_start: entity.basis_period_start,
      basis_period_end: entity.basis_period_end,
      commencement_date: entity.commencement_date ?? ''
    })
    setTouched({})
    setSubmitted(false)
    setSaveStatus('idle')
    setSaveError(null)
  }, [entity])

  if (!entityReady || loading) {
    return (
      <>
        <header className="page-head">
          <div>
            <h1>Entity</h1>
            <div className="page-kicker">Loading company profile…</div>
          </div>
        </header>
      </>
    )
  }

  if (!values || !entity) {
    return (
      <>
        <header className="page-head">
          <div>
            <h1>Entity</h1>
            <div className="page-kicker">No company profile loaded.</div>
          </div>
        </header>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-soft)', padding: '0 0 24px' }}>
          Select a company in Settings or use your own company to get started.
        </p>
      </>
    )
  }

  const errors = validate(values)
  const visibleErrors: FieldErrors = {}
  for (const key of Object.keys(errors) as (keyof FormValues)[]) {
    if (submitted || touched[key]) visibleErrors[key] = errors[key]
  }

  function set(field: keyof FormValues, value: string | boolean) {
    setValues((v) => (v ? { ...v, [field]: value } : v))
  }

  function touch(field: keyof FormValues) {
    setTouched((t) => ({ ...t, [field]: true }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!values || hasErrors(errors)) return

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
      ...(values.commencement_date ? { commencement_date: values.commencement_date } : {})
    }

    setSaveStatus('saving')
    setSaveError(null)

    try {
      await putMyEntity(ssm)
      // EN-2: update context (no second PUT — putMyEntity was already awaited above).
      activateCustomPersona(ssm)
      setSaveStatus('saved')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed'
      setSaveError(msg)
      setSaveStatus('error')
    }
  }

  const isSeed = ['C2581234509', 'C7654321098', 'C3219876540'].includes(persona.tin)

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Entity</h1>
          <div className="page-kicker">Active Company Profile and Tax Configuration</div>
        </div>
      </header>

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: 'var(--ink-soft)',
          marginBottom: 20,
          lineHeight: 1.5
        }}
      >
        View and edit your active company's SSM profile. Saved changes apply across all compliance consoles.
      </p>

      {/* Snapshot card */}
      <div className="window" style={{ marginBottom: 16 }}>
        <div className="titlebar">
          <span className="titlebar-title">{persona.label}</span>
          <span style={{ marginLeft: 'auto' }}>
            <InfoTip
              label="About this snapshot"
              content="These figures drive your obligation calendar, Form C computation, and audit-defense evidence. Edit below to update."
            />
          </span>
        </div>
        <div style={{ padding: '16px 18px', display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            <SnapRow label="TIN" value={entity.tin} />
            <SnapRow
              label="Entity Type"
              value={entity.entity_type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            />
            <SnapRow label="MSIC Codes" value={entity.msic_codes.join(', ')} />
            <SnapRow label="Gross Income" value={fmt(entity.gross_income)} />
            <SnapRow label="Paid-Up Capital" value={fmt(entity.paid_up_capital)} />
            <SnapRow label="Employees" value={String(entity.employee_count)} />
            <SnapRow label="SST Registered" value={entity.sst_registered ? 'Yes' : 'No'} />
            <SnapRow label="Basis Period" value={`${entity.basis_period_start} to ${entity.basis_period_end}`} />
            {entity.commencement_date && <SnapRow label="Commenced" value={entity.commencement_date} />}
          </div>
        </div>
      </div>

      {isSeed && (
        <div
          className="window"
          style={{ marginBottom: 16, borderColor: 'var(--mustard)', background: 'rgba(224,169,59,0.06)' }}
        >
          <div style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)' }}>
            You are viewing a seed demo entity. Editing below will save your own profile as "My Company" and switch the
            active entity. The seed remains selectable from Settings.
          </div>
        </div>
      )}

      {saveStatus === 'saved' && (
        <div
          className="window"
          style={{ marginBottom: 16, borderColor: 'var(--denim)', background: 'rgba(45,91,152,0.06)' }}
        >
          <div style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)' }}>
            Profile saved. Your company is now active across all consoles.
          </div>
        </div>
      )}

      {saveStatus === 'error' && saveError && (
        <div
          className="window"
          style={{ marginBottom: 16, borderColor: 'var(--rust)', background: 'rgba(180,60,60,0.06)' }}
        >
          <div style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--rust)' }}>
            {saveError}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="window" style={{ marginBottom: 16 }}>
          <div className="titlebar">
            <span className="titlebar-title">Company Identity</span>
            <span style={{ marginLeft: 'auto' }}>
              <InfoTip
                label="About company identity"
                content="Your TIN is issued by LHDN. MSIC codes identify your business activity for tax classification."
              />
            </span>
          </div>
          <div style={{ padding: '16px 18px', display: 'grid', gap: 14 }}>
            <Field
              label="Tax Identification Number (TIN)"
              error={visibleErrors.tin}
              hint="Format: one letter + 10 digits (e.g. C0000000001)"
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
              label="MSIC Codes"
              error={visibleErrors.msic_codes}
              hint="Malaysia Standard Industrial Classification codes. Comma-separated, e.g. 46900, 62010"
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
            <span style={{ marginLeft: 'auto' }}>
              <InfoTip
                label="About the financial profile"
                content="Gross income determines e-invoice obligations (threshold: RM 1,000,000). Paid-up capital determines the SME tax rate (threshold: RM 2,500,000)."
              />
            </span>
          </div>
          <div style={{ padding: '16px 18px', display: 'grid', gap: 14 }}>
            <Field
              label="Paid-Up Capital (RM)"
              error={visibleErrors.paid_up_capital}
              hint="SME threshold: RM 2,500,000"
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
              hint="e-Invoice threshold: RM 1,000,000"
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

            <Field label="Employee Count" error={visibleErrors.employee_count}>
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

            <Field label="SST Registered" hint="Sales and Service Tax registration status">
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
            <span style={{ marginLeft: 'auto' }}>
              <InfoTip
                label="About the basis period"
                content="Your financial year for YA2026. Form C due date is calculated from the last day of your basis period plus 7 months."
              />
            </span>
          </div>
          <div style={{ padding: '16px 18px', display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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

            <Field label="Commencement Date (Optional)" hint="Leave blank if not applicable">
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
            Please fix the errors above before saving.
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={saveStatus === 'saving'}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: 'var(--radius)',
              background: 'var(--denim)',
              color: 'var(--paper)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 700,
              cursor: saveStatus === 'saving' ? 'wait' : 'pointer',
              opacity: saveStatus === 'saving' ? 0.7 : 1
            }}
          >
            {saveStatus === 'saving' ? 'Saving…' : 'Save Company Profile'}
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
          YA2026 · decision-support, not legal advice · edits never overwrite the built-in seed entities
        </p>
      </form>
    </>
  )
}

function SnapRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gap: 2 }}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--ink-soft)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em'
        }}
      >
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink)', wordBreak: 'break-word' }}>
        {value}
      </span>
    </div>
  )
}
