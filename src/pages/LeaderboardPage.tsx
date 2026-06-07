import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/entities/auth'
import { CrownIcon, ClownIcon } from '@/shared/ui'

type Board = 'kings' | 'clowns' | 'scouts'

interface LeaderboardRow {
  user_id: string
  name: string
  avatar: string | null
  crowns: number
  clowns: number
  scout_score?: number
  submitted_count?: number
  comments_brought?: number
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

    const load = async () => {
      if (board === 'scouts') {
        const { data, error } = await supabase
          .from('scout_scores')
          .select('user_id, user_name, avatar, scout_score, submitted_count, crowns_brought, clowns_brought, comments_brought')
          .gt('scout_score', 0)
          .order('scout_score', { ascending: false })
          .limit(PAGE_SIZE)
        if (cancelled) return
        if (error) {
          showToast('error', 'Не удалось загрузить рейтинг')
          setRows([])
        } else {
          setRows((data ?? []).map((r) => ({
            user_id: r.user_id,
            name: r.user_name,
            avatar: r.avatar,
            crowns: r.crowns_brought ?? 0,
            clowns: r.clowns_brought ?? 0,
            scout_score: r.scout_score ?? 0,
            submitted_count: r.submitted_count ?? 0,
            comments_brought: r.comments_brought ?? 0,
          })))
        }
      } else {
        const scoreField = board === 'kings' ? 'crowns' : 'clowns'
        const { data, error } = await supabase
          .from('profile_scores')
          .select('user_id, name, avatar, crowns, clowns')
          .gt(scoreField, 0)
          .order(scoreField, { ascending: false })
          .limit(PAGE_SIZE)
        if (cancelled) return
        if (error) {
          showToast('error', 'Не удалось загрузить рейтинг')
          setRows([])
        } else {
          setRows((data ?? []) as LeaderboardRow[])
        }
      }
      setIsLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [board])

  const scoreValue = (row: LeaderboardRow) => {
    if (board === 'scouts') return row.scout_score ?? 0
    return board === 'kings' ? row.crowns : row.clowns
  }
  const ScoreIcon = board === 'kings' ? CrownIcon : board === 'clowns' ? ClownIcon : () => <span>🔍</span>
  const scoreColor = board === 'kings' ? 'var(--cork-king)' : board === 'clowns' ? 'var(--cork-clown)' : 'var(--cork-brand)'

  return (
    <div className="mx-auto max-w-2xl py-6 px-3">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--cork-text)' }}>Рейтинг</h1>
        <div className="cork-tabs">
          <button
            type="button"
            onClick={() => setBoard('kings')}
            className={`cork-tab inline-flex items-center gap-1.5 ${board === 'kings' ? 'active' : ''}`}
            style={board === 'kings' ? { background: 'var(--cork-king)', color: 'var(--cork-brand-ink)', borderColor: 'transparent' } : {}}
          >
            <CrownIcon className="w-4 h-4" />
            Короли
          </button>
          <button
            type="button"
            onClick={() => setBoard('clowns')}
            className={`cork-tab inline-flex items-center gap-1.5 ${board === 'clowns' ? 'active' : ''}`}
            style={board === 'clowns' ? { background: 'var(--cork-clown)', color: 'var(--cork-brand-ink)', borderColor: 'transparent' } : {}}
          >
            <ClownIcon className="w-4 h-4" />
            Клоуны
          </button>
          <button
            type="button"
            onClick={() => setBoard('scouts')}
            className={`cork-tab inline-flex items-center gap-1.5 ${board === 'scouts' ? 'active' : ''}`}
            style={board === 'scouts' ? { background: 'var(--cork-brand)', color: 'var(--cork-brand-ink)', borderColor: 'transparent' } : {}}
          >
            <span>🔍</span>
            Скауты
          </button>
        </div>
      </div>

      <p className="text-sm mb-4" style={{ color: 'var(--cork-text-dim)' }}>
        {board === 'kings'
          ? 'Те, кого толпа короновала чаще всех. По сумме корон на всех достижениях.'
          : board === 'clowns'
            ? 'Те, кому больше всего прилетело клоунов. Носится с гордостью.'
            : 'Те, кто принёс на суд заявки, собравшие реакции и аргументы.'}
      </p>

      {isLoading ? (
        <div className="py-10 text-center text-sm" style={{ color: 'var(--cork-text-mute)' }}>Загрузка...</div>
      ) : rows.length === 0 ? (
        <div className="cork-empty">
          <span className="text-sm">
            {board === 'kings' ? 'Пока никого не короновали' : board === 'clowns' ? 'Пока никого не заклоунили' : 'Скаутов пока нет. Принеси первую заявку на суд.'}
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
                className={`cork-user-card transition-colors ${isMe ? 'ring-1' : ''}`}
                style={isMe ? { borderColor: 'var(--cork-brand)', boxShadow: '0 0 0 1px var(--cork-brand)' } : {}}
              >
                <div className="w-8 flex-shrink-0 text-center">
                  {medal ? (
                    <span className="text-2xl leading-none">{medal}</span>
                  ) : (
                    <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--cork-text-mute)' }}>{rank}</span>
                  )}
                </div>

                {row.avatar ? (
                  <img
                    src={row.avatar}
                    alt={row.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    style={{ boxShadow: '0 0 0 1px var(--cork-border)' }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 select-none cork-avatar" style={{ background: 'var(--cork-brand-2)', color: 'var(--cork-text)' }}>
                    {getInitials(row.name)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--cork-text)' }}>{row.name}</span>
                    {isMe && <span className="text-xs font-medium" style={{ color: 'var(--cork-brand)' }}>это ты</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: 'var(--cork-text-mute)' }}>
                    {board === 'scouts' ? (
                      <>
                        <span className="tabular-nums">{row.submitted_count} принесено</span>
                        <span className="tabular-nums">👑 {row.crowns}</span>
                        <span className="tabular-nums">🤡 {row.clowns}</span>
                        <span className="tabular-nums">💬 {row.comments_brought}</span>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1"><CrownIcon className="w-3.5 h-3.5" /><span className="tabular-nums">{row.crowns}</span></span>
                        <span className="inline-flex items-center gap-1"><ClownIcon className="w-3.5 h-3.5" /><span className="tabular-nums">{row.clowns}</span></span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center gap-1">
                  {board !== 'scouts' && <ScoreIcon className="w-6 h-6" />}
                  <span className="text-xl font-bold tabular-nums" style={{ color: scoreColor }}>{scoreValue(row)}</span>
                  {board === 'scouts' && <span className="text-xs font-medium" style={{ color: 'var(--cork-text-mute)' }}>очков</span>}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
