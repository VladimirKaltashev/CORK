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
import { SearchPage } from '@/pages/SearchPage'
import { FriendsPage } from '@/pages/FriendsPage'
import { LeaderboardPage } from '@/pages/LeaderboardPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ThemeApplier, useThemeStore } from '@/entities/theme'

function themeToColorMode(theme: 'light' | 'dark' | 'system'): 'day' | 'night' | 'auto' {
  if (theme === 'light') return 'day'
  if (theme === 'dark') return 'night'
  return 'auto'
}

export function App() {
  const theme = useThemeStore((s) => s.theme)
  return (
    <>
      <ThemeApplier />
      <ThemeProvider colorMode={themeToColorMode(theme)}>
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
                <Route path="/search" element={<SearchPage />} />
                <Route path="/friends" element={<FriendsPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              <Route element={<ProtectedRoute requiredRole="admin" />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </>
  )
}
