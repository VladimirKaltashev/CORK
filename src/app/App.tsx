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
import { ChallengesPage } from '@/pages/ChallengesPage'
import { ChallengeDetailPage } from '@/pages/ChallengeDetailPage'
import { ThemeApplier, useThemeStore } from '@/entities/theme'
import '@/styles/theme-tokens.css'
import '@/styles/theme-components.css'
import '@/styles/themes/acid.css'

function themeToColorMode(theme: 'light' | 'dark' | 'system' | 'acid'): 'day' | 'night' | 'auto' {
  if (theme === 'light') return 'day'
  if (theme === 'dark' || theme === 'acid') return 'night'
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

              {/* Public routes — no auth required */}
              <Route path="/" element={<Navigate to="/feed" replace />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/profile/:id" element={<ProfilePage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/challenges" element={<ChallengesPage />} />
              <Route path="/challenges/:id" element={<ChallengeDetailPage />} />

              {/* Protected routes — require auth */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile/me" element={<ProfilePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/friends" element={<FriendsPage />} />
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