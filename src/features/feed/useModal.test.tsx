import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useModal } from './useModal'
import { MemoryRouter } from 'react-router-dom'

describe('useModal', () => {
  it('returns null current when no search param', () => {
    const { result } = renderHook(() => useModal(), { wrapper: MemoryRouter })
    expect(result.current.current).toBeNull()
  })

  it('returns current modal when search param present', () => {
    const { result } = renderHook(() => useModal(), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/?modal=create']}>{children}</MemoryRouter>
      ),
    })
    expect(result.current.current).toBe('create')
  })

})
