// Welcome screen — shown after EVERY sign-in (SSO / email / guest), unless the user chose
// "Don't Show Again" (cp_skip_welcome), in which case AuthScreen routes straight to /dashboard.
//
// On-ramps:
//   "Try sample data" — persona picker (Acme / Sinar / Selera) → /start/obligations
//   "Use my own company" — /start/custom
//   "Skip to Dashboard" — one-time skip (sets cp_journey_done); welcome still shows next sign-in
//   "Don't Show Again" — sets cp_skip_welcome so future sign-ins go directly to /dashboard

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActivePersona } from '../PersonaContext'
import { JourneyMap } from '../components/JourneyProgress'
import { PERSONAS } from '../personas'
import './Welcome.css'

const JOURNEY_DONE_KEY = 'cp_journey_done'
const SKIP_WELCOME_KEY = 'cp_skip_welcome'

function setJourneyDone() {
  try {
    localStorage.setItem(JOURNEY_DONE_KEY, '1')
  } catch {
    // localStorage may be unavailable
  }
}

// "Don't Show Again": persist the skip flag (and mark the journey done) so future sign-ins
// land on /dashboard instead of /welcome.
function setSkipWelcome() {
  try {
    localStorage.setItem(SKIP_WELCOME_KEY, '1')
    localStorage.setItem(JOURNEY_DONE_KEY, '1')
  } catch {
    // localStorage may be unavailable
  }
}

export default function Welcome() {
  const navigate = useNavigate()
  const { setPersona } = useActivePersona()
  const [selectedTin, setSelectedTin] = useState(PERSONAS[0].tin)

  function handleTrySampleData() {
    const chosen = PERSONAS.find((p) => p.tin === selectedTin) ?? PERSONAS[0]
    setPersona(chosen)
    navigate('/start/obligations', { replace: true })
  }

  function handleSkipToDashboard() {
    setJourneyDone()
    navigate('/dashboard', { replace: true })
  }

  function handleDontShowAgain() {
    setSkipWelcome()
    navigate('/dashboard', { replace: true })
  }

  return (
    <div
      className="welcome-layout"
      style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '40px 0 80px'
      }}
    >
      {/* Mascot — decorative, pinned to the viewport beside the centered content on wide screens. */}
      <img className="welcome-mascot-fixed" src="/pandai-waving.png" alt="" aria-hidden="true" />

      {/* Content column */}
      <div>
        {/* One-line payoff */}
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--ink-soft)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 10
            }}
          >
            CukaiPandai · YA2026
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontWeight: 600,
              lineHeight: 1.15,
              color: 'var(--ink)',
              marginBottom: 12
            }}
          >
            Sovereign, Citation-Grounded Tax Assurance for Malaysian SMEs.
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 16,
              color: 'var(--ink-soft)',
              lineHeight: 1.5,
              marginBottom: 0
            }}
          >
            Three steps. Every figure cited. Fabricated clauses rejected at the gate.
          </p>
        </div>

        {/* ①②③ journey map */}
        <div
          className="window"
          style={{
            marginTop: 28,
            marginBottom: 28
          }}
        >
          <div
            style={{
              padding: '14px 18px',
              borderBottom: 'var(--border)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--ink-soft)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}
          >
            What You Will Get
          </div>
          <div style={{ padding: '16px 18px' }}>
            <JourneyMap />
          </div>
        </div>

        {/* On-ramps */}
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Try sample data */}
          <div className="window" style={{ padding: '20px 20px' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--ink)',
                marginBottom: 8
              }}
            >
              Try Sample Data
            </div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: 'var(--ink-soft)',
                marginBottom: 16,
                lineHeight: 1.4
              }}
            >
              Pick one of the three seeded Malaysian SMEs and walk through the full journey: deadlines, filing, and
              audit defense, with real fixture data.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={selectedTin}
                onChange={(e) => setSelectedTin(e.target.value)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  padding: '8px 12px',
                  border: 'var(--border)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  minWidth: 180
                }}
                aria-label="Select a sample company"
              >
                {PERSONAS.map((p) => (
                  <option key={p.tin} value={p.tin}>
                    {p.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                style={{
                  padding: '9px 22px',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  background: 'var(--denim)',
                  color: 'var(--paper)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  fontWeight: 700
                }}
                onClick={handleTrySampleData}
              >
                Start Guided Tour →
              </button>
            </div>
          </div>

          {/* Use my own company */}
          <div className="window" style={{ padding: '20px 20px' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--ink)',
                marginBottom: 8
              }}
            >
              Use My Own Company
            </div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: 'var(--ink-soft)',
                marginBottom: 16,
                lineHeight: 1.4
              }}
            >
              Enter your own SSM profile and see your real YA2026 obligations, a cited Form C, and an audit assistant
              grounded in your actual figures. Stored locally in your browser; no account required.
            </p>
            <button
              type="button"
              onClick={() => navigate('/start/custom')}
              style={{
                display: 'inline-block',
                padding: '9px 22px',
                border: 'var(--border)',
                borderRadius: 'var(--radius)',
                background: 'transparent',
                color: 'var(--ink)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 700
              }}
            >
              Use My Own Company →
            </button>
          </div>
        </div>

        {/* Skip to dashboard escape hatch */}
        <div
          style={{
            marginTop: 28,
            textAlign: 'center'
          }}
        >
          <button
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--ink-soft)',
              textDecoration: 'underline',
              padding: '8px 16px'
            }}
            onClick={handleSkipToDashboard}
          >
            Skip to Dashboard →
          </button>
          <div style={{ marginTop: 4 }}>
            <button
              type="button"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--ink-soft)',
                textDecoration: 'underline',
                padding: '6px 16px'
              }}
              onClick={handleDontShowAgain}
            >
              Don't Show Again
            </button>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--ink-soft)',
              marginTop: 8,
              letterSpacing: '0.04em'
            }}
          >
            YA2026 · decision-support, not legal advice
          </p>
        </div>
      </div>
    </div>
  )
}
