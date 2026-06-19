import type { ClaimType } from './types'
import { claimMetaFromAchievementMeta } from './mapper'
import { claimTypeEmoji, claimTypeLabel } from './display'

export type ClaimTypeFilter = 'all' | ClaimType

export interface ClaimTypeFilterOption {
  value: ClaimTypeFilter
  label: string
  emoji: string
}

const ALL_CLAIM_TYPES: ClaimType[] = [
  'self_achievement', 'other_achievement', 'fail', 'flex',
  'discovery', 'debate', 'absurd', 'organization',
]

export const CLAIM_TYPE_FILTER_OPTIONS: ClaimTypeFilterOption[] = [
  { value: 'all', label: 'Все', emoji: '🌐' },
  ...ALL_CLAIM_TYPES.map((type) => ({
    value: type,
    label: claimTypeLabel(type),
    emoji: claimTypeEmoji(type),
  })),
]

const ALL_CLAIM_TYPES_SET = new Set<string>(ALL_CLAIM_TYPES)

export function parseClaimTypeFilter(value: string | null): ClaimTypeFilter {
  if (value === null || value === 'all') return 'all'
  if (ALL_CLAIM_TYPES_SET.has(value)) {
    return value as ClaimType
  }
  return 'all'
}

export function matchesClaimTypeFilter(
  meta: Record<string, unknown>,
  filter: ClaimTypeFilter,
): boolean {
  if (filter === 'all') return true
  const { claimType } = claimMetaFromAchievementMeta(meta)
  return claimType === filter
}
