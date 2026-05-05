import type { Achievement, AchievementCategory } from '@/shared/types'

const CATEGORY_META: Record<AchievementCategory, { label: string; color: string }> = {
  olympiad: { label: 'Олимпиады',    color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  academic: { label: 'Успеваемость', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  it:       { label: 'IT',           color: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  creative: { label: 'Творчество',   color: 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  sport:    { label: 'Спорт',        color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  other:    { label: 'Интересное',   color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
}

interface AchievementCardProps {
  achievement: Achievement
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const meta = CATEGORY_META[achievement.category]

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:p-5">
      <div className="flex items-start gap-4">
        {achievement.proofImage && (
          <img
            src={achievement.proofImage}
            alt="Подтверждение"
            className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
              {meta.label}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{achievement.year}</span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{achievement.title}</h3>
        </div>
      </div>
    </div>
  )
}
