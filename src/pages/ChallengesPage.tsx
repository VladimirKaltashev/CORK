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
    <div className="cork-shell">
      <div className="cork-main">
        <h1 className="cork-head flex items-center gap-2">
          <CupIcon className="w-6 h-6" />Челленджи
        </h1>

        {activeChallenge ? (
          <div className="mb-8">
            <h2 className="cork-title">Активный челлендж</h2>
            <ChallengeCard
              challenge={activeChallenge}
              variant="active"
              onClick={() => navigate(`/challenges/${activeChallenge.id}`)}
            />
          </div>
        ) : (
          <div className="cork-empty mb-8">
            Сейчас нет активного челленджа. Загляни позже!
          </div>
        )}

        {pastChallenges.length > 0 && (
          <div>
            <h2 className="cork-title">История</h2>
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
    </div>
  )
}
