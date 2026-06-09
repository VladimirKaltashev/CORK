import { create } from 'zustand'
import type { Comment, CommentSide } from '@/shared/types'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/entities/auth'

interface CommentsState {
  byAchievement: Record<string, Comment[]>
  counts: Record<string, number>
  loading: Record<string, boolean>
  loadComments: (achievementId: string) => Promise<void>
  loadCounts: (achievementIds: string[]) => Promise<void>
  addComment: (achievementId: string, body: string, side: CommentSide) => Promise<void>
  deleteComment: (achievementId: string, commentId: string) => Promise<void>
  getCount: (achievementId: string) => number
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  byAchievement: {},
  counts: {},
  loading: {},

  loadComments: async (achievementId) => {
    set((s) => ({ loading: { ...s.loading, [achievementId]: true } }))
    try {
      // 1. Load comments without join (simpler, avoids join syntax issues)
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('achievement_id', achievementId)
        .order('created_at', { ascending: true })
      if (commentsError) {
        console.error('[comments] loadComments query error:', commentsError)
        throw commentsError
      }

      // 2. Load profiles for comment authors separately
      const userIds = [...new Set((commentsData ?? []).map((r) => r.user_id))]
      let profileMap: Record<string, { name: string; avatar: string | null }> = {}
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, avatar')
          .in('id', userIds)
        if (profilesError) {
          console.error('[comments] loadComments profiles query error:', profilesError)
          // Don't throw — we can still show comments without names
        }
        profileMap = Object.fromEntries(
          (profilesData ?? []).map((p) => [p.id, { name: p.name, avatar: p.avatar ?? null }])
        )
      }

      const comments: Comment[] = (commentsData ?? []).map((row) => ({
        id: row.id,
        achievementId: row.achievement_id,
        userId: row.user_id,
        userName: profileMap[row.user_id]?.name ?? 'Пользователь',
        userAvatar: profileMap[row.user_id]?.avatar ?? null,
        body: row.body,
        side: row.side,
        createdAt: row.created_at,
        updatedAt: row.updated_at ?? undefined,
      }))

      set((s) => ({
        byAchievement: { ...s.byAchievement, [achievementId]: comments },
        loading: { ...s.loading, [achievementId]: false },
      }))
    } catch (err) {
      console.error('[comments] loadComments catch:', err)
      showToast('error', 'Не удалось загрузить аргументы')
      set((s) => ({ loading: { ...s.loading, [achievementId]: false } }))
    }
  },

  loadCounts: async (achievementIds) => {
    if (achievementIds.length === 0) return
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('achievement_id')
        .in('achievement_id', achievementIds)
      if (error) {
        console.error('[comments] loadCounts error:', error)
        return
      }
      const counts: Record<string, number> = {}
      for (const row of data ?? []) {
        const id = row.achievement_id as string
        counts[id] = (counts[id] ?? 0) + 1
      }
      set((s) => ({ counts: { ...s.counts, ...counts } }))
    } catch (err) {
      console.error('[comments] loadCounts catch:', err)
    }
  },

  addComment: async (achievementId, body, side) => {
    const trimmed = body.trim()
    if (trimmed.length < 1) {
      showToast('error', 'Аргумент не может быть пустым')
      return
    }
    if (trimmed.length > 500) {
      showToast('error', 'Максимум 500 символов')
      return
    }

    const user = useAuthStore.getState().user
    if (!user) {
      console.error('[comments] addComment: no authenticated user')
      showToast('error', 'Войдите, чтобы комментировать')
      return
    }

    try {
      // Verify profile exists before insert (RLS requires user_id = auth.uid())
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      if (profileError || !profileData) {
        console.error('[comments] addComment: profile not found for user', user.id, profileError)
        showToast('error', 'Профиль не найден. Выполните вход после сброса БД.')
        return
      }

      const { data: inserted, error } = await supabase
        .from('comments')
        .insert({
          achievement_id: achievementId,
          user_id: user.id,
          body: trimmed,
          side,
        })
        .select('*')
        .single()
      if (error) {
        console.error('[comments] addComment insert error:', error)
        throw error
      }

      const comment: Comment = {
        id: inserted.id,
        achievementId: inserted.achievement_id,
        userId: inserted.user_id,
        userName: user.name,
        userAvatar: null, // We don't have avatar in auth store; will load on next refresh
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
        counts: {
          ...s.counts,
          [achievementId]: (s.counts[achievementId] ?? 0) + 1,
        },
      }))
    } catch (err) {
      console.error('[comments] addComment catch:', err)
      showToast('error', 'Не удалось добавить аргумент')
    }
  },

  deleteComment: async (achievementId, commentId) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
      if (error) {
        console.error('[comments] deleteComment error:', error)
        throw error
      }

      set((s) => ({
        byAchievement: {
          ...s.byAchievement,
          [achievementId]: (s.byAchievement[achievementId] ?? []).filter((c) => c.id !== commentId),
        },
        counts: {
          ...s.counts,
          [achievementId]: Math.max(0, (s.counts[achievementId] ?? 0) - 1),
        },
      }))
    } catch (err) {
      console.error('[comments] deleteComment catch:', err)
      showToast('error', 'Не удалось удалить аргумент')
    }
  },

  getCount: (achievementId) => {
    return get().counts[achievementId] ?? get().byAchievement[achievementId]?.length ?? 0
  },
}))
