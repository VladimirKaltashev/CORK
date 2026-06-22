import { useEffect, useState } from 'react'
import { useAuthStore } from '@/entities/auth'
import { useAchievementsStore } from '@/entities/achievements/store'
import { useReactionsStore } from '@/entities/reactions'
import { AchievementCard } from '@/features/profile/AchievementCard'
import { buildOwnClaimsStats, isClaimVisibleInOwnerView, matchesOwnClaimsFilter, type OwnClaimsFilter } from '@/entities/claims'

const FILTERS: Array<{ value: OwnClaimsFilter; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'arena', label: 'На арене' },
  { value: 'crowned', label: 'Корона ведёт' },
  { value: 'clowned', label: 'Клоун ведёт' },
]

export function MyClaimsPage() {
  const user = useAuthStore((s) => s.user)
  const { achievements, isLoading, loadAchievements } = useAchievementsStore()
  const loadReactions = useReactionsStore((s) => s.loadForAchievements)
  const verdicts = useReactionsStore((s) => s.byAchievement)
  const [filter, setFilter] = useState<OwnClaimsFilter>('all')

  useEffect(() => {
    if (!user?.id) return
    loadAchievements(user.id)
  }, [user?.id, loadAchievements])

  useEffect(() => {
    const liveIds = achievements.filter((achievement) => isClaimVisibleInOwnerView(achievement)).map((achievement) => achievement.id)
    if (liveIds.length === 0) return
    loadReactions(liveIds, user?.id)
  }, [achievements, loadReactions, user?.id])

  const visibleOwnClaims = achievements.filter((achievement) => isClaimVisibleInOwnerView(achievement))
  const stats = buildOwnClaimsStats(visibleOwnClaims, verdicts)
  const visibleClaims = visibleOwnClaims.filter((achievement) =>
    matchesOwnClaimsFilter(achievement, filter, verdicts[achievement.id])
  )

  return (
    <div className="mx-auto max-w-4xl py-4 px-3 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold leading-tight m-0" style={{ color: 'var(--cork-text)' }}>Мои заявки</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="cork-stat"><b>{stats.totalClaims}</b><small>Всего</small></div>
        <div className="cork-stat"><b>{stats.activeCount}</b><small>На арене</small></div>
        <div className="cork-stat"><b>{stats.crownedCount}</b><small>Корона ведёт</small></div>
        <div className="cork-stat"><b>{stats.clownedCount}</b><small>Клоун ведёт</small></div>
      </div>

      <div className="cork-tabs flex-wrap">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`cork-tab ${filter === item.value ? 'active' : ''}`}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="cork-empty">Загрузка заявок...</div>
      ) : visibleClaims.length === 0 ? (
        <div className="cork-empty">
          {filter === 'all' ? 'У вас пока нет заявок.' : 'Под выбранный фильтр заявок пока нет.'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visibleClaims.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} showModerationStatus />
          ))}
        </div>
      )}
    </div>
  )
}
