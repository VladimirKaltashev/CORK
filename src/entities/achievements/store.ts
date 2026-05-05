import { create } from 'zustand'
import type { Achievement, VerifiedAchievement } from '@/shared/types'
import { api } from '@/shared/lib/api'
import { showToast } from '@/shared/lib/toast'

interface AchievementsState {
  // profile achievements (new)
  achievements: Achievement[]
  isLoading: boolean
  loadAchievements: (userId: string) => Promise<void>
  addAchievement: (achievement: Achievement) => void
  // verified achievements (legacy, kept for backward compat)
  verifiedAchievements: VerifiedAchievement[]
  isLoadingVerified: boolean
  loadUserAchievements: (userId: string) => Promise<void>
  verifyAchievement: (achievementId: string, verified: boolean) => Promise<boolean>
  reset: () => void
}

export const useAchievementsStore = create<AchievementsState>((set) => ({
  achievements: [],
  isLoading: false,
  verifiedAchievements: [],
  isLoadingVerified: false,

  loadAchievements: async (userId) => {
    set({ isLoading: true })
    try {
      const response = await api.get<{ achievements: Achievement[] }>(`/achievements/user/${userId}`)
      set({ achievements: response.data.achievements })
    } catch {
      showToast('error', 'Не удалось загрузить достижения')
    } finally {
      set({ isLoading: false })
    }
  },

  addAchievement: (achievement) => {
    set((s) => ({ achievements: [achievement, ...s.achievements] }))
  },

  loadUserAchievements: async (userId) => {
    set({ isLoadingVerified: true })
    try {
      const response = await api.get<{ achievements: VerifiedAchievement[] }>(`/user/${userId}/achievements`)
      set({ verifiedAchievements: response.data.achievements })
    } catch {
      showToast('error', 'Не удалось загрузить достижения')
    } finally {
      set({ isLoadingVerified: false })
    }
  },

  verifyAchievement: async (achievementId, verified) => {
    try {
      const response = await api.post<{ success: boolean; achievement: { id: string; verified: string } }>(
        `/api/achievements/${achievementId}/verify`,
        { verified }
      )
      if (response.data.success) {
        set((state) => ({
          verifiedAchievements: state.verifiedAchievements.map((ach) =>
            ach.id === achievementId
              ? { ...ach, verified: verified ? ('verified' as const) : ('rejected' as const) }
              : ach
          ),
        }))
        showToast('success', verified ? 'Достижение верифицировано' : 'Достижение отклонено')
        return true
      }
      return false
    } catch {
      showToast('error', 'Ошибка верификации')
      return false
    }
  },

  reset: () => set({ achievements: [], isLoading: false, verifiedAchievements: [], isLoadingVerified: false }),
}))
