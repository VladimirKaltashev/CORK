import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@primer/react'
import { useAuthStore } from '@/entities/auth'
import { useProfileStore, type LocalProfile } from '@/entities/profile'
import { useAchievementsStore } from '@/entities/achievements/store'
import { useFriendsStore } from '@/entities/friends'
import { useReactionsStore } from '@/entities/reactions'
import { useCreateAchievementDialog } from '@/entities/achievements/createDialog'
import { AvatarUpload } from '@/shared/ui/AvatarUpload'
import { EditProfileModal } from '@/features/profile/EditProfileModal'
import { AchievementCard } from '@/features/profile/AchievementCard'

function ContactLink({ href, label, children }: { href: string; label?: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
    >
      {children}
    </a>
  )
}

function ScoreBlock({ crowns, clowns }: { crowns: number; clowns: number }) {
  if (crowns === 0 && clowns === 0) return null
  const ratio = clowns === 0 ? null : (crowns / clowns).toFixed(1)
  return (
    <div className="flex items-center gap-4 rounded-md border border-gray-300 bg-white p-3">
      <div className="flex items-center gap-1.5">
        <span className="text-2xl leading-none">👑</span>
        <span className="text-xl font-bold text-amber-700 tabular-nums">{crowns}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-2xl leading-none">🤡</span>
        <span className="text-xl font-bold text-red-600 tabular-nums">{clowns}</span>
      </div>
      <div className="ml-auto text-sm text-gray-500">
        {ratio !== null ? <>ratio <span className="font-semibold text-gray-700 tabular-nums">{ratio}</span></> : <span className="text-gray-400">пока без клоунов</span>}
      </div>
    </div>
  )
}

export function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user: authUser } = useAuthStore()

  const profileId = id === 'me' || !id ? authUser?.id ?? '' : id
  const isOwn = profileId === authUser?.id

  const profileStore = useProfileStore()
  const { achievements: allAchievements, isLoading: achLoading, loadAchievements } = useAchievementsStore()
  const achievements = isOwn ? allAchievements : allAchievements.filter((a) => a.status === 'verified')
  const { getRelationship, sendRequest, acceptRequest, removeRecord } = useFriendsStore()
  const loadReactions = useReactionsStore((s) => s.loadForAchievements)
  const loadScoresFor = useReactionsStore((s) => s.loadScoresFor)
  const score = useReactionsStore((s) => (profileId ? s.userScores[profileId] : undefined))
  const openCreateDialog = useCreateAchievementDialog((s) => s.open)

  const [showEdit, setShowEdit] = useState(false)
  const [friendBusy, setFriendBusy] = useState(false)

  useEffect(() => {
    if (!profileId) return
    profileStore.loadProfile(profileId)
    loadAchievements(profileId)
    loadScoresFor(profileId)
  }, [profileId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const verifiedIds = allAchievements.filter((a) => a.status === 'verified').map((a) => a.id)
    if (verifiedIds.length === 0) return
    loadReactions(verifiedIds, authUser?.id)
  }, [allAchievements, authUser?.id, loadReactions])

  const liveProfile: LocalProfile | null = profileStore.profiles[profileId] ?? null

  const handleSaveProfile = (data: Pick<LocalProfile, 'name' | 'bio' | 'avatar' | 'contacts'>) => {
    if (!profileId) return
    profileStore.updateProfile(profileId, data)
  }

  const handleAvatarChange = (base64: string) => {
    if (!profileId || !isOwn) return
    profileStore.updateProfile(profileId, { avatar: base64 })
  }

  if (!profileId || profileStore.isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">Загрузка...</div>
    )
  }

  if (!liveProfile) {
    return (
      <div className="p-4 text-center text-gray-500">Профиль не найден</div>
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
      <div className="border border-gray-300 rounded-md bg-white p-4">
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
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{liveProfile.name}</h1>
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
                    return <span className="text-sm text-gray-400 self-center">Запрос отправлен</span>
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
            <p className="text-sm text-gray-500 mt-1">На сайте с {registeredFormatted}</p>
            <p className="text-xs text-gray-400 mt-0.5">ID: {profileId}</p>

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

      {/* Bio block */}
      {liveProfile.bio ? (
        <div className="border border-gray-300 rounded-md bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">О себе</h2>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{liveProfile.bio}</p>
        </div>
      ) : isOwn ? (
        <div className="border border-dashed border-gray-300 rounded-md py-4 px-4 flex items-center justify-between">
          <span className="text-sm text-gray-400">Расскажите о себе</span>
          <Button size="small" onClick={() => setShowEdit(true)}>Добавить описание</Button>
        </div>
      ) : null}

      {/* Achievements */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-900">
            Достижения
            {achievements.length > 0 && (
              <span className="text-sm font-normal text-gray-400 ml-1">({achievements.length})</span>
            )}
          </h2>
          {isOwn && (
            <Button variant="primary" onClick={openCreateDialog}>+ Добавить</Button>
          )}
        </div>

        {achLoading ? (
          <div className="py-5 text-center text-sm text-gray-500">Загрузка...</div>
        ) : achievements.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-md py-6 text-center">
            <span className="text-sm text-gray-500">
              {isOwn ? 'Нет достижений. Добавьте первое!' : 'Достижений пока нет'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {achievements.map((ach) => (
              <AchievementCard key={ach.id} achievement={ach} />
            ))}
          </div>
        )}
      </div>

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
