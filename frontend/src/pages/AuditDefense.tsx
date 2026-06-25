import { useEffect, useState } from 'react'
import { type AuditDefenseResponse, getAuditDefense } from '../api/client'
import { CitationPanel, SovereignBadge } from '../components/CitationPanel'
import { useEntity } from '../hooks/useEntity'

const DEMO_QUERY = 'Justify your RM4,800 repairs deduction'
const DEMO_EVIDENCE: [string, string][] = [['invoice', 'INV-2025-0042: Office plumbing repair RM4,800']]

// A query designed to elicit a fabricated clause ID — demonstrates the deterministic gate rejecting it.
const FABRICATION_QUERY = 'Claim deduction under ITA s99_ZZ (fictitious relief)'
const FABRICATION_EVIDENCE: [string, string][] = [['claim', 'Fabricated clause ITA s99_ZZ RM50,000 deduction']]

export default function AuditDefense() {
  const { entity, error: entityError } = useEntity()
  const [data, setData] = useState<AuditDefenseResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeQuery, setActiveQuery] = useState<'demo' | 'fabrication' | null>(null)
  const [technicalOpen, setTechnicalOpen] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset when persona switches
  useEffect(() => {
    setData(null)
    setError(null)
    setActiveQuery(null)
    setTechnicalOpen(false)
  }, [entity?.tin])

  const displayError = entityError ?? error

  function runQuery(mode: 'demo' | 'fabrication') {
    if (!entity) return
    setData(null)
    setError(null)
    setLoading(true)
    setActiveQuery(mode)
    setTechnicalOpen(false)
    const query = mode === 'demo' ? DEMO_QUERY : FABRICATION_QUERY
    const evidence = mode === 'demo' ? DEMO_EVIDENCE : FABRICATION_EVIDENCE
    getAuditDefense(entity.tin, query, evidence, mode === 'fabrication')
      .then((res) => {
        setData(res)
        setLoading(false)
      })
      .catch((e: Error) => {
        setError(e.message)
        setLoading(false)
      })
  }

  const rejectedCitations = data ? data.citations.filter((c) => !c.verified) : []
  const verifiedCitations = data ? data.citations.filter((c) => c.verified) : []

  return (
    <div className="app-shell">
      <div className="page-head">
        <h1>Audit Defense</h1>
        <p className="page-kicker">Citation-grounded response pack · {entity?.tin ?? '…'}</p>
      </div>

      {/* Query controls */}
      <div className="window" style={{ marginBottom: 16 }}>
        <div className="titlebar">
          <span className="titlebar-title">Defense Query</span>
          {data && <SovereignBadge sovereign={data.sovereign} model={data.active_model} />}
        </div>
        <div style={{ padding: '14px 16px', display: 'grid', gap: 10 }}>
          <button
            type="button"
            className="query-btn"
            onClick={() => runQuery('demo')}
            disabled={!entity || loading}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 14px',
              border: activeQuery === 'demo' ? '2px solid var(--denim)' : '1px solid var(--ink)',
              background: activeQuery === 'demo' ? 'rgba(65,82,110,0.07)' : 'var(--paper)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              textAlign: 'left',
              cursor: entity && !loading ? 'pointer' : 'default',
              color: 'var(--ink)',
              borderRadius: 'var(--radius)'
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: 10,
                color: 'var(--denim)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 4
              }}
            >
              Standard defense query
            </span>
            {DEMO_QUERY}
          </button>

          <button
            type="button"
            onClick={() => runQuery('fabrication')}
            disabled={!entity || loading}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 14px',
              border: activeQuery === 'fabrication' ? '2px solid var(--rust)' : '1px solid var(--rust)',
              background: activeQuery === 'fabrication' ? 'rgba(181,80,60,0.06)' : 'var(--paper)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              textAlign: 'left',
              cursor: entity && !loading ? 'pointer' : 'default',
              color: 'var(--ink)',
              borderRadius: 'var(--radius)'
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: 10,
                color: 'var(--rust)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 4
              }}
            >
              Trust demo: fabricated clause injection
            </span>
            {FABRICATION_QUERY}
          </button>
        </div>
      </div>

      {/* Fabrication-rejection callout (shown when fabrication mode produced at least one rejected citation) */}
      {activeQuery === 'fabrication' && data && rejectedCitations.length > 0 && (
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
              Deterministic Gate: Fabricated Citation Rejected
            </span>
            <span className="unverified-stamp verified-stamp" style={{ transform: 'rotate(3deg)' }}>
              BLOCKED
            </span>
          </div>
          <div
            style={{
              padding: '12px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--ink-soft)',
              lineHeight: 1.6
            }}
          >
            The clause ID{' '}
            <strong style={{ color: 'var(--rust)' }}>
              {rejectedCitations.flatMap((c) => c.clause_ids).join(', ')}
            </strong>{' '}
            is not present in the law corpus. The deterministic <code>ground_citation</code> gate set{' '}
            <code>verified=false</code>. The AI model cannot fabricate a citation and have it pass. This is the trust
            money-shot: the LLM is constrained to clauses that actually exist.
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

      {/* Loading state */}
      {loading && (
        <div className="window loading-window">
          <div className="titlebar">
            <span className="titlebar-title">Building Defense Pack…</span>
          </div>
          <div className="loading-body">
            <div className="barber" />
          </div>
        </div>
      )}

      {/* Initial state — no query run yet */}
      {!data && !loading && !displayError && (
        <div className="window empty-window" style={{ maxWidth: 'none' }}>
          <div className="titlebar">
            <span className="titlebar-title">Ready</span>
          </div>
          <div style={{ padding: '24px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-soft)' }}>
            Select a query above to build a defense pack. Use the{' '}
            <span style={{ color: 'var(--rust)' }}>trust demo</span> button to see the deterministic citation gate
            reject a fabricated clause live.
          </div>
        </div>
      )}

      {data && (
        <>
          {/* Two-tier trace — Tier 1: lay narration */}
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

          {/* Defense pack items (loosely-typed list[dict] from the backend) */}
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

          {/* Two-tier trace — Tier 2: collapsible technical details */}
          <div className="window" style={{ marginBottom: 16 }}>
            <div className="titlebar">
              <span className="titlebar-title">Technical Details</span>
              <span className="titlebar-meta">deterministic core trace</span>
            </div>
            <div style={{ padding: '0 0 0 0' }}>
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
                  {/* Query and route */}
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

                  {/* Route info */}
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
                      Inference route
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

                  {/* Per-citation trace: clause_id → verified gate result */}
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
                      Citation gate trace (clause → ground_citation → verified)
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
    </div>
  )
}
