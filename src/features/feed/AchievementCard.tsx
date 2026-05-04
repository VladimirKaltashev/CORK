import type { FeedItem } from '@/entities/feed/types'

type Props = Extract<FeedItem, { type: 'achievement' }>

const PLACE_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
const PLACE_COLOR: Record<number, string> = {
  1: 'border-yellow-400 dark:border-yellow-500',
  2: 'border-gray-400 dark:border-gray-500',
  3: 'border-amber-700 dark:border-amber-600',
}

export function AchievementCard({ author, data, createdAt }: Props) {
  const date = new Date(createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  const medal = PLACE_MEDAL[data.place] ?? '🏅'
  const borderClass = PLACE_COLOR[data.place] ?? 'border-indigo-400'

  return (
    <article className={`rounded-xl border-l-4 bg-white p-4 shadow-sm ${borderClass} border border-gray-200 dark:border-gray-700 dark:bg-gray-800`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{medal}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-400 dark:text-gray-500">{author.name} · {date}</p>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{data.title}</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{data.description}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
              {data.olympiadName}
            </span>
            <span className="text-xs text-gray-500">{data.place} место</span>
          </div>
        </div>
      </div>
    </article>
  )
}
