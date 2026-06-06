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

  const lowStyle =
    remaining === 0
      ? { color: 'var(--cork-clown)', background: 'rgba(255, 45, 120, 0.1)', ring: 'var(--cork-clown)' }
      : remaining <= 2
        ? { color: 'var(--cork-brand-2)', background: 'rgba(198, 255, 61, 0.1)', ring: 'var(--cork-brand-2)' }
        : { color: 'var(--cork-text)', background: 'var(--cork-surface-3)', ring: 'var(--cork-border-light)' }

  if (variant === 'compact') {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium ring-1"
        style={{
          borderRadius: 'var(--cork-radius-pill)',
          color: lowStyle.color,
          background: lowStyle.background,
          '--tw-ring-color': lowStyle.ring,
        } as React.CSSProperties}
        title="Осталось голосов на этой неделе (сброс в понедельник)"
      >
        <span className="text-sm leading-none">⭐</span>
        <span className="tabular-nums">{remaining}/10</span>
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-between gap-3 px-3 py-2 ring-1"
      style={{
        borderRadius: 'var(--cork-radius-card)',
        color: lowStyle.color,
        background: lowStyle.background,
        '--tw-ring-color': lowStyle.ring,
      } as React.CSSProperties}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg leading-none">⭐</span>
        <span className="text-sm font-medium">Осталось голосов: {remaining} из 10</span>
      </div>
      <span className="text-xs" style={{ opacity: 0.7 }}>Сброс в понедельник</span>
    </div>
  )
}
