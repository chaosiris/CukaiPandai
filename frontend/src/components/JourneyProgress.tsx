// JR-4 — Shared journey-progress component used in three places:
// 1. Welcome page (JR-3): the ①②③ OUTPUT map
// 2. Dashboard: a compact ①②③ strip derived from cp_journey_done
// 3. Per-console footer: "what next →" handoff card
//
// Progress derivation: only cp_journey_done is tracked (a single flag).
// Per-step completion is NOT invented — we don't know which individual steps are done.

import { Link } from 'react-router-dom'

export interface JourneyStep {
  num: 1 | 2 | 3
  label: string
  output: string
  route: string
}

export const JOURNEY_STEPS: JourneyStep[] = [
  {
    num: 1,
    label: 'Obligation Calendar',
    output: 'Your YA2026 deadlines: every CP204, Form C, and SST date for your entity.',
    route: '/start/obligations'
  },
  {
    num: 2,
    label: 'Cited Form C Filing',
    output: 'A cited Form C with your tax payable. Every figure traced to a source.',
    route: '/start/filing'
  },
  {
    num: 3,
    label: 'Audit Defense Pack',
    output: 'A citation-grounded defense pack. Fabricated clauses are deterministically rejected.',
    route: '/start/audit-defense'
  }
]

function stepCircle(num: number, active: boolean, done: boolean) {
  const bg = done ? 'var(--denim)' : active ? 'var(--mustard)' : 'transparent'
  const color = done || active ? 'var(--paper)' : 'var(--ink-soft)'
  const border = done || active ? 'none' : '1px solid var(--ink-soft)'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: bg,
        color,
        border,
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        fontWeight: 700,
        flexShrink: 0
      }}
    >
      {num}
    </span>
  )
}

// ---- Full map (Welcome + any standalone use) ----

interface JourneyMapProps {
  /** Current step number shown as active (1–3). Undefined = no active step (e.g. Dashboard post-completion). */
  activeStep?: 1 | 2 | 3
  /** Whether the whole journey is done (cp_journey_done set). */
  done?: boolean
}

export function JourneyMap({ activeStep, done = false }: JourneyMapProps) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 12
      }}
    >
      {JOURNEY_STEPS.map((step) => {
        const isActive = activeStep === step.num
        const isDone = done
        return (
          <div
            key={step.num}
            className="window"
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
              padding: '14px 16px',
              border: isActive ? '1px solid var(--mustard)' : isDone ? '1px solid var(--denim)' : undefined,
              opacity: !isDone && !isActive && activeStep !== undefined ? 0.7 : 1
            }}
          >
            {stepCircle(step.num, isActive, isDone)}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  marginBottom: 4
                }}
              >
                {step.label}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  color: 'var(--ink-soft)',
                  lineHeight: 1.4
                }}
              >
                {step.output}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---- Compact strip (Dashboard) ----

interface JourneyStripProps {
  done: boolean
  /** Current wizard route, to highlight the active step. */
  currentRoute?: string
}

export function JourneyStrip({ done, currentRoute }: JourneyStripProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 18px',
        borderTop: 'var(--border)',
        background: 'var(--window)',
        flexWrap: 'wrap'
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--ink-soft)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          marginRight: 4
        }}
      >
        Journey
      </span>
      {JOURNEY_STEPS.map((step, i) => {
        const isActive = currentRoute === step.route
        const isDone = done
        return (
          <div key={step.num} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && <span style={{ color: 'var(--ink-soft)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>→</span>}
            <Link
              to={isDone ? step.route.replace('/start/', '/') : step.route}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                textDecoration: 'none',
                color: isDone ? 'var(--denim)' : isActive ? 'var(--mustard)' : 'var(--ink-soft)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: isDone || isActive ? 700 : 400
              }}
            >
              {stepCircle(step.num, isActive, isDone)}
              <span>{step.label}</span>
            </Link>
          </div>
        )
      })}
      {done && (
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--denim)',
            letterSpacing: '0.05em'
          }}
        >
          COMPLETE
        </span>
      )}
    </div>
  )
}

// ---- Per-console "what next" footer card ----

interface WhatNextProps {
  /** Label for the next step ("Filing", "Audit Defense", or "Dashboard"). */
  nextLabel: string
  /** Route to navigate to. */
  nextRoute: string
  /** Short description of what the next step produces. */
  nextOutput: string
}

export function WhatNext({ nextLabel, nextRoute, nextOutput }: WhatNextProps) {
  return (
    <div
      style={{
        marginTop: 32,
        padding: '16px 20px',
        border: '1px solid var(--denim)',
        borderRadius: 'var(--radius)',
        background: 'var(--window)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap'
      }}
    >
      <div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--ink-soft)',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            marginBottom: 4
          }}
        >
          What Next
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--ink)',
            marginBottom: 2
          }}
        >
          {nextLabel}
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-soft)' }}>{nextOutput}</div>
      </div>
      <Link
        to={nextRoute}
        style={{
          display: 'inline-block',
          padding: '10px 20px',
          background: 'var(--denim)',
          color: 'var(--paper)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 700,
          textDecoration: 'none',
          borderRadius: 'var(--radius)',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}
      >
        {nextLabel} →
      </Link>
    </div>
  )
}
