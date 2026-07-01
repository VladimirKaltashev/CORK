import { useEffect, useRef, useState } from 'react'
import { useAchievementsStore } from '@/entities/achievements/store'
import { useAuthStore } from '@/entities/auth'
import { useProfileStore } from '@/entities/profile'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'
import { CategoryIcon, CalendarIcon } from '@/shared/ui'
import type { AchievementCategory, ProofType } from '@/shared/types'
import type { ClaimSubjectType, ClaimType } from '@/entities/claims'
import { buildClaimMeta, defaultSubjectTypeForClaimType } from '@/entities/claims'
import { applyChallengeContextToClaimMeta, buildChallengeThreadValue } from '@/entities/challenges/claimLinking'

const CATEGORIES: { value: AchievementCategory; label: string }[] = [
  { value: 'olympiad', label: 'Олимпиады' },
  { value: 'academic', label: 'Учёба' },
  { value: 'it',       label: 'IT' },
  { value: 'creative', label: 'Творчество' },
  { value: 'sport',    label: 'Спорт' },
  { value: 'movies',   label: 'Фильмы' },
  { value: 'games',    label: 'Игры' },
  { value: 'other',    label: 'Другое' },
]

const CLAIM_TYPES: { value: ClaimType; label: string; emoji: string }[] = [
  { value: 'self_achievement',  label: 'Моё',       emoji: '👤' },
  { value: 'other_achievement', label: 'Нашёл',      emoji: '🔎' },
  { value: 'fail',              label: 'Фейл',       emoji: '💥' },
  { value: 'flex',              label: 'Flex',       emoji: '⚡' },
  { value: 'discovery',         label: 'Находка',    emoji: '💎' },
  { value: 'debate',            label: 'Спорно',     emoji: '⚖️' },
  { value: 'absurd',            label: 'Абсурд',     emoji: '🌀' },
  { value: 'organization',      label: 'Орга/проект', emoji: '🏛️' },
]

const SUBJECT_TYPES: { value: ClaimSubjectType; label: string }[] = [
  { value: 'self',         label: 'Я' },
  { value: 'person',       label: 'Человек' },
  { value: 'organization', label: 'Организация' },
  { value: 'project',      label: 'Проект' },
  { value: 'event',        label: 'Событие' },
  { value: 'internet',     label: 'Интернет' },
  { value: 'unknown',      label: 'Неясно' },
]

const SUBJECT_PLACEHOLDERS: Partial<Record<ClaimSubjectType, string>> = {
  person: 'Имя человека или автора',
  organization: 'Название организации',
  project: 'Название проекта',
  event: 'Название события',
  internet: 'Что нашли в интернете?',
  unknown: 'Короткий контекст',
}

const THREADS: { value: string; label: string }[] = [
  { value: '',                   label: 'Без ветки' },
  { value: 'Самый неуклюжий',    label: 'Самый неуклюжий' },
  { value: 'Полезная находка',   label: 'Полезная находка' },
  { value: 'Лучший проект',      label: 'Лучший проект' },
  { value: 'Спорный flex',       label: 'Спорный flex' },
  { value: 'Клоунская заявка',   label: 'Клоунская заявка' },
  { value: '__custom__',         label: 'Своя тема' },
]

const PLACEHOLDERS = [
  'Что выносим? Фейл, flex, находку, спорный кейс или проект.',
  'Собрал куб за 14.8 — король или повезло?',
  'Официант уронил 10 тарелок. Легендарный фейл?',
  'Нашёл проект, который заслуживает короны.',
  'Стартап заявил, что заменит учителей. Гений или клоун?',
]

const currentYear = new Date().getFullYear()
const MIN_YEAR = 2000
const MAX_TEXT = 600
const TITLE_LIMIT = 100

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
}

function useRotatingPlaceholder() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % PLACEHOLDERS.length), 4000)
    return () => clearInterval(id)
  }, [])
  return PLACEHOLDERS[idx]
}

interface AddAchievementModalProps {
  onClose: () => void
  challengeId?: string
  challengeTitle?: string
  onSubmitted?: () => void
}

