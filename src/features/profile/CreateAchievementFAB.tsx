import { useAuthStore } from '@/entities/auth'
import { useCreateAchievementDialog } from '@/entities/achievements/createDialog'

export function CreateAchievementFAB() {
  const { token } = useAuthStore()
  const open = useCreateAchievementDialog((s) => s.open)
  const isOpen = useCreateAchievementDialog((s) => s.isOpen)

  if (!token || isOpen) return null

  return (
    <button
      type="button"
      onClick={open}
      title="Добавить достижение"
      aria-label="Добавить достижение"
      className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-100 transition-transform hover:scale-105 hover:bg-indigo-700 active:scale-95"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  )
}
