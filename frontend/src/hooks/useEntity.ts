// Shared hook — all three consoles call this to get the active entity profile.
// EN-2: the "Custom" persona is now hydrated from the backend (PersonaContext) rather than
// localStorage, so resolving a custom TIN returns the backend-sourced profile with no
// white-screen (the data is already in context by the time consoles mount).
// "My Company" is always present in personas; when no backend profile exists it holds an
// empty placeholder SSM. Callers check isEntityIncomplete() before fetching.

import { useEffect, useState } from 'react'
import { useActivePersona } from '../PersonaContext'
import { type EntityTaxProfile, getEntity } from '../api/client'
import { validateTin } from '../lib/tin'

export function useEntity(tin?: string) {
  const { persona, personas } = useActivePersona()
  const resolvedTin = tin ?? persona.tin

  const [entity, setEntity] = useState<EntityTaxProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)

    // Prefer the in-context personas list — it always holds the active persona (a seeded persona OR a
    // hydrated custom company, or the empty My Company placeholder). This is the source of truth for
    // the active entity and avoids misrouting a valid TIN to a null lookup (FE-6).
    const match = personas.find((p) => p.tin === resolvedTin)
    if (match) {
      setEntity((match.ssm ?? null) as EntityTaxProfile | null)
      setLoading(false)
      return
    }

    // Not in context: fetch by TIN only when it is a valid Malaysian TIN (canonical lib/tin.ts
    // grammar — 1-2 letter prefix + 8-12 digits); a non-TIN sentinel resolves to null.
    if (validateTin(resolvedTin) !== null) {
      setEntity(null)
      setLoading(false)
      return
    }
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
