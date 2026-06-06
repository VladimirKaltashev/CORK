import { describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { ThemeApplier } from './ThemeApplier'
import { useThemeStore } from './store'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('ThemeApplier', () => {
  it('applies dark class when theme is dark', async () => {
    useThemeStore.setState({ theme: 'dark' })
    render(<ThemeApplier />)
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(true))
  })

  it('applies dark class when theme is system and prefers dark', async () => {
    useThemeStore.setState({ theme: 'system' })
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    render(<ThemeApplier />)
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(true))
  })

  it('removes dark class when theme is light', async () => {
    document.documentElement.classList.add('dark')
    useThemeStore.setState({ theme: 'light' })
    render(<ThemeApplier />)
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(false))
  })

  it('applies data-theme="acid" without dark class when theme is acid', async () => {
    useThemeStore.setState({ theme: 'acid' })
    render(<ThemeApplier />)
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('acid')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  it('removes data-theme when switching from acid to light', async () => {
    document.documentElement.setAttribute('data-theme', 'acid')
    document.documentElement.classList.add('dark')
    useThemeStore.setState({ theme: 'light' })
    render(<ThemeApplier />)
    await waitFor(() => {
      expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  it('renders nothing', () => {
    const { container } = render(<ThemeApplier />)
    expect(container.firstChild).toBeNull()
  })
})
