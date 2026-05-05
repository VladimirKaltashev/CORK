import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { achievementSchema } from '@/shared/schemas/achievement'
import { useAchievementsStore } from '@/entities/achievements/store'
import { api } from '@/shared/lib/api'
import { showToast } from '@/shared/lib/toast'
import type { Achievement, AchievementCategory } from '@/shared/types'

type FormData = {
  category: AchievementCategory
  title: string
  description: string
  date: string
  proofUrl?: string
}

const CATEGORIES: { value: AchievementCategory; label: string; icon: string }[] = [
  { value: 'education', label: 'Образование', icon: '🎓' },
  { value: 'sport', label: 'Спорт', icon: '🏆' },
  { value: 'it', label: 'IT', icon: '💻' },
  { value: 'creative', label: 'Творчество', icon: '🎨' },
  { value: 'life', label: 'Жизнь', icon: '✨' },
]

interface AddAchievementModalProps {
  onClose: () => void
}

export function AddAchievementModal({ onClose }: AddAchievementModalProps) {
  const { addAchievement } = useAchievementsStore()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(achievementSchema),
    defaultValues: { category: 'education', title: '', description: '', date: '', proofUrl: '' },
  })

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, proofUrl: data.proofUrl?.trim() || undefined }
      const res = await api.post<Achievement>('/achievements', payload)
      addAchievement(res.data)
      showToast('success', 'Достижение добавлено!')
      onClose()
    } catch {
      showToast('error', 'Не удалось добавить достижение')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-5 text-lg font-semibold text-gray-900 dark:text-white">Добавить достижение</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Категория</label>
            <select
              {...register('category')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Название</label>
            <input
              {...register('title')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Победитель олимпиады..."
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Описание</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Опишите достижение..."
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Дата</label>
            <input
              type="date"
              {...register('date')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ссылка на подтверждение <span className="font-normal text-gray-400">(необязательно)</span>
            </label>
            <input
              {...register('proofUrl')}
              type="url"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="https://..."
            />
            {errors.proofUrl && <p className="mt-1 text-xs text-red-500">{errors.proofUrl.message}</p>}
          </div>

          <div className="flex gap-3 pt-1">
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
              {isSubmitting ? 'Сохранение...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
