import { Link, useNavigate } from 'react-router-dom'
import './Auth.css'

export function AuthScreen({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const navigate = useNavigate()
  const isSignIn = mode === 'sign-in'

  const continueAsGuest = () => {
    try {
      localStorage.setItem('cp_entered_as_guest', '1')
    } catch {
      // localStorage may be unavailable; not a blocker
    }
    // JR-3: first-run guests (no cp_journey_done) go to /welcome; returning users go to /dashboard.
    const journeyDone = (() => {
      try {
        return localStorage.getItem('cp_journey_done') === '1'
      } catch {
        return false
      }
    })()
    navigate(journeyDone ? '/dashboard' : '/welcome', { replace: true })
  }

  return (
    <div className="auth">
      {/* Left: denim hero panel */}
      <section className="auth-hero">
        <Link className="auth-brand" to="/" aria-label="CukaiPandai home">
          <img src="/logo.png" alt="CukaiPandai" className="brand-logo" />
          <span>CukaiPandai</span>
        </Link>
        <div className="auth-hero-copy">
          <h2 className="auth-hero-line">
            Sovereign, Citation-Grounded Tax Assurance for <em>Malaysian SMEs.</em>
          </h2>
          <p className="auth-script">every figure has a citation.</p>
        </div>
        <p className="auth-hero-foot">
          Obligation calendar · cited Form C filing · audit defense · ILMU nemo-super in-country inference
        </p>
      </section>

      {/* Right: form panel */}
      <section className="auth-panel">
        <div className="auth-form">
          <h1 className="auth-title">{isSignIn ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="auth-subtitle">
            {isSignIn ? 'Sign in to your CukaiPandai workspace.' : 'Start exploring CukaiPandai for YA2026.'}
          </p>

          <div className="auth-section">
            <span className="auth-section-label">Single sign-on</span>
            <button className="auth-sso" type="button" disabled aria-disabled="true">
              Continue with SSO
              <span className="auth-coming-soon">coming soon</span>
            </button>
          </div>

          <hr className="auth-divider" />

          <div className="auth-section">
            <span className="auth-section-label">Email and password</span>
            <label className="auth-field">
              <span>Email</span>
              <input
                className="auth-input"
                type="email"
                placeholder="you@company.com"
                disabled
                aria-disabled="true"
                autoComplete="email"
              />
            </label>
            <label className="auth-field">
              <span>Password</span>
              <input
                className="auth-input"
                type="password"
                placeholder="••••••••"
                disabled
                aria-disabled="true"
                autoComplete={isSignIn ? 'current-password' : 'new-password'}
              />
            </label>
            <button className="auth-email" type="button" disabled aria-disabled="true">
              {isSignIn ? 'Sign In' : 'Sign Up'} with Email
              <span className="auth-coming-soon">coming soon</span>
            </button>
          </div>

          <hr className="auth-divider" />

          <div className="auth-section">
            <span className="auth-section-label">Guest access</span>
            <button className="auth-guest" type="button" onClick={continueAsGuest}>
              Continue as Guest →
            </button>
          </div>

          <p className="auth-switch">
            {isSignIn ? (
              <>
                New here? <Link to="/sign-up">Create an account</Link>
              </>
            ) : (
              <>
                Already have an account? <Link to="/sign-in">Sign in</Link>
              </>
            )}
          </p>
        </div>
        <p className="auth-legal">
          By continuing you agree to our <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </section>
    </div>
  )
}
