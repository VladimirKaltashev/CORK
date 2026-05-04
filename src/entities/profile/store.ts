import { create } from 'zustand'
import { api } from '@/shared/lib/api'
import type { Profile } from './types'
import type { UpdateProfileData } from '@/shared/schemas/profile'

interface ProfileStore {
  profiles: Record<string, Profile>
  isLoading: boolean
  fetchProfile: (id: string) => Promise<void>
  updateMyProfile: (data: UpdateProfileData) => Promise<void>
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profiles: {},
  isLoading: false,

  fetchProfile: async (id) => {
    set({ isLoading: true })
    try {
      const res = await api.get<Profile>(`/profile/${id}`)
      set((s) => ({ profiles: { ...s.profiles, [id]: res.data }, isLoading: false }))
    } catch {
      set({ isLoading: false })
    }
  },

  updateMyProfile: async (data) => {
    const res = await api.patch<Profile>('/profile/me', data)
    const updated = res.data
    set((s) => ({ profiles: { ...s.profiles, [updated.id]: updated } }))
  },
}))
