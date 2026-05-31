import { useReactionsStore, REACTION_COST } from '@/entities/reactions'
import type { ReactionKind } from '@/entities/reactions'
import { CrownIcon, ClownIcon } from '@/shared/ui'

interface ReactionBarProps {
  achievementId: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function ReactionBar({ achievementId, disabled = false, size = 'md' }: ReactionBarProps) {
  const agg = useReactionsStore((s) => s.byAchievement[achievementId])
  const pending = useReactionsStore((s) => s.pending.has(achievementId))
  const budgetRemaining = useReactionsStore((s) => s.budgetRemaining)
  const toggle = useReactionsStore((s) => s.toggle)

  const crowns = agg?.crowns ?? 0
  const clowns = agg?.clowns ?? 0
  const myKind = agg?.myKind ?? null

  const handleClick = (kind: ReactionKind) => {
    if (disabled || pending) return
    if (myKind !== kind && budgetRemaining < REACTION_COST[kind]) return
    toggle(achievementId, kind)
  }

  const isSm = size === 'sm'
  const padding = isSm ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-sm'
  const iconClass = isSm ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <div className="flex items-center gap-1.5">
      <ReactionButton
        Icon={CrownIcon}
        count={crowns}
        active={myKind === 'crown'}
        cost={1}
        disabled={disabled || pending}
        onClick={() => handleClick('crown')}
        activeClass="bg-amber-50 text-amber-700 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/60"
        iconClass={iconClass}
        padding={padding}
      />
      <ReactionButton
        Icon={ClownIcon}
        count={clowns}
        active={myKind === 'clown'}
        cost={2}
        disabled={disabled || pending}
        onClick={() => handleClick('clown')}
        activeClass="bg-red-50 text-red-700 ring-red-300 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/60"
        iconClass={iconClass}
        padding={padding}
      />
      {disabled && (
        <span className="text-xs text-gray-400 ml-1" title="Войдите, чтобы голосовать">
          Войти
        </span>
      )}
    </div>
  )
}

interface ReactionButtonProps {
  Icon: React.FC<React.SVGProps<SVGSVGElement>>
  count: number
  active: boolean
  cost: number
  disabled: boolean
  onClick: () => void
  activeClass: string
  iconClass: string
  padding: string
}

function ReactionButton({
  Icon,
  count,
  active,
  cost,
  disabled,
  onClick,
  activeClass,
  iconClass,
  padding,
}: ReactionButtonProps) {
  const base = `inline-flex items-center gap-1 rounded-full ring-1 transition-colors disabled:opacity-50 ${padding}`
  const cls = active
    ? `${base} ${activeClass}`
    : `${base} ring-gray-200 text-gray-600 hover:bg-gray-50 dark:ring-gray-600 dark:text-gray-300 dark:hover:bg-gray-700`
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cls}
      title={active ? 'Снять реакцию' : `Стоит ${cost} ${cost === 1 ? 'голос' : 'голоса'}`}
    >
      <Icon className={iconClass} />
      <span className="font-medium tabular-nums">{count}</span>
    </button>
  )
}
