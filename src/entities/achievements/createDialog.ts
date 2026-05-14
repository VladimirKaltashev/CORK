import { create } from 'zustand'

interface CreateAchievementDialogState {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useCreateAchievementDialog = create<CreateAchievementDialogState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
