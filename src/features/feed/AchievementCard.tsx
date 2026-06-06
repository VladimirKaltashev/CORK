import type { FeedItem } from '@/entities/feed/types'

type Props = Extract<FeedItem, { type: 'achievement' }>

const PLACE_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
const PLACE_COLOR: Record<number, string> = {
  1: '#fbbf24',
  2: '#9ca3af',
  3: '#b45309',
}

export function AchievementCard({ author, data, createdAt }: Props) {
  const date = new Date(createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  const medal = PLACE_MEDAL[data.place] ?? '🏅'
  const borderColor = PLACE_COLOR[data.place] ?? 'var(--cork-brand)'

  return (
    <article className="cork-card" style={{ padding: '16px', borderLeft: `4px solid ${borderColor}` }}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{medal}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs" style={{ color: 'var(--cork-text-mute)' }}>{author.name} · {date}</p>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--cork-text)' }}>{data.title}</h3>
          <p className="mt-1 text-xs" style={{ color: 'var(--cork-text-dim)' }}>{data.description}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: 'var(--cork-surface-3)', color: 'var(--cork-brand)' }}>
              {data.olympiadName}
            </span>
            <span className="text-xs" style={{ color: 'var(--cork-text-dim)' }}>{data.place} место</span>
          </div>
        </div>
      </div>
    </article>
  )
}
