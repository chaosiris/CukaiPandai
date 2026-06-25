import { useEffect, useState } from 'react'
import { type Obligation, type ObligationCalendar, getObligations } from '../api/client'
import { WhatNext } from '../components/JourneyProgress'
import { useEntity } from '../hooks/useEntity'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtRM(n: number): string {
  return `RM ${n.toLocaleString('en-MY')}`
}

function daysUntil(dueDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function countdown(dueDate: string): { label: string; overdue: boolean } {
  const d = daysUntil(dueDate)
  if (d < 0) return { label: `${Math.abs(d)}d overdue`, overdue: true }
  if (d === 0) return { label: 'Due today', overdue: false }
  if (d === 1) return { label: 'Due tomorrow', overdue: false }
  return { label: `in ${d}d`, overdue: false }
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Payoff headline: N obligations · M overdue · next due {date} */
function ObligationSummary({ obligations }: { obligations: Obligation[] }) {
  const total = obligations.length
  const overdueCount = obligations.filter((o) => daysUntil(o.due_date) < 0).length
  const upcoming = [...obligations]
    .filter((o) => daysUntil(o.due_date) >= 0)
    .sort((a, b) => daysUntil(a.due_date) - daysUntil(b.due_date))[0]

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="dash-summary" style={{ marginTop: 0, marginBottom: overdueCount > 0 ? 6 : 0 }}>
        <span>
          <strong>{total}</strong> obligation{total === 1 ? '' : 's'}
        </span>
        <span className="dash-summary-sep">·</span>
        <span className={overdueCount > 0 ? 'dash-summary-alert' : undefined}>
          <strong>{overdueCount}</strong> overdue
        </span>
        {upcoming && (
          <>
            <span className="dash-summary-sep">·</span>
            <span>next due {formatDate(upcoming.due_date)}</span>
          </>
        )}
      </div>
      {overdueCount > 0 && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--ink-soft)',
            lineHeight: 1.5
          }}
        >
          Dates shown are for the sample basis period. OVERDUE status reflects the demo clock, not your actual filing
          status.
        </div>
      )}
    </div>
  )
}

/**
 * YA2026 calendar strip: a horizontal month grid derived from real due_dates.
 * The year range is computed from the obligations' actual dates, not hardcoded.
 * Each month cell lists which obligations fall in it, flagged overdue/upcoming.
 */
