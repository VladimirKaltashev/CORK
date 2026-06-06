import type { Challenge } from '@/shared/types'
import { CategoryIcon, CheckIcon, HourglassIcon } from '@/shared/ui'

interface ChallengeCardProps {
  challenge: Challenge
  variant?: 'active' | 'compact'
  onClick?: () => void
}

export function ChallengeCard({ challenge, variant = 'compact', onClick }: ChallengeCardProps) {
  const isActive = challenge.status === 'active'
  const isCompleted = challenge.status === 'completed'

  return (
    <div
      className={`cork-card ${variant === 'active' ? 'col-span-full' : ''} cursor-pointer ${
        isActive ? 'border-[var(--cork-brand)]' : ''
      }`}
      style={isActive ? { borderColor: 'var(--cork-brand)', boxShadow: '0 0 20px -4px var(--cork-glow)' } : undefined}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="cork-title">{challenge.title}</h3>
          <p className="cork-desc">{challenge.description}</p>
        </div>
        <span className="cork-tag">
          {isActive ? 'Активный' : isCompleted ? <><CheckIcon className="inline w-3 h-3 mr-1" />Завершён</> : <><HourglassIcon className="inline w-3 h-3 mr-1" />Ожидает</>}
        </span>
      </div>

      <div className="flex gap-4 mt-3 cork-meta">
        {challenge.category && (
          <span className="flex items-center gap-1">
              <CategoryIcon category={challenge.category} className="w-4 h-4" />
            {challenge.category}
          </span>
        )}
        {challenge.unit && (
          <span>Цель: {challenge.goalType} ({challenge.unit})</span>
        )}
        <span>Участников: {challenge.participantCount ?? 0}</span>
      </div>

      {variant === 'active' && (
        <div className="mt-3 flex gap-2">
          <span className="cork-meta">
            С {new Date(challenge.startsAt).toLocaleDateString('ru')} по{' '}
            {new Date(challenge.endsAt).toLocaleDateString('ru')}
          </span>
        </div>
      )}
    </div>
  )
}
