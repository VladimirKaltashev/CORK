import { describe, expect, it, beforeEach } from 'vitest'
import { usePlannerStore } from '@/entities/planner'

describe('Planner integration', () => {
  beforeEach(() => {
    usePlannerStore.setState({
      tasks: [],
      sessions: [],
      taskComments: {},
      isLoadingTasks: false,
      isLoadingSessions: false,
    })
  })

  it('loads tasks from MSW backend', async () => {
    await usePlannerStore.getState().loadTasks()
    const tasks = usePlannerStore.getState().tasks
    expect(tasks.length).toBeGreaterThan(0)
    expect(tasks[0].title).toBeDefined()
  })

  it('creates a task through MSW and persists it', async () => {
    const newTask = {
      title: 'Integration test task',
      priority: 'medium' as const,
      deadline: new Date().toISOString(),
      subject: 'math' as const,
      description: 'Created by integration test',
    }
    await usePlannerStore.getState().createTask(newTask)

    const tasks = usePlannerStore.getState().tasks
    expect(tasks.some((t) => t.title === 'Integration test task')).toBe(true)

    // Reset store and reload to verify MSW DB persistence
    usePlannerStore.setState({ tasks: [] })
    await usePlannerStore.getState().loadTasks()
    const reloaded = usePlannerStore.getState().tasks
    expect(reloaded.some((t) => t.title === 'Integration test task')).toBe(true)
  })

  it('toggles task completion', async () => {
    await usePlannerStore.getState().loadTasks()
    const tasks = usePlannerStore.getState().tasks
    const task = tasks.find((t) => !t.completed)
    if (!task) {
      // Create a task if none found
      await usePlannerStore.getState().createTask({
        title: 'Toggle test',
        priority: 'low' as const,
        deadline: new Date().toISOString(),
      })
      const allTasks = usePlannerStore.getState().tasks
      const created = allTasks.find((t) => t.title === 'Toggle test')!
      await usePlannerStore.getState().toggleTask(created.id)
      const updated = usePlannerStore.getState().tasks.find((t) => t.id === created.id)
      expect(updated?.completed).toBe(true)
    } else {
      await usePlannerStore.getState().toggleTask(task.id)
      const updated = usePlannerStore.getState().tasks.find((t) => t.id === task.id)
      expect(updated?.completed).toBe(!task.completed)
    }
  })

  it('loads planner sessions from MSW', async () => {
    await usePlannerStore.getState().loadSessions()
    const sessions = usePlannerStore.getState().sessions
    expect(sessions.length).toBeGreaterThan(0)
    expect(sessions[0].subject).toBeDefined()
  })

  it('loads comments for a task', async () => {
    await usePlannerStore.getState().loadTasks()
    const tasks = usePlannerStore.getState().tasks
    const task = tasks.find((t) => (t.commentsCount ?? 0) > 0)
    if (!task) return // skip if no seeded task has comments

    await usePlannerStore.getState().loadComments(task.id)
    const comments = usePlannerStore.getState().taskComments[task.id]
    expect(comments.length).toBeGreaterThan(0)
  })

  it('adds a comment to a task', async () => {
    await usePlannerStore.getState().loadTasks()
    const tasks = usePlannerStore.getState().tasks
    if (tasks.length === 0) return

    const task = tasks[0]
    await usePlannerStore.getState().addComment(task.id, 'Test comment')
    const comments = usePlannerStore.getState().taskComments[task.id]
    expect(comments.length).toBeGreaterThan(0)
    expect(comments.some((c) => c.text === 'Test comment')).toBe(true)
  })
})
