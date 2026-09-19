import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FullPageSpinner } from './ui/Spinner'

export function ProtectedRoute() {
  const { session, isAdmin, loading } = useAuth()

  if (loading) {
    return <FullPageSpinner />
  }

  if (!session || !isAdmin) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
