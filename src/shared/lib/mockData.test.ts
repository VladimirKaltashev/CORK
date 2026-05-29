import { describe, expect, it } from 'vitest'
import { MOCK_USERS, generateMockToken } from './mockData'

describe('mockData', () => {
  it('MOCK_USERS has at least one user', () => {
    expect(MOCK_USERS.length).toBeGreaterThan(0)
    expect(MOCK_USERS[0].id).toBe('1')
    expect(MOCK_USERS[0].name).toBe('Иван Петров')
  })

  it('generateMockToken returns string with userId', () => {
    const token = generateMockToken('42')
    expect(token).toContain('mock-token-42')
  })

  it('generateMockToken includes timestamp', () => {
    const token1 = generateMockToken('1')
    const token2 = generateMockToken('2')
    expect(token1).not.toBe(token2)
    expect(token1).toContain('mock-token-1')
    expect(token2).toContain('mock-token-2')
  })
})
