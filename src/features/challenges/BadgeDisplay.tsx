import type { ChallengeBadge } from '@/shared/types'
import { CrownIcon, ClownIcon } from '@/shared/ui'

interface BadgeDisplayProps {
  badge: ChallengeBadge
  size?: 'sm' | 'md' | 'lg'
}

const BADGE_ICON_COMPONENT: Record<ChallengeBadge['type'], React.ElementType> = {
  king_week: CrownIcon,
  clown_week: ClownIcon,
  king_month: CrownIcon,
  clown_month: ClownIcon,
}

const BADGE_COLORS: Record<ChallengeBadge['type'], string> = {
  king_week: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-600',
  clown_week: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-600',
  king_month: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-600',
  clown_month: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-600',
}

export function BadgeDisplay({ badge, size = 'md' }: BadgeDisplayProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border font-bold ${BADGE_COLORS[badge.type]} ${sizeClasses[size]}`}
      title={badge.challengeTitle ? `${badge.label} — ${badge.challengeTitle}` : badge.label}
    >
      <span>{(() => {
        const IconComponent = BADGE_ICON_COMPONENT[badge.type]
        return <IconComponent className="w-4 h-4" />
      })()}</span>
      <span>{badge.label}</span>
    </div>
  )
}
