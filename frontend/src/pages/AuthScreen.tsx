import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { LogoMark } from '../components/icons'
import './Auth.css'

const MOCK_MODE = import.meta.env.VITE_API_MOCK === '1'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const GOOGLE_LIVE = !MOCK_MODE && !!GOOGLE_CLIENT_ID // render the real GIS button only when configured

// Minimal Google Identity Services surface (only what we call).
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void }) => void
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void
        }
      }
    }
  }
}

export function AuthScreen({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp, signInWithGoogle, continueAsGuest } = useAuth()
  const isSignIn = mode === 'sign-in'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const googleBtnRef = useRef<HTMLDivElement>(null)

  const dest = (location.state as { from?: string } | null)?.from || '/dashboard'
  const go = () => navigate(dest, { replace: true })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (isSignIn) await signIn(email.trim(), password)
      else await signUp(email.trim(), password, name.trim() || undefined)
      go()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleGoogleCredential = async (credential: string) => {
    setError(null)
    setBusy(true)
    try {
      await signInWithGoogle(credential)
      go()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.')
    } finally {
      setBusy(false)
    }
  }

  // Real Google Identity Services button — only when a client ID is configured and not in mock mode.
  // biome-ignore lint/correctness/useExhaustiveDependencies: GIS button initializes once on mount
  useEffect(() => {
    if (!GOOGLE_LIVE) return
    const render = () => {
      if (!window.google || !googleBtnRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID as string,
        callback: (r) => void handleGoogleCredential(r.credential)
      })
      // Match the full width of the inputs/buttons below (GIS takes a fixed px width, clamped 200–400).
      const width = Math.min(400, Math.max(200, Math.round(googleBtnRef.current.offsetWidth) || 360))
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width,
        text: isSignIn ? 'signin_with' : 'signup_with'
      })
    }
    if (window.google) {
      render()
      return
    }
    const id = 'gis-client'
    if (document.getElementById(id)) return
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.id = id
    s.async = true
    s.defer = true
    s.onload = render
    document.body.appendChild(s)
  }, [])

  const onGuest = async () => {
    setBusy(true)
    try {
      await continueAsGuest()
    } catch {
      // best-effort — proceed even if the BE call fails
    } finally {
      setBusy(false)
    }
    // JR-3: first-run guests (no cp_journey_done) go to /welcome; returning users go to /dashboard.
    let journeyDone = false
    try {
      journeyDone = localStorage.getItem('cp_journey_done') === '1'
    } catch {
      // localStorage unavailable; default to the welcome journey
    }
    navigate(journeyDone ? '/dashboard' : '/welcome', { replace: true })
  }

  return (
    <div className="auth">
      {/* Left: denim hero panel */}
      <section className="auth-hero">
        <Link className="auth-brand" to="/" aria-label="CukaiPandai home">
          <LogoMark />
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

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <div className="auth-section">
            <span className="auth-section-label">Single sign-on</span>
            {GOOGLE_LIVE ? (
              <div ref={googleBtnRef} className="auth-google-host" />
            ) : (
              <button
                className="auth-sso"
                type="button"
                disabled={busy || (!MOCK_MODE && !GOOGLE_CLIENT_ID)}
                onClick={() => handleGoogleCredential('mock-google-credential')}
              >
                <GoogleGlyph />
                Continue with Google
                {!MOCK_MODE && !GOOGLE_CLIENT_ID && <span className="auth-coming-soon">not configured</span>}
              </button>
            )}
          </div>

          <hr className="auth-divider" />

          <form className="auth-section" onSubmit={handleSubmit}>
            <span className="auth-section-label">Email and password</span>
            {!isSignIn && (
              <label className="auth-field">
                <span>Name</span>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </label>
            )}
            <label className="auth-field">
              <span>Email</span>
              <input
                className="auth-input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="auth-field">
              <span>Password</span>
              <input
                className="auth-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignIn ? 'current-password' : 'new-password'}
                minLength={isSignIn ? undefined : 8}
                required
              />
            </label>
            {!isSignIn && <p className="auth-hint">At least 8 characters.</p>}
            <button className="auth-email" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : isSignIn ? 'Sign In with Email' : 'Sign Up with Email'}
            </button>
          </form>

          <hr className="auth-divider" />

          <div className="auth-section">
            <span className="auth-section-label">Guest access</span>
            <button className="auth-guest" type="button" onClick={onGuest} disabled={busy}>
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

function GoogleGlyph() {
  return (
    <svg className="auth-google-glyph" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18z"
      />
      <path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  )
}
