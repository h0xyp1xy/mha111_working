import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  isAdmin?: boolean
}

export const ProtectedRoute = ({ children, isAdmin = false }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--primary-50)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--primary-500)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--primary-700)]">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to admin login if trying to access admin panel
    if (location.pathname.startsWith('/admin-panel')) {
      return <Navigate to="/admin-panel/login" replace />
    }
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Admin check
  if (isAdmin || location.pathname.startsWith('/admin-panel')) {
    if (!user?.isAdmin) {
      // Redirect to admin login if not admin
      if (location.pathname.startsWith('/admin-panel')) {
        return <Navigate to="/admin-panel/login" replace />
      }
      return <Navigate to="/mood" replace />
    }
  }

  return <>{children}</>
}

