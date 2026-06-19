import { describe, expect, it } from 'vitest'
import { matchesClaimTypeFilter, parseClaimTypeFilter } from './filter'

describe('matchesClaimTypeFilter', () => {
  it('all matches everything', () => {
    expect(matchesClaimTypeFilter({ claim_type: 'fail' }, 'all')).toBe(true)
    expect(matchesClaimTypeFilter({ claim_type: 'flex' }, 'all')).toBe(true)
  })

  it('all matches empty meta', () => {
    expect(matchesClaimTypeFilter({}, 'all')).toBe(true)
  })

  it('fail matches fail meta', () => {
    expect(matchesClaimTypeFilter({ claim_type: 'fail' }, 'fail')).toBe(true)
  })

  it('fail does not match flex meta', () => {
    expect(matchesClaimTypeFilter({ claim_type: 'flex' }, 'fail')).toBe(false)
  })

  it('old empty meta matches self_achievement filter', () => {
    expect(matchesClaimTypeFilter({}, 'self_achievement')).toBe(true)
  })

  it('old empty meta does not match fail filter', () => {
    expect(matchesClaimTypeFilter({}, 'fail')).toBe(false)
  })

  it('invalid claim_type value still matches self_achievement filter', () => {
    expect(matchesClaimTypeFilter({ claim_type: 'bogus' }, 'self_achievement')).toBe(true)
  })

  it('invalid claim_type does not match other filters', () => {
    expect(matchesClaimTypeFilter({ claim_type: 'bogus' }, 'flex')).toBe(false)
  })

  it('empty meta falls back to self_achievement filter', () => {
    expect(matchesClaimTypeFilter({}, 'self_achievement')).toBe(true)
  })

  it('empty meta does not match fail', () => {
    expect(matchesClaimTypeFilter({}, 'fail')).toBe(false)
  })
})

describe('parseClaimTypeFilter', () => {
  it('null returns all', () => {
    expect(parseClaimTypeFilter(null)).toBe('all')
  })

  it('empty string returns all', () => {
    expect(parseClaimTypeFilter('')).toBe('all')
  })

  it('all returns all', () => {
    expect(parseClaimTypeFilter('all')).toBe('all')
  })

  it('fail returns fail', () => {
    expect(parseClaimTypeFilter('fail')).toBe('fail')
  })

  it('flex returns flex', () => {
    expect(parseClaimTypeFilter('flex')).toBe('flex')
  })

  it('organization returns organization', () => {
    expect(parseClaimTypeFilter('organization')).toBe('organization')
  })

  it('invalid value returns all', () => {
    expect(parseClaimTypeFilter('lol')).toBe('all')
  })

  it('uppercase invalid value returns all', () => {
    expect(parseClaimTypeFilter('FAIL')).toBe('all')
  })
})
