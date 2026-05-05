import { useRef, useState } from 'react'
import { useAchievementsStore } from '@/entities/achievements/store'
import { api } from '@/shared/lib/api'
import { showToast } from '@/shared/lib/toast'
import type { Achievement, AchievementCategory } from '@/shared/types'

const CATEGORIES: { value: AchievementCategory; label: string }[] = [
  { value: 'olympiad', label: 'Олимпиады' },
  { value: 'academic', label: 'Успеваемость' },
  { value: 'it',       label: 'IT' },
  { value: 'creative', label: 'Творчество' },
  { value: 'sport',    label: 'Спорт' },
  { value: 'other',    label: 'Интересное' },
]

const currentYear = new Date().getFullYear()

interface AddAchievementModalProps {
  onClose: () => void
}

export function AddAchievementModal({ onClose }: AddAchievementModalProps) {
  const { addAchievement } = useAchievementsStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [category, setCategory] = useState<AchievementCategory>('olympiad')
  const [title, setTitle] = useState('')
  const [year, setYear] = useState(String(currentYear))
  const [proofImage, setProofImage] = useState<string | undefined>()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Обязательное поле'
    else if (title.length > 100) errs.title = 'Максимум 100 символов'
    const y = parseInt(year, 10)
    if (!year || isNaN(y)) errs.year = 'Введите год'
    else if (y < 2000) errs.year = 'Год не раньше 2000'
    else if (y > currentYear) errs.year = `Год не позже ${currentYear}`
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setProofImage(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const payload = { category, title: title.trim(), year: parseInt(year, 10), proofImage }
      const res = await api.post<Achievement>('/achievements', payload)
      addAchievement(res.data)
      showToast('success', 'Достижение добавлено!')
      onClose()
    } catch {
      showToast('error', 'Не удалось добавить достижение')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-5 text-lg font-semibold text-gray-900 dark:text-white">Добавить достижение</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Категория</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as AchievementCategory)} className={inputCls}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Название</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Год достижения</label>
            <input
              type="number"
              min={2000}
              max={currentYear}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={inputCls}
            />
            {errors.year && <p className="mt-1 text-xs text-red-500">{errors.year}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Подтверждение <span className="font-normal text-gray-400">(фото, необязательно)</span>
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-400"
              >
                {proofImage ? 'Изменить фото' : 'Загрузить фото'}
              </button>
              {proofImage && (
                <img src={proofImage} alt="preview" className="h-24 w-auto rounded-lg object-cover" />
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
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
              disabled={submitting}
              className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Сохранение...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
