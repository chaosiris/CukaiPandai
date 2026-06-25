import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useActivePersona } from '../PersonaContext'
import { type ObligationCalendar, getObligations } from '../api/client'
import { useEntity } from '../hooks/useEntity'

const CARDS = [
  {
    to: '/obligations',
    title: 'Obligation Calendar',
    desc: 'YA2026 deadlines derived from your entity profile — Form C, CP204, SST, and more.',
    kicker: 'Deterministic · LHDN-sourced'
  },
  {
    to: '/filing',
    title: 'Cited Form C Filing',
    desc: 'Drop raw trial-balance text, classify line items, and step through the human-approval gate.',
    kicker: 'HITL · ILMU nemo-super'
  },
  {
    to: '/audit-defense',
    title: 'Audit Defense',
    desc: 'Build a citation-grounded defense pack. The deterministic gate rejects any fabricated clause.',
    kicker: 'RAG · ground_citation gate'
  }
]

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning.'
  if (h < 17) return 'Good afternoon.'
  return 'Good evening.'
}

/** Compute a human-readable countdown from today to dueDate (ISO string). */
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

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtRM(n: number): string {
  return `RM ${n.toLocaleString('en-MY')}`
}

// ---- Upcoming Deadlines panel ----

function DeadlinesPanel({ tin, ssm }: { tin: string; ssm: import('../api/client').SsmProfile }) {
  const [calendar, setCalendar] = useState<ObligationCalendar | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setCalendar(null)
    getObligations(tin, ssm)
      .then((c) => {
        setCalendar(c)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [tin, ssm])

  const sorted = calendar ? [...calendar.obligations].sort((a, b) => a.due_date.localeCompare(b.due_date)) : []

  return (
    <div className="window" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="titlebar">
        <span className="titlebar-title">Upcoming Deadlines</span>
        <span className="titlebar-meta">YA2026</span>
        <span className="closebox" aria-hidden="true" />
      </div>

      {loading && (
        <div style={{ padding: '16px 18px' }}>
          <div className="barber" style={{ marginTop: 0 }} />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)', marginTop: 10 }}>
            Loading obligations…
          </p>
        </div>
      )}

      {error && (
        <div style={{ padding: '16px 18px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--rust)' }}>
          {error}
        </div>
      )}

      {!loading && !error && sorted.length === 0 && (
        <div style={{ padding: '16px 18px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)' }}>
          No obligations found.
        </div>
      )}

      {!loading && !error && sorted.length > 0 && (
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
                    gridTemplateColumns: '80px 1fr auto auto',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  {/* Form badge — fixed-width column; long labels truncate with ellipsis */}
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
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                      {ob.obligation_type.replace(/_/g, ' ')}
                    </div>
                    <div
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-soft)', marginTop: 2 }}
                    >
                      {ob.rule_id} · {ob.config_version}
                    </div>
                  </div>

                  {/* Due date */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)' }}>
                      {formatDate(ob.due_date)}
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
        <Link to="/obligations" style={{ color: 'var(--denim)', textDecoration: 'none' }}>
          Open full calendar →
        </Link>
      </div>
    </div>
  )
}

// ---- Entity Snapshot panel ----

function SnapshotPanel() {
  const { entity, loading, error } = useEntity()

  const rows: Array<{ label: string; value: string }> = entity
    ? [
        { label: 'Entity type', value: entity.entity_type.replace(/_/g, ' ').toUpperCase() },
        { label: 'MSIC code(s)', value: entity.msic_codes.join(', ') },
        { label: 'Gross income', value: fmtRM(entity.gross_income) },
        { label: 'SST registered', value: entity.sst_registered ? 'Yes' : 'No' },
        {
          label: 'Basis period',
          value: entity.basis_period_start
            ? `${formatDate(entity.basis_period_start)} – ${formatDate(entity.basis_period_end)}`
            : '—'
        },
        { label: 'Employees', value: String(entity.employee_count) },
        { label: 'Paid-up capital', value: fmtRM(entity.paid_up_capital) }
      ]
    : []

  return (
    <div className="window" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="titlebar">
        <span className="titlebar-title">Entity Snapshot</span>
        {entity && (
          <span className="titlebar-meta" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
            {entity.tin}
          </span>
        )}
        <span className="closebox" aria-hidden="true" />
      </div>

      {loading && (
        <div style={{ padding: '16px 18px' }}>
          <div className="barber" style={{ marginTop: 0 }} />
        </div>
      )}

      {error && (
        <div style={{ padding: '16px 18px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--rust)' }}>
          {error}
        </div>
      )}

      {!loading && !error && entity && (
        <>
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
            {rows.slice(1).map((row) => (
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
        </>
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
        Seeded · BE-8 / getEntity
      </div>
    </div>
  )
}

// ---- Trust strip ----

const TRUST_ITEMS = [
  { tag: 'Sovereign', detail: 'ILMU nemo-super — 100% in-country inference, no data leaves Malaysia' },
  { tag: 'Cited', detail: 'Every figure traces to ITA 1967 rule_id + config_version; no invented numbers' },
  { tag: 'Audit-ready', detail: 'ground_citation gate rejects fabricated clause IDs before they reach the FE' }
]

function TrustStrip() {
  return (
    <div
      className="window"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 0
      }}
    >
      {TRUST_ITEMS.map((item, i) => (
        <div
          key={item.tag}
          style={{
            padding: '14px 18px',
            borderRight: i < TRUST_ITEMS.length - 1 ? 'var(--border)' : undefined
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--denim)',
              marginBottom: 5
            }}
          >
            {item.tag}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
            {item.detail}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---- Dashboard ----

export default function Dashboard() {
  const { persona } = useActivePersona()

  return (
    <>
      <div className="page-head">
        <h1>{greeting()}</h1>
        <p className="page-kicker">CukaiPandai workspace · YA2026 · {persona.label}</p>
      </div>

      {/* Action cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
          marginTop: 8
        }}
      >
        {CARDS.map((card) => (
          <Link key={card.to} to={card.to} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div
              className="window"
              style={{
                height: '100%',
                display: 'grid',
                gridTemplateRows: 'auto 1fr auto',
                transition: 'box-shadow 160ms'
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = '4px 4px 0 rgba(0,0,0,0.22)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)'
              }}
            >
              <div className="titlebar">
                <span className="titlebar-title">{card.title}</span>
                <span className="closebox" aria-hidden="true" />
              </div>
              <div
                style={{
                  padding: '20px 18px 12px',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: 'var(--ink)'
                }}
              >
                {card.desc}
              </div>
              <div
                style={{
                  padding: '10px 18px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--denim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  borderTop: 'var(--border)'
                }}
              >
                {card.kicker}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Content section — 2-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr minmax(240px, 320px)',
          gap: 20,
          marginTop: 28,
          alignItems: 'start'
        }}
      >
        <DeadlinesPanel key={persona.tin} tin={persona.tin} ssm={persona.ssm} />
        <SnapshotPanel key={`snap-${persona.tin}`} />
      </div>

      {/* Trust strip */}
      <div style={{ marginTop: 20 }}>
        <TrustStrip />
      </div>
    </>
  )
}
