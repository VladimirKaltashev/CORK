import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema } from './auth'

describe('loginSchema', () => {
  it('принимает валидные email и пароль ≥ 6', () => {
    const r = loginSchema.safeParse({ email: 'a@b.ru', password: '123456' })
    expect(r.success).toBe(true)
  })

  it('отклоняет некорректный email', () => {
    const r = loginSchema.safeParse({ email: 'not-an-email', password: '123456' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message === 'Некорректный email')).toBe(true)
    }
  })

  it('отклоняет короткий пароль', () => {
    const r = loginSchema.safeParse({ email: 'a@b.ru', password: '12345' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message === 'Минимум 6 символов')).toBe(true)
    }
  })
})

describe('registerSchema', () => {
  const valid = {
    name: 'Ivan',
    email: 'i@b.ru',
    password: '123456',
    confirmPassword: '123456',
  }

  it('принимает валидные данные', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('отклоняет, если пароли не совпадают', () => {
    const r = registerSchema.safeParse({ ...valid, confirmPassword: '999999' })
    expect(r.success).toBe(false)
    if (!r.success) {
      const issue = r.error.issues.find((i) => i.path.includes('confirmPassword'))
      expect(issue?.message).toBe('Пароли не совпадают')
    }
  })

  it('отклоняет имя короче 2 символов', () => {
    const r = registerSchema.safeParse({ ...valid, name: 'I' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message === 'Минимум 2 символа')).toBe(true)
    }
  })

  it('отклоняет невалидный email', () => {
    expect(registerSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false)
  })
})
