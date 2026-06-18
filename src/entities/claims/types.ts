export type ClaimType =
  | 'self_achievement'
  | 'other_achievement'
  | 'fail'
  | 'flex'
  | 'discovery'
  | 'debate'
  | 'absurd'
  | 'organization'

export type ClaimSubjectType =
  | 'self'
  | 'person'
  | 'organization'
  | 'project'
  | 'event'
  | 'internet'
  | 'unknown'

export type ClaimStatus =
  | 'unverified'
  | 'verified'
  | 'disputed'
  | 'hidden'
  | 'rejected'

export interface ClaimMeta {
  claimType?: ClaimType
  subjectType?: ClaimSubjectType
  subjectName?: string
  thread?: string
}

export interface Claim {
  id: string
  authorUserId: string
  type: ClaimType
  subjectType: ClaimSubjectType
  subjectName?: string
  category: string
  title: string
  description: string
  year: number
  proofType: string
  proofValue?: string
  status: ClaimStatus
  rejectionReason?: string
  claimAngle?: string
  thread?: string
  meta: Record<string, unknown>
  createdAt: string
}
