// FE-8 — Active-persona shared state. All three consoles read the active persona from here.
// EN-2 — The "Custom" persona is now backed by GET/PUT /me/entity (backend), NOT localStorage.
// The cp_custom_entities localStorage key is removed; only theme + cp_journey_done remain local.
// Built-in seed personas (Acme / Sinar / Selera) stay selectable and are never mutated.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { type SsmProfile, getMyEntity, putMyEntity } from './api/client'
import { DEFAULT_PERSONA, EMPTY_CUSTOM_SSM, PERSONAS, type Persona } from './personas'

export const DEFAULT_PERSONA_KEY = 'cp_default_persona'

// The fixed TIN used to identify the backend-backed custom persona in the local list.
const CUSTOM_PERSONA_TIN = 'CUSTOM'

function readDefaultPersona(allPersonas: Persona[]): Persona {
  const tin = window.localStorage.getItem(DEFAULT_PERSONA_KEY)
  if (tin) {
    const found = allPersonas.find((p) => p.tin === tin)
    if (found) return found
  }
  return DEFAULT_PERSONA
}

function buildCustomPersona(ssm: SsmProfile): Persona {
  return {
    tin: CUSTOM_PERSONA_TIN,
    label: 'My Company',
    ssm,
    demoRawText: ''
  }
}

const MY_COMPANY_PLACEHOLDER: Persona = {
  tin: CUSTOM_PERSONA_TIN,
  label: 'My Company',
  ssm: EMPTY_CUSTOM_SSM,
  demoRawText: ''
}

interface PersonaContextValue {
  persona: Persona
  setPersona: (p: Persona) => void
  /** The merged list: static PERSONAS + "Custom" if a backend profile exists. */
  personas: Persona[]
  /** @deprecated use putMyEntity via the context — kept for callers that pass a Persona directly */
  customPersonas: Persona[]
  /** Save a custom entity to the backend (best-effort) and set it as the active persona. */
  addCustomPersona: (p: Persona) => void
  /**
   * Activate a custom persona from an already-persisted SSM profile (no backend PUT).
   * Used by Entity.tsx which does its own awaited PUT before calling this.
   */
  activateCustomPersona: (ssm: SsmProfile) => void
  /** Whether the backend entity hydration has settled (no white-screen guard). */
  entityReady: boolean
}

const PersonaContext = createContext<PersonaContextValue>({
  persona: DEFAULT_PERSONA,
  setPersona: () => undefined,
  personas: [...PERSONAS, MY_COMPANY_PLACEHOLDER],
  customPersonas: [],
  addCustomPersona: () => undefined,
  activateCustomPersona: () => undefined,
  entityReady: true
})

export function ActivePersonaProvider({ children }: { children: React.ReactNode }) {
  // The "Custom" persona derived from the backend (null = none saved yet).
  const [customPersona, setCustomPersona] = useState<Persona | null>(null)
  const [entityReady, setEntityReady] = useState(false)

  // On mount, best-effort fetch the user's saved entity profile.
  useEffect(() => {
    getMyEntity()
      .then((profile) => {
        setCustomPersona(buildCustomPersona(profile))
      })
      .catch(() => {
        // 404 = no profile yet; any other error = treat as none saved.
      })
      .finally(() => {
        setEntityReady(true)
      })
  }, [])

  const allPersonas = useMemo(() => [...PERSONAS, customPersona ?? MY_COMPANY_PLACEHOLDER], [customPersona])

  const [persona, setPersonaState] = useState<Persona>(() => readDefaultPersona([...PERSONAS, MY_COMPANY_PLACEHOLDER]))

  // Once the backend hydrates, switch to the real custom persona if the user had "My Company"
  // selected. If there is no backend profile, the placeholder (empty) remains active as
  // initialised above -- no switch needed.
  useEffect(() => {
    if (!entityReady) return
    const stored = window.localStorage.getItem(DEFAULT_PERSONA_KEY)
    if (stored === CUSTOM_PERSONA_TIN && customPersona) {
      setPersonaState(customPersona)
    }
  }, [entityReady, customPersona])

  const setPersona = useCallback((p: Persona) => {
    try {
      window.localStorage.setItem(DEFAULT_PERSONA_KEY, p.tin)
    } catch {
      // Silently ignore quota errors.
    }
    setPersonaState(p)
  }, [])

  // Save a custom entity to the backend and activate it.
  const addCustomPersona = useCallback(
    (p: Persona) => {
      const newPersona: Persona = {
        ...p,
        // Normalise to the stable CUSTOM_PERSONA_TIN so context tracks it consistently.
        tin: CUSTOM_PERSONA_TIN,
        label: 'My Company'
      }
      setCustomPersona(newPersona)
      setPersona(newPersona)
      // Best-effort backend write — do not block the UI.
      putMyEntity(p.ssm).catch(() => {
        // Silently ignore; entity is active locally even if the write fails.
      })
    },
    [setPersona]
  )

  // Activate a custom persona without triggering a backend PUT (used by Entity.tsx which
  // does its own awaited PUT to surface errors, then calls this to update context).
  const activateCustomPersona = useCallback(
    (ssm: SsmProfile) => {
      const newPersona = buildCustomPersona(ssm)
      setCustomPersona(newPersona)
      setPersona(newPersona)
    },
    [setPersona]
  )

  const customPersonas = useMemo(() => (customPersona ? [customPersona] : []), [customPersona])

  const value = useMemo(
    () => ({
      persona,
      setPersona,
      personas: allPersonas,
      customPersonas,
      addCustomPersona,
      activateCustomPersona,
      entityReady
    }),
    [persona, setPersona, allPersonas, customPersonas, addCustomPersona, activateCustomPersona, entityReady]
  )

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>
}

export function useActivePersona(): PersonaContextValue {
  return useContext(PersonaContext)
}