export function AddAchievementModal({ onClose, challengeId, challengeTitle, onSubmitted }: AddAchievementModalProps) {
  const { addAchievement } = useAchievementsStore()
  const { user } = useAuthStore()
  const profile = useProfileStore((s) => (user ? s.profiles[user.id] : undefined))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [text, setText] = useState('')
  const [claimType, setClaimType] = useState<ClaimType>('self_achievement')
  const [subjectType, setSubjectType] = useState<ClaimSubjectType>('self')
  const [subjectName, setSubjectName] = useState('')
  const initialChallengeThread = challengeId ? buildChallengeThreadValue({ challengeId, challengeTitle }) : ''

  const [thread, setThread] = useState(challengeId ? '__custom__' : '')
  const [customThread, setCustomThread] = useState(initialChallengeThread)
  const [category, setCategory] = useState<AchievementCategory>('other')
  const [year, setYear] = useState(currentYear)
  const [eventDate, setEventDate] = useState<string | null>(null)
  const [proofType, setProofType] = useState<ProofType>('none')
  const [proofValue, setProofValue] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const subjectPristine = useRef(true)

  const placeholder = useRotatingPlaceholder()

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

  useEffect(() => {
    if (subjectPristine.current) {
      setSubjectType(defaultSubjectTypeForClaimType(claimType))
    }
  }, [claimType])

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
      const resolvedThread = thread === '__custom__' ? customThread : thread
      const meta = buildClaimMeta({
        eventDate,
        claimType,
        subjectType,
        subjectName,
        thread: resolvedThread,
      })
      if (challengeId) {
        applyChallengeContextToClaimMeta(meta, challengeId)
      }
      const createdAchievement = await addAchievement({
        userId: user.id,
        category,
        title,
        description: trimmed,
        year: effectiveYear,
        proofType,
        proofValue: proofValue?.trim() || undefined,
        claimAngle: 'judge',
        meta,
      })

      if (challengeId) {
        // Keep a single “current” challenge entry per user. When user submits again, we rotate the linked claim.
        const { data: existing, error: existingError } = await supabase
          .from('challenge_entries')
          .select('id, version')
          .eq('challenge_id', challengeId)
          .eq('user_id', user.id)
          .eq('is_current', true)
          .maybeSingle()

        if (existingError) throw existingError

        if (existing) {
          const nextVersion = (existing.version ?? 0) + 1
          const { error: updateError } = await supabase
            .from('challenge_entries')
            .update({
              claim_id: createdAchievement.id,
              title,
              description: trimmed || null,
              version: nextVersion,
              updated_at: new Date().toISOString(),
              is_current: true,
            })
            .eq('id', existing.id)

          if (updateError) throw updateError
        } else {
          const { error: insertError } = await supabase
            .from('challenge_entries')
            .insert({
              challenge_id: challengeId,
              user_id: user.id,
              claim_id: createdAchievement.id,
              title,
              description: trimmed || null,
              version: 1,
              is_current: true,
            })

          if (insertError) throw insertError
        }
      }

      showToast('success', challengeId ? 'Заявка принята в челлендж' : 'Заявка отправлена на проверку')
      onSubmitted?.()
      onClose()
    } catch {
      showToast('error', 'Не удалось отправить заявку')
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
        className="w-full max-w-xl overflow-hidden max-h-[92vh] flex flex-col"
        style={{ background: 'var(--cork-surface)', borderRadius: 'var(--cork-radius-card)', boxShadow: 'var(--cork-shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--cork-border-light)' }}>
          <div>
            <span className="text-sm font-semibold" style={{ color: 'var(--cork-text)' }}>
              {challengeId ? 'Заявка в челлендж' : 'Новая заявка'}
            </span>
            {challengeTitle && (
              <span className="text-xs ml-2 px-2 py-0.5 rounded" style={{ background: 'var(--cork-surface-2)', color: 'var(--cork-brand)' }}>
                {challengeTitle}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="transition-colors"
            style={{ color: 'var(--cork-text-mute)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex gap-3">
            {avatar ? (
              <img src={avatar} alt={name} className="w-11 h-11 object-cover flex-shrink-0" style={{ borderRadius: 'var(--cork-radius-pill)', border: '1px solid var(--cork-border)' }} />
            ) : (
              <div className="w-11 h-11 flex items-center justify-center text-sm font-semibold flex-shrink-0 select-none" style={{ background: 'var(--cork-surface-3)', color: 'var(--cork-brand)', borderRadius: 'var(--cork-radius-pill)' }}>
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
                placeholder={placeholder}
                className="w-full resize-none border-0 outline-none text-base leading-relaxed bg-transparent"
                style={{ color: 'var(--cork-text)' }}
              />
            </div>
          </div>

          {/* Claim type chips */}
          <div className="mt-3">
            <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--cork-text-dim)' }}>Тип заявки</div>
            <div className="flex flex-wrap gap-1.5">
              {CLAIM_TYPES.map((ct) => {
                const active = ct.value === claimType
                return (
                  <button
                    key={ct.value}
                    type="button"
                    onClick={() => setClaimType(ct.value)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs transition-colors"
                    style={{
                      borderRadius: 'var(--cork-radius-pill)',
                      border: '1px solid',
                      borderColor: active ? 'var(--cork-brand)' : 'var(--cork-border)',
                      background: active ? 'var(--cork-surface-2)' : 'var(--cork-surface)',
                      color: active ? 'var(--cork-brand)' : 'var(--cork-text-dim)',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <span>{ct.emoji}</span>
                    <span>{ct.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Subject type chips */}
          <div className="mt-3">
            <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--cork-text-dim)' }}>О ком / о чём</div>
            <div className="flex flex-wrap gap-1.5">
              {SUBJECT_TYPES.map((st) => {
                const active = st.value === subjectType
                return (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => {
                      subjectPristine.current = false
                      setSubjectType(st.value)
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs transition-colors"
                    style={{
                      borderRadius: 'var(--cork-radius-pill)',
                      border: '1px solid',
                      borderColor: active ? 'var(--cork-brand)' : 'var(--cork-border)',
                      background: active ? 'var(--cork-surface-2)' : 'var(--cork-surface)',
                      color: active ? 'var(--cork-brand)' : 'var(--cork-text-dim)',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <span>{st.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Subject name input (hidden when subject is self) */}
          {subjectType !== 'self' && (
            <div className="mt-3">
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder={SUBJECT_PLACEHOLDERS[subjectType] ?? 'Короткий контекст'}
                className="w-full px-3 py-2 text-sm outline-none"
                style={{
                  borderRadius: 'var(--cork-radius-card)',
                  border: '1px solid var(--cork-border)',
                  background: 'var(--cork-surface-2)',
                  color: 'var(--cork-text)',
                }}
              />
            </div>
          )}

          {/* Thread chips */}
          <div className="mt-3">
            <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--cork-text-dim)' }}>Ветка карточки</div>
            <div className="text-[11px] mb-2" style={{ color: 'var(--cork-text-mute)' }}>Пока только отображается на карточке. Фильтр по веткам появится позже.</div>
            <div className="flex flex-wrap gap-1.5">
              {THREADS.map((t) => {
                const active = t.value === thread
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setThread(t.value)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs transition-colors"
                    style={{
                      borderRadius: 'var(--cork-radius-pill)',
                      border: '1px solid',
                      borderColor: active ? 'var(--cork-brand)' : 'var(--cork-border)',
                      background: active ? 'var(--cork-surface-2)' : 'var(--cork-surface)',
                      color: active ? 'var(--cork-brand)' : 'var(--cork-text-dim)',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <span>{t.label}</span>
                  </button>
                )
              })}
            </div>
            {thread === '__custom__' && (
              <div className="mt-2">
                <input
                  type="text"
                  value={customThread}
                  onChange={(e) => setCustomThread(e.target.value)}
                  placeholder="Своя тема"
                  className="w-full px-3 py-2 text-sm outline-none"
                  style={{
                    borderRadius: 'var(--cork-radius-card)',
                    border: '1px solid var(--cork-border)',
                    background: 'var(--cork-surface-2)',
                    color: 'var(--cork-text)',
                  }}
                />
              </div>
            )}
          </div>

          {/* Proof preview / picker */}
          {proofType === 'photo' && proofValue && (
            <div className="mt-3 relative inline-block">
              <img src={proofValue} alt="preview" className="max-h-48 object-cover" style={{ borderRadius: 'var(--cork-radius-card)', border: '1px solid var(--cork-border)' }} />
              <button
                type="button"
                onClick={() => setProofValue(undefined)}
                aria-label="Убрать фото"
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center transition-colors"
                style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 'var(--cork-radius-pill)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>
          )}
          {proofType === 'url' && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2" style={{ borderRadius: 'var(--cork-radius-card)', border: '1px solid var(--cork-border)', background: 'var(--cork-surface-2)' }}>
              <span className="text-sm" style={{ color: 'var(--cork-text-mute)' }}>🔗</span>
              <input
                type="url"
                placeholder="https://..."
                value={proofValue ?? ''}
                onChange={(e) => setProofValue(e.target.value)}
                className="flex-1 border-0 outline-none text-sm bg-transparent"
                style={{ color: 'var(--cork-text)' }}
              />
              <button
                type="button"
                onClick={() => handleProofTypeChange('none')}
                aria-label="Убрать ссылку"
                style={{ color: 'var(--cork-text-mute)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>
          )}

          {/* Category chips */}
          <div className="mt-4">
            <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--cork-text-dim)' }}>Раздел архива</div>
            <div className="text-[11px] mb-2" style={{ color: 'var(--cork-text-mute)' }}>Для старой ленты и совместимости. Главный смысл задаётся типом заявки выше.</div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => {
                const active = c.value === category
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs transition-colors"
                    style={{
                      borderRadius: 'var(--cork-radius-pill)',
                      border: '1px solid',
                      borderColor: active ? 'var(--cork-brand)' : 'var(--cork-border)',
                      background: active ? 'var(--cork-surface-2)' : 'var(--cork-surface)',
                      color: active ? 'var(--cork-brand)' : 'var(--cork-text-dim)',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <CategoryIcon category={c.value} className="w-3.5 h-3.5" />
                    <span>{c.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t" style={{ borderColor: 'var(--cork-border-light)', background: 'var(--cork-surface-2)' }}>
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

            <div className="mx-1 h-6 w-px" style={{ background: 'var(--cork-border)' }} />

            {eventDate === null ? (
              <div className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs" style={{ color: 'var(--cork-text-dim)' }}>
                <CalendarIcon className="w-4 h-4" />
                <input
                  type="number"
                  min={MIN_YEAR}
                  max={currentYear}
                  value={year}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    if (!isNaN(v)) setYear(Math.max(MIN_YEAR, Math.min(currentYear, v)))
                  }}
                  className="w-14 bg-transparent border-0 outline-none text-xs font-medium tabular-nums"
                  style={{ color: 'var(--cork-text)' }}
                />
                <button
                  type="button"
                  onClick={() => setEventDate(`${year}-01-01`)}
                  className="ml-1 font-medium"
                  style={{ color: 'var(--cork-brand)' }}
                >
                  + дата
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs" style={{ color: 'var(--cork-text)' }}>
                <CalendarIcon className="w-4 h-4" />
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
                  className="bg-transparent border-0 outline-none text-xs font-medium"
                  style={{ color: 'var(--cork-text)' }}
                />
                <button
                  type="button"
                  onClick={() => setEventDate(null)}
                  aria-label="Только год"
                  title="Только год"
                  style={{ color: 'var(--cork-text-mute)' }}
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
            <span className="text-xs tabular-nums" style={{ color: countLeft < 50 ? 'var(--cork-brand-2)' : 'var(--cork-text-mute)' }}>
              {countLeft}
            </span>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-4 py-1.5 text-sm font-semibold shadow-sm transition-colors"
              style={{
                borderRadius: 'var(--cork-radius-pill)',
                background: canSubmit ? 'var(--cork-brand)' : 'var(--cork-surface-3)',
                color: canSubmit ? 'var(--cork-brand-ink)' : 'var(--cork-text-mute)',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              {submitting ? 'Отправка...' : challengeId ? 'Добавить в челлендж' : 'Отправить на проверку'}
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
      className="inline-flex items-center justify-center w-8 h-8 transition-colors"
      style={{
        borderRadius: 'var(--cork-radius-btn)',
        background: active ? 'var(--cork-surface-3)' : 'transparent',
        color: active ? 'var(--cork-brand)' : 'var(--cork-text-mute)',
      }}
    >
      {children}
    </button>
  )
}
