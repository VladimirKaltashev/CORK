import { useThemeStore, type Theme } from '@/entities/theme'

const THEMES: { value: Theme; icon: string; label: string; description: string }[] = [
  { value: 'light',  icon: '☀️', label: 'Светлая',   description: 'Всегда светлая' },
  { value: 'dark',   icon: '🌙', label: 'Тёмная',    description: 'Всегда тёмная' },
  { value: 'system', icon: '🖥️', label: 'Системная', description: 'Как в настройках ОС' },
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

        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => {
            const active = t.value === theme
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTheme(t.value)}
                className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
                  active
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-400'
                    : 'border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-2xl leading-none">{t.icon}</span>
                <span className={`text-sm font-semibold ${active ? 'text-indigo-700 dark:text-indigo-200' : 'text-gray-900 dark:text-white'}`}>
                  {t.label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{t.description}</span>
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
