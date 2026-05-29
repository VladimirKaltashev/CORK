import { describe, expect, it, beforeEach, vi } from 'vitest'
import { useAchievementsStore } from './store'

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}))

type MockFn = ReturnType<typeof vi.fn>
const mockSupabase = (await vi.importMock('@/shared/lib/supabase') as { supabase: Record<string, MockFn> }).supabase

vi.mock('@/shared/lib/toast', () => ({
  showToast: vi.fn(),
}))

describe('useAchievementsStore', () => {
  beforeEach(() => {
    useAchievementsStore.setState({ achievements: [], isLoading: false })
    vi.clearAllMocks()
  })

  it('initial state', () => {
    const s = useAchievementsStore.getState()
    expect(s.achievements).toEqual([])
    expect(s.isLoading).toBe(false)
  })

  it('loadAchievements loads achievements', async () => {
    const mockData = [
      { id: 'a1', user_id: 'u1', category: 'olympiad', title: 'Win', description: 'desc', year: 2024, proof_type: 'none', status: 'verified', meta: {}, created_at: '2024-01-01' },
    ]
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValueOnce({ data: mockData, error: null }),
        })),
      })),
    })
    await useAchievementsStore.getState().loadAchievements('u1')
    const s = useAchievementsStore.getState()
    expect(s.achievements.length).toBe(1)
    expect(s.achievements[0].title).toBe('Win')
    expect(s.isLoading).toBe(false)
  })

  it('addAchievement adds achievement', async () => {
    const inserted = {
      id: 'a2', user_id: 'u1', category: 'sport', title: 'Medal', description: 'desc', year: 2023,
      proof_type: 'url', proof_value: 'http://img', status: 'pending', meta: {}, created_at: '2024-01-02',
    }
    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValueOnce({ data: inserted, error: null }),
        })),
      })),
    })
    await useAchievementsStore.getState().addAchievement({
      userId: 'u1',
      category: 'sport',
      title: 'Medal',
      description: 'desc',
      year: 2023,
      proofType: 'url',
      proofValue: 'http://img',
      meta: {},
    })
    const s = useAchievementsStore.getState()
    expect(s.achievements.length).toBe(1)
    expect(s.achievements[0].title).toBe('Medal')
  })

  it('updateAchievementStatus updates status', async () => {
    useAchievementsStore.setState({
      achievements: [{ id: 'a1', userId: 'u1', category: 'olympiad', title: 'Win', description: 'desc', year: 2024, proofType: 'none', status: 'pending', meta: {}, createdAt: '2024-01-01' }],
    })
    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValueOnce({ error: null }),
      })),
    })
    await useAchievementsStore.getState().updateAchievementStatus('a1', 'verified')
    const s = useAchievementsStore.getState()
    expect(s.achievements[0].status).toBe('verified')
  })

  it('reset clears achievements', () => {
    useAchievementsStore.setState({
      achievements: [{ id: 'a1', userId: 'u1', category: 'olympiad', title: 'Win', description: 'desc', year: 2024, proofType: 'none', status: 'verified', meta: {}, createdAt: '2024-01-01' }],
    })
    useAchievementsStore.getState().reset()
    expect(useAchievementsStore.getState().achievements).toEqual([])
  })
})
