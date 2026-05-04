import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api, showToast } from '@/shared/lib/api'
import { useAuthStore } from '@/entities/auth'
import { useFeedStore } from '@/entities/feed'
import { hasMinRole } from '@/shared/lib/permissions'
import { createSessionSchema, type CreateSessionData } from '@/shared/schemas/feed'
import { useModal } from './useModal'
import { cn } from '@/shared/lib/cn'
import type { FeedItem } from '@/entities/feed/types'

export function CreateSessionForm() {
  const { close } = useModal()
  const { user } = useAuthStore()
  const { addItem } = useFeedStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateSessionData>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10), hours: 2 },
  })

  const onSubmit = async (data: CreateSessionData) => {
    if (!user || !hasMinRole(user.role, 'moderator')) {
      showToast('error', 'Недостаточно прав для создания сессии')
      return
    }
    try {
      const res = await api.post<FeedItem>('/sessions', data)
      addItem(res.data)
      showToast('success', 'Сессия создана!')
      close()
    } catch { /* обрабатывается interceptor */ }
  }

  const inputClass = (hasError: boolean) => cn(
    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white',
    hasError ? 'border-red-400' : 'border-gray-300 dark:border-gray-600',
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Название</label>
        <input {...register('title')} type="text" placeholder="Тренировка по математике" className={inputClass(!!errors.title)} />
        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Предмет</label>
        <input {...register('subject')} type="text" placeholder="Математика" className={inputClass(!!errors.subject)} />
        {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Дата</label>
        <input {...register('date')} type="date" className={inputClass(!!errors.date)} />
        {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Продолжительность (ч)</label>
        <input {...register('hours', { valueAsNumber: true })} type="number" step="0.5" placeholder="2" className={inputClass(!!errors.hours)} />
        {errors.hours && <p className="mt-1 text-xs text-red-500">{errors.hours.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting}
        className="mt-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
        {isSubmitting ? 'Создание...' : 'Создать сессию'}
      </button>
    </form>
  )
}
