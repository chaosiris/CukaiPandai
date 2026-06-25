import { useEffect, useState } from 'react'

const THEME_STORAGE_KEY = 'cukaipandai-theme'

export type Theme = 'light' | 'dark'

function readStoredTheme(): Theme | null {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : null
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme() ?? systemTheme())
  const [hasStoredTheme, setHasStoredTheme] = useState(() => readStoredTheme() !== null)

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [theme])

  useEffect(() => {
    if (hasStoredTheme) return

    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const updateSystemTheme = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light')
    }

    query.addEventListener('change', updateSystemTheme)

    return () => {
      query.removeEventListener('change', updateSystemTheme)
    }
  }, [hasStoredTheme])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    setHasStoredTheme(true)
    setTheme(nextTheme)
  }

  return { theme, toggleTheme }
}
