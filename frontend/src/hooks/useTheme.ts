import { useEffect, useState } from 'react'

const THEME_STORAGE_KEY = 'cukaipandai-theme'

export type Theme = 'light' | 'dark'

function readStoredTheme(): Theme | null {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : null
}

export function useTheme() {
  // GR-8: default to 'light' when no stored preference (do NOT follow prefers-color-scheme)
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme() ?? 'light')

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [theme])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    setTheme(nextTheme)
  }

  return { theme, toggleTheme }
}
