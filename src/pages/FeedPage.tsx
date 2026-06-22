import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/entities/auth'
import { useFriendsStore } from '@/entities/friends'
import { useReactionsStore } from '@/entities/reactions'
import { useCommentsStore } from '@/entities/comments'
import { useScoutStore } from '@/entities/scout'
import { ReactionBar, BudgetWidget } from '@/features/reactions'
import { InlineCreateCard } from '@/features/profile/InlineCreateCard'
import { CommentSection } from '@/features/comments'
import { claimMetaFromAchievementMeta, ClaimBadge, CLAIM_TYPE_FILTER_OPTIONS, getArenaSortConfig, matchesClaimTypeFilter, parseClaimTypeFilter } from '@/entities/claims'
import type { ArenaSort, ClaimTypeFilter } from '@/entities/claims'
import { getEventDate, formatAchievementDate } from '@/shared/lib/achievementDate'
import type { AchievementCategory, ProofType } from '@/shared/types'

const PAGE_SIZE = 10

type CategoryFilter = AchievementCategory | 'all'

// Category filter config kept in git history for easy restore

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
  meta: Record<string, unknown>
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
  sort: ArenaSort,
  friendIds?: string[],
  viewerId?: string,
): Promise<{ items: FeedItem[]; hasMore: boolean }> {
  if (friendIds !== undefined && friendIds.length === 0) {
    return { items: [], hasMore: false }
  }

  const sortConfig = getArenaSortConfig(sort)
  let query = supabase
    .from('arena_items')
    .select('id, user_id, category, title, description, year, proof_type, proof_value, status, meta, created_at, crowns, clowns, comments, hot_score, controversy_score')

  if (category !== 'all') {
    query = query.eq('category', category)
  }

  if (viewerId) {
    query = query.neq('user_id', viewerId)
  }

  if (friendIds && friendIds.length > 0) {
    query = query.in('user_id', friendIds)
  }

  if (sortConfig.needsControversyFilter) {
    query = query.gt('crowns', 0).gt('clowns', 0)
  }

  query = query
    .order(sortConfig.primaryColumn, { ascending: false })
    .order('created_at', { ascending: false })

  const { data: achData, error } = await query.range(offset, offset + PAGE_SIZE - 1)

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

  const mappedItems = achData.map((row) => ({
        id: row.id,
        userId: row.user_id,
        userName: profileMap[row.user_id]?.name ?? 'Пользователь',
        userAvatar: profileMap[row.user_id]?.avatar ?? null,
        category: row.category,
        title: row.title,
        description: row.description,
        year: row.year,
        eventDate: getEventDate(row.meta as Record<string, unknown> | null),
        meta: (row.meta as Record<string, unknown> | null) ?? {},
        proofType: row.proof_type,
        proofValue: row.proof_value ?? undefined,
        createdAt: row.created_at,
      }))

  return {
    items: mappedItems,
    hasMore: achData.length === PAGE_SIZE,
  }
}

type FeedMode = 'all' | 'friends'

const SORT_TABS: { value: ArenaSort; label: string }[] = [
  { value: 'new', label: 'Новое' },
  { value: 'hot', label: 'Горячее' },
  { value: 'controversial', label: 'Спорное' },
]

