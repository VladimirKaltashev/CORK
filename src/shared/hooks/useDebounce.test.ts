import { describe, expect, it, vi } from 'vitest'
import { useDebounce } from './useDebounce'
import { renderHook, waitFor } from '@testing-library/react'

describe('useDebounce', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300))
    expect(result.current).toBe('hello')
  })

  it('debounces value changes', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    })
    expect(result.current).toBe('a')
    rerender({ value: 'b' })
    expect(result.current).toBe('a')
    await waitFor(() => expect(result.current).toBe('b'))
  })

  it('respects custom delay', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 50), {
      initialProps: { value: 'x' },
    })
    rerender({ value: 'y' })
    expect(result.current).toBe('x')
    await waitFor(() => expect(result.current).toBe('y'), { timeout: 200 })
  })
})
