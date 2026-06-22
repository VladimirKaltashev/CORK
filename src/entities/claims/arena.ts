import type { AchievementStatus } from '@/shared/types'

export type ArenaSort = 'new' | 'hot' | 'controversial'

export const LIVE_ARENA_STATUSES: AchievementStatus[] = ['pending', 'verified']

export function isLiveArenaStatus(status: AchievementStatus): boolean {
  return LIVE_ARENA_STATUSES.includes(status)
}

export interface ArenaSortConfig {
  primaryColumn: 'created_at' | 'hot_score' | 'controversy_score'
  needsControversyFilter: boolean
}

export function getArenaSortConfig(sort: ArenaSort): ArenaSortConfig {
  if (sort === 'hot') {
    return { primaryColumn: 'hot_score', needsControversyFilter: false }
  }
  if (sort === 'controversial') {
    return { primaryColumn: 'controversy_score', needsControversyFilter: true }
  }
  return { primaryColumn: 'created_at', needsControversyFilter: false }
}
