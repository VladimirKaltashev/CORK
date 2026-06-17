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

export const TIER_ICONS: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
}

export function getTierIcon(tier?: string | null): string {
  if (!tier) return ''
  return TIER_ICONS[tier.toLowerCase()] ?? '🏆'
}
