import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BudgetWidget } from './BudgetWidget'

const mockAuthState: { token: string | null } = { token: 'abc' }
const mockReactionsState = { budgetRemaining: 10, budgetLoaded: true, loadBudget: vi.fn() }

vi.mock('@/entities/auth', () => ({
  useAuthStore: (selector?: unknown) => typeof selector === 'function' ? selector(mockAuthState) : mockAuthState,
}))

vi.mock('@/entities/reactions', () => ({
  useReactionsStore: (selector?: unknown) => typeof selector === 'function' ? selector(mockReactionsState) : mockReactionsState,
}))

describe('BudgetWidget', () => {
  beforeEach(() => {
    mockAuthState.token = 'abc'
    mockReactionsState.budgetRemaining = 10
    mockReactionsState.budgetLoaded = true
    mockReactionsState.loadBudget.mockClear()
  })

  it('renders null when no token', () => {
    mockAuthState.token = null
    const { container } = render(<BudgetWidget />)
    expect(container.firstChild).toBeNull()
  })

  it('renders compact variant', () => {
    mockReactionsState.budgetRemaining = 7
    render(<BudgetWidget variant="compact" />)
    expect(screen.getByText('7/10')).toBeInTheDocument()
  })

  it('renders full variant', () => {
    mockReactionsState.budgetRemaining = 3
    render(<BudgetWidget variant="full" />)
    expect(screen.getByText(/Осталось голосов: 3 из 10/)).toBeInTheDocument()
  })

  it('calls loadBudget when not loaded', () => {
    mockReactionsState.budgetLoaded = false
    render(<BudgetWidget />)
    expect(mockReactionsState.loadBudget).toHaveBeenCalled()
  })
})
