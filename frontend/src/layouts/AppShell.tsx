import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useActivePersona } from '../PersonaContext'
import { type SsmProfile, getObligations } from '../api/client'
import { BellIcon, LogoMark, ProfileIcon, ThemeIcon } from '../components/icons'
import { useTheme } from '../hooks/useTheme'
import { type NotifKind, useNotifications } from '../notifications'
import { PERSONAS } from '../personas'

const isMock = import.meta.env.VITE_API_MOCK === '1'
const isDemoMode = import.meta.env.VITE_DEMO_MODE === '1'

const drawerLinkClass = ({ isActive }: { isActive: boolean }) => `drawer-link${isActive ? ' is-active' : ''}`

type TopbarPopover = 'notifications' | 'profile' | null

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

function relativeTime(ts: number): string {
  const seconds = Math.round((Date.now() - ts) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.round(minutes / 60)}h ago`
}

function kindDotColor(kind: NotifKind): string {
  if (kind === 'error') return 'var(--rust)'
  if (kind === 'warning') return 'var(--mustard)'
  if (kind === 'success') return 'var(--mustard)'
  return 'var(--denim)'
}

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activePopover, setActivePopover] = useState<TopbarPopover>(null)
  const topbarControlsRef = useRef<HTMLDivElement>(null)
  const { theme, toggleTheme } = useTheme()
  const { persona, setPersona } = useActivePersona()
  const navigate = useNavigate()
  const { notifications, unreadCount, markAllRead, dismiss, seedDeadlines, notify } = useNotifications()

  // Track previous persona TIN to detect genuine switches (not initial mount)
  const prevTinRef = useRef<string | null>(null)
  // Track whether we've seeded for the current TIN
  const seededTinRef = useRef<string | null>(null)

  // Seed deadline notifications when entity changes
  useEffect(() => {
    const tin = persona.tin
    const ssm: SsmProfile = persona.ssm

    // Fire persona-switch toast when TIN actually changes (not on mount)
    if (prevTinRef.current !== null && prevTinRef.current !== tin) {
      notify({ title: 'Entity Switched', body: `Now viewing ${persona.label}`, kind: 'info' })
      // Clear seeded keys so the new persona's deadlines are fresh
      ;(seedDeadlines as unknown as { _clearSeeds?: () => void })._clearSeeds?.()
      seededTinRef.current = null
    }
    prevTinRef.current = tin

    // Only seed once per TIN
    if (seededTinRef.current === tin) return
    seededTinRef.current = tin

    getObligations(tin, ssm)
      .then((cal) => {
        seedDeadlines(cal.obligations)
      })
      .catch(() => {
        // Silently ignore — don't spam toasts for network errors
      })
  }, [persona.tin, persona.label, persona.ssm, seedDeadlines, notify])

  // Close drawer on Escape
  useEffect(() => {
    if (!drawerOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [drawerOpen])

  // Close active popover on Escape or outside click
  useEffect(() => {
    if (!activePopover) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePopover(null)
    }
    const onOutside = (e: PointerEvent) => {
      if (e.target instanceof Node && !topbarControlsRef.current?.contains(e.target)) {
        setActivePopover(null)
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onOutside)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onOutside)
    }
  }, [activePopover])

  const closeDrawer = () => setDrawerOpen(false)

  function toggleNotifications() {
    setActivePopover((prev) => {
      const next = prev === 'notifications' ? null : 'notifications'
      if (next === 'notifications') {
        // Mark all read when the dropover opens
        markAllRead()
      }
      return next
    })
  }

  function toggleProfile() {
    setActivePopover((prev) => (prev === 'profile' ? null : 'profile'))
  }

  return (
    <>
      <div className="page-scroll">
        <DemoModeBanner />
        <header className="topbar">
          <div className="topbar-inner">
            {/* Hamburger */}
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

            {/* Topbar controls */}
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

              {/* Entity switcher */}
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

              {/* Bell notifications */}
              <div className="topbar-control">
                <button
                  className="icon-button topbar-control-button"
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={activePopover === 'notifications'}
                  aria-controls="cp-notifications-popover"
                  onClick={toggleNotifications}
                  style={{ position: 'relative' }}
                >
                  <BellIcon />
                  {unreadCount > 0 && <span className="topbar-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>

                {activePopover === 'notifications' && (
                  <div className="window topbar-popover" id="cp-notifications-popover">
                    <div className="popover-title">
                      <span>Notifications</span>
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          className="popover-clear"
                          onClick={() => {
                            for (const n of notifications) dismiss(n.id)
                          }}
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div className="popover-empty">No notifications.</div>
                    ) : (
                      <div style={{ display: 'grid', gap: 0, maxHeight: 320, overflowY: 'auto' }}>
                        {notifications.map((n) => (
                          <div key={n.id} className="popover-item" style={{ opacity: n.read ? 0.6 : 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span
                                className="notif-kind-dot"
                                style={{ background: kindDotColor(n.kind) }}
                                aria-hidden="true"
                              />
                              <strong>{n.title}</strong>
                            </div>
                            {n.body && <span className="popover-detail">{n.body}</span>}
                            <span className="popover-time">{relativeTime(n.ts)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="topbar-control">
                <button
                  className="icon-button topbar-control-button"
                  type="button"
                  aria-label="Profile"
                  aria-expanded={activePopover === 'profile'}
                  aria-controls="cp-profile-popover"
                  onClick={toggleProfile}
                >
                  <ProfileIcon />
                </button>
                {activePopover === 'profile' && (
                  <div className="window topbar-popover" id="cp-profile-popover">
                    <div className="profile-summary">
                      <strong>{persona.label}</strong>
                      <span>{persona.tin}</span>
                    </div>
                    <button
                      className="popover-action"
                      type="button"
                      onClick={() => {
                        setActivePopover(null)
                        navigate('/settings')
                      }}
                    >
                      Settings
                    </button>
                    <button
                      className="popover-action"
                      type="button"
                      onClick={() => {
                        setActivePopover(null)
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
              x
            </button>
          </div>

          <nav className="drawer-nav">
            <div className="drawer-section">
              <div className="drawer-section-title">Workspace</div>
              <NavLink className={drawerLinkClass} to="/dashboard" end onClick={closeDrawer}>
                Dashboard
              </NavLink>
              <NavLink className={drawerLinkClass} to="/faq" onClick={closeDrawer}>
                FAQ
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
