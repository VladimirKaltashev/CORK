import { create } from 'zustand'
import type { Achievement, AchievementCategory, AchievementStatus, ClaimAngle, ProofType } from '@/shared/types'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'

interface NewAchievementData {
  userId: string
  category: AchievementCategory
  title: string
  description: string
  year: number
  proofType: ProofType
  proofValue?: string
  claimAngle?: ClaimAngle
  meta: Record<string, unknown>
}

interface AchievementsState {
  achievements: Achievement[]
  isLoading: boolean
  loadAchievements: (userId: string) => Promise<void>
  addAchievement: (data: NewAchievementData) => Promise<void>
  updateAchievementStatus: (id: string, status: AchievementStatus, rejectionReason?: string) => Promise<void>
  reset: () => void
}

export const useAchievementsStore = create<AchievementsState>((set) => ({
  achievements: [],
  isLoading: false,

  loadAchievements: async (userId) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      const items: Achievement[] = (data ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        category: row.category,
        title: row.title,
        description: row.description,
        year: row.year,
        proofType: row.proof_type,
        proofValue: row.proof_value ?? undefined,
        status: row.status,
        claimAngle: row.claim_angle ?? 'king',
        rejectionReason: row.rejection_reason ?? undefined,
        meta: row.meta ?? {},
        createdAt: row.created_at,
      }))
      set({ achievements: items })
    } catch {
      showToast('error', 'Не удалось загрузить достижения')
    } finally {
      set({ isLoading: false })
    }
  },

  addAchievement: async (data) => {
    const { data: inserted, error } = await supabase
      .from('achievements')
      .insert({
        user_id: data.userId,
        category: data.category,
        title: data.title,
        description: data.description,
        year: data.year,
        proof_type: data.proofType,
        proof_value: data.proofValue ?? null,
        claim_angle: data.claimAngle ?? 'judge',
        status: 'pending',
        meta: data.meta,
      })
      .select()
      .single()
    if (error) throw error
    const achievement: Achievement = {
      id: inserted.id,
      userId: inserted.user_id,
      category: inserted.category,
      title: inserted.title,
      description: inserted.description,
      year: inserted.year,
      proofType: inserted.proof_type,
      proofValue: inserted.proof_value ?? undefined,
      status: inserted.status,
      claimAngle: inserted.claim_angle ?? 'judge',
      rejectionReason: inserted.rejection_reason ?? undefined,
      meta: inserted.meta ?? {},
      createdAt: inserted.created_at,
    }
    set((s) => ({ achievements: [achievement, ...s.achievements] }))
  },

  updateAchievementStatus: async (id, status, rejectionReason) => {
    try {
      const { error } = await supabase
        .from('achievements')
        .update({ status, rejection_reason: rejectionReason ?? null })
        .eq('id', id)
      if (error) throw error
      set((s) => ({
        achievements: s.achievements.map((a) =>
          a.id === id ? { ...a, status, rejectionReason } : a
        ),
      }))
      showToast('success', status === 'verified' ? 'Достижение подтверждено' : 'Достижение отклонено')
    } catch {
      showToast('error', 'Не удалось обновить статус')
    }
  },

  reset: () => set({ achievements: [], isLoading: false }),
}))
