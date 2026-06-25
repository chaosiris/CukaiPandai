import { useEffect, useRef, useState } from 'react'
import { type AuditDefenseResponse, getAuditDefense } from '../api/client'
import { CitationPanel, SovereignBadge, VerifiedBadge } from '../components/CitationPanel'
import { useEntity } from '../hooks/useEntity'
import { useNotifications } from '../notifications'

// --- Constants ---

const DEMO_QUERY = 'Justify the RM4,800 repairs deduction'
const DEMO_EVIDENCE: [string, string][] = [['invoice', 'INV-2025-0042: Office plumbing repair RM4,800']]

const FABRICATION_QUERY = 'Claim deduction under ITA-1967-s999-FAKE (fictitious relief)'
const FABRICATION_EVIDENCE: [string, string][] = [['claim', 'Fabricated clause ITA-1967-s999-FAKE RM50,000 deduction']]

const EXAMPLE_QUERY = 'Is this depreciation deductible under the ITA?'
const EXAMPLE_EVIDENCE: [string, string][] = [['asset', 'Motor vehicle RM120,000 depreciation YA2026']]

// --- Pipeline stage simulation (mirrors FilingStudio deriveStages pattern; T4) ---

type PipelineStage = 'retrieve' | 'ground' | 'verify' | 'reject'

interface AuditStage {
  id: PipelineStage
  num: number
  name: string
  status: 'pending' | 'running' | 'complete' | 'blocked'
}

function deriveAuditStages(
  loading: boolean,
  data: AuditDefenseResponse | null,
  isFabricationMode: boolean,
  stageIndex: number
): AuditStage[] {
  const base: AuditStage[] = [
    { id: 'retrieve', num: 1, name: 'Retrieve Law', status: 'pending' },
    { id: 'ground', num: 2, name: 'Ground Claim', status: 'pending' },
    { id: 'verify', num: 3, name: 'Verify Citations', status: 'pending' },
    { id: 'reject', num: 4, name: 'Reject Fabrications', status: 'pending' }
  ]

  if (!loading && !data) return base

  if (loading) {
    for (let i = 0; i < base.length; i++) {
      if (i < stageIndex) base[i].status = 'complete'
      else if (i === stageIndex) base[i].status = 'running'
    }
    return base
  }

  // data resolved
  if (data) {
    base[0].status = 'complete'
    base[1].status = 'complete'
    base[2].status = 'complete'
    const hasRejected = data.citations.some((c) => !c.verified)
    base[3].status = isFabricationMode && hasRejected ? 'blocked' : 'complete'
  }

  return base
}

function stageColor(status: AuditStage['status']): string {
  if (status === 'complete') return 'var(--denim)'
  if (status === 'running') return 'var(--mustard)'
  if (status === 'blocked') return 'var(--rust)'
  return 'var(--ink-soft)'
}

function stageLabel(status: AuditStage['status']): string {
  if (status === 'complete') return 'COMPLETE'
  if (status === 'running') return 'IN PROGRESS'
  if (status === 'blocked') return 'BLOCKED'
  return 'PENDING'
}

function AuditStageRow({ stage, isActive }: { stage: AuditStage; isActive: boolean }) {
  const color = stageColor(stage.status)
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
        {stage.status === 'complete' ? '✓' : stage.status === 'blocked' ? '✗' : String(stage.num).padStart(2, '0')}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          fontWeight: stage.status === 'complete' || stage.status === 'blocked' ? 400 : 600,
          color: stage.status === 'pending' ? 'var(--ink-soft)' : 'var(--ink)'
        }}
      >
        {stage.name}
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
        {stageLabel(stage.status)}
      </div>
    </div>
  )
}

// --- Pack-shape preview (shown before a query runs) ---

function PackShapePreview() {
  return (
    <div className="window" style={{ marginBottom: 16, opacity: 0.7 }}>
      <div className="titlebar">
        <span className="titlebar-title" style={{ color: 'var(--ink-soft)' }}>
          Defense Pack Preview
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--ink-soft)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}
        >
          What you will get
        </span>
      </div>
      <div style={{ padding: '16px 18px', display: 'grid', gap: 12 }}>
        {/* Narrative placeholder */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--ink-soft)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6
            }}
          >
            Defense Narrative
          </div>
          <div
            style={{
              height: 14,
              background: 'var(--grid)',
              borderRadius: 3,
              marginBottom: 6,
              width: '90%'
            }}
          />
          <div style={{ height: 14, background: 'var(--grid)', borderRadius: 3, width: '70%' }} />
        </div>

        {/* Citation placeholders */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--ink-soft)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6
            }}
          >
            Citations
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { label: 'Claim supported by law', badge: true, badgeVerified: true },
              { label: 'Fabricated clause (trust demo only)', badge: true, badgeVerified: false }
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  border: 'var(--border)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--screen)',
                  opacity: 0.8
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--ink-soft)',
                    flex: 1
                  }}
                >
                  {item.label}
                </span>
                <VerifiedBadge verified={item.badgeVerified} />
              </div>
            ))}
          </div>
        </div>

        {/* Exposure note placeholder */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--ink-soft)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6
            }}
          >
            Exposure Assessment
          </div>
          <div style={{ height: 14, background: 'var(--grid)', borderRadius: 3, width: '85%' }} />
        </div>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--ink-soft)',
            borderTop: 'var(--border)',
            paddingTop: 10,
            fontStyle: 'italic'
          }}
        >
          The deterministic gate verifies every clause against the law corpus. Fabricated IDs cannot pass.
        </div>
      </div>
    </div>
  )
}

