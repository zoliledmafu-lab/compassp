import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  MessageSquare, BookOpen, LayoutDashboard, Settings,
  LogOut, ChevronLeft, ChevronRight, Users, BarChart3,
  Compass, Layers, Brain
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
  adminOnly?: boolean
  studentOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/chat', icon: <MessageSquare size={18} />, label: 'Study Chat', studentOnly: true },
  { to: '/canvas', icon: <Layers size={18} />, label: 'Study Canvas', studentOnly: true },
  { to: '/subjects', icon: <BookOpen size={18} />, label: 'Subjects', studentOnly: true },
  { to: '/progress', icon: <Brain size={18} />, label: 'My Progress', studentOnly: true },
  { to: '/admin/rules', icon: <Settings size={18} />, label: 'Rule Engine', adminOnly: true },
  { to: '/admin/students', icon: <Users size={18} />, label: 'Students', adminOnly: true },
  { to: '/admin/analytics', icon: <BarChart3 size={18} />, label: 'Analytics', adminOnly: true },
]

export function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly && user?.role !== 'admin') return false
    if (item.studentOnly && user?.role !== 'student') return false
    return true
  })

  return (
    <aside
      className={`glass-dark flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} min-h-screen shrink-0 relative z-20`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/8 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center shrink-0 glow-sm">
          <Compass size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-gradient font-bold text-lg leading-none">Compass</span>
            <p className="text-slate-500 text-xs mt-0.5">{user?.role === 'admin' ? 'Admin Console' : 'Study Companion'}</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
              ${isActive
                ? 'gradient-primary text-white glow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }
              ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && item.label}
          </NavLink>
        ))}
      </nav>

      {/* User + collapse */}
      <div className="border-t border-white/8 p-3 flex flex-col gap-2">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.full_name?.charAt(0) || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => { signOut(); navigate('/login') }}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all ${collapsed ? 'justify-center' : ''}`}
          title="Sign out"
        >
          <LogOut size={16} />
          {!collapsed && 'Sign out'}
        </button>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}
