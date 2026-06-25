import { useEffect, useState } from 'react'
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
  startFiling
} from '../api/client'
import { SovereignBadge } from '../components/CitationPanel'
import { useEntity } from '../hooks/useEntity'

type Phase =
  | { tag: 'idle' }
  | { tag: 'classifying' }
  | { tag: 'classified'; classify: ClassifyResponse }
  | { tag: 'starting' }
  | { tag: 'pending_approval'; start: FilingStartResponse }
  | { tag: 'resuming'; start: FilingStartResponse }
  | { tag: 'approved'; result: FilingResumeResponse }
  | { tag: 'error'; message: string }

// Figures that represent the final liability — rendered in the hero section
const LIABILITY_KEYS = new Set(['tax_payable', 'zakat_offset', 'balance_payable'])
// Figures that are upstream computations — rendered in the supporting section
const UPSTREAM_KEYS = new Set(['gross_income', 'adjusted_income', 'chargeable_income'])

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

function RiskFlagList({ flags }: { flags: RiskFlag[] }) {
  if (flags.length === 0) return null
  return (
    <div
      style={{
        marginTop: 16,
        display: 'grid',
        gap: 8
      }}
    >
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
          <span className="kind-tag">{trace.rule_id}</span>
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700 }}>
          RM {trace.value.toLocaleString()}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
          {trace.config_version}
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
    <div className="window" style={{ marginTop: 16 }}>
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
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--ink-soft)'
            }}
          >
            {heroEntry[1].rule_id} · {heroEntry[1].config_version}
          </div>
        </div>
      )}

      {/* Liability section — tax payable + related figures */}
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

      {/* Supporting figures — upstream computation inputs */}
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

export default function FilingStudio() {
  const { persona } = useActivePersona()
  const { entity, error: entityError, loading: entityLoading } = useEntity()
  // Reset the studio when the active persona changes
  const [rawText, setRawText] = useState(persona.demoRawText)
  const [classifyResult, setClassifyResult] = useState<ClassifyResponse | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [phase, setPhase] = useState<Phase>({ tag: 'idle' })

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset when persona switches
  useEffect(() => {
    setRawText(persona.demoRawText)
    setClassifyResult(null)
    setLineItems([])
    setPhase({ tag: 'idle' })
  }, [persona.tin])

  const displayError = entityError ?? (phase.tag === 'error' ? phase.message : null)

  async function handleClassify() {
    if (!entity) return
    setPhase({ tag: 'classifying' })
    try {
      const result = await classifyTrialBalance(entity.tin, rawText)
      setClassifyResult(result)
      setLineItems(result.line_items)
      setPhase({ tag: 'classified', classify: result })
    } catch (e) {
      setPhase({ tag: 'error', message: (e as Error).message })
    }
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
    } catch (e) {
      const msg = (e as Error).message
      // 404 means thread already finalized or unknown — surface helpfully
      setPhase({ tag: 'error', message: msg.includes('404') ? 'Filing thread not found or already finalized.' : msg })
    }
  }

  async function handleOneShot() {
    if (!entity) return
    setPhase({ tag: 'starting' })
    try {
      const ssm = buildSsm(entity)
      const result = await getFormC(entity.tin, ssm, lineItems)
      // Wrap the one-shot result to look like a resume result
      setPhase({ tag: 'approved', result: { approved: !result.requires_approval, computation: result.computation } })
    } catch (e) {
      setPhase({ tag: 'error', message: (e as Error).message })
    }
  }

  function handleReset() {
    setPhase(classifyResult ? { tag: 'classified', classify: classifyResult } : { tag: 'idle' })
  }

  const isLoading = entityLoading || phase.tag === 'classifying' || phase.tag === 'starting' || phase.tag === 'resuming'

  const loadingLabel =
    phase.tag === 'classifying'
      ? 'Classifying Trial Balance…'
      : phase.tag === 'starting'
        ? 'Starting Filing (HITL)…'
        : phase.tag === 'resuming'
          ? 'Resuming After Approval…'
          : 'Loading Entity…'

  return (
    <div className="app-shell">
      <div className="page-head">
        <h1>Filing Studio</h1>
        <p className="page-kicker">Form C · YA2026 · {entity?.tin ?? '…'}</p>
      </div>

      {displayError && (
        <div className="window error-window">
          <div className="titlebar">
            <span className="titlebar-title">Error</span>
          </div>
          <div className="error-body">{displayError}</div>
        </div>
      )}

      {isLoading && (
        <div className="window loading-window">
          <div className="titlebar">
            <span className="titlebar-title">{loadingLabel}</span>
          </div>
          <div className="loading-body">
            <div className="barber" />
          </div>
        </div>
      )}

      {/* Step 1 — Classify trial balance */}
      {!entityLoading && entity && (phase.tag === 'idle' || phase.tag === 'error') && (
        <div className="window" style={{ marginTop: 16 }}>
          <div className="titlebar">
            <span className="titlebar-title">Step 1: Trial Balance</span>
            <span className="titlebar-meta">paste raw text</span>
          </div>
          <div style={{ padding: '16px 18px', display: 'grid', gap: 12 }}>
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
              placeholder="Paste trial balance text here…"
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

      {/* Step 2 — Classified line items */}
      {(phase.tag === 'classified' ||
        phase.tag === 'pending_approval' ||
        phase.tag === 'resuming' ||
        phase.tag === 'approved') &&
        classifyResult && (
          <div className="window" style={{ marginTop: 16 }}>
            <div className="titlebar">
              <span className="titlebar-title">Step 1: Classified Line Items</span>
              {classifyResult && (
                <SovereignBadge sovereign={classifyResult.sovereign} model={classifyResult.active_model} />
              )}
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
            {phase.tag === 'classified' && (
              <div style={{ padding: '12px 18px', borderTop: 'var(--border)', display: 'flex', gap: 10 }}>
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
                  Start Filing (HITL)
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
                  One-shot (no gate)
                </button>
              </div>
            )}
          </div>
        )}

      {/* Step 3 — HITL pending approval */}
      {phase.tag === 'pending_approval' && (
        <>
          <ComputationPanel computation={phase.start.computation} title="Step 2: Computed (Pending Approval)" />

          {/* Risk flags — prominently before the approve gate */}
          {phase.start.risk_flags.length > 0 && (
            <div className="window" style={{ marginTop: 16 }}>
              <div className="titlebar">
                <span className="titlebar-title">Risk Flags</span>
                <span className="titlebar-meta">
                  {phase.start.risk_flags.length} flag{phase.start.risk_flags.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ padding: '12px 18px' }}>
                <RiskFlagList flags={phase.start.risk_flags} />
              </div>
            </div>
          )}

          {/* Human-approval gate */}
          <div className="window" style={{ marginTop: 16 }}>
            <div className="titlebar">
              <span className="titlebar-title">Step 3: Human Approval Gate</span>
              {phase.start.requires_approval && <span className="titlebar-meta">PENDING APPROVAL</span>}
            </div>
            <div style={{ padding: '16px 18px', display: 'grid', gap: 12 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6 }}>
                Review the computed figures and risk flags above before approving this filing. This gate is enforced:
                the filing graph pauses here for human sign-off.
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

      {/* Step 4 — Approved / finalized */}
      {phase.tag === 'approved' && (
        <>
          <ComputationPanel
            computation={phase.result.computation}
            title={phase.result.approved ? 'Approved Filing' : 'Filing Rejected'}
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
              Start over
            </button>
          </div>
        </>
      )}
    </div>
  )
}
