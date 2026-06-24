import { useEffect, useState } from 'react'
import { type ObligationCalendar, getObligations } from '../api/client'
import { useEntity } from '../hooks/useEntity'

export default function ObligationRadar() {
  const { entity, error: entityError, loading: entityLoading } = useEntity()
  const [data, setData] = useState<ObligationCalendar | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!entity) return
    getObligations(entity.tin, {
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
    })
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [entity])

  const displayError = entityError ?? error

  return (
    <div className="app-shell">
      <div className="page-head">
        <h1>Obligation Radar</h1>
        <p className="page-kicker">YA2026 · {entity?.tin ?? '…'}</p>
      </div>

      {displayError && (
        <div className="window error-window">
          <div className="titlebar">
            <span className="titlebar-title">Error</span>
          </div>
          <div className="error-body">{displayError}</div>
        </div>
      )}

      {(entityLoading || (!data && !displayError)) && !displayError && (
        <div className="window loading-window">
          <div className="titlebar">
            <span className="titlebar-title">Loading Obligations…</span>
          </div>
          <div className="loading-body">
            <div className="barber" />
          </div>
        </div>
      )}

      {entity && (
        <div className="window">
          <div className="titlebar">
            <span className="titlebar-title">Entity</span>
            <span className="titlebar-meta" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              {entity.tin}
            </span>
          </div>
          <ul className="req-list">
            <li className="requirement-row">
              <div className="requirement-topline">
                <span className="requirement-label">
                  <span className="requirement-label-text">Type</span>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{entity.entity_type}</span>
              </div>
            </li>
            <li className="requirement-row">
              <div className="requirement-topline">
                <span className="requirement-label">
                  <span className="requirement-label-text">MSIC codes</span>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{entity.msic_codes.join(', ')}</span>
              </div>
            </li>
            <li className="requirement-row">
              <div className="requirement-topline">
                <span className="requirement-label">
                  <span className="requirement-label-text">Gross income</span>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                  RM {entity.gross_income.toLocaleString()}
                </span>
              </div>
            </li>
            <li className="requirement-row">
              <div className="requirement-topline">
                <span className="requirement-label">
                  <span className="requirement-label-text">Basis period</span>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                  {entity.basis_period_start} to {entity.basis_period_end}
                </span>
              </div>
            </li>
          </ul>
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
                      {ob.form}: {ob.obligation_type}
                    </span>
                    <span className="kind-tag must">{ob.status}</span>
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{ob.due_date}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
                    {ob.rule_id} · {ob.config_version}
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
