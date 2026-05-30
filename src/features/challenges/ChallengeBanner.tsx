import { useEffect, useState } from 'react'
import { useChallengesStore } from '@/entities/challenges'
import { CategoryIcon } from '@/shared/ui'

export function ChallengeBanner() {
  const { activeChallenge, loadActiveChallenge } = useChallengesStore()
  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    loadActiveChallenge()
  }, [loadActiveChallenge])

  useEffect(() => {
    if (activeChallenge) {
      const timer = setTimeout(() => {
        const now = Date.now()
        const end = new Date(activeChallenge.endsAt).getTime()
        setDaysLeft(Math.ceil((end - now) / (1000 * 60 * 60 * 24)))
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [activeChallenge])

  if (!activeChallenge) return null

  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-4 mb-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">🏆 Идёт челлендж: {activeChallenge.title}</h2>
          <p className="text-sm text-white/90 mt-1">{activeChallenge.description}</p>
          <div className="flex gap-3 mt-2 text-sm text-white/80">
            {activeChallenge.category && (
              <span className="flex items-center gap-1">
                <CategoryIcon category={activeChallenge.category} className="w-4 h-4" />
                {activeChallenge.category}
              </span>
            )}
            <span>
              До конца: {daysLeft} дней
            </span>
            <span>Участников: {activeChallenge.participantCount ?? 0}</span>
          </div>
        </div>
        <a
          href={`/challenges/${activeChallenge.id}`}
          className="bg-white text-green-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-100 transition"
        >
          Участвовать
        </a>
      </div>
    </div>
  )
}
