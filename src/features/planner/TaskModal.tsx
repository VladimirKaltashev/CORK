import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { taskSchema, type TaskFormData } from '@/shared/schemas/planner'
import { usePlannerStore } from '@/entities/planner'
import type { Task, Subject } from '@/shared/types'

const SUBJECT_LABELS: Record<Subject, string> = {
  math: 'Математика',
  physics: 'Физика',
  informatics: 'Информатика',
  chemistry: 'Химия',
  biology: 'Биология',
}
const SUBJECTS: Subject[] = ['math', 'physics', 'informatics', 'chemistry', 'biology']

interface TaskModalProps {
  onClose: () => void
  defaultDeadline?: string
  task?: Task
}

export function TaskModal({ onClose, defaultDeadline, task }: TaskModalProps) {
  const { createTask, updateTask } = usePlannerStore()

  const getDefaultDeadline = () => {
    if (task?.deadline) return new Date(task.deadline).toISOString().slice(0, 16)
    if (defaultDeadline) return new Date(defaultDeadline).toISOString().slice(0, 16)
    return ''
  }

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? '',
      priority: task?.priority ?? 'medium',
      deadline: getDefaultDeadline(),
      subject: task?.subject ?? '',
      description: task?.description ?? '',
    },
  })

  const onSubmit = async (data: TaskFormData) => {
    const payload = {
      title: data.title,
      priority: data.priority,
      deadline: new Date(data.deadline).toISOString(),
      subject: (data.subject || undefined) as Subject | undefined,
      description: data.description || undefined,
    }
    if (task) {
      await updateTask(task.id, payload)
    } else {
      await createTask(payload)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {task ? 'Редактировать задачу' : 'Новая задача'}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Название</label>
            <input
              {...register('title')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Что нужно сделать?"
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Приоритет</label>
              <select
                {...register('priority')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="high">Высокий</option>
                <option value="medium">Средний</option>
                <option value="low">Низкий</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Предмет</label>
              <select
                {...register('subject')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Без предмета</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{SUBJECT_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Дедлайн</label>
            <input
              type="datetime-local"
              {...register('deadline')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            {errors.deadline && <p className="mt-1 text-xs text-red-500">{errors.deadline.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Описание</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Дополнительные детали..."
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Сохранение...' : task ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
