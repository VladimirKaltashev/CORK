import { BooksIcon, CalendarIcon } from '@/shared/ui'
import type { FeedItem, Session } from '@/entities/feed/types'

type Props = Extract<FeedItem, { type: 'session' }>

const SUBJECT_COLOR: Record<string, React.CSSProperties> = {
  'Математика': { background: 'rgba(59,130,246,0.15)', color: '#2563eb' },
  'Физика': { background: 'rgba(34,197,94,0.15)', color: '#16a34a' },
  'Информатика': { background: 'rgba(168,85,247,0.15)', color: '#9333ea' },
}
const DEFAULT_COLOR: React.CSSProperties = { background: 'var(--cork-surface-3)', color: 'var(--cork-text-dim)' }

function HoursBar({ hours }: { hours: Session['hours'] }) {
  const pct = Math.min(100, (hours / 8) * 100)
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--cork-surface-3)' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--cork-brand)' }} />
    </div>
  )
}

export function SessionCard({ author, data, createdAt }: Props) {
  const date = new Date(createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  const subjectStyle = SUBJECT_COLOR[data.subject] ?? DEFAULT_COLOR

  return (
    <article className="cork-card" style={{ padding: '16px' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <BooksIcon className="w-5 h-5" style={{ color: 'var(--cork-text-dim)' }} />
          <div>
            <p className="text-xs" style={{ color: 'var(--cork-text-mute)' }}>{author.name} · {date}</p>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--cork-text)' }}>{data.title}</h3>
          </div>
        </div>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium" style={subjectStyle}>
          {data.subject}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs" style={{ color: 'var(--cork-text-dim)' }}>
        <span className="inline-flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5" /> {new Date(data.date).toLocaleDateString('ru-RU')}</span>
        <span className="font-medium" style={{ color: 'var(--cork-brand)' }}>{data.hours} ч</span>
      </div>
      <HoursBar hours={data.hours} />
    </article>
  )
}
