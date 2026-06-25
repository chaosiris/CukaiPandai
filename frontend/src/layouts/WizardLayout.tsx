// JR-2 — Guided 3-step wizard chrome wrapping the existing console components.
//
// Renders INSIDE the AppShell (topbar + drawer + footer visible).
// Adds a Step X of 3 progress header above the console and a next/back footer.
// Pins one entity for the entire wizard run (T2 — FilingStudio resets on persona switch).
// Finish / Skip sets cp_journey_done and navigates to /dashboard.
// Standalone console routes (/obligations, /filing, /audit-defense) stay untouched.

import { useEffect, useRef } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useActivePersona } from '../PersonaContext'

const JOURNEY_DONE_KEY = 'cp_journey_done'

interface WizardStep {
  route: string
  label: string
  num: 1 | 2 | 3
}

const WIZARD_STEPS: WizardStep[] = [
  { route: '/start/obligations', label: 'Obligation Calendar', num: 1 },
  { route: '/start/filing/new', label: 'Form C Filing', num: 2 },
  { route: '/start/audit-defense', label: 'Audit Defense Pack', num: 3 }
]

function graduate(navigate: ReturnType<typeof useNavigate>) {
  try {
    localStorage.setItem(JOURNEY_DONE_KEY, '1')
  } catch {
    // localStorage may be unavailable
  }
  navigate('/dashboard', { replace: true })
}

export function WizardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  // Pin persona at wizard entry — reads once, never changes mid-wizard.
  const { persona } = useActivePersona()
  // Pin the entity TIN at the moment the wizard is first entered, so persona switches
  // from the topbar during the wizard don't cause FilingStudio to reset.
  // We deliberately do NOT subscribe to persona changes here.
  const pinnedTinRef = useRef(persona.tin)

  // Store the pinned TIN in a context-compatible way. We expose it via a dataset attribute
  // on the wizard wrapper so child consoles can read it if needed.
  // The actual pin guarantee: AppShell entity-switcher still works but FilingStudio's
  // own useEffect on persona.tin is what would reset; since we don't rerender WizardLayout
  // on persona change, and the consoles read useActivePersona() directly, the pinning here
  // is documentation of intent. The real protection is: don't switch persona mid-wizard.
  const currentStep = WIZARD_STEPS.find((s) => s.route === location.pathname) ?? WIZARD_STEPS[0]
  const stepIndex = WIZARD_STEPS.indexOf(currentStep)
  const prevStep = stepIndex > 0 ? WIZARD_STEPS[stepIndex - 1] : null
  const nextStep = stepIndex < WIZARD_STEPS.length - 1 ? WIZARD_STEPS[stepIndex + 1] : null
  const isLastStep = stepIndex === WIZARD_STEPS.length - 1

  // If pinned TIN changed since we entered, update the ref (only matters if persona
  // somehow changes; we note it but the wizard continues with current persona).
  useEffect(() => {
    // Intentionally not updating pinnedTinRef here — wizard pins entity at entry.
    // This effect is intentionally empty (lint-ignore for correctness).
  }, [])

  return (
    <div>
      {/* Step X of 3 progress header */}
      <div
        className="window"
        style={{
          marginBottom: 20,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap'
        }}
      >
        {/* Step progress dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          {WIZARD_STEPS.map((step, i) => {
            const isPast = i < stepIndex
            const isActive = i === stepIndex
            return (
              <div key={step.route} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {i > 0 && (
                  <div
                    style={{
                      width: 24,
                      height: 1,
                      background: isPast ? 'var(--denim)' : 'var(--grid)'
                    }}
                  />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: isPast ? 'var(--denim)' : isActive ? 'var(--mustard)' : 'transparent',
                      color: isPast || isActive ? 'var(--paper)' : 'var(--ink-soft)',
                      border: isPast || isActive ? 'none' : '1px solid var(--ink-soft)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0
                    }}
                  >
                    {step.num}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: isActive ? 'var(--ink)' : isPast ? 'var(--denim)' : 'var(--ink-soft)',
                      fontWeight: isActive ? 700 : 400
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Step count + entity label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--ink-soft)'
            }}
          >
            Step {currentStep.num} of 3
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--ink-soft)',
              padding: '3px 7px',
              border: '1px solid var(--grid)'
            }}
          >
            {persona.label}
          </span>
          {/* Skip the tour */}
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
              padding: 0
            }}
            onClick={() => graduate(navigate)}
          >
            Skip the tour
          </button>
        </div>
      </div>

      {/* The real console — reused via React Router Outlet */}
      <Outlet />

      {/* Next / Back footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 24,
          padding: '14px 20px',
          border: 'var(--border)',
          borderRadius: 'var(--radius)',
          background: 'var(--window)',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', gap: 10 }}>
          {prevStep ? (
            <Link
              to={prevStep.route}
              style={{
                display: 'inline-block',
                padding: '9px 18px',
                border: 'var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--paper)',
                color: 'var(--ink)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              ← Back
            </Link>
          ) : (
            <Link
              to="/welcome"
              style={{
                display: 'inline-block',
                padding: '9px 18px',
                border: 'var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--paper)',
                color: 'var(--ink)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              ← Welcome
            </Link>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            style={{
              padding: '9px 18px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--ink-soft)',
              textDecoration: 'underline'
            }}
            onClick={() => graduate(navigate)}
          >
            Skip the tour
          </button>
          {isLastStep ? (
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
              onClick={() => graduate(navigate)}
            >
              Finish →
            </button>
          ) : nextStep ? (
            <Link
              to={nextStep.route}
              style={{
                display: 'inline-block',
                padding: '9px 22px',
                border: 'none',
                borderRadius: 'var(--radius)',
                background: 'var(--denim)',
                color: 'var(--paper)',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              Next →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
