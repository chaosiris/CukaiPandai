import { DEFAULT_PERSONA_KEY, useActivePersona } from '../PersonaContext'
import { useTheme } from '../hooks/useTheme'
import { useNotifications } from '../notifications'
import { PERSONAS } from '../personas'

import './Settings.css'

const PREF_KEYS = ['cukaipandai-theme', DEFAULT_PERSONA_KEY] as const

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const { persona, setPersona } = useActivePersona()
  const { toast } = useNotifications()

  const handleDefaultPersonaChange = (tin: string) => {
    const next = PERSONAS.find((p) => p.tin === tin)
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
          <section className="settings-card" aria-labelledby="workspace-title">
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
                {PERSONAS.map((p) => (
                  <option key={p.tin} value={p.tin}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* About */}
          <section className="settings-card" aria-labelledby="about-title">
            <div className="settings-card-head">
              <h2 id="about-title">About</h2>
              <span className="settings-card-note">YA2026</span>
            </div>
            <div className="settings-about-block">
              <strong>CukaiPandai</strong>
              Sovereign, citation-grounded AI tax-assurance for Malaysian SMEs. Obligation calendar, cited Form C
              filing, and audit-defense. Every figure is traceable to a verified YA2026 source.
              <br />
              <br />
              <a href="https://github.com/AlaskanTuna/CukaiPandai" target="_blank" rel="noreferrer">
                GitHub
              </a>
              <br />
              <br />
              Decision support, not legal advice.
            </div>
          </section>

          {/* Reset */}
          <section className="settings-card settings-card--wide" aria-labelledby="reset-title">
            <div className="settings-card-head">
              <h2 id="reset-title">Reset</h2>
              <span className="settings-card-note">Preferences</span>
            </div>
            <button type="button" className="settings-reset-btn" onClick={handleReset}>
              Reset all preferences
            </button>
          </section>
        </div>
      </section>
    </>
  )
}
