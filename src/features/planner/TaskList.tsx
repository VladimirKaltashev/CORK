import { useState } from 'react'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import { ru } from 'date-fns/locale'
import { usePlannerStore } from '@/entities/planner'
import { TaskModal } from './TaskModal'
import { TaskComments } from './TaskComments'
import type { Task, TaskPriority } from '@/shared/types'

const PRIORITY_ICON: Record<TaskPriority, string> = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
}

const PRIORITY_ORDER: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }

function getDeadlineLabel(deadline: string): { label: string; className: string } {
  const date = new Date(deadline)
  if (isPast(date) && !isToday(date)) {
    return { label: 'Просрочена', className: 'text-red-500' }
  }
  if (isToday(date)) return { label: 'Сегодня', className: 'text-amber-500' }
  if (isTomorrow(date)) return { label: 'Завтра', className: 'text-blue-500' }
  return { label: format(date, 'd MMM', { locale: ru }), className: 'text-gray-400' }
}

function sortTasks(tasks: Task[]): Task[] {
  const now = new Date()
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    const da = new Date(a.deadline)
    const db_ = new Date(b.deadline)
    const overdueA = da < now
    const overdueB = db_ < now
    if (overdueA !== overdueB) return overdueA ? -1 : 1
    if (da.getTime() !== db_.getTime()) return da.getTime() - db_.getTime()
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  })
}

const SUBJECT_LABELS: Record<string, string> = {
  math: 'Математика',
  physics: 'Физика',
  informatics: 'Информатика',
  chemistry: 'Химия',
  biology: 'Биология',
}

export function TaskList() {
  const { tasks, isLoadingTasks, toggleTask } = usePlannerStore()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const sorted = sortTasks(tasks)

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Задачи ({tasks.filter((t) => !t.completed).length})</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
        >
          + Новая
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoadingTasks ? (
          <div className="flex h-32 items-center justify-center">
            <span className="text-sm text-gray-400">Загрузка...</span>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <span className="text-sm text-gray-400">Нет задач</span>
          </div>
        ) : (
          sorted.map((task) => {
            const dl = getDeadlineLabel(task.deadline)
            return (
              <div
                key={task.id}
                className="group flex cursor-pointer items-start gap-2 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => setSelectedTask(task)}
              >
                <button
                  className="mt-0.5 flex-shrink-0"
                  onClick={(e) => { e.stopPropagation(); toggleTask(task.id) }}
                >
                  <span className={`block h-4 w-4 rounded border-2 text-center text-xs leading-3 transition-colors ${task.completed ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                    {task.completed ? '✓' : ''}
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{PRIORITY_ICON[task.priority]}</span>
                    <span className={`truncate text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                      {task.title}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className={`text-xs font-medium ${dl.className}`}>{dl.label}</span>
                    {task.subject && (
                      <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                        {SUBJECT_LABELS[task.subject]}
                      </span>
                    )}
                    {(task.commentsCount ?? 0) > 0 && (
                      <span className="text-xs text-gray-400">💬 {task.commentsCount}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {showCreate && <TaskModal onClose={() => setShowCreate(false)} />}
      {selectedTask && <TaskComments task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  )
}
