// FM-3 — /filing/:id: saved record view.
// Layout: headline tax-payable card on top (96px RM hero), then the Filing Pipeline card
// at the bottom (through "Finalized") with a collapsible technical details section.
// "How this was calculated" trust clarity: deterministic core, not the AI.
// 404 → friendly not-found card.

import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { type FilingRecord, getFiling, getFilingReport } from '../api/client'
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
          ? `Chargeable income RM ${chargeableIncome.toLocaleString('en-MY')}, tax payable RM ${taxPayable.toLocaleString('en-MY')}`
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
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reportUrl, setReportUrl] = useState<string | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setNotFound(false)
    setLoadError(null)
    getFiling(id)
      .then((rec) => {
        setRecord(rec)
        setLoading(false)
      })
      .catch((e: Error) => {
        // 404 -> genuinely not found; any other error (outage/network) is distinct, not "deleted".
        if (e.message.includes('404')) setNotFound(true)
        else setLoadError(e.message)
        setLoading(false)
      })
  }, [id])

  // Free the blob URL when it changes or the page unmounts.
  useEffect(() => {
    return () => {
      if (reportUrl) URL.revokeObjectURL(reportUrl)
    }
  }, [reportUrl])

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

  if (loadError) {
    return (
      <>
        <div className="page-head">
          <h1>Filing Record</h1>
        </div>
        <div className="window error-window" style={{ marginTop: 16 }}>
          <div className="titlebar">
            <span className="titlebar-title">Error</span>
          </div>
          <div className="error-body">{loadError}</div>
        </div>
        <div style={{ marginTop: 12 }}>
          <Link to="/filing" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)' }}>
            &larr; Back to Filing Records
          </Link>
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
                background: 'var(--window)',
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

  // Draft records resume in the editable /filing/new flow
  if (record.status === 'draft') {
    return <Navigate to={`/filing/new?resume=${record.id}`} replace />
  }

  const stages = buildFinalizedStages(record)

  async function handleGenerateReport() {
    if (!id) return
    setReportError(null)
    setReportLoading(true)
    try {
      const blob = await getFilingReport(id)
      setReportUrl(URL.createObjectURL(blob)) // previous URL is revoked by the cleanup effect
    } catch (e) {
      setReportError((e as Error).message)
    } finally {
      setReportLoading(false)
    }
  }

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

      {/* Headline: tax payable card on top -- provenance in heading InfoTip (PR-E fix 3) */}
      {record.computation && (
        <ComputationPanel
          computation={record.computation}
          title="Tax Computation"
          headingTip="The tax figure above was computed by the deterministic, rule-based core -- not the AI. The AI only classified your trial-balance line items. Every figure traces to a specific rule ID and config version. Expand Show technical details below to see the full per-figure trace."
        />
      )}

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

      {/* Filing draft pack — WeasyPrint PDF preview + download (a preparation aid; never submitted) */}
      {record.computation && (
        <div className="window" style={{ marginTop: 12 }}>
          <div className="titlebar" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="titlebar-title">Filing Draft Pack</span>
            <InfoTip content="A printable Form C tax-computation working paper -- entity particulars, the computation working sheet, capital-allowance schedule and a Form C field summary -- to review and take to LHDN or your tax agent. CukaiPandai never submits on your behalf: Malaysia uses self-assessment, so you (or an authorised agent) file via MyTax. Every page is watermarked DRAFT - NOT FOR SUBMISSION." />
            <span className="titlebar-meta">draft · not submitted</span>
          </div>
          <div style={{ padding: '16px 18px', display: 'grid', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              Generate a Form C draft pack as a PDF for review before filing. This is a preparation aid only -- it is
              not submitted to LHDN.
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => void handleGenerateReport()}
                disabled={reportLoading}
                style={{
                  padding: '8px 20px',
                  border: 'var(--border)',
                  background: 'var(--denim)',
                  color: 'var(--paper)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: reportLoading ? 'not-allowed' : 'pointer',
                  borderRadius: 'var(--radius)',
                  opacity: reportLoading ? 0.6 : 1
                }}
              >
                {reportLoading ? 'Generating…' : reportUrl ? 'Regenerate draft pack' : 'Generate draft pack'}
              </button>
              {reportUrl && (
                <a
                  href={reportUrl}
                  download={`CukaiPandai-FormC-Draft-${record.tin}-YA2026.pdf`}
                  style={{
                    padding: '8px 18px',
                    border: 'var(--border)',
                    background: 'var(--window)',
                    color: 'var(--ink)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    textDecoration: 'none',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  Download PDF
                </a>
              )}
            </div>
            {reportError && (
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
                {reportError}
              </div>
            )}
            {reportUrl && (
              <iframe
                title="Form C draft pack preview"
                src={reportUrl}
                style={{
                  width: '100%',
                  height: 620,
                  border: 'var(--border)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--paper)'
                }}
              />
            )}
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
        <div className="row-div-list">
          {stages.map((stage) => (
            <StageRow key={stage.id} stage={stage} isActive={false} />
          ))}
        </div>

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
            background: 'var(--window)',
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
