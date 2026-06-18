import { describe, expect, it } from 'vitest'
import { claimTypeLabel, claimTypeEmoji, subjectTypeLabel, shouldShowClaimBadge } from './display'
import type { Claim, ClaimSubjectType, ClaimType } from './types'

describe('claimTypeLabel', () => {
  it.each<[ClaimType, string]>([
    ['self_achievement', 'Моё'],
    ['other_achievement', 'Нашёл'],
    ['fail', 'Фейл'],
    ['flex', 'Flex'],
    ['discovery', 'Находка'],
    ['debate', 'Спорно'],
    ['absurd', 'Абсурд'],
    ['organization', 'Орга/проект'],
  ])('%s -> %s', (type, expected) => {
    expect(claimTypeLabel(type)).toBe(expected)
  })
})

describe('claimTypeEmoji', () => {
  it.each<[ClaimType, string]>([
    ['self_achievement', '👤'],
    ['other_achievement', '🔎'],
    ['fail', '💥'],
    ['flex', '⚡'],
    ['discovery', '💎'],
    ['debate', '⚖️'],
    ['absurd', '🌀'],
    ['organization', '🏛️'],
  ])('%s -> %s', (type, expected) => {
    expect(claimTypeEmoji(type)).toBe(expected)
  })
})

describe('subjectTypeLabel', () => {
  it.each<[ClaimSubjectType, string]>([
    ['self', 'Я'],
    ['person', 'Человек'],
    ['organization', 'Организация'],
    ['project', 'Проект'],
    ['event', 'Событие'],
    ['internet', 'Интернет'],
    ['unknown', 'Неясно'],
  ])('%s -> %s', (type, expected) => {
    expect(subjectTypeLabel(type)).toBe(expected)
  })
})

describe('shouldShowClaimBadge', () => {
  function makeClaim(overrides: Partial<Claim> = {}): Claim {
    return {
      id: 'test',
      authorUserId: 'user-1',
      type: 'self_achievement',
      subjectType: 'self',
      category: 'other',
      title: 'Test',
      description: '',
      year: 2024,
      proofType: 'none',
      status: 'verified',
      meta: {},
      createdAt: '2024-01-01T00:00:00Z',
      ...overrides,
    }
  }

  it('self_achievement without subjectName or thread returns false', () => {
    expect(shouldShowClaimBadge(makeClaim())).toBe(false)
  })

  it('self_achievement with subjectName returns true', () => {
    expect(shouldShowClaimBadge(makeClaim({ subjectName: 'Alice' }))).toBe(true)
  })

  it('self_achievement with thread returns true', () => {
    expect(shouldShowClaimBadge(makeClaim({ thread: 'Полезная находка' }))).toBe(true)
  })

  it('other_achievement without subjectName or thread returns true', () => {
    expect(shouldShowClaimBadge(makeClaim({ type: 'other_achievement' }))).toBe(true)
  })

  it('fail returns true', () => {
    expect(shouldShowClaimBadge(makeClaim({ type: 'fail' }))).toBe(true)
  })

  it('flex returns true', () => {
    expect(shouldShowClaimBadge(makeClaim({ type: 'flex' }))).toBe(true)
  })

  it('discovery returns true', () => {
    expect(shouldShowClaimBadge(makeClaim({ type: 'discovery' }))).toBe(true)
  })

  it('debate returns true', () => {
    expect(shouldShowClaimBadge(makeClaim({ type: 'debate' }))).toBe(true)
  })

  it('absurd returns true', () => {
    expect(shouldShowClaimBadge(makeClaim({ type: 'absurd' }))).toBe(true)
  })

  it('organization returns true', () => {
    expect(shouldShowClaimBadge(makeClaim({ type: 'organization' }))).toBe(true)
  })

  it('whitespace subjectName is not significant', () => {
    expect(shouldShowClaimBadge(makeClaim({ subjectName: '   ' }))).toBe(false)
  })

  it('whitespace thread is not significant', () => {
    expect(shouldShowClaimBadge(makeClaim({ thread: '   ' }))).toBe(false)
  })
})