export function FeedPage() {
  const { user } = useAuthStore()
  const friendsStore = useFriendsStore()
  const loadReactions = useReactionsStore((s) => s.loadForAchievements)
  const reactionByAchievement = useReactionsStore((s) => s.byAchievement)
  const { topScouts, loadTopScouts } = useScoutStore()
  const [items, setItems] = useState<FeedItem[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [feedMode, setFeedMode] = useState<FeedMode>('all')
  const [sort, setSort] = useState<ArenaSort>('new')
  const [searchParams, setSearchParams] = useSearchParams()
  const claimTypeFilter = parseClaimTypeFilter(searchParams.get('claim'))

  const getFriendIds = (): string[] | undefined =>
    feedMode === 'friends' ? friendsStore.acceptedFriendIds() : undefined

  const fetchInitial = (cat: CategoryFilter, mode: FeedMode, srt: ArenaSort) => {
    const fIds = mode === 'friends' ? friendsStore.acceptedFriendIds() : undefined
    setIsLoading(true)
    loadPage(0, cat, srt, fIds, user?.id)
      .then(({ items: loaded, hasMore: more }) => {
        setItems(loaded)
        setOffset(loaded.length)
        setHasMore(more)
        loadReactions(loaded.map((i) => i.id), user?.id)
        useCommentsStore.getState().loadCounts(loaded.map((i) => i.id))
      })
      .catch(() => showToast('error', 'Не удалось загрузить ленту'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInitial(category, feedMode, sort)
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadTopScouts(5)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (cat: CategoryFilter) => {
    if (cat === category) return
    setCategory(cat)
    setItems([])
    setOffset(0)
    setHasMore(true)
    fetchInitial(cat, feedMode, sort)
  }
  void handleFilterChange // kept for future category filter restore

  const handleModeChange = (mode: FeedMode) => {
    if (mode === feedMode) return
    setFeedMode(mode)
    setItems([])
    setOffset(0)
    setHasMore(true)
    fetchInitial(category, mode, sort)
  }

  const handleSortChange = (srt: ArenaSort) => {
    if (srt === sort) return
    setSort(srt)
    setItems([])
    setOffset(0)
    setHasMore(true)
    fetchInitial(category, feedMode, srt)
  }

  const handleLoadMore = async () => {
    setLoadingMore(true)
    try {
      const { items: more, hasMore: moreExists } = await loadPage(offset, category, sort, getFriendIds(), user?.id)
      setItems((prev) => [...prev, ...more])
      setOffset((prev) => prev + more.length)
      setHasMore(moreExists)
      loadReactions(more.map((i) => i.id), user?.id)
      useCommentsStore.getState().loadCounts(more.map((i) => i.id))
    } catch {
      showToast('error', 'Не удалось загрузить ещё')
    } finally {
      setLoadingMore(false)
    }
  }

  const handleClaimTypeFilterChange = (next: ClaimTypeFilter) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      if (next === 'all') params.delete('claim')
      else params.set('claim', next)
      return params
    })
  }

  const visibleItems = claimTypeFilter === 'all'
    ? items
    : items.filter((item) => matchesClaimTypeFilter(item.meta, claimTypeFilter))

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

        {/* Sort tabs */}
        <div className="flex flex-wrap gap-2 mb-3">
          {SORT_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => handleSortChange(t.value)}
              className="cork-tag"
              style={sort === t.value ? {
                background: 'var(--cork-brand)',
                color: 'var(--cork-brand-ink)',
                borderColor: 'var(--cork-brand)',
              } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

          {/* Claim type filter */}
          {items.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--cork-text-dim)' }}>
                Фильтр по типу
                {claimTypeFilter !== 'all' && (
                  <> · {visibleItems.length} из {items.length}</>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CLAIM_TYPE_FILTER_OPTIONS.map((opt) => {
                  const active = opt.value === claimTypeFilter
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleClaimTypeFilterChange(opt.value)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs transition-colors"
                      style={{
                        borderRadius: 'var(--cork-radius-pill)',
                        border: '1px solid',
                        borderColor: active ? 'var(--cork-brand)' : 'var(--cork-border)',
                        background: active ? 'var(--cork-surface-2)' : 'var(--cork-surface)',
                        color: active ? 'var(--cork-brand)' : 'var(--cork-text-dim)',
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      <span>{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

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
                : user ? 'Здесь вы судите заявки других. Чужих заявок пока нет.' : 'Заявок пока нет'}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="cork-empty">
              Нет заявок типа «{CLAIM_TYPE_FILTER_OPTIONS.find(o => o.value === claimTypeFilter)?.label ?? ''}» среди загруженных.
            </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleItems.map((item) => {
              const claimMeta = claimMetaFromAchievementMeta(item.meta)
              return (
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
                        <span className="cork-meta">{item.category}</span>
                        <span className="cork-meta">· {formatAchievementDate(item.eventDate, item.year)}</span>
                      </div>
                      <ClaimBadge type={claimMeta.claimType!} subjectName={claimMeta.subjectName} thread={claimMeta.thread} className="mt-0.5" />
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

                    {/* Comments */}
                    <CommentSection
                      achievementId={item.id}
                      currentUserReaction={reactionByAchievement[item.id]?.myKind ?? null}
                    />
                  </div>
                </div>
              </div>
            )
            })}

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
            <h3 className="cork-section-title">🔥 Топ скаутов</h3>
            <div className="mt-2 space-y-2">
              {topScouts.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--cork-text-mute)' }}>
                  Скаутов пока нет. Принеси первую заявку на суд.
                </p>
              ) : (
                topScouts.map((s) => (
                  <div key={s.userId} className="flex items-center gap-2">
                    {s.avatar ? (
                      <img src={s.avatar} alt={s.userName} className="w-6 h-6 object-cover flex-shrink-0" style={{ borderRadius: 'var(--cork-radius-pill)', border: '1px solid var(--cork-border-light)' }} />
                    ) : (
                      <div className="w-6 h-6 flex items-center justify-center text-[10px] font-semibold flex-shrink-0" style={{ borderRadius: 'var(--cork-radius-pill)', background: 'var(--cork-surface-3)', color: 'var(--cork-brand)' }}>
                        {getInitials(s.userName)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link to={`/profile/${s.userId}`} className="cork-link text-xs font-semibold truncate block">
                        {s.userName}
                      </Link>
                      <span className="text-[10px]" style={{ color: 'var(--cork-text-mute)' }}>
                        {s.scoutScore} очков · {s.submittedCount} принесено
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
