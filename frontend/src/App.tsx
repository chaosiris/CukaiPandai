import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ActivePersonaProvider } from './PersonaContext'
import { AppShell } from './layouts/AppShell'
import { MarketingShell } from './layouts/MarketingShell'
import AuditDefense from './pages/AuditDefense'
import Dashboard from './pages/Dashboard'
import FilingStudio from './pages/FilingStudio'
import { Landing } from './pages/Landing'
import { LoginGate } from './pages/LoginGate'
import NotFound from './pages/NotFound'
import ObligationRadar from './pages/ObligationRadar'

export default function App() {
  return (
    <ActivePersonaProvider>
      <BrowserRouter>
        <Routes>
          {/* Public marketing routes (no AppShell) */}
          <Route element={<MarketingShell />}>
            <Route index element={<Landing />} />
            <Route path="/login" element={<LoginGate />} />
          </Route>

          {/* App routes (under AppShell) */}
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/obligations" element={<ObligationRadar />} />
            <Route path="/filing" element={<FilingStudio />} />
            <Route path="/audit-defense" element={<AuditDefense />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ActivePersonaProvider>
  )
}
