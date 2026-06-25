// Shared hook — all three consoles call this to get the active entity profile.
// EN-2: the "Custom" persona is now hydrated from the backend (PersonaContext) rather than
// localStorage, so resolving a custom TIN returns the backend-sourced profile with no
// white-screen (the data is already in context by the time consoles mount).

import { useEffect, useState } from 'react'
import { useActivePersona } from '../PersonaContext'
import { type EntityTaxProfile, getEntity } from '../api/client'

export function useEntity(tin?: string) {
  const { persona, customPersonas } = useActivePersona()
  const resolvedTin = tin ?? persona.tin

  const [entity, setEntity] = useState<EntityTaxProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)

    // EN-2: if the TIN belongs to the "Custom" persona, resolve from context (backend-sourced)
    // without any network call — avoids 404 for custom TINs and no white-screen.
    const customMatch = customPersonas.find((p) => p.tin === resolvedTin)
    if (customMatch) {
      setEntity(customMatch.ssm as EntityTaxProfile)
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
  }, [resolvedTin, customPersonas])

  return { entity, error, loading }
}
