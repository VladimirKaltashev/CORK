/*******************************************************************************
 * ACID POP — FeedPage
 * Полностью новая реализация для Acid Pop темы.
 * Использует CSS-классы из acid-pop.css, не мешает light/dark/system.
 ******************************************************************************/

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/entities/auth'
import { useFriendsStore } from '@/entities/friends'
import { useReactionsStore, REACTION_COST } from '@/entities/reactions'
import { BudgetWidget } from '@/features/reactions'
import { InlineCreateCard } from '@/features/profile/InlineCreateCard'
import { ChallengeBanner } from '@/features/challenges'
import { getEventDate, formatAchievementDate } from '@/shared/lib/achievementDate'
import type { AchievementCategory, ProofType } from '@/shared/types'
import type { ReactionKind } from '@/entities/reactions'

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
    <div className="ap-verdict">
      <div className="ap-verdict-track">
        <div
          className="ap-verdict-king"
          style={{ width: `${kingPct}%` }}
        >
          <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19A1 1 0 0 1 18 20H6A1 1 0 0 1 5 19V18H19V19Z" />
          </svg>
          {kingPct}%
        </div>
        <div
          className="ap-verdict-clown"
          style={{ width: `${100 - kingPct}%` }}
        >
          {100 - kingPct}%
          <svg className="w-3.5 h-3.5 ml-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.47 2 2 6.47 2 12C2 17.53 6.47 22 12 22C17.53 22 22 17.53 22 12C22 6.47 17.53 2 12 2M12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20M8.5 14C9.88 14 11 13.1 11 12C11 10.9 9.88 10 8.5 10C7.12 10 6 10.9 6 12C6 13.1 7.12 14 8.5 14M15.5 14C16.88 14 18 13.1 18 12C18 10.9 16.88 10 15.5 10C14.12 10 13 10.9 13 12C13 13.1 14.12 14 15.5 14M12 18C10.33 18 8.86 17.18 8.03 15.97L9.55 14.45C10.09 15.27 10.03 16.17 12 16.17C13.97 16.17 13.91 15.27 14.45 14.45L15.97 15.97C15.14 17.18 13.67 18 12 18Z" />
          </svg>
        </div>
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
    <div className="ap-vote-row">
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => handleClick('crown')}
        className={`ap-vote-btn king ${myKind === 'crown' ? 'active' : ''}`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19A1 1 0 0 1 18 20H6A1 1 0 0 1 5 19V18H19V19Z" />
        </svg>
        Король
      </button>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => handleClick('clown')}
        className={`ap-vote-btn clown ${myKind === 'clown' ? 'active' : ''}`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.47 2 2 6.47 2 12C2 17.53 6.47 22 12 22C17.53 22 22 17.53 22 12C22 6.47 17.53 2 12 2M12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20M8.5 14C9.88 14 11 13.1 11 12C11 10.9 9.88 10 8.5 10C7.12 10 6 10.9 6 12C6 13.1 7.12 14 8.5 14M15.5 14C16.88 14 18 13.1 18 12C18 10.9 16.88 10 15.5 10C14.12 10 13 10.9 13 12C13 13.1 14.12 14 15.5 14M12 18C10.33 18 8.86 17.18 8.03 15.97L9.55 14.45C10.09 15.27 10.03 16.17 12 16.17C13.97 16.17 13.91 15.27 14.45 14.45L15.97 15.97C15.14 17.18 13.67 18 12 18Z" />
        </svg>
        Шут
      </button>
    </div>
  )
}

