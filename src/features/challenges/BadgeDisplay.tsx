import type { ChallengeBadge } from '@/shared/types'

interface BadgeDisplayProps {
  badge: ChallengeBadge
  size?: 'sm' | 'md' | 'lg'
}

const BADGE_ICONS: Record<ChallengeBadge['type'], string> = {
  king_week: '👑',
  clown_week: '🤡',
  king_month: '👑',
  clown_month: '🤡',
}

const BADGE_COLORS: Record<ChallengeBadge['type'], string> = {
  king_week: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  clown_week: 'bg-red-100 text-red-800 border-red-300',
  king_month: 'bg-amber-100 text-amber-800 border-amber-300',
  clown_month: 'bg-rose-100 text-rose-800 border-rose-300',
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
      <span>{BADGE_ICONS[badge.type]}</span>
      <span>{badge.label}</span>
    </div>
  )
}
