import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useChallengesStore } from '@/entities/challenges'
import type { Challenge } from '@/shared/types'

function formatTimer(startsAt: string, endsAt: string, status: string): { label: string; urgent: boolean } {
  const now = Date.now()
  const start = new Date(startsAt).getTime()
  const end = new Date(endsAt).getTime()

  if (status === 'active') {
    const diff = end - now
    if (diff <= 0) return { label: 'Завершён', urgent: false }
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    return { label: `Осталось ${days}д ${hours}ч`, urgent: days < 2 }
  }

  if (status === 'scheduled') {
    const diff = start - now
    if (diff <= 0) return { label: 'Стартует скоро', urgent: false }
    const days = Math.floor(diff / 86400000)
    return { label: `Стартует через ${days}д`, urgent: false }
  }

  return { label: '', urgent: false }
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

function getAwardTags(config: Record<string, unknown>): string[] {
  const awards = config.awards as string[] | undefined
  if (!awards || awards.length === 0) return []
  const icons: Record<string, string> = {
    king: '👑',
    clown: '🤡',
    finder: '🔍',
    best_comment: '💬',
    most_controversial: '🔥',
    participant: '🎖',
  }
  return awards.map((a) => icons[a] ?? a)
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const timer = formatTimer(challenge.startsAt, challenge.endsAt, challenge.status)
  const statusTag = getStatusTag(challenge.status)
  const awardTags = getAwardTags(challenge.config)

  return (
    <div className="cork-card">
      <div className="cork-card__top">
        <div className="cork-card__icon">🏆</div>
        <div className="cork-card__body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
            <span className={`cork-tag ${statusTag.className}`}>{statusTag.text}</span>
            {awardTags.map((tag) => (
              <span key={tag} className="cork-tag">{tag}</span>
            ))}
          </div>
          <h2 className="cork-title">
            <Link to={`/challenges/${challenge.id}`}>{challenge.title}</Link>
          </h2>
          <p className="cork-desc">{challenge.description}</p>
        </div>
      </div>
      <div className="cork-card__footer">
        {timer.label && (
          <span className="timer" style={timer.urgent ? { color: 'var(--cork-clown)' } : undefined}>
            <svg className="icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="10" r="8" />
              <path d="M10 6v4l2.5 2.5" />
            </svg>
            {timer.label}
          </span>
        )}
        <span className="spacer" />
        <span className="cork-meta">
          {new Date(challenge.startsAt).toLocaleDateString('ru-RU')}
          {' — '}
          {new Date(challenge.endsAt).toLocaleDateString('ru-RU')}
        </span>
      </div>
    </div>
  )
}

const TABS = ['Все', 'Активные', 'Предстоящие', 'Завершённые'] as const
type Tab = typeof TABS[number]

export function ChallengesPage() {
  const { activeChallenges, upcomingChallenges, completedChallenges, isLoading, error, loadChallenges } = useChallengesStore()
  const [activeTab, setActiveTab] = useState<Tab>('Все')

  useEffect(() => {
    loadChallenges()
  }, [loadChallenges])

  const visible = useMemo(() => {
    switch (activeTab) {
      case 'Активные': return activeChallenges
      case 'Предстоящие': return upcomingChallenges
      case 'Завершённые': return completedChallenges
      default: return [...activeChallenges, ...upcomingChallenges, ...completedChallenges]
    }
  }, [activeTab, activeChallenges, upcomingChallenges, completedChallenges])

  return (
    <div className="cork-page">
      <div className="cork-shell" style={{ padding: '16px 0' }}>
        <div className="page-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 className="cork-head" style={{ margin: 0 }}>
            Челленджи
            <small style={{ marginLeft: 8, fontSize: 13, fontWeight: 400, color: 'var(--cork-text-dim)', textTransform: 'none', letterSpacing: 0 }}>
              сообщество решает
            </small>
          </h1>
        </div>

        <div className="cork-tabs" style={{ marginBottom: 24, flexWrap: 'wrap' }}>
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

        {!isLoading && !error && (
          <>
            {activeTab === 'Все' ? (
              <>
                {activeChallenges.length > 0 && (
                  <div style={{ marginBottom: 32 }}>
                    <div className="cork-section-title">
                      🔥 Активные
                      <span className="count">{activeChallenges.length}</span>
                    </div>
                    {activeChallenges.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
                  </div>
                )}
                {upcomingChallenges.length > 0 && (
                  <div style={{ marginBottom: 32 }}>
                    <div className="cork-section-title">
                      📅 Предстоящие
                      <span className="count">{upcomingChallenges.length}</span>
                    </div>
                    {upcomingChallenges.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
                  </div>
                )}
                {completedChallenges.length > 0 && (
                  <div>
                    <div className="cork-section-title">
                      ✅ Завершённые
                      <span className="count">{completedChallenges.length}</span>
                    </div>
                    {completedChallenges.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
                  </div>
                )}
              </>
            ) : (
              visible.map((c) => <ChallengeCard key={c.id} challenge={c} />)
            )}
          </>
        )}
      </div>
    </div>
  )
}
