import { useRef, useState } from 'react'
import { Button, FormControl, Select, TextInput } from '@primer/react'
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-md border border-gray-300 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Добавить достижение</h2>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3">

            <FormControl>
              <FormControl.Label>Категория</FormControl.Label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as AchievementCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl required>
              <FormControl.Label>Название</FormControl.Label>
              <TextInput
                block
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                validationStatus={errors.title ? 'error' : undefined}
              />
              {errors.title && <FormControl.Validation variant="error">{errors.title}</FormControl.Validation>}
            </FormControl>

            <FormControl>
              <FormControl.Label>Год достижения</FormControl.Label>
              <TextInput
                block
                type="number"
                min={2000}
                max={currentYear}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                validationStatus={errors.year ? 'error' : undefined}
              />
              {errors.year && <FormControl.Validation variant="error">{errors.year}</FormControl.Validation>}
            </FormControl>

            <FormControl>
              <FormControl.Label>
                Подтверждение{' '}
                <span className="font-normal text-gray-400 text-xs">(фото, необязательно)</span>
              </FormControl.Label>
              <div className="flex flex-col gap-2">
                <div className="self-start">
                  <Button type="button" onClick={() => fileInputRef.current?.click()}>
                    {proofImage ? 'Изменить фото' : 'Загрузить фото'}
                  </Button>
                </div>
                {proofImage && (
                  <img
                    src={proofImage}
                    alt="preview"
                    className="h-24 w-auto rounded object-cover"
                  />
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
            </FormControl>

            <div className="flex gap-2 pt-1">
              <Button type="button" onClick={onClose} className="flex-1">Отмена</Button>
              <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
                {submitting ? 'Сохранение...' : 'Добавить'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}