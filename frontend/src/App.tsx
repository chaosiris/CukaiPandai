import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import AuditDefense from './pages/AuditDefense'
import FilingStudio from './pages/FilingStudio'
import ObligationRadar from './pages/ObligationRadar'

const isMock = import.meta.env.VITE_API_MOCK === '1'

const navStyle = ({ isActive }: { isActive: boolean }) => ({
  fontFamily: 'var(--font-mono)',
  fontSize: 13,
  padding: '4px 10px',
  textDecoration: 'none',
  color: isActive ? 'var(--paper)' : 'var(--ink)',
  background: isActive ? 'var(--denim)' : 'transparent',
  borderRadius: 'var(--radius)'
})

export default function App() {
  return (
    <BrowserRouter>
      <div className="page-scroll">
        <nav className="topbar">
          <div className="topbar-inner">
            <span className="topbar-wordmark brand-lockup">CukaiPandai</span>
            <div className="topbar-spacer" />
            <div className="topbar-controls" style={{ gap: 4 }}>
              <NavLink to="/obligations" style={navStyle}>
                Obligations
              </NavLink>
              <NavLink to="/filing" style={navStyle}>
                Filing
              </NavLink>
              <NavLink to="/audit-defense" style={navStyle}>
                Audit
              </NavLink>
              {isMock && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--ink-soft)',
                    padding: '4px 8px',
                    border: '1px solid var(--grid)'
                  }}
                >
                  MOCK
                </span>
              )}
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Navigate to="/obligations" replace />} />
          <Route path="/obligations" element={<ObligationRadar />} />
          <Route path="/filing" element={<FilingStudio />} />
          <Route path="/audit-defense" element={<AuditDefense />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
