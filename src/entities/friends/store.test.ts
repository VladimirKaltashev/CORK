import { describe, expect, it, beforeEach, vi } from 'vitest'
import { useFriendsStore } from './store'

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        or: vi.fn(),
        eq: vi.fn(() => ({
          in: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        eq: vi.fn(),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}))

const mockSupabase = (await vi.importMock('@/shared/lib/supabase')).supabase

vi.mock('@/shared/lib/toast', () => ({
  showToast: vi.fn(),
}))

describe('useFriendsStore', () => {
  beforeEach(() => {
    useFriendsStore.setState({ currentUserId: null, outgoing: [], incoming: [], isLoading: false })
    vi.clearAllMocks()
  })

  it('initial state', () => {
    const s = useFriendsStore.getState()
    expect(s.outgoing).toEqual([])
    expect(s.incoming).toEqual([])
    expect(s.currentUserId).toBeNull()
  })

  it('loadFriendships loads friends', async () => {
    const friends = [
      { id: 'f1', user_id: 'u1', friend_id: 'u2', status: 'accepted', created_at: '2024-01-01' },
      { id: 'f2', user_id: 'u2', friend_id: 'u1', status: 'pending', created_at: '2024-01-02' },
    ]
    const profiles = [{ id: 'u2', name: 'User2', avatar: null }]
    mockSupabase.from
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          or: vi.fn().mockResolvedValueOnce({ data: friends, error: null }),
        })),
      })
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          in: vi.fn().mockResolvedValueOnce({ data: profiles, error: null }),
        })),
      })
    await useFriendsStore.getState().loadFriendships('u1')
    const s = useFriendsStore.getState()
    expect(s.outgoing.length).toBe(1)
    expect(s.incoming.length).toBe(1)
    expect(s.currentUserId).toBe('u1')
  })

  it('sendRequest sends friend request', async () => {
    const friends = [{ id: 'f1', user_id: 'u1', friend_id: 'u2', status: 'pending', created_at: '2024-01-01' }]
    const profiles = [{ id: 'u2', name: 'User2', avatar: null }]
    mockSupabase.from
      .mockReturnValueOnce({
        insert: vi.fn().mockResolvedValueOnce({ error: null }),
      })
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          or: vi.fn().mockResolvedValueOnce({ data: friends, error: null }),
        })),
      })
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          in: vi.fn().mockResolvedValueOnce({ data: profiles, error: null }),
        })),
      })
    useFriendsStore.setState({ currentUserId: 'u1' })
    await useFriendsStore.getState().sendRequest('u2')
    const s = useFriendsStore.getState()
    expect(s.outgoing.length).toBe(1)
  })

  it('acceptRequest accepts friend request', async () => {
    const friends = [{ id: 'f2', user_id: 'u2', friend_id: 'u1', status: 'accepted', created_at: '2024-01-02' }]
    const profiles = [{ id: 'u2', name: 'User2', avatar: null }]
    mockSupabase.from
      .mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValueOnce({ error: null }),
        })),
      })
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          or: vi.fn().mockResolvedValueOnce({ data: friends, error: null }),
        })),
      })
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          in: vi.fn().mockResolvedValueOnce({ data: profiles, error: null }),
        })),
      })
    useFriendsStore.setState({ currentUserId: 'u1' })
    await useFriendsStore.getState().acceptRequest('f2')
    const s = useFriendsStore.getState()
    expect(s.incoming[0].status).toBe('accepted')
  })

  it('removeRecord removes friend', async () => {
    const friends = []
    const profiles = []
    mockSupabase.from
      .mockReturnValueOnce({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValueOnce({ error: null }),
        })),
      })
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          or: vi.fn().mockResolvedValueOnce({ data: friends, error: null }),
        })),
      })
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          in: vi.fn().mockResolvedValueOnce({ data: profiles, error: null }),
        })),
      })
    useFriendsStore.setState({ currentUserId: 'u1' })
    await useFriendsStore.getState().removeRecord('f1')
    expect(useFriendsStore.getState().outgoing).toEqual([])
  })

  it('getRelationship returns outgoing', () => {
    useFriendsStore.setState({
      currentUserId: 'u1',
      outgoing: [{ id: 'f1', userId: 'u1', friendId: 'u2', status: 'pending', createdAt: '2024-01-01', profile: { id: 'u2', name: 'B', avatar: null } }],
    })
    const rel = useFriendsStore.getState().getRelationship('u2')
    expect(rel?.direction).toBe('outgoing')
  })

  it('getRelationship returns incoming', () => {
    useFriendsStore.setState({
      currentUserId: 'u1',
      incoming: [{ id: 'f2', userId: 'u2', friendId: 'u1', status: 'pending', createdAt: '2024-01-01', profile: { id: 'u2', name: 'B', avatar: null } }],
    })
    const rel = useFriendsStore.getState().getRelationship('u2')
    expect(rel?.direction).toBe('incoming')
  })

  it('getRelationship returns null for unrelated', () => {
    expect(useFriendsStore.getState().getRelationship('u99')).toBeNull()
  })

  it('acceptedFriendIds returns accepted friend ids', () => {
    useFriendsStore.setState({
      currentUserId: 'u1',
      outgoing: [{ id: 'f1', userId: 'u1', friendId: 'u2', status: 'accepted', createdAt: '2024-01-01', profile: { id: 'u2', name: 'B', avatar: null } }],
      incoming: [{ id: 'f2', userId: 'u3', friendId: 'u1', status: 'accepted', createdAt: '2024-01-01', profile: { id: 'u3', name: 'C', avatar: null } }],
    })
    const ids = useFriendsStore.getState().acceptedFriendIds()
    expect(ids).toContain('u2')
    expect(ids).toContain('u3')
  })

  it('pendingIncomingCount returns pending count', () => {
    useFriendsStore.setState({
      incoming: [
        { id: 'f1', userId: 'u2', friendId: 'u1', status: 'pending', createdAt: '2024-01-01', profile: { id: 'u2', name: 'B', avatar: null } },
        { id: 'f2', userId: 'u3', friendId: 'u1', status: 'pending', createdAt: '2024-01-01', profile: { id: 'u3', name: 'C', avatar: null } },
      ],
    })
    expect(useFriendsStore.getState().pendingIncomingCount()).toBe(2)
  })
})
