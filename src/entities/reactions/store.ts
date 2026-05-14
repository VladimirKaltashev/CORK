import { create } from 'zustand'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'
import { REACTION_COST, type ReactionAggregate, type ReactionKind } from './types'

interface RpcReactionResult {
  kind: ReactionKind | null
  spent: number
  remaining: number
}

interface RpcBudgetResult {
  spent: number
  remaining: number
  week_start: string
}

function isRpcReactionResult(value: unknown): value is RpcReactionResult {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    (v.kind === null || v.kind === 'crown' || v.kind === 'clown') &&
    typeof v.spent === 'number' &&
    typeof v.remaining === 'number'
  )
}

function isRpcBudgetResult(value: unknown): value is RpcBudgetResult {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return typeof v.spent === 'number' && typeof v.remaining === 'number'
}

function applyToggleLocally(prev: ReactionAggregate, kind: ReactionKind): ReactionAggregate {
  if (prev.myKind === kind) {
    return {
      crowns: prev.crowns - (kind === 'crown' ? 1 : 0),
      clowns: prev.clowns - (kind === 'clown' ? 1 : 0),
      myKind: null,
    }
  }
  let crowns = prev.crowns
  let clowns = prev.clowns
  if (prev.myKind === 'crown') crowns -= 1
  else if (prev.myKind === 'clown') clowns -= 1
  if (kind === 'crown') crowns += 1
  else clowns += 1
  return { crowns, clowns, myKind: kind }
}

function computeBudgetDelta(prevKind: ReactionKind | null, nextKind: ReactionKind): number {
  if (prevKind === nextKind) return REACTION_COST[nextKind]
  const refund = prevKind ? REACTION_COST[prevKind] : 0
  return refund - REACTION_COST[nextKind]
}

interface ProfileScore {
  crowns: number
  clowns: number
}

interface ReactionsState {
  byAchievement: Record<string, ReactionAggregate>
  userScores: Record<string, ProfileScore>
  pending: Set<string>
  budgetRemaining: number
  budgetSpent: number
  budgetLoaded: boolean
  loadForAchievements: (ids: string[], myUserId: string | undefined) => Promise<void>
  toggle: (achievementId: string, kind: ReactionKind) => Promise<void>
  loadBudget: () => Promise<void>
  loadScoresFor: (userId: string) => Promise<void>
  reset: () => void
}

const EMPTY: ReactionAggregate = { crowns: 0, clowns: 0, myKind: null }

export const useReactionsStore = create<ReactionsState>((set, get) => ({
  byAchievement: {},
  userScores: {},
  pending: new Set(),
  budgetRemaining: 10,
  budgetSpent: 0,
  budgetLoaded: false,

  loadForAchievements: async (ids, myUserId) => {
    if (ids.length === 0) return
    const { data, error } = await supabase
      .from('reactions')
      .select('achievement_id, user_id, kind')
      .in('achievement_id', ids)
    if (error) {
      showToast('error', 'Не удалось загрузить реакции')
      return
    }
    const next: Record<string, ReactionAggregate> = {}
    for (const id of ids) {
      next[id] = { crowns: 0, clowns: 0, myKind: null }
    }
    const rows = (data ?? []) as Array<{ achievement_id: string; user_id: string; kind: ReactionKind }>
    for (const r of rows) {
      const agg = next[r.achievement_id]
      if (!agg) continue
      if (r.kind === 'crown') agg.crowns += 1
      else if (r.kind === 'clown') agg.clowns += 1
      if (myUserId && r.user_id === myUserId) agg.myKind = r.kind
    }
    set((s) => ({ byAchievement: { ...s.byAchievement, ...next } }))
  },

  toggle: async (achievementId, kind) => {
    const state = get()
    if (state.pending.has(achievementId)) return
    const prev = state.byAchievement[achievementId] ?? EMPTY
    const optimistic = applyToggleLocally(prev, kind)
    const budgetDelta = computeBudgetDelta(prev.myKind, kind)

    set((s) => {
      const pending = new Set(s.pending)
      pending.add(achievementId)
      return {
        byAchievement: { ...s.byAchievement, [achievementId]: optimistic },
        pending,
        budgetRemaining: Math.max(0, s.budgetRemaining + budgetDelta),
        budgetSpent: Math.max(0, s.budgetSpent - budgetDelta),
      }
    })

    const { data, error } = await supabase.rpc('toggle_reaction', {
      p_achievement_id: achievementId,
      p_kind: kind,
    })

    set((s) => {
      const pending = new Set(s.pending)
      pending.delete(achievementId)
      return { pending }
    })

    if (error) {
      set((s) => ({
        byAchievement: { ...s.byAchievement, [achievementId]: prev },
        budgetRemaining: Math.max(0, s.budgetRemaining - budgetDelta),
        budgetSpent: Math.max(0, s.budgetSpent + budgetDelta),
      }))
      const exceeded = error.message?.toLowerCase().includes('budget exceeded')
      showToast('error', exceeded ? 'Не хватает голосов на этой неделе' : 'Не удалось поставить реакцию')
      return
    }

    if (isRpcReactionResult(data)) {
      set({ budgetRemaining: data.remaining, budgetSpent: data.spent, budgetLoaded: true })
    }
  },

  loadBudget: async () => {
    const { data, error } = await supabase.rpc('get_reaction_budget')
    if (error) return
    if (isRpcBudgetResult(data)) {
      set({ budgetRemaining: data.remaining, budgetSpent: data.spent, budgetLoaded: true })
    }
  },

  loadScoresFor: async (userId) => {
    const { data, error } = await supabase
      .from('profile_scores')
      .select('crowns, clowns')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) return
    const score: ProfileScore = {
      crowns: data?.crowns ?? 0,
      clowns: data?.clowns ?? 0,
    }
    set((s) => ({ userScores: { ...s.userScores, [userId]: score } }))
  },

  reset: () =>
    set({
      byAchievement: {},
      userScores: {},
      pending: new Set(),
      budgetRemaining: 10,
      budgetSpent: 0,
      budgetLoaded: false,
    }),
}))
