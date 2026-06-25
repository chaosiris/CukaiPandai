import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ActivePersonaProvider } from './PersonaContext'
import { AppShell } from './layouts/AppShell'
import { MarketingShell } from './layouts/MarketingShell'
import AuditDefense from './pages/AuditDefense'
import Dashboard from './pages/Dashboard'
import FilingStudio from './pages/FilingStudio'
import { Landing } from './pages/Landing'
import NotFound from './pages/NotFound'
import ObligationRadar from './pages/ObligationRadar'
import { Privacy } from './pages/Privacy'
import Settings from './pages/Settings'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'

export default function App() {
  return (
    <ActivePersonaProvider>
      <BrowserRouter>
        <Routes>
          {/* Public marketing routes */}
          <Route element={<MarketingShell />}>
            <Route index element={<Landing />} />
            <Route path="/privacy" element={<Privacy />} />
          </Route>

          {/* Auth routes — standalone full-screen, no MarketingShell wrapper */}
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />

          {/* Legacy redirect — keep old /login links from 404-ing */}
          <Route path="/login" element={<Navigate to="/sign-in" replace />} />

          {/* App routes (under AppShell) */}
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/obligations" element={<ObligationRadar />} />
            <Route path="/filing" element={<FilingStudio />} />
            <Route path="/audit-defense" element={<AuditDefense />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ActivePersonaProvider>
  )
}
