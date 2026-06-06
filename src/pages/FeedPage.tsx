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
  claimAngle: string
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

function shouldShowDescription(title: string, description: string): boolean {
  if (!description || description.trim().length === 0) return false
  const t = title.trim().toLowerCase()
  const d = description.trim().toLowerCase()
  if (d === t) return false
  if (d.length < 5) return false
  if (t.includes(d) || d.includes(t)) return false
  return true
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
}

const ANGLE_META: Record<string, { label: string; emoji: string; color: string }> = {
  king:  { label: 'На корону', emoji: '👑', color: 'var(--cork-king)' },
  clown: { label: 'На клоуна', emoji: '🤡', color: 'var(--cork-clown)' },
  judge: { label: 'Рассудите', emoji: '⚖️', color: 'var(--cork-text-mute)' },
}

function ClaimAngleBadge({ angle }: { angle: string }) {
  const meta = ANGLE_META[angle] ?? ANGLE_META.judge
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
      style={{ color: meta.color }}
    >
      <span>{meta.emoji}</span>
      <span>{meta.label}</span>
    </span>
  )
}

function UserAvatar({ userId, name, avatar }: { userId: string; name: string; avatar: string | null }) {
  return (
    <Link to={`/profile/${userId}`} className="flex-shrink-0">
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="w-10 h-10 object-cover transition-all"
          style={{ borderRadius: 'var(--cork-radius-pill)', border: '1px solid var(--cork-border-light)' }}
        />
      ) : (
        <div
          className="w-10 h-10 flex items-center justify-center text-sm font-semibold transition-all select-none"
          style={{
            borderRadius: 'var(--cork-radius-pill)',
            background: 'var(--cork-surface-3)',
            color: 'var(--cork-brand)',
            border: '1px solid var(--cork-border-light)',
          }}
        >
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
        claimAngle: row.claim_angle ?? 'king',
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
  const { isDismissed, dismiss } = useDismissibleBanner()

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

  return (
    <div className="cork-shell">
      {/* Main content */}
      <main className="cork-main">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="cork-head" style={{ marginBottom: 0 }}>Арена</h1>
          {/* Mode toggle */}
          <div className="cork-tabs">
            {(['all', 'friends'] as FeedMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleModeChange(mode)}
                className={`cork-tab ${feedMode === mode ? 'active' : ''}`}
              >
                {mode === 'all' ? 'Все' : 'Друзья'}
              </button>
            ))}
          </div>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => handleFilterChange(f.value)}
              className="cork-tag"
              style={category === f.value ? {
                background: 'var(--cork-brand)',
                color: 'var(--cork-brand-ink)',
                borderColor: 'var(--cork-brand)',
              } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Create prompt */}
        {user && (
          <div className="mb-4">
            <InlineCreateCard />
          </div>
        )}

        {/* Feed items */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="cork-card cork-skeleton">
                <div className="flex gap-3">
                  <div className="w-10 h-10 flex-shrink-0 cork-skeleton" style={{ borderRadius: 'var(--cork-radius-pill)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 cork-skeleton" />
                    <div className="h-3 w-full cork-skeleton" />
                    <div className="h-3 w-2/3 cork-skeleton" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="cork-empty">
            {feedMode === 'friends'
              ? 'У вас пока нет друзей с заявками'
              : 'Заявок пока нет'}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.id} className="cork-card">
                <div className="flex gap-3">
                  {/* Avatar */}
                  <UserAvatar userId={item.userId} name={item.userName} avatar={item.userAvatar} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          to={`/profile/${item.userId}`}
                          className="cork-link"
                          style={{ fontSize: '14px', fontWeight: 600 }}
                        >
                          {item.userName}
                        </Link>
                        <span className="cork-meta">·</span>
                        <span className="cork-meta">{formatRelativeTime(item.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <ClaimAngleBadge angle={item.claimAngle} />
                        <span className="cork-meta">·</span>
                        <span className="cork-meta">{item.category}</span>
                        <span className="cork-meta">· {formatAchievementDate(item.eventDate, item.year)}</span>
                      </div>
                    </div>

                    <h2 className="cork-title">{item.title}</h2>
                    {shouldShowDescription(item.title, item.description) && (
                      <p className="cork-desc">{item.description}</p>
                    )}

                    {item.proofType === 'url' && item.proofValue && (
                      <a
                        href={item.proofValue}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cork-link"
                        style={{ fontSize: '12px', marginTop: '8px', display: 'inline-block' }}
                      >
                        Доказательство →
                      </a>
                    )}
                    {item.proofType === 'photo' && item.proofValue && (
                      <img
                        src={item.proofValue}
                        alt="Доказательство"
                        className="mt-2 h-28 w-auto object-cover"
                        style={{ borderRadius: 'var(--cork-radius-btn)', border: '1px solid var(--cork-border-light)' }}
                      />
                    )}

                    {/* Verdict bar + buttons — full width under content */}
                    <div className="mt-3">
                      <ReactionBar achievementId={item.id} disabled={!user} size="sm" />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="cork-btn-primary"
                >
                  {loadingMore ? 'Загрузка...' : 'Загрузить ещё'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Sidebar */}
      <aside className="cork-sidebar">
        <div className="sticky top-24 space-y-6">
          {/* Budget */}
          {user && (
            <div className="cork-panel">
              <h3 className="cork-section-title">Бюджет</h3>
              <BudgetWidget />
            </div>
          )}

          {/* Mini leaderboard */}
          <div className="cork-panel">
            <h3 className="cork-section-title">Топ королей</h3>
            <div className="mt-2 space-y-2">
              <p className="text-xs" style={{ color: 'var(--cork-text-mute)' }}>
                Рейтинг скоро появится здесь
              </p>
            </div>
          </div>

          {/* Challenge */}
          {!isDismissed && (
            <div className="cork-panel relative">
              <button
                type="button"
                onClick={dismiss}
                className="cork-dismiss"
                title="Скрыть"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <ChallengeBanner />
              <p className="cork-meta mt-2">Можно отключить в настройках</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
