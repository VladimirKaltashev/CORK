import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useChallengesStore, type EntryWithProfile } from '@/entities/challenges'
import { isClaimVisibleInChallenge, buildOwnClaimsStats } from '@/entities/claims'
import { getThresholds, getExpertProgress, type ExpertProgress } from '@/shared/lib/expert'
import { useAuthStore } from '@/entities/auth'
import { useReactionsStore } from '@/entities/reactions'
import { useCommentsStore } from '@/entities/comments'
import { AchievementCard } from '@/features/profile/AchievementCard'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'
import type { Achievement, AchievementStatus } from '@/shared/types'
import { AddAchievementModal } from '@/features/profile/AddAchievementModal'

const AWARD_ICONS: Record<string, { icon: string; desc: string; label: string }> = {
  king: { icon: '👑', label: 'Король', desc: 'Победитель арены' },
  clown: { icon: '🤡', label: 'Клоун', desc: 'Самая клоунская заявка' },
  finder: { icon: '🔍', label: 'Скаут', desc: 'Лучший первооткрыватель' },
  best_comment: { icon: '💬', label: 'Аргумент', desc: 'Лучший аргумент суда' },
  most_controversial: { icon: '🔥', label: 'Спорно', desc: 'Самая спорная заявка' },
  participant: { icon: '🎖', label: 'Участник', desc: 'Отметка участника' },
}

const TABS = ['Заявки', 'Лидерборд', 'Правила', 'Награды'] as const
type DetailTab = typeof TABS[number]

