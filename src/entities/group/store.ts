import { create } from 'zustand'
import { api } from '@/shared/lib/api'
import type { Group } from './types'

interface GroupStore {
  groups: Group[]
  current: Group | null
  isLoading: boolean
  fetchGroups: () => Promise<void>
  fetchGroup: (id: string) => Promise<void>
  subscribe: (groupId: string) => Promise<void>
}

export const useGroupStore = create<GroupStore>((set, get) => ({
  groups: [],
  current: null,
  isLoading: false,

  fetchGroups: async () => {
    set({ isLoading: true })
    try {
      const res = await api.get<Group[]>('/groups')
      set({ groups: res.data, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchGroup: async (id) => {
    set({ isLoading: true, current: null })
    try {
      const res = await api.get<Group>(`/groups/${id}`)
      set({ current: res.data, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  subscribe: async (groupId) => {
    await api.post(`/groups/${groupId}/subscribe`)
    const toggle = (g: Group): Group => g.id === groupId
      ? { ...g, isSubscribed: !g.isSubscribed, memberCount: g.isSubscribed ? g.memberCount - 1 : g.memberCount + 1 }
      : g
    const { current } = get()
    set((s) => ({
      groups: s.groups.map(toggle),
      current: current?.id === groupId ? toggle(current) : current,
    }))
  },
}))
