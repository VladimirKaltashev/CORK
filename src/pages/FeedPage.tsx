import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@primer/react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/entities/auth'
import { useFriendsStore } from '@/entities/friends'
import { useReactionsStore } from '@/entities/reactions'
import { ReactionBar, BudgetWidget } from '@/features/reactions'
import { InlineCreateCard } from '@/features/profile/InlineCreateCard'
import { ChallengeBanner } from '@/features/challenges'
import { getEventDate, formatAchievementDate } from '@/shared/lib/achievementDate'
import type { AchievementCategory, ProofType } from '@/shared/types'

function useDismissibleBanner() {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('hideChallengeBanner') === 'true'
  })
  const dismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('hideChallengeBanner', 'true')
  }
  return { isDismissed, dismiss }
}

const PAGE_SIZE = 10

type CategoryFilter = AchievementCategory | 'all'

const FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: 'all',      label: 'Все' },
  { value: 'olympiad', label: 'Олимпиады' },
  { value: 'academic', label: 'Успеваемость' },
  { value: 'it',       label: 'IT' },
  { value: 'creative', label: 'Творчество' },
  { value: 'sport',    label: 'Спорт' },
  { value: 'movies',   label: 'Фильмы' },
  { value: 'games',    label: 'Игры' },
  { value: 'other',    label: 'Другое' },
]

interface FeedItem {
  id: string
  userId: string
  userName: string
  userAvatar: string | null
  category: AchievementCategory
  title: string
  description: string
  year: number
  eventDate: string | null
  proofType: ProofType
  proofValue?: string
  createdAt: string
}

function formatRelativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ru })
  } catch {
    return dateStr
  }
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
}

function UserAvatar({ userId, name, avatar }: { userId: string; name: string; avatar: string | null }) {
  return (
    <Link to={`/profile/${userId}`} className="flex-shrink-0">
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200 hover:ring-indigo-400 transition-all"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold ring-1 ring-gray-200 hover:ring-indigo-400 transition-all select-none">
          {getInitials(name)}
        </div>
      )}
    </Link>
  )
}

async function loadPage(
  offset: number,
  category: CategoryFilter,
  friendIds?: string[],
): Promise<{ items: FeedItem[]; hasMore: boolean }> {
  if (friendIds !== undefined && friendIds.length === 0) {
    return { items: [], hasMore: false }
  }

  let query = supabase
    .from('achievements')
    .select('*')
    .eq('status', 'verified')

  if (category !== 'all') {
    query = query.eq('category', category)
  }

  if (friendIds && friendIds.length > 0) {
    query = query.in('user_id', friendIds)
  }

  const { data: achData, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error) throw error
  if (!achData?.length) return { items: [], hasMore: false }

  const userIds = [...new Set(achData.map((r) => r.user_id))]

  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, name, avatar')
    .in('id', userIds)

  const profileMap: Record<string, { name: string; avatar: string | null }> = Object.fromEntries(
    (profilesData ?? []).map((p) => [p.id, { name: p.name, avatar: p.avatar ?? null }])
  )

  return {
    items: achData.map((row) => ({
      id: row.id,
      userId: row.user_id,
      userName: profileMap[row.user_id]?.name ?? 'Пользователь',
      userAvatar: profileMap[row.user_id]?.avatar ?? null,
      category: row.category,
      title: row.title,
      description: row.description,
      year: row.year,
      eventDate: getEventDate(row.meta as Record<string, unknown> | null),
      proofType: row.proof_type,
      proofValue: row.proof_value ?? undefined,
      createdAt: row.created_at,
    })),
    hasMore: achData.length === PAGE_SIZE,
  }
}

type FeedMode = 'all' | 'friends'

