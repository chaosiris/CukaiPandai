import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { type AuthUser, authGoogle, authLogin, authMe, authSignup, clearToken, getToken, setToken } from './api/client'

const GUEST_KEY = 'cp_entered_as_guest'
const USER_KEY = 'cp_user'
const MOCK_MODE = import.meta.env.VITE_API_MOCK === '1'

interface AuthState {
  user: AuthUser | null
  isAuthed: boolean
  isGuest: boolean
  ready: boolean // hydration finished — guards must wait for this to avoid a redirect flicker
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signInWithGoogle: (idToken: string) => Promise<void>
  continueAsGuest: () => void
  signOut: () => void
}

const AuthContext = createContext<AuthState | null>(null)

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function readGuest(): boolean {
  try {
    return localStorage.getItem(GUEST_KEY) === '1'
  } catch {
    return false
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isGuest, setIsGuest] = useState<boolean>(readGuest)
  const [ready, setReady] = useState(false)

  // Hydrate the session once on mount: no token → done; mock → trust localStorage; real → /auth/me.
  useEffect(() => {
    let cancelled = false
    const token = getToken()
    if (!token) {
      setReady(true)
      return
    }
    if (MOCK_MODE) {
      setUser(readStoredUser())
      setReady(true)
      return
    }
    authMe()
      .then((u) => {
        if (!cancelled) setUser(u)
      })
      .catch(() => {
        clearToken() // stale/invalid token → drop it
        try {
          localStorage.removeItem(USER_KEY)
        } catch {
          // ignore
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<AuthState>(() => {
    const persist = (res: { token: string; user: AuthUser }) => {
      setToken(res.token)
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(res.user))
        localStorage.removeItem(GUEST_KEY)
      } catch {
        // ignore
      }
      setIsGuest(false)
      setUser(res.user)
    }
    return {
      user,
      isAuthed: user !== null,
      isGuest,
      ready,
      signIn: async (email, password) => persist(await authLogin(email, password)),
      signUp: async (email, password, name) => persist(await authSignup(email, password, name)),
      signInWithGoogle: async (idToken) => persist(await authGoogle(idToken)),
      continueAsGuest: () => {
        try {
          localStorage.setItem(GUEST_KEY, '1')
        } catch {
          // ignore
        }
        setIsGuest(true)
      },
      signOut: () => {
        clearToken()
        try {
          localStorage.removeItem(USER_KEY)
          localStorage.removeItem(GUEST_KEY)
        } catch {
          // ignore
        }
        setUser(null)
        setIsGuest(false)
      }
    }
  }, [user, isGuest, ready])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
