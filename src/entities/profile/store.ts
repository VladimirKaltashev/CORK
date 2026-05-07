import { create } from 'zustand'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'

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
  isLoading: boolean
  loadProfile: (userId: string) => Promise<void>
  updateProfile: (id: string, data: Partial<Omit<LocalProfile, 'id' | 'registeredAt'>>) => Promise<void>
  getProfile: (id: string) => LocalProfile | undefined
}

export const useProfileStore = create<ProfileLocalState>()((set, get) => ({
  profiles: {},
  isLoading: false,

  loadProfile: async (userId) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, bio, contacts, avatar, registered_at')
        .eq('id', userId)
        .single()
      if (error) throw error
      const profile: LocalProfile = {
        id: data.id,
        name: data.name,
        bio: data.bio ?? undefined,
        contacts: data.contacts ?? undefined,
        avatar: data.avatar ?? null,
        registeredAt: data.registered_at,
      }
      set((s) => ({ profiles: { ...s.profiles, [userId]: profile } }))
    } catch {
      showToast('error', 'Не удалось загрузить профиль')
    } finally {
      set({ isLoading: false })
    }
  },

  updateProfile: async (id, data) => {
    const dbData: Record<string, unknown> = {}
    if ('name' in data) dbData.name = data.name
    if ('bio' in data) dbData.bio = data.bio ?? null
    if ('contacts' in data) dbData.contacts = data.contacts ?? null
    if ('avatar' in data) dbData.avatar = data.avatar

    try {
      const { error } = await supabase
        .from('profiles')
        .update(dbData)
        .eq('id', id)
      if (error) throw error
      set((s) => {
        const existing = s.profiles[id]
        if (!existing) return s
        return { profiles: { ...s.profiles, [id]: { ...existing, ...data } } }
      })
      showToast('success', 'Профиль сохранён')
    } catch {
      showToast('error', 'Не удалось сохранить профиль')
    }
  },

  getProfile: (id) => get().profiles[id],
}))
