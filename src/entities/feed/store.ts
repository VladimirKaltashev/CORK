import { create } from 'zustand'
import { api } from '@/shared/lib/api'
import type { FeedItem, Comment, FilterType } from './types'

interface PaginatedFeed {
  data: FeedItem[]
  hasMore: boolean
}

interface FeedStore {
  items: FeedItem[]
  page: number
  hasMore: boolean
  isLoading: boolean
  filter: FilterType
  setFilter: (filter: FilterType) => void
  fetchFeed: (reset?: boolean) => Promise<void>
  addItem: (item: FeedItem) => void
  optimisticLike: (postId: string, userId: string) => void
  revertLike: (postId: string, prevLikes: string[]) => void
  addComment: (postId: string, comment: Comment) => void
}

export const useFeedStore = create<FeedStore>((set, get) => ({
  items: [],
  page: 0,
  hasMore: true,
  isLoading: false,
  filter: 'all',

  setFilter: (filter) => {
    set({ filter, items: [], page: 0, hasMore: true })
  },

  fetchFeed: async (reset = false) => {
    const { page, filter, items } = get()
    const nextPage = reset ? 1 : page + 1
    set({ isLoading: true })
    try {
      const res = await api.get<PaginatedFeed>(
        `/feed?page=${nextPage}&limit=10&filter=${filter}`,
      )
      set({
        items: reset ? res.data.data : [...items, ...res.data.data],
        page: nextPage,
        hasMore: res.data.hasMore,
        isLoading: false,
      })
    } catch {
      set({ isLoading: false })
    }
  },

  addItem: (item) => set((s) => ({ items: [item, ...s.items] })),

  optimisticLike: (postId, userId) =>
    set((s) => ({
      items: s.items.map((item) => {
        if (item.type !== 'post' || item.id !== postId) return item
        const liked = item.data.likes.includes(userId)
        return {
          ...item,
          data: {
            ...item.data,
            likes: liked
              ? item.data.likes.filter((id) => id !== userId)
              : [...item.data.likes, userId],
          },
        }
      }),
    })),

  revertLike: (postId, prevLikes) =>
    set((s) => ({
      items: s.items.map((item) => {
        if (item.type !== 'post' || item.id !== postId) return item
        return { ...item, data: { ...item.data, likes: prevLikes } }
      }),
    })),

  addComment: (postId, comment) =>
    set((s) => ({
      items: s.items.map((item) => {
        if (item.type !== 'post' || item.id !== postId) return item
        return {
          ...item,
          data: { ...item.data, comments: [...item.data.comments, comment] },
        }
      }),
    })),
}))
