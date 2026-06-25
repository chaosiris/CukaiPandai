import { useEffect, useRef, useState } from 'react'
import { useActivePersona } from '../PersonaContext'
import {
  type ClassifyResponse,
  type FilingResumeResponse,
  type FilingStartResponse,
  type FormComputation,
  type LineItem,
  type RiskFlag,
  type SsmProfile,
  classifyTrialBalance,
  getFormC,
  resumeFiling,
  startFiling,
  uploadDocument
} from '../api/client'
import { SovereignBadge } from '../components/CitationPanel'
import { useEntity } from '../hooks/useEntity'
import { useNotifications } from '../notifications'

// Figures that represent the final liability - rendered in the hero section
const LIABILITY_KEYS = new Set(['tax_payable', 'zakat_offset', 'balance_payable'])
// Figures that are upstream computations - rendered in the supporting section
const UPSTREAM_KEYS = new Set(['gross_income', 'adjusted_income', 'chargeable_income'])

// Stage identifiers in execution order
type StageId = 'classify' | 'compute' | 'risk' | 'approval' | 'finalized'

type StageStatus = 'pending' | 'running' | 'complete' | 'awaiting' | 'error'

interface Stage {
  id: StageId
  num: number
  name: string
  status: StageStatus
  writeBack?: string
}

// Internal flow phase - tracks what the UI and data state is
type Phase =
  | { tag: 'idle' }
  | { tag: 'classifying' }
  | { tag: 'classified' }
  | { tag: 'starting' }
  | { tag: 'pending_approval'; start: FilingStartResponse }
  | { tag: 'resuming'; start: FilingStartResponse }
  | { tag: 'approved'; result: FilingResumeResponse }
  | { tag: 'error'; message: string }

function buildSsm(entity: {
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
}): SsmProfile {
  return {
    tin: entity.tin,
    entity_type: entity.entity_type,
    msic_codes: entity.msic_codes,
    paid_up_capital: entity.paid_up_capital,
    gross_income: entity.gross_income,
    employee_count: entity.employee_count,
    sst_registered: entity.sst_registered,
    basis_period_start: entity.basis_period_start,
    basis_period_end: entity.basis_period_end,
    commencement_date: entity.commencement_date
  }
}

function severityColor(severity: string): string {
  if (severity === 'high') return 'var(--rust)'
  if (severity === 'low') return 'var(--ink-soft)'
  return 'var(--mustard)'
}

function statusColor(status: StageStatus): string {
  if (status === 'complete') return 'var(--denim)'
  if (status === 'running') return 'var(--mustard)'
  if (status === 'awaiting') return 'var(--mustard)'
  if (status === 'error') return 'var(--rust)'
  return 'var(--ink-soft)'
}

function statusLabel(status: StageStatus): string {
  if (status === 'complete') return 'COMPLETE'
  if (status === 'running') return 'IN PROGRESS'
  if (status === 'awaiting') return 'AWAITING YOU'
  if (status === 'error') return 'ERROR'
  return 'PENDING'
}

