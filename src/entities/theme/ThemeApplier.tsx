import { useEffect } from 'react'
import { useThemeStore } from './store'

export function ThemeApplier() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement

    root.setAttribute('data-theme', theme)
    root.classList.remove('dark')
  }, [theme])

  return null
}