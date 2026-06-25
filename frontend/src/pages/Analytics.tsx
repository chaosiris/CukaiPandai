import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useActivePersona } from '../PersonaContext'
import { type Obligation, type ObligationCalendar, getObligations } from '../api/client'
import { useEntity } from '../hooks/useEntity'

// Shared date helpers (same logic as Dashboard and ObligationRadar — not reinvented)

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

function fmtRM(n: number): string {
  return `RM ${n.toLocaleString('en-MY')}`
}

const URGENT_WINDOW_DAYS = 30

// ---- Stat card ----

function StatCard({ label, value, alert }: { label: string; value: string | number; alert?: boolean }) {
  return (
    <div className="window" style={{ padding: '16px 18px', display: 'grid', gap: 6 }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--ink-soft)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em'
        }}
      >
        {label}
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
    </div>
  )
}

// ---- Obligation status breakdown ----

function StatusBreakdown({ obligations }: { obligations: Obligation[] }) {
  // Group by status bucket (overdue / upcoming-30 / pending)
  const overdue = obligations.filter((o) => daysUntil(o.due_date) < 0)
  const withinThirty = obligations.filter((o) => {
    const d = daysUntil(o.due_date)
    return d >= 0 && d <= URGENT_WINDOW_DAYS
  })
  const later = obligations.filter((o) => daysUntil(o.due_date) > URGENT_WINDOW_DAYS)

  // Group by form type
  const byForm: Record<string, number> = {}
  for (const ob of obligations) {
    byForm[ob.form] = (byForm[ob.form] ?? 0) + 1
  }
  const formRows = Object.entries(byForm).sort((a, b) => b[1] - a[1])

  const total = obligations.length

  function Bar({ count, color }: { count: number; color: string }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0
    return (
      <div
        style={{
          height: 8,
          border: 'var(--border)',
          background: 'var(--screen)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            transition: 'width 300ms ease'
          }}
        />
      </div>
    )
  }

  const rows = [
    { label: 'Overdue', count: overdue.length, color: 'var(--rust)' },
    { label: `Due within ${URGENT_WINDOW_DAYS} days`, count: withinThirty.length, color: 'var(--mustard)' },
    { label: 'Later', count: later.length, color: 'var(--denim)' }
  ]

  return (
    <div className="window">
      <div className="titlebar">
        <span className="closebox" aria-hidden="true" />
        <span className="titlebar-title">Status Breakdown</span>
        <span className="titlebar-meta">by deadline window</span>
      </div>

      <div style={{ padding: '14px 18px', display: 'grid', gap: 14 }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: 'grid', gap: 6 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 8
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
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  fontWeight: 700,
                  color: r.count > 0 ? r.color : 'var(--ink-soft)'
                }}
              >
                {r.count}
              </span>
            </div>
            <Bar count={r.count} color={r.color} />
          </div>
        ))}
      </div>

      {formRows.length > 0 && (
        <>
          <div
            style={{
              padding: '10px 18px',
              borderTop: 'var(--border)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--ink-soft)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em'
            }}
          >
            By Form Type
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {formRows.map(([form, count]) => (
              <li
                key={form}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 18px',
                  borderTop: 'var(--border)'
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--denim)'
                  }}
                >
                  {form}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--ink-soft)'
                  }}
                >
                  {count} obligation{count === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

// ---- Entity snapshot ----

function EntitySnapshot() {
  const { entity, loading, error } = useEntity()

  if (loading) {
    return (
      <div className="window">
        <div className="titlebar">
          <span className="closebox" aria-hidden="true" />
          <span className="titlebar-title">Entity Snapshot</span>
        </div>
        <div style={{ padding: '16px 18px' }}>
          <div className="barber" style={{ marginTop: 0 }} />
        </div>
      </div>
    )
  }

  if (error || !entity) {
    return (
      <div className="window">
        <div className="titlebar">
          <span className="closebox" aria-hidden="true" />
          <span className="titlebar-title">Entity Snapshot</span>
        </div>
        <div style={{ padding: '16px 18px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--rust)' }}>
          {error ?? 'No entity data.'}
        </div>
      </div>
    )
  }

  const rows = [
    { label: 'TIN', value: entity.tin },
    { label: 'Entity Type', value: entity.entity_type.replace(/_/g, ' ').toUpperCase() },
    { label: 'MSIC Code(s)', value: entity.msic_codes.join(', ') },
    { label: 'SST Registered', value: entity.sst_registered ? 'Yes' : 'No' },
    {
      label: 'Basis Period',
      value: entity.basis_period_start
        ? `${formatDate(entity.basis_period_start)} to ${formatDate(entity.basis_period_end)}`
        : 'N/A'
    },
    { label: 'Employees', value: String(entity.employee_count) },
    { label: 'Paid-Up Capital', value: fmtRM(entity.paid_up_capital) }
  ]

  return (
    <div className="window">
      <div className="titlebar">
        <span className="closebox" aria-hidden="true" />
        <span className="titlebar-title">Entity Snapshot</span>
        <span className="titlebar-meta" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
          {entity.tin}
        </span>
      </div>

      {/* Gross income hero figure */}
      <div style={{ padding: '14px 18px 12px', borderBottom: 'var(--border)' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
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
          Gross Income · YA2026
        </div>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {rows.map((row) => (
          <li
            key={row.label}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              padding: '8px 18px',
              borderBottom: 'var(--border)',
              alignItems: 'center'
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--ink-soft)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}
            >
              {row.label}
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink)', textAlign: 'right' }}>
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---- Analytics page ----

export default function Analytics() {
  const { persona } = useActivePersona()
  const [calendar, setCalendar] = useState<ObligationCalendar | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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
  }, [persona.tin, persona.ssm])

  const obligations: Obligation[] = calendar?.obligations ?? []

  const totalCount = obligations.length
  const overdueCount = obligations.filter((o) => daysUntil(o.due_date) < 0).length
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
          <div className="page-kicker">{persona.label} · YA2026 Compliance Overview</div>
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
          {/* Stat cards row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16,
              marginBottom: 24
            }}
          >
            <StatCard label="Total Obligations" value={totalCount} />
            <StatCard label="Overdue" value={overdueCount} alert={overdueCount > 0} />
            <StatCard label="Due within 30 Days" value={withinThirtyCount} alert={withinThirtyCount > 0} />
            <StatCard label="Next Due Date" value={nextObligation ? formatDate(nextObligation.due_date) : 'None'} />
          </div>

          {/* Compliance ratio note */}
          {overdueCount > 0 && (
            <div
              style={{
                marginBottom: 20,
                padding: '10px 14px',
                border: '1px solid var(--rust)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--rust)'
              }}
            >
              {overdueCount} of {totalCount} obligation{totalCount === 1 ? '' : 's'} overdue for {persona.label}.
            </div>
          )}

          {/* Two-column detail grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
              gap: 20,
              alignItems: 'start'
            }}
          >
            <StatusBreakdown obligations={obligations} />
            <EntitySnapshot key={`snap-${persona.tin}`} />
          </div>

          {/* Cross-link footer */}
          <div
            style={{
              marginTop: 28,
              padding: '12px 0',
              borderTop: 'var(--border)',
              display: 'flex',
              gap: 20,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}
          >
            <Link to="/obligations" style={{ color: 'var(--denim)', textDecoration: 'none' }}>
              Open Obligation Calendar →
            </Link>
            <Link to="/filing" style={{ color: 'var(--ink-soft)', textDecoration: 'none' }}>
              Start Form C Filing →
            </Link>
          </div>
        </>
      )}
    </>
  )
}
