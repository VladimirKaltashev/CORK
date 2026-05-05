import { create } from 'zustand'
import type { Achievement, AchievementStatus } from '@/shared/types'
import { api } from '@/shared/lib/api'
import { showToast } from '@/shared/lib/toast'

const storageKey = (userId: string) => `achievements-${userId}`

const readStorage = (userId: string): Achievement[] => {
  try { return JSON.parse(localStorage.getItem(storageKey(userId)) ?? '[]') } catch { return [] }
}

const writeStorage = (userId: string, items: Achievement[]) => {
  localStorage.setItem(storageKey(userId), JSON.stringify(items))
}

interface AchievementsState {
  achievements: Achievement[]
  isLoading: boolean
  loadAchievements: (userId: string) => Promise<void>
  addAchievement: (achievement: Achievement) => void
  updateAchievementStatus: (id: string, status: AchievementStatus, rejectionReason?: string) => Promise<void>
  reset: () => void
}

export const useAchievementsStore = create<AchievementsState>((set) => ({
  achievements: [],
  isLoading: false,

  loadAchievements: async (userId) => {
    const cached = readStorage(userId)
    if (cached.length > 0) {
      set({ achievements: cached })
      return
    }
    set({ isLoading: true })
    try {
      const res = await api.get<{ achievements: Achievement[] }>(`/achievements/user/${userId}`)
      const items = res.data.achievements
      set({ achievements: items })
      writeStorage(userId, items)
    } catch {
      showToast('error', 'Не удалось загрузить достижения')
    } finally {
      set({ isLoading: false })
    }
  },

  addAchievement: (achievement) => {
    set((s) => {
      const updated = [achievement, ...s.achievements]
      writeStorage(achievement.userId, updated)
      return { achievements: updated }
    })
  },

  updateAchievementStatus: async (id, status, rejectionReason) => {
    try {
      await api.patch(`/achievements/${id}/status`, { status, rejectionReason })
      set((s) => {
        const updated = s.achievements.map((a) =>
          a.id === id ? { ...a, status, rejectionReason } : a
        )
        const ach = updated.find((a) => a.id === id)
        if (ach) writeStorage(ach.userId, updated)
        return { achievements: updated }
      })
      showToast('success', status === 'verified' ? 'Достижение подтверждено' : 'Достижение отклонено')
    } catch {
      showToast('error', 'Не удалось обновить статус')
    }
  },

  reset: () => set({ achievements: [], isLoading: false }),
}))
