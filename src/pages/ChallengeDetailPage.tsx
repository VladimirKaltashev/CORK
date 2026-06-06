import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useChallengesStore } from '@/entities/challenges'
import {
  ChallengeLeaderboard,
  SubmissionForm,
  SubmissionCard,
} from '@/features/challenges'
import { CategoryIcon, CheckIcon, HourglassIcon } from '@/shared/ui'

export function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const {
    currentChallenge,
    submissions,
    loadChallenge,
    loadSubmissions,
    submitProgress,
  } = useChallengesStore()

  useEffect(() => {
    if (id) {
      loadChallenge(id)
      loadSubmissions(id)
    }
  }, [id, loadChallenge, loadSubmissions])

  if (!currentChallenge) {
    return (
      <div className="max-w-4xl mx-auto p-4 text-center">
        <div className="cork-skeleton h-4 rounded w-1/2 mx-auto"></div>
        <p className="mt-4" style={{ color: 'var(--cork-text-mute)' }}>Загрузка челленджа...</p>
      </div>
    )
  }

  const isActive = currentChallenge.status === 'active'
  const isCompleted = currentChallenge.status === 'completed'

  const statusStyle = isActive
    ? { background: 'rgba(34,197,94,0.15)', color: 'var(--cork-king)' }
    : isCompleted
      ? { background: 'var(--cork-surface-3)', color: 'var(--cork-text-dim)' }
      : { background: 'rgba(234,179,8,0.15)', color: '#d97706' }

  return (
    <div className="max-w-4xl mx-auto p-4" style={{ color: 'var(--cork-text)' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{currentChallenge.title}</h1>
        <p style={{ color: 'var(--cork-text-dim)' }}>{currentChallenge.description}</p>

        <div className="flex gap-4 mt-3 text-sm" style={{ color: 'var(--cork-text-dim)' }}>
          {currentChallenge.category && (
            <span className="flex items-center gap-1">
              <CategoryIcon category={currentChallenge.category} className="w-4 h-4" />
              {currentChallenge.category}
            </span>
          )}
          <span>
            С {new Date(currentChallenge.startsAt).toLocaleDateString('ru')} по{' '}
            {new Date(currentChallenge.endsAt).toLocaleDateString('ru')}
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={statusStyle}
          >
            {isActive ? 'Активный' : isCompleted ? <><CheckIcon className="inline w-3 h-3 mr-1" />Завершён</> : <><HourglassIcon className="inline w-3 h-3 mr-1" />Ожидает</>}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          {isActive && (
            <div className="cork-card mb-6">
              <SubmissionForm
                proofConfig={currentChallenge.proofConfig}
                onSubmit={async (data) => {
                  if (id) await submitProgress(id, data)
                }}
              />
            </div>
          )}

          <div>
            <h3 className="font-bold text-lg mb-3">Сабмиты</h3>
            {submissions.length === 0 ? (
              <p className="text-center py-4" style={{ color: 'var(--cork-text-dim)' }}>Пока нет доказательств</p>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <SubmissionCard key={sub.id} submission={sub} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <ChallengeLeaderboard />
        </div>
      </div>
    </div>
  )
}
