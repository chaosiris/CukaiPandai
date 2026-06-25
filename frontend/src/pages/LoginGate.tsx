import { Link, useNavigate } from 'react-router-dom'
import { LogoMark } from '../components/icons'
import './LoginGate.css'

export function LoginGate() {
  const navigate = useNavigate()

  const continueAsGuest = () => {
    try {
      localStorage.setItem('cp_entered_as_guest', '1')
    } catch {
      // localStorage may be unavailable; not a blocker
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="lg">
      {/* Left: denim hero panel */}
      <section className="lg-hero">
        <Link className="lg-brand" to="/" aria-label="CukaiPandai home">
          <LogoMark />
          <span>CukaiPandai</span>
        </Link>
        <div className="lg-hero-copy">
          <h2 className="lg-hero-line">
            Sovereign, Citation-Grounded Tax Assurance for <em>Malaysian SMEs.</em>
          </h2>
          <p className="lg-script">every figure has a citation.</p>
        </div>
        <p className="lg-hero-foot">
          Obligation calendar · cited Form C filing · audit defense · ILMU nemo-super in-country inference
        </p>
      </section>

      {/* Right: form/guest panel */}
      <section className="lg-panel">
        <div className="lg-form">
          <h1 className="lg-title">Welcome</h1>
          <p className="lg-subtitle">Start exploring CukaiPandai for YA2026.</p>

          <div className="lg-section">
            <span className="lg-section-label">Single sign-on</span>
            <button className="lg-sso" type="button" disabled aria-disabled="true">
              Continue with SSO
              <span className="lg-coming-soon">coming soon</span>
            </button>
          </div>

          <hr className="lg-divider" />

          <div className="lg-section">
            <span className="lg-section-label">Email and password</span>
            <label className="lg-field">
              <span>Email</span>
              <input
                className="lg-input"
                type="email"
                placeholder="you@company.com"
                disabled
                aria-disabled="true"
                autoComplete="email"
              />
            </label>
            <label className="lg-field">
              <span>Password</span>
              <input
                className="lg-input"
                type="password"
                placeholder="••••••••"
                disabled
                aria-disabled="true"
                autoComplete="current-password"
              />
            </label>
            <button className="lg-email" type="button" disabled aria-disabled="true">
              Sign In with Email
              <span className="lg-coming-soon">coming soon</span>
            </button>
          </div>

          <hr className="lg-divider" />

          <div className="lg-section">
            <span className="lg-section-label">Guest access</span>
            <button className="lg-guest" type="button" onClick={continueAsGuest}>
              Continue as Guest →
            </button>
          </div>

          <p className="lg-legal">YA2026 · decision-support, not legal advice.</p>
        </div>
      </section>
    </div>
  )
}
