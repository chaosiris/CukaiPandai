// Shared hook — all three consoles call this to get the active entity profile.
// Replaces the divergent page-local DEMO_SSM stubs (FQ4 / [DRIFT] #3).
// FE-8: reads the active persona's TIN from PersonaContext so switching the picker
// re-renders all three consoles against the chosen entity.

import { useEffect, useState } from 'react'
import { useActivePersona } from '../PersonaContext'
import { type EntityTaxProfile, getEntity } from '../api/client'

export function useEntity(tin?: string) {
  const { persona } = useActivePersona()
  const resolvedTin = tin ?? persona.tin

  const [entity, setEntity] = useState<EntityTaxProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getEntity(resolvedTin)
      .then((e) => {
        setEntity(e)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [resolvedTin])

  return { entity, error, loading }
}
