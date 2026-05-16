import { describe, expect, it } from 'vitest'
import { achievementSchema } from './achievement'

const valid = {
  category: 'olympiad' as const,
  title: 'ВсОШ 1 место',
  description: 'Заключительный этап',
  year: new Date().getFullYear(),
  proofType: 'url' as const,
  proofValue: 'https://example.com',
}

describe('achievementSchema', () => {
  it('принимает валидное достижение', () => {
    expect(achievementSchema.safeParse(valid).success).toBe(true)
  })

  it('coerce строкового года в число', () => {
    const r = achievementSchema.safeParse({ ...valid, year: String(valid.year) })
    expect(r.success).toBe(true)
    if (r.success) expect(typeof r.data.year).toBe('number')
  })

  it('отклоняет пустой title', () => {
    expect(achievementSchema.safeParse({ ...valid, title: '' }).success).toBe(false)
  })

  it('отклоняет title > 100 символов', () => {
    const long = 'a'.repeat(101)
    expect(achievementSchema.safeParse({ ...valid, title: long }).success).toBe(false)
  })

  it('отклоняет description > 500 символов', () => {
    expect(achievementSchema.safeParse({ ...valid, description: 'b'.repeat(501) }).success).toBe(false)
  })

  it('отклоняет год < 2000', () => {
    expect(achievementSchema.safeParse({ ...valid, year: 1999 }).success).toBe(false)
  })

  it('отклоняет будущий год', () => {
    const next = new Date().getFullYear() + 1
    expect(achievementSchema.safeParse({ ...valid, year: next }).success).toBe(false)
  })

  it('отклоняет неизвестную категорию', () => {
    const r = achievementSchema.safeParse({ ...valid, category: 'unknown' })
    expect(r.success).toBe(false)
  })

  it('proofValue опционален', () => {
    const r = achievementSchema.safeParse({ ...valid, proofType: 'none', proofValue: undefined })
    expect(r.success).toBe(true)
  })
})
