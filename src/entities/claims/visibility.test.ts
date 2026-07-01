import { describe, expect, it } from 'vitest'
import {
  isClaimVisibleInArena,
  isClaimVisibleInChallenge,
  isClaimVisibleInModerationQueue,
  isClaimVisibleInOwnerView,
  isClaimVisibleInPublicProfile,
  isClaimVisibleOnNormalSurface,
} from './visibility'

describe('claim visibility helpers', () => {
  it('treats pending and verified as normal live claims', () => {
    expect(isClaimVisibleOnNormalSurface('pending')).toBe(true)
    expect(isClaimVisibleOnNormalSurface('verified')).toBe(true)
    expect(isClaimVisibleOnNormalSurface('rejected')).toBe(false)
  })

  it('keeps only pending claims in moderation queue', () => {
    expect(isClaimVisibleInModerationQueue('pending')).toBe(true)
    expect(isClaimVisibleInModerationQueue('verified')).toBe(false)
    expect(isClaimVisibleInModerationQueue('rejected')).toBe(false)
  })

  it('hides own and rejected claims from Arena', () => {
    expect(isClaimVisibleInArena({ status: 'pending', userId: 'u2' }, 'u1')).toBe(true)
    expect(isClaimVisibleInArena({ status: 'verified', userId: 'u2' }, 'u1')).toBe(true)
    expect(isClaimVisibleInArena({ status: 'pending', userId: 'u1' }, 'u1')).toBe(false)
    expect(isClaimVisibleInArena({ status: 'rejected', userId: 'u2' }, 'u1')).toBe(false)
  })

  it('does not use challenge meta when computing arena visibility', () => {
    const withChallengeMeta: { status: 'pending' | 'verified' | 'rejected'; userId: string; meta: { challenge_id: string } } = {
      status: 'pending',
      userId: 'u2',
      meta: { challenge_id: 'c1' },
    }
    expect(isClaimVisibleInArena(withChallengeMeta, 'u1')).toBe(true)

    const rejectedWithChallengeMeta: { status: 'pending' | 'verified' | 'rejected'; userId: string; meta: { challenge_id: string } } = {
      status: 'rejected',
      userId: 'u2',
      meta: { challenge_id: 'c1' },
    }
    expect(isClaimVisibleInArena(rejectedWithChallengeMeta, 'u1')).toBe(false)
  })

  it('hides rejected claims from /me, public profile, and challenge surfaces', () => {
    expect(isClaimVisibleInOwnerView({ status: 'pending' })).toBe(true)
    expect(isClaimVisibleInOwnerView({ status: 'verified' })).toBe(true)
    expect(isClaimVisibleInOwnerView({ status: 'rejected' })).toBe(false)

    expect(isClaimVisibleInPublicProfile({ status: 'pending' })).toBe(true)
    expect(isClaimVisibleInPublicProfile({ status: 'verified' })).toBe(true)
    expect(isClaimVisibleInPublicProfile({ status: 'rejected' })).toBe(false)

    expect(isClaimVisibleInChallenge({ status: 'pending' })).toBe(true)
    expect(isClaimVisibleInChallenge({ status: 'verified' })).toBe(true)
    expect(isClaimVisibleInChallenge({ status: 'rejected' })).toBe(false)
  })
})
