import { useThemeStore, getSelectableThemes, getThemeMetadata, type Theme } from '@/entities/theme'

function ThemeIcon({ theme, className, style }: { theme: Theme; className?: string; style?: React.CSSProperties }) {
  // Obsidian Blood — dark arena icon
  if (theme === 'obsidian') return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
      <line x1="12" y1="22" x2="12" y2="15.5" />
      <polyline points="22 8.5 12 15.5 2 8.5" />
    </svg>
  )
  // Acid Pop — terminal crosshair
  if (theme === 'acid') return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="12" y1="8" x2="12" y2="16" />
    </svg>
  )
  // Planned themes — ruler/design icon
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
    </svg>
  )
}

export function SettingsPage() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  const selectable = getSelectableThemes()

  return (
    <div className="mx-auto max-w-2xl py-6 px-3 flex flex-col gap-6">
      <h1 className="cork-head">Настройки</h1>

      <section className="cork-panel">
        <div className="mb-3">
          <h2 className="cork-section-title">CORK Worlds</h2>
          <p className="cork-desc">Каждая тема меняет не цвет приложения, а жанр приложения</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {selectable.map(({ id, name, description }) => {
            const active = id === theme
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                className="flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors"
                style={active
                  ? { borderColor: 'var(--cork-brand)', background: 'var(--cork-glow)' }
                  : { borderColor: 'var(--cork-border)', background: 'var(--cork-surface)' }
                }
              >
                <ThemeIcon theme={id} className="w-7 h-7" style={{ color: active ? 'var(--cork-brand)' : 'var(--cork-text-dim)' }} />
                <span className="text-sm font-semibold" style={{ color: active ? 'var(--cork-brand)' : 'var(--cork-text)' }}>
                  {name}
                </span>
                <span className="text-xs" style={{ color: 'var(--cork-text-mute)' }}>{description}</span>
              </button>
            )
          })}
        </div>

        {/* Planned theme worlds */}
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--cork-border-light)' }}>
          <h3 className="cork-desc" style={{ marginBottom: '8px' }}>Скоро</h3>
          <div className="grid grid-cols-3 gap-2 opacity-50">
            {getThemeMetadata('blueprint') && (
              <div className="rounded-lg border p-2 text-left" style={{ borderColor: 'var(--cork-border)', background: 'var(--cork-surface-2)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--cork-text-dim)' }}>
                  {getThemeMetadata('blueprint')!.name}
                </span>
              </div>
            )}
            {getThemeMetadata('bubblegum') && (
              <div className="rounded-lg border p-2 text-left" style={{ borderColor: 'var(--cork-border)', background: 'var(--cork-surface-2)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--cork-text-dim)' }}>
                  {getThemeMetadata('bubblegum')!.name}
                </span>
              </div>
            )}
            {getThemeMetadata('tribunal-paper') && (
              <div className="rounded-lg border p-2 text-left" style={{ borderColor: 'var(--cork-border)', background: 'var(--cork-surface-2)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--cork-text-dim)' }}>
                  {getThemeMetadata('tribunal-paper')!.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="cork-panel">
        <h2 className="cork-section-title">Скоро</h2>
        <ul className="cork-desc list-disc list-inside space-y-1">
          <li>Уведомления о реакциях на твои достижения</li>
          <li>Смена email и пароля</li>
          <li>Удаление аккаунта</li>
        </ul>
      </section>
    </div>
  )
}