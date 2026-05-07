import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@primer/react'
import { Layout } from '@/widgets/Layout'
import { ProtectedRoute, PublicRoute } from '@/app/router'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { FeedPage } from '@/pages/FeedPage'
import { AdminPage } from '@/pages/AdminPage'

export function App() {
  return (
    <ThemeProvider colorMode="day">
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Navigate to="/feed" replace />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/profile/me" element={<ProfilePage />} />
              <Route path="/profile/:id" element={<ProfilePage />} />
            </Route>

            <Route element={<ProtectedRoute requiredRole="admin" />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
