import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Heading, Label } from '@primer/react'
import { useAuthStore } from '@/entities/auth'
import { useProfileStore, type LocalProfile } from '@/entities/profile'
import { useAchievementsStore } from '@/entities/achievements/store'
import { AvatarUpload } from '@/shared/ui/AvatarUpload'
import { EditProfileModal } from '@/features/profile/EditProfileModal'
import { AddAchievementModal } from '@/features/profile/AddAchievementModal'
import { AchievementCard } from '@/features/profile/AchievementCard'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  moderator: 'Модератор',
  teacher: 'Учитель',
  user: 'Пользователь',
}

export function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user: authUser } = useAuthStore()

  const profileId = id === 'me' || !id ? authUser?.id ?? '' : id
  const isOwn = profileId === authUser?.id

  const profileStore = useProfileStore()
  const { achievements, isLoading: achLoading, loadAchievements } = useAchievementsStore()

  const [showEdit, setShowEdit] = useState(false)
  const [showAddAch, setShowAddAch] = useState(false)

  useEffect(() => {
    if (!profileId) return
    if (isOwn && authUser && !profileStore.profiles[profileId]) {
      profileStore.setProfile({
        id: profileId,
        name: authUser.name,
        bio: '',
        avatar: null,
        registeredAt: new Date().toISOString(),
      })
    }
    loadAchievements(profileId)
  }, [profileId])

  const liveProfile: LocalProfile | null =
    profileStore.profiles[profileId] ??
    (isOwn && authUser
      ? { id: profileId, name: authUser.name, bio: '', avatar: null, registeredAt: new Date().toISOString() }
      : null)

  const handleSaveProfile = (data: Pick<LocalProfile, 'name' | 'bio' | 'avatar'>) => {
    if (!profileId) return
    profileStore.updateProfile(profileId, data)
  }

  const handleAvatarChange = (base64: string) => {
    if (!profileId || !isOwn) return
    profileStore.updateProfile(profileId, { avatar: base64 })
  }

  if (!profileId || !liveProfile) {
    return (
      <div className="p-4 text-center">
        <span className="text-gray-500">Профиль не найден</span>
      </div>
    )
  }

  const role = isOwn ? (authUser?.role ?? 'user') : 'user'
  const registeredFormatted = (() => {
    try {
      return new Date(liveProfile.registeredAt).toLocaleDateString('ru-RU', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    } catch { return '—' }
  })()

  return (
    <div className="mx-auto max-w-2xl py-4 px-3 flex flex-col gap-4">
      <div className="border border-gray-300 rounded-md bg-white p-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
          <AvatarUpload
            avatar={liveProfile.avatar}
            name={liveProfile.name}
            onChange={handleAvatarChange}
            size="lg"
            editable={isOwn}
          />
          <div className="flex-1 text-center sm:text-left">
            <Heading as="h2" className="text-2xl font-bold text-gray-900">{liveProfile.name}</Heading>
            {liveProfile.bio && (
              <p className="mt-1 text-sm text-gray-500">{liveProfile.bio}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-1 justify-center sm:justify-start">
              <Label>{ROLE_LABELS[role] ?? role}</Label>
              <Label variant="secondary">С {registeredFormatted}</Label>
            </div>
            <p className="mt-2 text-xs text-gray-400">ID: {profileId}</p>
          </div>
          {isOwn && (
            <Button onClick={() => setShowEdit(true)}>Редактировать</Button>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <Heading as="h3" className="text-xl font-semibold text-gray-900">
            Достижения
            {achievements.length > 0 && (
              <span className="text-sm font-normal text-gray-400 ml-1">({achievements.length})</span>
            )}
          </Heading>
          {isOwn && (
            <Button variant="primary" onClick={() => setShowAddAch(true)}>+ Добавить</Button>
          )}
        </div>

        {achLoading ? (
          <div className="py-5 text-center">
            <span className="text-sm text-gray-500">Загрузка...</span>
          </div>
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
      {showAddAch && <AddAchievementModal onClose={() => setShowAddAch(false)} />}
    </div>
  )
}