// Derive stage list from the current phase
function deriveStages(phase: Phase, classifyResult: ClassifyResponse | null): Stage[] {
  const base: Stage[] = [
    { id: 'classify', num: 1, name: 'Classify Line Items', status: 'pending' },
    { id: 'compute', num: 2, name: 'Compute Form C', status: 'pending' },
    { id: 'risk', num: 3, name: 'Risk Assessment', status: 'pending' },
    { id: 'approval', num: 4, name: 'Human Approval', status: 'pending' },
    { id: 'finalized', num: 5, name: 'Finalized', status: 'pending' }
  ]

  if (phase.tag === 'idle') return base

  if (phase.tag === 'classifying') {
    base[0].status = 'running'
    return base
  }

  if (phase.tag === 'classified' && classifyResult) {
    const n = classifyResult.line_items.length
    base[0].status = 'complete'
    base[0].writeBack = `Read your trial balance, ${n} line item${n !== 1 ? 's' : ''} classified`
    return base
  }

  if (phase.tag === 'starting') {
    const n = classifyResult?.line_items.length ?? 0
    base[0].status = 'complete'
    base[0].writeBack = `Read your trial balance, ${n} line item${n !== 1 ? 's' : ''} classified`
    base[1].status = 'running'
    return base
  }

  if (phase.tag === 'pending_approval') {
    const n = classifyResult?.line_items.length ?? 0
    base[0].status = 'complete'
    base[0].writeBack = `Read your trial balance, ${n} line item${n !== 1 ? 's' : ''} classified`

    const comp = phase.start.computation
    const taxPayable = comp.fields.tax_payable?.value
    const chargeableIncome = comp.fields.chargeable_income?.value
    base[1].status = 'complete'
    base[1].writeBack =
      chargeableIncome != null && taxPayable != null
        ? `Chargeable income RM ${chargeableIncome.toLocaleString()}, tax payable RM ${taxPayable.toLocaleString()}`
        : 'Form C computation complete'

    const flags = phase.start.risk_flags
    const high = flags.filter((f) => f.severity === 'high').length
    const medium = flags.filter((f) => f.severity === 'medium').length
    const low = flags.filter((f) => f.severity === 'low').length
    const parts: string[] = []
    if (high > 0) parts.push(`${high} high`)
    if (medium > 0) parts.push(`${medium} medium`)
    if (low > 0) parts.push(`${low} low`)
    base[2].status = 'complete'
    base[2].writeBack =
      parts.length > 0
        ? `${parts.join(', ')} risk flag${flags.length !== 1 ? 's' : ''} detected`
        : 'No risk flags detected'

    base[3].status = 'awaiting'
    return base
  }

  if (phase.tag === 'resuming') {
    const n = classifyResult?.line_items.length ?? 0
    base[0].status = 'complete'
    base[0].writeBack = `Read your trial balance, ${n} line item${n !== 1 ? 's' : ''} classified`
    const comp = phase.start.computation
    const taxPayable = comp.fields.tax_payable?.value
    const chargeableIncome = comp.fields.chargeable_income?.value
    base[1].status = 'complete'
    base[1].writeBack =
      chargeableIncome != null && taxPayable != null
        ? `Chargeable income RM ${chargeableIncome.toLocaleString()}, tax payable RM ${taxPayable.toLocaleString()}`
        : 'Form C computation complete'
    const flags = phase.start.risk_flags
    const high = flags.filter((f) => f.severity === 'high').length
    const medium = flags.filter((f) => f.severity === 'medium').length
    const low = flags.filter((f) => f.severity === 'low').length
    const parts: string[] = []
    if (high > 0) parts.push(`${high} high`)
    if (medium > 0) parts.push(`${medium} medium`)
    if (low > 0) parts.push(`${low} low`)
    base[2].status = 'complete'
    base[2].writeBack =
      parts.length > 0
        ? `${parts.join(', ')} risk flag${flags.length !== 1 ? 's' : ''} detected`
        : 'No risk flags detected'
    base[3].status = 'running'
    return base
  }

  if (phase.tag === 'approved') {
    const n = classifyResult?.line_items.length ?? 0
    base[0].status = 'complete'
    base[0].writeBack = `Read your trial balance, ${n} line item${n !== 1 ? 's' : ''} classified`
    const comp = phase.result.computation
    const taxPayable = comp.fields.tax_payable?.value
    const chargeableIncome = comp.fields.chargeable_income?.value
    base[1].status = 'complete'
    base[1].writeBack =
      chargeableIncome != null && taxPayable != null
        ? `Chargeable income RM ${chargeableIncome.toLocaleString()}, tax payable RM ${taxPayable.toLocaleString()}`
        : 'Form C computation complete'
    base[2].status = 'complete'
    base[3].status = 'complete'
    base[3].writeBack = phase.result.approved ? 'Filing approved' : 'Filing rejected'
    base[4].status = 'complete'
    base[4].writeBack = phase.result.approved ? 'Filing finalized' : 'Filing rejected, returned for revision'
    return base
  }

  if (phase.tag === 'error') {
    // Mark the first non-complete stage as error
    for (const s of base) {
      if (s.status === 'pending') {
        s.status = 'error'
        break
      }
    }
  }

  return base
}

