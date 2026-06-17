import { create } from 'zustand'
import type { Challenge, ExpertThreshold } from '@/shared/types'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'

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

async function resolveExpertTier(userId: string): Promise<ExpertTierInfo> {
  const [scoresResult, thresholdsResult] = await Promise.all([
    supabase
      .from('profile_scores')
      .select('crowns, clowns')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('expert_thresholds')
      .select('*')
      .order('min_reactions', { ascending: false }),
  ])

  const total =
    (scoresResult.data?.crowns ?? 0) + (scoresResult.data?.clowns ?? 0)

  const thresholds: ExpertThreshold[] = (thresholdsResult.data ?? []).map((r: Record<string, unknown>) => ({
    tier: r.tier as string,
    minReactions: r.min_reactions as number,
    canPropose: r.can_propose as boolean,
    votePower: r.vote_power as number,
    updatedAt: r.updated_at as string,
  }))
  const matched = thresholds.find((t) => total >= t.minReactions)

  return {
    tier: matched?.tier ?? null,
    reactions: total,
    canPropose: matched?.canPropose ?? false,
    votePower: matched?.votePower ?? 1,
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
      const info = await resolveExpertTier(userId)
      set({ expertTier: info })
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
