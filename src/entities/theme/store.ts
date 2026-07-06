import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { resolveTheme, DEFAULT_THEME } from './registry'
import type { Theme } from './registry'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const migrateTheme = (stored: unknown): Theme => {
  if (typeof stored !== 'string') return DEFAULT_THEME
  return resolveTheme(stored)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'cork_theme',
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0 || version === undefined) {
          const state = persistedState as { theme?: unknown } | undefined
          return { theme: migrateTheme(state?.theme) }
        }
        return persistedState as ThemeState
      },
      version: 1,
    },
  ),
)

export type { Theme } from './registry'