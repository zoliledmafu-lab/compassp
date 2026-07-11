import { Outlet, Navigate, NavLink } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { OnboardingTour } from '../onboarding/OnboardingTour'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, MessageSquare, BookOpen, Zap, Brain,
  Settings, Users, BarChart3,
} from 'lucide-react'

function MobileBottomNav() {
  const { user } = useAuth()

  const items = user?.role === 'admin'
    ? [
        { to: '/dashboard',       icon: <LayoutDashboard size={22} />, label: 'Home' },
        { to: '/admin/rules',     icon: <Settings size={22} />,        label: 'Rules' },
        { to: '/admin/students',  icon: <Users size={22} />,           label: 'Students' },
        { to: '/admin/analytics', icon: <BarChart3 size={22} />,       label: 'Reports' },
      ]
    : [
        { to: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Home' },
        { to: '/chat',      icon: <MessageSquare size={22} />,   label: 'Chat' },
        { to: '/subjects',  icon: <BookOpen size={22} />,        label: 'Subjects' },
        { to: '/learn',     icon: <Zap size={22} />,             label: 'Learn' },
        { to: '/progress',  icon: <Brain size={22} />,           label: 'Progress' },
      ]

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/8 flex items-center justify-around px-1 py-1"
      style={{ background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
    >
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-all flex-1 min-w-0 ${
              isActive ? 'text-indigo-400' : 'text-slate-500'
            }`
          }
        >
          {item.icon}
          <span className="text-[10px] font-medium leading-none truncate">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

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

  if (!user.curricula || user.curricula.length === 0) return <Navigate to="/onboarding" replace />

  return (
    <div className="flex min-h-screen">
      {/* Sidebar: visible only on md+ */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      {/* Main content: bottom padding on mobile for the nav bar */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <Outlet />
      </main>
      <MobileBottomNav />
      <OnboardingTour />
    </div>
  )
}
