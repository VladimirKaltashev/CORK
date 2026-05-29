import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import { LoginPage } from '@/pages/auth/LoginPage'
import { useAuthStore } from '@/entities/auth'
import { renderWithProviders } from './renderWithProviders'

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
    rpc: vi.fn(),
  },
}))

const mockSupabase = (await vi.importMock('@/shared/lib/supabase')).supabase

vi.mock('@/shared/lib/toast', () => ({
  showToast: vi.fn(),
}))

describe('Auth integration', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null, isLoading: true })
    vi.clearAllMocks()
  })

  it('login flow updates auth store and redirects to feed', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: {
        user: { id: 'u1', email: 'test@test.com' },
        session: { access_token: 'token123' },
      },
      error: null,
    })
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValueOnce({
            data: { name: 'Test', is_admin: false },
            error: null,
          }),
        })),
      })),
    })

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/feed" element={<div>feed-page</div>} />
      </Routes>,
      { router: { initialEntries: ['/login'] } },
    )

    const textboxes = screen.getAllByRole('textbox')
    fireEvent.change(textboxes[0], { target: { value: 'test@test.com' } })
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe('token123')
      expect(useAuthStore.getState().user).toEqual({
        id: 'u1',
        email: 'test@test.com',
        name: 'Test',
        role: 'user',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('feed-page')).toBeInTheDocument()
    })
  })

  it('shows error on failed login', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: 'Неверный email или пароль' },
    })

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>,
      { router: { initialEntries: ['/login'] } },
    )

    const textboxes = screen.getAllByRole('textbox')
    fireEvent.change(textboxes[0], { target: { value: 'test@test.com' } })
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement
    fireEvent.change(passwordInput, { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBeNull()
    })
  })
})
