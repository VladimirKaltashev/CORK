import { useEffect } from 'react'
import { useChallengesStore } from '@/entities/challenges'

export function ChallengeLeaderboard() {
  const { currentChallenge, leaderboard, loadLeaderboard, isLoading } = useChallengesStore()

  useEffect(() => {
    if (currentChallenge?.id) {
      loadLeaderboard(currentChallenge.id)
    }
  }, [currentChallenge?.id, loadLeaderboard])

  if (isLoading) return <div className="text-center py-4">Загрузка лидерборда...</div>
  if (!leaderboard.length) return <div className="text-center py-4 text-gray-500">Пока нет участников</div>

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <h3 className="font-bold text-lg px-4 py-3 bg-gray-50 border-b">🏆 Лидерборд</h3>
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-gray-500">
            <th className="px-4 py-2 w-12">#</th>
            <th className="px-4 py-2">Игрок</th>
            <th className="px-4 py-2 text-right">Прогресс</th>
            <th className="px-4 py-2 text-right">Сабмитов</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((row, index) => (
            <tr key={row.userId} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2 font-bold">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
              </td>
              <td className="px-4 py-2">{row.userName}</td>
              <td className="px-4 py-2 text-right font-bold">{row.totalProgress}</td>
              <td className="px-4 py-2 text-right text-gray-500">{row.submissionCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
