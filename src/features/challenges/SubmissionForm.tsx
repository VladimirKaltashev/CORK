import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { challengeSubmissionSchema } from '@/shared/schemas'
import type { ProofConfig } from '@/shared/types'
import { showToast } from '@/shared/lib/toast'

interface SubmissionFormProps {
  proofConfig: ProofConfig
  onSubmit: (data: {
    proofType: string
    proofValue: string
    value?: number
    description: string
  }) => Promise<void>
}

export function SubmissionForm({ proofConfig, onSubmit }: SubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(challengeSubmissionSchema),
    defaultValues: {
      proofType: (proofConfig.fields.find((f) => f !== 'value') ?? 'text') as 'text' | 'photo' | 'url',
      proofValue: '',
      value: undefined,
      description: '',
    },
  })

  const proofType = watch('proofType')
  const hasField = (field: string) => proofConfig.fields.includes(field as never)

  const availableProofTypes = useMemo(() => {
    const proofFields = proofConfig.fields.filter((f) => f !== 'value')
    return proofFields.length > 0 ? proofFields : ['text']
  }, [proofConfig.fields])

  const handleFormSubmit = async (data: {
    proofType: string
    proofValue: string
    value?: number
    description: string
  }) => {
    if (hasField('value') && proofConfig.valueRequired && !data.value) {
      showToast('error', `Поле "${proofConfig.valueLabel ?? 'значение'}" обязательно`)
      return
    }
    if ((proofType === 'photo' || proofType === 'url') && !data.proofValue) {
      showToast('error', 'Добавьте доказательство')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(data)
      reset()
    } catch {
      showToast('error', 'Не удалось отправить')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <h3 className="font-bold text-lg">Добавить прогресс</h3>

      <div>
        <label className="block text-sm font-medium mb-1">Тип доказательства</label>
        <select {...register('proofType')} className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white">
          {availableProofTypes.includes('text') && <option value="text">Текст</option>}
          {availableProofTypes.includes('photo') && <option value="photo">Фото</option>}
          {availableProofTypes.includes('url') && <option value="url">Ссылка</option>}
        </select>
      </div>

      {proofType === 'text' && (
        <div>
          <label className="block text-sm font-medium mb-1">Описание</label>
          <textarea
            {...register('description')}
            className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            rows={3}
            placeholder="Что вы сделали?"
          />
          {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
        </div>
      )}

      {proofType === 'photo' && (
        <div>
          <label className="block text-sm font-medium mb-1">Фото / Скриншот (URL)</label>
          <input
            {...register('proofValue')}
            type="url"
            className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            placeholder="https://example.com/proof.jpg"
          />
          {errors.proofValue && <p className="text-red-500 text-sm">{errors.proofValue.message}</p>}
        </div>
      )}

      {proofType === 'url' && (
        <div>
          <label className="block text-sm font-medium mb-1">Ссылка</label>
          <input
            {...register('proofValue')}
            type="url"
            className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            placeholder="https://strava.com/activities/..."
          />
          {errors.proofValue && <p className="text-red-500 text-sm">{errors.proofValue.message}</p>}
        </div>
      )}

      {hasField('value') && (
        <div>
          <label className="block text-sm font-medium mb-1">
            {proofConfig.valueLabel ?? 'Значение'}
            {proofConfig.valueRequired && <span className="text-red-500">*</span>}
          </label>
          <input
            {...register('value', { valueAsNumber: true })}
            type="number"
            className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            placeholder="Например, 45"
          />
          {errors.value && <p className="text-red-500 text-sm">{errors.value.message}</p>}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Отправка...' : 'Отправить'}
      </button>
    </form>
  )
}
