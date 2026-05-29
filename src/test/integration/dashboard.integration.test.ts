import { describe, expect, it, beforeEach } from 'vitest'
import { useDashboardStore } from '@/entities/dashboard/store'

describe('Dashboard integration', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      stats: null,
      globalFeed: [],
      feedPage: 1,
      hasMoreFeed: true,
      isLoadingStats: false,
      isLoadingFeed: false,
    })
  })

  it('loads stats from MSW backend', async () => {
    await useDashboardStore.getState().loadStats()
    const stats = useDashboardStore.getState().stats
    expect(stats).toBeTruthy()
    expect(stats?.totalSessions).toBeDefined()
    expect(stats?.totalHours).toBeDefined()
    expect(stats?.currentStreak).toBeDefined()
  })

  it('loads global feed from MSW backend', async () => {
    await useDashboardStore.getState().loadGlobalFeed()
    const feed = useDashboardStore.getState().globalFeed
    expect(feed.length).toBeGreaterThan(0)
    expect(feed[0].type).toBeDefined()
  })

  it('paginates global feed', async () => {
    await useDashboardStore.getState().loadGlobalFeed()
    const firstPage = useDashboardStore.getState().globalFeed
    expect(firstPage.length).toBeGreaterThan(0)

    await useDashboardStore.getState().loadGlobalFeed()
    const secondPage = useDashboardStore.getState().globalFeed
    expect(secondPage.length).toBeGreaterThanOrEqual(firstPage.length)
  })
})
