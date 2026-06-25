// Shared hook — all three consoles call this to get the active entity profile.
// Replaces the divergent page-local DEMO_SSM stubs (FQ4 / [DRIFT] #3).
// FE-8: reads the active persona's TIN from PersonaContext so switching the picker
// re-renders all three consoles against the chosen entity.
// JR-1: resolves a custom (non-seeded) TIN from local state BEFORE any network call
// so consoles never white-screen when a custom entity is active.

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

    // JR-1: if the TIN belongs to a custom persona, resolve from local state
    // without any network call — avoids the getEntity throw in mock + 404 in live.
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
