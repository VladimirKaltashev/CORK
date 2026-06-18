import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useChallengesStore, type ChallengeStats } from '@/entities/challenges'
import { useAuthStore } from '@/entities/auth'
import type { Challenge } from '@/shared/types'

function formatTimer(startsAt: string, endsAt: string, status: string): { label: string; urgent: boolean; icon: string } {
  const now = Date.now()
  const start = new Date(startsAt).getTime()
  const end = new Date(endsAt).getTime()

  if (status === 'active') {
    const diff = end - now
    if (diff <= 0) return { label: 'Завершён', urgent: false, icon: 'clock' }
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    return { label: `Осталось ${days}д ${hours}ч`, urgent: days < 2, icon: 'clock' }
  }

  if (status === 'scheduled') {
    const diff = start - now
    if (diff <= 0) return { label: 'Стартует скоро', urgent: false, icon: 'calendar' }
    const days = Math.floor(diff / 86400000)
    return { label: `Стартует через ${days}д`, urgent: false, icon: 'calendar' }
  }

  return { label: 'Итоги открыты', urgent: false, icon: 'done' }
}

function getStatusTag(status: string): { text: string; className: string } {
  switch (status) {
    case 'active': return { text: 'active', className: 'cork-tag--active' }
    case 'scheduled': return { text: 'upcoming', className: 'cork-tag--upcoming' }
    case 'completed': return { text: 'completed', className: 'cork-tag--done' }
    case 'archived': return { text: 'archived', className: 'cork-tag--done' }
    default: return { text: status, className: '' }
  }
}

function getAwardTags(config: Record<string, unknown>): { icon: string; label: string }[] {
  const awards = config.awards as string[] | undefined
  if (!awards || awards.length === 0) return []
  const map: Record<string, { icon: string; label: string }> = {
    king: { icon: '👑', label: 'king' },
    clown: { icon: '🤡', label: 'clown' },
    finder: { icon: '🔍', label: 'finder' },
    best_comment: { icon: '💬', label: 'argument' },
    most_controversial: { icon: '🔥', label: 'controversy' },
    participant: { icon: '🎖', label: 'participant' },
  }
  return awards.map((a) => map[a] ?? { icon: '', label: a })
}

function getActionLabel(status: Challenge['status']): string {
  if (status === 'active') return 'Войти в арену'
  if (status === 'scheduled') return 'Открыть правила'
  return 'Смотреть итоги'
}

function ChallengeMeta({ challenge, stats }: { challenge: Challenge; stats: ChallengeStats }) {
  const timer = formatTimer(challenge.startsAt, challenge.endsAt, challenge.status)
  return (
    <div className="challenge-card__meta">
      <span className={timer.urgent ? 'is-urgent' : ''}>{timer.label}</span>
      <span>{stats.entries} заявок</span>
      <span>{stats.awards} наград</span>
      {challenge.status !== 'active' && (
        <span>
          {new Date(challenge.startsAt).toLocaleDateString('ru-RU')}
          {' — '}
          {new Date(challenge.endsAt).toLocaleDateString('ru-RU')}
        </span>
      )}
    </div>
  )
}

function ChallengeCard({ challenge, stats }: { challenge: Challenge; stats: ChallengeStats }) {
  const statusTag = getStatusTag(challenge.status)
  const awardTags = getAwardTags(challenge.config)

  return (
    <article className="challenge-card">
      <div className="challenge-card__top">
        <div className="challenge-card__icon">🏆</div>
        <div className="challenge-card__body">
          <div className="challenge-card__tags">
            <span className={`cork-tag ${statusTag.className}`}>{statusTag.text}</span>
            {awardTags.map((tag) => (
              <span key={tag.label} className="cork-tag">{tag.icon} {tag.label}</span>
            ))}
          </div>
          <h2 className="cork-title">
            <Link to={`/challenges/${challenge.id}`}>{challenge.title}</Link>
          </h2>
          <p className="cork-desc">{challenge.description}</p>
        </div>
      </div>

      <div className="challenge-card__footer">
        <ChallengeMeta challenge={challenge} stats={stats} />
        <Link to={`/challenges/${challenge.id}`} className="cork-btn cork-btn-primary">
          {getActionLabel(challenge.status)}
        </Link>
      </div>
    </article>
  )
}

function ChallengeSpotlight({ challenge, stats }: { challenge: Challenge; stats: ChallengeStats }) {
  const statusTag = getStatusTag(challenge.status)
  return (
    <section className="challenge-spotlight">
      <div>
        <div className="challenge-card__tags">
          <span className={`cork-tag ${statusTag.className}`}>Сейчас в арене</span>
          {getAwardTags(challenge.config).map((tag) => (
            <span key={tag.label} className="cork-tag">{tag.icon} {tag.label}</span>
          ))}
        </div>
        <h2>{challenge.title}</h2>
        <p>{challenge.description}</p>
        <ChallengeMeta challenge={challenge} stats={stats} />
      </div>
      <Link to={`/challenges/${challenge.id}`} className="cork-btn cork-btn-primary">
        {getActionLabel(challenge.status)}
      </Link>
    </section>
  )
}

