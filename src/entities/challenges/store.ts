import { create } from 'zustand'
import type { Challenge } from '@/shared/types'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'
import { getThresholds, getExpertTier } from '@/shared/lib/expert'

interface ExpertTierInfo {
  tier: string | null
  reactions: number
  canPropose: boolean
  votePower: number
}

interface ChallengesState {
  challenges: Challenge[]
  activeChallenges: Challenge[]
  upcomingChallenges: Challenge[]
  completedChallenges: Challenge[]
  isLoading: boolean
  error: string | null
  expertTier: ExpertTierInfo
  loadChallenges: () => Promise<void>
  loadExpertTier: (userId: string) => Promise<void>
  reset: () => void
}

function mapRow(row: Record<string, unknown>): Challenge {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    proposalId: (row.proposal_id as string) ?? undefined,
    createdBy: row.created_by as string,
    startsAt: row.starts_at as string,
    endsAt: row.ends_at as string,
    status: row.status as Challenge['status'],
    config: (row.config as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  }
}

export const useChallengesStore = create<ChallengesState>((set) => ({
  challenges: [],
  activeChallenges: [],
  upcomingChallenges: [],
  completedChallenges: [],
  isLoading: false,
  error: null,
  expertTier: { tier: null, reactions: 0, canPropose: false, votePower: 1 },

  loadChallenges: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('starts_at', { ascending: false })

      if (error) throw error

      const challenges = (data ?? []).map(mapRow)
      set({
        challenges,
        activeChallenges: challenges.filter((c) => c.status === 'active'),
        upcomingChallenges: challenges.filter((c) => c.status === 'scheduled'),
        completedChallenges: challenges.filter((c) => c.status === 'completed' || c.status === 'archived'),
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось загрузить челленджи'
      set({ error: msg })
      showToast('error', msg)
    } finally {
      set({ isLoading: false })
    }
  },

  loadExpertTier: async (userId) => {
    try {
      const { data } = await supabase
        .from('profile_scores')
        .select('crowns, clowns')
        .eq('user_id', userId)
        .maybeSingle()

      const total = (data?.crowns ?? 0) + (data?.clowns ?? 0)
      const thresholds = await getThresholds()
      const { tier, canPropose, votePower } = getExpertTier(total, thresholds)
      set({ expertTier: { tier, reactions: total, canPropose, votePower } })
    } catch {
      // Non-critical — keep defaults
    }
  },

  reset: () => set({
    challenges: [],
    activeChallenges: [],
    upcomingChallenges: [],
    completedChallenges: [],
    isLoading: false,
    error: null,
    expertTier: { tier: null, reactions: 0, canPropose: false, votePower: 1 },
  }),
}))
