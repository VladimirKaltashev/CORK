import { useFeedStore } from '@/entities/feed'
import type { FilterType } from '@/entities/feed/types'
import { SessionCard } from './SessionCard'
import { AchievementCard } from './AchievementCard'
import { PostCard } from './PostCard'
import { cn } from '@/shared/lib/cn'

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'session', label: '📚 Сессии' },
  { value: 'achievement', label: '⚖️ Заявки' },
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
                ? 'bg-[var(--cork-brand)] text-white'
                : 'hover:bg-[var(--cork-surface-3)]',
            )}
            style={filter === value ? {} : { background: 'var(--cork-surface-3)', color: 'var(--cork-text-dim)' }}
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
        <p className="py-12 text-center text-sm" style={{ color: 'var(--cork-text-mute)' }}>
          Ничего не найдено
        </p>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={() => fetchFeed()}
          disabled={isLoading}
          className="cork-btn w-full"
        >
          {isLoading ? 'Загрузка...' : 'Загрузить ещё'}
        </button>
      )}
    </div>
  )
}
