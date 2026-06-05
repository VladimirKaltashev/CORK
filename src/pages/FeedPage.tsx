import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@primer/react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/entities/auth'
import { useFriendsStore } from '@/entities/friends'
import { useReactionsStore, REACTION_COST } from '@/entities/reactions'
import { ReactionBar, BudgetWidget } from '@/features/reactions'
import { InlineCreateCard } from '@/features/profile/InlineCreateCard'
import { ChallengeBanner } from '@/features/challenges'
import { getEventDate, formatAchievementDate } from '@/shared/lib/achievementDate'
import type { AchievementCategory, ProofType } from '@/shared/types'
import type { ReactionKind } from '@/entities/reactions'

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
          className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200 hover:ring-brand transition-all"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold ring-1 ring-gray-200 hover:ring-brand transition-all select-none">
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

function VerdictBar({ achievementId }: { achievementId: string }) {
  const agg = useReactionsStore((s) => s.byAchievement[achievementId])
  const crowns = agg?.crowns ?? 0
  const clowns = agg?.clowns ?? 0
  const total = crowns + clowns
  const kingPct = total > 0 ? Math.round((crowns / total) * 100) : 50

  return (
    <div className="verdict">
      <div className="c-verdict-bar" style={{ '--pct': `${kingPct}%` } as React.CSSProperties}>
        <div className="c-verdict-king" />
        <div className="c-verdict-clown" />
        <span className="c-verdict-lbl king">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19A1 1 0 0 1 18 20H6A1 1 0 0 1 5 19V18H19V19Z" />
          </svg>
          {kingPct}%
        </span>
        <span className="c-verdict-lbl clown">
          {100 - kingPct}%
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.47 2 2 6.47 2 12C2 17.53 6.47 22 12 22C17.53 22 22 17.53 22 12C22 6.47 17.53 2 12 2M12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20M8.5 14C9.88 14 11 13.1 11 12C11 10.9 9.88 10 8.5 10C7.12 10 6 10.9 6 12C6 13.1 7.12 14 8.5 14M15.5 14C16.88 14 18 13.1 18 12C18 10.9 16.88 10 15.5 10C14.12 10 13 10.9 13 12C13 13.1 14.12 14 15.5 14M12 18C10.33 18 8.86 17.18 8.03 15.97L9.55 14.45C10.09 15.27 10.03 16.17 12 16.17C13.97 16.17 13.91 15.27 14.45 14.45L15.97 15.97C15.14 17.18 13.67 18 12 18Z" />
          </svg>
        </span>
      </div>
    </div>
  )
}

