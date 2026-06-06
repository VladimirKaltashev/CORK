import { useThemeStore, type Theme } from '@/entities/theme'
import { SunIcon, MoonIcon, SystemIcon } from '@/shared/ui'

function AcidIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="12" y1="8" x2="12" y2="16" />
    </svg>
  )
}

type IconComponent = typeof SunIcon

const THEMES: { value: Theme; Icon: IconComponent; label: string; description: string }[] = [
  { value: 'light',  Icon: SunIcon,    label: 'Светлая',   description: 'Всегда светлая' },
  { value: 'dark',   Icon: MoonIcon,   label: 'Тёмная',    description: 'Всегда тёмная' },
  { value: 'system', Icon: SystemIcon, label: 'Системная', description: 'Как в настройках ОС' },
  { value: 'acid',   Icon: AcidIcon,   label: 'Acid Pop',  description: 'Cyber Terminal / HUD' },
]

export function SettingsPage() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  return (
    <div className="mx-auto max-w-2xl py-6 px-3 flex flex-col gap-6">
      <h1 className="cork-head">Настройки</h1>

      <section className="cork-panel">
        <div className="mb-3">
          <h2 className="cork-section-title">Внешний вид</h2>
          <p className="cork-desc">Тема интерфейса</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {THEMES.map(({ value, Icon, label, description }) => {
            const active = value === theme
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className="flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors"
                style={active
                  ? { borderColor: 'var(--cork-brand)', background: 'rgba(79,70,229,0.08)' }
                  : { borderColor: 'var(--cork-border)', background: 'var(--cork-surface)' }
                }
              >
                <Icon className="w-7 h-7" style={{ color: active ? 'var(--cork-brand)' : 'var(--cork-text-dim)' }} />
                <span className="text-sm font-semibold" style={{ color: active ? 'var(--cork-brand)' : 'var(--cork-text)' }}>
                  {label}
                </span>
                <span className="text-xs" style={{ color: 'var(--cork-text-mute)' }}>{description}</span>
              </button>
            )
          })}
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