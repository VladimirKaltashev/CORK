import { describe, expect, it } from 'vitest'
import type { Achievement } from '@/shared/types'
import {
  applyChallengeContextToClaimMeta,
  buildChallengeThreadValue,
  getChallengeIdFromClaimMeta,
  isClaimLinkedToChallenge,
  isLiveChallengeClaim,
} from './claimLinking'

function makeAchievement(overrides: Partial<Achievement> = {}): Achievement {
  return {
    id: 'a1',
    userId: 'u1',
    category: 'other',
    title: 't',
    description: 'd',
    year: 2026,
    proofType: 'none',
    proofValue: undefined,
    status: 'pending',
    claimAngle: 'judge',
    rejectionReason: undefined,
    meta: {},
    createdAt: '2026-06-21T00:00:00Z',
    ...overrides,
  }
}

describe('challenge claim linking helpers', () => {
  it('builds thread label from challengeTitle when available', () => {
    expect(buildChallengeThreadValue({ challengeId: 'c1', challengeTitle: 'Мой челлендж' })).toBe('Мой челлендж')
  })

  it('builds thread label from challenge id when title is empty', () => {
    expect(buildChallengeThreadValue({ challengeId: 'c1', challengeTitle: '   ' })).toBe('challenge:c1')
  })

  it('extracts challenge id from meta.challenge_id', () => {
    const meta = { challenge_id: 'c1' }
    expect(getChallengeIdFromClaimMeta(meta)).toBe('c1')
  })

  it('isClaimLinkedToChallenge matches meta.challenge_id', () => {
    const achievement = makeAchievement({ meta: { challenge_id: 'c1' } })
    expect(isClaimLinkedToChallenge(achievement, 'c1')).toBe(true)
    expect(isClaimLinkedToChallenge(achievement, 'c2')).toBe(false)
  })

  it('applies challenge context meta fields', () => {
    const meta: Record<string, unknown> = {}
    applyChallengeContextToClaimMeta(meta, 'c1')
    expect(meta.challenge_id).toBe('c1')
    expect(meta.source).toBe('challenge_entry')
  })

  it('live visibility: pending and verified are live, rejected is hidden', () => {
    const base: Achievement = makeAchievement({ meta: { challenge_id: 'c1' } })

    expect(isLiveChallengeClaim({ ...base, status: 'pending' }, 'c1')).toBe(true)
    expect(isLiveChallengeClaim({ ...base, status: 'verified' }, 'c1')).toBe(true)
    expect(isLiveChallengeClaim({ ...base, status: 'rejected' }, 'c1')).toBe(false)
  })
})
