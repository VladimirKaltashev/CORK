import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  setToken: (token: string | null) => void
  setUser: (user: AuthUser | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'auth-storage' },
  ),
)
