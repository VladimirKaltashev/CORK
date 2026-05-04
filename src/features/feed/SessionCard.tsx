import type { FeedItem, Session } from '@/entities/feed/types'

type Props = Extract<FeedItem, { type: 'session' }>

const SUBJECT_COLOR: Record<string, string> = {
  'Математика': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Физика': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Информатика': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
}
const DEFAULT_COLOR = 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'

function HoursBar({ hours }: { hours: Session['hours'] }) {
  const pct = Math.min(100, (hours / 8) * 100)
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
      <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function SessionCard({ author, data, createdAt }: Props) {
  const date = new Date(createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  const subjectClass = SUBJECT_COLOR[data.subject] ?? DEFAULT_COLOR

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">📚</span>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">{author.name} · {date}</p>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{data.title}</h3>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${subjectClass}`}>
          {data.subject}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>📅 {new Date(data.date).toLocaleDateString('ru-RU')}</span>
        <span className="font-medium text-indigo-600 dark:text-indigo-400">{data.hours} ч</span>
      </div>
      <HoursBar hours={data.hours} />
    </article>
  )
}