function formatTimer(startsAt: string, endsAt: string, status: string): string {
  const now = Date.now()
  const start = new Date(startsAt).getTime()
  const end = new Date(endsAt).getTime()

  if (status === 'active') {
    const diff = end - now
    if (diff <= 0) return 'Завершён'
    const d = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `Осталось ${d}д ${h}ч ${m}мин`
  }

  if (status === 'scheduled') {
    const diff = start - now
    if (diff <= 0) return 'Стартует скоро'
    const d = Math.floor(diff / 86400000)
    return `Стартует через ${d}д`
  }

  return 'Итоги открыты'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getStatusLabel(status: string): { text: string; color: string; className: string } {
  switch (status) {
    case 'active': return { text: 'Активен', color: 'var(--cork-success)', className: 'cork-tag--active' }
    case 'scheduled': return { text: 'Предстоит', color: 'var(--cork-brand)', className: 'cork-tag--upcoming' }
    case 'completed': return { text: 'Завершён', color: 'var(--cork-text-dim)', className: 'cork-tag--done' }
    case 'archived': return { text: 'В архиве', color: 'var(--cork-text-mute)', className: 'cork-tag--done' }
    default: return { text: status, color: 'var(--cork-text-dim)', className: '' }
  }
}

function getEntryScore(entry: EntryWithProfile, reactions: ReturnType<typeof useReactionsStore.getState>['byAchievement'], commentCounts: Record<string, number>): number {
  if (!entry.claimId) return 0
  const agg = reactions[entry.claimId]
  return (agg?.crowns ?? 0) * 2 + (agg?.clowns ?? 0) + (commentCounts[entry.claimId] ?? 0)
}



function MyStatusCard({
  userName,
  rank,
  myEntry,
  isActive,
  onSubmit,
}: {
  userName?: string
  rank: ExpertProgress | null
  myEntry?: EntryWithProfile
  isActive: boolean
  onSubmit: () => void
}) {
  if (!userName) {
    return (
      <div className="sidebar-block">
        <h4>Мой статус</h4>
        <p className="challenge-side-note">Войдите, чтобы подать заявку, судить claims и копить ранг.</p>
        <Link to="/login" className="cork-btn cork-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          Войти
        </Link>
      </div>
    )
  }

  return (
    <div className="sidebar-block">
      <h4>Мой статус</h4>
      {rank && (
        <>
          <div className="rank-card__top">
            <span className="rank-card__icon">{rank.icon}</span>
            <div className="rank-card__body">
              <div className="rank-card__eyebrow">CORK Rank</div>
              <div className="rank-card__title">{rank.displayTier}</div>
            </div>
          </div>
          <div className="rank-meter" aria-label={`Прогресс ранга ${rank.progressPct}%`}>
            <span style={{ width: `${rank.progressPct}%` }} />
          </div>
          <div className="rank-card__foot">
            <span>{rank.isMaxTier ? 'макс. ранг' : `до ${rank.nextTier}: ${rank.remainingToNext}`}</span>
            <span>голос ×{rank.votePower}</span>
          </div>
        </>
      )}
      <div className="challenge-my-entry">
        <span>Заявка</span>
        <b>{myEntry ? 'подана' : 'не подана'}</b>
      </div>
      <button
        type="button"
        className="cork-btn cork-btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={onSubmit}
        disabled={!isActive}
      >
        Добавить заявку в челлендж
      </button>
      {!isActive && <p className="challenge-side-note">Подавать заявки можно только в активный челлендж.</p>}
    </div>
  )
}

export function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { detail, entries, awards, isDetailLoading, detailError, loadDetail } = useChallengesStore()
  const user = useAuthStore((s) => s.user)
  const loadReactions = useReactionsStore((s) => s.loadForAchievements)
  const reactions = useReactionsStore((s) => s.byAchievement)
  const commentCounts = useCommentsStore((s) => s.counts)
  const [rank, setRank] = useState<ExpertProgress | null>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>('Заявки')
  const [claimComposerOpen, setClaimComposerOpen] = useState(false)
  const [claimStatuses, setClaimStatuses] = useState<Record<string, AchievementStatus>>({})
  const [challengeClaimsById, setChallengeClaimsById] = useState<Record<string, Achievement>>({})

  useEffect(() => {
    if (id) loadDetail(id)
  }, [id, loadDetail])

  useEffect(() => {
    if (!user?.id) {
      return
    }
    ;(async () => {
      try {
        const { data } = await supabase
          .from('profile_scores')
          .select('crowns, clowns')
          .eq('user_id', user.id)
          .maybeSingle()
        const total = (data?.crowns ?? 0) + (data?.clowns ?? 0)
        const thresholds = await getThresholds()
        setRank(getExpertProgress(total, thresholds))
      } catch {
        setRank(getExpertProgress(0, []))
      }
    })()
  }, [user?.id])

  const claimIds = useMemo(
    () => entries.map((entry) => entry.claimId).filter((claimId): claimId is string => Boolean(claimId)),
    [entries],
  )
  const claimIdsKey = claimIds.join(',')

  useEffect(() => {
    if (claimIds.length === 0) return
    ;(async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('id, user_id, category, title, description, year, proof_type, proof_value, status, rejection_reason, meta, created_at, claim_angle')
        .in('id', claimIds)
      if (error) return

      const byId: Record<string, Achievement> = {}
      for (const row of (data ?? []) as Array<Record<string, unknown>>) {
        const id = row.id as string
        byId[id] = {
          id,
          userId: row.user_id as string,
          category: row.category as Achievement['category'],
          title: row.title as string,
          description: row.description as string,
          year: row.year as number,
          proofType: row.proof_type as Achievement['proofType'],
          proofValue: (row.proof_value as string | null) ?? undefined,
          status: row.status as AchievementStatus,
          claimAngle: (row.claim_angle as Achievement['claimAngle']) ?? undefined,
          rejectionReason: (row.rejection_reason as string | null) ?? undefined,
          meta: (row.meta as Record<string, unknown> | null) ?? {},
          createdAt: row.created_at as string,
        }
      }

      setChallengeClaimsById(byId)
      setClaimStatuses(Object.fromEntries(Object.keys(byId).map((id) => [id, byId[id].status])))
    })()
  }, [claimIdsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const visibleEntries = useMemo(
    () =>
      entries.filter((entry) => {
        if (!entry.claimId) return false
        const status = claimStatuses[entry.claimId]
        return !!status && isClaimVisibleInChallenge({ status })
      }),
    [claimStatuses, entries],
  )
  const visibleClaimIds = useMemo(
    () =>
      claimIds.filter((claimId) => {
        const status = claimStatuses[claimId]
        return !!status && isClaimVisibleInChallenge({ status })
      }),
    [claimIds, claimStatuses],
  )
  const visibleClaimIdsKey = visibleClaimIds.join(',')

  const visibleClaims = useMemo(
    () => visibleClaimIds.map((id) => challengeClaimsById[id]).filter((a): a is Achievement => Boolean(a)),
    [visibleClaimIds, challengeClaimsById],
  )

  const challengeStats = useMemo(
    () => buildOwnClaimsStats(visibleClaims, reactions),
    [visibleClaims, reactions],
  )

  const totalComments = useMemo(
    () => visibleClaims.reduce((sum, a) => sum + (commentCounts[a.id] ?? 0), 0),
    [visibleClaims, commentCounts],
  )

  const orderedVisibleClaims = useMemo(() => {
    const getScore = (achievement: Achievement) => {
      const agg = reactions[achievement.id]
      return (agg?.crowns ?? 0) * 2 + (agg?.clowns ?? 0) + (commentCounts[achievement.id] ?? 0)
    }

    return [...visibleClaims].sort((a, b) => getScore(b) - getScore(a))
  }, [visibleClaims, reactions, commentCounts])

  useEffect(() => {
    if (visibleClaimIds.length === 0) return
    loadReactions(visibleClaimIds, user?.id)
    useCommentsStore.getState().loadCounts(visibleClaimIds)
  }, [visibleClaimIdsKey, loadReactions, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const myEntry = user ? visibleEntries.find((entry) => entry.userId === user.id && entry.isCurrent) : undefined
  const orderedEntries = useMemo(
    () => [...visibleEntries].sort((a, b) => getEntryScore(b, reactions, commentCounts) - getEntryScore(a, reactions, commentCounts)),
    [visibleEntries, reactions, commentCounts],
  )

  if (isDetailLoading) {
    return (
      <div className="cork-page">
        <div className="cork-shell">
          <main className="cork-main">
            <div className="cork-skeleton" style={{ height: 40, width: 200, marginBottom: 16 }} />
            <div className="cork-skeleton" style={{ height: 300 }} />
          </main>
        </div>
      </div>
    )
  }

  if (detailError || !detail) {
    return (
      <div className="cork-page">
        <div className="cork-shell">
          <main className="cork-main">
            <div className="cork-empty">
              <b>⚠️</b>
              {detailError ?? 'Челлендж не найден'}
              <br />
              <Link to="/challenges" className="cork-btn" style={{ marginTop: 12, display: 'inline-flex' }}>← К списку</Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusLabel(detail.status)
  const awardsList = detail.config.awards as string[] | undefined
  const durationMs = new Date(detail.endsAt).getTime() - new Date(detail.startsAt).getTime()
  const durationDays = Math.ceil(durationMs / 86400000)
  const isActive = detail.status === 'active'

  const handleSubmitClick = () => {
    if (!user) {
      showToast('error', 'Войдите, чтобы участвовать')
      return
    }
    if (!isActive) {
      showToast('error', 'Заявки принимаются только в активный челлендж')
      return
    }
    setClaimComposerOpen(true)
  }

  return (
    <div className="cork-page">
      <div className="cork-shell">
        <main className="cork-main">
          <Link to="/challenges" className="back-link">
            <svg className="icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4l-6 6 6 6" />
            </svg>
            К списку челленджей
          </Link>

          <div className="two-col">
            <div>
              <section className="challenge-hero challenge-hero--arena">
                <div className="challenge-hero__top">
                  <div className="challenge-hero__icon">🏆</div>
                  <div className="challenge-hero__body">
                    <div className="challenge-card__tags" style={{ marginBottom: 8 }}>
                      <span className={`cork-tag ${statusInfo.className}`}>{statusInfo.text}</span>
                      {awardsList?.map((award) => (
                        <span key={award} className="cork-tag">
                          {AWARD_ICONS[award]?.icon ?? ''} {AWARD_ICONS[award]?.label ?? award}
                        </span>
                      ))}
                    </div>
                    <h1 style={{ margin: 0, fontSize: 28 }}>{detail.title}</h1>
                    <div className="challenge-hero__meta">
                      <span>🗓 {formatDate(detail.startsAt)} — {formatDate(detail.endsAt)}</span>
                      <span>организатор <strong style={{ color: 'var(--cork-brand)' }}>@{detail.createdBy.slice(0, 8)}</strong></span>
                    </div>
                  </div>
                </div>

                <p className="challenge-hero__desc">{detail.description}</p>

                <div className="challenge-hero__actions">
                  <div className="timer-large" style={{ marginBottom: 0 }}>
                    <svg className="icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <span style={{ color: 'var(--cork-brand)' }}>{formatTimer(detail.startsAt, detail.endsAt, detail.status)}</span>
                  </div>
                  <button type="button" className="cork-btn cork-btn-primary" onClick={handleSubmitClick} disabled={!isActive && !!user}>
                    Добавить заявку в челлендж
                  </button>
                </div>

                <div className="stats-grid">
                   <div className="cork-stat"><b>{challengeStats.totalClaims}</b><small>живых заявок</small></div>
                   <div className="cork-stat"><b>{challengeStats.crownedCount}</b><small>Корона ведёт</small></div>
                   <div className="cork-stat"><b>{challengeStats.clownedCount}</b><small>Клоун ведёт</small></div>
                   <div className="cork-stat"><b>{totalComments}</b><small>комментариев</small></div>
                </div>
              </section>

              <div className="cork-tabs challenge-detail-tabs">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`cork-tab${activeTab === tab ? ' active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === 'Заявки' && (
                <section>
                  {orderedVisibleClaims.length === 0 ? (
                    <div className="cork-empty" style={{ marginBottom: 16 }}>
                      <b>🏆</b>
                      У этого челленджа пока нет заявок.
                      <br />
                      Можно быть первым: принеси claim на суд.
                      <div style={{ marginTop: 12 }}>
                        <button
                          type="button"
                          className="cork-btn cork-btn-primary"
                          onClick={handleSubmitClick}
                          disabled={!isActive && !!user}
                        >
                          Добавить заявку в челлендж
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {orderedVisibleClaims.map((achievement) => (
                        <AchievementCard
                          key={achievement.id}
                          achievement={achievement}
                          showModerationStatus={false}
                          reactionBarCompact={false}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeTab === 'Лидерборд' && (
                <section className="challenge-leaderboard">
                  {orderedEntries.length === 0 ? (
                    <div className="cork-empty">Лидерборд появится после первых заявок</div>
                  ) : (
                    orderedEntries.map((entry, index) => (
                      <div key={entry.id} className="leader-row">
                        <span className="leader-row__rank">#{index + 1}</span>
                        <div className="leader-row__body">
                          <b>{entry.title}</b>
                          <span>@{entry.userName}</span>
                        </div>
                        <span className="leader-row__score">
                          {getEntryScore(entry, reactions, commentCounts)} pts
                        </span>
                      </div>
                    ))
                  )}
                </section>
              )}

              {activeTab === 'Правила' && (
                <section className="challenge-rules">
                  <div className="cork-panel">
                    <h3>Как работает арена</h3>
                    <p>Подай один claim, дождись вердиктов и аргументов. Побеждают не просто самые громкие заявки, а те, которые получили сильный суд сообщества.</p>
                  </div>
                  <div className="cork-panel">
                    <h3>Что считается хорошей заявкой</h3>
                    <p>Короткий claim, понятный контекст и честный предмет суда: достижение, находка, фейл, flex или спорная история.</p>
                  </div>
                  <div className="cork-panel">
                    <h3>Культура</h3>
                    <p>Клоуним claim, не человека. Аргумент важнее шума, proof сильнее понта.</p>
                  </div>
                </section>
              )}

              {activeTab === 'Награды' && (
                <section>
                  <div className="cork-section-title">
                    План наград
                    <span className="count">{awardsList?.length ?? 0}</span>
                  </div>
                  {awardsList?.map((award) => (
                    <div key={award} className="award-row">
                      <div className="award-row__badge">{AWARD_ICONS[award]?.icon ?? ''}</div>
                      <div className="award-row__body">
                        <div className="award-row__title">{AWARD_ICONS[award]?.label ?? award}</div>
                        <div className="award-row__user">{AWARD_ICONS[award]?.desc ?? ''}</div>
                      </div>
                    </div>
                  ))}
                  {detail.status === 'completed' && awards.length > 0 && (
                    <>
                      <div className="cork-section-title" style={{ marginTop: 24 }}>
                        Выдано
                        <span className="count">{awards.length}</span>
                      </div>
                      {awards.map((award) => (
                        <div key={award.id} className="award-row">
                          <div className="award-row__badge">{AWARD_ICONS[award.awardType]?.icon ?? ''}</div>
                          <div className="award-row__body">
                            <div className="award-row__title">{AWARD_ICONS[award.awardType]?.label ?? award.awardType}</div>
                            <div className="award-row__user">@{award.userName}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </section>
              )}
            </div>

            <aside>
              <MyStatusCard
                userName={user?.name}
                rank={user ? rank : null}
                myEntry={myEntry}
                isActive={isActive}
                onSubmit={handleSubmitClick}
              />

              <div className="sidebar-block">
                <h4>О челлендже</h4>
                <div className="sidebar-stat">
                  <span className="sidebar-stat__label">Статус</span>
                  <span className="sidebar-stat__value" style={{ color: statusInfo.color }}>{statusInfo.text}</span>
                </div>
                <div className="sidebar-stat">
                  <span className="sidebar-stat__label">Старт</span>
                  <span className="sidebar-stat__value">{formatDate(detail.startsAt)}</span>
                </div>
                <div className="sidebar-stat">
                  <span className="sidebar-stat__label">Финиш</span>
                  <span className="sidebar-stat__value">{formatDate(detail.endsAt)}</span>
                </div>
                <div className="sidebar-stat">
                  <span className="sidebar-stat__label">Длительность</span>
                  <span className="sidebar-stat__value">{durationDays} дней</span>
                </div>
                <div className="sidebar-stat">
                  <span className="sidebar-stat__label">Тип</span>
                  <span className="sidebar-stat__value">community</span>
                </div>
              </div>

              {awardsList && awardsList.length > 0 && (
                <div className="sidebar-block">
                  <h4>Награды</h4>
                  {awardsList.map((award) => {
                    const info = AWARD_ICONS[award]
                    return (
                      <div key={award} className="challenge-award-mini">
                        <span>{info?.icon ?? ''}</span>
                        <div>
                          <b>{info?.label ?? award}</b>
                          <small>{info?.desc ?? ''}</small>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </aside>
          </div>
        </main>
      </div>

      {claimComposerOpen && (
        <AddAchievementModal
          onClose={() => setClaimComposerOpen(false)}
          challengeId={detail.id}
          challengeTitle={detail.title}
          onSubmitted={() => {
            loadDetail(detail.id)
          }}
        />
      )}
    </div>
  )
}
