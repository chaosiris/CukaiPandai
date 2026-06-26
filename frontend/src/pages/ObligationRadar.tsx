import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { type Obligation, type ObligationCalendar, getObligations } from '../api/client'
import { InfoTip, Tooltip } from '../components/Tooltip'
import { useEntity } from '../hooks/useEntity'
import { isEntityIncomplete } from '../personas'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
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

// ---- Form codes glossary (moved from inline <details> into the Filing Obligations InfoTip) ----

const FORM_CODES_CONTENT = (
  <div style={{ display: 'grid', gap: 4 }}>
    <div>
      <strong style={{ color: 'var(--ink)' }}>Form C</strong> - annual income tax return for companies
    </div>
    <div>
      <strong style={{ color: 'var(--ink)' }}>CP204</strong> - advance tax instalment estimate; submitted before the
      financial year begins
    </div>
    <div>
      <strong style={{ color: 'var(--ink)' }}>SST-02</strong> - Sales and Service Tax return; required if SST-registered
    </div>
    <div>
      <strong style={{ color: 'var(--ink)' }}>CP39</strong> - monthly employer MTD (Monthly Tax Deduction) remittance
      for employees
    </div>
    <div>
      <strong style={{ color: 'var(--ink)' }}>MyInvois</strong> - e-invoicing compliance; required once gross income
      exceeds RM 1,000,000
    </div>
  </div>
)

// ---- Obligation summary content (moved off body into calendar heading InfoTip) ----

function obligationSummaryContent(obligations: Obligation[]) {
  const total = obligations.length
  const overdueCount = obligations.filter((o) => daysUntil(o.due_date) < 0).length
  const upcoming = [...obligations]
    .filter((o) => daysUntil(o.due_date) >= 0)
    .sort((a, b) => daysUntil(a.due_date) - daysUntil(b.due_date))[0]
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div>
        <strong>{total}</strong> obligation{total === 1 ? '' : 's'} total
      </div>
      <div>
        <strong style={{ color: overdueCount > 0 ? 'var(--rust)' : undefined }}>{overdueCount}</strong> overdue
      </div>
      {upcoming && (
        <div>
          Next due: <strong>{formatDate(upcoming.due_date)}</strong>
        </div>
      )}
      {overdueCount > 0 && (
        <div style={{ marginTop: 4, color: 'var(--ink-soft)', fontSize: 10 }}>
          Dates shown are for the sample basis period. OVERDUE status reflects the demo clock.
        </div>
      )}
    </div>
  )
}

/**
 * YA2026 calendar strip with custom Tooltip badges (no native title=).
 */
function ObligationCalendarViz({ obligations }: { obligations: Obligation[] }) {
  if (obligations.length === 0) return null

  const years = new Set(obligations.map((o) => new Date(o.due_date).getFullYear()))
  const sortedYears = [...years].sort()

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
        <span className="titlebar-meta">{sortedYears.join(' - ')}</span>
        <InfoTip
          label="Obligation calendar summary"
          content={obligations.length > 0 ? obligationSummaryContent(obligations) : 'No obligations loaded.'}
        />
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

                  {/* Form badges — custom Tooltip, no native title= */}
                  {items.map((ob) => {
                    const { overdue } = countdown(ob.due_date)
                    return (
                      <Tooltip
                        key={ob.rule_id}
                        trigger={
                          <span
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
                              borderRadius: 1,
                              cursor: 'default'
                            }}
                          >
                            {ob.form}
                          </span>
                        }
                        content={
                          <div>
                            <div>
                              <strong>{ob.form}</strong>
                            </div>
                            <div>{formatDate(ob.due_date)}</div>
                            <div>{ob.obligation_type.replace(/_/g, ' ')}</div>
                          </div>
                        }
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Legend for the last year */}
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
        Dates derived from real due_date - hover or focus a badge for detail
      </div>
    </div>
  )
}

export default function ObligationRadar() {
  const { entity, error: entityError, loading: entityLoading } = useEntity()
  const [data, setData] = useState<ObligationCalendar | null>(null)
  const [error, setError] = useState<string | null>(null)

  const entityEmpty = entity ? isEntityIncomplete(entity) : false

  useEffect(() => {
    if (!entity || entityEmpty) return
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
  }, [entity, entityEmpty])

  const displayError = entityError ?? error
  const sorted = data ? [...data.obligations].sort((a, b) => a.due_date.localeCompare(b.due_date)) : []

  if (!entityLoading && entityEmpty) {
    return (
      <>
        <div className="page-head">
          <h1>Obligation Calendar</h1>
          <p className="page-kicker">YA2026 deadlines derived from your entity profile.</p>
        </div>
        <div className="window">
          <div className="titlebar">
            <span className="titlebar-title">Set Up Your Company</span>
          </div>
          <div
            style={{
              padding: '20px 18px',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--ink-soft)',
              lineHeight: 1.7
            }}
          >
            Set up your company to see this. Add your details in the Entity page.
          </div>
          <div style={{ padding: '0 18px 18px' }}>
            <Link
              to="/entity"
              style={{
                display: 'inline-block',
                padding: '8px 20px',
                background: 'var(--denim)',
                color: 'var(--paper)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                borderRadius: 'var(--radius)'
              }}
            >
              Go to Entity Page
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="page-head">
        <h1>Obligation Calendar</h1>
        {/* OB-1: one-line entity-aware page description */}
        <p className="page-kicker">
          YA2026 deadlines for <strong>{entity?.tin ?? '...'}</strong> - every CP204, Form C, SST, and MTD date derived
          from your entity profile.
        </p>
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
            <span className="titlebar-title">Loading Obligations...</span>
          </div>
          <div className="loading-body">
            <div className="barber" />
          </div>
        </div>
      )}

      {entity && data && data.obligations.length > 0 && <ObligationCalendarViz obligations={data.obligations} />}

      {entity && (
        <div>
          {/* Filing Obligations card — Entity Snapshot removed (OB-1) */}
          <div className="window" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="titlebar">
              <span className="titlebar-title">Filing Obligations</span>
              <span className="titlebar-meta">{data ? `${data.obligations.length} items` : 'Loading...'}</span>
              {/* OB-1: form codes glossary moved here from inline <details> */}
              <InfoTip label="Form codes explained" content={FORM_CODES_CONTENT} />
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
              Derived from YA2026 rules - LHDN-sourced
            </div>
          </div>
        </div>
      )}
    </>
  )
}
