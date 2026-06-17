import { create } from 'zustand'
import type { Challenge, ChallengeEntry, ChallengeAward, AwardType } from '@/shared/types'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'
import { getThresholds, getExpertTier } from '@/shared/lib/expert'

interface ExpertTierInfo {
  tier: string | null
  reactions: number
  canPropose: boolean
  votePower: number
}

export interface EntryWithProfile extends ChallengeEntry {
  userName: string
}

export interface AwardWithProfile extends ChallengeAward {
  userName: string
}

interface ChallengesState {
  challenges: Challenge[]
  activeChallenges: Challenge[]
  upcomingChallenges: Challenge[]
  completedChallenges: Challenge[]
  isLoading: boolean
  error: string | null
  expertTier: ExpertTierInfo

  detail: Challenge | null
  entries: EntryWithProfile[]
  awards: AwardWithProfile[]
  isDetailLoading: boolean
  detailError: string | null

  loadChallenges: () => Promise<void>
  loadExpertTier: (userId: string) => Promise<void>
  loadDetail: (id: string) => Promise<void>
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

  detail: null,
  entries: [],
  awards: [],
  isDetailLoading: false,
  detailError: null,

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

  loadDetail: async (id) => {
    set({ isDetailLoading: true, detailError: null })
    try {
      const [challengeResult, entriesResult, awardsResult] = await Promise.all([
        supabase.from('challenges').select('*').eq('id', id).single(),
        supabase
          .from('challenge_entries')
          .select('*')
          .eq('challenge_id', id)
          .eq('is_current', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('challenge_awards')
          .select('*')
          .eq('challenge_id', id),
      ])

      if (challengeResult.error) throw challengeResult.error

      const challenge = mapRow(challengeResult.data as Record<string, unknown>)

      // Resolve entry user names
      const entryUserIds = [...new Set((entriesResult.data ?? []).map((e: { user_id: string }) => e.user_id))]
      const awardUserIds = [...new Set((awardsResult.data ?? []).map((a: { user_id: string }) => a.user_id))]
      const allIds = [...new Set([...entryUserIds, ...awardUserIds])]

      let profileMap: Record<string, string> = {}
      if (allIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', allIds)
        profileMap = Object.fromEntries((profiles ?? []).map((p: { id: string; name: string }) => [p.id, p.name]))
      }

      const entries: EntryWithProfile[] = (entriesResult.data ?? []).map((e: Record<string, unknown>) => ({
        id: e.id as string,
        challengeId: e.challenge_id as string,
        userId: e.user_id as string,
        claimId: e.claim_id as string,
        title: e.title as string,
        description: e.description as string | undefined,
        version: e.version as number,
        isCurrent: e.is_current as boolean,
        createdAt: e.created_at as string,
        updatedAt: e.updated_at as string,
        userName: profileMap[e.user_id as string] ?? 'Пользователь',
      }))

      const awards: AwardWithProfile[] = (awardsResult.data ?? []).map((a: Record<string, unknown>) => ({
        id: a.id as string,
        challengeId: a.challenge_id as string,
        userId: a.user_id as string,
        awardType: a.award_type as AwardType,
        claimId: (a.claim_id as string) ?? undefined,
        awardedAt: a.awarded_at as string,
        userName: profileMap[a.user_id as string] ?? 'Пользователь',
      }))

      set({ detail: challenge, entries, awards })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось загрузить челлендж'
      set({ detailError: msg })
    } finally {
      set({ isDetailLoading: false })
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
    detail: null,
    entries: [],
    awards: [],
    isDetailLoading: false,
    detailError: null,
  }),
}))