export function FeedPage() {
  const { user } = useAuthStore()
  const friendsStore = useFriendsStore()
  const loadReactions = useReactionsStore((s) => s.loadForAchievements)
  const [items, setItems] = useState<FeedItem[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [feedMode, setFeedMode] = useState<FeedMode>('all')

  const getFriendIds = (): string[] | undefined =>
    feedMode === 'friends' ? friendsStore.acceptedFriendIds() : undefined

  const fetchInitial = (cat: CategoryFilter, mode: FeedMode) => {
    const fIds = mode === 'friends' ? friendsStore.acceptedFriendIds() : undefined
    setIsLoading(true)
    loadPage(0, cat, fIds)
      .then(({ items: loaded, hasMore: more }) => {
        setItems(loaded)
        setOffset(loaded.length)
        setHasMore(more)
        loadReactions(loaded.map((i) => i.id), user?.id)
      })
      .catch(() => showToast('error', 'Не удалось загрузить ленту'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInitial(category, feedMode)
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (cat: CategoryFilter) => {
    if (cat === category) return
    setCategory(cat)
    setItems([])
    setOffset(0)
    setHasMore(true)
    fetchInitial(cat, feedMode)
  }

  const handleModeChange = (mode: FeedMode) => {
    if (mode === feedMode) return
    setFeedMode(mode)
    setItems([])
    setOffset(0)
    setHasMore(true)
    fetchInitial(category, mode)
  }

  const handleLoadMore = async () => {
    setLoadingMore(true)
    try {
      const { items: more, hasMore: moreExists } = await loadPage(offset, category, getFriendIds())
      setItems((prev) => [...prev, ...more])
      setOffset((prev) => prev + more.length)
      setHasMore(moreExists)
      loadReactions(more.map((i) => i.id), user?.id)
    } catch {
      showToast('error', 'Не удалось загрузить ещё')
    } finally {
      setLoadingMore(false)
    }
  }

  const { isDismissed, dismiss } = useDismissibleBanner()

  return (
    <div className="flex gap-8 max-w-7xl mx-auto px-4 py-6">
      {/* Main content — wide feed */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Лента достижений</h1>
          {/* Mode toggle for mobile/small screens */}
          <div className="flex rounded-md border border-gray-300 overflow-hidden text-sm dark:border-gray-700">
            {(['all', 'friends'] as FeedMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleModeChange(mode)}
                className={`px-3 py-1.5 transition-colors ${
                  feedMode === mode
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {mode === 'all' ? 'Все' : 'Друзья'}
              </button>
            ))}
          </div>
        </div>

        {/* Feed items */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-300 rounded-md bg-white p-4 dark:border-gray-700 dark:bg-gray-800 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-md py-10 text-center">
            <span className="text-sm text-gray-500">
              {feedMode === 'friends'
                ? 'У вас пока нет друзей с достижениями'
                : 'Достижений пока нет'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.id} className="border border-gray-300 rounded-md bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex gap-3">
                  {/* Avatar */}
                  <UserAvatar userId={item.userId} name={item.userName} avatar={item.userAvatar} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            to={`/profile/${item.userId}`}
                            className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors dark:text-white dark:hover:text-indigo-400"
                          >
                            {item.userName}
                          </Link>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-gray-400">{formatRelativeTime(item.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-gray-400 uppercase tracking-wide">{item.category}</span>
                          <span className="text-xs text-gray-400">· {formatAchievementDate(item.eventDate, item.year)}</span>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <ReactionBar achievementId={item.id} disabled={!user} size="sm" />
                      </div>
                    </div>

                    <h2 className="text-base font-semibold text-gray-900 mt-2 dark:text-white">{item.title}</h2>
                    <p className="text-sm text-gray-600 mt-0.5 dark:text-gray-300">{item.description}</p>

                    {item.proofType === 'url' && item.proofValue && (
                      <a
                        href={item.proofValue}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                      >
                        Доказательство →
                      </a>
                    )}
                    {item.proofType === 'photo' && item.proofValue && (
                      <img
                        src={item.proofValue}
                        alt="Доказательство"
                        className="mt-2 h-28 w-auto rounded object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button onClick={handleLoadMore} disabled={loadingMore}>
                  {loadingMore ? 'Загрузка...' : 'Загрузить ещё'}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Sidebar — hidden on mobile/tablet */}
      <aside className="w-72 flex-shrink-0 hidden lg:block">
        <div className="sticky top-24 space-y-6">
          {/* Budget — only for logged in users */}
          {user && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 dark:text-white">Бюджет</h3>
              <BudgetWidget />
            </div>
          )}

          {/* Create button — only for logged in users */}
          {user && (
            <div>
              <InlineCreateCard />
            </div>
          )}

          {/* Category filters */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 dark:text-white">Фильтры</h3>
            <div className="space-y-2">
              {FILTERS.map((f) => (
                <label
                  key={f.value}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    category === f.value
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={f.value}
                    checked={category === f.value}
                    onChange={() => handleFilterChange(f.value)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Challenge banner — dismissible */}
          {!isDismissed && (
            <div className="relative border border-gray-300 rounded-md bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <button
                type="button"
                onClick={dismiss}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                title="Скрыть"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <ChallengeBanner />
              <p className="text-xs text-gray-400 mt-2">Можно отключить в настройках</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