function RankHubCard({ isLoggedIn }: { isLoggedIn: boolean }) {
  const rank = useChallengesStore((s) => s.expertTier)

  if (!isLoggedIn) {
    return (
      <div className="rank-card rank-card--compact">
        <div className="rank-card__top">
          <span className="rank-card__icon">⚪</span>
          <div className="rank-card__body">
            <div className="rank-card__eyebrow">CORK Rank</div>
            <div className="rank-card__title">Гость</div>
          </div>
        </div>
        <p className="rank-card__hint">Войдите, чтобы подавать заявки и копить ранг судьи.</p>
      </div>
    )
  }

  return (
    <div className="rank-card rank-card--compact">
      <div className="rank-card__top">
        <span className="rank-card__icon">{rank.icon}</span>
        <div className="rank-card__body">
          <div className="rank-card__eyebrow">CORK Rank</div>
          <div className="rank-card__title">{rank.displayTier}</div>
        </div>
        <div className="rank-card__score">
          <b>{rank.reactions}</b>
          <span>реакций</span>
        </div>
      </div>
      <div className="rank-meter" aria-label={`Прогресс ранга ${rank.progressPct}%`}>
        <span style={{ width: `${rank.progressPct}%` }} />
      </div>
      <div className="rank-card__foot">
        <span>{rank.isMaxTier ? 'макс. ранг' : `до ${rank.nextTier}: ${rank.remainingToNext}`}</span>
        <span>голос ×{rank.votePower}</span>
        <span>{rank.canPropose ? 'proposal unlocked' : 'proposal с Silver'}</span>
      </div>
    </div>
  )
}

const TABS = ['Все', 'Активные', 'Предстоящие', 'Завершённые'] as const
type Tab = typeof TABS[number]

export function ChallengesPage() {
  const {
    activeChallenges,
    upcomingChallenges,
    completedChallenges,
    statsByChallenge,
    isLoading,
    error,
    loadChallenges,
    expertTier,
    loadExpertTier,
  } = useChallengesStore()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    loadChallenges()
  }, [loadChallenges])

  useEffect(() => {
    if (user?.id) loadExpertTier(user.id)
  }, [user?.id, loadExpertTier])

  const [activeTab, setActiveTab] = useState<Tab>('Все')

  const visible = useMemo(() => {
    switch (activeTab) {
      case 'Активные': return activeChallenges
      case 'Предстоящие': return upcomingChallenges
      case 'Завершённые': return completedChallenges
      default: return [...activeChallenges, ...upcomingChallenges, ...completedChallenges]
    }
  }, [activeTab, activeChallenges, upcomingChallenges, completedChallenges])

  const featured = activeChallenges[0] ?? upcomingChallenges[0] ?? completedChallenges[0]

  const getStats = (challengeId: string): ChallengeStats =>
    statsByChallenge[challengeId] ?? { entries: 0, awards: 0 }

  return (
    <div className="cork-page">
      <div className="cork-shell">
        <main className="cork-main">
          <div className="challenge-hub-head">
            <div>
              <h1 className="cork-head" style={{ marginBottom: 6 }}>Челленджи</h1>
              <p>
                Временные арены CORK: принеси claim, собери вердикт, забери роль короля, скаута или автора лучшего аргумента.
              </p>
            </div>
            <RankHubCard isLoggedIn={!!user} />
          </div>

          {featured && !isLoading && !error && (
            <ChallengeSpotlight challenge={featured} stats={getStats(featured.id)} />
          )}

          <div className="challenge-toolbar">
            <div className="cork-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  className={`cork-tab${activeTab === tab ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="challenge-proposal-gate">
              <button
                className="cork-btn cork-btn-primary"
                disabled={!expertTier.canPropose}
                title={expertTier.canPropose ? 'Форма предложений будет следующим шагом' : 'Только эксперты Silver+'}
              >
                + Предложить челлендж
              </button>
              {!expertTier.canPropose && user && (
                <span>Откроется с Silver: ещё {expertTier.remainingToNext} реакций</span>
              )}
            </div>
          </div>

          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="cork-card" style={{ height: 140 }}>
                  <div className="cork-skeleton" style={{ width: '60%', height: 20, marginBottom: 12 }} />
                  <div className="cork-skeleton" style={{ width: '40%', height: 14, marginBottom: 8 }} />
                  <div className="cork-skeleton" style={{ width: '80%', height: 14 }} />
                </div>
              ))}
            </div>
          )}

          {error && !isLoading && (
            <div className="cork-empty">
              <b>⚠️</b>
              {error}
              <br />
              <button className="cork-btn" style={{ marginTop: 12 }} onClick={loadChallenges}>Повторить</button>
            </div>
          )}

          {!isLoading && !error && visible.length === 0 && (
            <div className="cork-empty">
              <b>🏆</b>
              Нет челленджей
            </div>
          )}

          {!isLoading && !error && visible.length > 0 && (
            <>
              {activeTab === 'Все' ? (
                <>
                  {activeChallenges.length > 0 && (
                    <section className="challenge-section">
                      <div className="cork-section-title">
                        🔥 Активные
                        <span className="count">{activeChallenges.length}</span>
                      </div>
                      {activeChallenges.map((challenge) => (
                        <ChallengeCard key={challenge.id} challenge={challenge} stats={getStats(challenge.id)} />
                      ))}
                    </section>
                  )}
                  {upcomingChallenges.length > 0 && (
                    <section className="challenge-section">
                      <div className="cork-section-title">
                        📅 Предстоящие
                        <span className="count">{upcomingChallenges.length}</span>
                      </div>
                      {upcomingChallenges.map((challenge) => (
                        <ChallengeCard key={challenge.id} challenge={challenge} stats={getStats(challenge.id)} />
                      ))}
                    </section>
                  )}
                  {completedChallenges.length > 0 && (
                    <section className="challenge-section">
                      <div className="cork-section-title">
                        ✅ Завершённые
                        <span className="count">{completedChallenges.length}</span>
                      </div>
                      {completedChallenges.map((challenge) => (
                        <ChallengeCard key={challenge.id} challenge={challenge} stats={getStats(challenge.id)} />
                      ))}
                    </section>
                  )}
                </>
              ) : (
                <section className="challenge-section">
                  {visible.map((challenge) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} stats={getStats(challenge.id)} />
                  ))}
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
