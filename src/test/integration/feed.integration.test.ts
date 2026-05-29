import { describe, expect, it, beforeEach } from 'vitest'
import { useFeedStore } from '@/entities/feed'

describe('Feed store integration', () => {
  beforeEach(() => {
    useFeedStore.setState({
      items: [],
      page: 0,
      hasMore: true,
      isLoading: false,
      filter: 'all',
    })
  })

  it('loads feed items from MSW backend', async () => {
    await useFeedStore.getState().fetchFeed(true)
    const items = useFeedStore.getState().items
    expect(items.length).toBeGreaterThan(0)
  })

  it('applies filter and resets pagination', async () => {
    await useFeedStore.getState().fetchFeed(true)
    const allItems = useFeedStore.getState().items
    expect(allItems.length).toBeGreaterThan(0)

    useFeedStore.getState().setFilter('achievement')
    const filteredItems = useFeedStore.getState().items
    expect(filteredItems.length).toBe(0)
    expect(useFeedStore.getState().page).toBe(0)
    expect(useFeedStore.getState().hasMore).toBe(true)
  })
})
