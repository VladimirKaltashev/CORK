import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReactionBar } from './ReactionBar'

const mockToggle = vi.fn()
const mockState = {
  byAchievement: {} as Record<string, { crowns: number; clowns: number; myKind: string | null }>,
  pending: new Set<string>(),
  budgetRemaining: 10,
  toggle: mockToggle,
}

vi.mock('@/entities/reactions', () => ({
  useReactionsStore: (selector: (state: typeof mockState) => typeof mockState) => selector(mockState),
  REACTION_COST: { crown: 1, clown: 2 },
}))

vi.mock('@/shared/ui', () => ({
  CrownIcon: () => <span>Crown</span>,
  ClownIcon: () => <span>Clown</span>,
}))

describe('ReactionBar', () => {
  beforeEach(() => {
    mockState.byAchievement = {}
    mockState.pending = new Set()
    mockState.budgetRemaining = 10
    mockToggle.mockClear()
  })

  it('renders with zero counts', () => {
    render(<ReactionBar achievementId="a1" />)
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBe(2)
  })

  it('renders active crown', () => {
    mockState.byAchievement = { a1: { crowns: 5, clowns: 1, myKind: 'crown' } }
    render(<ReactionBar achievementId="a1" />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders active clown', () => {
    mockState.byAchievement = { a1: { crowns: 2, clowns: 3, myKind: 'clown' } }
    render(<ReactionBar achievementId="a1" />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('calls toggle on crown click', () => {
    render(<ReactionBar achievementId="a1" />)
    const buttons = screen.getAllByRole('button')
    buttons[0].click()
    expect(mockToggle).toHaveBeenCalledWith('a1', 'crown')
  })

  it('does not toggle when disabled', () => {
    render(<ReactionBar achievementId="a1" disabled />)
    const buttons = screen.getAllByRole('button')
    buttons[0].click()
    expect(mockToggle).not.toHaveBeenCalled()
  })

  it('does not toggle when budget insufficient for new reaction', () => {
    mockState.budgetRemaining = 0
    render(<ReactionBar achievementId="a1" />)
    const buttons = screen.getAllByRole('button')
    buttons[0].click()
    expect(mockToggle).not.toHaveBeenCalled()
  })
})
