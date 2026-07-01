import type { Achievement, AchievementStatus } from '@/shared/types'
import { isClaimVisibleInChallenge } from '@/entities/claims'

export function buildChallengeThreadValue(params: { challengeId: string; challengeTitle?: string }): string {
  return params.challengeTitle?.trim() ? params.challengeTitle.trim() : `challenge:${params.challengeId}`
}

export function applyChallengeContextToClaimMeta(meta: Record<string, unknown>, challengeId: string): void {
  meta.challenge_id = challengeId
  meta.source = 'challenge_entry'
}

export function getChallengeIdFromClaimMeta(meta: Record<string, unknown>): string | undefined {
  const raw = (meta as Record<string, unknown>).challenge_id ?? (meta as Record<string, unknown>).challengeId
  return typeof raw === 'string' && raw.trim() ? raw : undefined
}

export function isClaimLinkedToChallenge(achievement: Pick<Achievement, 'meta'>, challengeId: string): boolean {
  return getChallengeIdFromClaimMeta(achievement.meta) === challengeId
}

export function isLiveChallengeClaim(
  achievement: Pick<Achievement, 'meta' | 'status'>,
  challengeId: string,
): boolean {
  return isClaimLinkedToChallenge(achievement, challengeId) && isClaimVisibleInChallenge({ status: achievement.status as AchievementStatus })
}
