import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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

  // 'me' means own profile
  const profileId = id === 'me' || !id ? authUser?.id ?? '' : id
  const isOwn = profileId === authUser?.id

  const profileStore = useProfileStore()
  const { achievements, isLoading: achLoading, loadAchievements } = useAchievementsStore()

  const [showEdit, setShowEdit] = useState(false)
  const [showAddAch, setShowAddAch] = useState(false)

  // Ensure profile exists in store
  const profile: LocalProfile | null = (() => {
    if (!profileId) return null
    const existing = profileStore.profiles[profileId]
    if (existing) return existing
    if (isOwn && authUser) {
      const fresh: LocalProfile = { id: profileId, name: authUser.name, bio: '', avatar: null, registeredAt: new Date().toISOString() }
      // Defer state mutation outside render
      return fresh
    }
    return null
  })()

  useEffect(() => {
    if (!profileId) return
    // Initialize own profile if not in store
    if (isOwn && authUser && !profileStore.profiles[profileId]) {
      profileStore.setProfile({ id: profileId, name: authUser.name, bio: '', avatar: null, registeredAt: new Date().toISOString() })
    }
    loadAchievements(profileId)
  }, [profileId])  // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveProfile = (data: Pick<LocalProfile, 'name' | 'bio' | 'avatar'>) => {
    if (!profileId) return
    profileStore.updateProfile(profileId, data)
  }

  const handleAvatarChange = (base64: string) => {
    if (!profileId || !isOwn) return
    profileStore.updateProfile(profileId, { avatar: base64 })
  }

  // Use live store value after effect runs
  const liveProfile = profileStore.profiles[profileId] ?? profile

  if (!profileId || !liveProfile) {
    return <div className="p-8 text-center text-gray-500">Профиль не найден</div>
  }

  const role = isOwn ? (authUser?.role ?? 'user') : 'user'
  const registeredFormatted = (() => {
    try {
      return new Date(liveProfile.registeredAt).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch { return '—' }
  })()

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6 px-4">
      {/* Profile card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <AvatarUpload
            avatar={liveProfile.avatar}
            name={liveProfile.name}
            onChange={handleAvatarChange}
            size="lg"
            editable={isOwn}
          />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{liveProfile.name}</h1>
            {liveProfile.bio && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{liveProfile.bio}</p>
            )}
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                {ROLE_LABELS[role] ?? role}
              </span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                Зарегистрирован {registeredFormatted}
              </span>
            </div>
          </div>
          {isOwn && (
            <button
              onClick={() => setShowEdit(true)}
              className="shrink-0 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Редактировать
            </button>
          )}
        </div>
      </div>

      {/* Achievements section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Достижения {achievements.length > 0 && <span className="text-sm font-normal text-gray-400">({achievements.length})</span>}
          </h2>
          {isOwn && (
            <button
              onClick={() => setShowAddAch(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              + Добавить
            </button>
          )}
        </div>

        {achLoading ? (
          <div className="py-10 text-center text-sm text-gray-400">Загрузка...</div>
        ) : achievements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {isOwn ? 'У вас пока нет достижений. Добавьте первое!' : 'Достижений пока нет'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {achievements.map((ach) => (
              <AchievementCard key={ach.id} achievement={ach} />
            ))}
          </div>
        )}
      </div>

      {showEdit && liveProfile && (
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
