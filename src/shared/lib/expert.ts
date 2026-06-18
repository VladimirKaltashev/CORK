import { supabase } from './supabase'
import type { ExpertThreshold } from '@/shared/types'

let _thresholds: ExpertThreshold[] | null = null

export async function getThresholds(): Promise<ExpertThreshold[]> {
  if (_thresholds) return _thresholds
  const { data } = await supabase
    .from('expert_thresholds')
    .select('*')
    .order('min_reactions', { ascending: false })
  _thresholds = (data ?? []).map((r: Record<string, unknown>) => ({
    tier: r.tier as string,
    minReactions: r.min_reactions as number,
    canPropose: r.can_propose as boolean,
    votePower: r.vote_power as number,
    updatedAt: r.updated_at as string,
  }))
  return _thresholds
}

export function getExpertTier(
  totalReactions: number,
  thresholds?: ExpertThreshold[],
): { tier: string | null; canPropose: boolean; votePower: number } {
  if (!thresholds || thresholds.length === 0) {
    return { tier: null, canPropose: false, votePower: 1 }
  }
  const matched = thresholds.find((t) => totalReactions >= t.minReactions)
  return {
    tier: matched?.tier ?? null,
    canPropose: matched?.canPropose ?? false,
    votePower: matched?.votePower ?? 1,
  }
}

export interface ExpertProgress {
  tier: string | null
  displayTier: string
  icon: string
  reactions: number
  canPropose: boolean
  votePower: number
  currentMin: number
  nextTier: string | null
  nextMin: number | null
  remainingToNext: number
  progressCurrent: number
  progressTarget: number
  progressPct: number
  isMaxTier: boolean
}

function normalizeThresholds(thresholds?: ExpertThreshold[]): ExpertThreshold[] {
  return [...(thresholds ?? [])].sort((a, b) => a.minReactions - b.minReactions)
}

export function getExpertProgress(
  totalReactions: number,
  thresholds?: ExpertThreshold[],
): ExpertProgress {
  const reactions = Math.max(0, totalReactions)
  const sorted = normalizeThresholds(thresholds)
  const matched = sorted.filter((t) => reactions >= t.minReactions).at(-1) ?? null
  const next = sorted.find((t) => reactions < t.minReactions) ?? null
  const currentMin = matched?.minReactions ?? 0
  const nextMin = next?.minReactions ?? null
  const progressTarget = nextMin ? Math.max(nextMin - currentMin, 1) : 1
  const progressCurrent = nextMin ? Math.min(Math.max(reactions - currentMin, 0), progressTarget) : progressTarget

  return {
    tier: matched?.tier ?? null,
    displayTier: matched?.tier ?? 'Новичок',
    icon: getTierIcon(matched?.tier),
    reactions,
    canPropose: matched?.canPropose ?? false,
    votePower: matched?.votePower ?? 1,
    currentMin,
    nextTier: next?.tier ?? null,
    nextMin,
    remainingToNext: nextMin ? Math.max(nextMin - reactions, 0) : 0,
    progressCurrent,
    progressTarget,
    progressPct: nextMin ? Math.round((progressCurrent / progressTarget) * 100) : 100,
    isMaxTier: !next,
  }
}

export const TIER_ICONS: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
}

export function getTierIcon(tier?: string | null): string {
  if (!tier) return '⚪'
  return TIER_ICONS[tier.toLowerCase()] ?? '🏆'
}
