import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { PublicRoute } from './PublicRoute'
import { useAuthStore } from '@/entities/auth'

describe('PublicRoute', () => {
  it('renders outlet when no token', () => {
    useAuthStore.setState({ token: null, user: null, isLoading: false })
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="*" element={<div>login-form</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('login-form')).toBeInTheDocument()
  })

  it('redirects home when token present', () => {
    useAuthStore.setState({ token: 'abc', user: { id: 'u1', name: 'A', email: 'a@a.com', role: 'user' }, isLoading: false })
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/" element={<div>home</div>} />
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>login-form</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('home')).toBeInTheDocument()
  })
})
