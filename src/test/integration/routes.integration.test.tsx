import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { PublicRoute } from '@/app/router/PublicRoute'
import { useAuthStore } from '@/entities/auth'

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

describe('Routes integration', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null, isLoading: true })
  })

  it('shows loading when auth is initializing', () => {
    useAuthStore.setState({ token: null, user: null, isLoading: true })
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="*" element={<div>content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Загрузка...')).toBeInTheDocument()
  })

  it('redirects to login when no token', () => {
    useAuthStore.setState({ token: null, user: null, isLoading: false })
    render(
      <MemoryRouter initialEntries={['/feed']}>
        <Routes>
          <Route path="/login" element={<div>login-page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/feed" element={<div>feed-page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('login-page')).toBeInTheDocument()
  })

  it('renders protected content when authenticated', () => {
    useAuthStore.setState({
      token: 'abc',
      user: { id: 'u1', name: 'A', email: 'a@a.com', role: 'user' },
      isLoading: false,
    })
    render(
      <MemoryRouter initialEntries={['/feed']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/feed" element={<div>feed-page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('feed-page')).toBeInTheDocument()
  })

  it('redirects to home when admin role mismatch', () => {
    useAuthStore.setState({
      token: 'abc',
      user: { id: 'u1', name: 'A', email: 'a@a.com', role: 'user' },
      isLoading: false,
    })
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<div>home-page</div>} />
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin" element={<div>admin-page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('home-page')).toBeInTheDocument()
  })

  it('redirects authenticated user from public route to home', () => {
    useAuthStore.setState({
      token: 'abc',
      user: { id: 'u1', name: 'A', email: 'a@a.com', role: 'user' },
      isLoading: false,
    })
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/" element={<div>home-page</div>} />
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>login-page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('home-page')).toBeInTheDocument()
  })

  it('renders login page for public route when unauthenticated', () => {
    useAuthStore.setState({ token: null, user: null, isLoading: false })
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/" element={<div>home-page</div>} />
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>login-page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('login-page')).toBeInTheDocument()
  })
})
