import { Link } from 'react-router-dom'
import { useActivePersona } from '../PersonaContext'

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

export default function Dashboard() {
  const { persona } = useActivePersona()

  return (
    <>
      <div className="page-head">
        <h1>{greeting()}</h1>
        <p className="page-kicker">CukaiPandai workspace · YA2026 · {persona.label}</p>
      </div>

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
    </>
  )
}
