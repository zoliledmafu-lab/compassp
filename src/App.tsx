import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { RulesProvider } from './contexts/RulesContext'
import { MemoryProvider } from './contexts/MemoryContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { OnboardingPage } from './pages/auth/OnboardingPage'
import { LearnPage } from './pages/learn/LearnPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ChatPage } from './pages/chat/ChatPage'
import { CanvasPage } from './pages/canvas/CanvasPage'
import { SubjectsPage } from './pages/subjects/SubjectsPage'
import { ProgressPage } from './pages/progress/ProgressPage'
import { RulesPage } from './pages/admin/RulesPage'
import { StudentsPage } from './pages/admin/StudentsPage'
import { AnalyticsPage } from './pages/admin/AnalyticsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
        <RulesProvider>
          <MemoryProvider>
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
          </MemoryProvider>
        </RulesProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
