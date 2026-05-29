import { describe, expect, it, beforeEach, vi } from 'vitest'
import { usePlannerStore } from './store'
import { api } from '@/shared/lib/api'

vi.mock('@/shared/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('usePlannerStore', () => {
  beforeEach(() => {
    usePlannerStore.getState().reset()
    vi.clearAllMocks()
  })

  it('initial state', () => {
    const s = usePlannerStore.getState()
    expect(s.tasks).toEqual([])
    expect(s.sessions).toEqual([])
    expect(s.taskComments).toEqual({})
    expect(s.isLoadingTasks).toBe(false)
    expect(s.isLoadingSessions).toBe(false)
  })

  it('loadTasks fetches tasks', async () => {
    const mockTasks = [{ id: 't1', title: 'Task 1', priority: 'high', deadline: '2024-01-01', subject: 'math', completed: false, createdAt: '2024-01-01', commentsCount: 0 }]
    ;(vi.mocked(api.get)).mockResolvedValueOnce({ data: { tasks: mockTasks } })
    const store = usePlannerStore.getState()
    await store.loadTasks()
    const s = usePlannerStore.getState()
    expect(s.isLoadingTasks).toBe(false)
    expect(s.tasks.length).toBe(1)
    expect(s.tasks[0].title).toBe('Task 1')
  })

  it('loadSessions fetches sessions', async () => {
    const mockSessions = [{ id: 's1', userId: '1', subject: 'math', durationSeconds: 3600, checkpoints: [], report: 'report', completedAt: '2024-01-01' }]
    ;(vi.mocked(api.get)).mockResolvedValueOnce({ data: { sessions: mockSessions } })
    const store = usePlannerStore.getState()
    await store.loadSessions()
    const s = usePlannerStore.getState()
    expect(s.isLoadingSessions).toBe(false)
    expect(s.sessions.length).toBe(1)
  })

  it('createTask adds task to list', async () => {
    const newTask = { id: 't-new', title: 'New Task', priority: 'high', deadline: '2024-01-01', subject: 'math', description: 'desc', completed: false, createdAt: '2024-01-01', commentsCount: 0 }
    ;(vi.mocked(api.post)).mockResolvedValueOnce({ data: newTask })
    const store = usePlannerStore.getState()
    await store.createTask({ title: 'New Task', priority: 'high', deadline: '2024-01-01', subject: 'math', description: 'desc' })
    const s = usePlannerStore.getState()
    expect(s.tasks.length).toBe(1)
    expect(s.tasks[0].title).toBe('New Task')
  })

  it('updateTask updates existing task', async () => {
    const existing = { id: 't1', title: 'Old', priority: 'high', deadline: '2024-01-01', subject: 'math', completed: false, createdAt: '2024-01-01', commentsCount: 0 }
    const updated = { ...existing, title: 'Updated' }
    usePlannerStore.setState({ tasks: [existing as never] })
    ;(vi.mocked(api.patch)).mockResolvedValueOnce({ data: updated })
    const store = usePlannerStore.getState()
    await store.updateTask('t1', { title: 'Updated' })
    expect(usePlannerStore.getState().tasks[0].title).toBe('Updated')
  })

  it('toggleTask toggles completed flag', async () => {
    const task = { id: 't1', title: 'Task', priority: 'high', deadline: '2024-01-01', subject: 'math', completed: false, createdAt: '2024-01-01', commentsCount: 0 }
    usePlannerStore.setState({ tasks: [task as never] })
    ;(vi.mocked(api.patch)).mockResolvedValueOnce({ data: { ...task, completed: true } })
    const store = usePlannerStore.getState()
    await store.toggleTask('t1')
    expect(usePlannerStore.getState().tasks[0].completed).toBe(true)
  })

  it('toggleTask reverts on error', async () => {
    const task = { id: 't1', title: 'Task', priority: 'high', deadline: '2024-01-01', subject: 'math', completed: false, createdAt: '2024-01-01', commentsCount: 0 }
    usePlannerStore.setState({ tasks: [task as never] })
    ;(vi.mocked(api.patch)).mockRejectedValueOnce(new Error('fail'))
    const store = usePlannerStore.getState()
    await store.toggleTask('t1')
    expect(usePlannerStore.getState().tasks[0].completed).toBe(false)
  })

  it('addSession prepends session', () => {
    const store = usePlannerStore.getState()
    const session = { id: 's-new', userId: '1', subject: 'math', durationSeconds: 60, checkpoints: [], report: 'test', completedAt: new Date().toISOString() }
    store.addSession(session as never)
    expect(usePlannerStore.getState().sessions[0].id).toBe('s-new')
  })

  it('loadComments loads comments for task', async () => {
    const mockComments = [{ id: 'c1', taskId: 't1', text: 'hello', createdAt: '2024-01-01', userId: '1', userName: 'A' }]
    ;(vi.mocked(api.get)).mockResolvedValueOnce({ data: { comments: mockComments } })
    const store = usePlannerStore.getState()
    await store.loadComments('t1')
    const comments = usePlannerStore.getState().taskComments['t1']
    expect(comments?.length).toBe(1)
    expect(comments?.[0].text).toBe('hello')
  })

  it('addComment adds comment to task', async () => {
    const newComment = { id: 'c2', taskId: 't1', text: 'test comment', createdAt: '2024-01-01', userId: '1', userName: 'A' }
    ;(vi.mocked(api.post)).mockResolvedValueOnce({ data: newComment })
    const store = usePlannerStore.getState()
    await store.addComment('t1', 'test comment')
    const comments = usePlannerStore.getState().taskComments['t1']
    expect(comments?.length).toBe(1)
    expect(comments?.[0].text).toBe('test comment')
  })

  it('reset clears all data', async () => {
    const store = usePlannerStore.getState()
    await store.loadTasks()
    await store.loadSessions()
    store.reset()
    const s = usePlannerStore.getState()
    expect(s.tasks).toEqual([])
    expect(s.sessions).toEqual([])
    expect(s.taskComments).toEqual({})
  })
})
