import { useEffect } from 'react'
import { useChallengesStore } from '@/entities/challenges'
import { useAuthStore } from '@/entities/auth'
import { CupIcon } from '@/shared/ui'

export function ChallengeLeaderboard() {
  const { currentChallenge, leaderboard, loadLeaderboard, isLoading } = useChallengesStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (currentChallenge?.id) {
      loadLeaderboard(currentChallenge.id)
    }
  }, [currentChallenge?.id, loadLeaderboard])

  if (isLoading) return <div className="text-center py-4" style={{ color: 'var(--cork-text-mute)' }}>Загрузка лидерборда...</div>
  if (!leaderboard.length) return <div className="text-center py-4" style={{ color: 'var(--cork-text-mute)' }}>Пока нет участников</div>

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--cork-surface)', border: '1px solid var(--cork-border)' }}>
      <h3 className="font-bold text-lg px-4 py-3 border-b flex items-center gap-2" style={{ background: 'var(--cork-surface-2)', borderColor: 'var(--cork-border)', color: 'var(--cork-text)' }}><CupIcon className="w-5 h-5" />Лидерборд</h3>
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm" style={{ color: 'var(--cork-text-dim)' }}>
            <th className="px-4 py-2 w-12">#</th>
            <th className="px-4 py-2">Игрок</th>
            <th className="px-4 py-2 text-right">Прогресс</th>
            <th className="px-4 py-2 text-right">Сабмитов</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((row, index) => (
            <tr key={row.userId} className="border-t transition-colors" style={{ borderColor: 'var(--cork-border-light)' }}>
              <td className="px-4 py-2 font-bold">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
              </td>
              <td className="px-4 py-2">{row.userId === user?.id ? 'Вы' : row.userName}</td>
              <td className="px-4 py-2 text-right font-bold">{row.totalProgress}</td>
              <td className="px-4 py-2 text-right" style={{ color: 'var(--cork-text-mute)' }}>{row.submissionCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
