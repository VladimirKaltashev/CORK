import { create } from 'zustand'
import type { UserStudyStatus } from '@/shared/types'
import { api } from '@/shared/lib/api'

interface StatusState {
  status: UserStudyStatus
  setStatus: (status: UserStudyStatus) => void
  fetchStatus: (userId: string) => Promise<void>
}

export const useStatusStore = create<StatusState>((set) => ({
  status: { status: 'online' },

  setStatus: (status) => set({ status }),

  fetchStatus: async (userId) => {
    try {
      const response = await api.get<UserStudyStatus>(`/user/${userId}/status`)
      set({ status: response.data })
    } catch {
      // status is non-critical, fail silently
    }
  },
}))
