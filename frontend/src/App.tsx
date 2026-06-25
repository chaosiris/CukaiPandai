import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { ActivePersonaProvider, useActivePersona } from './PersonaContext'
import AuditDefense from './pages/AuditDefense'
import FilingStudio from './pages/FilingStudio'
import ObligationRadar from './pages/ObligationRadar'
import { PERSONAS } from './personas'

const isMock = import.meta.env.VITE_API_MOCK === '1'
const isDemoMode = import.meta.env.VITE_DEMO_MODE === '1'

const navStyle = ({ isActive }: { isActive: boolean }) => ({
  fontFamily: 'var(--font-mono)',
  fontSize: 13,
  padding: '4px 10px',
  textDecoration: 'none',
  color: isActive ? 'var(--paper)' : 'var(--ink)',
  background: isActive ? 'var(--denim)' : 'transparent',
  borderRadius: 'var(--radius)'
})

function PersonaPicker() {
  const { persona, setPersona } = useActivePersona()
  return (
    <select
      value={persona.tin}
      onChange={(e) => {
        const next = PERSONAS.find((p) => p.tin === e.target.value)
        if (next) setPersona(next)
      }}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        padding: '3px 8px',
        background: 'var(--screen)',
        color: 'var(--ink)',
        border: '1px solid var(--grid)',
        borderRadius: 'var(--radius)',
        cursor: 'pointer'
      }}
      aria-label="Active entity"
    >
      {PERSONAS.map((p) => (
        <option key={p.tin} value={p.tin}>
          {p.label}
        </option>
      ))}
    </select>
  )
}

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
      DEMO MODE — running on seeded fixtures (Acme · Sinar Digital · Selera Kita)
    </div>
  )
}

export default function App() {
  return (
    <ActivePersonaProvider>
      <BrowserRouter>
        <div className="page-scroll">
          <DemoModeBanner />
          <nav className="topbar">
            <div className="topbar-inner">
              <span className="topbar-wordmark brand-lockup">CukaiPandai</span>
              <div className="topbar-spacer" />
              <div className="topbar-controls" style={{ gap: 4 }}>
                <PersonaPicker />
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
    </ActivePersonaProvider>
  )
}
