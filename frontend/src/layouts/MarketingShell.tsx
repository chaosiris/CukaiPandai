import { Link, Outlet } from 'react-router-dom'
import { ThemeIcon } from '../components/icons'
import { useTheme } from '../hooks/useTheme'
import './MarketingShell.css'

export function MarketingShell() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="marketing-shell">
      <div className="marketing-page">
        <header className="marketing-topbar">
          <div className="marketing-topbar-inner">
            <Link className="brand-lockup marketing-brand" to="/" aria-label="CukaiPandai home">
              <img src="/logo.png" alt="CukaiPandai" className="brand-logo" />
              <span className="topbar-wordmark">CukaiPandai</span>
            </Link>
            <div className="marketing-actions">
              <button
                className="icon-button marketing-theme-toggle"
                type="button"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                aria-pressed={theme === 'dark'}
                onClick={toggleTheme}
              >
                <ThemeIcon theme={theme} />
              </button>
              <Link className="marketing-cta" to="/sign-in">
                Get Started
              </Link>
            </div>
          </div>
        </header>

        <main className="marketing-main">
          <Outlet />
        </main>
      </div>

      <footer className="marketing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/logo.png" alt="CukaiPandai" className="brand-logo" />
            <span className="footer-wordmark">CukaiPandai</span>
          </div>
          <nav className="footer-links" aria-label="CukaiPandai footer">
            <a href="https://github.com/AlaskanTuna/CukaiPandai" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <Link to="/privacy">Privacy</Link>
          </nav>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.7 }}>
            YA2026 · decision-support, not legal advice
          </div>
        </div>
      </footer>
    </div>
  )
}