// --- Main component ---

export default function AuditDefense() {
  const { entity, error: entityError } = useEntity()
  const [query, setQuery] = useState('')
  const [data, setData] = useState<AuditDefenseResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isFabricationMode, setIsFabricationMode] = useState(false)
  const [technicalOpen, setTechnicalOpen] = useState(false)
  const { notify } = useNotifications()

  // For FE-simulated pipeline animation (T4): step through stages while loading
  const [stageIndex, setStageIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset when persona switches
  useEffect(() => {
    setData(null)
    setError(null)
    setQuery('')
    setIsFabricationMode(false)
    setTechnicalOpen(false)
    setStageIndex(0)
  }, [entity?.tin])

  // Advance the simulated pipeline stage during loading
  useEffect(() => {
    if (loading) {
      setStageIndex(0)
      timerRef.current = setInterval(() => {
        setStageIndex((i) => Math.min(i + 1, 2)) // advance through stages 0, 1, 2; stage 3 resolves with data
      }, 600)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [loading])

  const displayError = entityError ?? error

  function applyChip(chipQuery: string, chipEvidence: [string, string][], fabrication: boolean) {
    setQuery(chipQuery)
    setIsFabricationMode(fabrication)
    // Auto-run
    runQuery(chipQuery, chipEvidence, fabrication)
  }

  function runQuery(q: string, evidence: [string, string][], fabrication: boolean) {
    if (!entity || !q.trim()) return
    setData(null)
    setError(null)
    setLoading(true)
    setIsFabricationMode(fabrication)
    setTechnicalOpen(false)

    getAuditDefense(entity.tin, q.trim(), evidence, fabrication)
      .then((res) => {
        setData(res)
        setLoading(false)
        if (fabrication) {
          const rejected = res.citations.filter((c) => !c.verified)
          if (rejected.length > 0) {
            notify({
              title: 'Fabricated Citation Rejected',
              body: `Deterministic gate blocked ${rejected.length} unverified clause${rejected.length !== 1 ? 's' : ''}.`,
              kind: 'error'
            })
          }
        }
      })
      .catch((e: Error) => {
        setError(e.message)
        setLoading(false)
      })
  }

  function handleSubmit() {
    runQuery(query, [[query, query]], isFabricationMode)
  }

  const stages = deriveAuditStages(loading, data, isFabricationMode, stageIndex)
  const activeStageId = loading
    ? (stages.find((s) => s.status === 'running')?.id ?? null)
    : data
      ? (stages.find((s) => s.status !== 'complete' && s.status !== 'pending')?.id ?? stages[stages.length - 1].id)
      : null

  const rejectedCitations = data ? data.citations.filter((c) => !c.verified) : []
  const verifiedCitations = data ? data.citations.filter((c) => c.verified) : []

  return (
    <>
      <div className="page-head">
        <h1>Audit Defense</h1>
        <p className="page-kicker">Citation-grounded defense pack · {entity?.tin ?? '...'}</p>
      </div>

      {/* Trust-demo headline: the fabrication money-shot framing */}
      <div
        className="window"
        style={{ marginBottom: 16, borderColor: 'var(--denim)', background: 'rgba(65,82,110,0.04)' }}
      >
        <div className="titlebar" style={{ borderBottomColor: 'var(--denim)' }}>
          <span className="titlebar-title" style={{ color: 'var(--denim)' }}>
            Why This Is Trustworthy
          </span>
        </div>
        <div
          style={{
            padding: '12px 18px',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--ink-soft)',
            lineHeight: 1.6
          }}
        >
          Every citation is verified by a deterministic gate against the law corpus. If the AI invents a clause ID, the
          gate stamps it{' '}
          <span className="verified-stamp unverified-stamp" style={{ verticalAlign: 'middle' }}>
            REJECTED
          </span>{' '}
          and the fabrication is shown in the pack. Use the <strong style={{ color: 'var(--rust)' }}>Trust Demo</strong>{' '}
          chip below to see this live.
        </div>
      </div>

      {/* Query box + chip row */}
      <div className="window" style={{ marginBottom: 16 }}>
        <div className="titlebar">
          <span className="titlebar-title">Defense Query</span>
          {data && <SovereignBadge sovereign={data.sovereign} model={data.active_model} />}
        </div>
        <div style={{ padding: '14px 16px', display: 'grid', gap: 12 }}>
          {/* Free-text input */}
          <div style={{ display: 'grid', gap: 8 }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--ink-soft)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}
            >
              Ask about any figure in your filing
            </div>
            <textarea
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setIsFabricationMode(false)
              }}
              rows={3}
              placeholder="e.g. Justify the RM4,800 repairs deduction under ITA s33"
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
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!entity || loading || !query.trim()}
              style={{
                alignSelf: 'start',
                padding: '8px 18px',
                border: 'none',
                borderRadius: 'var(--radius)',
                background: !entity || loading || !query.trim() ? 'var(--grid)' : 'var(--denim)',
                color: 'var(--paper)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                cursor: !entity || loading || !query.trim() ? 'default' : 'pointer'
              }}
            >
              Build Defense Pack
            </button>
          </div>

          {/* Example chips */}
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--ink-soft)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 8
              }}
            >
              Example Queries
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {/* Standard chip 1 */}
              <button
                type="button"
                onClick={() => applyChip(DEMO_QUERY, DEMO_EVIDENCE, false)}
                disabled={!entity || loading}
                style={{
                  padding: '6px 12px',
                  border: 'var(--border)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--screen)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--ink)',
                  cursor: entity && !loading ? 'pointer' : 'default',
                  textAlign: 'left'
                }}
              >
                {DEMO_QUERY}
              </button>

              {/* Standard chip 2 */}
              <button
                type="button"
                onClick={() => applyChip(EXAMPLE_QUERY, EXAMPLE_EVIDENCE, false)}
                disabled={!entity || loading}
                style={{
                  padding: '6px 12px',
                  border: 'var(--border)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--screen)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--ink)',
                  cursor: entity && !loading ? 'pointer' : 'default',
                  textAlign: 'left'
                }}
              >
                {EXAMPLE_QUERY}
              </button>

              {/* Trust-demo fabrication chip */}
              <button
                type="button"
                onClick={() => applyChip(FABRICATION_QUERY, FABRICATION_EVIDENCE, true)}
                disabled={!entity || loading}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--rust)',
                  borderRadius: 'var(--radius)',
                  background: 'rgba(181,80,60,0.06)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--rust)',
                  cursor: entity && !loading ? 'pointer' : 'default',
                  textAlign: 'left'
                }}
              >
                Trust Demo: fabricated clause injection
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pack-shape preview — shown before any query runs */}
      {!data && !loading && !displayError && <PackShapePreview />}

      {/* Watchable FE-simulated pipeline (shown once a query starts) */}
      {(loading || data) && (
        <div className="window" style={{ marginBottom: 16 }}>
          <div className="titlebar">
            <span className="titlebar-title">Defense Pipeline</span>
            {loading && <div className="barber" style={{ width: 80, height: 4, flexShrink: 0 }} />}
          </div>
          {stages.map((stage) => (
            <AuditStageRow key={stage.id} stage={stage} isActive={stage.id === activeStageId} />
          ))}
        </div>
      )}

      {/* Fabrication money-shot — elevated as the headline trust payoff */}
      {isFabricationMode && data && rejectedCitations.length > 0 && (
        <div
          className="window"
          style={{
            marginBottom: 16,
            borderColor: 'var(--rust)',
            background: 'rgba(181,80,60,0.04)'
          }}
        >
          <div className="titlebar" style={{ borderBottomColor: 'var(--rust)' }}>
            <span className="titlebar-title" style={{ color: 'var(--rust)' }}>
              Trust Payoff: The AI Cannot Fabricate a Citation and Have It Pass
            </span>
            <span className="unverified-stamp verified-stamp" style={{ transform: 'rotate(3deg)' }}>
              BLOCKED
            </span>
          </div>
          <div style={{ padding: '14px 18px', display: 'grid', gap: 12 }}>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: 'var(--ink)',
                lineHeight: 1.6
              }}
            >
              The clause ID{' '}
              <strong style={{ color: 'var(--rust)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                {rejectedCitations.flatMap((c) => c.clause_ids).join(', ')}
              </strong>{' '}
              is not present in the law corpus. The deterministic <code>ground_citation</code> gate set{' '}
              <code>verified=false</code>. This is the trust money-shot: fabricated clause IDs are caught and stamped{' '}
              <span className="verified-stamp unverified-stamp" style={{ verticalAlign: 'middle' }}>
                REJECTED
              </span>
              .
            </div>
            {verifiedCitations.length > 0 && (
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  color: 'var(--ink-soft)',
                  borderTop: 'var(--border)',
                  paddingTop: 10
                }}
              >
                The genuine citation passes:{' '}
                <strong style={{ color: 'var(--denim)' }}>{verifiedCitations[0].clause_ids.join(', ')}</strong>{' '}
                <span className="verified-stamp" style={{ verticalAlign: 'middle' }}>
                  VERIFIED
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error state */}
      {displayError && (
        <div className="window error-window">
          <div className="titlebar">
            <span className="titlebar-title">Error</span>
          </div>
          <div className="error-body">{displayError}</div>
        </div>
      )}

      {data && (
        <>
          {/* Defense Narrative — Tier 1 */}
          <div className="window" style={{ marginBottom: 16 }}>
            <div className="titlebar">
              <span className="titlebar-title">Defense Narrative</span>
              <span className="titlebar-meta">plain language</span>
            </div>
            <div
              style={{
                padding: '16px 18px',
                fontSize: 15,
                lineHeight: 1.7,
                fontFamily: 'var(--font-body)'
              }}
            >
              {data.exposure_note}
            </div>
          </div>

          {/* Citations panel */}
          <div className="window" style={{ marginBottom: 16 }}>
            <div className="titlebar">
              <span className="titlebar-title">Citations</span>
              <span className="titlebar-meta">
                {verifiedCitations.length} verified · {rejectedCitations.length} rejected
              </span>
            </div>
            <ul className="req-list">
              {data.citations.map((c) => (
                <CitationPanel key={c.claim} citation={c} />
              ))}
            </ul>
          </div>

          {/* Law Corpus Matches */}
          {data.items.length > 0 && (
            <div className="window" style={{ marginBottom: 16 }}>
              <div className="titlebar">
                <span className="titlebar-title">Law Corpus Matches</span>
                <span className="titlebar-meta">{data.items.length} items</span>
              </div>
              <ul className="req-list">
                {data.items.map((item) => (
                  <li
                    key={Object.entries(item)
                      .map(([k, v]) => `${k}:${v}`)
                      .join('|')}
                    className="requirement-row"
                    style={{ padding: '10px 18px', display: 'grid', gap: 4 }}
                  >
                    {Object.entries(item).map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: 'var(--ink-soft)'
                        }}
                      >
                        <strong style={{ color: 'var(--ink)' }}>{k}:</strong> {String(v)}
                      </div>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Details — Tier 2 collapsible */}
          <div className="window" style={{ marginBottom: 16 }}>
            <div className="titlebar">
              <span className="titlebar-title">Technical Details</span>
              <span className="titlebar-meta">deterministic core trace</span>
            </div>
            <div>
              <button
                type="button"
                onClick={() => setTechnicalOpen((o) => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '10px 16px',
                  border: 0,
                  background: 'transparent',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--denim)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span style={{ fontSize: 10 }}>{technicalOpen ? '▼' : '▶'}</span>
                {technicalOpen ? 'Hide' : 'Show'} technical details
              </button>

              {technicalOpen && (
                <div
                  style={{
                    borderTop: '1px solid var(--grid)',
                    padding: '14px 18px',
                    display: 'grid',
                    gap: 16
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'var(--ink-soft)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: 4
                      }}
                    >
                      Query
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--ink)',
                        background: 'var(--screen)',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius)'
                      }}
                    >
                      {data.query}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'var(--ink-soft)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: 4
                      }}
                    >
                      Inference Route
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--ink)',
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        flexWrap: 'wrap'
                      }}
                    >
                      <SovereignBadge sovereign={data.sovereign} model={data.active_model} />
                      <span style={{ color: 'var(--ink-soft)' }}>
                        sovereign={String(data.sovereign)} · model={data.active_model}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'var(--ink-soft)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: 8
                      }}
                    >
                      Citation Gate Trace (clause_id → ground_citation → verified)
                    </div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {data.citations.map((c) => (
                        <div
                          key={c.claim}
                          style={{
                            background: 'var(--screen)',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius)',
                            borderLeft: `3px solid ${c.verified ? 'var(--denim)' : 'var(--rust)'}`,
                            display: 'grid',
                            gap: 4,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11
                          }}
                        >
                          <div>
                            <span style={{ color: 'var(--ink-soft)' }}>clause_ids: </span>
                            <strong style={{ color: c.verified ? 'var(--denim)' : 'var(--rust)' }}>
                              {c.clause_ids.join(', ')}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--ink-soft)' }}>ground_citation → </span>
                            <strong style={{ color: c.verified ? 'var(--denim)' : 'var(--rust)' }}>
                              corpus.exists() = {String(c.verified)}
                            </strong>
                          </div>
                          {c.section && (
                            <div style={{ color: 'var(--ink-soft)' }}>
                              section: {c.section}
                              {c.page_ref && ` · page: ${c.page_ref}`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
