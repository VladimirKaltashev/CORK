import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/entities/auth'

type Board = 'kings' | 'clowns'

interface LeaderboardRow {
  user_id: string
  name: string
  avatar: string | null
  crowns: number
  clowns: number
}

const PAGE_SIZE = 50

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
}

function rankMedal(rank: number): string | null {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}

export function LeaderboardPage() {
  const { user } = useAuthStore()
  const [board, setBoard] = useState<Board>('kings')
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true)
    const scoreField = board === 'kings' ? 'crowns' : 'clowns'

    supabase
      .from('profile_scores')
      .select('user_id, name, avatar, crowns, clowns')
      .gt(scoreField, 0)
      .order(scoreField, { ascending: false })
      .limit(PAGE_SIZE)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          showToast('error', 'Не удалось загрузить рейтинг')
          setRows([])
        } else {
          setRows((data ?? []) as LeaderboardRow[])
        }
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [board])

  const scoreValue = (row: LeaderboardRow) => (board === 'kings' ? row.crowns : row.clowns)
  const scoreEmoji = board === 'kings' ? '👑' : '🤡'
  const scoreColor = board === 'kings' ? 'text-amber-700' : 'text-red-600'

  return (
    <div className="mx-auto max-w-2xl py-6 px-3">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Рейтинг</h1>
        <div className="flex rounded-md border border-gray-300 overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => setBoard('kings')}
            className={`px-3 py-1.5 transition-colors ${
              board === 'kings'
                ? 'bg-amber-500 text-white font-semibold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            👑 Короли
          </button>
          <button
            type="button"
            onClick={() => setBoard('clowns')}
            className={`px-3 py-1.5 transition-colors ${
              board === 'clowns'
                ? 'bg-red-500 text-white font-semibold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🤡 Клоуны
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {board === 'kings'
          ? 'Те, кого толпа короновала чаще всех. По сумме корон 👑 на всех достижениях.'
          : 'Те, кому больше всего прилетело клоунов. Носится с гордостью.'}
      </p>

      {isLoading ? (
        <div className="py-10 text-center text-sm text-gray-500">Загрузка...</div>
      ) : rows.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-md py-10 text-center">
          <span className="text-sm text-gray-500">
            {board === 'kings' ? 'Пока никого не короновали' : 'Пока никого не заклоунили'}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row, idx) => {
            const rank = idx + 1
            const medal = rankMedal(rank)
            const isMe = user?.id === row.user_id
            return (
              <Link
                key={row.user_id}
                to={`/profile/${row.user_id}`}
                className={`flex items-center gap-3 border rounded-md bg-white p-3 transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 ${
                  isMe ? 'border-indigo-300 ring-1 ring-indigo-200 dark:border-indigo-500 dark:ring-indigo-700' : 'border-gray-300 dark:border-gray-700'
                }`}
              >
                <div className="w-8 flex-shrink-0 text-center">
                  {medal ? (
                    <span className="text-2xl leading-none">{medal}</span>
                  ) : (
                    <span className="text-sm font-semibold text-gray-400 tabular-nums">{rank}</span>
                  )}
                </div>

                {row.avatar ? (
                  <img
                    src={row.avatar}
                    alt={row.name}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold ring-1 ring-gray-200 flex-shrink-0 select-none">
                    {getInitials(row.name)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 truncate dark:text-white">{row.name}</span>
                    {isMe && <span className="text-xs text-indigo-600 font-medium dark:text-indigo-400">это ты</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    <span>👑 <span className="tabular-nums">{row.crowns}</span></span>
                    <span>🤡 <span className="tabular-nums">{row.clowns}</span></span>
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center gap-1">
                  <span className="text-xl leading-none">{scoreEmoji}</span>
                  <span className={`text-xl font-bold tabular-nums ${scoreColor}`}>{scoreValue(row)}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
