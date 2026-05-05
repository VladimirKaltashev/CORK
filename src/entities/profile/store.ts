import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ProfileContacts {
  telegram?: string
  github?: string
  email?: string
  custom?: string
}

export interface LocalProfile {
  id: string
  name: string
  bio?: string
  contacts?: ProfileContacts
  avatar: string | null
  registeredAt: string
}

interface ProfileLocalState {
  profiles: Record<string, LocalProfile>
  setProfile: (profile: LocalProfile) => void
  updateProfile: (id: string, data: Partial<Omit<LocalProfile, 'id' | 'registeredAt'>>) => void
  getProfile: (id: string) => LocalProfile | undefined
}

export const useProfileStore = create<ProfileLocalState>()(
  persist(
    (set, get) => ({
      profiles: {},

      setProfile: (profile) =>
        set((s) => ({ profiles: { ...s.profiles, [profile.id]: profile } })),

      updateProfile: (id, data) =>
        set((s) => {
          const existing = s.profiles[id]
          if (!existing) return s
          return { profiles: { ...s.profiles, [id]: { ...existing, ...data } } }
        }),

      getProfile: (id) => get().profiles[id],
    }),
    { name: 'profile-storage' }
  )
)
