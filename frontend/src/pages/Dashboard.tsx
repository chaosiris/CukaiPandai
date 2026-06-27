import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useActivePersona } from '../PersonaContext'
import { type Obligation, type ObligationCalendar, getObligations } from '../api/client'
import { Skeleton, SkeletonText } from '../components/Skeleton'
import { isEntityIncomplete } from '../personas'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning.'
  if (h < 17) return 'Good afternoon.'
  return 'Good evening.'
}

/** Whole-day delta from today to dueDate (ISO string); negative means overdue. */
function daysUntil(dueDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/** Human-readable countdown from today to dueDate. */
function countdown(dueDate: string): { label: string; overdue: boolean } {
  const d = daysUntil(dueDate)
  if (d < 0) return { label: `${Math.abs(d)}d overdue`, overdue: true }
  if (d === 0) return { label: 'Due today', overdue: false }
  if (d === 1) return { label: 'Due tomorrow', overdue: false }
  return { label: `in ${d}d`, overdue: false }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

const URGENT_WINDOW_DAYS = 30

function isUrgent(dueDate: string): boolean {
  const d = daysUntil(dueDate)
  return d >= 0 && d <= URGENT_WINDOW_DAYS
}

/**
 * Pick the single most-pressing obligation to lead the hero with.
 * Overdue items win (most-overdue first); otherwise the nearest upcoming due date.
 */
function leadObligation(obligations: Obligation[]): Obligation | null {
  if (obligations.length === 0) return null
  const overdue = obligations.filter((o) => daysUntil(o.due_date) < 0)
  if (overdue.length > 0) {
    return [...overdue].sort((a, b) => daysUntil(a.due_date) - daysUntil(b.due_date))[0]
  }
  return [...obligations].sort((a, b) => daysUntil(a.due_date) - daysUntil(b.due_date))[0]
}

// ---- Primary action (hero) zone ----

interface HeroProps {
  lead: Obligation | null
  overdueCount: number
}

/** The dominant, urgency-aware next-step card. Routes to the calendar (where deadlines live);
 *  Form C leads additionally offer the Filing path. */
function PrimaryAction({ lead, overdueCount }: HeroProps) {
  if (!lead) {
    return (
      <div className="window dash-hero">
        <div className="dash-hero-body">
          <div className="dash-hero-kicker">Your next step</div>
          <div className="dash-hero-headline">You are all caught up.</div>
          <p className="dash-hero-sub">
            No outstanding YA2026 obligations for this entity. Review the full calendar to confirm nothing was missed.
          </p>
          <Link to="/obligations" className="dash-cta">
            Open Obligation Calendar →
          </Link>
        </div>
      </div>
    )
  }

  const { label, overdue } = countdown(lead.due_date)
  const urgent = overdue || isUrgent(lead.due_date)
  const typeLabel = lead.obligation_type.replace(/_/g, ' ')
  const isFormC = lead.form === 'C'

  return (
    <div className={`window dash-hero${urgent ? ' is-urgent' : ''}`}>
      <div className="dash-hero-body">
        <div className="dash-hero-kicker">
          {overdue
            ? overdueCount > 1
              ? `${overdueCount} obligations overdue`
              : 'Action overdue'
            : 'Your nearest obligation'}
        </div>

        <div className="dash-hero-headline">
          <span className="dash-hero-form">{lead.form}</span>
          <span className="dash-hero-type">{typeLabel}</span>
        </div>

        <div className="dash-hero-when">
          <span className={`dash-pill${overdue ? ' is-overdue' : urgent ? ' is-urgent' : ''}`}>{label}</span>
          <span className="dash-hero-date">Due {formatDate(lead.due_date)}</span>
        </div>

        <p className="dash-hero-sub">
          {overdue
            ? `This ${typeLabel} filing is past its YA2026 deadline. Open the calendar to review every obligation and prioritise what to file first.`
            : 'This is the soonest YA2026 deadline derived from your entity profile. Open the calendar to plan your filing.'}
        </p>

        <div className="dash-hero-actions">
          <Link to="/obligations" className="dash-cta">
            Review Obligation Calendar →
          </Link>
          {isFormC && (
            <Link to="/filing" className="dash-cta-ghost">
              Start Form C Filing →
            </Link>
          )}
        </div>
      </div>

      <div className="dash-hero-rail">
        <span className="dash-hero-rail-label">YA2026</span>
        <span className="dash-hero-rail-label">LHDN-sourced</span>
      </div>
    </div>
  )
}

// ---- Quick-access consoles (with hierarchy) ----

const PRIMARY_CONSOLE = {
  to: '/filing',
  title: 'Cited Form C Filing',
  desc: 'Classify your trial balance and step through the human-approval gate to a cited Form C.',
  kicker: 'Review and Approve · ILMU nemo-super',
  mascot: '/mascots/pandai-writing.png'
}

const SECONDARY_CONSOLES = [
  {
    to: '/obligations',
    title: 'Obligation Calendar',
    desc: 'Every YA2026 deadline derived from your entity profile.',
    kicker: 'Deterministic · LHDN-sourced',
    mascot: '/mascots/pandai-calendar.png'
  },
  {
    to: '/audit-assistant',
    title: 'Audit Assistant',
    desc: 'Build a citation-grounded defense pack; fabricated clauses are rejected.',
    kicker: 'RAG · ground_citation gate',
    mascot: '/mascots/pandai-assistant.png'
  }
]

function QuickAccess() {
  return (
    <div className="dash-consoles">
      <div className="dash-consoles-head">What You Can Do</div>

      <Link to={PRIMARY_CONSOLE.to} className="dash-console is-primary">
        <div className="dash-console-body">
          <div className="dash-console-title">{PRIMARY_CONSOLE.title}</div>
          <p className="dash-console-desc">{PRIMARY_CONSOLE.desc}</p>
          <div className="dash-console-kicker">{PRIMARY_CONSOLE.kicker}</div>
        </div>
        <img className="dash-console-mascot" src={PRIMARY_CONSOLE.mascot} alt="" aria-hidden="true" />
      </Link>

      {SECONDARY_CONSOLES.map((c) => (
        <Link key={c.to} to={c.to} className="dash-console">
          <div className="dash-console-body">
            <div className="dash-console-title">{c.title}</div>
            <p className="dash-console-desc">{c.desc}</p>
            <div className="dash-console-kicker">{c.kicker}</div>
          </div>
          <img className="dash-console-mascot" src={c.mascot} alt="" aria-hidden="true" />
        </Link>
      ))}
    </div>
  )
}

// ---- Upcoming Deadlines panel ----

function DeadlinesPanel({
  calendar,
  loading,
  error
}: {
  calendar: ObligationCalendar | null
  loading: boolean
  error: string | null
}) {
  const sorted = calendar ? [...calendar.obligations].sort((a, b) => daysUntil(a.due_date) - daysUntil(b.due_date)) : []

  return (
    <div className="window dash-panel">
      <div className="titlebar">
        <span className="titlebar-title">Upcoming Deadlines</span>
        <span className="titlebar-meta">YA2026</span>
        <span className="closebox" aria-hidden="true" />
      </div>

      {loading && (
        <div style={{ padding: '12px 18px', display: 'grid', gap: 10 }} aria-label="Loading upcoming deadlines">
          {[80, 65, 75, 55].map((w) => (
            <div
              key={w}
              style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 12, alignItems: 'center' }}
            >
              <Skeleton height={26} width={80} />
              <SkeletonText lines={1} />
              <Skeleton height={14} width={60} />
            </div>
          ))}
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
            const urgent = !overdue && isUrgent(ob.due_date)

            return (
              <li key={ob.rule_id} className="requirement-row" style={{ padding: '12px 18px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px minmax(0, 1fr) auto auto',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
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

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--ink)',
                        overflowWrap: 'anywhere'
                      }}
                    >
                      {ob.obligation_type.replace(/_/g, ' ')}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)' }}>
                      {formatDate(ob.due_date)}
                    </div>
                  </div>

                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      padding: '3px 7px',
                      border: `1px solid ${overdue ? 'var(--rust)' : urgent ? 'var(--mustard)' : 'var(--ink-soft)'}`,
                      color: overdue ? 'var(--rust)' : urgent ? 'var(--mustard)' : 'var(--ink-soft)',
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

// ---- Dashboard ----

export default function Dashboard() {
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

  const obligations = calendar?.obligations ?? []
  const lead = leadObligation(obligations)
  const overdueCount = obligations.filter((o) => daysUntil(o.due_date) < 0).length

  if (entityEmpty) {
    return (
      <>
        <div className="dash-head">
          <h1>{greeting()}</h1>
          <p className="dash-orient">
            Your YA2026 tax command center for <strong>{persona.label}</strong>.
          </p>
        </div>
        <div className="window" style={{ padding: '32px 24px', display: 'grid', gap: 12 }}>
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
      <div className="dash-head">
        <h1>{greeting()}</h1>
        <p className="dash-orient">
          Your YA2026 tax command center for <strong>{persona.label}</strong>. Track deadlines, file a cited Form C, and
          build audit-ready defenses.
        </p>
      </div>

      {/* Left column stacks the next-step hero over Upcoming Deadlines; the quick-access
          rail spans both rows on the right, so its last card aligns with the deadlines panel. */}
      <div className="dash-main-grid">
        <div className="dash-main-lead">
          <PrimaryAction lead={lead} overdueCount={overdueCount} />
        </div>
        <QuickAccess />
        <div className="dash-main-deadlines">
          <DeadlinesPanel calendar={calendar} loading={loading} error={error} />
        </div>
      </div>
    </>
  )
}
