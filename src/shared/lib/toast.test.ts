import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useToastStore, showToast } from './toast'

describe('useToastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
    vi.useFakeTimers()
  })

  it('starts empty', () => {
    expect(useToastStore.getState().toasts).toEqual([])
  })

  it('add creates a toast', () => {
    showToast('success', 'Done')
    const toasts = useToastStore.getState().toasts
    expect(toasts.length).toBe(1)
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].message).toBe('Done')
  })

  it('add with different types', () => {
    showToast('error', 'Error')
    showToast('info', 'Info')
    showToast('warning', 'Warn')
    const toasts = useToastStore.getState().toasts
    expect(toasts.length).toBe(3)
    expect(toasts.map((t) => t.type)).toEqual(['error', 'info', 'warning'])
  })

  it('auto-removes after 4000ms', () => {
    showToast('success', 'auto')
    expect(useToastStore.getState().toasts.length).toBe(1)
    vi.advanceTimersByTime(4000)
    expect(useToastStore.getState().toasts.length).toBe(0)
  })

  it('remove manually', () => {
    showToast('success', 'manual')
    const id = useToastStore.getState().toasts[0].id
    useToastStore.getState().remove(id)
    expect(useToastStore.getState().toasts.length).toBe(0)
  })

  it('remove does not affect other toasts', () => {
    showToast('success', 'a')
    showToast('error', 'b')
    const id = useToastStore.getState().toasts[0].id
    useToastStore.getState().remove(id)
    expect(useToastStore.getState().toasts.length).toBe(1)
    expect(useToastStore.getState().toasts[0].message).toBe('b')
  })
})
