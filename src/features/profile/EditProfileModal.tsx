import { useState } from 'react'
import { AvatarUpload } from '@/shared/ui/AvatarUpload'
import type { LocalProfile } from '@/entities/profile'

interface EditProfileModalProps {
  profile: LocalProfile
  onSave: (data: Pick<LocalProfile, 'name' | 'bio' | 'avatar'>) => void
  onClose: () => void
}

export function EditProfileModal({ profile, onSave, onClose }: EditProfileModalProps) {
  const [name, setName] = useState(profile.name)
  const [bio, setBio] = useState(profile.bio)
  const [avatar, setAvatar] = useState<string | null>(profile.avatar)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Имя обязательно'); return }
    onSave({ name: name.trim(), bio: bio.trim(), avatar })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-5 text-lg font-semibold text-gray-900 dark:text-white">Редактировать профиль</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <AvatarUpload avatar={avatar} name={name || '?'} onChange={setAvatar} size="lg" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Имя</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Ваше имя"
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">О себе</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={300}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Расскажите о себе..."
            />
            <p className="mt-1 text-right text-xs text-gray-400">{bio.length}/300</p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
