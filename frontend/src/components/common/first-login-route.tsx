import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/use-auth'

export function FirstLoginRoute() {
  const { user } = useAuth()
  const location = useLocation()

  if (user?.role === 'STUDENT' && user.isFirstLogin && location.pathname !== '/student/settings') {
    return <Navigate to="/student/settings" replace />
  }

  return <Outlet />
}
