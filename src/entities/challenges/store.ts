import { create } from 'zustand'
import type { Challenge, ChallengeEntry, ChallengeAward, AwardType } from '@/shared/types'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'
import { getThresholds, getExpertProgress, type ExpertProgress } from '@/shared/lib/expert'

export interface EntryWithProfile extends ChallengeEntry {
  userName: string
}

export interface AwardWithProfile extends ChallengeAward {
  userName: string
}

export interface ChallengeStats {
  entries: number
  awards: number
}

interface ChallengeEntryPayload {
  title: string
  description?: string
}

interface ChallengeEntryUser {
  id: string
  name: string
}

interface ChallengesState {
  challenges: Challenge[]
  activeChallenges: Challenge[]
  upcomingChallenges: Challenge[]
  completedChallenges: Challenge[]
  statsByChallenge: Record<string, ChallengeStats>
  isLoading: boolean
  error: string | null
  expertTier: ExpertProgress

  detail: Challenge | null
  entries: EntryWithProfile[]
  awards: AwardWithProfile[]
  isDetailLoading: boolean
  detailError: string | null

  loadChallenges: () => Promise<void>
  loadExpertTier: (userId: string) => Promise<void>
  loadDetail: (id: string) => Promise<void>
  submitEntry: (challengeId: string, user: ChallengeEntryUser, payload: ChallengeEntryPayload) => Promise<void>
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

function createEmptyStats(challenges: Challenge[]): Record<string, ChallengeStats> {
  return Object.fromEntries(challenges.map((c) => [c.id, { entries: 0, awards: 0 }]))
}

function mapEntryRow(row: Record<string, unknown>, profileMap: Record<string, string>): EntryWithProfile {
  return {
    id: row.id as string,
    challengeId: row.challenge_id as string,
    userId: row.user_id as string,
    claimId: (row.claim_id as string | null) ?? undefined,
    title: row.title as string,
    description: (row.description as string | null) ?? undefined,
    version: row.version as number,
    isCurrent: row.is_current as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    userName: profileMap[row.user_id as string] ?? 'Пользователь',
  }
}

function mapAwardRow(row: Record<string, unknown>, profileMap: Record<string, string>): AwardWithProfile {
  return {
    id: row.id as string,
    challengeId: row.challenge_id as string,
    userId: row.user_id as string,
    awardType: row.award_type as AwardType,
    claimId: (row.claim_id as string | null) ?? undefined,
    awardedAt: row.awarded_at as string,
    userName: profileMap[row.user_id as string] ?? 'Пользователь',
  }
}

export const useChallengesStore = create<ChallengesState>((set) => ({
  challenges: [],
  activeChallenges: [],
  upcomingChallenges: [],
  completedChallenges: [],
  statsByChallenge: {},
  isLoading: false,
  error: null,
  expertTier: getExpertProgress(0, []),

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
      const statsByChallenge = createEmptyStats(challenges)
      const challengeIds = challenges.map((c) => c.id)

      if (challengeIds.length > 0) {
        const [entriesResult, awardsResult] = await Promise.all([
          supabase
            .from('challenge_entries')
            .select('challenge_id')
            .in('challenge_id', challengeIds)
            .eq('is_current', true),
          supabase
            .from('challenge_awards')
            .select('challenge_id')
            .in('challenge_id', challengeIds),
        ])

        if (!entriesResult.error) {
          for (const row of entriesResult.data ?? []) {
            const id = (row as { challenge_id: string }).challenge_id
            if (statsByChallenge[id]) statsByChallenge[id].entries += 1
          }
        }

        if (!awardsResult.error) {
          for (const row of awardsResult.data ?? []) {
            const id = (row as { challenge_id: string }).challenge_id
            if (statsByChallenge[id]) statsByChallenge[id].awards += 1
          }
        }
      }

      set({
        challenges,
        activeChallenges: challenges.filter((c) => c.status === 'active'),
        upcomingChallenges: challenges.filter((c) => c.status === 'scheduled'),
        completedChallenges: challenges.filter((c) => c.status === 'completed' || c.status === 'archived'),
        statsByChallenge,
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
      set({ expertTier: getExpertProgress(total, thresholds) })
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

      const entries: EntryWithProfile[] = (entriesResult.data ?? []).map((e: Record<string, unknown>) => mapEntryRow(e, profileMap))

      const awards: AwardWithProfile[] = (awardsResult.data ?? []).map((a: Record<string, unknown>) => mapAwardRow(a, profileMap))

      set({ detail: challenge, entries, awards })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось загрузить челлендж'
      set({ detailError: msg })
    } finally {
      set({ isDetailLoading: false })
    }
  },

  submitEntry: async (challengeId, user, payload) => {
    const title = payload.title.trim()
    const description = payload.description?.trim()
    if (title.length < 3) {
      showToast('error', 'Заявка слишком короткая')
      throw new Error('entry title is too short')
    }

    const existing = useChallengesStore
      .getState()
      .entries
      .find((entry) => entry.challengeId === challengeId && entry.userId === user.id && entry.isCurrent)

    if (existing) {
      const { data, error } = await supabase
        .from('challenge_entries')
        .update({
          title,
          description: description || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('*')
        .single()
      if (error) {
        showToast('error', 'Не удалось обновить заявку')
        throw error
      }

      if (existing.claimId) {
        await supabase
          .from('achievements')
          .update({
            title,
            description: description || title,
            year: new Date().getFullYear(),
          })
          .eq('id', existing.claimId)
      }

      const entry = mapEntryRow(data as Record<string, unknown>, { [user.id]: user.name })
      set((s) => ({
        entries: s.entries.map((item) => (item.id === existing.id ? entry : item)),
      }))
      showToast('success', 'Заявка обновлена')
      return
    }

    const { data: claim, error: claimError } = await supabase
      .from('achievements')
      .insert({
        user_id: user.id,
        category: 'other',
        title,
        description: description || title,
        year: new Date().getFullYear(),
        proof_type: 'none',
        proof_value: null,
        claim_angle: 'judge',
        status: 'pending',
        meta: { challenge_id: challengeId, source: 'challenge_entry' },
      })
      .select('id')
      .single()

    if (claimError) {
      showToast('error', 'Не удалось создать claim для челленджа')
      throw claimError
    }

    const { data, error } = await supabase
      .from('challenge_entries')
      .insert({
        challenge_id: challengeId,
        user_id: user.id,
        claim_id: claim.id,
        title,
        description: description || null,
        version: 1,
        is_current: true,
      })
      .select('*')
      .single()

    if (error) {
      showToast('error', 'Не удалось подать заявку')
      throw error
    }

    const entry = mapEntryRow(data as Record<string, unknown>, { [user.id]: user.name })
    set((s) => ({
      entries: [entry, ...s.entries],
      statsByChallenge: {
        ...s.statsByChallenge,
        [challengeId]: {
          entries: (s.statsByChallenge[challengeId]?.entries ?? 0) + 1,
          awards: s.statsByChallenge[challengeId]?.awards ?? 0,
        },
      },
    }))
    showToast('success', 'Заявка принята в челлендж')
  },

  reset: () => set({
    challenges: [],
    activeChallenges: [],
    upcomingChallenges: [],
    completedChallenges: [],
    statsByChallenge: {},
    isLoading: false,
    error: null,
    expertTier: getExpertProgress(0, []),
    detail: null,
    entries: [],
    awards: [],
    isDetailLoading: false,
    detailError: null,
  }),
}))
