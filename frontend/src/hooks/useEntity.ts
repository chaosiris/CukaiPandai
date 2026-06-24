// Shared hook — all three consoles call this to get the active entity profile.
// Replaces the divergent page-local DEMO_SSM stubs (FQ4 / [DRIFT] #3).
// The canonical demo TIN is ACME_TIN from client.ts; the profile is fetched via getEntity
// so mock and live modes agree on the seeded Acme values.

import { useEffect, useState } from 'react'
import { ACME_TIN, type EntityTaxProfile, getEntity } from '../api/client'

export function useEntity(tin: string = ACME_TIN) {
  const [entity, setEntity] = useState<EntityTaxProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getEntity(tin)
      .then((e) => {
        setEntity(e)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [tin])

  return { entity, error, loading }
}
