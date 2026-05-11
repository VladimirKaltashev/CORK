import { create } from 'zustand'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'

export type FriendStatus = 'pending' | 'accepted'

export interface FriendRecord {
  id: string
  userId: string
  friendId: string
  status: FriendStatus
  createdAt: string
  profile: { id: string; name: string; avatar: string | null }
}

interface FriendsState {
  currentUserId: string | null
  outgoing: FriendRecord[]
  incoming: FriendRecord[]
  isLoading: boolean
  loadFriendships: (myId: string) => Promise<void>
  sendRequest: (targetId: string) => Promise<void>
  acceptRequest: (recordId: string) => Promise<void>
  removeRecord: (recordId: string) => Promise<void>
  getRelationship: (targetId: string) => { record: FriendRecord; direction: 'outgoing' | 'incoming' } | null
  acceptedFriendIds: () => string[]
  pendingIncomingCount: () => number
}

export const useFriendsStore = create<FriendsState>()((set, get) => ({
  currentUserId: null,
  outgoing: [],
  incoming: [],
  isLoading: false,

  loadFriendships: async (myId) => {
    set({ isLoading: true, currentUserId: myId })
    try {
      const { data: records, error } = await supabase
        .from('friends')
        .select('*')
        .or(`user_id.eq.${myId},friend_id.eq.${myId}`)

      if (error) throw error

      const otherIds = [
        ...new Set(
          (records ?? []).map((r) => (r.user_id === myId ? r.friend_id : r.user_id))
        ),
      ]

      let profileMap: Record<string, { id: string; name: string; avatar: string | null }> = {}

      if (otherIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar')
          .in('id', otherIds)

        profileMap = Object.fromEntries(
          (profiles ?? []).map((p) => [p.id, { id: p.id, name: p.name, avatar: p.avatar ?? null }])
        )
      }

      const outgoing: FriendRecord[] = []
      const incoming: FriendRecord[] = []

      for (const r of records ?? []) {
        const otherId = r.user_id === myId ? r.friend_id : r.user_id
        const record: FriendRecord = {
          id: r.id,
          userId: r.user_id,
          friendId: r.friend_id,
          status: r.status,
          createdAt: r.created_at,
          profile: profileMap[otherId] ?? { id: otherId, name: 'Пользователь', avatar: null },
        }
        if (r.user_id === myId) outgoing.push(record)
        else incoming.push(record)
      }

      set({ outgoing, incoming })
    } catch {
      showToast('error', 'Не удалось загрузить список друзей')
    } finally {
      set({ isLoading: false })
    }
  },

  sendRequest: async (targetId) => {
    const myId = get().currentUserId
    if (!myId) return
    try {
      const { error } = await supabase
        .from('friends')
        .insert({ user_id: myId, friend_id: targetId, status: 'pending' })
      if (error) throw error
      await get().loadFriendships(myId)
    } catch {
      showToast('error', 'Не удалось отправить запрос')
      throw new Error('Не удалось отправить запрос')
    }
  },

  acceptRequest: async (recordId) => {
    const myId = get().currentUserId
    if (!myId) return
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', recordId)
      if (error) throw error
      await get().loadFriendships(myId)
      showToast('success', 'Заявка принята')
    } catch {
      showToast('error', 'Не удалось принять заявку')
    }
  },

  removeRecord: async (recordId) => {
    const myId = get().currentUserId
    if (!myId) return
    try {
      const { error } = await supabase.from('friends').delete().eq('id', recordId)
      if (error) throw error
      await get().loadFriendships(myId)
    } catch {
      showToast('error', 'Не удалось выполнить операцию')
    }
  },

  getRelationship: (targetId) => {
    const out = get().outgoing.find((r) => r.friendId === targetId)
    if (out) return { record: out, direction: 'outgoing' }
    const inc = get().incoming.find((r) => r.userId === targetId)
    if (inc) return { record: inc, direction: 'incoming' }
    return null
  },

  acceptedFriendIds: () => {
    const myId = get().currentUserId
    if (!myId) return []
    return [
      ...get().outgoing.filter((r) => r.status === 'accepted').map((r) => r.friendId),
      ...get().incoming.filter((r) => r.status === 'accepted').map((r) => r.userId),
    ]
  },

  pendingIncomingCount: () => get().incoming.filter((r) => r.status === 'pending').length,
}))
