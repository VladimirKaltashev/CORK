import { useState } from 'react'
import { Button, Label } from '@primer/react'
import { useAuthStore } from '@/entities/auth'
import { useAchievementsStore } from '@/entities/achievements/store'
import { ReactionBar } from '@/features/reactions'
import { getEventDate, formatAchievementDate } from '@/shared/lib/achievementDate'
import { CategoryIcon, CheckIcon, HourglassIcon, CrossMarkIcon } from '@/shared/ui'
import type { Achievement, AchievementCategory, AchievementStatus } from '@/shared/types'

type LabelVariant = 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'attention' | 'severe' | 'danger' | 'done' | 'sponsors'

const CATEGORY_META: Record<AchievementCategory, { label: string; variant: LabelVariant }> = {
  olympiad: { label: 'Олимпиады',    variant: 'primary' },
  academic: { label: 'Успеваемость', variant: 'success' },
  it:       { label: 'IT',           variant: 'accent' },
  creative: { label: 'Творчество',   variant: 'sponsors' },
  sport:    { label: 'Спорт',        variant: 'attention' },
  movies:   { label: 'Фильмы',       variant: 'done' },
  games:    { label: 'Игры',         variant: 'severe' },
  other:    { label: 'Интересное',   variant: 'secondary' },
}

function StatusBadge({ status }: { status: AchievementStatus }) {
  if (status === 'verified') {
    return (
      <CheckIcon
        className="ml-auto w-5 h-5 text-green-600 dark:text-green-400"
        aria-label="Подтверждено"
      />
    )
  }
  if (status === 'pending') {
    return (
      <HourglassIcon
        className="ml-auto w-5 h-5"
        aria-label="На проверке"
      />
    )
  }
  return (
    <CrossMarkIcon
      className="ml-auto w-5 h-5"
      aria-label="Отклонено"
    />
  )
}

interface AchievementCardProps {
  achievement: Achievement
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const meta = CATEGORY_META[achievement.category]
  const { user } = useAuthStore()
  const { updateAchievementStatus } = useAchievementsStore()
  const isAdmin = user?.role === 'admin'

  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleApprove = () => {
    updateAchievementStatus(achievement.id, 'verified')
  }

  const handleReject = () => {
    updateAchievementStatus(achievement.id, 'rejected', rejectionReason.trim() || undefined)
    setShowRejectForm(false)
    setRejectionReason('')
  }

  const proofHref =
    achievement.proofType !== 'none' && achievement.proofValue
      ? achievement.proofValue
      : undefined

  const descTruncated =
    achievement.description.length > 100
      ? achievement.description.slice(0, 100) + '…'
      : achievement.description

  return (
    <div className="border border-gray-300 rounded-md bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-gray-700 dark:text-gray-300">
          <CategoryIcon category={achievement.category} className="w-7 h-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1 mb-1">
            <Label variant={meta.variant}>{meta.label}</Label>
            <span className="text-xs text-gray-500">{formatAchievementDate(getEventDate(achievement.meta), achievement.year)}</span>
            <StatusBadge status={achievement.status} />
          </div>
          <p className="font-semibold text-gray-900 m-0 dark:text-white">{achievement.title}</p>
          {descTruncated && (
            <p className="text-sm text-gray-600 mt-0.5 m-0 dark:text-gray-300">{descTruncated}</p>
          )}
          {achievement.status === 'rejected' && achievement.rejectionReason && (
            <p className="text-xs text-red-500 mt-1 m-0">Причина: {achievement.rejectionReason}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {proofHref && (
              <a
                href={proofHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Открыть доказательство
              </a>
            )}
            {isAdmin && achievement.status === 'pending' && !showRejectForm && (
              <>
                <Button size="small" variant="primary" onClick={handleApprove}>Подтвердить</Button>
                <Button size="small" variant="danger" onClick={() => setShowRejectForm(true)}>Отклонить</Button>
              </>
            )}
            {achievement.status === 'verified' && (
              <div className="ml-auto">
                <ReactionBar achievementId={achievement.id} disabled={!user} size="sm" />
              </div>
            )}
          </div>
        </div>
      </div>

      {showRejectForm && (
        <div className="mt-3 border-t border-gray-200 pt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Причина отклонения (необязательно)</label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={2}
            placeholder="Укажите причину..."
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm resize-none"
          />
          <div className="flex gap-2 mt-2">
            <Button size="small" onClick={() => setShowRejectForm(false)}>Отмена</Button>
            <Button size="small" variant="danger" onClick={handleReject}>Отклонить</Button>
          </div>
        </div>
      )}
    </div>
  )
}
