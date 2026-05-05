import { useRef } from 'react'

interface AvatarUploadProps {
  avatar: string | null
  name: string
  onChange: (base64: string) => void
  size?: 'sm' | 'md' | 'lg'
  editable?: boolean
}

const SIZE_CLASSES = { sm: 'h-12 w-12 text-lg', md: 'h-20 w-20 text-3xl', lg: 'h-24 w-24 text-4xl' }

export function AvatarUpload({ avatar, name, onChange, size = 'md', editable = true }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

  return (
    <div className="relative inline-block">
      <div
        className={`${SIZE_CLASSES[size]} overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300 select-none ${editable ? 'cursor-pointer' : ''}`}
        onClick={() => editable && inputRef.current?.click()}
        title={editable ? 'Изменить аватар' : undefined}
      >
        {avatar ? (
          <img src={avatar} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {editable && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow hover:bg-indigo-700"
            title="Загрузить фото"
          >
            <span className="text-xs leading-none">✎</span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </>
      )}
    </div>
  )
}
