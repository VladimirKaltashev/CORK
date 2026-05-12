import { create } from 'zustand'

const STORAGE_KEY = 'onboarding_v1_completed'

interface OnboardingState {
  isActive: boolean
  step: number
  start: () => void
  next: () => void
  prev: () => void
  finish: () => void
  shouldShow: () => boolean
}

export const useOnboardingStore = create<OnboardingState>()((set, get) => ({
  isActive: false,
  step: 0,

  start: () => set({ isActive: true, step: 0 }),

  next: () => set({ step: get().step + 1 }),

  prev: () => set({ step: Math.max(0, get().step - 1) }),

  finish: () => {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore quota */ }
    set({ isActive: false, step: 0 })
  },

  shouldShow: () => {
    try { return localStorage.getItem(STORAGE_KEY) !== '1' } catch { return true }
  },
}))
