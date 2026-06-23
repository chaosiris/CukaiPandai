import { useEffect, useState } from 'react'
import { type FormCResponse, getFormC } from '../api/client'

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
const DEMO_ITEMS = [
  { code: 'REV', description: 'Software revenue', amount: 500000, category: 'revenue' },
  { code: 'SAL', description: 'Salaries', amount: 200000, category: 'expense' },
  { code: 'REP', description: 'Repairs', amount: 4800, category: 'expense' }
]

export default function FilingStudio() {
  const [data, setData] = useState<FormCResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getFormC(DEMO_TIN, DEMO_SSM, DEMO_ITEMS)
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [])

  return (
    <div className="app-shell">
      <div className="page-head">
        <h1>Filing Studio</h1>
        <p className="page-kicker">Form C · YA2026 · {DEMO_TIN}</p>
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
            <span className="titlebar-title">Computing Form C…</span>
          </div>
          <div className="loading-body">
            <div className="barber" />
          </div>
        </div>
      )}

      {data && (
        <div className="window">
          <div className="titlebar">
            <span className="titlebar-title">{data.computation.form}</span>
            {data.requires_approval && <span className="titlebar-meta">PENDING APPROVAL</span>}
          </div>
          <ul className="req-list">
            {Object.entries(data.computation.fields).map(([key, trace]) => (
              <li key={key} className="requirement-row">
                <div className="requirement-topline">
                  <span className="requirement-label">
                    <span className="requirement-label-text">{key.replace(/_/g, ' ')}</span>
                    <span className="kind-tag">{trace.rule_id}</span>
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700 }}>
                    RM {trace.value.toLocaleString()}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
                    {trace.config_version}
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
