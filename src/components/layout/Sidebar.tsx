import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  MessageSquare, BookOpen, LayoutDashboard, Settings,
  LogOut, ChevronLeft, ChevronRight, Users, BarChart3,
  Compass, Layers, Brain, Zap, Globe,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { capitalizeName } from '../../lib/constants'
import type { Translations } from '../../lib/i18n'
import type { Language } from '../../lib/i18n'

interface NavItem {
  to: string
  icon: React.ReactNode
  labelKey: keyof Translations
  adminOnly?: boolean
  studentOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, labelKey: 'nav_dashboard' },
  { to: '/chat',      icon: <MessageSquare size={18} />,  labelKey: 'nav_chat',     studentOnly: true },
  { to: '/canvas',    icon: <Layers size={18} />,         labelKey: 'nav_canvas',   studentOnly: true },
  { to: '/subjects',  icon: <BookOpen size={18} />,       labelKey: 'nav_subjects', studentOnly: true },
  { to: '/learn',     icon: <Zap size={18} />,            labelKey: 'nav_learn',    studentOnly: true },
  { to: '/progress',  icon: <Brain size={18} />,          labelKey: 'nav_progress', studentOnly: true },
  { to: '/admin/rules',     icon: <Settings size={18} />, labelKey: 'nav_rules',    adminOnly: true },
  { to: '/admin/students',  icon: <Users size={18} />,    labelKey: 'nav_students', adminOnly: true },
  { to: '/admin/analytics', icon: <BarChart3 size={18} />,labelKey: 'nav_analytics',adminOnly: true },
]

const LANG_OPTIONS: { code: Language; short: string }[] = [
  { code: 'en', short: 'EN' },
  { code: 'sn', short: 'SN' },
  { code: 'nd', short: 'ND' },
]

export function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { language, setLanguage, t } = useLanguage()
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)

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
            <p className="text-slate-500 text-xs mt-0.5">
              {user?.role === 'admin' ? t('sidebar_admin_console') : t('sidebar_study_companion')}
            </p>
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
            title={collapsed ? t(item.labelKey) : undefined}
          >
            {item.icon}
            {!collapsed && t(item.labelKey)}
          </NavLink>
        ))}
      </nav>

      {/* Language switcher */}
      <div className={`px-3 pb-2 border-t border-white/8 pt-3 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <button
            className="p-2 rounded-xl text-slate-500 hover:text-indigo-400 hover:bg-white/5 transition-all"
            title={`Language: ${language.toUpperCase()}`}
            onClick={() => {
              const idx = LANG_OPTIONS.findIndex(l => l.code === language)
              setLanguage(LANG_OPTIONS[(idx + 1) % LANG_OPTIONS.length].code)
            }}
          >
            <Globe size={16} />
          </button>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-slate-600 px-1 tracking-wide uppercase">{t('lang_label')}</p>
            <div className="flex gap-1">
              {LANG_OPTIONS.map(opt => (
                <button
                  key={opt.code}
                  onClick={() => setLanguage(opt.code)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all ${
                    language === opt.code
                      ? 'gradient-primary text-white'
                      : 'text-slate-500 hover:text-white hover:bg-white/8 border border-white/8'
                  }`}
                >
                  {opt.short}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User + collapse */}
      <div className="border-t border-white/8 p-3 flex flex-col gap-2">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {capitalizeName(user?.full_name).charAt(0) || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{capitalizeName(user?.full_name)}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => { signOut(); navigate('/login') }}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all ${collapsed ? 'justify-center' : ''}`}
          title={t('sidebar_sign_out')}
        >
          <LogOut size={16} />
          {!collapsed && t('sidebar_sign_out')}
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
