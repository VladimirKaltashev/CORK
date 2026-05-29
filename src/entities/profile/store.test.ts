import { describe, expect, it, beforeEach, vi } from 'vitest'
import { useProfileStore } from './store'

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
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

describe('useProfileStore', () => {
  beforeEach(() => {
    useProfileStore.setState({ profiles: {}, isLoading: false })
    vi.clearAllMocks()
  })

  it('initial state', () => {
    const s = useProfileStore.getState()
    expect(s.profiles).toEqual({})
    expect(s.isLoading).toBe(false)
  })

  it('loadProfile loads profile', async () => {
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValueOnce({
            data: { id: 'u1', name: 'Test', bio: 'bio', contacts: { telegram: '@t' }, avatar: 'url', registered_at: '2024-01-01' },
            error: null,
          }),
        })),
      })),
    })
    await useProfileStore.getState().loadProfile('u1')
    const s = useProfileStore.getState()
    expect(s.profiles['u1']).toEqual({
      id: 'u1',
      name: 'Test',
      bio: 'bio',
      contacts: { telegram: '@t' },
      avatar: 'url',
      registeredAt: '2024-01-01',
    })
  })

  it('updateProfile updates profile', async () => {
    useProfileStore.setState({
      profiles: { u1: { id: 'u1', name: 'Old', bio: 'old', avatar: null, registeredAt: '2024-01-01' } },
    })
    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValueOnce({ error: null }),
      })),
    })
    await useProfileStore.getState().updateProfile('u1', { name: 'New', bio: 'new bio' })
    const s = useProfileStore.getState()
    expect(s.profiles['u1'].name).toBe('New')
    expect(s.profiles['u1'].bio).toBe('new bio')
  })

  it('getProfile returns existing profile', () => {
    useProfileStore.setState({
      profiles: { u1: { id: 'u1', name: 'Test', avatar: null, registeredAt: '2024-01-01' } },
    })
    expect(useProfileStore.getState().getProfile('u1')).toBeDefined()
    expect(useProfileStore.getState().getProfile('u2')).toBeUndefined()
  })
})
