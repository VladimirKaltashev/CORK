import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Achievement, AchievementCategory } from '@/shared/types'

const CATEGORY_META: Record<AchievementCategory, { icon: string; label: string; color: string }> = {
  education: { icon: '🎓', label: 'Образование', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  sport:     { icon: '🏆', label: 'Спорт',       color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  it:        { icon: '💻', label: 'IT',           color: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  creative:  { icon: '🎨', label: 'Творчество',   color: 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  life:      { icon: '✨', label: 'Жизнь',        color: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
}

interface AchievementCardProps {
  achievement: Achievement
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const meta = CATEGORY_META[achievement.category]
  const dateFormatted = (() => {
    try { return format(new Date(achievement.date), 'd MMMM yyyy', { locale: ru }) }
    catch { return achievement.date }
  })()

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl dark:bg-gray-700">
          {meta.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
              {meta.label}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{dateFormatted}</span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{achievement.title}</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
          {achievement.proofUrl && (
            <a
              href={achievement.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Открыть подтверждение →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
