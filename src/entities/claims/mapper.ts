import type { Achievement, AchievementStatus } from '@/shared/types'
import type { Claim, ClaimMeta, ClaimStatus, ClaimSubjectType, ClaimType } from './types'

const DEFAULT_CLAIM_TYPE: ClaimType = 'self_achievement'
const DEFAULT_SUBJECT_TYPE: ClaimSubjectType = 'self'

function readString(raw: unknown): string | undefined {
  if (typeof raw === 'string' && raw.length > 0) {
    return raw
  }
  return undefined
}

function isValidClaimType(value: string): value is ClaimType {
  const valid: readonly ClaimType[] = [
    'self_achievement', 'other_achievement', 'fail', 'flex',
    'discovery', 'debate', 'absurd', 'organization',
  ]
  return (valid as readonly string[]).includes(value)
}

function isValidSubjectType(value: string): value is ClaimSubjectType {
  const valid: readonly ClaimSubjectType[] = [
    'self', 'person', 'organization', 'project',
    'event', 'internet', 'unknown',
  ]
  return (valid as readonly string[]).includes(value)
}

function safeClaimType(raw: unknown): ClaimType {
  const str = readString(raw)
  if (str && isValidClaimType(str)) {
    return str
  }
  return DEFAULT_CLAIM_TYPE
}

function safeSubjectType(raw: unknown): ClaimSubjectType {
  const str = readString(raw)
  if (str && isValidSubjectType(str)) {
    return str
  }
  return DEFAULT_SUBJECT_TYPE
}

export function claimStatusFromAchievementStatus(
  status: AchievementStatus
): ClaimStatus {
  switch (status) {
    case 'pending':
      return 'unverified'
    case 'verified':
      return 'verified'
    case 'rejected':
      return 'rejected'
  }
}

export function claimMetaFromAchievementMeta(
  meta: Record<string, unknown>
): ClaimMeta {
  return {
    claimType: safeClaimType(meta.claim_type),
    subjectType: safeSubjectType(meta.subject_type),
    subjectName: readString(meta.subject_name),
    thread: readString(meta.thread),
  }
}

export function achievementToClaim(
  achievement: Achievement
): Claim {
  const meta = achievement.meta ?? {}
  const parsed = claimMetaFromAchievementMeta(meta)

  return {
    id: achievement.id,
    authorUserId: achievement.userId,
    type: parsed.claimType ?? DEFAULT_CLAIM_TYPE,
    subjectType: parsed.subjectType ?? DEFAULT_SUBJECT_TYPE,
    subjectName: parsed.subjectName,
    category: achievement.category,
    title: achievement.title,
    description: achievement.description,
    year: achievement.year,
    proofType: achievement.proofType,
    proofValue: achievement.proofValue,
    status: claimStatusFromAchievementStatus(achievement.status),
    rejectionReason: achievement.rejectionReason,
    claimAngle: achievement.claimAngle,
    thread: parsed.thread,
    meta: meta,
    createdAt: achievement.createdAt,
  }
}
