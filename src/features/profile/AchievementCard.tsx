import { Label } from '@primer/react'
import type { Achievement, AchievementCategory } from '@/shared/types'

type LabelVariant = 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'attention' | 'severe' | 'danger' | 'done' | 'sponsors'

const CATEGORY_META: Record<AchievementCategory, { label: string; variant: LabelVariant }> = {
  olympiad: { label: 'Олимпиады',    variant: 'primary' },
  academic: { label: 'Успеваемость', variant: 'success' },
  it:       { label: 'IT',           variant: 'accent' },
  creative: { label: 'Творчество',   variant: 'sponsors' },
  sport:    { label: 'Спорт',        variant: 'attention' },
  other:    { label: 'Интересное',   variant: 'secondary' },
}

interface AchievementCardProps {
  achievement: Achievement
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const meta = CATEGORY_META[achievement.category]

  return (
    <div className="border border-gray-300 rounded-md bg-white p-3">
      <div className="flex items-start gap-3">
        {achievement.proofImage && (
          <img
            src={achievement.proofImage}
            alt="Подтверждение"
            className="h-16 w-16 flex-shrink-0 rounded object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1 mb-1">
            <Label variant={meta.variant}>{meta.label}</Label>
            <span className="text-xs text-gray-500">{achievement.year}</span>
          </div>
          <p className="font-bold text-gray-900 m-0">{achievement.title}</p>
        </div>
      </div>
    </div>
  )
}