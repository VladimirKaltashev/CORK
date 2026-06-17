import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useChallengesStore } from '@/entities/challenges'
import { getTierIcon, getThresholds, getExpertTier } from '@/shared/lib/expert'
import { useAuthStore } from '@/entities/auth'
import { supabase } from '@/shared/lib/supabase'

const AWARD_ICONS: Record<string, { icon: string; desc: string }> = {
  king: { icon: '👑', desc: 'Победитель (1 место)' },
  clown: { icon: '🤡', desc: 'Самая смешная заявка' },
  finder: { icon: '🔍', desc: 'Первооткрыватель темы' },
  best_comment: { icon: '💬', desc: 'Лучший комментарий' },
  most_controversial: { icon: '🔥', desc: 'Самая спорная заявка' },
  participant: { icon: '🎖', desc: 'Участник' },
}

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

  return ''
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getStatusLabel(status: string): { text: string; color: string } {
  switch (status) {
    case 'active': return { text: '🟢 Активен', color: 'var(--cork-success)' }
    case 'scheduled': return { text: '🔵 Предстоит', color: 'var(--cork-brand)' }
    case 'completed': return { text: '✅ Завершён', color: 'var(--cork-text-dim)' }
    case 'archived': return { text: '📦 В архиве', color: 'var(--cork-text-mute)' }
    default: return { text: status, color: 'var(--cork-text-dim)' }
  }
}

const AWARD_TAG_CLASS: Record<string, string> = {
  king: 'cork-tag--king',
  clown: 'cork-tag--clown',
  finder: 'cork-tag--finder',
}

export function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { detail, entries, awards, isDetailLoading, detailError, loadDetail } = useChallengesStore()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (id) loadDetail(id)
  }, [id, loadDetail])

  // Load expert tier info for sidebar
  const [userTier, setUserTier] = useState<{ tier: string | null; votePower: number; reactions: number } | null>(null)
  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      try {
        const { data } = await supabase
          .from('profile_scores')
          .select('crowns, clowns')
          .eq('user_id', user.id)
          .maybeSingle()
        const total = (data?.crowns ?? 0) + (data?.clowns ?? 0)
        const thresholds = await getThresholds()
        const { tier, votePower } = getExpertTier(total, thresholds)
        setUserTier({ tier, votePower, reactions: total })
      } catch { /* ignore */ }
    })()
  }, [user?.id])

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
  const isActiveOrUpcoming = detail.status === 'active' || detail.status === 'scheduled'

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

            {/* ══ MAIN ══ */}
            <div>

              {/* Hero */}
              <div className="challenge-hero">
                <div className="challenge-hero__top">
                  <div className="challenge-hero__icon">🏆</div>
                  <div className="challenge-hero__body">
                    <div className="cork-tabs" style={{ marginBottom: 8 }}>
                      <span className="cork-tag cork-tag--active">{detail.status}</span>
                      {awardsList?.map((a) => {
                        const info = AWARD_ICONS[a]
                        return (
                          <span key={a} className="cork-tag">
                            {info?.icon ?? ''} {a}
                          </span>
                        )
                      })}
                    </div>
                    <h1 style={{ margin: 0, fontSize: 24 }}>{detail.title}</h1>
                    <div className="challenge-hero__meta">
                      <span>🗓 {formatDate(detail.startsAt)} — {formatDate(detail.endsAt)}</span>
                      <span>👤 организатор <strong style={{ color: 'var(--cork-brand)' }}>@{detail.createdBy.slice(0, 8)}</strong></span>
                    </div>
                  </div>
                </div>

                <p className="challenge-hero__desc">{detail.description}</p>

                {isActiveOrUpcoming && (
                  <div className="timer-large">
                    <svg className="icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <span style={{ color: 'var(--cork-brand)' }}>{formatTimer(detail.startsAt, detail.endsAt, detail.status)}</span>
                    {detail.status === 'active' && (
                      <span style={{ color: 'var(--cork-text-mute)', fontWeight: 400 }}>
                        · закончится {formatDate(detail.endsAt)}
                      </span>
                    )}
                  </div>
                )}

                <div className="stats-grid">
                  <div className="cork-stat"><b>{entries.length}</b><small>участников</small></div>
                  <div className="cork-stat"><b>{entries.length}</b><small>заявок</small></div>
                  <div className="cork-stat"><b>{awards.length}</b><small>наград</small></div>
                  <div className="cork-stat"><b>{durationDays}</b><small>дней</small></div>
                </div>
              </div>

              {/* ══ ENTRIES ══ */}
              <div className="cork-section-title">
                👥 Участники
                <span className="count">{entries.length}</span>
              </div>

              {entries.length === 0 ? (
                <div className="cork-empty" style={{ marginBottom: 16 }}>
                  <b>🏆</b>
                  Пока нет участников
                </div>
              ) : (
                entries.map((entry) => (
                  <div key={entry.id} className="entry-card">
                    <div
                      className="entry-card__avatar"
                      style={{ background: 'var(--cork-brand)' }}
                    >
                      {entry.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="entry-card__body">
                      <div className="entry-card__title">
                        <Link to={`/profile/${entry.userId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          @{entry.userName}
                        </Link>
                      </div>
                      <div className="entry-card__claim">«{entry.title}»</div>
                    </div>
                    {awards.filter((a) => a.userId === entry.userId).map((a) => (
                      <span key={a.id} className={`cork-tag ${AWARD_TAG_CLASS[a.awardType] ?? ''}`}>
                        {AWARD_ICONS[a.awardType]?.icon} {a.awardType}
                      </span>
                    ))}
                  </div>
                ))
              )}

            </div>

            {/* ══ SIDEBAR ══ */}
            <div>

              {/* Info */}
              <div className="sidebar-block">
                <h4>ℹ️ О челлендже</h4>
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

              {/* Awards */}
              {awardsList && awardsList.length > 0 && (
                <div className="sidebar-block">
                  <h4>🏆 Награды</h4>
                  {awardsList.map((a) => {
                    const info = AWARD_ICONS[a]
                    return (
                      <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span style={{ fontSize: 20 }}>{info?.icon ?? ''}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'capitalize' }}>{a}</div>
                          <div style={{ fontSize: 11, color: 'var(--cork-text-dim)' }}>{info?.desc ?? ''}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Expert rank */}
              {userTier && userTier.tier && (
                <div className="sidebar-block">
                  <h4>⭐ Мой ранг</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 32 }}>{getTierIcon(userTier.tier)}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--cork-brand)' }}>{userTier.tier}</div>
                      <div style={{ fontSize: 11, color: 'var(--cork-text-dim)' }}>
                        {userTier.reactions} реакций · голос ×{userTier.votePower}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ══ AWARDS (completed) ══ */}
          {detail.status === 'completed' && awards.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <hr className="cork-divider" />
              <div className="cork-section-title" style={{ marginTop: 24 }}>
                🏅 Награды
                <span className="count">{awards.length}</span>
              </div>
              {awards.map((a) => (
                <div key={a.id} className="award-row">
                  <div className="award-row__badge">{AWARD_ICONS[a.awardType]?.icon ?? ''}</div>
                  <div className="award-row__body">
                    <div className="award-row__title">{a.awardType}</div>
                    <div className="award-row__user">@{a.userName}</div>
                  </div>
                  <span className={`cork-tag ${AWARD_TAG_CLASS[a.awardType] ?? ''}`}>
                    {a.awardType === 'king' ? 'победитель' : a.awardType === 'clown' ? 'юморист' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