function VoteButtons({ achievementId, disabled = false }: { achievementId: string; disabled?: boolean }) {
  const agg = useReactionsStore((s) => s.byAchievement[achievementId])
  const pending = useReactionsStore((s) => s.pending.has(achievementId))
  const budgetRemaining = useReactionsStore((s) => s.budgetRemaining)
  const toggle = useReactionsStore((s) => s.toggle)
  const myKind = agg?.myKind ?? null

  const handleClick = (kind: ReactionKind) => {
    if (disabled || pending) return
    if (myKind !== kind && budgetRemaining < REACTION_COST[kind]) return
    toggle(achievementId, kind)
  }

  return (
    <div className="flex gap-2.5 mt-3">
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => handleClick('crown')}
        className={`c-vote-btn c-vote-king ${myKind === 'crown' ? 'c-btn-primary' : ''}`}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19A1 1 0 0 1 18 20H6A1 1 0 0 1 5 19V18H19V19Z" />
        </svg>
        Король
      </button>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => handleClick('clown')}
        className={`c-vote-btn c-vote-clown ${myKind === 'clown' ? 'c-btn-clown' : ''}`}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.47 2 2 6.47 2 12C2 17.53 6.47 22 12 22C17.53 22 22 17.53 22 12C22 6.47 17.53 2 12 2M12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20M8.5 14C9.88 14 11 13.1 11 12C11 10.9 9.88 10 8.5 10C7.12 10 6 10.9 6 12C6 13.1 7.12 14 8.5 14M15.5 14C16.88 14 18 13.1 18 12C18 10.9 16.88 10 15.5 10C14.12 10 13 10.9 13 12C13 13.1 14.12 14 15.5 14M12 18C10.33 18 8.86 17.18 8.03 15.97L9.55 14.45C10.09 15.27 10.03 16.17 12 16.17C13.97 16.17 13.91 15.27 14.45 14.45L15.97 15.97C15.14 17.18 13.67 18 12 18Z" />
        </svg>
        Шут
      </button>
    </div>
  )
}

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
          <h1 className="c-head text-2xl font-bold text-gray-900 dark:text-white">Лента достижений</h1>
          {/* Mode toggle */}
          <div className="c-feed-tabs">
            {(['all', 'friends'] as FeedMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleModeChange(mode)}
                className={feedMode === mode ? 'active' : ''}
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
              <div key={i} className="c-card animate-pulse">
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
          <div className="c-card border-dashed py-10 text-center">
            <span className="text-sm text-gray-500">
              {feedMode === 'friends'
                ? 'У вас пока нет друзей с достижениями'
                : 'Достижений пока нет'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <article key={item.id} className="c-card">
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
                            className="text-sm font-semibold text-gray-900 hover:text-brand transition-colors dark:text-white"
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
                        <span className="c-lvl">{item.category}</span>
                      </div>
                    </div>

                    <h2 className="c-title text-base font-semibold text-gray-900 mt-2 dark:text-white">{item.title}</h2>
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

                    {/* Verdict bar */}
                    <div className="mt-4">
                      <VerdictBar achievementId={item.id} />
                      <VoteButtons achievementId={item.id} disabled={!user} />
                    </div>

                    {/* Card footer */}
                    <div className="c-card-foot mt-4">
                      <span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <ReactionBar achievementId={item.id} disabled={!user} size="sm" />
                      </span>
                      <span className="spacer">↗ Поделиться</span>
                    </div>
                  </div>
                </div>
              </article>
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

      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 hidden lg:block">
        <div className="sticky top-24 space-y-6">
          {/* Budget — only for logged in users */}
          {user && (
            <div>
              <h3 className="c-panel-title text-sm font-semibold text-gray-900 mb-3 dark:text-white">Бюджет</h3>
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
          <div className="c-panel">
            <h3 className="c-panel-title text-sm font-semibold text-gray-900 mb-3 dark:text-white">Фильтры</h3>
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

          {/* Challenge banner */}
          {!isDismissed && (
            <div className="c-panel relative">
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

          {/* Leaderboard */}
          <div className="c-panel">
            <h3 className="c-panel-title text-sm font-semibold text-gray-900 mb-3 dark:text-white">👑 Короли недели</h3>
            <div className="c-lb-item">
              <span className="c-lb-rank top">1</span>
              <span className="c-lb-av">СР</span>
              <span className="c-lb-name">София Р.</span>
              <span className="c-lb-score">14.9k</span>
            </div>
            <div className="c-lb-item">
              <span className="c-lb-rank top">2</span>
              <span className="c-lb-av">МВ</span>
              <span className="c-lb-name">Макс Ветров</span>
              <span className="c-lb-score">13.2k</span>
            </div>
            <div className="c-lb-item">
              <span className="c-lb-rank top">3</span>
              <span className="c-lb-av">АК</span>
              <span className="c-lb-name">Алина Кей</span>
              <span className="c-lb-score">12.4k</span>
            </div>
            <div className="c-lb-item">
              <span className="c-lb-rank">4</span>
              <span className="c-lb-av">ДН</span>
              <span className="c-lb-name">Дэн Новак</span>
              <span className="c-lb-score">10.1k</span>
            </div>
            <div className="c-lb-item">
              <span className="c-lb-rank">5</span>
              <span className="c-lb-av">ЛП</span>
              <span className="c-lb-name">Лена П.</span>
              <span className="c-lb-score">9.7k</span>
            </div>
          </div>

          {/* Trending */}
          <div className="c-panel">
            <h3 className="c-panel-title text-sm font-semibold text-gray-900 mb-3 dark:text-white"># В тренде</h3>
            <div className="flex flex-wrap gap-2">
              <span className="c-tag-pill">#спорт</span>
              <span className="c-tag-pill">#стартап</span>
              <span className="c-tag-pill">#музыка</span>
              <span className="c-tag-pill">#учёба</span>
              <span className="c-tag-pill">#кодинг</span>
              <span className="c-tag-pill">#искусство</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}