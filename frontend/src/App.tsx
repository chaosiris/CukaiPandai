import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import { ActivePersonaProvider } from './PersonaContext'
import { AppShell } from './layouts/AppShell'
import { MarketingShell } from './layouts/MarketingShell'
import { WizardLayout } from './layouts/WizardLayout'
import { NotificationProvider } from './notifications'
import About from './pages/About'
import Analytics from './pages/Analytics'
import AuditDefense from './pages/AuditDefense'
import CustomCompany from './pages/CustomCompany'
import Dashboard from './pages/Dashboard'
import Faq from './pages/Faq'
import FilingStudio from './pages/FilingStudio'
import { Landing } from './pages/Landing'
import NotFound from './pages/NotFound'
import ObligationRadar from './pages/ObligationRadar'
import { Privacy } from './pages/Privacy'
import Settings from './pages/Settings'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import Welcome from './pages/Welcome'

export default function App() {
  return (
    <AuthProvider>
      <ActivePersonaProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              {/* Public marketing routes */}
              <Route element={<MarketingShell />}>
                <Route index element={<Landing />} />
                <Route path="/privacy" element={<Privacy />} />
              </Route>

              {/* Auth routes: standalone full-screen, no MarketingShell wrapper */}
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />

              {/* Legacy redirect: keep old /login links from 404-ing */}
              <Route path="/login" element={<Navigate to="/sign-in" replace />} />

              {/* App routes (under AppShell) */}
              <Route element={<AppShell />}>
                {/* First-run welcome (JR-3) */}
                <Route path="/welcome" element={<Welcome />} />

                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/faq" element={<Faq />} />

                {/* Standalone console routes: always reachable for returning users */}
                <Route path="/obligations" element={<ObligationRadar />} />
                <Route path="/filing" element={<FilingStudio />} />
                <Route path="/audit-defense" element={<AuditDefense />} />

                {/* Guided wizard routes (JR-2): wizard chrome wrapping the same console components */}
                <Route path="/start" element={<WizardLayout />}>
                  <Route path="obligations" element={<ObligationRadar />} />
                  <Route path="filing" element={<FilingStudio />} />
                  <Route path="audit-defense" element={<AuditDefense />} />
                </Route>

                {/* JR-6: "Use my own company" form (outside WizardLayout; standalone page) */}
                <Route path="/start/custom" element={<CustomCompany />} />

                <Route path="/settings" element={<Settings />} />
                <Route path="/about" element={<About />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </ActivePersonaProvider>
    </AuthProvider>
  )
}
