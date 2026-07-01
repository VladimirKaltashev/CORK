import type React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { Achievement } from '@/shared/types'
import { AchievementCard } from './AchievementCard'

const mockReactionBar = vi.fn()

vi.mock('@/features/reactions', () => ({
  ReactionBar: (props: { isOwner?: boolean; compact?: boolean }) => {
    mockReactionBar(props)
    return <div>ReactionBar</div>
  },
}))

vi.mock('@primer/react', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>{children}</button>
  ),
  Label: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}))

vi.mock('@/entities/auth', () => ({
  useAuthStore: (selector?: (s: unknown) => unknown) =>
    selector
      ? selector({ user: { id: 'u1', role: 'user', name: 'u1', email: 'u1@example.com' } })
      : { user: { id: 'u1', role: 'user', name: 'u1', email: 'u1@example.com' } },
}))

vi.mock('@/entities/achievements/store', () => ({
  useAchievementsStore: () => ({ updateAchievementStatus: vi.fn() }),
}))

vi.mock('@/entities/reactions', () => ({
  useReactionsStore: (selector?: (s: unknown) => unknown) => {
    const state = { byAchievement: {} }
    return selector ? selector(state) : state
  },
}))

vi.mock('@/entities/comments', () => ({
  useCommentsStore: {
    getState: () => ({ loadCounts: vi.fn() }),
  },
}))

vi.mock('@/features/comments', () => ({
  CommentSection: () => <div>CommentSection</div>,
}))

vi.mock('@/entities/claims', () => ({
  achievementToClaim: () => ({
    type: 'self_achievement',
    subjectName: undefined,
    thread: undefined,
  }),
  isClaimVisibleOnNormalSurface: (status: string) => status === 'pending' || status === 'verified',
  ClaimBadge: () => <div>ClaimBadge</div>,
}))

vi.mock('@/shared/ui', () => ({
  CategoryIcon: () => <span>CategoryIcon</span>,
  CheckIcon: () => <span>CheckIcon</span>,
  HourglassIcon: () => <span>HourglassIcon</span>,
  CrossMarkIcon: () => <span>CrossMarkIcon</span>,
}))

describe('AchievementCard owner-vote prevention wiring', () => {
  it('passes isOwner=true to ReactionBar for own claim when vote UI enabled', () => {
    const achievement: Achievement = {
      id: 'a1',
      userId: 'u1',
      category: 'other',
      title: 't',
      description: 'd',
      year: 2026,
      proofType: 'none',
      proofValue: undefined,
      status: 'pending',
      claimAngle: 'judge',
      rejectionReason: undefined,
      meta: {},
      createdAt: '2026-06-21T00:00:00Z',
    }

    render(<AchievementCard achievement={achievement} reactionBarCompact={false} />)
    expect(mockReactionBar).toHaveBeenCalled()
    const lastCall = mockReactionBar.mock.calls[mockReactionBar.mock.calls.length - 1]?.[0]
    expect(lastCall.isOwner).toBe(true)
    expect(lastCall.compact).toBe(false)
  })

  it('passes isOwner=false to ReactionBar for other users claim', () => {
    mockReactionBar.mockClear()
    const achievement: Achievement = {
      id: 'a2',
      userId: 'u2',
      category: 'other',
      title: 't',
      description: 'd',
      year: 2026,
      proofType: 'none',
      proofValue: undefined,
      status: 'pending',
      claimAngle: 'judge',
      rejectionReason: undefined,
      meta: {},
      createdAt: '2026-06-21T00:00:00Z',
    }

    render(<AchievementCard achievement={achievement} reactionBarCompact={false} />)
    const lastCall = mockReactionBar.mock.calls[mockReactionBar.mock.calls.length - 1]?.[0]
    expect(lastCall.isOwner).toBe(false)
  })
})
