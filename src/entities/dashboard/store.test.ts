import { describe, expect, it, beforeEach, vi } from 'vitest'
import { useDashboardStore } from './store'
import { api } from '@/shared/lib/api'

vi.mock('@/shared/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

describe('useDashboardStore', () => {
  beforeEach(() => {
    useDashboardStore.getState().reset()
    vi.clearAllMocks()
  })

  it('initial state', () => {
    const s = useDashboardStore.getState()
    expect(s.stats).toBeNull()
    expect(s.globalFeed).toEqual([])
    expect(s.feedPage).toBe(1)
    expect(s.hasMoreFeed).toBe(true)
    expect(s.isLoadingStats).toBe(false)
    expect(s.isLoadingFeed).toBe(false)
  })

  it('loadStats fetches dashboard stats', async () => {
    const mockStats = { totalSessions: 24, totalHours: 87, weekSessions: 5 }
    ;(vi.mocked(api.get)).mockResolvedValueOnce({ data: mockStats })
    const store = useDashboardStore.getState()
    await store.loadStats()
    const s = useDashboardStore.getState()
    expect(s.isLoadingStats).toBe(false)
    expect(s.stats).toEqual(mockStats)
    expect(api.get).toHaveBeenCalledWith('/dashboard/stats')
  })

  it('loadGlobalFeed fetches global feed', async () => {
    const mockFeed = { items: [{ id: '1', type: 'achievement_earned' }], hasMore: false }
    ;(vi.mocked(api.get)).mockResolvedValueOnce({ data: mockFeed })
    const store = useDashboardStore.getState()
    await store.loadGlobalFeed()
    const s = useDashboardStore.getState()
    expect(s.isLoadingFeed).toBe(false)
    expect(s.globalFeed.length).toBe(1)
    expect(s.feedPage).toBe(2)
    expect(s.hasMoreFeed).toBe(false)
  })

  it('loadGlobalFeed with reset replaces feed', async () => {
    const mockFeed = { items: [{ id: '1', type: 'achievement_earned' }], hasMore: false }
    ;(vi.mocked(api.get)).mockResolvedValue({ data: mockFeed })
    const store = useDashboardStore.getState()
    await store.loadGlobalFeed()
    await store.loadGlobalFeed(true)
    const s = useDashboardStore.getState()
    expect(s.feedPage).toBe(2)
    expect(s.globalFeed.length).toBe(1)
  })

  it('reset clears all state', async () => {
    const store = useDashboardStore.getState()
    store.reset()
    const s = useDashboardStore.getState()
    expect(s.stats).toBeNull()
    expect(s.globalFeed).toEqual([])
    expect(s.feedPage).toBe(1)
    expect(s.hasMoreFeed).toBe(true)
  })
})
