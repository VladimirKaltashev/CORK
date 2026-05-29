import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { useTimerStore } from './store'

describe('Timer store', () => {
  beforeEach(() => {
    useTimerStore.getState().reset()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    useTimerStore.getState().reset()
  })

  it('initial state is idle', () => {
    const s = useTimerStore.getState()
    expect(s.status).toBe('idle')
    expect(s.elapsedSeconds).toBe(0)
    expect(s.subject).toBeNull()
    expect(s.checkpoints).toEqual([])
    expect(s.showReportModal).toBe(false)
  })

  it('setSubject updates subject', () => {
    useTimerStore.getState().setSubject('math')
    expect(useTimerStore.getState().subject).toBe('math')
  })

  it('start sets status to running and increments elapsedSeconds', () => {
    useTimerStore.getState().start()
    expect(useTimerStore.getState().status).toBe('running')
    vi.advanceTimersByTime(3000)
    expect(useTimerStore.getState().elapsedSeconds).toBe(3)
  })

  it('pause stops timer and sets status to paused', () => {
    useTimerStore.getState().start()
    vi.advanceTimersByTime(2000)
    useTimerStore.getState().pause()
    expect(useTimerStore.getState().status).toBe('paused')
    vi.advanceTimersByTime(3000)
    expect(useTimerStore.getState().elapsedSeconds).toBe(2)
  })

  it('resume restarts timer from paused', () => {
    useTimerStore.getState().start()
    vi.advanceTimersByTime(2000)
    useTimerStore.getState().pause()
    useTimerStore.getState().resume()
    vi.advanceTimersByTime(3000)
    expect(useTimerStore.getState().elapsedSeconds).toBe(5)
    expect(useTimerStore.getState().status).toBe('running')
  })

  it('stop clears timer and shows report modal', () => {
    useTimerStore.getState().start()
    vi.advanceTimersByTime(1000)
    useTimerStore.getState().stop()
    expect(useTimerStore.getState().status).toBe('paused')
    expect(useTimerStore.getState().showReportModal).toBe(true)
    vi.advanceTimersByTime(3000)
    expect(useTimerStore.getState().elapsedSeconds).toBe(1)
  })

  it('hideReportModal hides modal', () => {
    useTimerStore.getState().start()
    useTimerStore.getState().stop()
    expect(useTimerStore.getState().showReportModal).toBe(true)
    useTimerStore.getState().hideReportModal()
    expect(useTimerStore.getState().showReportModal).toBe(false)
  })

  it('addCheckpoint adds checkpoint with current elapsed', () => {
    useTimerStore.getState().setSubject('physics')
    useTimerStore.getState().start()
    vi.advanceTimersByTime(5000)
    useTimerStore.getState().addCheckpoint('reviewed optics')
    const cps = useTimerStore.getState().checkpoints
    expect(cps.length).toBe(1)
    expect(cps[0].elapsedSeconds).toBe(5)
    expect(cps[0].text).toBe('reviewed optics')
    expect(cps[0].id).toBeDefined()
  })

  it('removeCheckpoint removes by id', () => {
    useTimerStore.getState().start()
    vi.advanceTimersByTime(1000)
    useTimerStore.getState().addCheckpoint('a')
    const id = useTimerStore.getState().checkpoints[0].id
    useTimerStore.getState().addCheckpoint('b')
    expect(useTimerStore.getState().checkpoints.length).toBe(2)
    useTimerStore.getState().removeCheckpoint(id)
    expect(useTimerStore.getState().checkpoints.length).toBe(1)
    expect(useTimerStore.getState().checkpoints[0].text).toBe('b')
  })

  it('reset clears everything and stops timer', () => {
    useTimerStore.getState().setSubject('math')
    useTimerStore.getState().start()
    vi.advanceTimersByTime(3000)
    useTimerStore.getState().addCheckpoint('x')
    useTimerStore.getState().reset()
    const s = useTimerStore.getState()
    expect(s.status).toBe('idle')
    expect(s.elapsedSeconds).toBe(0)
    expect(s.subject).toBeNull()
    expect(s.checkpoints).toEqual([])
    expect(s.showReportModal).toBe(false)
    vi.advanceTimersByTime(5000)
    expect(s.elapsedSeconds).toBe(0)
  })
})