// Stage row in the stepper
function StageRow({ stage, isActive }: { stage: Stage; isActive: boolean }) {
  const color = statusColor(stage.status)
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr auto',
        alignItems: 'center',
        gap: 12,
        padding: '10px 18px',
        borderBottom: 'var(--border)',
        background: isActive ? 'var(--screen)' : 'transparent',
        transition: 'background 200ms'
      }}
    >
      {/* Stage number circle */}
      <div
        style={{
          width: 28,
          height: 28,
          border: `1.5px solid ${color}`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 700,
          color,
          flexShrink: 0
        }}
      >
        {stage.status === 'complete' ? '✓' : String(stage.num).padStart(2, '0')}
      </div>

      {/* Stage name + write-back */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            fontWeight: stage.status === 'complete' ? 400 : 600,
            color: stage.status === 'pending' ? 'var(--ink-soft)' : 'var(--ink)',
            lineHeight: 1.3
          }}
        >
          {stage.name}
        </div>
        {stage.writeBack && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--ink-soft)',
              marginTop: 2,
              lineHeight: 1.4
            }}
          >
            {stage.writeBack}
          </div>
        )}
      </div>

      {/* Status badge */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color,
          whiteSpace: 'nowrap'
        }}
      >
        {statusLabel(stage.status)}
      </div>
    </div>
  )
}

function RiskFlagList({ flags }: { flags: RiskFlag[] }) {
  if (flags.length === 0) return null
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {flags.map((f) => (
        <div
          key={f.code}
          style={{
            padding: '10px 14px',
            border: `1px solid ${severityColor(f.severity)}`,
            display: 'grid',
            gap: 4
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: severityColor(f.severity)
            }}
          >
            <span>{f.severity}</span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span>{f.code.replace(/_/g, ' ')}</span>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>{f.message}</div>
        </div>
      ))}
    </div>
  )
}

function FigureTraceRow({
  label,
  trace
}: { label: string; trace: { value: number; inputs: string[]; rule_id: string; config_version: string } }) {
  return (
    <li className="requirement-row">
      <div className="requirement-topline">
        <span className="requirement-label">
          <span className="requirement-label-text">{label.replace(/_/g, ' ')}</span>
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700 }}>
          RM {trace.value.toLocaleString()}
        </span>
      </div>
      <details style={{ paddingLeft: 2 }}>
        <summary
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--denim)',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          Trace detail
        </summary>
        <div
          style={{
            paddingTop: 8,
            paddingLeft: 12,
            display: 'grid',
            gap: 4,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--ink-soft)'
          }}
        >
          <div>
            <strong style={{ color: 'var(--ink)' }}>rule_id:</strong> {trace.rule_id}
          </div>
          <div>
            <strong style={{ color: 'var(--ink)' }}>config_version:</strong> {trace.config_version}
          </div>
          <div>
            <strong style={{ color: 'var(--ink)' }}>inputs:</strong>{' '}
            {trace.inputs.length > 0 ? trace.inputs.join(', ') : 'none'}
          </div>
        </div>
      </details>
    </li>
  )
}

