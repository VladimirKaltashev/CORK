import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api, showToast } from '@/shared/lib/api'
import { useAuthStore } from '@/entities/auth'
import { useFeedStore } from '@/entities/feed'
import { createPostSchema, type CreatePostData } from '@/shared/schemas/feed'
import { useModal } from './useModal'
import { cn } from '@/shared/lib/cn'
import type { FeedItem } from '@/entities/feed/types'

export function CreatePostForm() {
  const { close } = useModal()
  const { user } = useAuthStore()
  const { addItem } = useFeedStore()

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<CreatePostData>({
    resolver: zodResolver(createPostSchema),
  })

  const content = useWatch({ control, name: 'content', defaultValue: '' })

  const onSubmit = async (data: CreatePostData) => {
    if (!user) {
      showToast('error', 'Необходимо войти в систему')
      return
    }
    try {
      const res = await api.post<FeedItem>('/posts', data)
      addItem(res.data)
      showToast('success', 'Пост опубликован!')
      close()
    } catch { /* обрабатывается interceptor */ }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Текст поста</label>
        <textarea
          {...register('content')}
          rows={4}
          placeholder="Чем поделитесь?"
          className={cn(
            'w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white',
            errors.content ? 'border-red-400' : 'border-gray-300 dark:border-gray-600',
          )}
        />
        <div className="mt-1 flex justify-between">
          {errors.content
            ? <p className="text-xs text-red-500">{errors.content.message}</p>
            : <span />}
          <span className="text-xs text-gray-400">{content.length}/500</span>
        </div>
      </div>
      <button type="submit" disabled={isSubmitting}
        className="rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
        {isSubmitting ? 'Публикация...' : 'Опубликовать'}
      </button>
    </form>
  )
}
