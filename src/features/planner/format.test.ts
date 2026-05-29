import { describe, expect, it } from 'vitest'
import { formatElapsed } from './format'

describe('formatElapsed', () => {
  it('formats 0 seconds', () => {
    expect(formatElapsed(0)).toBe('00:00:00')
  })

  it('formats 1 second', () => {
    expect(formatElapsed(1)).toBe('00:00:01')
  })

  it('formats 59 seconds', () => {
    expect(formatElapsed(59)).toBe('00:00:59')
  })

  it('formats 1 minute', () => {
    expect(formatElapsed(60)).toBe('00:01:00')
  })

  it('formats 1 hour', () => {
    expect(formatElapsed(3600)).toBe('01:00:00')
  })

  it('formats 1 hour 1 minute 1 second', () => {
    expect(formatElapsed(3661)).toBe('01:01:01')
  })

  it('formats large value', () => {
    expect(formatElapsed(3661 + 3600 * 2 + 60 * 3)).toBe('03:04:01')
  })
})
