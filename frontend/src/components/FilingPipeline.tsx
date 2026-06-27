// Shared pipeline UI primitives reused by /filing/new (creation) and /filing/[id] (saved record).
// Extracted from FilingStudio.tsx so both pages can import without duplication.

import type { ReactNode } from 'react'
import type { FormComputation, LineItem, RiskFlag } from '../api/client'
import { SovereignBadge } from './CitationPanel'
import { InfoTip } from './Tooltip'

// Figures that represent the final liability
export const LIABILITY_KEYS = new Set(['tax_payable', 'zakat_offset', 'balance_payable'])
// Figures that are upstream computations (the YA2026 ascertainment chain, in stage order)
export const UPSTREAM_KEYS = new Set([
  'gross_income',
  'business_income',
  'adjusted_income',
  'capital_allowances',
  'statutory_income',
  'aggregate_income',
  'total_income',
  'chargeable_income'
])

// Stage identifiers in execution order (one-shot pipeline: no Human Approval)
export type StageId = 'classify' | 'compute' | 'risk' | 'finalized'

export type StageStatus = 'pending' | 'running' | 'complete' | 'error'

export interface Stage {
  id: StageId
  num: number
  name: string
  status: StageStatus
  writeBack?: string
}

export function severityColor(severity: string): string {
  if (severity === 'high') return 'var(--rust)'
  if (severity === 'low') return 'var(--ink-soft)'
  return 'var(--mustard)'
}

export function statusColor(status: StageStatus): string {
  if (status === 'complete') return 'var(--denim)'
  if (status === 'running') return 'var(--mustard)'
  if (status === 'error') return 'var(--rust)'
  return 'var(--ink-soft)'
}

function statusLabel(status: StageStatus): string {
  if (status === 'complete') return 'COMPLETE'
  if (status === 'running') return 'IN PROGRESS'
  if (status === 'error') return 'ERROR'
  return 'PENDING'
}

export function StageRow({ stage, isActive }: { stage: Stage; isActive: boolean }) {
  const color = statusColor(stage.status)
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr auto',
        alignItems: 'center',
        gap: 12,
        padding: '10px 18px',
        background: isActive ? 'var(--screen)' : 'transparent',
        transition: 'background 200ms'
      }}
    >
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

export function RiskFlagList({ flags }: { flags: RiskFlag[] }) {
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

export function FigureTraceRow({
  label,
  trace
}: {
  label: string
  trace: { value: number; inputs: string[]; rule_id: string; config_version: string }
}) {
  return (
    <li className="requirement-row">
      <div className="requirement-topline">
        <span className="requirement-label">
          <span className="requirement-label-text">{label.replace(/_/g, ' ')}</span>
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700 }}>
          RM {trace.value.toLocaleString('en-MY')}
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
          className="trace-detail"
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

/** The main computation card: 96px RM hero + liability + supporting + other figures. */
export function ComputationPanel({
  computation,
  title,
  headingTip
}: {
  computation: FormComputation
  title: string
  headingTip?: ReactNode
}) {
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
        {headingTip && <InfoTip content={headingTip} label="How this was calculated" />}
      </div>

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
              fontSize: 'clamp(2.25rem, 12vw, 96px)',
              fontWeight: 700,
              lineHeight: 1.05,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              maxWidth: '100%',
              overflowWrap: 'anywhere'
            }}
          >
            RM {heroEntry[1].value.toLocaleString('en-MY')}
          </div>
        </div>
      )}

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

/**
 * Stage 1 detail: the line items.
 * `manual` = entered directly through the structured form (deterministic, no AI) -> show a neutral
 * note instead of the sovereign-model badge, since no LLM classified anything.
 */
export function Stage1Detail({
  classifyResult,
  lineItems,
  manual = false
}: {
  classifyResult: { sovereign: boolean; active_model: string }
  lineItems: LineItem[]
  manual?: boolean
}) {
  return (
    <div className="window" style={{ marginTop: 12 }}>
      <div className="titlebar">
        <span className="titlebar-title">{manual ? 'Line Items' : 'Classified Line Items'}</span>
        {!manual && <SovereignBadge sovereign={classifyResult.sovereign} model={classifyResult.active_model} />}
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
                RM {item.amount.toLocaleString('en-MY')}
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

/**
 * Technical details disclosure used in the saved-record view.
 * Shows the per-figure deterministic trace (rule_id / config_version / inputs / value).
 * The provenance note ("computed by the rule-based core, not the AI") is shown before the <details>.
 */
export function TechnicalDetailsDisclosure({
  computation,
  classifyRouteInfo
}: {
  computation: FormComputation | null
  classifyRouteInfo?: { sovereign: boolean; active_model: string } | null
}) {
  return (
    <details style={{ marginTop: 0 }}>
      <summary
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--denim)',
          cursor: 'pointer',
          userSelect: 'none',
          padding: '10px 18px',
          letterSpacing: '0.04em',
          borderTop: 'var(--border)'
        }}
      >
        Show technical details
      </summary>
      <div
        className="trace-detail"
        style={{
          padding: '16px 18px',
          display: 'grid',
          gap: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--ink-soft)',
          borderTop: 'var(--border)'
        }}
      >
        {classifyRouteInfo && (
          <div>
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--ink-soft)',
                marginBottom: 8
              }}
            >
              Route Info (AI Classification Step)
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <div>
                <strong style={{ color: 'var(--ink)' }}>sovereign:</strong>{' '}
                {classifyRouteInfo.sovereign ? 'true' : 'false'}
              </div>
              <div>
                <strong style={{ color: 'var(--ink)' }}>active_model:</strong> {classifyRouteInfo.active_model}
              </div>
            </div>
          </div>
        )}

        {computation && (
          <div>
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--ink-soft)',
                marginBottom: 8
              }}
            >
              Deterministic Core Trace (per figure)
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
                    <strong style={{ color: 'var(--ink)' }}>value:</strong> RM {trace.value.toLocaleString('en-MY')}
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
