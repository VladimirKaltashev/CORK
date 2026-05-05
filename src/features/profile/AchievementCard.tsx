import { useState } from 'react'
import { Button, Label } from '@primer/react'
import { useAuthStore } from '@/entities/auth'
import { useAchievementsStore } from '@/entities/achievements/store'
import type { Achievement, AchievementCategory, AchievementStatus } from '@/shared/types'

type LabelVariant = 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'attention' | 'severe' | 'danger' | 'done' | 'sponsors'

const CATEGORY_META: Record<AchievementCategory, { icon: string; label: string; variant: LabelVariant }> = {
  olympiad: { icon: '🎓', label: 'Олимпиады',    variant: 'primary' },
  academic: { icon: '📚', label: 'Успеваемость', variant: 'success' },
  it:       { icon: '💻', label: 'IT',           variant: 'accent' },
  creative: { icon: '🎨', label: 'Творчество',   variant: 'sponsors' },
  sport:    { icon: '⚽', label: 'Спорт',        variant: 'attention' },
  movies:   { icon: '🎬', label: 'Фильмы',       variant: 'done' },
  games:    { icon: '🎮', label: 'Игры',         variant: 'severe' },
  other:    { icon: '✨', label: 'Интересное',   variant: 'secondary' },
}

const STATUS_ICON: Record<AchievementStatus, string> = {
  pending:  '⏳',
  verified: '✅',
  rejected: '❌',
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
    <div className="border border-gray-300 rounded-md bg-white p-3">
      <div className="flex items-start gap-3">
        <div className="text-2xl select-none leading-none mt-0.5">{meta.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1 mb-1">
            <Label variant={meta.variant}>{meta.label}</Label>
            <span className="text-xs text-gray-500">{achievement.year}</span>
            <span
              className="ml-auto text-base leading-none"
              title={{ pending: 'На проверке', verified: 'Подтверждено', rejected: 'Отклонено' }[achievement.status]}
            >
              {STATUS_ICON[achievement.status]}
            </span>
          </div>
          <p className="font-semibold text-gray-900 m-0">{achievement.title}</p>
          {descTruncated && (
            <p className="text-sm text-gray-600 mt-0.5 m-0">{descTruncated}</p>
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
