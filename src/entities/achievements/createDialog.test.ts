import { describe, expect, it } from 'vitest'
import { useCreateAchievementDialog } from './createDialog'

describe('useCreateAchievementDialog', () => {
  it('starts closed', () => {
    expect(useCreateAchievementDialog.getState().isOpen).toBe(false)
  })

  it('open sets isOpen to true', () => {
    useCreateAchievementDialog.getState().open()
    expect(useCreateAchievementDialog.getState().isOpen).toBe(true)
  })

  it('close sets isOpen to false', () => {
    useCreateAchievementDialog.getState().open()
    useCreateAchievementDialog.getState().close()
    expect(useCreateAchievementDialog.getState().isOpen).toBe(false)
  })
})
