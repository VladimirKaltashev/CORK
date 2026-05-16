import { beforeEach, describe, expect, it } from 'vitest'
import { useThemeStore } from './store'

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useThemeStore.setState({ theme: 'system' })
  })

  it('по умолчанию theme = system', () => {
    expect(useThemeStore.getState().theme).toBe('system')
  })

  it('setTheme меняет тему', () => {
    useThemeStore.getState().setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')

    useThemeStore.getState().setTheme('light')
    expect(useThemeStore.getState().theme).toBe('light')
  })

  it('persist пишет в localStorage с ключом cork_theme', () => {
    useThemeStore.getState().setTheme('dark')
    const raw = localStorage.getItem('cork_theme')
    expect(raw).toBeTruthy()
    expect(raw).toContain('"dark"')
  })
})
