// Shared hook — all three consoles call this to get the active entity profile.
// EN-2: the "Custom" persona is now hydrated from the backend (PersonaContext) rather than
// localStorage, so resolving a custom TIN returns the backend-sourced profile with no
// white-screen (the data is already in context by the time consoles mount).
// "My Company" is always present in personas; when no backend profile exists it holds an
// empty placeholder SSM. Callers check isEntityIncomplete() before fetching.

import { useEffect, useState } from 'react'
import { useActivePersona } from '../PersonaContext'
import { type EntityTaxProfile, getEntity } from '../api/client'

export function useEntity(tin?: string) {
  const { persona, personas } = useActivePersona()
  const resolvedTin = tin ?? persona.tin

  const [entity, setEntity] = useState<EntityTaxProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)

    // EN-2: if the TIN is not a real Malaysian TIN (e.g. 'CUSTOM'), resolve from the personas
    // list in context — covers both a hydrated backend profile and the empty My Company placeholder.
    const isMalaysianTin = /^[A-Z][0-9]{10}$/.test(resolvedTin)
    if (!isMalaysianTin) {
      const match = personas.find((p) => p.tin === resolvedTin)
      setEntity((match?.ssm ?? null) as EntityTaxProfile | null)
      setLoading(false)
      return
    }

    // Built-in TINs go through the normal getEntity path (mock or live).
    getEntity(resolvedTin)
      .then((e) => {
        setEntity(e)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [resolvedTin, personas])

  return { entity, error, loading }
}
