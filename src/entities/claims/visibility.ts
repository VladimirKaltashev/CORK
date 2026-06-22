import type { Achievement, AchievementStatus } from '@/shared/types'
import { isLiveArenaStatus } from './arena'

export function isClaimVisibleOnNormalSurface(status: AchievementStatus): boolean {
  return isLiveArenaStatus(status)
}

export function isClaimVisibleInModerationQueue(status: AchievementStatus): boolean {
  return status === 'pending'
}

export function isClaimVisibleInArena(
  achievement: Pick<Achievement, 'status' | 'userId'>,
  viewerId?: string,
): boolean {
  return isClaimVisibleOnNormalSurface(achievement.status) && achievement.userId !== viewerId
}

export function isClaimVisibleInOwnerView(
  achievement: Pick<Achievement, 'status'>,
): boolean {
  return isClaimVisibleOnNormalSurface(achievement.status)
}

export function isClaimVisibleInPublicProfile(
  achievement: Pick<Achievement, 'status'>,
): boolean {
  return isClaimVisibleOnNormalSurface(achievement.status)
}

export function isClaimVisibleInChallenge(
  achievement: Pick<Achievement, 'status'>,
): boolean {
  return isClaimVisibleOnNormalSurface(achievement.status)
}
