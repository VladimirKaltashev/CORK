import { describe, expect, it } from 'vitest'
import { buildOwnClaimsStats, isClownedClaim, isCrownedClaim, matchesOwnClaimsFilter } from './owner'
import type { Achievement } from '@/shared/types'

function makeAchievement(overrides: Partial<Achievement> = {}): Achievement {
  return {
    id: 'a1',
    userId: 'u1',
    category: 'other',
    title: 'Claim',
    description: 'Desc',
    year: 2026,
    proofType: 'none',
    status: 'verified',
    meta: {},
    createdAt: '2026-06-21T00:00:00Z',
    ...overrides,
  }
}

describe('own claims helpers', () => {
  it('detects crowned claim only on arena with positive lead', () => {
    expect(isCrownedClaim(makeAchievement(), { crowns: 3, clowns: 1 })).toBe(true)
    expect(isCrownedClaim(makeAchievement(), { crowns: 0, clowns: 0 })).toBe(false)
    expect(isCrownedClaim(makeAchievement({ status: 'pending' }), { crowns: 3, clowns: 1 })).toBe(false)
  })

  it('detects clowned claim only on arena with positive lead', () => {
    expect(isClownedClaim(makeAchievement(), { crowns: 1, clowns: 4 })).toBe(true)
    expect(isClownedClaim(makeAchievement(), { crowns: 2, clowns: 2 })).toBe(false)
    expect(isClownedClaim(makeAchievement({ status: 'rejected' }), { crowns: 1, clowns: 4 })).toBe(false)
  })

  it('matches own claims filters', () => {
    const verified = makeAchievement()
    const pending = makeAchievement({ id: 'a2', status: 'pending' })

    expect(matchesOwnClaimsFilter(verified, 'all')).toBe(true)
    expect(matchesOwnClaimsFilter(verified, 'arena')).toBe(true)
    expect(matchesOwnClaimsFilter(pending, 'arena')).toBe(false)
    expect(matchesOwnClaimsFilter(verified, 'crowned', { crowns: 5, clowns: 1 })).toBe(true)
    expect(matchesOwnClaimsFilter(verified, 'clowned', { crowns: 5, clowns: 1 })).toBe(false)
  })

  it('builds owner claims stats from verdicts and statuses', () => {
    const achievements = [
      makeAchievement({ id: 'crown' }),
      makeAchievement({ id: 'clown' }),
      makeAchievement({ id: 'pending', status: 'pending' }),
      makeAchievement({ id: 'quiet' }),
    ]

    const stats = buildOwnClaimsStats(achievements, {
      crown: { crowns: 4, clowns: 1 },
      clown: { crowns: 1, clowns: 3 },
      quiet: { crowns: 0, clowns: 0 },
    })

    expect(stats).toEqual({
      totalClaims: 4,
      crownedCount: 1,
      clownedCount: 1,
      activeCount: 3,
    })
  })
})
