import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { FloatingMoodButton } from './FloatingMoodButton'
import { HomeIcon, MoodIcon, AnalyticsIcon, SubscriptionIcon } from './Icons'
import { setCookie } from '../utils/cookies'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { path: '/', label: 'Главная', icon: HomeIcon },
    { path: '/mood', label: 'Настроение', icon: MoodIcon },
    { path: '/analytics', label: 'Мой прогресс', icon: AnalyticsIcon },
  ]

  const userMenuItems = isAuthenticated ? [
    { path: '/subscription', label: 'Подписка', icon: SubscriptionIcon },
  ] : []

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const homePagePaths = ['/', '/mood', '/analytics']
  const isHomePage = homePagePaths.includes(location.pathname)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false)
  
  // Сохраняем текущую страницу в cookies при изменении пути
  useEffect(() => {
    if (isAuthenticated && location.pathname) {
      // Не сохраняем страницы логина/регистрации и админ-панели
      if (!location.pathname.startsWith('/login') && 
          !location.pathname.startsWith('/register') && 
          !location.pathname.startsWith('/admin-panel')) {
        setCookie('lastVisitedPage', location.pathname)
        console.log('Сохранена страница:', location.pathname)
      }
    }
  }, [location.pathname, isAuthenticated])

  // Сохраняем страницу при перезагрузке/закрытии страницы
  useEffect(() => {
    if (!isAuthenticated) return

    const handleBeforeUnload = () => {
      if (location.pathname && 
          !location.pathname.startsWith('/login') && 
          !location.pathname.startsWith('/register') && 
          !location.pathname.startsWith('/admin-panel')) {
        setCookie('lastVisitedPage', location.pathname)
        console.log('Сохранена страница при перезагрузке:', location.pathname)
      }
    }

    const handlePageHide = () => {
      if (location.pathname && 
          !location.pathname.startsWith('/login') && 
          !location.pathname.startsWith('/register') && 
          !location.pathname.startsWith('/admin-panel')) {
        setCookie('lastVisitedPage', location.pathname)
        console.log('Сохранена страница при закрытии:', location.pathname)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [location.pathname, isAuthenticated])
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    // Debounce resize handler
    let timeoutId: NodeJS.Timeout
    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleResize, 150)
    }
    window.addEventListener('resize', debouncedResize)
    return () => {
      window.removeEventListener('resize', debouncedResize)
      clearTimeout(timeoutId)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-[var(--primary-50)]">
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex-1 bg-[var(--primary-50)]"
        >
          {children || <Outlet />}
        </motion.main>
      </AnimatePresence>
      
      {/* Floating Mood Button - only on authenticated pages */}
      {isAuthenticated && !isHomePage && location.pathname !== '/mood' && (
        <FloatingMoodButton />
      )}

      <AnimatePresence mode="wait">
        {!isHomePage && (
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-[var(--primary-50)] border-t border-[var(--soft-gray)] pt-2 sm:pt-3"
            style={{ paddingBottom: '10px' }}
          >
            <div className="max-w-7xl mx-auto text-left text-[var(--primary-900)] text-sm" style={{ paddingLeft: '15px' }}>
              <p>© Новый Я 2026</p>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  )
}

