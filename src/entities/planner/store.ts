import { create } from 'zustand'
import type { Task, TaskComment, StudySession, TaskPriority, Subject } from '@/shared/types'
import { api } from '@/shared/lib/api'
import { showToast } from '@/shared/lib/toast'

type UpdateTaskData = Partial<Pick<Task, 'title' | 'priority' | 'deadline' | 'subject' | 'description' | 'completed'>>

interface TaskCreatePayload {
  title: string
  priority: TaskPriority
  deadline: string
  subject?: Subject
  description?: string
}

interface PlannerState {
  tasks: Task[]
  sessions: StudySession[]
  taskComments: Record<string, TaskComment[]>
  isLoadingTasks: boolean
  isLoadingSessions: boolean
  loadTasks: () => Promise<void>
  loadSessions: () => Promise<void>
  createTask: (data: TaskCreatePayload) => Promise<void>
  updateTask: (id: string, data: UpdateTaskData) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  addSession: (session: StudySession) => void
  loadComments: (taskId: string) => Promise<void>
  addComment: (taskId: string, text: string) => Promise<void>
  reset: () => void
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  tasks: [],
  sessions: [],
  taskComments: {},
  isLoadingTasks: false,
  isLoadingSessions: false,

  loadTasks: async () => {
    set({ isLoadingTasks: true })
    try {
      const response = await api.get<{ tasks: Task[] }>('/planner/tasks')
      set({ tasks: response.data.tasks })
    } catch {
      showToast('error', 'Не удалось загрузить задачи')
    } finally {
      set({ isLoadingTasks: false })
    }
  },

  loadSessions: async () => {
    set({ isLoadingSessions: true })
    try {
      const response = await api.get<{ sessions: StudySession[] }>('/planner/sessions')
      set({ sessions: response.data.sessions })
    } catch {
      console.error('Failed to load planner sessions')
    } finally {
      set({ isLoadingSessions: false })
    }
  },

  createTask: async (data) => {
    try {
      const response = await api.post<Task>('/planner/tasks', data)
      set((s) => ({ tasks: [...s.tasks, response.data] }))
      showToast('success', 'Задача создана')
    } catch {
      showToast('error', 'Не удалось создать задачу')
    }
  },

  updateTask: async (id, data) => {
    try {
      const response = await api.patch<Task>(`/planner/tasks/${id}`, data)
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...response.data } : t)),
      }))
    } catch {
      showToast('error', 'Не удалось обновить задачу')
    }
  },

  toggleTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    const completed = !task.completed
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, completed } : t)) }))
    try {
      await api.patch(`/planner/tasks/${id}`, { completed })
    } catch {
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, completed: !completed } : t)) }))
      showToast('error', 'Не удалось обновить задачу')
    }
  },

  addSession: (session) => {
    set((s) => ({ sessions: [session, ...s.sessions] }))
  },

  loadComments: async (taskId) => {
    try {
      const response = await api.get<{ comments: TaskComment[] }>(`/planner/tasks/${taskId}/comments`)
      set((s) => ({ taskComments: { ...s.taskComments, [taskId]: response.data.comments } }))
    } catch {
      showToast('error', 'Не удалось загрузить комментарии')
    }
  },

  addComment: async (taskId, text) => {
    try {
      const response = await api.post<TaskComment>(`/planner/tasks/${taskId}/comments`, { text })
      set((s) => ({
        taskComments: {
          ...s.taskComments,
          [taskId]: [...(s.taskComments[taskId] ?? []), response.data],
        },
      }))
    } catch {
      showToast('error', 'Не удалось добавить комментарий')
    }
  },

  reset: () => set({
    tasks: [],
    sessions: [],
    taskComments: {},
    isLoadingTasks: false,
    isLoadingSessions: false,
  }),
}))
