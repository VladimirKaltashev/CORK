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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Настройки</h1>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Внешний вид</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Тема интерфейса</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {THEMES.map(({ value, Icon, label, description }) => {
            const active = value === theme
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
                  active
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-400'
                    : 'border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-7 h-7 text-gray-700 dark:text-gray-200" />
                <span className={`text-sm font-semibold ${active ? 'text-indigo-700 dark:text-indigo-200' : 'text-gray-900 dark:text-white'}`}>
                  {label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{description}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Скоро</h2>
        <ul className="mt-2 text-sm text-gray-500 dark:text-gray-400 list-disc list-inside space-y-1">
          <li>Уведомления о реакциях на твои достижения</li>
          <li>Смена email и пароля</li>
          <li>Удаление аккаунта</li>
        </ul>
      </section>
    </div>
  )
}