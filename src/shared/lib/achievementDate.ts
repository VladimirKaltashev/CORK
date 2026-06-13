import { format, parse } from 'date-fns'
import { ru } from 'date-fns/locale'

export function getEventDate(meta: Record<string, unknown> | undefined | null): string | null {
  if (!meta) return null
  const ed = meta.event_date
  return typeof ed === 'string' ? ed : null
}

export function formatAchievementDate(eventDate: string | null, year: number): string {
  if (eventDate) {
    try {
      const date = parse(eventDate, 'yyyy-MM-dd', new Date())
      return format(date, 'd MMM yyyy', { locale: ru })
    } catch {
      return String(year)
    }
  }
  return String(year)
}
