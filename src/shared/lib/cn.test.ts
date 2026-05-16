import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn (className merge)', () => {
  it('склеивает простые строки через пробел', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('пропускает falsy-значения', () => {
    expect(cn('a', false, null, undefined, 0 as unknown as string, 'b')).toBe('a b')
  })

  it('поддерживает условные объекты как clsx', () => {
    expect(cn({ a: true, b: false, c: true })).toBe('a c')
  })

  it('поддерживает массивы', () => {
    expect(cn(['a', 'b'], ['c'])).toBe('a b c')
  })

  it('твин-мердж убирает конфликтующие tailwind-классы (последний выигрывает)', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('твин-мердж разруливает text-цвет', () => {
    expect(cn('text-red-500', 'text-indigo-600')).toBe('text-indigo-600')
  })

  it('пустой вызов даёт пустую строку', () => {
    expect(cn()).toBe('')
  })
})
