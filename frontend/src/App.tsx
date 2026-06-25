import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ActivePersonaProvider } from './PersonaContext'
import { AppShell } from './layouts/AppShell'
import AuditDefense from './pages/AuditDefense'
import Dashboard from './pages/Dashboard'
import FilingStudio from './pages/FilingStudio'
import NotFound from './pages/NotFound'
import ObligationRadar from './pages/ObligationRadar'

export default function App() {
  return (
    <ActivePersonaProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
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
