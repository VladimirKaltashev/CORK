import { useFeedStore } from '@/entities/feed'
import type { FilterType } from '@/entities/feed/types'
import { SessionCard } from './SessionCard'
import { AchievementCard } from './AchievementCard'
import { PostCard } from './PostCard'
import { cn } from '@/shared/lib/cn'

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'session', label: '📚 Сессии' },
  { value: 'achievement', label: '🏅 Достижения' },
  { value: 'post', label: '💬 Посты' },
]

export function FeedList() {
  const { items, hasMore, isLoading, filter, setFilter, fetchFeed } = useFeedStore()

  const handleFilter = (f: FilterType) => {
    setFilter(f)
    fetchFeed(true)
  }

  return (
    <div className="space-y-4">
      {/* Фильтры */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleFilter(value)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              filter === value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Карточки */}
      <div className="space-y-3">
        {items.map((item) => {
          if (item.type === 'session') return <SessionCard key={item.id} {...item} />
          if (item.type === 'achievement') return <AchievementCard key={item.id} {...item} />
          if (item.type === 'post') return <PostCard key={item.id} {...item} />
          return null
        })}
      </div>

      {items.length === 0 && !isLoading && (
        <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          Ничего не найдено
        </p>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={() => fetchFeed()}
          disabled={isLoading}
          className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          {isLoading ? 'Загрузка...' : 'Загрузить ещё'}
        </button>
      )}
    </div>
  )
}
