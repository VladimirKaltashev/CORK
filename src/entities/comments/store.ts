import { create } from 'zustand'
import type { Comment, CommentSide } from '@/shared/types'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'

interface CommentsState {
  byAchievement: Record<string, Comment[]>
  loading: Record<string, boolean>
  loadComments: (achievementId: string) => Promise<void>
  addComment: (achievementId: string, body: string, side: CommentSide) => Promise<void>
  deleteComment: (achievementId: string, commentId: string) => Promise<void>
  getCount: (achievementId: string) => number
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  byAchievement: {},
  loading: {},

  loadComments: async (achievementId) => {
    set((s) => ({ loading: { ...s.loading, [achievementId]: true } }))
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles:user_id(name, avatar)')
        .eq('achievement_id', achievementId)
        .order('created_at', { ascending: true })
      if (error) throw error

      const comments: Comment[] = (data ?? []).map((row) => ({
        id: row.id,
        achievementId: row.achievement_id,
        userId: row.user_id,
        userName: row.profiles?.name ?? 'Пользователь',
        userAvatar: row.profiles?.avatar ?? null,
        body: row.body,
        side: row.side,
        createdAt: row.created_at,
        updatedAt: row.updated_at ?? undefined,
      }))

      set((s) => ({
        byAchievement: { ...s.byAchievement, [achievementId]: comments },
        loading: { ...s.loading, [achievementId]: false },
      }))
    } catch {
      showToast('error', 'Не удалось загрузить комментарии')
      set((s) => ({ loading: { ...s.loading, [achievementId]: false } }))
    }
  },

  addComment: async (achievementId, body, side) => {
    const trimmed = body.trim()
    if (trimmed.length < 1) {
      showToast('error', 'Комментарий не может быть пустым')
      return
    }
    if (trimmed.length > 500) {
      showToast('error', 'Максимум 500 символов')
      return
    }
    try {
      const { data: inserted, error } = await supabase
        .from('comments')
        .insert({ achievement_id: achievementId, body: trimmed, side })
        .select('*, profiles:user_id(name, avatar)')
        .single()
      if (error) throw error

      const comment: Comment = {
        id: inserted.id,
        achievementId: inserted.achievement_id,
        userId: inserted.user_id,
        userName: inserted.profiles?.name ?? 'Пользователь',
        userAvatar: inserted.profiles?.avatar ?? null,
        body: inserted.body,
        side: inserted.side,
        createdAt: inserted.created_at,
        updatedAt: inserted.updated_at ?? undefined,
      }

      set((s) => ({
        byAchievement: {
          ...s.byAchievement,
          [achievementId]: [...(s.byAchievement[achievementId] ?? []), comment],
        },
      }))
    } catch {
      showToast('error', 'Не удалось добавить комментарий')
    }
  },

  deleteComment: async (achievementId, commentId) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
      if (error) throw error

      set((s) => ({
        byAchievement: {
          ...s.byAchievement,
          [achievementId]: (s.byAchievement[achievementId] ?? []).filter((c) => c.id !== commentId),
        },
      }))
    } catch {
      showToast('error', 'Не удалось удалить комментарий')
    }
  },

  getCount: (achievementId) => {
    return get().byAchievement[achievementId]?.length ?? 0
  },
}))
