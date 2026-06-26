// FM-3 — /filing/:id: saved record view.
// Layout: headline tax-payable card on top (96px RM hero), then the Filing Pipeline card
// at the bottom (through "Finalized") with a collapsible technical details section.
// "How this was calculated" trust clarity: deterministic core, not the AI.
// 404 → friendly not-found card.

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { type FilingRecord, getFiling } from '../api/client'
import {
  ComputationPanel,
  RiskFlagList,
  type Stage,
  type StageId,
  StageRow,
  type StageStatus,
  TechnicalDetailsDisclosure
} from '../components/FilingPipeline'
import { InfoTip } from '../components/Tooltip'

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return iso
  }
}

function buildFinalizedStages(rec: FilingRecord): Stage[] {
  const n = rec.line_items?.length ?? 0
  const comp = rec.computation
  const taxPayable = comp?.fields?.tax_payable?.value
  const chargeableIncome = comp?.fields?.chargeable_income?.value
  const flags = rec.risk_flags ?? []
  const high = flags.filter((f) => f.severity === 'high').length
  const medium = flags.filter((f) => f.severity === 'medium').length
  const low = flags.filter((f) => f.severity === 'low').length
  const parts: string[] = []
  if (high > 0) parts.push(`${high} high`)
  if (medium > 0) parts.push(`${medium} medium`)
  if (low > 0) parts.push(`${low} low`)

  return [
    {
      id: 'classify' as StageId,
      num: 1,
      name: 'Classify Line Items',
      status: 'complete' as StageStatus,
      writeBack: n > 0 ? `${n} line item${n !== 1 ? 's' : ''} classified` : 'Line items classified'
    },
    {
      id: 'compute' as StageId,
      num: 2,
      name: 'Compute Form C',
      status: 'complete' as StageStatus,
      writeBack:
        chargeableIncome != null && taxPayable != null
          ? `Chargeable income RM ${chargeableIncome.toLocaleString()}, tax payable RM ${taxPayable.toLocaleString()}`
          : 'Form C computation complete'
    },
    {
      id: 'risk' as StageId,
      num: 3,
      name: 'Risk Assessment',
      status: 'complete' as StageStatus,
      writeBack:
        parts.length > 0
          ? `${parts.join(', ')} risk flag${flags.length !== 1 ? 's' : ''} detected`
          : 'No risk flags detected'
    },
    {
      id: 'finalized' as StageId,
      num: 4,
      name: 'Finalized',
      status: 'complete' as StageStatus,
      writeBack: `Saved ${formatDate(rec.created_at)}`
    }
  ]
}

export default function FilingRecordPage() {
  const { id } = useParams<{ id: string }>()
  const [record, setRecord] = useState<FilingRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setNotFound(false)
    getFiling(id)
      .then((rec) => {
        setRecord(rec)
        setLoading(false)
      })
      .catch((e: Error) => {
        if (e.message.includes('404')) setNotFound(true)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <>
        <div className="page-head">
          <h1>Filing Record</h1>
        </div>
        <div className="window" style={{ marginTop: 16 }}>
          <div className="titlebar">
            <span className="titlebar-title">Loading</span>
            <div className="barber" style={{ width: 80, height: 4, flexShrink: 0 }} />
          </div>
          <div style={{ padding: '24px 18px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)' }}>
            Loading filing record...
          </div>
        </div>
      </>
    )
  }

  if (notFound || !record) {
    return (
      <>
        <div className="page-head">
          <h1>Filing Not Found</h1>
        </div>
        <div
          className="window"
          style={{ marginTop: 16, padding: '40px 24px', textAlign: 'center', display: 'grid', gap: 16 }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            This filing record does not exist or has been deleted.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/filing"
              style={{
                display: 'inline-block',
                padding: '8px 18px',
                border: 'var(--border)',
                background: 'transparent',
                color: 'var(--ink)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                textDecoration: 'none',
                borderRadius: 'var(--radius)'
              }}
            >
              Back to Filing Records
            </Link>
            <Link
              to="/filing/new"
              style={{
                display: 'inline-block',
                padding: '8px 18px',
                border: 'none',
                background: 'var(--denim)',
                color: 'var(--paper)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                borderRadius: 'var(--radius)'
              }}
            >
              Create New Filing
            </Link>
          </div>
        </div>
      </>
    )
  }

  const stages = buildFinalizedStages(record)

  return (
    <>
      <div className="page-head">
        <h1>{record.label}</h1>
        <p className="page-kicker">
          Form C · YA2026 · {record.tin} · Saved {formatDate(record.created_at)}
        </p>
      </div>

      {/* Breadcrumb */}
      <div style={{ marginTop: 12, marginBottom: 4 }}>
        <Link
          to="/filing"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--ink-soft)',
            textDecoration: 'none'
          }}
        >
          &larr; Filing Records
        </Link>
      </div>

      {/* Headline: tax payable card on top */}
      <ComputationPanel computation={record.computation} title="Tax Computation" />

      {/* Provenance note */}
      <div
        className="window"
        style={{
          marginTop: 12,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          background: 'var(--screen)'
        }}
      >
        <span
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--denim)', flexShrink: 0, marginTop: 1 }}
        >
          [i]
        </span>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)', lineHeight: 1.6 }}>
          <strong>How this was calculated:</strong> The tax figure above was computed by the{' '}
          <strong>deterministic, rule-based core</strong> -- not the AI. The AI only classified your trial-balance line
          items. Every figure traces to a specific rule ID and config version. Expand "Show technical details" below to
          see the full per-figure trace.
        </div>
      </div>

      {/* Risk flags */}
      {record.risk_flags && record.risk_flags.length > 0 && (
        <div className="window" style={{ marginTop: 12 }}>
          <div className="titlebar">
            <span className="titlebar-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Risk Assessment
              <InfoTip content="Deterministic risk checks flagged by the rule-based core. These do not involve AI judgement." />
            </span>
            <span className="titlebar-meta">
              {record.risk_flags.length} flag{record.risk_flags.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ padding: '12px 18px' }}>
            <RiskFlagList flags={record.risk_flags} />
          </div>
        </div>
      )}

      {/* Filing Pipeline card (through Finalized) + collapsible technical details */}
      <div className="window" style={{ marginTop: 12 }}>
        <div className="titlebar" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="titlebar-title">Filing Pipeline</span>
          <InfoTip content="The steps that produced this filing. Steps 2 onward are fully deterministic -- rule IDs and config versions are traceable in the technical details." />
          <span className="titlebar-meta" style={{ color: 'var(--denim)' }}>
            FINALIZED
          </span>
        </div>
        {stages.map((stage) => (
          <StageRow key={stage.id} stage={stage} isActive={false} />
        ))}

        {/* Technical details disclosure (collapsible) */}
        <TechnicalDetailsDisclosure computation={record.computation} classifyRouteInfo={null} />
      </div>

      {/* Bottom nav */}
      <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link
          to="/filing"
          style={{
            display: 'inline-block',
            padding: '8px 18px',
            border: 'var(--border)',
            background: 'transparent',
            color: 'var(--ink)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            textDecoration: 'none',
            borderRadius: 'var(--radius)'
          }}
        >
          All Filings
        </Link>
        <Link
          to="/filing/new"
          style={{
            display: 'inline-block',
            padding: '8px 18px',
            border: 'none',
            background: 'var(--denim)',
            color: 'var(--paper)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 700,
            textDecoration: 'none',
            borderRadius: 'var(--radius)'
          }}
        >
          + New Filing
        </Link>
      </div>
    </>
  )
}
