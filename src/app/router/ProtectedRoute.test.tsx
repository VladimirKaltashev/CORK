import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { useAuthStore } from '@/entities/auth'

describe('ProtectedRoute', () => {
  it('shows loading when isLoading', () => {
    useAuthStore.setState({ token: null, user: null, isLoading: true })
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="*" element={<div>content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Загрузка...')).toBeInTheDocument()
  })

  it('redirects to login when no token', () => {
    useAuthStore.setState({ token: null, user: null, isLoading: false })
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>login</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('login')).toBeInTheDocument()
  })

  it('renders outlet when token present', () => {
    useAuthStore.setState({ token: 'abc', user: { id: 'u1', name: 'A', email: 'a@a.com', role: 'user' }, isLoading: false })
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="*" element={<div>content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('redirects home when role mismatch', () => {
    useAuthStore.setState({ token: 'abc', user: { id: 'u1', name: 'A', email: 'a@a.com', role: 'user' }, isLoading: false })
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<div>home</div>} />
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin" element={<div>admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('home')).toBeInTheDocument()
  })
})
