import { describe, expect, it, beforeEach, vi } from 'vitest'
import { useAuthStore } from './useAuthStore'

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}))

const mockSupabase = (await vi.importMock('@/shared/lib/supabase')).supabase

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null, isLoading: true })
    vi.clearAllMocks()
  })

  it('initial state', () => {
    const s = useAuthStore.getState()
    expect(s.token).toBeNull()
    expect(s.user).toBeNull()
    expect(s.isLoading).toBe(true)
  })

  it('login sets token and user', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: {
        user: { id: 'u1', email: 'test@test.com' },
        session: { access_token: 'token123' },
      },
      error: null,
    })
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValueOnce({
            data: { name: 'Test', is_admin: false },
            error: null,
          }),
        })),
      })),
    })
    await useAuthStore.getState().login('test@test.com', 'password')
    const s = useAuthStore.getState()
    expect(s.token).toBe('token123')
    expect(s.user).toEqual({ id: 'u1', email: 'test@test.com', name: 'Test', role: 'user' })
  })

  it('login throws on error', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid credentials' },
    })
    await expect(useAuthStore.getState().login('test@test.com', 'wrong')).rejects.toBeDefined()
  })

  it('register sets token and user', async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: {
        user: { id: 'u2', email: 'new@test.com' },
        session: { access_token: 'token456' },
      },
      error: null,
    })
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValueOnce({
            data: { name: 'New', is_admin: false },
            error: null,
          }),
        })),
      })),
    })
    await useAuthStore.getState().register('New', 'new@test.com', 'password')
    const s = useAuthStore.getState()
    expect(s.token).toBe('token456')
    expect(s.user?.name).toBe('New')
  })

  it('register throws without session', async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'u3', email: 'new@test.com' }, session: null },
      error: null,
    })
    await expect(useAuthStore.getState().register('New', 'new@test.com', 'pass')).rejects.toThrow('Подтвердите email для входа')
  })

  it('logout clears state', async () => {
    useAuthStore.setState({ token: 'abc', user: { id: 'u1', name: 'A', email: 'a@a.com', role: 'user' } })
    mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null })
    await useAuthStore.getState().logout()
    const s = useAuthStore.getState()
    expect(s.token).toBeNull()
    expect(s.user).toBeNull()
  })

  it('checkAuth with session sets token and user', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { access_token: 'tok', user: { id: 'u1', email: 'test@test.com' } } },
      error: null,
    })
    const singleFn = vi.fn().mockResolvedValueOnce({
      data: { name: 'Test', is_admin: true },
      error: null,
    })
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: singleFn,
        })),
      })),
    })
    await useAuthStore.getState().checkAuth()
    const s = useAuthStore.getState()
    expect(s.token).toBe('tok')
    expect(s.user?.role).toBe('admin')
    expect(s.isLoading).toBe(false)
  })

  it('checkAuth without session clears state', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    })
    await useAuthStore.getState().checkAuth()
    const s = useAuthStore.getState()
    expect(s.token).toBeNull()
    expect(s.user).toBeNull()
    expect(s.isLoading).toBe(false)
  })

  it('updateUser patches user', () => {
    useAuthStore.setState({
      user: { id: 'u1', name: 'Old', email: 'test@test.com', role: 'user' },
    })
    useAuthStore.getState().updateUser({ name: 'New' })
    expect(useAuthStore.getState().user?.name).toBe('New')
  })

  it('updateUser does nothing if no user', () => {
    useAuthStore.setState({ user: null })
    useAuthStore.getState().updateUser({ name: 'New' })
    expect(useAuthStore.getState().user).toBeNull()
  })
})
