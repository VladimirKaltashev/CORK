import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { Button } from '@primer/react'
import { useAuthStore } from '@/entities/auth'
import { useProfileStore, type LocalProfile } from '@/entities/profile'
import { useAchievementsStore } from '@/entities/achievements/store'
import { useFriendsStore } from '@/entities/friends'
import { useReactionsStore } from '@/entities/reactions'
import { getThresholds, getExpertProgress } from '@/shared/lib/expert'
import type { ExpertThreshold } from '@/shared/types'
import { AvatarUpload } from '@/shared/ui/AvatarUpload'
import { CrownIcon, ClownIcon } from '@/shared/ui'
import { EditProfileModal } from '@/features/profile/EditProfileModal'
import { AchievementCard } from '@/features/profile/AchievementCard'

function ContactLink({ href, label, children }: { href: string; label?: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className="cork-link inline-flex items-center gap-1 text-xs"
    >
      {children}
    </a>
  )
}

function ScoreBlock({ crowns, clowns }: { crowns: number; clowns: number }) {
  const ratio = clowns === 0 ? null : (crowns / clowns).toFixed(1)
  const hasReactions = crowns > 0 || clowns > 0
  return (
    <div className="cork-panel flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--cork-text-mute)' }}>
            Репутация
          </div>
          <div className="text-sm" style={{ color: 'var(--cork-text-dim)' }}>
            Арена считает короны и клоунов по вашим заявкам.
          </div>
        </div>
        <div className="text-sm" style={{ color: 'var(--cork-text-dim)' }}>
          {hasReactions
            ? (
                ratio !== null
                  ? <>ratio <span className="font-semibold tabular-nums" style={{ color: 'var(--cork-text)' }}>{ratio}</span></>
                  : <span style={{ color: 'var(--cork-text-mute)' }}>пока без клоунов</span>
              )
            : <span style={{ color: 'var(--cork-text-mute)' }}>пока без реакций</span>}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <CrownIcon className="w-7 h-7" />
          <span className="text-xl font-bold tabular-nums" style={{ color: 'var(--cork-king)' }}>{crowns}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ClownIcon className="w-7 h-7" />
          <span className="text-xl font-bold tabular-nums" style={{ color: 'var(--cork-clown)' }}>{clowns}</span>
        </div>
      </div>
    </div>
  )
}

