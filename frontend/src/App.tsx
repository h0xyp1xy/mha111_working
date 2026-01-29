import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'

import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'
import { getCookie } from './utils/cookies'

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(module => ({ default: module.RegisterPage })))
const AssessmentPage = lazy(() => import('./pages/AssessmentPage').then(module => ({ default: module.AssessmentPage })))
const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage').then(module => ({ default: module.AdminPanelPage })))
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage').then(module => ({ default: module.AdminLoginPage })))
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage').then(module => ({ default: module.SubscriptionPage })))

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--primary-50)]">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-[var(--primary-500)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-[var(--primary-700)]">Загрузка...</p>
    </div>
  </div>
)

// Компонент для восстановления последней посещенной страницы
function RestoreLastPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuth()
  const [hasRestored, setHasRestored] = useState(false)

  useEffect(() => {
    // Ждем завершения проверки аутентификации
    if (isLoading) return
    
    // Восстанавливаем страницу один раз при первой загрузке (работает и для неавторизованных пользователей)
    if (!hasRestored) {
      const lastPage = getCookie('lastVisitedPage')
      const navigationType = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const isPageReload = navigationType?.type === 'reload'
      const wasRestored = sessionStorage.getItem('pageRestored')
      
      console.log('Проверка восстановления:', {
        lastPage,
        currentPath: location.pathname,
        isPageReload,
        navigationType: navigationType?.type,
        wasRestored,
        isAuthenticated
      })
      
      // Восстанавливаем только если:
      // 1. Есть сохраненная страница
      // 2. Это перезагрузка страницы (type === 'reload')
      // 3. Еще не восстанавливали в этой сессии
      // 4. Сохраненная страница не является страницей логина/регистрации
      // 5. Сохраненная страница отличается от текущей ИЛИ текущая страница - главная
      if (lastPage && isPageReload && !wasRestored &&
          !lastPage.startsWith('/login') && 
          !lastPage.startsWith('/register') &&
          !lastPage.startsWith('/admin-panel') &&
          (lastPage !== location.pathname || location.pathname === '/')) {
        console.log('✅ Восстанавливаю страницу:', lastPage, 'текущая:', location.pathname)
        sessionStorage.setItem('pageRestored', 'true')
        // Используем setTimeout для гарантии, что навигация произойдет после рендера
        setTimeout(() => {
          navigate(lastPage, { replace: true })
        }, 50)
      } else {
        // Помечаем, что восстановление проверено
        if (isPageReload) {
          sessionStorage.setItem('pageRestored', 'true')
        }
      }
      setHasRestored(true)
    }
  }, [isLoading, hasRestored, location.pathname, navigate])

  return null
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth()
  
  // Show loading state while checking authentication
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

  return (
    <>
      <RestoreLastPage />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes - Main pages accessible without login */}
          <Route
            path="/"
            element={
              <Layout>
                <HomePage />
              </Layout>
            }
          />
          <Route
            path="/analytics"
            element={
              <Layout>
                <HomePage />
              </Layout>
            }
          />
          <Route
            path="/mood"
            element={
              <Layout>
                <HomePage />
              </Layout>
            }
          />
          
          {/* Authentication routes */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
          
          {/* Protected routes - require authentication */}
          <Route
            path="/assessment"
            element={
              <Layout>
                <ProtectedRoute>
                  <AssessmentPage />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/admin-panel/login"
            element={<AdminLoginPage />}
          />
          <Route
            path="/admin-panel"
            element={
              <Layout>
                <ProtectedRoute isAdmin={true}>
                  <AdminPanelPage />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/subscription"
            element={
              <Layout>
                <ProtectedRoute>
                  <SubscriptionPage />
                </ProtectedRoute>
              </Layout>
            }
          />
          
          {/* Catch-all route - redirect to home */}
          <Route path="*" element={<Navigate to="/mood" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppRoutes />
    </Router>
  )
}

export default App

