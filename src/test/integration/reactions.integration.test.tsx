import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useReactionsStore } from '@/entities/reactions'
import { useAuthStore } from '@/entities/auth'
import { ReactionBar } from '@/features/reactions/ReactionBar'
import { BudgetWidget } from '@/features/reactions/BudgetWidget'

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
    rpc: vi.fn(),
  },
}))

type MockFn = ReturnType<typeof vi.fn>
const mockSupabase = (await vi.importMock('@/shared/lib/supabase') as { supabase: Record<string, MockFn> }).supabase

vi.mock('@/shared/lib/toast', () => ({
  showToast: vi.fn(),
}))

vi.mock('@/shared/ui', () => ({
  CrownIcon: () => <span data-testid="crown-icon">Crown</span>,
  ClownIcon: () => <span data-testid="clown-icon">Clown</span>,
  CategoryIcon: ({ category }: { category: string }) => <span>{category}</span>,
}))

describe('Reactions integration', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'mock-token',
      user: { id: 'u1', name: 'Test', email: 't@t.com', role: 'user' },
      isLoading: false,
    })
    useReactionsStore.setState({
      byAchievement: {},
      userScores: {},
      pending: new Set(),
      budgetRemaining: 10,
      budgetSpent: 0,
      budgetLoaded: false,
    })
  })

  it('toggles crown and updates budget via real store', async () => {
    mockSupabase.rpc.mockImplementation((name: string) => {
      if (name === 'get_reaction_budget') {
        return Promise.resolve({ data: { spent: 0, remaining: 10 }, error: null })
      }
      if (name === 'toggle_reaction') {
        return Promise.resolve({ data: { kind: 'crown', spent: 1, remaining: 9 }, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    })

    render(
      <>
        <BudgetWidget />
        <ReactionBar achievementId="a1" />
      </>,
    )

    // BudgetWidget loads budget on mount
    await waitFor(() => {
      expect(screen.getByText(/10/)).toBeInTheDocument()
    })

    // Click crown button (first button)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])

    await waitFor(() => {
      expect(useReactionsStore.getState().budgetRemaining).toBe(9)
      expect(useReactionsStore.getState().budgetSpent).toBe(1)
    })
  })

  it('toggles clown (cost 2) and updates budget correctly', async () => {
    mockSupabase.rpc.mockImplementation((name: string) => {
      if (name === 'get_reaction_budget') {
        return Promise.resolve({ data: { spent: 0, remaining: 10 }, error: null })
      }
      if (name === 'toggle_reaction') {
        return Promise.resolve({ data: { kind: 'clown', spent: 2, remaining: 8 }, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    })

    render(
      <>
        <BudgetWidget />
        <ReactionBar achievementId="a1" />
      </>,
    )

    await waitFor(() => {
      expect(screen.getByText(/10/)).toBeInTheDocument()
    })

    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[1]) // clown button

    await waitFor(() => {
      expect(useReactionsStore.getState().budgetRemaining).toBe(8)
      expect(useReactionsStore.getState().budgetSpent).toBe(2)
    })
  })

  it('blocks new reaction when budget is insufficient', async () => {
    useReactionsStore.setState({
      budgetRemaining: 0,
      budgetSpent: 10,
      budgetLoaded: true,
    })

    const mockToggle = vi.fn()
    useReactionsStore.setState({ toggle: mockToggle })

    render(<ReactionBar achievementId="a1" />)

    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])

    expect(mockToggle).not.toHaveBeenCalled()
  })

  it('allows toggle-off even when budget is zero', async () => {
    useReactionsStore.setState({
      byAchievement: { a1: { crowns: 1, clowns: 0, myKind: 'crown' } },
      budgetRemaining: 0,
      budgetSpent: 10,
      budgetLoaded: true,
    })

    const mockToggle = vi.fn()
    useReactionsStore.setState({ toggle: mockToggle })

    render(<ReactionBar achievementId="a1" />)

    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])

    expect(mockToggle).toHaveBeenCalledWith('a1', 'crown')
  })

  it('shows owner state instead of voting controls for own claim', () => {
    render(<ReactionBar achievementId="a1" isOwner />)

    expect(screen.getByText('Это ваша заявка')).toBeInTheDocument()
    expect(screen.getByText('Вы не можете голосовать за своё. Арена решит исход.')).toBeInTheDocument()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
