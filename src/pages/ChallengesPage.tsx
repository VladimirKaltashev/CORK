import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChallengesStore } from '@/entities/challenges'
import { ChallengeCard } from '@/features/challenges'
import { CupIcon } from '@/shared/ui'


export function ChallengesPage() {
  const navigate = useNavigate()
  const { challenges, loadChallenges } = useChallengesStore()

  useEffect(() => {
    loadChallenges()
  }, [loadChallenges])

  const activeChallenge = challenges.find((c) => c.status === 'active')
  const pastChallenges = challenges.filter((c) => c.status !== 'active')

  return (
    <div className="max-w-4xl mx-auto p-4 dark:text-white">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <CupIcon className="w-6 h-6" />Челленджи
      </h1>

      {activeChallenge ? (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-green-700 dark:text-green-400">Активный челлендж</h2>
          <ChallengeCard
            challenge={activeChallenge}
            variant="active"
            onClick={() => navigate(`/challenges/${activeChallenge.id}`)}
          />
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-6 text-center mb-8 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">Сейчас нет активного челленджа. Загляни позже!</p>
        </div>
      )}

      {pastChallenges.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">История</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pastChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onClick={() => navigate(`/challenges/${challenge.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
