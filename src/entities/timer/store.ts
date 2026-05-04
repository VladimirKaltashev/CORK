import { create } from 'zustand'
import type { Subject, Checkpoint, TimerStatus } from '@/shared/types'

interface TimerState {
  subject: Subject | null
  elapsedSeconds: number
  status: TimerStatus
  checkpoints: Checkpoint[]
  showReportModal: boolean
  setSubject: (subject: Subject) => void
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  hideReportModal: () => void
  addCheckpoint: (text: string) => void
  removeCheckpoint: (id: string) => void
  reset: () => void
}

let timerInterval: ReturnType<typeof setInterval> | null = null

export const useTimerStore = create<TimerState>((set, get) => ({
  subject: null,
  elapsedSeconds: 0,
  status: 'idle',
  checkpoints: [],
  showReportModal: false,

  setSubject: (subject) => set({ subject }),

  start: () => {
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }))
    }, 1000)
    set({ status: 'running' })
  },

  pause: () => {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
    set({ status: 'paused' })
  },

  resume: () => {
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }))
    }, 1000)
    set({ status: 'running' })
  },

  stop: () => {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
    set({ status: 'paused', showReportModal: true })
  },

  hideReportModal: () => set({ showReportModal: false }),

  addCheckpoint: (text) => {
    const elapsed = get().elapsedSeconds
    set((s) => ({
      checkpoints: [...s.checkpoints, { id: crypto.randomUUID(), elapsedSeconds: elapsed, text }],
    }))
  },

  removeCheckpoint: (id) => set((s) => ({
    checkpoints: s.checkpoints.filter((c) => c.id !== id),
  })),

  reset: () => {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
    set({ subject: null, elapsedSeconds: 0, status: 'idle', checkpoints: [], showReportModal: false })
  },
}))
