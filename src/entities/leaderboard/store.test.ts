import { describe, expect, it, beforeEach, vi } from 'vitest'
import { useLeaderboardStore } from './store'
import { api } from '@/shared/lib/api'

vi.mock('@/shared/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

describe('useLeaderboardStore', () => {
  beforeEach(() => {
    useLeaderboardStore.getState().reset()
    vi.clearAllMocks()
  })

  it('initial state', () => {
    const s = useLeaderboardStore.getState()
    expect(s.entries).toEqual([])
    expect(s.total).toBe(0)
    expect(s.currentSubject).toBe('math')
    expect(s.currentPeriod).toBe('month')
    expect(s.isLoading).toBe(false)
  })

  it('loadLeaderboard fetches entries', async () => {
    const mockData = { entries: [{ rank: 1, userId: 'u1', userName: 'A', score: 100, displayScore: '100ч', sessionsCount: 10, change: 'up' }], total: 50 }
    ;(vi.mocked(api.get)).mockResolvedValueOnce({ data: mockData })
    const store = useLeaderboardStore.getState()
    await store.loadLeaderboard()
    const s = useLeaderboardStore.getState()
    expect(s.isLoading).toBe(false)
    expect(s.entries.length).toBe(1)
    expect(s.total).toBe(50)
  })

  it('setSubject updates subject and reloads', async () => {
    const mockData = { entries: [{ rank: 1, userId: 'u1', userName: 'A', score: 100, displayScore: '100ч', sessionsCount: 10, change: 'up' }], total: 10 }
    ;(vi.mocked(api.get)).mockResolvedValueOnce({ data: mockData })
    const store = useLeaderboardStore.getState()
    await store.setSubject('physics')
    const s = useLeaderboardStore.getState()
    expect(s.currentSubject).toBe('physics')
    expect(s.entries.length).toBe(1)
  })

  it('setPeriod updates period and reloads', async () => {
    const mockData = { entries: [{ rank: 1, userId: 'u1', userName: 'A', score: 100, displayScore: '100ч', sessionsCount: 10, change: 'up' }], total: 10 }
    ;(vi.mocked(api.get)).mockResolvedValueOnce({ data: mockData })
    const store = useLeaderboardStore.getState()
    await store.setPeriod('week')
    const s = useLeaderboardStore.getState()
    expect(s.currentPeriod).toBe('week')
    expect(s.entries.length).toBe(1)
  })

  it('reset restores defaults', async () => {
    const store = useLeaderboardStore.getState()
    await store.loadLeaderboard()
    store.reset()
    const s = useLeaderboardStore.getState()
    expect(s.entries).toEqual([])
    expect(s.total).toBe(0)
    expect(s.currentSubject).toBe('math')
    expect(s.currentPeriod).toBe('month')
  })
})
