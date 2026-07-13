import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { RulesProvider } from './contexts/RulesContext'
import { MemoryProvider } from './contexts/MemoryContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { AppLayout } from './components/layout/AppLayout'

const LoginPage      = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const SignupPage     = lazy(() => import('./pages/auth/SignupPage').then(m => ({ default: m.SignupPage })))
const OnboardingPage = lazy(() => import('./pages/auth/OnboardingPage').then(m => ({ default: m.OnboardingPage })))
const LearnPage      = lazy(() => import('./pages/learn/LearnPage').then(m => ({ default: m.LearnPage })))
const DashboardPage  = lazy(() => import('./pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ChatPage       = lazy(() => import('./pages/chat/ChatPage').then(m => ({ default: m.ChatPage })))
const CanvasPage     = lazy(() => import('./pages/canvas/CanvasPage').then(m => ({ default: m.CanvasPage })))
const SubjectsPage   = lazy(() => import('./pages/subjects/SubjectsPage').then(m => ({ default: m.SubjectsPage })))
const ProgressPage   = lazy(() => import('./pages/progress/ProgressPage').then(m => ({ default: m.ProgressPage })))
const RulesPage      = lazy(() => import('./pages/admin/RulesPage').then(m => ({ default: m.RulesPage })))
const StudentsPage   = lazy(() => import('./pages/admin/StudentsPage').then(m => ({ default: m.StudentsPage })))
const AnalyticsPage  = lazy(() => import('./pages/admin/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })))

function PageShell() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14' }} />
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
        <RulesProvider>
          <MemoryProvider>
            <Suspense fallback={<PageShell />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/learn/:topicId" element={<LearnPage />} />
                <Route path="/learn" element={<LearnPage />} />
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/canvas" element={<CanvasPage />} />
                  <Route path="/subjects" element={<SubjectsPage />} />
                  <Route path="/progress" element={<ProgressPage />} />
                  <Route path="/admin/rules" element={<RulesPage />} />
                  <Route path="/admin/students" element={<StudentsPage />} />
                  <Route path="/admin/analytics" element={<AnalyticsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </MemoryProvider>
        </RulesProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