function ComputationPanel({ computation, title }: { computation: FormComputation; title: string }) {
  const entries = Object.entries(computation.fields)
  const heroEntry = entries.find(([k]) => k === 'tax_payable')
  const liabilityEntries = entries.filter(([k]) => LIABILITY_KEYS.has(k))
  const upstreamEntries = entries.filter(([k]) => UPSTREAM_KEYS.has(k))
  const otherEntries = entries.filter(([k]) => !LIABILITY_KEYS.has(k) && !UPSTREAM_KEYS.has(k))

  return (
    <div className="window" style={{ marginTop: 12 }}>
      <div className="titlebar">
        <span className="titlebar-title">
          {title}: {computation.form}
        </span>
      </div>

      {/* 96px hero numeral for tax_payable */}
      {heroEntry && (
        <div
          style={{
            padding: '24px 24px 20px',
            borderBottom: 'var(--border)',
            display: 'grid',
            gap: 6
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--ink-soft)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}
          >
            Tax Payable, YA2026
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 96,
              fontWeight: 700,
              lineHeight: 1,
              color: 'var(--ink)',
              letterSpacing: '-0.02em'
            }}
          >
            RM {heroEntry[1].value.toLocaleString()}
          </div>
        </div>
      )}

      {/* Liability section - tax payable + related figures */}
      {liabilityEntries.length > 0 && (
        <>
          <div
            style={{
              padding: '8px 18px',
              borderBottom: 'var(--border)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--ink-soft)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: 'var(--screen)'
            }}
          >
            Computed Liability
          </div>
          <ul className="req-list">
            {liabilityEntries.map(([k, t]) => (
              <FigureTraceRow key={k} label={k} trace={t} />
            ))}
          </ul>
        </>
      )}

      {/* Supporting figures - upstream computation inputs */}
      {upstreamEntries.length > 0 && (
        <>
          <div
            style={{
              padding: '8px 18px',
              borderBottom: 'var(--border)',
              borderTop: 'var(--border)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--ink-soft)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: 'var(--paper)'
            }}
          >
            Supporting Figures
          </div>
          <ul className="req-list">
            {upstreamEntries.map(([k, t]) => (
              <FigureTraceRow key={k} label={k} trace={t} />
            ))}
          </ul>
        </>
      )}

      {/* Any remaining figures not classified above */}
      {otherEntries.length > 0 && (
        <>
          <div
            style={{
              padding: '8px 18px',
              borderBottom: 'var(--border)',
              borderTop: 'var(--border)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--ink-soft)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: 'var(--paper)'
            }}
          >
            Additional Fields
          </div>
          <ul className="req-list">
            {otherEntries.map(([k, t]) => (
              <FigureTraceRow key={k} label={k} trace={t} />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

// Technical details disclosure - shows route_info + per-figure trace for the computed figures
function TechnicalDetails({
  classifyResult,
  computation
}: {
  classifyResult: ClassifyResponse | null
  computation: FormComputation | null
}) {
  return (
    <details style={{ marginTop: 16 }}>
      <summary
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--denim)',
          cursor: 'pointer',
          userSelect: 'none',
          padding: '8px 0',
          letterSpacing: '0.04em'
        }}
      >
        Show technical details
      </summary>
      <div
        className="window"
        style={{
          marginTop: 8,
          padding: '16px 18px',
          display: 'grid',
          gap: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--ink-soft)'
        }}
      >
        {/* Route info from the classify call */}
        {classifyResult && (
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--ink-soft)',
                marginBottom: 8
              }}
            >
              Route Info
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <div>
                <strong style={{ color: 'var(--ink)' }}>sovereign:</strong>{' '}
                {classifyResult.sovereign ? 'true' : 'false'}
              </div>
              <div>
                <strong style={{ color: 'var(--ink)' }}>active_model:</strong> {classifyResult.active_model}
              </div>
            </div>
          </div>
        )}

        {/* Per-figure deterministic trace */}
        {computation && (
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--ink-soft)',
                marginBottom: 8
              }}
            >
              Deterministic Core Trace
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {Object.entries(computation.fields).map(([key, trace]) => (
                <div
                  key={key}
                  style={{
                    borderLeft: '2px solid var(--grid)',
                    paddingLeft: 12,
                    display: 'grid',
                    gap: 3
                  }}
                >
                  <div style={{ color: 'var(--ink)', fontWeight: 700 }}>{key.replace(/_/g, ' ')}</div>
                  <div>
                    <strong style={{ color: 'var(--ink)' }}>rule_id:</strong> {trace.rule_id}
                  </div>
                  <div>
                    <strong style={{ color: 'var(--ink)' }}>config_version:</strong> {trace.config_version}
                  </div>
                  <div>
                    <strong style={{ color: 'var(--ink)' }}>inputs:</strong>{' '}
                    {trace.inputs.length > 0 ? trace.inputs.join(', ') : 'none'}
                  </div>
                  <div>
                    <strong style={{ color: 'var(--ink)' }}>value:</strong> RM {trace.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </details>
  )
}

// Stage 1 detail: classified line items + sovereign badge
function Stage1Detail({ classifyResult, lineItems }: { classifyResult: ClassifyResponse; lineItems: LineItem[] }) {
  return (
    <div className="window" style={{ marginTop: 12 }}>
      <div className="titlebar">
        <span className="titlebar-title">Classified Line Items</span>
        <SovereignBadge sovereign={classifyResult.sovereign} model={classifyResult.active_model} />
      </div>
      <ul className="req-list">
        {lineItems.map((item) => (
          <li key={item.code} className="requirement-row">
            <div className="requirement-topline">
              <span className="requirement-label">
                <span className="requirement-label-text">{item.description}</span>
                <span className="kind-tag">{item.category}</span>
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>
                RM {item.amount.toLocaleString()}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
                {item.code}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function FilingStudio() {
  const { persona } = useActivePersona()
  const { entity, error: entityError, loading: entityLoading } = useEntity()
  const [rawText, setRawText] = useState(persona.demoRawText)
  const [classifyResult, setClassifyResult] = useState<ClassifyResponse | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [phase, setPhase] = useState<Phase>({ tag: 'idle' })
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { notify } = useNotifications()

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset when persona switches
  useEffect(() => {
    setRawText(persona.demoRawText)
    setClassifyResult(null)
    setLineItems([])
    setPhase({ tag: 'idle' })
  }, [persona.tin])

  const stages = deriveStages(phase, classifyResult)
  const activeStageId: StageId | null =
    phase.tag === 'idle' || phase.tag === 'error'
      ? null
      : phase.tag === 'classifying'
        ? 'classify'
        : phase.tag === 'classified'
          ? 'classify'
          : phase.tag === 'starting'
            ? 'compute'
            : phase.tag === 'pending_approval'
              ? 'approval'
              : phase.tag === 'resuming'
                ? 'approval'
                : phase.tag === 'approved'
                  ? 'finalized'
                  : null

  const displayError = entityError ?? (phase.tag === 'error' ? phase.message : null)

  // The computation to show in technical details (whichever is most recent)
  const latestComputation =
    phase.tag === 'approved'
      ? phase.result.computation
      : phase.tag === 'pending_approval' || phase.tag === 'resuming'
        ? phase.start.computation
        : null

  async function handleClassify() {
    if (!entity) return
    setUploadError(null)
    setPhase({ tag: 'classifying' })
    try {
      const result = await classifyTrialBalance(entity.tin, rawText, entity)
      setClassifyResult(result)
      setLineItems(result.line_items)
      setPhase({ tag: 'classified' })
    } catch (e) {
      setPhase({ tag: 'error', message: (e as Error).message })
    }
  }

  async function handleUpload(file: File) {
    if (!entity) return
    const allowed = ['.csv', '.xlsx', '.pdf']
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!allowed.includes(ext)) {
      setUploadError(`Unsupported file type "${ext}". Upload a CSV, XLSX, or PDF trial balance.`)
      return
    }
    setUploadError(null)
    setPhase({ tag: 'classifying' })
    try {
      const result = await uploadDocument(entity.tin, file, entity)
      setClassifyResult(result)
      setLineItems(result.line_items)
      setPhase({ tag: 'classified' })
      notify({
        title: 'File Classified',
        body: `${file.name} classified into ${result.line_items.length} line items.`,
        kind: 'success'
      })
    } catch (e) {
      const msg = (e as Error).message
      setUploadError(`Upload failed: ${msg}. You can paste the trial balance text below instead.`)
      setPhase({ tag: 'idle' })
    }
  }

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) void handleUpload(file)
  }

  async function handleStartFiling() {
    if (!entity) return
    setPhase({ tag: 'starting' })
    try {
      const ssm = buildSsm(entity)
      const result = await startFiling(entity.tin, ssm, lineItems)
      setPhase({ tag: 'pending_approval', start: result })
    } catch (e) {
      setPhase({ tag: 'error', message: (e as Error).message })
    }
  }

  async function handleApprove(approved: boolean) {
    if (phase.tag !== 'pending_approval') return
    const { start } = phase
    setPhase({ tag: 'resuming', start })
    try {
      if (!entity) return
      const result = await resumeFiling(entity.tin, start.thread_id, approved)
      setPhase({ tag: 'approved', result })
      if (approved) {
        notify({ title: 'Filing Finalized', body: 'Form C filing approved and finalized.', kind: 'success' })
      } else {
        notify({ title: 'Filing Returned', body: 'Filing returned for revision.', kind: 'warning' })
      }
    } catch (e) {
      const msg = (e as Error).message
      setPhase({
        tag: 'error',
        message: msg.includes('404') ? 'Filing thread not found or already finalized.' : msg
      })
    }
  }

  async function handleOneShot() {
    if (!entity) return
    setPhase({ tag: 'starting' })
    try {
      const ssm = buildSsm(entity)
      const result = await getFormC(entity.tin, ssm, lineItems)
      setPhase({ tag: 'approved', result: { approved: !result.requires_approval, computation: result.computation } })
    } catch (e) {
      setPhase({ tag: 'error', message: (e as Error).message })
    }
  }

  function handleReset() {
    setPhase(classifyResult ? { tag: 'classified' } : { tag: 'idle' })
  }

  const isLoading = entityLoading || phase.tag === 'classifying' || phase.tag === 'starting' || phase.tag === 'resuming'

  return (
    <>
      <div className="page-head">
        <h1>Filing Studio</h1>
        <p className="page-kicker">Form C · YA2026 · {entity?.tin ?? '...'}</p>
      </div>

      {displayError && (
        <div className="window error-window">
          <div className="titlebar">
            <span className="titlebar-title">Error</span>
          </div>
          <div className="error-body">{displayError}</div>
        </div>
      )}

      {/* Stage 1 input - trial balance upload or paste, shown when idle/error and entity loaded */}
      {!entityLoading && entity && (phase.tag === 'idle' || phase.tag === 'error') && (
        <div className="window" style={{ marginTop: 16 }}>
          <div className="titlebar">
            <span className="titlebar-title">Stage 01 - Trial Balance</span>
            <span className="titlebar-meta">upload or paste</span>
          </div>
          <div style={{ padding: '16px 18px', display: 'grid', gap: 12 }}>
            {/* Drag-and-drop zone (JR-7) */}
            <button
              type="button"
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: dragOver ? '2px dashed var(--denim)' : '2px dashed var(--grid)',
                borderRadius: 'var(--radius)',
                background: dragOver ? 'rgba(65,82,110,0.06)' : 'var(--screen)',
                padding: '20px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 150ms, background 150ms',
                width: '100%'
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: dragOver ? 'var(--denim)' : 'var(--ink-soft)'
                }}
              >
                Drop a CSV, XLSX, or PDF trial balance here
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-soft)', marginTop: 6 }}>
                or click to browse
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleUpload(file)
                  e.target.value = ''
                }}
              />
            </button>

            {/* Upload error — shown inline; paste fallback always available */}
            {uploadError && (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--rust)',
                  padding: '8px 12px',
                  border: '1px solid var(--rust)',
                  borderRadius: 'var(--radius)',
                  background: 'rgba(181,80,60,0.04)'
                }}
              >
                {uploadError}
              </div>
            )}

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--grid)' }} />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--ink-soft)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}
              >
                or paste below
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--grid)' }} />
            </div>

            {/* Paste fallback (hard requirement — always functional) */}
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={8}
              style={{
                width: '100%',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                background: 'var(--screen)',
                border: 'var(--border)',
                borderRadius: 'var(--radius)',
                padding: '10px 12px',
                color: 'var(--ink)',
                resize: 'vertical'
              }}
              placeholder="Paste trial balance text here..."
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={handleClassify}
                style={{
                  padding: '8px 16px',
                  border: 'var(--border)',
                  background: 'var(--denim)',
                  color: 'var(--paper)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  cursor: 'pointer',
                  borderRadius: 'var(--radius)'
                }}
              >
                Classify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* The stepped pipeline - shown once classify has started */}
      {phase.tag !== 'idle' && !entityLoading && (
        <>
          {/* Stepper card */}
          <div className="window" style={{ marginTop: 16 }}>
            <div className="titlebar">
              <span className="titlebar-title">Filing Pipeline</span>
              {isLoading && <div className="barber" style={{ width: 80, height: 4, flexShrink: 0 }} />}
            </div>
            {stages.map((stage) => (
              <StageRow key={stage.id} stage={stage} isActive={activeStageId === stage.id} />
            ))}
          </div>

          {/* Stage 1 detail: classified line items (shown once classify completes) */}
          {classifyResult &&
            (phase.tag === 'classified' ||
              phase.tag === 'starting' ||
              phase.tag === 'pending_approval' ||
              phase.tag === 'resuming' ||
              phase.tag === 'approved') && (
              <>
                <Stage1Detail classifyResult={classifyResult} lineItems={lineItems} />

                {/* Start Filing button - only while in "classified" state */}
                {phase.tag === 'classified' && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={handleStartFiling}
                      style={{
                        padding: '8px 16px',
                        border: 'var(--border)',
                        background: 'var(--denim)',
                        color: 'var(--paper)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        cursor: 'pointer',
                        borderRadius: 'var(--radius)'
                      }}
                    >
                      File With Review
                    </button>
                    <button
                      type="button"
                      onClick={handleOneShot}
                      style={{
                        padding: '8px 16px',
                        border: 'var(--border)',
                        background: 'transparent',
                        color: 'var(--ink)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        cursor: 'pointer',
                        borderRadius: 'var(--radius)'
                      }}
                    >
                      File Without Review
                    </button>
                  </div>
                )}
              </>
            )}

          {/* Stage 2+3 detail: computation + risk flags (shown in pending_approval / resuming / approved) */}
          {(phase.tag === 'pending_approval' || phase.tag === 'resuming') && (
            <>
              <ComputationPanel computation={phase.start.computation} title="Stage 02 - Computed (Pending Approval)" />

              {phase.start.risk_flags.length > 0 && (
                <div className="window" style={{ marginTop: 12 }}>
                  <div className="titlebar">
                    <span className="titlebar-title">Stage 03 - Risk Assessment</span>
                    <span className="titlebar-meta">
                      {phase.start.risk_flags.length} flag{phase.start.risk_flags.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ padding: '12px 18px' }}>
                    <RiskFlagList flags={phase.start.risk_flags} />
                  </div>
                </div>
              )}

              {/* Stage 4: Human approval gate */}
              <div className="window" style={{ marginTop: 12 }}>
                <div className="titlebar">
                  <span className="titlebar-title">Stage 04 - Human Approval</span>
                  <span className="titlebar-meta" style={{ color: 'var(--mustard)' }}>
                    AWAITING YOU
                  </span>
                </div>
                <div style={{ padding: '16px 18px', display: 'grid', gap: 12 }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6 }}>
                    Review the computed figures and risk flags above before approving this filing. This gate is
                    enforced: the filing graph pauses here for human sign-off.
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => handleApprove(true)}
                      style={{
                        padding: '8px 20px',
                        border: '1px solid var(--denim)',
                        background: 'var(--denim)',
                        color: 'var(--paper)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        cursor: 'pointer',
                        borderRadius: 'var(--radius)'
                      }}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(false)}
                      style={{
                        padding: '8px 20px',
                        border: '1px solid var(--rust)',
                        background: 'transparent',
                        color: 'var(--rust)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        cursor: 'pointer',
                        borderRadius: 'var(--radius)'
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Stage 5: Finalized result */}
          {phase.tag === 'approved' && (
            <>
              <ComputationPanel
                computation={phase.result.computation}
                title={phase.result.approved ? 'Stage 05 - Filing Finalized' : 'Stage 05 - Filing Rejected'}
              />
              <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    padding: '8px 16px',
                    border: 'var(--border)',
                    background: 'transparent',
                    color: 'var(--ink)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    cursor: 'pointer',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  Start Over
                </button>
              </div>
            </>
          )}

          {/* Technical details disclosure */}
          {(classifyResult || latestComputation) && (
            <TechnicalDetails classifyResult={classifyResult} computation={latestComputation} />
          )}
        </>
      )}
    </>
  )
}
