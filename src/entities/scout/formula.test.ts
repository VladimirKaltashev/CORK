import { describe, it, expect } from 'vitest'

// Mirror of the SQL view formula for unit testing
function calculateScoutScore(
  crowns: number,
  clowns: number,
  comments: number,
): number {
  const controversyBonus =
    crowns > 0 && clowns > 0 ? Math.min(crowns, clowns) * 2 : 0
  return crowns * 2 + clowns * 2 + comments * 3 + controversyBonus
}

describe('Scout Score formula', () => {
  it('no reactions/comments → 0', () => {
    expect(calculateScoutScore(0, 0, 0)).toBe(0)
  })

  it('crowns only', () => {
    expect(calculateScoutScore(3, 0, 0)).toBe(6)
  })

  it('clowns only', () => {
    expect(calculateScoutScore(0, 4, 0)).toBe(8)
  })

  it('comments only', () => {
    expect(calculateScoutScore(0, 0, 5)).toBe(15)
  })

  it('mixed without controversy', () => {
    expect(calculateScoutScore(2, 0, 1)).toBe(7)
  })

  it('controversy bonus', () => {
    // 3 crowns, 2 clowns, 0 comments
    // crowns*2 + clowns*2 + comments*3 + min(3,2)*2
    // = 6 + 4 + 0 + 4 = 14
    expect(calculateScoutScore(3, 2, 0)).toBe(14)
  })

  it('full mix', () => {
    // 5 crowns, 3 clowns, 4 comments
    // = 10 + 6 + 12 + 6 = 34
    expect(calculateScoutScore(5, 3, 4)).toBe(34)
  })
})
