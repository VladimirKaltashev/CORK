import { useAuthStore } from '@/entities/auth'
import { useProfileStore } from '@/entities/profile'
import { useCreateAchievementDialog } from '@/entities/achievements/createDialog'

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
}

export function InlineCreateCard() {
  const { user, token } = useAuthStore()
  const open = useCreateAchievementDialog((s) => s.open)
  const profile = useProfileStore((s) => (user ? s.profiles[user.id] : undefined))

  if (!token || !user) return null

  const avatar = profile?.avatar ?? null
  const name = user.name

  return (
    <button
      type="button"
      onClick={open}
      className="w-full flex items-center gap-3 rounded-md border border-gray-300 bg-white p-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/30"
    >
      {avatar ? (
        <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200 flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold ring-1 ring-gray-200 flex-shrink-0 select-none">
          {getInitials(name)}
        </div>
      )}
      <span className="flex-1 text-sm text-gray-500">Чем поделишься?</span>
      <span className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>Поделиться</span>
      </span>
    </button>
  )
}
