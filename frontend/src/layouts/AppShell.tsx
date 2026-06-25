import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useActivePersona } from '../PersonaContext'
import { LogoMark, ProfileIcon, ThemeIcon } from '../components/icons'
import { useTheme } from '../hooks/useTheme'
import { PERSONAS } from '../personas'

const isMock = import.meta.env.VITE_API_MOCK === '1'
const isDemoMode = import.meta.env.VITE_DEMO_MODE === '1'

const drawerLinkClass = ({ isActive }: { isActive: boolean }) => `drawer-link${isActive ? ' is-active' : ''}`

function DemoModeBanner() {
  if (!isDemoMode) return null
  return (
    <div
      style={{
        background: 'var(--mustard)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        textAlign: 'center',
        padding: '4px 16px',
        letterSpacing: '0.04em'
      }}
    >
      DEMO MODE: Running on Seeded Fixtures (Acme · Sinar Digital · Selera Kita)
    </div>
  )
}

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const topbarControlsRef = useRef<HTMLDivElement>(null)
  const { theme, toggleTheme } = useTheme()
  const { persona, setPersona } = useActivePersona()
  const navigate = useNavigate()

  // Close drawer on Escape
  useEffect(() => {
    if (!drawerOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [drawerOpen])

  // Close profile popover on Escape or outside click
  useEffect(() => {
    if (!profileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileOpen(false)
    }
    const onOutside = (e: PointerEvent) => {
      if (e.target instanceof Node && !topbarControlsRef.current?.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onOutside)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onOutside)
    }
  }, [profileOpen])

  const closeDrawer = () => setDrawerOpen(false)

  return (
    <>
      <div className="page-scroll">
        <DemoModeBanner />
        <header className="topbar">
          <div className="topbar-inner">
            {/* Hamburger — opens slide-in drawer */}
            <button
              className="icon-button"
              type="button"
              aria-label="Open navigation"
              aria-expanded={drawerOpen}
              aria-controls="cp-drawer"
              onClick={() => setDrawerOpen(true)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeLinecap="round" />
              </svg>
            </button>

            {/* Brand lockup */}
            <Link className="brand-lockup" to="/dashboard" aria-label="CukaiPandai dashboard">
              <LogoMark />
              <span className="topbar-wordmark">CukaiPandai</span>
            </Link>

            <span className="topbar-spacer" />

            {/* Topbar controls: MOCK chip · theme toggle · entity switcher · profile */}
            <div className="topbar-controls" ref={topbarControlsRef}>
              {isMock && (
                <span
                  className="topbar-mock-chip"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--ink-soft)',
                    padding: '3px 7px',
                    border: '1px solid var(--grid)'
                  }}
                >
                  MOCK
                </span>
              )}

              {/* Theme toggle */}
              <button
                className="icon-button topbar-control-button"
                type="button"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                aria-pressed={theme === 'dark'}
                onClick={toggleTheme}
              >
                <ThemeIcon theme={theme} />
              </button>

              {/* Entity switcher — styled select writing to the same PersonaContext */}
              <select
                className="topbar-entity-select"
                value={persona.tin}
                onChange={(e) => {
                  const next = PERSONAS.find((p) => p.tin === e.target.value)
                  if (next) setPersona(next)
                }}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  padding: '4px 8px',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                  border: '1px solid var(--grid)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  height: 34
                }}
                aria-label="Active entity"
              >
                {PERSONAS.map((p) => (
                  <option key={p.tin} value={p.tin}>
                    {p.label}
                  </option>
                ))}
              </select>

              {/* Profile */}
              <div className="topbar-control">
                <button
                  className="icon-button topbar-control-button"
                  type="button"
                  aria-label="Profile"
                  aria-expanded={profileOpen}
                  aria-controls="cp-profile-popover"
                  onClick={() => setProfileOpen((o) => !o)}
                >
                  <ProfileIcon />
                </button>
                {profileOpen && (
                  <div className="window topbar-popover" id="cp-profile-popover">
                    <div className="profile-summary">
                      <strong>{persona.label}</strong>
                      <span>{persona.tin}</span>
                    </div>
                    <button
                      className="popover-action"
                      type="button"
                      onClick={() => {
                        setProfileOpen(false)
                        navigate('/settings')
                      }}
                    >
                      Settings
                    </button>
                    <button
                      className="popover-action"
                      type="button"
                      onClick={() => {
                        setProfileOpen(false)
                        window.localStorage.removeItem('cp_entered_as_guest')
                        navigate('/')
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="app-shell">
          <Outlet />
        </main>
      </div>

      {/* Slide-in navigation drawer */}
      <div className={`drawer-layer${drawerOpen ? ' is-open' : ''}`} aria-hidden={!drawerOpen}>
        <button
          className="drawer-backdrop"
          type="button"
          aria-label="Close navigation"
          tabIndex={drawerOpen ? 0 : -1}
          onClick={closeDrawer}
        />
        <aside className="window nav-drawer" id="cp-drawer" aria-label="CukaiPandai navigation">
          <div className="drawer-head">
            <Link
              className="brand-lockup drawer-brand"
              to="/dashboard"
              aria-label="CukaiPandai dashboard"
              onClick={closeDrawer}
            >
              <LogoMark />
              <span className="drawer-wordmark">CukaiPandai</span>
            </Link>
            <button className="drawer-close" type="button" aria-label="Close navigation" onClick={closeDrawer}>
              ×
            </button>
          </div>

          <nav className="drawer-nav">
            <div className="drawer-section">
              <div className="drawer-section-title">Workspace</div>
              <NavLink className={drawerLinkClass} to="/dashboard" end onClick={closeDrawer}>
                Dashboard
              </NavLink>
            </div>

            <div className="drawer-section">
              <div className="drawer-section-title">Compliance</div>
              <NavLink className={drawerLinkClass} to="/obligations" onClick={closeDrawer}>
                Obligations
              </NavLink>
              <NavLink className={drawerLinkClass} to="/filing" onClick={closeDrawer}>
                Filing
              </NavLink>
              <NavLink className={drawerLinkClass} to="/audit-defense" onClick={closeDrawer}>
                Audit Defense
              </NavLink>
            </div>
          </nav>
        </aside>
      </div>

      {/* Fixed denim footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <LogoMark />
            <span className="footer-wordmark">CukaiPandai</span>
          </div>
          <nav className="footer-links" aria-label="CukaiPandai footer">
            <a href="https://github.com/AlaskanTuna/CukaiPandai" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </nav>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.7 }}>
            YA2026 · decision-support, not legal advice
          </div>
        </div>
      </footer>
    </>
  )
}
