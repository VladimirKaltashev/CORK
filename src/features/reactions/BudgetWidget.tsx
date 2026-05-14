import { useEffect } from 'react'
import { useReactionsStore } from '@/entities/reactions'
import { useAuthStore } from '@/entities/auth'

interface BudgetWidgetProps {
  variant?: 'compact' | 'full'
}

export function BudgetWidget({ variant = 'compact' }: BudgetWidgetProps) {
  const { token } = useAuthStore()
  const remaining = useReactionsStore((s) => s.budgetRemaining)
  const loaded = useReactionsStore((s) => s.budgetLoaded)
  const loadBudget = useReactionsStore((s) => s.loadBudget)

  useEffect(() => {
    if (token && !loaded) {
      loadBudget()
    }
  }, [token, loaded, loadBudget])

  if (!token) return null

  const lowColor =
    remaining === 0 ? 'text-red-600 bg-red-50 ring-red-200'
    : remaining <= 2 ? 'text-amber-700 bg-amber-50 ring-amber-200'
    : 'text-gray-700 bg-gray-50 ring-gray-200'

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${lowColor}`}
        title="Осталось голосов на этой неделе (сброс в понедельник)"
      >
        <span className="text-sm leading-none">⭐</span>
        <span className="tabular-nums">{remaining}/10</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 ring-1 ${lowColor}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg leading-none">⭐</span>
        <span className="text-sm font-medium">Осталось голосов: {remaining} из 10</span>
      </div>
      <span className="text-xs opacity-70">Сброс в понедельник</span>
    </div>
  )
}
