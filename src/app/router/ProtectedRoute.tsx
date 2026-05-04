import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/entities/auth'
import type { Role } from '@/entities/auth'
import { ROUTES } from '@/shared/constants/routes'

interface Props {
  requiredRole?: Role
}

export function ProtectedRoute({ requiredRole }: Props) {
  const { token, user } = useAuthStore()

  if (!token) return <Navigate to={ROUTES.LOGIN} replace />
  if (requiredRole && user?.role !== requiredRole) return <Navigate to={ROUTES.HOME} replace />

  return <Outlet />
}
