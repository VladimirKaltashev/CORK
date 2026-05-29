import { describe, expect, it, beforeEach, vi } from 'vitest'
import { useStatusStore } from './store'
import { api } from '@/shared/lib/api'

vi.mock('@/shared/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

describe('useStatusStore', () => {
  beforeEach(() => {
    useStatusStore.setState({ status: { status: 'online' } })
    vi.clearAllMocks()
  })

  it('initial state', () => {
    expect(useStatusStore.getState().status).toEqual({ status: 'online' })
  })

  it('setStatus updates status', () => {
    useStatusStore.getState().setStatus({ status: 'offline' })
    expect(useStatusStore.getState().status).toEqual({ status: 'offline' })
  })

  it('fetchStatus loads status from server', async () => {
    const mockStatus = { status: 'studying', subject: 'math', task: 'problems' }
    ;(vi.mocked(api.get)).mockResolvedValueOnce({ data: mockStatus })
    await useStatusStore.getState().fetchStatus('1')
    const s = useStatusStore.getState()
    expect(s.status).toEqual(mockStatus)
  })
})
