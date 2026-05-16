import { describe, expect, it } from 'vitest'
import { hasMinRole } from './permissions'

describe('hasMinRole', () => {
  it('admin покрывает все роли', () => {
    expect(hasMinRole('admin', 'user')).toBe(true)
    expect(hasMinRole('admin', 'teacher')).toBe(true)
    expect(hasMinRole('admin', 'moderator')).toBe(true)
    expect(hasMinRole('admin', 'admin')).toBe(true)
  })

  it('user не имеет прав модератора/админа', () => {
    expect(hasMinRole('user', 'moderator')).toBe(false)
    expect(hasMinRole('user', 'admin')).toBe(false)
    expect(hasMinRole('user', 'teacher')).toBe(false)
  })

  it('user покрывает минимум "user"', () => {
    expect(hasMinRole('user', 'user')).toBe(true)
  })

  it('teacher и moderator на одном уровне (rank=2)', () => {
    expect(hasMinRole('teacher', 'moderator')).toBe(true)
    expect(hasMinRole('moderator', 'teacher')).toBe(true)
    expect(hasMinRole('teacher', 'admin')).toBe(false)
    expect(hasMinRole('moderator', 'admin')).toBe(false)
  })

  it('teacher выше user', () => {
    expect(hasMinRole('teacher', 'user')).toBe(true)
    expect(hasMinRole('user', 'teacher')).toBe(false)
  })
})
