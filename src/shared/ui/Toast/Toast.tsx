import { useToastStore, type Toast as ToastItem } from '@/shared/lib/toast'

const STYLES: Record<ToastItem['type'], string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
}

const ICONS: Record<ToastItem['type'], string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
}

export function ToastContainer() {
  const { toasts, remove } = useToastStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-white shadow-lg ${STYLES[toast.type]} animate-in fade-in slide-in-from-right-4 min-w-64 max-w-sm`}
        >
          <span className="text-base font-bold">{ICONS[toast.type]}</span>
          <span className="flex-1 text-sm">{toast.message}</span>
          <button
            type="button"
            onClick={() => remove(toast.id)}
            className="ml-2 text-white/70 hover:text-white"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
