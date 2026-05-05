import { useState } from 'react'
import { Button, FormControl, TextInput, Textarea } from '@primer/react'
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-md border border-gray-300 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Редактировать профиль</h2>
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
                onChange={(e) => { setName(e.target.value); setError('') }}
                placeholder="Ваше имя"
                validationStatus={error ? 'error' : undefined}
              />
              {error && <FormControl.Validation variant="error">{error}</FormControl.Validation>}
            </FormControl>

            <FormControl>
              <FormControl.Label>О себе</FormControl.Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="Расскажите о себе..."
                className="w-full"
              />
              <div className="text-right mt-1">
                <span className="text-xs text-gray-400">{bio.length}/300</span>
              </div>
            </FormControl>

            <div className="flex gap-2 pt-1">
              <Button type="button" onClick={onClose} className="flex-1">Отмена</Button>
              <Button type="submit" variant="primary" className="flex-1">Сохранить</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}