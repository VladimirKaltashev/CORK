import { beforeEach, describe, expect, it } from 'vitest'
import { useFriendsStore, type FriendRecord } from './store'

const baseProfile = { id: 'p', name: 'X', avatar: null }

function record(over: Partial<FriendRecord>): FriendRecord {
  return {
    id: 'r',
    userId: 'me',
    friendId: 'other',
    status: 'accepted',
    createdAt: '2025-01-01',
    profile: baseProfile,
    ...over,
  }
}

describe('useFriendsStore — селекторы', () => {
  beforeEach(() => {
    useFriendsStore.setState({
      currentUserId: 'me',
      outgoing: [],
      incoming: [],
      isLoading: false,
    })
  })

  describe('getRelationship', () => {
    it('возвращает null, если нет связи', () => {
      expect(useFriendsStore.getState().getRelationship('nobody')).toBeNull()
    })

    it('находит исходящую заявку', () => {
      const r = record({ id: 'r1', userId: 'me', friendId: 'bob' })
      useFriendsStore.setState({ outgoing: [r] })
      const rel = useFriendsStore.getState().getRelationship('bob')
      expect(rel?.direction).toBe('outgoing')
      expect(rel?.record.id).toBe('r1')
    })

    it('находит входящую заявку', () => {
      const r = record({ id: 'r2', userId: 'alice', friendId: 'me', status: 'pending' })
      useFriendsStore.setState({ incoming: [r] })
      const rel = useFriendsStore.getState().getRelationship('alice')
      expect(rel?.direction).toBe('incoming')
      expect(rel?.record.status).toBe('pending')
    })
  })

  describe('acceptedFriendIds', () => {
    it('пустой массив, если currentUserId=null', () => {
      useFriendsStore.setState({ currentUserId: null })
      expect(useFriendsStore.getState().acceptedFriendIds()).toEqual([])
    })

    it('собирает id из обеих сторон, только accepted', () => {
      useFriendsStore.setState({
        outgoing: [
          record({ id: 'o1', friendId: 'bob', status: 'accepted' }),
          record({ id: 'o2', friendId: 'eve', status: 'pending' }),
        ],
        incoming: [
          record({ id: 'i1', userId: 'alice', friendId: 'me', status: 'accepted' }),
          record({ id: 'i2', userId: 'frank', friendId: 'me', status: 'pending' }),
        ],
      })
      const ids = useFriendsStore.getState().acceptedFriendIds()
      expect(ids).toContain('bob')
      expect(ids).toContain('alice')
      expect(ids).not.toContain('eve')
      expect(ids).not.toContain('frank')
      expect(ids).toHaveLength(2)
    })
  })

  describe('pendingIncomingCount', () => {
    it('считает только pending во входящих', () => {
      useFriendsStore.setState({
        incoming: [
          record({ id: 'i1', status: 'pending' }),
          record({ id: 'i2', status: 'pending' }),
          record({ id: 'i3', status: 'accepted' }),
        ],
      })
      expect(useFriendsStore.getState().pendingIncomingCount()).toBe(2)
    })

    it('возвращает 0 на пустом массиве', () => {
      expect(useFriendsStore.getState().pendingIncomingCount()).toBe(0)
    })
  })
})