export function FeedPageAcid() {
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
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    return localStorage.getItem('hideChallengeBanner') === 'true'
  })

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

  const dismissBanner = () => {
    setBannerDismissed(true)
    localStorage.setItem('hideChallengeBanner', 'true')
  }

  return (
    <div className="ap-layout">
      {/* Main content */}
      <main className="ap-main">
        {/* Header */}
        <div className="ap-section-header">
          <h1 className="ap-head">Лента достижений</h1>
          <div className="ap-tabs">
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
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ap-card ap-skeleton">
                <div className="flex gap-3">
                  <div className="ap-avatar ap-skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[var(--ap-surface-3)] w-1/3" />
                    <div className="h-3 bg-[var(--ap-surface-3)] w-full" />
                    <div className="h-3 bg-[var(--ap-surface-3)] w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="ap-empty">
            {feedMode === 'friends'
              ? 'У вас пока нет друзей с достижениями'
              : 'Достижений пока нет'}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <article key={item.id} className="ap-card">
                <div className="flex gap-3">
                  {/* Avatar */}
                  <Link to={`/profile/${item.userId}`} className="flex-shrink-0">
                    {item.userAvatar ? (
                      <img
                        src={item.userAvatar}
                        alt={item.userName}
                        className="ap-avatar object-cover"
                      />
                    ) : (
                      <div className="ap-avatar">{getInitials(item.userName)}</div>
                    )}
                  </Link>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            to={`/profile/${item.userId}`}
                            className="ap-user-name"
                          >
                            {item.userName}
                          </Link>
                          <span className="ap-meta">·</span>
                          <span className="ap-meta">{formatRelativeTime(item.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="ap-meta">{item.category}</span>
                          <span className="ap-meta">· {formatAchievementDate(item.eventDate, item.year)}</span>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <span className="ap-lvl">{item.category}</span>
                      </div>
                    </div>

                    <h2 className="ap-title">{item.title}</h2>
                    <p className="ap-desc">{item.description}</p>

                    {item.proofType === 'url' && item.proofValue && (
                      <a
                        href={item.proofValue}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ap-proof-link"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Доказательство
                      </a>
                    )}
                    {item.proofType === 'photo' && item.proofValue && (
                      <img
                        src={item.proofValue}
                        alt="Доказательство"
                        className="ap-proof-img"
                      />
                    )}

                    {/* Verdict bar */}
                    <VerdictBar achievementId={item.id} />
                    <VoteButtons achievementId={item.id} disabled={!user} />

                    {/* Card footer */}
                    <div className="ap-card-foot">
                      <span className="ap-reaction-mini">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19A1 1 0 0 1 18 20H6A1 1 0 0 1 5 19V18H19V19Z" />
                        </svg>
                        {useReactionsStore.getState().byAchievement[item.id]?.crowns ?? 0}
                      </span>
                      <span className="ap-reaction-mini">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.47 2 2 6.47 2 12C2 17.53 6.47 22 12 22C17.53 22 22 17.53 22 12C22 6.47 17.53 2 12 2M12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20M8.5 14C9.88 14 11 13.1 11 12C11 10.9 9.88 10 8.5 10C7.12 10 6 10.9 6 12C6 13.1 7.12 14 8.5 14M15.5 14C16.88 14 18 13.1 18 12C18 10.9 16.88 10 15.5 10C14.12 10 13 10.9 13 12C13 13.1 14.12 14 15.5 14M12 18C10.33 18 8.86 17.18 8.03 15.97L9.55 14.45C10.09 15.27 10.03 16.17 12 16.17C13.97 16.17 13.91 15.27 14.45 14.45L15.97 15.97C15.14 17.18 13.67 18 12 18Z" />
                        </svg>
                        {useReactionsStore.getState().byAchievement[item.id]?.clowns ?? 0}
                      </span>
                      <span className="spacer">↗ Поделиться</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {hasMore && (
              <div className="ap-load-more">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="ap-btn"
                >
                  {loadingMore ? 'Загрузка...' : 'Загрузить ещё'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Sidebar */}
      <aside className="ap-sidebar">
        {/* Budget */}
        {user && (
          <div className="ap-panel">
            <h3 className="ap-panel-title">Бюджет</h3>
            <div className="mt-2">
              <BudgetWidget />
            </div>
          </div>
        )}

        {/* Create */}
        {user && (
          <div className="ap-panel">
            <InlineCreateCard />
          </div>
        )}

        {/* Filters */}
        <div className="ap-panel">
          <h3 className="ap-panel-title">Фильтры</h3>
          <div className="mt-2 space-y-1">
            {FILTERS.map((f) => (
              <label
                key={f.value}
                className={`ap-filter ${category === f.value ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="category"
                  value={f.value}
                  checked={category === f.value}
                  onChange={() => handleFilterChange(f.value)}
                  className="w-3.5 h-3.5"
                />
                <span>{f.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Challenge */}
        {!bannerDismissed && (
          <div className="ap-panel relative">
            <button
              type="button"
              onClick={dismissBanner}
              className="ap-dismiss"
              title="Скрыть"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <ChallengeBanner />
            <p className="ap-challenge-text">Можно отключить в настройках</p>
          </div>
        )}

        {/* Leaderboard */}
        <div className="ap-panel">
          <h3 className="ap-panel-title">Короли недели</h3>
          <div className="mt-2">
            {[
              { rank: 1, initials: 'СР', name: 'София Р.', score: '14.9k' },
              { rank: 2, initials: 'МВ', name: 'Макс Ветров', score: '13.2k' },
              { rank: 3, initials: 'АК', name: 'Алина Кей', score: '12.4k' },
              { rank: 4, initials: 'ДН', name: 'Дэн Новак', score: '10.1k' },
              { rank: 5, initials: 'ЛП', name: 'Лена П.', score: '9.7k' },
            ].map((item) => (
              <div key={item.rank} className="ap-lb-item">
                <span className={`ap-lb-rank ${item.rank <= 3 ? 'top' : ''}`}>{item.rank}</span>
                <span className="ap-lb-av">{item.initials}</span>
                <span className="ap-lb-name">{item.name}</span>
                <span className="ap-lb-score">{item.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trending */}
        <div className="ap-panel">
          <h3 className="ap-panel-title">В тренде</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {['#спорт', '#стартап', '#музыка', '#учёба', '#кодинг', '#искусство'].map((tag) => (
              <span key={tag} className="ap-tag">{tag}</span>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}