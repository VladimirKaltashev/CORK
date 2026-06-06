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
      className="w-full flex items-center gap-3 p-3 text-left transition-colors"
      style={{
        borderRadius: 'var(--cork-radius-card)',
        border: '1px solid var(--cork-border)',
        background: 'var(--cork-surface)',
      }}
    >
      {avatar ? (
        <img src={avatar} alt={name} className="w-8 h-8 object-cover flex-shrink-0" style={{ borderRadius: 'var(--cork-radius-pill)', border: '1px solid var(--cork-border-light)' }} />
      ) : (
        <div
          className="w-8 h-8 flex items-center justify-center text-sm font-semibold flex-shrink-0 select-none"
          style={{
            borderRadius: 'var(--cork-radius-pill)',
            background: 'var(--cork-surface-3)',
            color: 'var(--cork-brand)',
            border: '1px solid var(--cork-border-light)',
          }}
        >
          {getInitials(name)}
        </div>
      )}
      <span className="flex-1 text-sm" style={{ color: 'var(--cork-text-dim)' }}>Чем поделишься?</span>
      <span
        className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8"
        style={{
          borderRadius: 'var(--cork-radius-btn)',
          background: 'var(--cork-brand)',
          color: 'var(--cork-brand-ink)',
        }}
        aria-label="Добавить"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
    </button>
  )
}