function ObligationCalendarViz({ obligations }: { obligations: Obligation[] }) {
  if (obligations.length === 0) return null

  // Derive the year span from the obligations' due_dates (not hardcoded)
  const years = new Set(obligations.map((o) => new Date(o.due_date).getFullYear()))
  const sortedYears = [...years].sort()

  // Build a map: "YYYY-MM" -> Obligation[]
  const byYearMonth: Record<string, Obligation[]> = {}
  for (const ob of obligations) {
    const d = new Date(ob.due_date)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
    if (!byYearMonth[key]) byYearMonth[key] = []
    byYearMonth[key].push(ob)
  }

  return (
    <div className="window" style={{ marginBottom: 20 }}>
      <div className="titlebar">
        <span className="titlebar-title">YA2026 Obligation Calendar</span>
        <span className="titlebar-meta">{sortedYears.join(' – ')}</span>
        <span className="closebox" aria-hidden="true" />
      </div>

      {sortedYears.map((year) => (
        <div key={year} style={{ padding: '12px 18px 16px', borderBottom: 'var(--border)' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--ink-soft)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: 10
            }}
          >
            {year}
          </div>

          {/* 12-column month grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: 4
            }}
          >
            {MONTH_SHORT.map((mon, idx) => {
              const key = `${year}-${String(idx).padStart(2, '0')}`
              const items = byYearMonth[key] ?? []
              const hasOverdue = items.some((o) => daysUntil(o.due_date) < 0)
              const hasUpcoming = items.some((o) => daysUntil(o.due_date) >= 0)
              const isActive = items.length > 0

              const accentColor = hasOverdue ? 'var(--rust)' : hasUpcoming ? 'var(--denim)' : undefined

              return (
                <div
                  key={mon}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 2px',
                    borderTop: isActive ? `2px solid ${accentColor}` : '2px solid transparent',
                    background: isActive ? 'var(--screen)' : undefined,
                    borderRadius: 2
                  }}
                >
                  {/* Month label */}
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: isActive ? accentColor : 'var(--ink-soft)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontWeight: isActive ? 700 : 400
                    }}
                  >
                    {mon}
                  </span>

                  {/* Form badges for obligations in this month */}
                  {items.map((ob) => {
                    const { overdue } = countdown(ob.due_date)
                    return (
                      <span
                        key={ob.rule_id}
                        title={`${ob.form} · ${formatDate(ob.due_date)} · ${ob.obligation_type.replace(/_/g, ' ')}`}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 8,
                          fontWeight: 700,
                          color: overdue ? 'var(--rust)' : 'var(--denim)',
                          border: `1px solid ${overdue ? 'var(--rust)' : 'var(--denim)'}`,
                          padding: '1px 3px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%',
                          borderRadius: 1
                        }}
                      >
                        {ob.form}
                      </span>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Legend for this year's obligations */}
          {sortedYears.indexOf(year) === sortedYears.length - 1 && (
            <div
              style={{
                display: 'flex',
                gap: 16,
                marginTop: 10,
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--ink-soft)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    border: '1px solid var(--rust)',
                    borderRadius: 1
                  }}
                />
                Overdue
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    border: '1px solid var(--denim)',
                    borderRadius: 1
                  }}
                />
                Upcoming
              </span>
            </div>
          )}
        </div>
      ))}

      <div
        style={{
          padding: '8px 18px',
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--ink-soft)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}
      >
        Dates derived from real due_date · hover a badge for detail
      </div>
    </div>
  )
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

      {entity && data && <ObligationSummary obligations={data.obligations} />}

      {entity && data && data.obligations.length > 0 && <ObligationCalendarViz obligations={data.obligations} />}

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
              <details style={{ padding: '6px 18px 4px', borderBottom: 'var(--border)' }}>
                <summary
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--denim)',
                    cursor: 'pointer',
                    letterSpacing: '0.04em'
                  }}
                >
                  Form codes explained
                </summary>
                <div
                  style={{
                    paddingTop: 6,
                    display: 'grid',
                    gap: 3,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--ink-soft)'
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--ink)' }}>Form C</strong> — annual income tax return for companies
                  </div>
                  <div>
                    <strong style={{ color: 'var(--ink)' }}>CP204</strong> — advance tax instalment estimate; submitted
                    before the financial year begins
                  </div>
                  <div>
                    <strong style={{ color: 'var(--ink)' }}>SST-02</strong> — Sales and Service Tax return; required if
                    SST-registered
                  </div>
                  <div>
                    <strong style={{ color: 'var(--ink)' }}>CP39</strong> — monthly employer MTD (Monthly Tax Deduction)
                    remittance for employees
                  </div>
                  <div>
                    <strong style={{ color: 'var(--ink)' }}>MyInvois</strong> — e-invoicing compliance; required once
                    gross income exceeds RM 1,000,000
                  </div>
                </div>
              </details>
            )}

            {sorted.length > 0 && (
              <ul className="req-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {sorted.map((ob) => {
                  const { label, overdue } = countdown(ob.due_date)
                  const isUrgent = !overdue && daysUntil(ob.due_date) <= 30

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

      {/* JR-4: what next handoff */}
      <WhatNext
        nextLabel="Cited Form C Filing"
        nextRoute="/filing"
        nextOutput="Classify your trial balance and step through the Review and Approve gate to a cited Form C with your tax payable."
      />
    </>
  )
}
