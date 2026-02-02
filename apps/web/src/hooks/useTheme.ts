import { useState, useEffect, useCallback } from 'react'

type ThemePreference = 'light' | 'dark' | 'system'

const VALID_PREFERENCES = new Set<string>(['light', 'dark', 'system'])

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem('wb-theme')
    return stored && VALID_PREFERENCES.has(stored) ? (stored as ThemePreference) : 'system'
  } catch {
    return 'system'
  }
}

function computeResolved(pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'light' || pref === 'dark') return pref
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readStoredPreference)

  const [resolved, setResolved] = useState<'light' | 'dark'>(() => computeResolved(preference))

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
    try { localStorage.setItem('wb-theme', t) } catch { /* storage unavailable */ }
  }, [])

  const toggle = useCallback(() => {
    setTheme(resolved === 'dark' ? 'light' : 'dark')
  }, [resolved, setTheme])

  return { preference, resolved, setTheme, toggle }
}
