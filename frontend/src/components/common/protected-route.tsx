import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/use-auth'
import type { UserRole } from '../../types/auth'

type ProtectedRouteProps = {
  allowedRoles: UserRole[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading ReciTrack...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard'} replace />
  }

  return <Outlet />
}
