import { useState } from 'react'
import { FormControl, TextInput, Textarea } from '@primer/react'
import { AvatarUpload } from '@/shared/ui/AvatarUpload'
import type { LocalProfile, ProfileContacts } from '@/entities/profile'

interface EditProfileModalProps {
  profile: LocalProfile
  onSave: (data: Pick<LocalProfile, 'name' | 'bio' | 'avatar' | 'contacts'>) => Promise<boolean>
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
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSaving) return
    if (!name.trim()) { setNameError('Имя обязательно'); return }

    const contacts: ProfileContacts = {}
    if (telegram.trim()) contacts.telegram = telegram.trim()
    if (github.trim()) contacts.github = github.trim()
    if (email.trim()) contacts.email = email.trim()
    if (custom.trim()) contacts.custom = custom.trim()

    setIsSaving(true)
    const saved = await onSave({
      name: name.trim(),
      bio: bio.trim() || undefined,
      avatar,
      contacts: Object.keys(contacts).length > 0 ? contacts : undefined,
    })
    setIsSaving(false)
    if (saved) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-md p-4 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--cork-surface)', border: '1px solid var(--cork-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--cork-text)' }}>Редактировать профиль</h2>
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
                <span className="text-xs" style={{ color: 'var(--cork-text-mute)' }}>{bio.length}/1000</span>
              </div>
            </FormControl>

            <div>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--cork-text-dim)' }}>Контакты</p>
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
                className="cork-btn flex-1"
                disabled={isSaving}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="cork-btn-primary flex-1"
                disabled={isSaving}
              >
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
