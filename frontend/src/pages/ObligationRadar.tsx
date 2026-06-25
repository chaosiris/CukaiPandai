import { useEffect, useState } from 'react'
import { type ObligationCalendar, getObligations } from '../api/client'
import { useEntity } from '../hooks/useEntity'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtRM(n: number): string {
  return `RM ${n.toLocaleString('en-MY')}`
}

function countdown(dueDate: string): { label: string; overdue: boolean } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diffMs = due.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, overdue: true }
  if (diffDays === 0) return { label: 'Due today', overdue: false }
  if (diffDays === 1) return { label: 'Due tomorrow', overdue: false }
  return { label: `in ${diffDays}d`, overdue: false }
}

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

  const sorted = data ? [...data.obligations].sort((a, b) => a.due_date.localeCompare(b.due_date)) : []

  return (
    <>
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
        <div className="proof-grid">
          {/* Left column: entity card */}
          <div className="window" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="titlebar">
              <span className="titlebar-title">Entity Snapshot</span>
              <span className="titlebar-meta" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                {entity.tin}
              </span>
              <span className="closebox" aria-hidden="true" />
            </div>

            {/* Gross income hero */}
            <div style={{ padding: '14px 18px 10px', borderBottom: 'var(--border)' }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  lineHeight: 1.1
                }}
              >
                {fmtRM(entity.gross_income)}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--ink-soft)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginTop: 3
                }}
              >
                Gross income · YA2026
              </div>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1 }}>
              {[
                { label: 'Entity type', value: entity.entity_type.replace(/_/g, ' ').toUpperCase() },
                { label: 'MSIC code(s)', value: entity.msic_codes.join(', ') },
                { label: 'SST registered', value: entity.sst_registered ? 'Yes' : 'No' },
                {
                  label: 'Basis period',
                  value: entity.basis_period_start
                    ? `${formatDate(entity.basis_period_start)} – ${formatDate(entity.basis_period_end)}`
                    : 'N/A'
                },
                { label: 'Employees', value: String(entity.employee_count) },
                { label: 'Paid-up capital', value: fmtRM(entity.paid_up_capital) }
              ].map((row) => (
                <li
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 12,
                    padding: '9px 18px',
                    borderBottom: 'var(--border)'
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--ink-soft)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {row.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'right' }}>{row.value}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right column: obligations list */}
          <div className="window" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="titlebar">
              <span className="titlebar-title">Filing Obligations</span>
              <span className="titlebar-meta">{data ? `${data.obligations.length} items` : 'Loading…'}</span>
              <span className="closebox" aria-hidden="true" />
            </div>

            {!data && !displayError && (
              <div style={{ padding: '16px 18px' }}>
                <div className="barber" style={{ marginTop: 0 }} />
              </div>
            )}

            {sorted.length > 0 && (
              <ul className="req-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {sorted.map((ob) => {
                  const { label, overdue } = countdown(ob.due_date)
                  const isUrgent =
                    !overdue &&
                    (() => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const due = new Date(ob.due_date)
                      due.setHours(0, 0, 0, 0)
                      return (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 30
                    })()

                  return (
                    <li
                      key={ob.rule_id}
                      className="requirement-row"
                      style={{ borderBottom: 'var(--border)', padding: '12px 18px' }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '72px 1fr auto auto',
                          alignItems: 'center',
                          gap: 12
                        }}
                      >
                        {/* Form badge */}
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            fontWeight: 700,
                            color: overdue ? 'var(--rust)' : 'var(--denim)',
                            border: `1px solid ${overdue ? 'var(--rust)' : 'var(--denim)'}`,
                            padding: '2px 5px',
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            minWidth: 0
                          }}
                        >
                          {ob.form}
                        </span>

                        {/* Type + rule */}
                        <div>
                          <div
                            style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: 13,
                              fontWeight: 600,
                              color: 'var(--ink)'
                            }}
                          >
                            {ob.obligation_type.replace(/_/g, ' ')}
                          </div>
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 10,
                              color: 'var(--ink-soft)',
                              marginTop: 2
                            }}
                          >
                            {ob.rule_id} · {ob.config_version}
                          </div>
                        </div>

                        {/* Due date */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)' }}>
                            {formatDate(ob.due_date)}
                          </div>
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 10,
                              color: 'var(--ink-soft)',
                              marginTop: 2
                            }}
                          >
                            {ob.status}
                          </div>
                        </div>

                        {/* Countdown pill */}
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            padding: '3px 7px',
                            border: `1px solid ${overdue ? 'var(--rust)' : isUrgent ? 'var(--mustard)' : 'var(--ink-soft)'}`,
                            color: overdue ? 'var(--rust)' : isUrgent ? 'var(--mustard)' : 'var(--ink-soft)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {label}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            <div
              style={{
                padding: '9px 18px',
                borderTop: 'var(--border)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--ink-soft)',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                marginTop: 'auto'
              }}
            >
              Derived from YA2026 rules · LHDN-sourced
            </div>
          </div>
        </div>
      )}
    </>
  )
}
