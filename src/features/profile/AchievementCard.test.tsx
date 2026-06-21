import type React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AchievementCard } from './AchievementCard'
import type { Achievement } from '@/shared/types'

vi.mock('@primer/react', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>{children}</button>
  ),
  Label: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}))

const mockAuthState = {
  user: { id: 'admin-1', name: 'Admin', email: 'admin@example.com', role: 'admin' as const },
}

const mockAchievementsState = {
  updateAchievementStatus: vi.fn(),
}

const mockReactionsState = {
  byAchievement: {},
}

vi.mock('@/entities/auth', () => ({
  useAuthStore: (selector?: (state: typeof mockAuthState) => unknown) => selector ? selector(mockAuthState) : mockAuthState,
}))

vi.mock('@/entities/achievements/store', () => ({
  useAchievementsStore: (selector?: (state: typeof mockAchievementsState) => unknown) => selector ? selector(mockAchievementsState) : mockAchievementsState,
}))

vi.mock('@/entities/reactions', () => ({
  useReactionsStore: (selector?: (state: typeof mockReactionsState) => unknown) => selector ? selector(mockReactionsState) : mockReactionsState,
}))

vi.mock('@/entities/comments', () => ({
  useCommentsStore: {
    getState: () => ({
      loadCounts: vi.fn(),
    }),
  },
}))

vi.mock('@/features/reactions', () => ({
  ReactionBar: () => <div>ReactionBar</div>,
}))

vi.mock('@/features/comments', () => ({
  CommentSection: () => <div>CommentSection</div>,
}))

vi.mock('@/shared/ui', () => ({
  CategoryIcon: () => <span>CategoryIcon</span>,
  CheckIcon: () => <span>CheckIcon</span>,
  HourglassIcon: () => <span>HourglassIcon</span>,
  CrossMarkIcon: () => <span>CrossMarkIcon</span>,
}))

vi.mock('@/entities/claims', () => ({
  achievementToClaim: () => ({ type: 'self_achievement', subjectName: 'Я', thread: null }),
  ClaimBadge: () => <div>ClaimBadge</div>,
}))

function makeAchievement(overrides: Partial<Achievement> = {}): Achievement {
  return {
    id: 'a1',
    userId: 'admin-1',
    category: 'other',
    title: 'Pending claim',
    description: 'Description',
    year: 2026,
    proofType: 'none',
    status: 'pending',
    meta: {},
    createdAt: '2026-06-21T00:00:00Z',
    ...overrides,
  }
}

describe('Profile AchievementCard moderation actions', () => {
  it('keeps pending status passive by default even for admins', () => {
    render(<AchievementCard achievement={makeAchievement()} />)

    expect(screen.getByText('На модерации')).toBeInTheDocument()
    expect(screen.queryByText('Подтвердить')).not.toBeInTheDocument()
    expect(screen.queryByText('Отклонить')).not.toBeInTheDocument()
  })

  it('shows moderation actions only when explicitly enabled', () => {
    render(<AchievementCard achievement={makeAchievement()} showModerationActions />)

    expect(screen.getByText('Подтвердить')).toBeInTheDocument()
    expect(screen.getByText('Отклонить')).toBeInTheDocument()
  })
})
