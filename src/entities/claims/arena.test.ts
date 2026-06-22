import { describe, expect, it } from 'vitest'
import { getArenaSortConfig, isLiveArenaStatus, LIVE_ARENA_STATUSES } from './arena'

describe('arena data helpers', () => {
  it('treats pending and verified as live Arena statuses', () => {
    expect(LIVE_ARENA_STATUSES).toEqual(['pending', 'verified'])
    expect(isLiveArenaStatus('pending')).toBe(true)
    expect(isLiveArenaStatus('verified')).toBe(true)
    expect(isLiveArenaStatus('rejected')).toBe(false)
  })

  it('maps Arena sort modes to server-side sort config', () => {
    expect(getArenaSortConfig('new')).toEqual({
      primaryColumn: 'created_at',
      needsControversyFilter: false,
    })
    expect(getArenaSortConfig('hot')).toEqual({
      primaryColumn: 'hot_score',
      needsControversyFilter: false,
    })
    expect(getArenaSortConfig('controversial')).toEqual({
      primaryColumn: 'controversy_score',
      needsControversyFilter: true,
    })
  })
})
