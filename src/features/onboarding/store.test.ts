import { describe, expect, it, beforeEach, vi } from 'vitest'
import { useOnboardingStore } from './store'

const STORAGE_KEY = 'onboarding_v1_completed'

describe('useOnboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.getState().finish()
    localStorage.removeItem(STORAGE_KEY)
    useOnboardingStore.setState({ isActive: false, step: 0 })
  })

  it('initial state', () => {
    expect(useOnboardingStore.getState().isActive).toBe(false)
    expect(useOnboardingStore.getState().step).toBe(0)
  })

  it('start activates onboarding at step 0', () => {
    useOnboardingStore.getState().start()
    expect(useOnboardingStore.getState().isActive).toBe(true)
    expect(useOnboardingStore.getState().step).toBe(0)
  })

  it('next increments step', () => {
    useOnboardingStore.getState().start()
    useOnboardingStore.getState().next()
    expect(useOnboardingStore.getState().step).toBe(1)
  })

  it('prev decrements step but not below 0', () => {
    useOnboardingStore.getState().start()
    useOnboardingStore.getState().next()
    useOnboardingStore.getState().next()
    expect(useOnboardingStore.getState().step).toBe(2)
    useOnboardingStore.getState().prev()
    expect(useOnboardingStore.getState().step).toBe(1)
    useOnboardingStore.getState().prev()
    useOnboardingStore.getState().prev()
    expect(useOnboardingStore.getState().step).toBe(0)
  })

  it('finish deactivates and saves to localStorage', () => {
    useOnboardingStore.getState().start()
    useOnboardingStore.getState().next()
    useOnboardingStore.getState().finish()
    expect(useOnboardingStore.getState().isActive).toBe(false)
    expect(useOnboardingStore.getState().step).toBe(0)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('1')
  })

  it('shouldShow returns true when not completed', () => {
    localStorage.removeItem(STORAGE_KEY)
    expect(useOnboardingStore.getState().shouldShow()).toBe(true)
  })

  it('shouldShow returns false when completed', () => {
    useOnboardingStore.getState().finish()
    expect(useOnboardingStore.getState().shouldShow()).toBe(false)
  })
})
