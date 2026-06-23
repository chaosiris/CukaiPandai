import { useEffect, useState } from 'react'
import { type DefensePack, getAuditDefense } from '../api/client'

const DEMO_TIN = 'C2581234509'
const DEMO_QUERY = 'Justify your RM4,800 repairs deduction'
const DEMO_EVIDENCE: [string, string][] = [['invoice', 'INV-2025-0042: Office plumbing repair RM4,800']]

export default function AuditDefense() {
  const [data, setData] = useState<DefensePack | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAuditDefense(DEMO_TIN, DEMO_QUERY, DEMO_EVIDENCE)
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [])

  return (
    <div className="app-shell">
      <div className="page-head">
        <h1>Audit Defense</h1>
        <p className="page-kicker">Citation-grounded response pack · {DEMO_TIN}</p>
      </div>

      <div className="window" style={{ marginBottom: 16 }}>
        <div className="titlebar">
          <span className="titlebar-title">Query</span>
        </div>
        <div style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 14 }}>{DEMO_QUERY}</div>
      </div>

      {error && (
        <div className="window error-window">
          <div className="titlebar">
            <span className="titlebar-title">Error</span>
          </div>
          <div className="error-body">{error}</div>
        </div>
      )}

      {!data && !error && (
        <div className="window loading-window">
          <div className="titlebar">
            <span className="titlebar-title">Building defense pack…</span>
          </div>
          <div className="loading-body">
            <div className="barber" />
          </div>
        </div>
      )}

      {data && (
        <>
          <div className="window" style={{ marginBottom: 16 }}>
            <div className="titlebar">
              <span className="titlebar-title">Citations</span>
              <span className="titlebar-meta">{data.citations.length} items</span>
            </div>
            <ul className="req-list">
              {data.citations.map((c) => (
                <li key={c.claim} className="requirement-row">
                  <div className="evidence">
                    <span className="evidence-line">{c.claim}</span>
                    <span className={c.verified ? 'verified-stamp' : 'verified-stamp unverified-stamp'}>
                      {c.verified ? 'VERIFIED' : 'REJECTED'}
                    </span>
                  </div>
                  <div
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)', paddingTop: 4 }}
                  >
                    {c.clause_ids.join(', ')}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="window">
            <div className="titlebar">
              <span className="titlebar-title">Exposure Note</span>
            </div>
            <div style={{ padding: '12px 16px', fontSize: 14, lineHeight: 1.6 }}>{data.exposure_note}</div>
          </div>
        </>
      )}
    </div>
  )
}
