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
      className={`rounded-xl border-2 p-4 transition hover:shadow-md ${
        isActive ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-600' : 'border-gray-200 dark:border-gray-700'
      } ${variant === 'active' ? 'col-span-full' : ''} cursor-pointer dark:bg-gray-800`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-lg">{challenge.title}</h3>
          <p className="text-sm text-gray-600 mt-1 dark:text-gray-300">{challenge.description}</p>
        </div>
        <span className="px-2 py-1 rounded-full text-xs font-bold">
          {isActive ? 'Активный' : isCompleted ? <><CheckIcon className="inline w-3 h-3 mr-1" />Завершён</> : <><HourglassIcon className="inline w-3 h-3 mr-1" />Ожидает</>}
        </span>
      </div>

      <div className="flex gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
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
          <span className="text-sm text-gray-600 dark:text-gray-400">
            С {new Date(challenge.startsAt).toLocaleDateString('ru')} по{' '}
            {new Date(challenge.endsAt).toLocaleDateString('ru')}
          </span>
        </div>
      )}
    </div>
  )
}
