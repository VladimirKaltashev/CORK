import type { Achievement } from '@/shared/types'

export type OwnClaimsFilter = 'all' | 'arena' | 'crowned' | 'clowned'

export interface ClaimVerdictAggregate {
  crowns: number
  clowns: number
}

export interface OwnClaimsStats {
  totalClaims: number
  crownedCount: number
  clownedCount: number
  activeCount: number
}

export function filterArenaItemsForViewer<T extends { userId: string }>(
  items: T[],
  viewerId?: string,
): T[] {
  if (!viewerId) return items
  return items.filter((item) => item.userId !== viewerId)
}

function isOnArena(achievement: Achievement): boolean {
  return achievement.status === 'verified'
}

function hasCrowdVerdict(agg?: ClaimVerdictAggregate): agg is ClaimVerdictAggregate {
  return !!agg && (agg.crowns > 0 || agg.clowns > 0)
}

export function isCrownedClaim(
  achievement: Achievement,
  agg?: ClaimVerdictAggregate,
): boolean {
  return isOnArena(achievement) && hasCrowdVerdict(agg) && agg.crowns > agg.clowns
}

export function isClownedClaim(
  achievement: Achievement,
  agg?: ClaimVerdictAggregate,
): boolean {
  return isOnArena(achievement) && hasCrowdVerdict(agg) && agg.clowns > agg.crowns
}

export function matchesOwnClaimsFilter(
  achievement: Achievement,
  filter: OwnClaimsFilter,
  agg?: ClaimVerdictAggregate,
): boolean {
  if (filter === 'all') return true
  if (filter === 'arena') return isOnArena(achievement)
  if (filter === 'crowned') return isCrownedClaim(achievement, agg)
  if (filter === 'clowned') return isClownedClaim(achievement, agg)
  return true
}

export function buildOwnClaimsStats(
  achievements: Achievement[],
  verdictsById: Record<string, ClaimVerdictAggregate | undefined>,
): OwnClaimsStats {
  let crownedCount = 0
  let clownedCount = 0
  let activeCount = 0

  for (const achievement of achievements) {
    const agg = verdictsById[achievement.id]
    if (isOnArena(achievement)) activeCount += 1
    if (isCrownedClaim(achievement, agg)) crownedCount += 1
    if (isClownedClaim(achievement, agg)) clownedCount += 1
  }

  return {
    totalClaims: achievements.length,
    crownedCount,
    clownedCount,
    activeCount,
  }
}
