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

  const total = crowns + clowns
  const kingPct = total === 0 ? 50 : (crowns / total) * 100
  const clownPct = total === 0 ? 50 : (clowns / total) * 100

  return (
    <div className="flex flex-col gap-2">
      {/* Verdict bar */}
      <div className="cork-verdict-bar">
        <div className="cork-verdict-track" style={{ height: isSm ? '28px' : '36px' }}>
          {crowns > 0 && (
            <div className="cork-verdict-king" style={{ width: `${kingPct}%` }}>
              <span className="flex items-center gap-1">
                <CrownIcon className={isSm ? 'w-3 h-3' : 'w-4 h-4'} />
                {crowns}
              </span>
            </div>
          )}
          {clowns > 0 && (
            <div className="cork-verdict-clown" style={{ width: `${clownPct}%`, marginLeft: crowns > 0 ? 'auto' : undefined }}>
              <span className="flex items-center gap-1">
                {clowns}
                <ClownIcon className={isSm ? 'w-3 h-3' : 'w-4 h-4'} />
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-1.5">
        <ReactionButton
          Icon={CrownIcon}
          count={crowns}
          active={myKind === 'crown'}
          cost={1}
          disabled={disabled || pending}
          onClick={() => handleClick('crown')}
          kind="crown"
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
          kind="clown"
          iconClass={iconClass}
          padding={padding}
        />
        {disabled && (
          <span className="text-xs ml-1" style={{ color: 'var(--cork-text-mute)' }} title="Войдите, чтобы голосовать">
            Войти
          </span>
        )}
      </div>
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
  kind: 'crown' | 'clown'
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
  kind,
  iconClass,
  padding,
}: ReactionButtonProps) {
  const base = `inline-flex items-center gap-1 ring-1 transition-colors disabled:opacity-50 ${padding}`
  const activeStyle = active
    ? {
        background: kind === 'crown' ? 'rgba(198, 255, 61, 0.15)' : 'rgba(255, 45, 120, 0.15)',
        color: kind === 'crown' ? 'var(--cork-king)' : 'var(--cork-clown)',
        borderColor: kind === 'crown' ? 'var(--cork-king)' : 'var(--cork-clown)',
        ring: kind === 'crown' ? 'var(--cork-king)' : 'var(--cork-clown)',
      }
    : {
        background: 'transparent',
        color: 'var(--cork-text-dim)',
        borderColor: 'var(--cork-border-light)',
        ring: 'var(--cork-border-light)',
      }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={base}
      style={{
        borderRadius: 'var(--cork-radius-pill)',
        background: activeStyle.background,
        color: activeStyle.color,
        '--tw-ring-color': activeStyle.ring,
      } as React.CSSProperties}
      title={active ? 'Снять реакцию' : `Стоит ${cost} ${cost === 1 ? 'голос' : 'голоса'}`}
    >
      <Icon className={iconClass} />
      <span className="font-medium tabular-nums">{count}</span>
    </button>
  )
}
