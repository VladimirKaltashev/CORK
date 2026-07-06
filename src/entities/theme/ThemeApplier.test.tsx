import { describe, expect, it } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { ThemeApplier } from './ThemeApplier'
import { useThemeStore } from './store'

describe('ThemeApplier', () => {
  it('applies data-theme="obsidian" when theme is obsidian', async () => {
    useThemeStore.setState({ theme: 'obsidian' })
    render(<ThemeApplier />)
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('obsidian')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  it('applies data-theme="acid" when theme is acid', async () => {
    document.documentElement.removeAttribute('data-theme')
    useThemeStore.setState({ theme: 'acid' })
    render(<ThemeApplier />)
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('acid')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  it('switches data-theme from acid to obsidian', async () => {
    document.documentElement.setAttribute('data-theme', 'acid')
    document.documentElement.classList.add('dark')
    useThemeStore.setState({ theme: 'obsidian' })
    render(<ThemeApplier />)
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('obsidian')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  it('renders nothing', () => {
    const { container } = render(<ThemeApplier />)
    expect(container.firstChild).toBeNull()
  })
})