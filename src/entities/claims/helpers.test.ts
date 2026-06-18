import { describe, expect, it } from 'vitest'
import { buildClaimMeta, defaultSubjectTypeForClaimType } from './helpers'
import type { ClaimSubjectType, ClaimType } from './types'

describe('defaultSubjectTypeForClaimType', () => {
  it.each<[ClaimType, ClaimSubjectType]>([
    ['self_achievement', 'self'],
    ['other_achievement', 'person'],
    ['fail', 'internet'],
    ['flex', 'self'],
    ['discovery', 'project'],
    ['debate', 'unknown'],
    ['absurd', 'internet'],
    ['organization', 'organization'],
  ])('%s -> %s', (claimType, expected) => {
    expect(defaultSubjectTypeForClaimType(claimType)).toBe(expected)
  })
})

describe('buildClaimMeta', () => {
  it('writes claim_type and subject_type always', () => {
    const meta = buildClaimMeta({
      claimType: 'flex',
      subjectType: 'self',
    })

    expect(meta.claim_type).toBe('flex')
    expect(meta.subject_type).toBe('self')
  })

  it('default claim_type self_achievement and subject_type self', () => {
    const meta = buildClaimMeta({
      claimType: 'self_achievement',
      subjectType: 'self',
    })

    expect(meta.claim_type).toBe('self_achievement')
    expect(meta.subject_type).toBe('self')
  })

  it('includes subject_name when provided and non-empty', () => {
    const meta = buildClaimMeta({
      claimType: 'other_achievement',
      subjectType: 'person',
      subjectName: 'Alice',
    })

    expect(meta.subject_name).toBe('Alice')
  })

  it('does NOT include subject_name when empty', () => {
    const meta = buildClaimMeta({
      claimType: 'flex',
      subjectType: 'self',
      subjectName: '',
    })

    expect(meta.subject_name).toBeUndefined()
  })

  it('does NOT include subject_name when whitespace only', () => {
    const meta = buildClaimMeta({
      claimType: 'flex',
      subjectType: 'self',
      subjectName: '   ',
    })

    expect(meta.subject_name).toBeUndefined()
  })

  it('preserves event_date alongside claim fields', () => {
    const meta = buildClaimMeta({
      eventDate: '2024-06-15',
      claimType: 'fail',
      subjectType: 'internet',
    })

    expect(meta.event_date).toBe('2024-06-15')
    expect(meta.claim_type).toBe('fail')
    expect(meta.subject_type).toBe('internet')
  })

  it('does NOT include event_date when null', () => {
    const meta = buildClaimMeta({
      eventDate: null,
      claimType: 'self_achievement',
      subjectType: 'self',
    })

    expect(meta.event_date).toBeUndefined()
  })

  it('includes thread when provided and non-empty', () => {
    const meta = buildClaimMeta({
      claimType: 'debate',
      subjectType: 'unknown',
      thread: 'Самый неуклюжий',
    })

    expect(meta.thread).toBe('Самый неуклюжий')
  })

  it('does NOT include thread when empty', () => {
    const meta = buildClaimMeta({
      claimType: 'debate',
      subjectType: 'unknown',
      thread: '',
    })

    expect(meta.thread).toBeUndefined()
  })

  it('only claim_type and subject_type when nothing else is provided', () => {
    const meta = buildClaimMeta({
      claimType: 'absurd',
      subjectType: 'internet',
    })

    expect(Object.keys(meta)).toEqual(['claim_type', 'subject_type'])
    expect(meta.claim_type).toBe('absurd')
    expect(meta.subject_type).toBe('internet')
  })

  it('trims subject_name before including', () => {
    const meta = buildClaimMeta({
      claimType: 'organization',
      subjectType: 'organization',
      subjectName: '  Acme Corp  ',
    })

    expect(meta.subject_name).toBe('Acme Corp')
  })
})
