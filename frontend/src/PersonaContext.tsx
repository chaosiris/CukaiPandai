// FE-8 — Active-persona shared state. All three consoles read the active persona from here
// instead of using the ACME_* constants directly.

import { createContext, useContext, useState } from 'react'
import { DEFAULT_PERSONA, PERSONAS, type Persona } from './personas'

export const DEFAULT_PERSONA_KEY = 'cp_default_persona'

function readDefaultPersona(): Persona {
  const tin = window.localStorage.getItem(DEFAULT_PERSONA_KEY)
  if (tin) {
    const found = PERSONAS.find((p) => p.tin === tin)
    if (found) return found
  }
  return DEFAULT_PERSONA
}

interface PersonaContextValue {
  persona: Persona
  setPersona: (p: Persona) => void
}

const PersonaContext = createContext<PersonaContextValue>({
  persona: DEFAULT_PERSONA,
  setPersona: () => undefined
})

export function ActivePersonaProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersona] = useState<Persona>(readDefaultPersona)
  return <PersonaContext.Provider value={{ persona, setPersona }}>{children}</PersonaContext.Provider>
}

export function useActivePersona(): PersonaContextValue {
  return useContext(PersonaContext)
}
