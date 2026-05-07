import { useEffect, useState } from 'react'
import { Button } from '@primer/react'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/entities/auth'
import type { AchievementCategory, ProofType } from '@/shared/types'

const PAGE_SIZE = 10

const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  olympiad: '🎓',
  academic: '📚',
  it: '💻',
  creative: '🎨',
  sport: '⚽',
  movies: '🎬',
  games: '🎮',
  other: '✨',
}

interface FeedItem {
  id: string
  userId: string
  userName: string
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

async function loadPage(offset: number, userId: string | undefined): Promise<{ items: FeedItem[]; hasMore: boolean }> {
  const { data: achData, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('status', 'verified')
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error) throw error
  if (!achData?.length) return { items: [], hasMore: false }

  const achIds = achData.map((r) => r.id)
  const userIds = [...new Set(achData.map((r) => r.user_id))]

  const [{ data: profilesData }, { data: likesData }] = await Promise.all([
    supabase.from('profiles').select('id, name').in('id', userIds),
    supabase.from('likes').select('achievement_id, user_id').in('achievement_id', achIds),
  ])

  const profileMap: Record<string, string> = Object.fromEntries(
    (profilesData ?? []).map((p) => [p.id, p.name])
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
      userName: profileMap[row.user_id] ?? 'Пользователь',
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

export function FeedPage() {
  const { user } = useAuthStore()
  const [items, setItems] = useState<FeedItem[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [liking, setLiking] = useState<Set<string>>(new Set())

  useEffect(() => {
    setIsLoading(true)
    loadPage(0, user?.id)
      .then(({ items: loaded, hasMore: more }) => {
        setItems(loaded)
        setOffset(loaded.length)
        setHasMore(more)
      })
      .catch(() => showToast('error', 'Не удалось загрузить ленту'))
      .finally(() => setIsLoading(false))
  }, [user?.id])

  const handleLoadMore = async () => {
    setLoadingMore(true)
    try {
      const { items: more, hasMore: moreExists } = await loadPage(offset, user?.id)
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
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('achievement_id', item.id)
          .eq('user_id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ achievement_id: item.id, user_id: user.id })
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Лента достижений</h1>

      {isLoading ? (
        <div className="py-10 text-center text-sm text-gray-500">Загрузка...</div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-md py-10 text-center">
          <span className="text-sm text-gray-500">Подтверждённых достижений пока нет</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="border border-gray-300 rounded-md bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{CATEGORY_ICONS[item.category]}</span>
                    <span className="text-xs text-gray-400 uppercase tracking-wide">{item.category}</span>
                    <span className="text-xs text-gray-400">· {item.year}</span>
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">{item.title}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {item.userName}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>

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
