import { describe, expect, it, beforeEach, vi } from 'vitest'
import { useFeedStore } from './store'
import { api } from '@/shared/lib/api'

vi.mock('@/shared/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

describe('useFeedStore', () => {
  beforeEach(() => {
    useFeedStore.setState({ items: [], page: 0, hasMore: true, isLoading: false, filter: 'all' })
    vi.clearAllMocks()
  })

  it('initial state', () => {
    const s = useFeedStore.getState()
    expect(s.items).toEqual([])
    expect(s.page).toBe(0)
    expect(s.hasMore).toBe(true)
    expect(s.isLoading).toBe(false)
    expect(s.filter).toBe('all')
  })

  it('setFilter resets items and page', () => {
    useFeedStore.setState({ items: [{ id: '1', type: 'post', data: {} as never }], page: 2 })
    useFeedStore.getState().setFilter('sessions')
    const s = useFeedStore.getState()
    expect(s.filter).toBe('sessions')
    expect(s.items).toEqual([])
    expect(s.page).toBe(0)
    expect(s.hasMore).toBe(true)
  })

  it('fetchFeed loads items', async () => {
    const mockData = { data: [{ id: '1', type: 'post', data: { content: 'test', likes: [], comments: [] } }], hasMore: true }
    ;(api.get as any).mockResolvedValueOnce({ data: mockData })
    const store = useFeedStore.getState()
    await store.fetchFeed()
    const s = useFeedStore.getState()
    expect(s.isLoading).toBe(false)
    expect(s.page).toBe(1)
    expect(s.items.length).toBe(1)
  })

  it('addItem prepends item', () => {
    const item = { id: 'new', type: 'post' as const, data: { content: 'hello', likes: [], comments: [] } }
    useFeedStore.getState().addItem(item as never)
    expect(useFeedStore.getState().items[0].id).toBe('new')
  })

  it('optimisticLike toggles like', () => {
    const post = {
      id: 'p1',
      type: 'post' as const,
      data: { content: 'test', likes: ['u1'], comments: [] },
    }
    useFeedStore.setState({ items: [post as never] })
    useFeedStore.getState().optimisticLike('p1', 'u2')
    let item = useFeedStore.getState().items[0] as typeof post
    expect(item.data.likes).toContain('u2')
    useFeedStore.getState().optimisticLike('p1', 'u1')
    item = useFeedStore.getState().items[0] as typeof post
    expect(item.data.likes).not.toContain('u1')
  })

  it('revertLike restores previous likes', () => {
    const post = {
      id: 'p1',
      type: 'post' as const,
      data: { content: 'test', likes: ['u1', 'u2'], comments: [] },
    }
    useFeedStore.setState({ items: [post as never] })
    useFeedStore.getState().revertLike('p1', ['u1'])
    const item = useFeedStore.getState().items[0] as typeof post
    expect(item.data.likes).toEqual(['u1'])
  })

  it('addComment adds comment to post', () => {
    const post = {
      id: 'p1',
      type: 'post' as const,
      data: { content: 'test', likes: [], comments: [] },
    }
    useFeedStore.setState({ items: [post as never] })
    const comment = { id: 'c1', text: 'nice', createdAt: '2024-01-01', userId: 'u1', userName: 'A' }
    useFeedStore.getState().addComment('p1', comment as never)
    const item = useFeedStore.getState().items[0] as typeof post
    expect(item.data.comments.length).toBe(1)
    expect(item.data.comments[0].text).toBe('nice')
  })
})
