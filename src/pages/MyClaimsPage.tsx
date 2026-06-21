import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/entities/auth'
import { useAchievementsStore } from '@/entities/achievements/store'
import { useReactionsStore } from '@/entities/reactions'
import { useCreateAchievementDialog } from '@/entities/achievements/createDialog'
import { AchievementCard } from '@/features/profile/AchievementCard'
import { buildOwnClaimsStats, matchesOwnClaimsFilter, type OwnClaimsFilter } from '@/entities/claims'

const FILTERS: Array<{ value: OwnClaimsFilter; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'arena', label: 'На арене' },
  { value: 'crowned', label: 'Коронованы' },
  { value: 'clowned', label: 'Заклоунены' },
]

export function MyClaimsPage() {
  const user = useAuthStore((s) => s.user)
  const { achievements, isLoading, loadAchievements } = useAchievementsStore()
  const loadReactions = useReactionsStore((s) => s.loadForAchievements)
  const verdicts = useReactionsStore((s) => s.byAchievement)
  const openCreateDialog = useCreateAchievementDialog((s) => s.open)
  const [filter, setFilter] = useState<OwnClaimsFilter>('all')

  useEffect(() => {
    if (!user?.id) return
    loadAchievements(user.id)
  }, [user?.id, loadAchievements])

  useEffect(() => {
    const verifiedIds = achievements.filter((achievement) => achievement.status === 'verified').map((achievement) => achievement.id)
    if (verifiedIds.length === 0) return
    loadReactions(verifiedIds, user?.id)
  }, [achievements, loadReactions, user?.id])

  const stats = buildOwnClaimsStats(achievements, verdicts)
  const visibleClaims = achievements.filter((achievement) =>
    matchesOwnClaimsFilter(achievement, filter, verdicts[achievement.id])
  )

  return (
    <div className="mx-auto max-w-4xl py-4 px-3 flex flex-col gap-4">
      <div className="cork-card">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold leading-tight m-0" style={{ color: 'var(--cork-text)' }}>Моё</h1>
            <p className="text-sm mt-2 mb-0" style={{ color: 'var(--cork-text-dim)' }}>
              Здесь вы следите за своими заявками, проверкой и исходами арены.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={openCreateDialog}
              className="cork-btn cork-btn-primary"
              style={{ textTransform: 'none', letterSpacing: 'normal' }}
            >
              Новая заявка
            </button>
            <Link to="/profile/me" className="cork-btn" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
              Профиль
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="cork-stat"><b>{stats.totalClaims}</b><small>всего</small></div>
        <div className="cork-stat"><b>{stats.activeCount}</b><small>на арене</small></div>
        <div className="cork-stat"><b>{stats.crownedCount}</b><small>коронованы</small></div>
        <div className="cork-stat"><b>{stats.clownedCount}</b><small>заклоунены</small></div>
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
