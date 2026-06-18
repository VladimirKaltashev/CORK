import { describe, expect, it } from 'vitest'
import type { Achievement } from '@/shared/types'
import {
  achievementToClaim,
  claimStatusFromAchievementStatus,
} from './mapper'
import type { ClaimStatus } from './types'

function makeAchievement(overrides: Partial<Achievement> = {}): Achievement {
  return {
    id: 'ach-1',
    userId: 'user-1',
    category: 'it',
    title: 'Test Achievement',
    description: 'Test description',
    year: 2024,
    proofType: 'none',
    proofValue: undefined,
    status: 'pending',
    claimAngle: 'judge',
    rejectionReason: undefined,
    meta: {},
    createdAt: '2024-06-01T00:00:00Z',
    ...overrides,
  }
}

describe('claimStatusFromAchievementStatus', () => {
  it.each<[string, Achievement['status'], ClaimStatus]>([
    ['pending maps to unverified', 'pending', 'unverified'],
    ['verified stays verified', 'verified', 'verified'],
    ['rejected stays rejected', 'rejected', 'rejected'],
  ])('%s', (_, input, expected) => {
    expect(claimStatusFromAchievementStatus(input)).toBe(expected)
  })
})

describe('achievementToClaim', () => {
  it('old achievement without meta becomes self_achievement claim', () => {
    const achievement = makeAchievement({ meta: {} })
    const claim = achievementToClaim(achievement)

    expect(claim.type).toBe('self_achievement')
    expect(claim.subjectType).toBe('self')
    expect(claim.subjectName).toBeUndefined()
    expect(claim.thread).toBeUndefined()
  })

  it('pending status becomes unverified', () => {
    const achievement = makeAchievement({ status: 'pending' })
    const claim = achievementToClaim(achievement)
    expect(claim.status).toBe('unverified')
  })

  it('verified status stays verified', () => {
    const achievement = makeAchievement({ status: 'verified' })
    const claim = achievementToClaim(achievement)
    expect(claim.status).toBe('verified')
  })

  it('rejected status stays rejected', () => {
    const achievement = makeAchievement({ status: 'rejected' })
    const claim = achievementToClaim(achievement)
    expect(claim.status).toBe('rejected')
  })

  it('reads claim_type, subject_type, subject_name, thread from meta', () => {
    const achievement = makeAchievement({
      meta: {
        claim_type: 'flex',
        subject_type: 'organization',
        subject_name: 'Acme Corp',
        thread: 'thread-123',
      },
    })
    const claim = achievementToClaim(achievement)

    expect(claim.type).toBe('flex')
    expect(claim.subjectType).toBe('organization')
    expect(claim.subjectName).toBe('Acme Corp')
    expect(claim.thread).toBe('thread-123')
  })

  it('invalid meta values use safe defaults and do not crash', () => {
    const achievement = makeAchievement({
      meta: {
        claim_type: 42,
        subject_type: null,
        subject_name: 123,
        thread: {},
      },
    })
    const claim = achievementToClaim(achievement)

    expect(claim.type).toBe('self_achievement')
    expect(claim.subjectType).toBe('self')
    expect(claim.subjectName).toBeUndefined()
    expect(claim.thread).toBeUndefined()
    expect(claim.status).toBe('unverified')
  })

  it('unknown claim_type string falls back to default', () => {
    const achievement = makeAchievement({
      meta: { claim_type: 'bogus_value' },
    })
    const claim = achievementToClaim(achievement)
    expect(claim.type).toBe('self_achievement')
  })

  it('unknown subject_type string falls back to default', () => {
    const achievement = makeAchievement({
      meta: { subject_type: 'not_valid' },
    })
    const claim = achievementToClaim(achievement)
    expect(claim.subjectType).toBe('self')
  })

  it('copies base fields correctly', () => {
    const achievement = makeAchievement()
    const claim = achievementToClaim(achievement)

    expect(claim.id).toBe('ach-1')
    expect(claim.authorUserId).toBe('user-1')
    expect(claim.category).toBe('it')
    expect(claim.title).toBe('Test Achievement')
    expect(claim.description).toBe('Test description')
    expect(claim.year).toBe(2024)
    expect(claim.proofType).toBe('none')
    expect(claim.proofValue).toBeUndefined()
    expect(claim.claimAngle).toBe('judge')
    expect(claim.rejectionReason).toBeUndefined()
    expect(claim.createdAt).toBe('2024-06-01T00:00:00Z')
  })

  it('preserves rejectionReason when present', () => {
    const achievement = makeAchievement({
      status: 'rejected',
      rejectionReason: 'No proof provided',
    })
    const claim = achievementToClaim(achievement)
    expect(claim.rejectionReason).toBe('No proof provided')
  })

  it('preserves proofValue when present', () => {
    const achievement = makeAchievement({
      proofType: 'url',
      proofValue: 'https://example.com/proof',
    })
    const claim = achievementToClaim(achievement)
    expect(claim.proofValue).toBe('https://example.com/proof')
  })

  it('handles null meta gracefully', () => {
    const achievement = makeAchievement({ meta: null as unknown as Record<string, unknown> })
    const claim = achievementToClaim(achievement)

    expect(claim.type).toBe('self_achievement')
    expect(claim.subjectType).toBe('self')
  })

  it('empty string meta values fall back to defaults', () => {
    const achievement = makeAchievement({
      meta: {
        claim_type: '',
        subject_type: '',
        subject_name: '',
        thread: '',
      },
    })
    const claim = achievementToClaim(achievement)

    expect(claim.type).toBe('self_achievement')
    expect(claim.subjectType).toBe('self')
    expect(claim.subjectName).toBeUndefined()
    expect(claim.thread).toBeUndefined()
  })
})
