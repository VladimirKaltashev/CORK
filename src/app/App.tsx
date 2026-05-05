import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from '@/widgets/Layout'
import { ProtectedRoute, PublicRoute } from '@/app/router'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ProfilePage } from '@/pages/ProfilePage'

// Heavy pages with react-big-calendar loaded lazily to avoid startup crashes
const PlannerPage = lazy(() => import('@/pages/PlannerPage').then((m) => ({ default: m.PlannerPage })))
const TimerPage = lazy(() => import('@/pages/TimerPage').then((m) => ({ default: m.TimerPage })))

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-sm text-gray-400">Загрузка...</div>
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile/me" element={<ProfilePage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route
              path="/planner"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PlannerPage />
                </Suspense>
              }
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Fullscreen timer without layout */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/timer"
            element={
              <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-400">Загрузка...</div>}>
                <TimerPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
