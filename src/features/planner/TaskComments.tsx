import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { usePlannerStore } from '@/entities/planner'
import type { Task } from '@/shared/types'

interface TaskCommentsProps {
  task: Task
  onClose: () => void
}

export function TaskComments({ task, onClose }: TaskCommentsProps) {
  const { taskComments, loadComments, addComment } = usePlannerStore()
  const [input, setInput] = useState('')
  const comments = taskComments[task.id] ?? []

  useEffect(() => {
    loadComments(task.id)
  }, [task.id, loadComments])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      addComment(task.id, input.trim())
      setInput('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{task.title}</h2>
            {task.description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{task.description}</p>
            )}
          </div>
          <button onClick={onClose} className="ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            ✕
          </button>
        </div>

        <div className="mb-4 max-h-64 space-y-3 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Комментариев пока нет</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{c.userName}</span>
                  <span className="text-xs text-gray-400">
                    {format(new Date(c.createdAt), 'd MMM HH:mm', { locale: ru })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{c.text}</p>
              </div>
            ))
          )}
        </div>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Добавить комментарий... (Enter для отправки)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        />
      </div>
    </div>
  )
}
