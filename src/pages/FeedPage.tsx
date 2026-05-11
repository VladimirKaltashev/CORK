import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@primer/react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/entities/auth'
import { useFriendsStore } from '@/entities/friends'
import type { AchievementCategory, ProofType } from '@/shared/types'

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
  proofType: ProofType
  proofValue?: string
  createdAt: string
  likesCount: number
  likedByMe: boolean
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
  userId: string | undefined,
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

  const achIds = achData.map((r) => r.id)
  const userIds = [...new Set(achData.map((r) => r.user_id))]

  const [{ data: profilesData }, { data: likesData }] = await Promise.all([
    supabase.from('profiles').select('id, name, avatar').in('id', userIds),
    supabase.from('likes').select('achievement_id, user_id').in('achievement_id', achIds),
  ])

  const profileMap: Record<string, { name: string; avatar: string | null }> = Object.fromEntries(
    (profilesData ?? []).map((p) => [p.id, { name: p.name, avatar: p.avatar ?? null }])
  )

  const likesByAch: Record<string, number> = {}
  const myLikes = new Set<string>()

  for (const like of likesData ?? []) {
    likesByAch[like.achievement_id] = (likesByAch[like.achievement_id] ?? 0) + 1
    if (userId && like.user_id === userId) myLikes.add(like.achievement_id)
  }

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
      proofType: row.proof_type,
      proofValue: row.proof_value ?? undefined,
      createdAt: row.created_at,
      likesCount: likesByAch[row.id] ?? 0,
      likedByMe: myLikes.has(row.id),
    })),
    hasMore: achData.length === PAGE_SIZE,
  }
}

type FeedMode = 'all' | 'friends'

export function FeedPage() {
  const { user } = useAuthStore()
  const friendsStore = useFriendsStore()
  const [items, setItems] = useState<FeedItem[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [liking, setLiking] = useState<Set<string>>(new Set())
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [feedMode, setFeedMode] = useState<FeedMode>('all')

  const getFriendIds = (): string[] | undefined =>
    feedMode === 'friends' ? friendsStore.acceptedFriendIds() : undefined

  const fetchInitial = (cat: CategoryFilter, mode: FeedMode) => {
    const fIds = mode === 'friends' ? friendsStore.acceptedFriendIds() : undefined
    setIsLoading(true)
    loadPage(0, user?.id, cat, fIds)
      .then(({ items: loaded, hasMore: more }) => {
        setItems(loaded)
        setOffset(loaded.length)
        setHasMore(more)
      })
      .catch(() => showToast('error', 'Не удалось загрузить ленту'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
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
      const { items: more, hasMore: moreExists } = await loadPage(offset, user?.id, category, getFriendIds())
      setItems((prev) => [...prev, ...more])
      setOffset((prev) => prev + more.length)
      setHasMore(moreExists)
    } catch {
      showToast('error', 'Не удалось загрузить ещё')
    } finally {
      setLoadingMore(false)
    }
  }

  const handleLike = async (item: FeedItem) => {
    if (!user || liking.has(item.id)) return
    setLiking((prev) => new Set(prev).add(item.id))
    const wasLiked = item.likedByMe

    setItems((prev) =>
      prev.map((a) =>
        a.id === item.id
          ? { ...a, likedByMe: !wasLiked, likesCount: wasLiked ? a.likesCount - 1 : a.likesCount + 1 }
          : a
      )
    )

    try {
      if (wasLiked) {
        const { error } = await supabase.from('likes').delete().eq('achievement_id', item.id).eq('user_id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('likes').insert({ achievement_id: item.id, user_id: user.id })
        if (error) throw error
      }
    } catch {
      setItems((prev) =>
        prev.map((a) =>
          a.id === item.id
            ? { ...a, likedByMe: wasLiked, likesCount: wasLiked ? a.likesCount + 1 : a.likesCount - 1 }
            : a
        )
      )
      showToast('error', 'Не удалось обновить лайк')
    } finally {
      setLiking((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-6 px-3">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Лента достижений</h1>
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
                        <span className="text-xs text-gray-400">· {item.year}</span>
                      </div>
                    </div>

                    {/* Like button */}
                    <button
                      type="button"
                      onClick={() => handleLike(item)}
                      disabled={!user || liking.has(item.id)}
                      className={`flex flex-col items-center gap-0.5 flex-shrink-0 rounded-md px-2 py-1 transition-colors ${
                        item.likedByMe
                          ? 'text-red-500 hover:text-red-600'
                          : 'text-gray-400 hover:text-red-400'
                      } disabled:opacity-50`}
                      aria-label={item.likedByMe ? 'Убрать лайк' : 'Поставить лайк'}
                    >
                      <span className="text-xl leading-none">{item.likedByMe ? '❤️' : '🤍'}</span>
                      <span className="text-xs font-medium">{item.likesCount}</span>
                    </button>
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
