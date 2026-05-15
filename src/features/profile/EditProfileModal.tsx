import { useState } from 'react'
import { FormControl, TextInput, Textarea } from '@primer/react'
import { AvatarUpload } from '@/shared/ui/AvatarUpload'
import type { LocalProfile, ProfileContacts } from '@/entities/profile'

interface EditProfileModalProps {
  profile: LocalProfile
  onSave: (data: Pick<LocalProfile, 'name' | 'bio' | 'avatar' | 'contacts'>) => void
  onClose: () => void
}

export function EditProfileModal({ profile, onSave, onClose }: EditProfileModalProps) {
  const [name, setName] = useState(profile.name)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [avatar, setAvatar] = useState<string | null>(profile.avatar)
  const [telegram, setTelegram] = useState(profile.contacts?.telegram ?? '')
  const [github, setGithub] = useState(profile.contacts?.github ?? '')
  const [email, setEmail] = useState(profile.contacts?.email ?? '')
  const [custom, setCustom] = useState(profile.contacts?.custom ?? '')
  const [nameError, setNameError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setNameError('Имя обязательно'); return }

    const contacts: ProfileContacts = {}
    if (telegram.trim()) contacts.telegram = telegram.trim()
    if (github.trim()) contacts.github = github.trim()
    if (email.trim()) contacts.email = email.trim()
    if (custom.trim()) contacts.custom = custom.trim()

    onSave({
      name: name.trim(),
      bio: bio.trim() || undefined,
      avatar,
      contacts: Object.keys(contacts).length > 0 ? contacts : undefined,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-md border border-gray-300 p-4 max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4 dark:text-white">Редактировать профиль</h2>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3">

            <div className="flex justify-center">
              <AvatarUpload avatar={avatar} name={name || '?'} onChange={setAvatar} size="lg" />
            </div>

            <FormControl required>
              <FormControl.Label>Имя</FormControl.Label>
              <TextInput
                block
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError('') }}
                placeholder="Ваше имя"
                validationStatus={nameError ? 'error' : undefined}
              />
              {nameError && <FormControl.Validation variant="error">{nameError}</FormControl.Validation>}
            </FormControl>

            <FormControl>
              <FormControl.Label>О себе</FormControl.Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Расскажите о себе, своих интересах и целях..."
                className="w-full"
              />
              <div className="text-right mt-1">
                <span className="text-xs text-gray-400 dark:text-gray-500">{bio.length}/1000</span>
              </div>
            </FormControl>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Контакты</p>
              <div className="flex flex-col gap-2">
                <FormControl>
                  <FormControl.Label>Telegram</FormControl.Label>
                  <TextInput
                    block
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder="@username"
                  />
                </FormControl>
                <FormControl>
                  <FormControl.Label>GitHub</FormControl.Label>
                  <TextInput
                    block
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="username"
                  />
                </FormControl>
                <FormControl>
                  <FormControl.Label>Email</FormControl.Label>
                  <TextInput
                    block
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </FormControl>
                <FormControl>
                  <FormControl.Label>Другой контакт</FormControl.Label>
                  <TextInput
                    block
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    placeholder="Ссылка или username"
                  />
                </FormControl>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                Сохранить
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
