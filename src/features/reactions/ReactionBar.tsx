import { useReactionsStore } from '@/entities/reactions'
import type { ReactionKind } from '@/entities/reactions'

interface ReactionBarProps {
  achievementId: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function ReactionBar({ achievementId, disabled = false, size = 'md' }: ReactionBarProps) {
  const agg = useReactionsStore((s) => s.byAchievement[achievementId])
  const pending = useReactionsStore((s) => s.pending.has(achievementId))
  const toggle = useReactionsStore((s) => s.toggle)

  const crowns = agg?.crowns ?? 0
  const clowns = agg?.clowns ?? 0
  const myKind = agg?.myKind ?? null

  const handleClick = (kind: ReactionKind) => {
    if (disabled || pending) return
    toggle(achievementId, kind)
  }

  const isSm = size === 'sm'
  const padding = isSm ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-sm'
  const emoji = isSm ? 'text-base' : 'text-lg'

  return (
    <div className="flex items-center gap-1.5">
      <ReactionButton
        emoji="👑"
        count={crowns}
        active={myKind === 'crown'}
        cost={1}
        disabled={disabled || pending}
        onClick={() => handleClick('crown')}
        activeClass="bg-amber-50 text-amber-700 ring-amber-300"
        emojiClass={emoji}
        padding={padding}
      />
      <ReactionButton
        emoji="🤡"
        count={clowns}
        active={myKind === 'clown'}
        cost={2}
        disabled={disabled || pending}
        onClick={() => handleClick('clown')}
        activeClass="bg-red-50 text-red-700 ring-red-300"
        emojiClass={emoji}
        padding={padding}
      />
    </div>
  )
}

interface ReactionButtonProps {
  emoji: string
  count: number
  active: boolean
  cost: number
  disabled: boolean
  onClick: () => void
  activeClass: string
  emojiClass: string
  padding: string
}

function ReactionButton({
  emoji,
  count,
  active,
  cost,
  disabled,
  onClick,
  activeClass,
  emojiClass,
  padding,
}: ReactionButtonProps) {
  const base = `inline-flex items-center gap-1 rounded-full ring-1 transition-colors disabled:opacity-50 ${padding}`
  const cls = active
    ? `${base} ${activeClass}`
    : `${base} ring-gray-200 text-gray-600 hover:bg-gray-50`
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cls}
      title={active ? 'Снять реакцию' : `Стоит ${cost} ${cost === 1 ? 'голос' : 'голоса'}`}
    >
      <span className={emojiClass}>{emoji}</span>
      <span className="font-medium tabular-nums">{count}</span>
    </button>
  )
}
