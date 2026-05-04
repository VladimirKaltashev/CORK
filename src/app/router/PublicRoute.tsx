import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/entities/auth'
import { ROUTES } from '@/shared/constants/routes'

export function PublicRoute() {
  const token = useAuthStore((s) => s.token)
  return token ? <Navigate to={ROUTES.HOME} replace /> : <Outlet />
}
