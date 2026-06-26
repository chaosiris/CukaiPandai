import { DEFAULT_PERSONA_KEY, useActivePersona } from '../PersonaContext'
import { useTheme } from '../hooks/useTheme'
import { useNotifications } from '../notifications'

import './Settings.css'

// GR-9: only these UI-pref keys are local — business data lives on the backend
const UI_PREF_KEYS = ['cukaipandai-theme', 'cp_journey_done'] as const

const PREF_KEYS = ['cukaipandai-theme', DEFAULT_PERSONA_KEY] as const

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const { persona, setPersona, personas } = useActivePersona()
  const { toast } = useNotifications()

  const handleDefaultPersonaChange = (tin: string) => {
    const next = personas.find((p) => p.tin === tin)
    if (!next) return
    window.localStorage.setItem(DEFAULT_PERSONA_KEY, tin)
    setPersona(next)
    toast({ title: 'Default Entity Updated', body: `Default entity set to ${next.label}.`, kind: 'info' })
  }

  const handleReset = () => {
    for (const key of PREF_KEYS) {
      window.localStorage.removeItem(key)
    }
    window.location.reload()
  }

  // GR-9: non-destructive — clears ONLY local UI prefs (theme + onboarding flag).
  // Does NOT call any backend delete endpoint; saved company/filings data is preserved.
  const handleResetAllData = () => {
    const confirmed = window.confirm(
      'This resets your onboarding progress and interface preferences. Your saved company and filings are not affected. Continue?'
    )
    if (!confirmed) return
    for (const key of UI_PREF_KEYS) {
      window.localStorage.removeItem(key)
    }
    window.location.href = '/welcome'
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Settings</h1>
          <div className="page-kicker">Workspace Preferences</div>
        </div>
      </header>

      <section className="window settings-window" aria-labelledby="settings-title">
        <div className="titlebar">
          <span className="closebox" aria-hidden="true" />
          <span className="titlebar-title" id="settings-title">
            Settings
          </span>
          <span className="titlebar-meta">preferences</span>
        </div>

        <div className="settings-body">
          {/* Appearance */}
          <section className="settings-card settings-card--wide" aria-labelledby="appearance-title">
            <div className="settings-card-head">
              <h2 id="appearance-title">Appearance</h2>
              <span className="settings-card-note">Interface</span>
            </div>
            <div className="settings-toggle">
              <span className="settings-toggle-text">
                <strong>Dark theme</strong>
                <span>Switch between light and dark (applies instantly, persists across reloads)</span>
              </span>
              <label className="settings-switch">
                <input aria-label="Dark theme" type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
                <span className="settings-switch-box" aria-hidden="true" />
              </label>
            </div>
          </section>

          {/* Workspace */}
          <section className="settings-card settings-card--wide" aria-labelledby="workspace-title">
            <div className="settings-card-head">
              <h2 id="workspace-title">Workspace</h2>
              <span className="settings-card-note">Entity</span>
            </div>
            <div className="settings-field">
              <label className="settings-label" htmlFor="default-entity">
                Default entity
              </label>
              <select
                className="settings-select"
                id="default-entity"
                value={persona.tin}
                onChange={(e) => handleDefaultPersonaChange(e.currentTarget.value)}
              >
                {personas.map((p) => (
                  <option key={p.tin} value={p.tin}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Reset */}
          <section className="settings-card settings-card--wide" aria-labelledby="reset-title">
            <div className="settings-card-head">
              <h2 id="reset-title">Reset</h2>
              <span className="settings-card-note">Danger Zone</span>
            </div>
            <div className="settings-reset-row">
              <div className="settings-reset-desc">
                <strong>Reset all preferences</strong>
                <span>Clears theme and default entity selection. Reloads the page.</span>
              </div>
              <button type="button" className="settings-reset-btn settings-reset-btn--full" onClick={handleReset}>
                Reset all preferences
              </button>
            </div>
            <div className="settings-reset-row">
              <div className="settings-reset-desc">
                <strong>Reset all data</strong>
                <span>
                  Resets onboarding and preferences only. Your saved company and filings remain intact (shared on the
                  guest account).
                </span>
              </div>
              <button
                type="button"
                className="settings-reset-btn settings-reset-btn--full"
                onClick={handleResetAllData}
              >
                Reset all data
              </button>
            </div>
          </section>
        </div>
      </section>
    </>
  )
}
