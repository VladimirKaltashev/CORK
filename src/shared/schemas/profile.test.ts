import { describe, expect, it } from 'vitest'
import { updateProfileSchema } from './profile'

describe('updateProfileSchema', () => {
  it('принимает минимально валидное обновление', () => {
    expect(updateProfileSchema.safeParse({ name: 'Иван' }).success).toBe(true)
  })

  it('принимает полный набор полей', () => {
    const r = updateProfileSchema.safeParse({
      name: 'Иван',
      avatar: 'data:image/png;base64,...',
      goal: 'Стать королём',
    })
    expect(r.success).toBe(true)
  })

  it('avatar может быть null', () => {
    expect(updateProfileSchema.safeParse({ name: 'Иван', avatar: null }).success).toBe(true)
  })

  it('отклоняет имя короче 2 символов', () => {
    expect(updateProfileSchema.safeParse({ name: 'И' }).success).toBe(false)
  })

  it('отклоняет goal длиннее 200 символов', () => {
    expect(updateProfileSchema.safeParse({ name: 'Иван', goal: 'a'.repeat(201) }).success).toBe(false)
  })
})
