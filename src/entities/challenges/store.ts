import { create } from 'zustand'
import type { Challenge, ChallengeSubmission, ChallengeBadge, ChallengeStatus, ProofConfig } from '@/shared/types'
import { api } from '@/shared/lib/api'
import { showToast } from '@/shared/lib/toast'

interface LeaderboardRow {
  userId: string
  userName: string
  userAvatar?: string
  totalProgress: number
  submissionCount: number
}

interface ChallengesState {
  challenges: Challenge[]
  activeChallenge: Challenge | null
  currentChallenge: Challenge | null
  submissions: ChallengeSubmission[]
  leaderboard: LeaderboardRow[]
  myBadges: ChallengeBadge[]
  isLoading: boolean
  error: string | null

  // User actions
  loadChallenges: () => Promise<void>
  loadActiveChallenge: () => Promise<void>
  loadChallenge: (id: string) => Promise<void>
  loadSubmissions: (challengeId: string) => Promise<void>
  loadLeaderboard: (challengeId: string) => Promise<void>
  submitProgress: (challengeId: string, data: {
    proofType: string
    proofValue: string
    value?: number
    description: string
  }) => Promise<void>

  // Admin actions
  createChallenge: (data: {
    title: string
    description: string
    category: string | null
    goalType: string
    unit: string | null
    proofConfig: ProofConfig
    startsAt: string
    endsAt: string
  }) => Promise<void>
  updateChallengeStatus: (id: string, status: ChallengeStatus) => Promise<void>
  deleteSubmission: (id: string) => Promise<void>
  loadAllSubmissions: (challengeId: string) => Promise<void>

  reset: () => void
}

export const useChallengesStore = create<ChallengesState>((set, get) => ({
  challenges: [],
  activeChallenge: null,
  currentChallenge: null,
  submissions: [],
  leaderboard: [],
  myBadges: [],
  isLoading: false,
  error: null,

  loadChallenges: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get<{ challenges: Challenge[] }>('/challenges')
      set({ challenges: response.data.challenges })
    } catch {
      showToast('error', 'Не удалось загрузить челленджи')
    } finally {
      set({ isLoading: false })
    }
  },

  loadActiveChallenge: async () => {
    try {
      const response = await api.get<{ challenge: Challenge | null }>('/challenges/active')
      set({ activeChallenge: response.data.challenge })
    } catch {
      // No active challenge is fine
      set({ activeChallenge: null })
    }
  },

  loadChallenge: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get<{ challenge: Challenge }>(`/challenges/${id}`)
      set({ currentChallenge: response.data.challenge })
    } catch {
      showToast('error', 'Не удалось загрузить челлендж')
      set({ error: 'Не удалось загрузить челлендж' })
    } finally {
      set({ isLoading: false })
    }
  },

  loadSubmissions: async (challengeId) => {
    try {
      const response = await api.get<{ submissions: ChallengeSubmission[] }>(`/challenges/${challengeId}/submissions`)
      set({ submissions: response.data.submissions })
    } catch {
      showToast('error', 'Не удалось загрузить сабмиты')
    }
  },

  loadLeaderboard: async (challengeId) => {
    try {
      const response = await api.get<{ leaderboard: LeaderboardRow[] }>(`/challenges/${challengeId}/leaderboard`)
      set({ leaderboard: response.data.leaderboard })
    } catch {
      showToast('error', 'Не удалось загрузить лидерборд')
    }
  },

  submitProgress: async (challengeId, data) => {
    try {
      await api.post(`/challenges/${challengeId}/submissions`, data)
      await get().loadSubmissions(challengeId)
      await get().loadLeaderboard(challengeId)
      showToast('success', 'Прогресс добавлен!')
    } catch {
      showToast('error', 'Не удалось отправить прогресс')
    }
  },

  createChallenge: async (data) => {
    try {
      await api.post('/challenges', data)
      await get().loadChallenges()
      await get().loadActiveChallenge()
      showToast('success', 'Челлендж создан!')
    } catch {
      showToast('error', 'Не удалось создать челлендж')
    }
  },

  updateChallengeStatus: async (id, status) => {
    try {
      await api.patch(`/challenges/${id}`, { status })
      await get().loadChallenges()
      await get().loadActiveChallenge()
      showToast('success', 'Статус обновлён')
    } catch {
      showToast('error', 'Не удалось обновить статус')
    }
  },

  deleteSubmission: async (id) => {
    try {
      await api.delete(`/challenges/submissions/${id}`)
      const { currentChallenge } = get()
      if (currentChallenge) {
        await get().loadSubmissions(currentChallenge.id)
        await get().loadLeaderboard(currentChallenge.id)
      }
      showToast('success', 'Сабмит удалён')
    } catch {
      showToast('error', 'Не удалось удалить сабмит')
    }
  },

  loadAllSubmissions: async (challengeId) => {
    try {
      const response = await api.get<{ submissions: ChallengeSubmission[] }>(`/challenges/${challengeId}/submissions/all`)
      set({ submissions: response.data.submissions })
    } catch {
      showToast('error', 'Не удалось загрузить сабмиты')
    }
  },

  reset: () => set({
    challenges: [],
    activeChallenge: null,
    currentChallenge: null,
    submissions: [],
    leaderboard: [],
    myBadges: [],
    isLoading: false,
    error: null,
  }),
}))
