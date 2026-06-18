import type { ClaimSubjectType, ClaimType } from './types'

const SUBJECT_TYPE_FOR_CLAIM_TYPE: Record<ClaimType, ClaimSubjectType> = {
  self_achievement: 'self',
  other_achievement: 'person',
  fail: 'internet',
  flex: 'self',
  discovery: 'project',
  debate: 'unknown',
  absurd: 'internet',
  organization: 'organization',
}

export function defaultSubjectTypeForClaimType(
  claimType: ClaimType
): ClaimSubjectType {
  return SUBJECT_TYPE_FOR_CLAIM_TYPE[claimType]
}

export function buildClaimMeta(params: {
  eventDate?: string | null
  claimType: ClaimType
  subjectType: ClaimSubjectType
  subjectName?: string
  thread?: string
}): Record<string, unknown> {
  const meta: Record<string, unknown> = {}

  if (params.eventDate) {
    meta.event_date = params.eventDate
  }

  meta.claim_type = params.claimType
  meta.subject_type = params.subjectType

  const trimmedName = params.subjectName?.trim()
  if (trimmedName && trimmedName.length > 0) {
    meta.subject_name = trimmedName
  }

  const trimmedThread = params.thread?.trim()
  if (trimmedThread && trimmedThread.length > 0) {
    meta.thread = trimmedThread
  }

  return meta
}
