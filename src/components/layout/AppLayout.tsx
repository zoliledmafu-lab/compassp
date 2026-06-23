import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Companion } from '../companion/Companion'
import { useAuth } from '../../contexts/AuthContext'

export function AppLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <Companion />
    </div>
  )
}
