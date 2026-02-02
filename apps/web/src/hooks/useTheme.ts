import { useState, useEffect, useCallback } from 'react'

type ThemePreference = 'light' | 'dark' | 'system'

const VALID_PREFERENCES = new Set<string>(['light', 'dark', 'system'])

function readStoredPreference(): ThemePreference {
  const stored = localStorage.getItem('wb-theme')
  return stored && VALID_PREFERENCES.has(stored) ? (stored as ThemePreference) : 'system'
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readStoredPreference)

  const [resolved, setResolved] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = () => {
      const isDark =
        preference === 'dark' || (preference === 'system' && mq.matches)
      root.classList.toggle('dark', isDark)
      setResolved(isDark ? 'dark' : 'light')
    }

    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [preference])

  const setTheme = useCallback((t: ThemePreference) => {
    setPreference(t)
    localStorage.setItem('wb-theme', t)
  }, [])

  const toggle = useCallback(() => {
    setTheme(resolved === 'dark' ? 'light' : 'dark')
  }, [resolved, setTheme])

  return { preference, resolved, setTheme, toggle }
}
