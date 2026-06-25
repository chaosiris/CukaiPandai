// FE-8 — Active-persona shared state. All three consoles read the active persona from here
// instead of using the ACME_* constants directly.

import { createContext, useContext, useState } from 'react'
import { DEFAULT_PERSONA, type Persona } from './personas'

interface PersonaContextValue {
  persona: Persona
  setPersona: (p: Persona) => void
}

const PersonaContext = createContext<PersonaContextValue>({
  persona: DEFAULT_PERSONA,
  setPersona: () => undefined
})

export function ActivePersonaProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersona] = useState<Persona>(DEFAULT_PERSONA)
  return <PersonaContext.Provider value={{ persona, setPersona }}>{children}</PersonaContext.Provider>
}

export function useActivePersona(): PersonaContextValue {
  return useContext(PersonaContext)
}
