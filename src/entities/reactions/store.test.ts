import { describe, expect, it, beforeEach, vi } from 'vitest'
import { useReactionsStore } from './store'

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(),
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
        })),
      })),
    })),
    rpc: vi.fn(),
  },
}))

type MockFn = ReturnType<typeof vi.fn>
const mockSupabase = (await vi.importMock('@/shared/lib/supabase') as { supabase: Record<string, MockFn> }).supabase

vi.mock('@/shared/lib/toast', () => ({
  showToast: vi.fn(),
}))

describe('useReactionsStore', () => {
  beforeEach(() => {
    useReactionsStore.getState().reset()
    vi.clearAllMocks()
  })

  it('initial state', () => {
    const s = useReactionsStore.getState()
    expect(s.byAchievement).toEqual({})
    expect(s.budgetRemaining).toBe(10)
    expect(s.budgetSpent).toBe(0)
    expect(s.budgetLoaded).toBe(false)
  })

  it('loadForAchievements loads reactions', async () => {
    const rows = [
      { achievement_id: 'a1', user_id: 'u1', kind: 'crown' },
      { achievement_id: 'a1', user_id: 'u2', kind: 'clown' },
    ]
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        in: vi.fn().mockResolvedValueOnce({ data: rows, error: null }),
      })),
    })
    await useReactionsStore.getState().loadForAchievements(['a1'], 'u1')
    const s = useReactionsStore.getState()
    expect(s.byAchievement['a1']).toEqual({ crowns: 1, clowns: 1, myKind: 'crown' })
  })

  it('loadBudget loads budget', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: { spent: 3, remaining: 7, week_start: '2024-01-01' },
      error: null,
    })
    await useReactionsStore.getState().loadBudget()
    const s = useReactionsStore.getState()
    expect(s.budgetRemaining).toBe(7)
    expect(s.budgetSpent).toBe(3)
    expect(s.budgetLoaded).toBe(true)
  })

  it('toggle crown on new achievement', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: { kind: 'crown', spent: 1, remaining: 9 },
      error: null,
    })
    await useReactionsStore.getState().toggle('a1', 'crown')
    const s = useReactionsStore.getState()
    expect(s.byAchievement['a1']).toEqual({ crowns: 1, clowns: 0, myKind: 'crown' })
    expect(s.budgetRemaining).toBe(9)
    expect(s.budgetSpent).toBe(1)
  })

  it('toggle crown off removes reaction', async () => {
    useReactionsStore.setState({
      byAchievement: { a1: { crowns: 1, clowns: 0, myKind: 'crown' } },
      budgetRemaining: 9,
      budgetSpent: 1,
    })
    mockSupabase.rpc.mockResolvedValueOnce({
      data: { kind: null, spent: 0, remaining: 10 },
      error: null,
    })
    await useReactionsStore.getState().toggle('a1', 'crown')
    const s = useReactionsStore.getState()
    expect(s.byAchievement['a1'].myKind).toBeNull()
    expect(s.budgetRemaining).toBe(10)
  })

  it('toggle switches from crown to clown', async () => {
    useReactionsStore.setState({
      byAchievement: { a1: { crowns: 1, clowns: 0, myKind: 'crown' } },
      budgetRemaining: 9,
      budgetSpent: 1,
    })
    mockSupabase.rpc.mockResolvedValueOnce({
      data: { kind: 'clown', spent: 2, remaining: 8 },
      error: null,
    })
    await useReactionsStore.getState().toggle('a1', 'clown')
    const s = useReactionsStore.getState()
    expect(s.byAchievement['a1'].myKind).toBe('clown')
    expect(s.budgetRemaining).toBe(8)
  })

  it('toggle rollback on error', async () => {
    useReactionsStore.setState({
      byAchievement: { a1: { crowns: 0, clowns: 0, myKind: null } },
      budgetRemaining: 10,
      budgetSpent: 0,
    })
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'budget exceeded' },
    })
    await useReactionsStore.getState().toggle('a1', 'crown')
    const s = useReactionsStore.getState()
    expect(s.byAchievement['a1'].myKind).toBeNull()
    expect(s.budgetRemaining).toBe(10)
    expect(s.budgetSpent).toBe(0)
  })

  it('toggle does not call pending achievement', async () => {
    useReactionsStore.setState({
      pending: new Set(['a1']),
    })
    await useReactionsStore.getState().toggle('a1', 'crown')
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })

  it('loadScoresFor loads scores', async () => {
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValueOnce({
            data: { crowns: 5, clowns: 2 },
            error: null,
          }),
        })),
      })),
    })
    await useReactionsStore.getState().loadScoresFor('u1')
    const s = useReactionsStore.getState()
    expect(s.userScores['u1']).toEqual({ crowns: 5, clowns: 2 })
  })

  it('reset clears state', () => {
    useReactionsStore.setState({
      byAchievement: { a1: { crowns: 1, clowns: 0, myKind: 'crown' } },
      budgetRemaining: 5,
      budgetSpent: 5,
    })
    useReactionsStore.getState().reset()
    const s = useReactionsStore.getState()
    expect(s.byAchievement).toEqual({})
    expect(s.budgetRemaining).toBe(10)
    expect(s.budgetSpent).toBe(0)
  })
})
