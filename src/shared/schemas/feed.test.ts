import { describe, expect, it } from 'vitest'
import {
  createAchievementSchema,
  createPostSchema,
  createSessionSchema,
} from './feed'

describe('createSessionSchema', () => {
  const valid = { title: 'Алгебра', subject: 'Математика', date: '2025-01-01', hours: 2 }

  it('принимает валидную сессию', () => {
    expect(createSessionSchema.safeParse(valid).success).toBe(true)
  })

  it('отклоняет hours < 0.5', () => {
    expect(createSessionSchema.safeParse({ ...valid, hours: 0.1 }).success).toBe(false)
  })

  it('отклоняет hours > 24', () => {
    expect(createSessionSchema.safeParse({ ...valid, hours: 25 }).success).toBe(false)
  })

  it('отклоняет пустую дату', () => {
    expect(createSessionSchema.safeParse({ ...valid, date: '' }).success).toBe(false)
  })

  it('olympiadId опционален', () => {
    expect(createSessionSchema.safeParse({ ...valid, olympiadId: 'olymp-1' }).success).toBe(true)
  })
})

describe('createAchievementSchema', () => {
  const valid = { title: 'Диплом', description: 'Описание не короче 10 символов', place: 1, olympiadName: 'ВсОШ' }

  it('принимает валидное достижение', () => {
    expect(createAchievementSchema.safeParse(valid).success).toBe(true)
  })

  it('отклоняет description короче 10 символов', () => {
    expect(createAchievementSchema.safeParse({ ...valid, description: 'мало' }).success).toBe(false)
  })

  it('отклоняет place < 1 или > 100', () => {
    expect(createAchievementSchema.safeParse({ ...valid, place: 0 }).success).toBe(false)
    expect(createAchievementSchema.safeParse({ ...valid, place: 101 }).success).toBe(false)
  })

  it('требует целое place', () => {
    expect(createAchievementSchema.safeParse({ ...valid, place: 1.5 }).success).toBe(false)
  })
})

describe('createPostSchema', () => {
  it('принимает короткий пост', () => {
    expect(createPostSchema.safeParse({ content: 'привет' }).success).toBe(true)
  })

  it('отклоняет пустой контент', () => {
    expect(createPostSchema.safeParse({ content: '' }).success).toBe(false)
  })

  it('отклоняет > 500 символов', () => {
    expect(createPostSchema.safeParse({ content: 'a'.repeat(501) }).success).toBe(false)
  })

  it('принимает ровно 500 символов', () => {
    expect(createPostSchema.safeParse({ content: 'a'.repeat(500) }).success).toBe(true)
  })
})
