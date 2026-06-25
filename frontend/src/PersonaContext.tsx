// FE-8 — Active-persona shared state. All three consoles read the active persona from here
// instead of using the ACME_* constants directly.
// JR-1 — Extended to own a runtime list of custom personas, persisted to localStorage.
// Custom personas are appended to the static PERSONAS import and exposed as a merged list.

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { DEFAULT_PERSONA, PERSONAS, type Persona } from './personas'

export const DEFAULT_PERSONA_KEY = 'cp_default_persona'
const CUSTOM_ENTITIES_KEY = 'cp_custom_entities'
const ACTIVE_PERSONA_KEY = 'cp_active_persona'

function readCustomPersonas(): Persona[] {
  try {
    const raw = window.localStorage.getItem(CUSTOM_ENTITIES_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Persona[]
  } catch {
    return []
  }
}

function readDefaultPersona(allPersonas: Persona[]): Persona {
  const tin = window.localStorage.getItem(DEFAULT_PERSONA_KEY)
  if (tin) {
    const found = allPersonas.find((p) => p.tin === tin)
    if (found) return found
  }
  return DEFAULT_PERSONA
}

function readActivePersona(allPersonas: Persona[], fallback: Persona): Persona {
  const tin = window.localStorage.getItem(ACTIVE_PERSONA_KEY)
  if (tin) {
    const found = allPersonas.find((p) => p.tin === tin)
    if (found) return found
  }
  return fallback
}

interface PersonaContextValue {
  persona: Persona
  setPersona: (p: Persona) => void
  /** The merged list: static PERSONAS + runtime custom personas. */
  personas: Persona[]
  /** Custom personas only (for custom-TIN resolution in useEntity). */
  customPersonas: Persona[]
  /** Append a new custom persona, persist to localStorage, and set it active. */
  addCustomPersona: (p: Persona) => void
}

const PersonaContext = createContext<PersonaContextValue>({
  persona: DEFAULT_PERSONA,
  setPersona: () => undefined,
  personas: PERSONAS,
  customPersonas: [],
  addCustomPersona: () => undefined
})

export function ActivePersonaProvider({ children }: { children: React.ReactNode }) {
  const [customPersonas, setCustomPersonas] = useState<Persona[]>(readCustomPersonas)

  const allPersonas = useMemo(() => [...PERSONAS, ...customPersonas], [customPersonas])

  const [persona, setPersonaState] = useState<Persona>(() => {
    const defaultP = readDefaultPersona(allPersonas)
    return readActivePersona(allPersonas, defaultP)
  })

  const setPersona = useCallback((p: Persona) => {
    try {
      window.localStorage.setItem(ACTIVE_PERSONA_KEY, p.tin)
    } catch {
      // Silently ignore quota errors.
    }
    setPersonaState(p)
  }, [])

  const addCustomPersona = useCallback(
    (p: Persona) => {
      setCustomPersonas((prev) => {
        // Replace existing entry with the same TIN (upsert), or append.
        const next = prev.some((c) => c.tin === p.tin) ? prev.map((c) => (c.tin === p.tin ? p : c)) : [...prev, p]
        try {
          window.localStorage.setItem(CUSTOM_ENTITIES_KEY, JSON.stringify(next))
        } catch {
          // Silently ignore quota errors.
        }
        return next
      })
      setPersona(p)
    },
    [setPersona]
  )

  const value = useMemo(
    () => ({ persona, setPersona, personas: allPersonas, customPersonas, addCustomPersona }),
    [persona, setPersona, allPersonas, customPersonas, addCustomPersona]
  )

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>
}

export function useActivePersona(): PersonaContextValue {
  return useContext(PersonaContext)
}
