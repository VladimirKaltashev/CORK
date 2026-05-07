import { useRef, useState } from 'react'
import { Button, FormControl, Select, TextInput, Textarea } from '@primer/react'
import { useAchievementsStore } from '@/entities/achievements/store'
import { useAuthStore } from '@/entities/auth'
import { showToast } from '@/shared/lib/toast'
import type { AchievementCategory, ProofType } from '@/shared/types'

const CATEGORIES: { value: AchievementCategory; icon: string; label: string }[] = [
  { value: 'olympiad', icon: '🎓', label: 'Олимпиады' },
  { value: 'academic', icon: '📚', label: 'Успеваемость' },
  { value: 'it',       icon: '💻', label: 'IT' },
  { value: 'creative', icon: '🎨', label: 'Творчество' },
  { value: 'sport',    icon: '⚽', label: 'Спорт' },
  { value: 'movies',   icon: '🎬', label: 'Фильмы' },
  { value: 'games',    icon: '🎮', label: 'Игры' },
  { value: 'other',    icon: '✨', label: 'Интересное' },
]

const currentYear = new Date().getFullYear()

interface AddAchievementModalProps {
  onClose: () => void
}

export function AddAchievementModal({ onClose }: AddAchievementModalProps) {
  const { addAchievement } = useAchievementsStore()
  const { user } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [category, setCategory] = useState<AchievementCategory>('olympiad')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [year, setYear] = useState(String(currentYear))
  const [proofType, setProofType] = useState<ProofType>('none')
  const [proofValue, setProofValue] = useState<string | undefined>()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Обязательное поле'
    else if (title.length > 100) errs.title = 'Максимум 100 символов'
    if (!description.trim()) errs.description = 'Обязательное поле'
    else if (description.length > 500) errs.description = 'Максимум 500 символов'
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
      if (typeof reader.result === 'string') setProofValue(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleProofTypeChange = (pt: ProofType) => {
    setProofType(pt)
    setProofValue(undefined)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !user) return
    setSubmitting(true)
    try {
      await addAchievement({
        userId: user.id,
        category,
        title: title.trim(),
        description: description.trim(),
        year: parseInt(year, 10),
        proofType,
        proofValue,
        meta: {},
      })
      showToast('success', 'Достижение добавлено!')
      onClose()
    } catch {
      showToast('error', 'Не удалось добавить достижение')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-md border border-gray-300 p-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Добавить достижение</h2>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3">

            <FormControl>
              <FormControl.Label>Категория</FormControl.Label>
              <Select value={category} onChange={(e) => setCategory(e.target.value as AchievementCategory)}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
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

            <FormControl required>
              <FormControl.Label>Описание</FormControl.Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Подробнее о достижении..."
                className="w-full"
              />
              {errors.description && <FormControl.Validation variant="error">{errors.description}</FormControl.Validation>}
            </FormControl>

            <FormControl required>
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

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Тип доказательства</p>
              <div className="flex flex-col gap-1">
                {(['photo', 'url', 'none'] as ProofType[]).map((pt) => (
                  <label key={pt} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="radio"
                      name="proofType"
                      value={pt}
                      checked={proofType === pt}
                      onChange={() => handleProofTypeChange(pt)}
                    />
                    {pt === 'photo' ? 'Фото' : pt === 'url' ? 'Ссылка' : 'Нет доказательства'}
                  </label>
                ))}
              </div>
            </div>

            {proofType === 'photo' && (
              <div className="flex flex-col gap-2">
                <div className="self-start">
                  <Button type="button" onClick={() => fileInputRef.current?.click()}>
                    {proofValue ? 'Изменить фото' : 'Загрузить фото'}
                  </Button>
                </div>
                {proofValue && (
                  <img src={proofValue} alt="preview" className="h-24 w-auto rounded object-cover" />
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
            )}

            {proofType === 'url' && (
              <FormControl>
                <FormControl.Label>URL доказательства</FormControl.Label>
                <TextInput
                  block
                  type="url"
                  value={proofValue ?? ''}
                  onChange={(e) => setProofValue(e.target.value)}
                  placeholder="https://..."
                />
              </FormControl>
            )}

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
