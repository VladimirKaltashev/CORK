import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { showToast } from '@/shared/lib/api'
import { updateProfileSchema, type UpdateProfileData } from '@/shared/schemas/profile'
import { cn } from '@/shared/lib/cn'
import type { Profile } from '@/entities/profile/types'

interface Props {
  profile: Profile
  onSuccess: () => void
}

export function EditProfileForm({ profile, onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: profile.name, goal: profile.goal },
  })

  const onSubmit = async () => {
    try {
      showToast('success', 'Профиль обновлён!')
      onSuccess()
    } catch { /* обрабатывается interceptor */ }
  }

  const inputClass = (hasError: boolean) => cn(
    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2',
    hasError ? 'border-red-400' : 'border-gray-300 dark:border-gray-600',
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--cork-text-dim)' }}>Имя</label>
        <input {...register('name')} type="text" className={inputClass(!!errors.name)} style={{ background: 'var(--cork-surface-2)', color: 'var(--cork-text)', borderColor: 'var(--cork-border)' }} />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--cork-text-dim)' }}>Цель на год</label>
        <input
          {...register('goal')}
          type="text"
          placeholder="Моя цель..."
          className={inputClass(!!errors.goal)}
          style={{ background: 'var(--cork-surface-2)', color: 'var(--cork-text)', borderColor: 'var(--cork-border)' }}
        />
        {errors.goal && <p className="mt-1 text-xs text-red-500">{errors.goal.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="cork-btn-primary mt-1"
      >
        {isSubmitting ? 'Сохранение...' : 'Сохранить'}
      </button>
    </form>
  )
}
