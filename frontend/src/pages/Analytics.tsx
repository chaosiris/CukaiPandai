import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useActivePersona } from '../PersonaContext'
import { type Obligation, type ObligationCalendar, getObligations } from '../api/client'
import { InfoTip } from '../components/Tooltip'
import { isEntityIncomplete } from '../personas'

// Shared date helpers (same logic as Dashboard and ObligationRadar)

function daysUntil(dueDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

const URGENT_WINDOW_DAYS = 30

// ---- KPI card ----

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  alert?: boolean
  tip: string
}

function KpiCard({ label, value, sub, alert, tip }: KpiCardProps) {
  return (
    <div className="window" style={{ padding: '16px 18px', display: 'grid', gap: 4 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--ink-soft)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em'
        }}
      >
        <span>{label}</span>
        <InfoTip content={tip} label={`About ${label}`} />
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 32,
          fontWeight: 600,
          lineHeight: 1,
          color: alert ? 'var(--rust)' : 'var(--ink)'
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--ink-soft)'
          }}
        >
          {sub}
        </div>
      )}
    </div>
  )
}

// ---- Overdue Exposure panel ----

function OverdueExposure({ obligations }: { obligations: Obligation[] }) {
  const overdueRows = obligations
    .map((o) => ({ ...o, daysOverdue: -daysUntil(o.due_date) }))
    .filter((o) => o.daysOverdue > 0)
    .sort((a, b) => b.daysOverdue - a.daysOverdue)

  const maxDays = overdueRows.length > 0 ? overdueRows[0].daysOverdue : 1

  return (
    <div className="window">
      <div className="titlebar">
        <span className="closebox" aria-hidden="true" />
        <span className="titlebar-title">Overdue Exposure</span>
        <span className="titlebar-meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          most overdue first
          <InfoTip
            content="Each bar shows how many days overdue an obligation is, sorted from most to least overdue. Longer bars need the most urgent attention."
            label="About Overdue Exposure"
          />
        </span>
      </div>

      {overdueRows.length === 0 ? (
        <div
          style={{
            padding: '24px 18px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--ink-soft)'
          }}
        >
          All obligations are on track.
        </div>
      ) : (
        <ul className="row-list">
          {overdueRows.map((o) => {
            const pct = Math.round((o.daysOverdue / maxDays) * 100)
            return (
              <li
                key={`${o.form}-${o.due_date}`}
                style={{
                  padding: '10px 18px',
                  transition: 'background-color 160ms ease'
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLLIElement).style.backgroundColor = 'rgba(65, 82, 110, 0.07)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLLIElement).style.backgroundColor = ''
                }}
              >
                {/* Row header: form badge + obligation type + day count */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: 6
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span
                      style={{
                        flexShrink: 0,
                        padding: '1px 5px',
                        border: '1px solid var(--rust)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--rust)'
                      }}
                    >
                      {o.form}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 12,
                        color: 'var(--ink)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {o.obligation_type}
                    </span>
                  </div>
                  <span
                    style={{
                      flexShrink: 0,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--rust)'
                    }}
                  >
                    {o.daysOverdue} day{o.daysOverdue === 1 ? '' : 's'} overdue
                  </span>
                </div>
                {/* Horizontal bar scaled to max overdue */}
                <div
                  style={{
                    height: 6,
                    border: 'var(--border)',
                    background: 'var(--screen)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: 'var(--rust)',
                      transition: 'width 300ms ease'
                    }}
                  />
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--ink-soft)'
                  }}
                >
                  Due {formatDate(o.due_date)}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ---- Status Breakdown + By Form Type panels ----

// ---- Status Breakdown + By Form Type — compact count rows (OQ-1 option b) ----

function StatusAndFormCounts({ obligations }: { obligations: Obligation[] }) {
  const total = obligations.length
  const overdue = obligations.filter((o) => daysUntil(o.due_date) < 0).length
  const withinThirty = obligations.filter((o) => {
    const d = daysUntil(o.due_date)
    return d >= 0 && d <= URGENT_WINDOW_DAYS
  }).length
  const later = obligations.filter((o) => daysUntil(o.due_date) > URGENT_WINDOW_DAYS).length

  const byForm: Record<string, number> = {}
  for (const ob of obligations) {
    byForm[ob.form] = (byForm[ob.form] ?? 0) + 1
  }
  const formRows = Object.entries(byForm).sort((a, b) => b[1] - a[1])

  const statusRows = [
    { label: 'Overdue', count: overdue, color: overdue > 0 ? 'var(--rust)' : 'var(--ink-soft)' },
    {
      label: `Due within ${URGENT_WINDOW_DAYS} days`,
      count: withinThirty,
      color: withinThirty > 0 ? 'var(--mustard)' : 'var(--ink-soft)'
    },
    { label: 'On track', count: later, color: 'var(--denim)' }
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 20, alignItems: 'start' }}>
      {/* Status Breakdown — compact count rows */}
      <div className="window">
        <div className="titlebar">
          <span className="closebox" aria-hidden="true" />
          <span className="titlebar-title">Status Breakdown</span>
          <span className="titlebar-meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {total} total
            <InfoTip
              content="Counts obligations by how close their due date is: overdue (past due), due within 30 days (act now), or on track (later)."
              label="About Status Breakdown"
            />
          </span>
        </div>
        <ul className="row-list">
          {statusRows.map((r) => (
            <li
              key={r.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '10px 18px'
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--ink-soft)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {r.label}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: r.color }}>
                {r.count}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* By Form Type — compact count rows */}
      {formRows.length > 0 && (
        <div className="window">
          <div className="titlebar">
            <span className="closebox" aria-hidden="true" />
            <span className="titlebar-title">By Form Type</span>
            <span className="titlebar-meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {formRows.length} form{formRows.length !== 1 ? 's' : ''}
              <InfoTip
                content="Number of obligations per tax form type. Sorted most to fewest."
                label="About By Form Type"
              />
            </span>
          </div>
          <ul className="row-list">
            {formRows.map(([form, count]) => (
              <li
                key={form}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 18px'
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--denim)' }}>
                  {form}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
                  {count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ---- Analytics page ----

export default function Analytics() {
  const { persona } = useActivePersona()
  const [calendar, setCalendar] = useState<ObligationCalendar | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const entityEmpty = isEntityIncomplete(persona.ssm)

  useEffect(() => {
    if (entityEmpty) return
    setLoading(true)
    setError(null)
    setCalendar(null)
    getObligations(persona.tin, persona.ssm)
      .then((c) => {
        setCalendar(c)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [persona.tin, persona.ssm, entityEmpty])

  if (entityEmpty) {
    return (
      <>
        <header className="page-head">
          <div>
            <h1>Analytics</h1>
            <div className="page-kicker">YA2026 compliance at a glance.</div>
          </div>
        </header>
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

  const obligations: Obligation[] = calendar?.obligations ?? []

  const totalCount = obligations.length
  const overdueCount = obligations.filter((o) => daysUntil(o.due_date) < 0).length
  const onTrackCount = totalCount - overdueCount
  const complianceRate = totalCount > 0 ? Math.round((onTrackCount / totalCount) * 100) : 100
  const withinThirtyCount = obligations.filter((o) => {
    const d = daysUntil(o.due_date)
    return d >= 0 && d <= URGENT_WINDOW_DAYS
  }).length
  const nextObligation = [...obligations]
    .filter((o) => daysUntil(o.due_date) >= 0)
    .sort((a, b) => daysUntil(a.due_date) - daysUntil(b.due_date))[0]

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Analytics</h1>
          <div className="page-kicker">
            Your YA2026 compliance at a glance: obligation load, overdue exposure, and what is due next.
          </div>
        </div>
      </header>

      {/* Loading state */}
      {loading && (
        <div className="window loading-window">
          <div className="titlebar">
            <span className="closebox" aria-hidden="true" />
            <span className="titlebar-title">Loading obligations...</span>
          </div>
          <div className="loading-body">
            <div className="barber" style={{ marginTop: 0 }} />
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="window error-window">
          <div className="titlebar">
            <span className="closebox" aria-hidden="true" />
            <span className="titlebar-title">Error</span>
          </div>
          <div className="error-body">{error}</div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && totalCount === 0 && (
        <div className="window empty-window">
          <div className="titlebar">
            <span className="closebox" aria-hidden="true" />
            <span className="titlebar-title">No obligations found</span>
          </div>
          <div className="empty-body">
            <span className="empty-arrow">?</span>
            <div className="empty-copy">No YA2026 obligations derived for this entity.</div>
          </div>
        </div>
      )}

      {/* Main content */}
      {!loading && !error && totalCount > 0 && (
        <>
          {/* KPI cards row — 5 cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))',
              gap: 14,
              marginBottom: 24
            }}
          >
            <KpiCard
              label="Compliance Rate"
              value={`${complianceRate}%`}
              sub={`${onTrackCount} of ${totalCount} on track`}
              alert={complianceRate < 100}
              tip="Percentage of obligations not yet overdue. Calculated as (total - overdue) / total. A lower rate means more obligations need immediate attention."
            />
            <KpiCard
              label="Total Obligations"
              value={totalCount}
              tip="The total number of YA2026 tax obligations derived for this entity, covering all applicable forms and filing types."
            />
            <KpiCard
              label="Overdue"
              value={overdueCount}
              alert={overdueCount > 0}
              tip="Obligations whose due date has already passed. Each one carries potential late-filing penalties; address these first."
            />
            <KpiCard
              label="Due Within 30 Days"
              value={withinThirtyCount}
              alert={withinThirtyCount > 0}
              tip="Obligations due in the next 30 days. These require prompt action to avoid becoming overdue."
            />
            <KpiCard
              label="Next Due Date"
              value={nextObligation ? formatDate(nextObligation.due_date) : 'None'}
              sub={nextObligation ? nextObligation.form : undefined}
              tip="The earliest upcoming due date across all non-overdue obligations. Acts as your next compliance deadline."
            />
          </div>

          {/* Overdue Exposure — full width, most impactful analysis */}
          <div style={{ marginBottom: 20 }}>
            <OverdueExposure obligations={obligations} />
          </div>

          {/* Status Breakdown + By Form Type — compact count rows (OQ-1 option b) */}
          <div style={{ marginBottom: 28 }}>
            <StatusAndFormCounts obligations={obligations} />
          </div>
        </>
      )}
    </>
  )
}
