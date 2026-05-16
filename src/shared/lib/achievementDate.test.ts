import { describe, expect, it } from 'vitest'
import { formatAchievementDate, getEventDate } from './achievementDate'

describe('getEventDate', () => {
  it('вытаскивает event_date из meta', () => {
    expect(getEventDate({ event_date: '2024-05-01' })).toBe('2024-05-01')
  })

  it('возвращает null, если meta отсутствует', () => {
    expect(getEventDate(undefined)).toBeNull()
    expect(getEventDate(null)).toBeNull()
  })

  it('возвращает null, если event_date не строка', () => {
    expect(getEventDate({ event_date: 123 } as unknown as Record<string, unknown>)).toBeNull()
    expect(getEventDate({ event_date: null })).toBeNull()
    expect(getEventDate({})).toBeNull()
  })
})

describe('formatAchievementDate', () => {
  it('форматирует валидную дату в "d MMM yyyy" с ru-локалью', () => {
    const result = formatAchievementDate('2024-05-01', 2024)
    expect(result).toMatch(/1 мая? 2024/i)
  })

  it('возвращает год, когда eventDate=null', () => {
    expect(formatAchievementDate(null, 2023)).toBe('2023')
  })

  it('падает в год при невалидной дате', () => {
    expect(formatAchievementDate('not-a-date', 2022)).toBe('2022')
  })
})
