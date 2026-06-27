// FM-3 — /filing/:id: saved record view.
// Layout: headline tax-payable card on top (96px RM hero), then the Filing Pipeline card
// at the bottom (through "Finalized") with a collapsible technical details section.
// "How this was calculated" trust clarity: deterministic core, not the AI.
// 404 → friendly not-found card.
// PR-G3: scroll-spy index island + Ask AI deep-link + breadcrumb/draft/All-Filings cleanup.

import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
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
import { HelpCircleIcon } from '../components/icons'

// --- Section IDs for scroll-spy ---

const SECTION_TAX = 'fr-tax-computation'
const SECTION_RISK = 'fr-risk-assessment'
const SECTION_DRAFT = 'fr-filing-draft-pack'
const SECTION_PIPELINE = 'fr-filing-pipeline'

interface IndexEntry {
  id: string
  label: string
}

// --- Scroll-spy island ---

function PageIndex({
  entries,
  activeId
}: {
  entries: IndexEntry[]
  activeId: string
}) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    // Offset for sticky topbar (~84px)
    const top = el.getBoundingClientRect().top + window.scrollY - 84
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <nav aria-label="On this page" className="page-index">
      <div className="page-index-label">On this page</div>
      <ul className="page-index-list">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              className="page-index-link"
              aria-current={activeId === entry.id ? 'true' : undefined}
              onClick={(e) => handleClick(e, entry.id)}
            >
              {entry.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// --- Scroll-spy hook ---

function useActiveSection(ids: string[]): string {
  const [activeId, setActiveId] = useState(ids[0] ?? '')

  useEffect(() => {
    if (ids.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost entry that is intersecting
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        setActiveId(visible[0].target.id)
      },
      {
        rootMargin: '-84px 0px -60% 0px',
        threshold: 0
      }
    )

    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [ids])

  return activeId
}

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
  const navigate = useNavigate()
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
  const hasRisk = (record.risk_flags?.length ?? 0) > 0
  const hasComputation = !!record.computation

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
    <ActiveFilingRecord
      record={record}
      id={id ?? ''}
      stages={stages}
      hasRisk={hasRisk}
      hasComputation={hasComputation}
      reportUrl={reportUrl}
      reportLoading={reportLoading}
      reportError={reportError}
      onGenerateReport={() => void handleGenerateReport()}
      onNavigateAudit={() => navigate(`/audit-assistant?filing=${record.id}`)}
    />
  )
}

// Separate component so hooks always run unconditionally (avoids hooks-after-return lint warning)
function ActiveFilingRecord({
  record,
  id: _id,
  stages,
  hasRisk,
  hasComputation,
  reportUrl,
  reportLoading,
  reportError,
  onGenerateReport,
  onNavigateAudit
}: {
  record: FilingRecord
  id: string
  stages: Stage[]
  hasRisk: boolean
  hasComputation: boolean
  reportUrl: string | null
  reportLoading: boolean
  reportError: string | null
  onGenerateReport: () => void
  onNavigateAudit: () => void
}) {
  // Build and memoize index entries + ids from primitive props so the
  // IntersectionObserver only re-subscribes when the section set actually changes.
  const { indexEntries, ids } = useMemo(() => {
    const entries: IndexEntry[] = []
    if (hasComputation) entries.push({ id: SECTION_TAX, label: 'Tax Computation' })
    if (hasRisk) entries.push({ id: SECTION_RISK, label: 'Risk Assessment' })
    if (hasComputation) entries.push({ id: SECTION_DRAFT, label: 'Filing Draft Pack' })
    entries.push({ id: SECTION_PIPELINE, label: 'Filing Pipeline' })
    return { indexEntries: entries, ids: entries.map((e) => e.id) }
  }, [hasRisk, hasComputation])
  const activeId = useActiveSection(ids)

  return (
    <>
      <div className="page-head">
        <h1>{record.label}</h1>
        <p className="page-kicker">
          Form C · YA2026 · {record.tin} · Saved {formatDate(record.created_at)}
        </p>
      </div>

      {/* Breadcrumb */}
      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <Link
          to="/filing"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--ink-soft)',
            textDecoration: 'none'
          }}
        >
          &larr; Back to Filing Records
        </Link>
      </div>

      {/* Two-column layout: main content + sticky right rail */}
      <div className="filing-record-layout">
        {/* Main column */}
        <div className="filing-record-main">
          {/* Headline: tax payable card -- provenance in heading InfoTip (PR-E fix 3) */}
          {hasComputation && record.computation && (
            <div id={SECTION_TAX}>
              <ComputationPanel
                computation={record.computation}
                title="Tax Computation"
                headingTip="The tax figure above was computed by the deterministic, rule-based core -- not the AI. The AI only classified your trial-balance line items. Every figure traces to a specific rule ID and config version. Expand Show technical details below to see the full per-figure trace."
              />
            </div>
          )}

          {/* Risk flags */}
          {hasRisk && (
            <div className="window" id={SECTION_RISK}>
              <div className="titlebar">
                <span className="titlebar-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  Risk Assessment
                  <InfoTip content="Deterministic risk checks flagged by the rule-based core. These do not involve AI judgement." />
                </span>
                <span className="titlebar-meta">
                  {record.risk_flags?.length ?? 0} flag{(record.risk_flags?.length ?? 0) !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ padding: '12px 18px' }}>
                <RiskFlagList flags={record.risk_flags ?? []} />
              </div>
            </div>
          )}

          {/* Filing draft pack — WeasyPrint PDF preview + download (a preparation aid; never submitted) */}
          {hasComputation && (
            <div className="window" id={SECTION_DRAFT}>
              <div className="titlebar" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="titlebar-title">Filing Draft Pack</span>
                <InfoTip content="A printable Form C tax-computation working paper -- entity particulars, the computation working sheet, capital-allowance schedule and a Form C field summary -- to review and take to LHDN or your tax agent. CukaiPandai never submits on your behalf: Malaysia uses self-assessment, so you (or an authorised agent) file via MyTax. Every page is watermarked DRAFT - NOT FOR SUBMISSION." />
              </div>
              <div style={{ padding: '16px 18px', display: 'grid', gap: 12 }}>
                <div
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.6 }}
                >
                  Generate a Form C draft pack as a PDF for review before filing. This is a preparation aid only -- it
                  is not submitted to LHDN.
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={onGenerateReport}
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
          <div className="window" id={SECTION_PIPELINE}>
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

          {/* Bottom actions */}
          <div style={{ marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
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
            <button
              type="button"
              onClick={onNavigateAudit}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                border: 'var(--border)',
                background: 'var(--window)',
                color: 'var(--ink)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                cursor: 'pointer',
                borderRadius: 'var(--radius)'
              }}
            >
              <HelpCircleIcon />
              Ask AI
            </button>
          </div>
        </div>

        {/* Right rail: sticky scroll-spy index */}
        <div className="filing-record-rail">
          <PageIndex entries={indexEntries} activeId={activeId} />
        </div>
      </div>
    </>
  )
}
