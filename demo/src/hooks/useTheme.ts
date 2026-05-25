import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

/**
 * Subscribes to the `<html data-theme>` attribute. ThemeToggle flips
 * it, the MutationObserver fires, and every consumer re-renders with
 * the new palette in lockstep.
 */
export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    const update = () => setTheme(readTheme())
    update()
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => obs.disconnect()
  }, [])

  return theme
}
