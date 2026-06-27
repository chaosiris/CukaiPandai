import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import { ActivePersonaProvider } from './PersonaContext'
import { AppShell } from './layouts/AppShell'
import { MarketingShell } from './layouts/MarketingShell'
import { WizardLayout } from './layouts/WizardLayout'
import { NotificationProvider } from './notifications'
import About from './pages/About'
import Analytics from './pages/Analytics'
import AuditAssistant from './pages/AuditAssistant'
import CustomCompany from './pages/CustomCompany'
import Dashboard from './pages/Dashboard'
import Entity from './pages/Entity'
import Faq from './pages/Faq'
import FilingNew from './pages/FilingNew'
import FilingRecord from './pages/FilingRecord'
import FilingStudio from './pages/FilingStudio'
import { Landing } from './pages/Landing'
import NotFound from './pages/NotFound'
import ObligationRadar from './pages/ObligationRadar'
import { Privacy } from './pages/Privacy'
import Settings from './pages/Settings'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import Welcome from './pages/Welcome'

// Reset the window scroll to the top on every route (pathname) change. Hash-only changes
// (in-page anchors like the filing-record "On this page" links) are left untouched.
function ScrollToTop() {
  const { pathname } = useLocation()
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger, not a body dep
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <ActivePersonaProvider>
        <NotificationProvider>
          <BrowserRouter>
            <ScrollToTop />
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
                {/* FM-1: /filing = records dashboard */}
                <Route path="/filing" element={<FilingStudio />} />
                {/* FM-2: /filing/new = one-shot creation */}
                <Route path="/filing/new" element={<FilingNew />} />
                {/* FM-3: /filing/:id = saved record view */}
                <Route path="/filing/:id" element={<FilingRecord />} />
                <Route path="/audit-assistant" element={<AuditAssistant />} />
                {/* Legacy redirect: keep old /audit-defense links from 404-ing */}
                <Route path="/audit-defense" element={<Navigate to="/audit-assistant" replace />} />
                <Route path="/entity" element={<Entity />} />

                {/* Guided wizard routes (JR-2): wizard chrome wrapping the same console components */}
                <Route path="/start" element={<WizardLayout />}>
                  <Route path="obligations" element={<ObligationRadar />} />
                  {/* FM-2 creation flow in the wizard (Wave 3 repoint) */}
                  <Route path="filing/new" element={<FilingNew />} />
                  <Route path="audit-assistant" element={<AuditAssistant />} />
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
