import { beforeEach, describe, expect, it } from 'vitest'
import { useThemeStore } from './store'

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useThemeStore.setState({ theme: 'obsidian' })
  })

  it('defaults to obsidian', () => {
    expect(useThemeStore.getState().theme).toBe('obsidian')
  })

  it('setTheme changes to acid', () => {
    useThemeStore.getState().setTheme('acid')
    expect(useThemeStore.getState().theme).toBe('acid')
  })

  it('persists to localStorage with cork_theme key', () => {
    useThemeStore.getState().setTheme('acid')
    const raw = localStorage.getItem('cork_theme')
    expect(raw).toBeTruthy()
    expect(raw).toContain('"acid"')
  })
})