export function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user: authUser, updateUser } = useAuthStore()

  const profileId = id === 'me' || !id ? authUser?.id ?? '' : id
  const isOwn = profileId === authUser?.id

  const profileStore = useProfileStore()
  const { achievements: allAchievements, isLoading: achLoading, loadAchievements } = useAchievementsStore()
  const achievements = isOwn ? allAchievements : allAchievements.filter((a) => a.status === 'verified')
  const { getRelationship, sendRequest, acceptRequest, removeRecord } = useFriendsStore()
  const loadReactions = useReactionsStore((s) => s.loadForAchievements)
  const loadScoresFor = useReactionsStore((s) => s.loadScoresFor)
  const score = useReactionsStore((s) => (profileId ? s.userScores[profileId] : undefined))

  const [showEdit, setShowEdit] = useState(false)
  const [friendBusy, setFriendBusy] = useState(false)
  const [thresholds, setThresholds] = useState<ExpertThreshold[] | null>(null)

  useEffect(() => {
    getThresholds().then(setThresholds)
  }, [])

  useEffect(() => {
    if (!profileId) return
    profileStore.loadProfile(profileId)
    loadScoresFor(profileId)
    if (!isOwn) {
      loadAchievements(profileId)
    }
  }, [profileId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOwn) return
    const verifiedIds = achievements.filter((a) => a.status === 'verified').map((a) => a.id)
    if (verifiedIds.length === 0) return
    loadReactions(verifiedIds, authUser?.id)
  }, [achievements, authUser?.id, isOwn, loadReactions])

  const liveProfile: LocalProfile | null = profileStore.profiles[profileId] ?? null

  const handleSaveProfile = async (data: Pick<LocalProfile, 'name' | 'bio' | 'avatar' | 'contacts'>) => {
    if (!profileId) return false
    const saved = await profileStore.updateProfile(profileId, data)
    if (saved && isOwn && data.name) {
      updateUser({ name: data.name })
    }
    return saved
  }

  const handleAvatarChange = async (base64: string) => {
    if (!profileId || !isOwn) return
    await profileStore.updateProfile(profileId, { avatar: base64 })
  }

  if (!profileId || profileStore.isLoading) {
    return (
      <div className="p-4 text-center" style={{ color: 'var(--cork-text-mute)' }}>Загрузка...</div>
    )
  }

  if (!liveProfile) {
    return (
      <div className="p-4 text-center" style={{ color: 'var(--cork-text-mute)' }}>Профиль не найден</div>
    )
  }

  const registeredFormatted = (() => {
    try {
      return new Date(liveProfile.registeredAt).toLocaleDateString('ru-RU', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    } catch { return '—' }
  })()

  const contacts = liveProfile.contacts
  const hasContacts = contacts && Object.values(contacts).some(Boolean)

  return (
    <div className="mx-auto max-w-2xl py-4 px-3 flex flex-col gap-4">

      {/* Header card */}
      <div className="cork-card">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AvatarUpload
              avatar={liveProfile.avatar}
              name={liveProfile.name}
              onChange={handleAvatarChange}
              size="lg"
              editable={isOwn}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--cork-text)' }}>{liveProfile.name}</h1>
              <div className="flex gap-2 flex-shrink-0">
                {isOwn ? (
                  <Button onClick={() => setShowEdit(true)}>Редактировать</Button>
                ) : (() => {
                  const rel = getRelationship(profileId)
                  if (!rel) return (
                    <Button disabled={friendBusy} onClick={async () => {
                      setFriendBusy(true)
                      try { await sendRequest(profileId) }
                      catch { /* shown by store */ }
                      finally { setFriendBusy(false) }
                    }}>
                      {friendBusy ? '...' : 'Добавить в друзья'}
                    </Button>
                  )
                  if (rel.direction === 'outgoing' && rel.record.status === 'pending')
                    return <span className="text-sm self-center" style={{ color: 'var(--cork-text-mute)' }}>Запрос отправлен</span>
                  if (rel.direction === 'incoming' && rel.record.status === 'pending')
                    return (
                      <Button variant="primary" disabled={friendBusy} onClick={async () => {
                        setFriendBusy(true)
                        try { await acceptRequest(rel.record.id) }
                        finally { setFriendBusy(false) }
                      }}>
                        {friendBusy ? '...' : 'Принять заявку'}
                      </Button>
                    )
                  if (rel.record.status === 'accepted')
                    return (
                      <Button variant="danger" disabled={friendBusy} onClick={async () => {
                        setFriendBusy(true)
                        try { await removeRecord(rel.record.id) }
                        finally { setFriendBusy(false) }
                      }}>
                        {friendBusy ? '...' : 'Удалить из друзей'}
                      </Button>
                    )
                  return null
                })()}
              </div>
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--cork-text-dim)' }}>На сайте с {registeredFormatted}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--cork-text-mute)' }}>ID: {profileId}</p>

            {hasContacts && (
              <div className="flex flex-wrap gap-3 mt-2">
                {contacts?.telegram && (
                  <ContactLink
                    href={`https://t.me/${contacts.telegram.replace(/^@/, '')}`}
                    label="Telegram"
                  >
                    <span className="font-medium">TG</span>
                    <span>{contacts.telegram.startsWith('@') ? contacts.telegram : `@${contacts.telegram}`}</span>
                  </ContactLink>
                )}
                {contacts?.github && (
                  <ContactLink href={`https://github.com/${contacts.github}`} label="GitHub">
                    <span className="font-medium">GH</span>
                    <span>{contacts.github}</span>
                  </ContactLink>
                )}
                {contacts?.email && (
                  <ContactLink href={`mailto:${contacts.email}`} label="Email">
                    <span>✉</span>
                    <span>{contacts.email}</span>
                  </ContactLink>
                )}
                {contacts?.custom && (
                  <ContactLink href={contacts.custom} label="Контакт">
                    <span>🔗</span>
                    <span className="truncate max-w-[160px]">{contacts.custom}</span>
                  </ContactLink>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Score */}
      <ScoreBlock crowns={score?.crowns ?? 0} clowns={score?.clowns ?? 0} />

      {/* Expert Tier */}
      {thresholds && (() => {
        const total = (score?.crowns ?? 0) + (score?.clowns ?? 0)
        const rank = getExpertProgress(total, thresholds)
        return (
          <div className="cork-panel rank-card">
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
            {isOwn && (
              <div className="rank-card__foot">
                <span>
                  {rank.isMaxTier
                    ? 'Максимальный ранг открыт'
                    : `До ${rank.nextTier}: ${rank.remainingToNext}`}
                </span>
                <span>голос ×{rank.votePower}</span>
                <span>{rank.canPropose ? 'может предлагать челленджи' : 'предложения с Silver'}</span>
              </div>
            )}
          </div>
        )
      })()}

      {isOwn ? (
        <div className="cork-panel flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--cork-text-mute)' }}>
              Мои заявки
            </div>
            <p className="text-sm mt-1 mb-0" style={{ color: 'var(--cork-text-dim)' }}>
              Следите за своими заявками и исходами в отдельном разделе.
            </p>
          </div>
          <Link to="/me" className="cork-link text-sm font-semibold">
            Открыть мои заявки
          </Link>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--cork-text)' }}>
              Заявки пользователя
              {achievements.length > 0 && (
                <span className="text-sm font-normal ml-1" style={{ color: 'var(--cork-text-mute)' }}>({achievements.length})</span>
              )}
            </h2>
          </div>

          {achLoading ? (
            <div className="py-5 text-center text-sm" style={{ color: 'var(--cork-text-mute)' }}>Загрузка...</div>
          ) : achievements.length === 0 ? (
            <div className="cork-empty">
              <span className="text-sm">Публичных заявок пока нет</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {achievements.map((ach) => (
                <AchievementCard key={ach.id} achievement={ach} showModerationStatus={false} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bio block */}
      {liveProfile.bio ? (
        <div className="cork-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--cork-text-mute)' }}>О себе</h2>
          <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--cork-text)' }}>{liveProfile.bio}</p>
        </div>
      ) : isOwn ? (
        <div className="border border-dashed rounded-md py-4 px-4 flex items-center justify-between" style={{ borderColor: 'var(--cork-border)' }}>
          <span className="text-sm" style={{ color: 'var(--cork-text-mute)' }}>Расскажите о себе</span>
          <Button size="small" onClick={() => setShowEdit(true)}>Добавить описание</Button>
        </div>
      ) : null}

      {showEdit && (
        <EditProfileModal
          profile={liveProfile}
          onSave={handleSaveProfile}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  )
}
