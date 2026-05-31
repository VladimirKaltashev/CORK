import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { useDebounce } from '@/shared/hooks'
import { getEventDate, formatAchievementDate } from '@/shared/lib/achievementDate'
import { CategoryIcon, CrownIcon, ClownIcon } from '@/shared/ui'
import type { AchievementCategory, ProofType } from '@/shared/types'

interface UserResult {
  id: string
  name: string
  avatar: string | null
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
          className="w-11 h-11 rounded-xl object-cover border-2 border-ra-border hover:border-ra-accent/40 transition-all duration-300"
        />
      ) : (
        <div className="w-11 h-11 rounded-xl bg-ra-accent/10 text-ra-accent flex items-center justify-center text-sm font-bold border-2 border-ra-border hover:border-ra-accent/40 transition-all duration-300 select-none">
          {getInitials(name)}
        </div>
      )}
    </Link>
  )
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
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, 300)

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
    fetchInitial(category, feedMode)
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!debouncedSearch.trim() || !user) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    supabase
      .from('profiles')
      .select('id, name, avatar')
      .ilike('name', `%${debouncedSearch.trim()}%`)
      .neq('id', user.id)
      .limit(20)
      .then(({ data, error }) => {
        if (error) { showToast('error', 'Ошибка поиска') }
        else { setSearchResults((data ?? []).map((p) => ({ id: p.id, name: p.name, avatar: p.avatar ?? null }))) }
        setIsSearching(false)
      })
  }, [debouncedSearch, user])

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

  return (
    <div className="mx-auto max-w-3xl py-8 px-4">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="ra-section-title mb-1">Лента достижений</h1>
          <p className="ra-subtitle">Голосуй за королей, смейся над клоунами</p>
        </div>
        <div className="flex items-center gap-3">
          <BudgetWidget />
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-1 mb-6 p-1 bg-ra-bg-surface rounded-xl border border-ra-border">
        {(['all', 'friends'] as FeedMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => handleModeChange(mode)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              feedMode === mode
                ? 'bg-ra-accent text-white shadow-ra-glow'
                : 'text-ra-text-secondary hover:text-ra-text-primary hover:bg-ra-bg-hover'
            }`}
          >
            {mode === 'all' ? (
              <span className="flex items-center justify-center gap-2">
                <CrownIcon className="w-4 h-4" />Все
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <ClownIcon className="w-4 h-4" />Друзья
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active challenge banner */}
      <ChallengeBanner />

      {/* Inline create card */}
      <div className="mb-6">
        <InlineCreateCard />
      </div>

      {/* User search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Найти королей и клоунов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ra-input pl-12"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ra-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {searchQuery.trim() && (
          <div className="mt-3 flex flex-col gap-2">
            {isSearching && (
              <div className="py-3 text-center text-sm text-ra-text-muted">
                <div className="ra-shimmer h-4 w-32 mx-auto rounded" />
              </div>
            )}
            {!isSearching && searchResults.length === 0 && (
              <div className="py-4 text-center text-sm text-ra-text-muted ra-glass rounded-xl">
                Никого не найдено
              </div>
            )}
            {searchResults.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 ra-glass ra-glass-hover p-3 rounded-xl">
                <Link to={`/profile/${u.id}`} className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-xl object-cover border-2 border-ra-border flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-ra-accent/10 text-ra-accent flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {getInitials(u.name)}
                    </div>
                  )}
                  <span className="text-sm font-medium text-ra-text-primary truncate">{u.name}</span>
                </Link>
                <button className="ra-btn-secondary text-xs py-1.5 px-3">Добавить</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => handleFilterChange(f.value)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border ${
              category === f.value
                ? 'border-ra-accent bg-ra-accent/10 text-ra-accent shadow-ra-glow'
                : 'border-ra-border text-ra-text-secondary hover:border-ra-border-light hover:text-ra-text-primary hover:bg-ra-bg-hover'
            }`}
          >
            {f.value !== 'all' && <CategoryIcon category={f.value} className="w-4 h-4" />}
            {f.label}
          </button>
        ))}
      </div>

      {/* Feed Items */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="ra-glass p-5 rounded-xl">
              <div className="flex gap-4">
                <div className="ra-shimmer w-11 h-11 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="ra-shimmer h-4 w-48 rounded" />
                  <div className="ra-shimmer h-3 w-full rounded" />
                  <div className="ra-shimmer h-3 w-2/3 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="ra-glass py-16 px-6 text-center rounded-xl">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-ra-accent/10 flex items-center justify-center">
              <CrownIcon className="w-8 h-8 text-ra-accent/50" />
            </div>
          </div>
          <p className="text-ra-text-secondary text-sm font-medium">
            {feedMode === 'friends'
              ? 'У вас пока нет друзей с достижениями'
              : 'Достижений пока нет. Стань первым королём!'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="ra-glass ra-glass-hover p-5 rounded-xl transition-all duration-300"
            >
              <div className="flex gap-4">
                {/* Avatar */}
                <UserAvatar userId={item.userId} name={item.userName} avatar={item.userAvatar} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/profile/${item.userId}`}
                          className="text-sm font-bold text-ra-text-primary hover:text-ra-accent transition-colors"
                        >
                          {item.userName}
                        </Link>
                        <span className="text-xs text-ra-text-muted">·</span>
                        <span className="text-xs text-ra-text-muted">{formatRelativeTime(item.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-ra-text-muted uppercase tracking-wider font-medium">{item.category}</span>
                        <span className="text-xs text-ra-text-muted">· {formatAchievementDate(item.eventDate, item.year)}</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <ReactionBar achievementId={item.id} disabled={!user} size="sm" />
                    </div>
                  </div>

                  <h2 className="ra-card-title mt-3">{item.title}</h2>
                  <p className="ra-card-text mt-1">{item.description}</p>

                  {item.proofType === 'url' && item.proofValue && (
                    <a
                      href={item.proofValue}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs text-ra-accent hover:text-ra-accent-hover transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Доказательство
                    </a>
                  )}
                  {item.proofType === 'photo' && item.proofValue && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-ra-border">
                      <img
                        src={item.proofValue}
                        alt="Доказательство"
                        className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="ra-btn-primary"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Загрузка...
                  </span>
                ) : (
                  'Загрузить ещё'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
