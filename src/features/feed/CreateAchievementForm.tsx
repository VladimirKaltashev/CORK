import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api, showToast } from '@/shared/lib/api'
import { useAuthStore } from '@/entities/auth'
import { useFeedStore } from '@/entities/feed'
import { hasMinRole } from '@/shared/lib/permissions'
import { createAchievementSchema, type CreateAchievementData } from '@/shared/schemas/feed'
import { useModal } from './useModal'
import { cn } from '@/shared/lib/cn'
import type { FeedItem } from '@/entities/feed/types'

export function CreateAchievementForm() {
  const { close } = useModal()
  const { user } = useAuthStore()
  const { addItem } = useFeedStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateAchievementData>({
    resolver: zodResolver(createAchievementSchema),
    defaultValues: { place: 1 },
  })

  const onSubmit = async (data: CreateAchievementData) => {
    if (!user || !hasMinRole(user.role, 'admin')) {
      showToast('error', 'Только администратор может добавлять достижения')
      return
    }
    try {
      const res = await api.post<FeedItem>('/achievements', data)
      addItem(res.data)
      showToast('success', 'Достижение добавлено!')
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
        <input {...register('title')} type="text" placeholder="Победитель ВсОШ" className={inputClass(!!errors.title)} />
        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Олимпиада</label>
        <input {...register('olympiadName')} type="text" placeholder="ВсОШ 2026" className={inputClass(!!errors.olympiadName)} />
        {errors.olympiadName && <p className="mt-1 text-xs text-red-500">{errors.olympiadName.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Место</label>
        <input {...register('place', { valueAsNumber: true })} type="number" min="1" placeholder="1" className={inputClass(!!errors.place)} />
        {errors.place && <p className="mt-1 text-xs text-red-500">{errors.place.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Описание</label>
        <input {...register('description')} type="text" placeholder="Первое место по математике" className={inputClass(!!errors.description)} />
        {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting}
        className="mt-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
        {isSubmitting ? 'Создание...' : 'Добавить достижение'}
      </button>
    </form>
  )
}
