import { create } from 'zustand'
import { supabase } from '@/shared/lib/supabase'

export type Role = 'admin' | 'moderator' | 'teacher' | 'user'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
}

interface AuthStore {
  token: string | null
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  updateUser: (patch: Partial<Omit<AuthUser, 'id'>>) => void
}

async function loadProfile(userId: string, email: string): Promise<AuthUser> {
  const { data } = await supabase
    .from('profiles')
    .select('id, name, is_admin')
    .eq('id', userId)
    .single()

  return {
    id: userId,
    email,
    name: data?.name ?? email.split('@')[0],
    role: data?.is_admin ? 'admin' : 'user',
  }
}

export const useAuthStore = create<AuthStore>()((set) => ({
  token: null,
  user: null,
  isLoading: true,

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const user = await loadProfile(data.user.id, data.user.email ?? email)
    set({ token: data.session.access_token, user })
  },

  register: async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) throw error
    if (!data.user) throw new Error('Не удалось создать пользователя')
    if (!data.session) throw new Error('Подтвердите email для входа')

    // Give the DB trigger time to create the profile row
    await new Promise((r) => setTimeout(r, 600))

    const user = await loadProfile(data.user.id, email)
    set({ token: data.session.access_token, user: { ...user, name } })
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ token: null, user: null })
  },

  checkAuth: async () => {
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        set({ token: null, user: null, isLoading: false })
        return
      }
      const { access_token, user: sbUser } = data.session
      const user = await loadProfile(sbUser.id, sbUser.email ?? '')
      set({ token: access_token, user, isLoading: false })
    } catch {
      set({ token: null, user: null, isLoading: false })
    }
  },

  updateUser: (patch) =>
    set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
}))
