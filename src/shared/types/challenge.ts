export type ChallengeStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'archived'

export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'in_voting' | 'scheduled'

export type AwardType = 'king' | 'clown' | 'finder' | 'best_comment' | 'most_controversial' | 'participant'

export interface ExpertThreshold {
  tier: string
  minReactions: number
  canPropose: boolean
  votePower: number
  updatedAt: string
}

export interface ChallengeProposal {
  id: string
  title: string
  description: string
  proposedBy: string
  status: ProposalStatus
  votesUp: number
  votesDown: number
  scheduledAt?: string
  createdAt: string
  updatedAt: string
}

export interface Challenge {
  id: string
  title: string
  description: string
  proposalId?: string
  createdBy: string
  startsAt: string
  endsAt: string
  status: ChallengeStatus
  config: Record<string, unknown>
  createdAt: string
}

export interface ChallengeEntry {
  id: string
  challengeId: string
  userId: string
  claimId?: string
  title: string
  description?: string
  version: number
  isCurrent: boolean
  createdAt: string
  updatedAt: string
}

export interface ChallengeAward {
  id: string
  challengeId: string
  userId: string
  awardType: AwardType
  claimId?: string
  awardedAt: string
}
