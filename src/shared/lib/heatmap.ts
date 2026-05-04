import type { Session } from '@/entities/feed/types'

export interface HeatmapDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export function sessionsToHeatmap(
  sessions: Session[],
  year = new Date().getFullYear(),
): HeatmapDay[] {
  const byDate: Record<string, number> = {}
  for (const s of sessions) {
    if (s.date.startsWith(String(year))) {
      byDate[s.date] = (byDate[s.date] ?? 0) + s.hours
    }
  }

  const result: HeatmapDay[] = []
  const start = new Date(`${year}-01-01`)
  const end = new Date(`${year}-12-31`)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const date = d.toISOString().slice(0, 10)
    const count = byDate[date] ?? 0
    result.push({
      date,
      count,
      level: Math.min(4, Math.floor(count / 2)) as 0 | 1 | 2 | 3 | 4,
    })
  }
  return result
}
