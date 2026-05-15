import { useEffect, useRef, useState } from 'react'
import { useAchievementsStore } from '@/entities/achievements/store'
import { useAuthStore } from '@/entities/auth'
import { useProfileStore } from '@/entities/profile'
import { showToast } from '@/shared/lib/toast'
import type { AchievementCategory, ProofType } from '@/shared/types'

const CATEGORIES: { value: AchievementCategory; icon: string; label: string }[] = [
  { value: 'olympiad', icon: '🎓', label: 'Олимпиады' },
  { value: 'academic', icon: '📚', label: 'Учёба' },
  { value: 'it',       icon: '💻', label: 'IT' },
  { value: 'creative', icon: '🎨', label: 'Творчество' },
  { value: 'sport',    icon: '⚽', label: 'Спорт' },
  { value: 'movies',   icon: '🎬', label: 'Фильмы' },
  { value: 'games',    icon: '🎮', label: 'Игры' },
  { value: 'other',    icon: '✨', label: 'Другое' },
]

const currentYear = new Date().getFullYear()
const MIN_YEAR = 2000
const MAX_TEXT = 600
const TITLE_LIMIT = 100

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
}

interface AddAchievementModalProps {
  onClose: () => void
}

export function AddAchievementModal({ onClose }: AddAchievementModalProps) {
  const { addAchievement } = useAchievementsStore()
  const { user } = useAuthStore()
  const profile = useProfileStore((s) => (user ? s.profiles[user.id] : undefined))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [text, setText] = useState('')
  const [category, setCategory] = useState<AchievementCategory>('other')
  const [year, setYear] = useState(currentYear)
  const [eventDate, setEventDate] = useState<string | null>(null)
  const [proofType, setProofType] = useState<ProofType>('none')
  const [proofValue, setProofValue] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const trimmed = text.trim()
  const canSubmit = trimmed.length >= 3 && !submitting && (proofType !== 'url' || !!proofValue?.trim())

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

  const handleSubmit = async () => {
    if (!canSubmit || !user) return
    setSubmitting(true)
    try {
      const title = trimmed.length <= TITLE_LIMIT
        ? trimmed
        : trimmed.slice(0, TITLE_LIMIT).replace(/\s+\S*$/, '') + '…'
      const effectiveYear = eventDate ? parseInt(eventDate.slice(0, 4), 10) : year
      const meta: Record<string, unknown> = eventDate ? { event_date: eventDate } : {}
      await addAchievement({
        userId: user.id,
        category,
        title,
        description: trimmed,
        year: effectiveYear,
        proofType,
        proofValue: proofValue?.trim() || undefined,
        meta,
      })
      showToast('success', 'Отправлено модератору на проверку')
      onClose()
    } catch {
      showToast('error', 'Не удалось добавить достижение')
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const name = user?.name ?? ''
  const avatar = profile?.avatar ?? null
  const countLeft = MAX_TEXT - text.length

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 p-3 sm:p-6" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">Новое достижение</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="text-gray-400 hover:text-gray-700 transition-colors dark:text-gray-500 dark:hover:text-gray-300"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6l-6 12" transform="" />
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex gap-3">
            {avatar ? (
              <img src={avatar} alt={name} className="w-11 h-11 rounded-full object-cover ring-1 ring-gray-200 flex-shrink-0" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold ring-1 ring-gray-200 flex-shrink-0 select-none">
                {getInitials(name)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))}
                onKeyDown={handleKeyDown}
                rows={4}
                placeholder="Чем поделишься? Например: «Выиграл городскую олимпиаду по физике, 1 место»"
                className="w-full resize-none border-0 outline-none text-base text-gray-900 placeholder-gray-400 bg-transparent leading-relaxed dark:text-white dark:placeholder-gray-500"
              />
            </div>
          </div>

          {/* Proof preview / picker */}
          {proofType === 'photo' && proofValue && (
            <div className="mt-3 relative inline-block">
              <img src={proofValue} alt="preview" className="max-h-48 rounded-lg border border-gray-200 object-cover" />
              <button
                type="button"
                onClick={() => setProofValue(undefined)}
                aria-label="Убрать фото"
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>
          )}
          {proofType === 'url' && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700 dark:bg-gray-900/30">
              <span className="text-gray-400 text-sm">🔗</span>
              <input
                type="url"
                placeholder="https://..."
                value={proofValue ?? ''}
                onChange={(e) => setProofValue(e.target.value)}
                className="flex-1 border-0 outline-none text-sm text-gray-900 placeholder-gray-400 bg-transparent dark:text-white dark:placeholder-gray-500"
              />
              <button
                type="button"
                onClick={() => handleProofTypeChange('none')}
                aria-label="Убрать ссылку"
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>
          )}

          {/* Category chips */}
          <div className="mt-4">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => {
                const active = c.value === category
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ring-1 transition-colors ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 ring-indigo-300 font-semibold dark:bg-indigo-900/40 dark:text-indigo-200 dark:ring-indigo-500'
                        : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-900/40">
          <div className="flex items-center gap-1">
            <ToolbarButton
              active={proofType === 'photo'}
              title="Прикрепить фото"
              onClick={() => {
                if (proofType === 'photo') {
                  handleProofTypeChange('none')
                } else {
                  setProofType('photo')
                  fileInputRef.current?.click()
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="8.5" cy="10.5" r="1.5" />
                <path d="M21 17l-5-5L5 21" />
              </svg>
            </ToolbarButton>

            <ToolbarButton
              active={proofType === 'url'}
              title="Прикрепить ссылку"
              onClick={() => handleProofTypeChange(proofType === 'url' ? 'none' : 'url')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
            </ToolbarButton>

            <div className="mx-1 h-6 w-px bg-gray-200" />

            {eventDate === null ? (
              <div className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-600 dark:text-gray-300">
                <span className="text-base">📅</span>
                <input
                  type="number"
                  min={MIN_YEAR}
                  max={currentYear}
                  value={year}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    if (!isNaN(v)) setYear(Math.max(MIN_YEAR, Math.min(currentYear, v)))
                  }}
                  className="w-14 bg-transparent border-0 outline-none text-xs text-gray-700 font-medium tabular-nums dark:text-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setEventDate(`${year}-01-01`)}
                  className="ml-1 text-indigo-600 hover:text-indigo-700 font-medium dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  + дата
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-700 dark:text-gray-200">
                <span className="text-base">📅</span>
                <input
                  type="date"
                  min={`${MIN_YEAR}-01-01`}
                  max={`${currentYear}-12-31`}
                  value={eventDate}
                  onChange={(e) => {
                    const v = e.target.value
                    if (!v) return
                    setEventDate(v)
                    setYear(parseInt(v.slice(0, 4), 10))
                  }}
                  className="bg-transparent border-0 outline-none text-xs text-gray-700 font-medium dark:text-gray-200 dark:[color-scheme:dark]"
                />
                <button
                  type="button"
                  onClick={() => setEventDate(null)}
                  aria-label="Только год"
                  title="Только год"
                  className="ml-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M6 6l12 12M6 18L18 6" />
                  </svg>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          <div className="flex items-center gap-2.5">
            <span className={`text-xs tabular-nums ${countLeft < 50 ? 'text-amber-600' : 'text-gray-400'}`}>
              {countLeft}
            </span>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
              {submitting ? 'Отправка...' : 'Опубликовать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToolbarButton({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
        active
          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
          : 'text-gray-500 hover:bg-white hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  )
}
