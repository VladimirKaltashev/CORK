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
import { useDebounce } from '@/shared/hooks'
import { getEventDate, formatAchievementDate } from '@/shared/lib/achievementDate'
import type { AchievementCategory, ProofType } from '@/shared/types'

interface UserResult {
  id: string
  name: string
  avatar: string | null
}

function FriendButton({ targetId }: { targetId: string }) {
  const { getRelationship, sendRequest, acceptRequest, removeRecord } = useFriendsStore()
  const [busy, setBusy] = useState(false)
  const rel = getRelationship(targetId)

  if (!rel) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try { await sendRequest(targetId) }
          catch { /* shown by store */ }
          finally { setBusy(false) }
        }}
        className="text-sm px-3 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {busy ? '...' : 'Добавить'}
      </button>
    )
  }

  if (rel.direction === 'outgoing' && rel.record.status === 'pending') {
    return <span className="text-xs text-gray-400">Запрос отправлен</span>
  }

  if (rel.direction === 'incoming' && rel.record.status === 'pending') {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try { await acceptRequest(rel.record.id) }
          finally { setBusy(false) }
        }}
        className="text-sm px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {busy ? '...' : 'Принять'}
      </button>
    )
  }

  if (rel.record.status === 'accepted') {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try { await removeRecord(rel.record.id) }
          finally { setBusy(false) }
        }}
        className="text-sm px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
      >
        {busy ? '...' : 'Удалить'}
      </button>
    )
  }

  return null
}

const PAGE_SIZE = 10

type CategoryFilter = AchievementCategory | 'all'

const FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: 'all',      label: 'Все' },
  { value: 'olympiad', label: '🎓 Олимпиады' },
  { value: 'academic', label: '📚 Успеваемость' },
  { value: 'it',       label: '💻 IT' },
  { value: 'creative', label: '🎨 Творчество' },
  { value: 'sport',    label: '⚽ Спорт' },
  { value: 'movies',   label: '🎬 Фильмы' },
  { value: 'games',    label: '🎮 Игры' },
  { value: 'other',    label: '✨ Другое' },
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInitial(category, feedMode)
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!debouncedSearch.trim() || !user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <div className="mx-auto max-w-2xl py-6 px-3">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold text-gray-900">Лента достижений</h1>
        <div className="flex items-center gap-2">
          <BudgetWidget />
          <div className="flex rounded-md border border-gray-300 overflow-hidden text-sm">
            {(['all', 'friends'] as FeedMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleModeChange(mode)}
                className={`px-3 py-1.5 transition-colors ${
                  feedMode === mode
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {mode === 'all' ? 'Все' : 'Друзья'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inline create card */}
      <div className="mb-3">
        <InlineCreateCard />
      </div>

      {/* User search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Найти пользователей..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        {searchQuery.trim() && (
          <div className="mt-2 flex flex-col gap-2">
            {isSearching && (
              <div className="py-2 text-center text-sm text-gray-500">Поиск...</div>
            )}
            {!isSearching && searchResults.length === 0 && (
              <div className="py-2 text-center text-sm text-gray-500">Никого не найдено</div>
            )}
            {searchResults.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 border border-gray-300 rounded-md bg-white p-3">
                <Link to={`/profile/${u.id}`} className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200 flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {getInitials(u.name)}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900 truncate">{u.name}</span>
                </Link>
                <FriendButton targetId={u.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => handleFilterChange(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${
              category === f.value
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold'
                : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-900'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-sm text-gray-500">Загрузка...</div>
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
            <div key={item.id} className="border border-gray-300 rounded-md bg-white p-4">
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
                          className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
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

                  <h2 className="text-base font-semibold text-gray-900 mt-2">{item.title}</h2>
                  <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>

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
    </div>
  )
}
