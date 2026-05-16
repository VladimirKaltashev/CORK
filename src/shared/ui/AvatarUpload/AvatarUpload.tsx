import { useRef } from 'react'

interface AvatarUploadProps {
  avatar: string | null
  name: string
  onChange: (base64: string) => void
  size?: 'sm' | 'md' | 'lg'
  editable?: boolean
}

const SIZE_PX = { sm: 48, md: 80, lg: 96 }
const FONT_SIZE = { sm: '1.125rem', md: '1.875rem', lg: '2.25rem' }

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

  const px = SIZE_PX[size]

  return (
    <div className="relative inline-block">
      <div
        className="rounded-full overflow-hidden flex items-center justify-center font-bold select-none"
        style={{
          width: px,
          height: px,
          backgroundColor: '#eaeef2',
          fontSize: FONT_SIZE[size],
          color: '#57606a',
          cursor: editable ? 'pointer' : 'default',
          border: '1px solid #d0d7de',
        }}
        onClick={() => editable && inputRef.current?.click()}
        title={editable ? 'Изменить аватар' : undefined}
      >
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {editable && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            title="Загрузить фото"
            aria-label="Загрузить фото"
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white text-gray-700 border border-gray-300 shadow-sm flex items-center justify-center text-base font-bold leading-none hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <span className="-mt-0.5">+</span>
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