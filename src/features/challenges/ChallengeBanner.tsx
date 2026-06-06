import { useEffect, useState } from 'react'
import { useChallengesStore } from '@/entities/challenges'
import { CategoryIcon, CupIcon } from '@/shared/ui'

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
    <div
      className="p-4 mb-6 shadow-lg"
      style={{
        borderRadius: 'var(--cork-radius-card)',
        background: 'linear-gradient(135deg, var(--cork-brand), var(--cork-brand-hover))',
        color: 'var(--cork-bg)',
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg"><CupIcon className="inline w-5 h-5 mr-1" />Идёт челлендж: {activeChallenge.title}</h2>
          <p className="text-sm mt-1" style={{ opacity: 0.9 }}>{activeChallenge.description}</p>
          <div className="flex gap-3 mt-2 text-sm" style={{ opacity: 0.8 }}>
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
          className="px-4 py-2 font-bold text-sm transition"
          style={{
            borderRadius: 'var(--cork-radius-btn)',
            background: 'var(--cork-surface)',
            color: 'var(--cork-brand)',
          }}
        >
          Участвовать
        </a>
      </div>
    </div>
  )
}
