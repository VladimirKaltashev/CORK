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
      showToast('error', 'Только администратор может добавлять заявки')
      return
    }
    try {
      const res = await api.post<FeedItem>('/achievements', data)
      addItem(res.data)
      showToast('success', 'Заявка добавлена!')
      close()
    } catch { /* обрабатывается interceptor */ }
  }

  const inputBase = 'w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[var(--cork-brand)]'
  const inputStyle = { background: 'var(--cork-surface-2)', color: 'var(--cork-text)' }
  const inputClass = (hasError: boolean) => cn(
    inputBase,
    hasError ? 'border-red-400' : 'border-gray-300',
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--cork-text-dim)' }}>Название</label>
        <input {...register('title')} type="text" placeholder="Победитель ВсОШ" className={inputClass(!!errors.title)} style={inputStyle} />
        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--cork-text-dim)' }}>Олимпиада</label>
        <input {...register('olympiadName')} type="text" placeholder="ВсОШ 2026" className={inputClass(!!errors.olympiadName)} style={inputStyle} />
        {errors.olympiadName && <p className="mt-1 text-xs text-red-500">{errors.olympiadName.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--cork-text-dim)' }}>Место</label>
        <input {...register('place', { valueAsNumber: true })} type="number" min="1" placeholder="1" className={inputClass(!!errors.place)} style={inputStyle} />
        {errors.place && <p className="mt-1 text-xs text-red-500">{errors.place.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--cork-text-dim)' }}>Описание</label>
        <input {...register('description')} type="text" placeholder="Первое место по математике" className={inputClass(!!errors.description)} style={inputStyle} />
        {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting}
        className="cork-btn-primary mt-1">
        {isSubmitting ? 'Создание...' : 'Добавить заявку'}
      </button>
    </form>
  )
}
