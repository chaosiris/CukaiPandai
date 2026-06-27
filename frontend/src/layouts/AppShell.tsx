import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useActivePersona } from '../PersonaContext'
import { type SsmProfile, getObligations } from '../api/client'
import { BellIcon, ProfileIcon, ThemeIcon } from '../components/icons'
import { useTheme } from '../hooks/useTheme'
import { type NotifKind, useNotifications } from '../notifications'

// GR-4: routes where the ? walkthrough button is visible (Workspace + Compliance only)
const WALKTHROUGH_ROUTES = [
  '/dashboard',
  '/analytics',
  '/obligations',
  '/filing',
  '/audit-defense',
  '/audit-assistant',
  '/entity'
]

function isWalkthroughRoute(pathname: string): boolean {
  return WALKTHROUGH_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))
}

// ---- Walkthrough modal ----

function WalkthroughModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function handleYes() {
    try {
      window.localStorage.removeItem('cp_journey_done')
    } catch {
      // ignore
    }
    onClose()
    navigate('/welcome')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          border: 0,
          background: 'rgba(18, 17, 15, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          cursor: 'pointer'
        }}
      />
      {/* Modal */}
      <dialog
        open
        className="window"
        aria-labelledby="walkthrough-title"
        style={{
          position: 'relative',
          zIndex: 1,
          width: 'min(400px, calc(100vw - 32px))',
          border: 'var(--border)',
          padding: 0,
          background: 'var(--window)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)'
        }}
      >
        <div className="titlebar">
          <span className="closebox" aria-hidden="true" />
          <span className="titlebar-title" id="walkthrough-title">
            Need A Walkthrough?
          </span>
        </div>
        <div style={{ padding: '20px 18px 16px', display: 'grid', gap: 16 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6, color: 'var(--ink-soft)' }}>
            Want the guided tour of CukaiPandai? It walks you through your deadlines, a cited Form C, and an
            audit-defense pack.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleYes}
              style={{
                flex: 1,
                padding: '10px 16px',
                border: 'var(--border)',
                background: 'var(--denim)',
                color: 'var(--paper)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              Yes, Show Me
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 16px',
                border: 'var(--border)',
                background: 'transparent',
                color: 'var(--ink)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              No Thanks
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}

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
  const [walkthroughOpen, setWalkthroughOpen] = useState(false)
  const topbarControlsRef = useRef<HTMLDivElement>(null)
  const { theme, toggleTheme } = useTheme()
  const { persona } = useActivePersona()
  const { user, isGuest, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
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

  const closeDrawer = () => {
    setDrawerOpen(false)
  }

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
            {/* Hamburger — manual open/toggle (also pins so hover-close doesn't fight) */}
            <button
              className="icon-button"
              type="button"
              aria-label="Open navigation"
              aria-expanded={drawerOpen}
              aria-controls="cp-drawer"
              onClick={() => {
                setDrawerOpen(true)
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeLinecap="round" />
              </svg>
            </button>

            {/* Brand lockup — routes to landing page */}
            <Link className="brand-lockup" to="/" aria-label="CukaiPandai home">
              <img src="/logo.png" alt="CukaiPandai" className="brand-logo" />
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
                      <strong>{user ? user.name || user.email : isGuest ? 'Guest' : persona.label}</strong>
                      <span>{user ? user.email : persona.tin}</span>
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
                        signOut()
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

      {/* Left-edge hover zone — desktop only (pointer:fine). Opens drawer on hover-in; */}
      {/* drawer closes via the existing click-outside/backdrop (NOT on cursor-leave). */}
      <div
        aria-hidden="true"
        className="drawer-hotzone"
        onMouseEnter={() => {
          if (!drawerOpen) setDrawerOpen(true)
        }}
      />

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
            <Link className="brand-lockup drawer-brand" to="/" aria-label="CukaiPandai home" onClick={closeDrawer}>
              <img src="/logo.png" alt="CukaiPandai" className="brand-logo" />
              <span className="drawer-wordmark">CukaiPandai</span>
            </Link>
          </div>

          <nav className="drawer-nav">
            <div className="drawer-section">
              <div className="drawer-section-title">Workspace</div>
              <NavLink className={drawerLinkClass} to="/dashboard" end onClick={closeDrawer}>
                Dashboard
              </NavLink>
              <NavLink className={drawerLinkClass} to="/analytics" onClick={closeDrawer}>
                Analytics
              </NavLink>
            </div>

            <div className="drawer-section">
              <div className="drawer-section-title">Compliance</div>
              <NavLink className={drawerLinkClass} to="/entity" onClick={closeDrawer}>
                Entity
              </NavLink>
              <NavLink className={drawerLinkClass} to="/obligations" onClick={closeDrawer}>
                Obligations
              </NavLink>
              <NavLink className={drawerLinkClass} to="/filing" onClick={closeDrawer}>
                Filing
              </NavLink>
              <NavLink className={drawerLinkClass} to="/audit-assistant" onClick={closeDrawer}>
                Audit Assistant
              </NavLink>
            </div>

            <div className="drawer-section">
              <div className="drawer-section-title">Essentials</div>
              <NavLink className={drawerLinkClass} to="/settings" onClick={closeDrawer}>
                Settings
              </NavLink>
              <NavLink className={drawerLinkClass} to="/faq" onClick={closeDrawer}>
                FAQ
              </NavLink>
              <NavLink className={drawerLinkClass} to="/about" onClick={closeDrawer}>
                About
              </NavLink>
            </div>
          </nav>
        </aside>
      </div>

      {/* Floating help button — GR-4: visible only on Workspace + Compliance pages */}
      {isWalkthroughRoute(location.pathname) && (
        <button
          type="button"
          aria-label="Open walkthrough"
          onClick={() => setWalkthroughOpen(true)}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 90,
            width: 44,
            height: 44,
            border: 'var(--border)',
            borderRadius: '50%',
            background: 'var(--denim)',
            color: 'var(--paper)',
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            lineHeight: 1,
            cursor: 'pointer',
            boxShadow: '2px 2px 0 rgba(28, 27, 25, 0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ?
        </button>
      )}

      {/* Walkthrough modal */}
      {walkthroughOpen && <WalkthroughModal onClose={() => setWalkthroughOpen(false)} />}

      {/* Fixed denim footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/logo.png" alt="CukaiPandai" className="brand-logo" />
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
