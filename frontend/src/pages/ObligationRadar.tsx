import { useEffect, useState } from 'react'
import { type ObligationCalendar, getObligations } from '../api/client'

const DEMO_TIN = 'C2581234509'
const DEMO_SSM = {
  tin: DEMO_TIN,
  entity_type: 'Sdn Bhd',
  msic_codes: ['62010'],
  paid_up_capital: 500000,
  gross_income: 500000,
  employee_count: 12,
  sst_registered: false,
  basis_period_start: '2025-01-01',
  basis_period_end: '2025-12-31'
}

export default function ObligationRadar() {
  const [data, setData] = useState<ObligationCalendar | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getObligations(DEMO_TIN, DEMO_SSM)
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [])

  return (
    <div className="app-shell">
      <div className="page-head">
        <h1>Obligation Radar</h1>
        <p className="page-kicker">YA2026 · {DEMO_TIN}</p>
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
            <span className="titlebar-title">Loading obligations…</span>
          </div>
          <div className="loading-body">
            <div className="barber" />
          </div>
        </div>
      )}

      {data && (
        <div className="window">
          <div className="titlebar">
            <span className="titlebar-title">Obligations</span>
            <span className="titlebar-meta">{data.obligations.length} items</span>
          </div>
          <ul className="req-list">
            {data.obligations.map((ob) => (
              <li key={ob.rule_id} className="requirement-row">
                <div className="requirement-topline">
                  <span className="requirement-label">
                    <span className="requirement-label-text">
                      {ob.form} — {ob.obligation_type}
                    </span>
                    <span className="kind-tag must">{ob.status}</span>
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{ob.due_date}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
                    {ob.rule_id}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
