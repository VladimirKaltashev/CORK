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
        <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        <p className="text-gray-500 mt-4">Загрузка челленджа...</p>
      </div>
    )
  }

  const isActive = currentChallenge.status === 'active'
  const isCompleted = currentChallenge.status === 'completed'

  return (
    <div className="max-w-4xl mx-auto p-4 dark:text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{currentChallenge.title}</h1>
        <p className="text-gray-600 dark:text-gray-300">{currentChallenge.description}</p>

        <div className="flex gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
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
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' : isCompleted ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400'
            }`}
          >
            {isActive ? 'Активный' : isCompleted ? <><CheckIcon className="inline w-3 h-3 mr-1" />Завершён</> : <><HourglassIcon className="inline w-3 h-3 mr-1" />Ожидает</>}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          {isActive && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 dark:bg-gray-800 dark:border-gray-700">
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
              <p className="text-gray-500 text-center py-4 dark:text-gray-400">Пока нет доказательств</p>
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
