import { describe, expect, it, beforeEach, vi } from 'vitest'
import { useGroupStore } from './store'
import { api } from '@/shared/lib/api'

vi.mock('@/shared/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('useGroupStore', () => {
  beforeEach(() => {
    useGroupStore.setState({ groups: [], current: null, isLoading: false })
    vi.clearAllMocks()
  })

  it('initial state', () => {
    const s = useGroupStore.getState()
    expect(s.groups).toEqual([])
    expect(s.current).toBeNull()
    expect(s.isLoading).toBe(false)
  })

  it('fetchGroups loads groups', async () => {
    const groups = [
      { id: 'g1', name: 'Math', description: 'Math group', memberCount: 10, isSubscribed: false },
      { id: 'g2', name: 'Physics', description: 'Physics group', memberCount: 5, isSubscribed: true },
    ]
    ;(api.get as any).mockResolvedValueOnce({ data: groups })
    await useGroupStore.getState().fetchGroups()
    const s = useGroupStore.getState()
    expect(s.isLoading).toBe(false)
    expect(s.groups.length).toBe(2)
    expect(s.groups[0].name).toBe('Math')
  })

  it('fetchGroup loads single group', async () => {
    const group = { id: 'g1', name: 'Math', description: 'Math group', memberCount: 10, isSubscribed: false }
    ;(api.get as any).mockResolvedValueOnce({ data: group })
    await useGroupStore.getState().fetchGroup('g1')
    const s = useGroupStore.getState()
    expect(s.isLoading).toBe(false)
    expect(s.current?.name).toBe('Math')
  })

  it('subscribe toggles subscription', async () => {
    ;(api.post as any).mockResolvedValueOnce({ data: { success: true } })
    useGroupStore.setState({ groups: [{ id: 'g1', name: 'Math', description: 'Math group', memberCount: 10, isSubscribed: false }], current: null, isLoading: false })
    await useGroupStore.getState().subscribe('g1')
    const s = useGroupStore.getState()
    expect(s.groups[0].isSubscribed).toBe(true)
    expect(s.groups[0].memberCount).toBe(11)
  })
})
