import { ActivityCalendar } from 'react-activity-calendar'
import { sessionsToHeatmap } from '@/shared/lib/heatmap'
import type { Profile } from '@/entities/profile/types'

interface Props {
  profile: Profile
  isOwn?: boolean
  onEdit?: () => void
}

export function ProfileCard({ profile, isOwn, onEdit }: Props) {
  const heatmapData = sessionsToHeatmap(profile.sessions)

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
          {profile.avatar
            ? <img src={profile.avatar} alt={profile.name} className="h-16 w-16 rounded-full object-cover" />
            : profile.name[0]?.toUpperCase()
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
              {profile.role}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
          {profile.goal && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">🎯 {profile.goal}</p>
          )}
        </div>
        {isOwn && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Редактировать
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            { label: 'Часов', value: profile.stats.totalHours },
            { label: 'Сессий', value: profile.stats.totalSessions },
            { label: 'Серия дней', value: profile.stats.streak },
            { label: 'Достижений', value: profile.stats.achievementCount },
          ] as const
        ).map(({ label, value }) => (
          <div key={label} className="rounded-xl bg-gray-50 p-3 text-center dark:bg-gray-800">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Активность за год</h3>
        <div className="overflow-x-auto">
          <ActivityCalendar
            data={heatmapData}
            showWeekdayLabels
            labels={{ totalCount: '{{count}} часов в {{year}} году' }}
          />
        </div>
      </div>

      {profile.achievements.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Достижения</h3>
          <div className="space-y-2">
            {profile.achievements.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                <span className="text-lg">🏅</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{a.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {a.olympiadName} · {a.place} место
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
