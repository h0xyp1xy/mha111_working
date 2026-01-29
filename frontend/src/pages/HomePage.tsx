import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, Link } from 'react-router-dom'
import { MoodPage } from './MoodPage'
import { AnalyticsPage } from './AnalyticsPage'
import { useAuth } from '../contexts/AuthContext'
import { useSEO } from '../hooks/useSEO'

export const HomePage = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const location = useLocation()
  
  // SEO оптимизация
  useSEO(
    location.pathname === '/analytics'
      ? {
          title: 'Мой прогресс - Новый Я | Отслеживай эмоциональное благополучие',
          description: 'Анализируй свое эмоциональное состояние, отслеживай прогресс и визуализируй путь к душевному балансу. Инсайты о настроении и трендах.',
          keywords: 'аналитика настроения, эмоциональный прогресс, статистика ментального здоровья, отслеживание эмоций',
          ogTitle: 'Мой прогресс - Новый Я',
          ogDescription: 'Анализируй свое эмоциональное состояние и отслеживай прогресс к душевному балансу',
          canonicalUrl: window.location.origin + '/analytics',
        }
      : {
          title: 'Дневник Настроения Онлайн - Новый Я | Отслеживай Настроение',
          description: 'Отслеживай настроение, получай поддержку и находи баланс каждый день. Простой способ заботиться о ментальном здоровье. Эмоциональный дневник, который меняет жизнь.',
          keywords: 'дневник настроения онлайн, отслеживание настроения, эмоциональная поддержка, психологическая помощь, душевное благополучие, ментальное здоровье',
          ogTitle: 'Дневник Настроения Онлайн - Новый Я',
          ogDescription: 'Отслеживай настроение, получай поддержку и находи баланс каждый день',
          canonicalUrl: window.location.origin + location.pathname,
        }
  )
  const titleRef = useRef<HTMLHeadingElement>(null)
  const moodSectionRef = useRef<HTMLDivElement>(null)
  const analyticsSectionRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isAnimatingRef = useRef(false)
  const hoverIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const idleIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const [showSections, setShowSections] = useState(false)
  const [textHidden, setTextHidden] = useState(false)
  const isScrollingRef = useRef(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [activeSection, setActiveSection] = useState<'mood' | 'analytics'>('mood')
  const activeSectionRef = useRef<'mood' | 'analytics'>('mood')
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)
  const userHasScrolledRef = useRef(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [showSectionNav, setShowSectionNav] = useState(true)
  const [isSmallScreen, setIsSmallScreen] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 770 : false
  )
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 530 : false
  )
  const [isMediumScreen, setIsMediumScreen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 770 && window.innerWidth <= 1020 : false
  )
  const [isTransitionScreen, setIsTransitionScreen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 760 && window.innerWidth < 770 : false
  )
  const [isMobileScreen, setIsMobileScreen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  )
  
  // Keep ref in sync with state
  useEffect(() => {
    activeSectionRef.current = activeSection
  }, [activeSection])

  // Track screen width for butterfly positioning
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 770)
      setIsNarrow(window.innerWidth < 530)
      setIsMediumScreen(window.innerWidth >= 770 && window.innerWidth <= 1020)
      setIsTransitionScreen(window.innerWidth >= 760 && window.innerWidth < 770)
      setIsMobileScreen(window.innerWidth < 640)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Hide section navigation on very small screens and on 1200px and shorter screens to avoid overlap
  useEffect(() => {
    const checkScreenSize = () => {
      const shouldHide = window.innerHeight < 600 || window.innerWidth < 640 || window.innerWidth <= 1200
      setShowSectionNav(!shouldHide)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Prevent body scroll to avoid double scrollbar
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    
    // Always hide overflow on HomePage
    root.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    
    return () => {
      root.style.overflow = ''
      body.style.overflow = ''
    }
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  // Fix the handleScroll function to be more responsive and less "jumpy"
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    const analyticsSection = analyticsSectionRef.current
    if (!container || !analyticsSection) return

    // Skip processing if we're in the middle of a programmatic scroll (button click)
    if (isScrollingRef.current) {
      return
    }

    // Get the bounding rectangle of the analytics section relative to the viewport
    const analyticsRect = analyticsSection.getBoundingClientRect()

    // Threshold is 50% of the viewport height. 
    // If analytics section top is in the top half of the screen, it's active.
    const nextSection: 'mood' | 'analytics' = analyticsRect.top <= window.innerHeight / 2 ? 'analytics' : 'mood'

    // Use ref to avoid stale closure issues
    if (nextSection !== activeSectionRef.current) {
      userHasScrolledRef.current = true
      activeSectionRef.current = nextSection
      setActiveSection(nextSection)
    }
  }, [])

  // Detect active section based on scroll - stable throttled handler
  const throttledScrollHandler = useCallback(() => {
    if (!showSections) return
    
    // Use requestAnimationFrame for smooth performance
    requestAnimationFrame(() => {
      handleScroll()
    })
  }, [showSections, handleScroll])

  // Initial check when sections are shown
  useEffect(() => {
    if (showSections) {
      // Small delay to ensure refs are populated after mount
      const timeout = setTimeout(handleScroll, 100)
      return () => clearTimeout(timeout)
    }
  }, [showSections, handleScroll])

  // Add a separate effect to ensure activeSection stays in sync on window resize
  useEffect(() => {
    if (!showSections) return

    const syncActiveSection = () => {
      handleScroll()
    }

    window.addEventListener('resize', syncActiveSection)
    return () => {
      window.removeEventListener('resize', syncActiveSection)
    }
  }, [showSections, handleScroll])

  // Полная длительность анимации: 2.5s (appear) + 1.5s (pause) + 2.5s (disappear) = 6.5s
  const ANIMATION_DURATION = 6500
  const IDLE_CHECK_INTERVAL = 1000
  const IDLE_THRESHOLD = 60000

  const triggerAnimation = () => {
    if (titleRef.current && !isAnimatingRef.current) {
      isAnimatingRef.current = true
      
      titleRef.current.classList.remove('carpet-roll-animation')
      void titleRef.current.offsetWidth
      titleRef.current.classList.add('carpet-roll-animation')

      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
      animationTimeoutRef.current = setTimeout(() => {
        isAnimatingRef.current = false
        if (!showSections) {
          // Скрываем текст после завершения анимации
          setTextHidden(true)
          
          // Ждем завершения анимации подъема бабочки (1000ms) перед показом контента
          setTimeout(() => {
            setShowSections(true)
            // Прокрутка к секции настроения (хотя она уже в центре)
            setTimeout(() => {
              scrollToSection('mood')
            }, 100)
          }, 1100)
        }
      }, ANIMATION_DURATION)
    }
  }

  const handleMouseEnter = () => {
    triggerAnimation()

    if (hoverIntervalRef.current) {
      clearInterval(hoverIntervalRef.current)
    }
    
    hoverIntervalRef.current = setInterval(() => {
      triggerAnimation()
    }, ANIMATION_DURATION)
  }

  const handleMouseLeave = () => {
    if (hoverIntervalRef.current) {
      clearInterval(hoverIntervalRef.current)
      hoverIntervalRef.current = null
    }
  }

  const handleUserActivity = () => {
    lastActivityRef.current = Date.now()
    
    if (idleIntervalRef.current) {
      clearInterval(idleIntervalRef.current)
      idleIntervalRef.current = null
    }
  }

  const checkIdleAndAnimate = () => {
    const timeSinceLastActivity = Date.now() - lastActivityRef.current
    
    if (timeSinceLastActivity >= IDLE_THRESHOLD) {
      triggerAnimation()
    }
  }

  // Also fix the scrollToSection function to handle state better
  const scrollToSection = useCallback((section: 'mood' | 'analytics', speed: 'normal' | 'slow' = 'normal') => {
    if (!showSections) return

    // Force immediate state update when button is clicked
    setActiveSection(section)
    activeSectionRef.current = section
    isScrollingRef.current = true

    const targetRef = section === 'mood' ? moodSectionRef : analyticsSectionRef
    const target = targetRef.current
    const container = containerRef.current

    if (target && container) {
      const targetOffset = target.offsetTop

      // Clear any existing animation timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }

      container.scrollTo({
        top: targetOffset,
        behavior: 'smooth',
      })

      // Calculate how long to block the scroll handler
      // Use longer duration to ensure smooth scroll completes
      const blockDuration = speed === 'slow' ? 2000 : 1000

      animationTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false
        // Final sync after scroll completes
        handleScroll()
      }, blockDuration)
    }
  }, [showSections, activeSection])

  // Scroll to analytics after mood is saved (only if user hasn't manually scrolled)
  const scrollToAnalytics = () => {
    // Reset the scroll flag when mood is saved, so we track scrolling during the delay
    userHasScrolledRef.current = false
    setTimeout(() => {
      // Don't auto-scroll if user has manually scrolled after mood selection
      if (!userHasScrolledRef.current) {
        scrollToSection('analytics', 'slow')
      }
      // Reset the flag after checking
      userHasScrolledRef.current = false
    }, 1500) // Wait more before starting the scroll
  }

  useEffect(() => {
    // Determine which section to show based on route
    const targetSection = location.pathname === '/analytics' ? 'analytics' : 'mood'
    
    // Запускаем анимацию каждый раз при заходе на страницу
    if (titleRef.current) {
      titleRef.current.classList.remove('carpet-roll-animation')
      void titleRef.current.offsetWidth
      titleRef.current.classList.add('carpet-roll-animation')
      isAnimatingRef.current = true
      
      animationTimeoutRef.current = setTimeout(() => {
        isAnimatingRef.current = false
        // Скрываем текст после завершения анимации
        setTextHidden(true)
        
          // Ждем завершения анимации подъема бабочки перед показом контента
          setTimeout(() => {
            setShowSections(true)
            setTimeout(() => {
              // Reset scrolling ref before scrolling
              isScrollingRef.current = false
              scrollToSection(targetSection)
            }, 100)
          }, 1100)
      }, ANIMATION_DURATION)
    }

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true })
    })

    idleIntervalRef.current = setInterval(checkIdleAndAnimate, IDLE_CHECK_INTERVAL)

    return () => {
      if (hoverIntervalRef.current) {
        clearInterval(hoverIntervalRef.current)
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
      if (idleIntervalRef.current) {
        clearInterval(idleIntervalRef.current)
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <div className="relative h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {!showSections ? (
          <motion.div 
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-0 z-[1000] flex flex-col items-center bg-[var(--primary-50)] overflow-y-scroll"
          >
            <div className="flex flex-col items-center w-full relative h-full">
              {/* Logo - бабочка */}
              <motion.div 
                layoutId="main-butterfly"
                layout="position"
                className={`w-full flex items-center justify-center z-10 ${textHidden ? 'mt-[216px] sm:mt-[224px] md:mt-[32px]' : ''}`}
                style={{ 
                  marginTop: textHidden ? undefined : 'clamp(8px, 20vh, 35vh)'
                }}
                transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <span 
                  className="text-[var(--primary-500)] cursor-pointer select-none inline-block hover:scale-110 transition-transform duration-300" 
                  style={{ fontSize: '130px' }}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >🦋</span>
              </motion.div>
              
              {/* Title with carpet animation - скрывается после анимации */}
              <div className="relative mt-4">
                {!textHidden && (
                  <h1 
                    ref={titleRef}
                    className="text-[var(--primary-700)] font-light italic tracking-wide text-center px-6 relative overflow-visible"
                    style={{ lineHeight: '1.4', fontSize: 'calc(1.5rem + 4px)' }}
                  >
                    <span className="sm:hidden">Я все ближе к <strong>новому себе</strong></span>
                    <span className="hidden sm:inline md:hidden" style={{ fontSize: 'calc(1.875rem + 4px)' }}>Я все ближе к <strong>новому себе</strong></span>
                    <span className="hidden md:inline lg:hidden" style={{ fontSize: 'calc(2.25rem + 4px)' }}>Я все ближе к <strong>новому себе</strong></span>
                    <span className="hidden lg:inline" style={{ fontSize: 'calc(3rem + 4px)' }}>Я все ближе к <strong>новому себе</strong></span>
                  </h1>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="main-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative h-screen overflow-hidden bg-[var(--primary-50)]"
          >
            {/* Section Navigation - Right Side - Hidden on very small screens to avoid overlap */}
          <AnimatePresence>
            {showSectionNav && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="fixed right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 sm:gap-3 md:gap-4"
              >
            <div 
              className="flex flex-col gap-3 backdrop-blur-sm" 
              style={{
                padding: '8px',
                borderRadius: '9999px',
                boxShadow: `
                  inset 4px 4px 8px rgba(0, 0, 0, 0.15),
                  inset -4px -4px 8px rgba(255, 255, 255, 0.9),
                  0 0 0 1px rgba(255, 255, 255, 0.5)
                `,
                background: 'linear-gradient(145deg, rgba(240, 250, 248, 0.98), rgba(235, 248, 246, 0.98))',
              }}
            >
              <button
                onClick={() => scrollToSection('mood')}
                className="relative flex items-center justify-center rounded-full overflow-hidden group transition-all hover:scale-105 active:scale-95"
                style={activeSection === 'mood' ? {
                  width: 'clamp(60px, 12vw, 80px)',
                  height: 'clamp(60px, 12vw, 80px)',
                  background: 'linear-gradient(145deg, rgba(240, 250, 248, 0.98), rgba(235, 248, 246, 0.98))',
                  boxShadow: `
                    4px 4px 8px rgba(0, 0, 0, 0.15),
                    -4px -4px 8px rgba(255, 255, 255, 0.9),
                    0 0 0 1px rgba(255, 255, 255, 0.5)
                  `,
                  color: 'var(--primary-700)',
                } : {
                  width: 'clamp(60px, 12vw, 80px)',
                  height: 'clamp(60px, 12vw, 80px)',
                  color: 'var(--primary-500)',
                }}
                title="Настроение"
                aria-label="Настроение"
              >
                <span className="text-2xl sm:text-3xl md:text-4xl">😊</span>
              </button>
              <button
                onClick={() => scrollToSection('analytics')}
                className="relative flex items-center justify-center rounded-full overflow-hidden group transition-all hover:scale-105 active:scale-95"
                style={activeSection === 'analytics' ? {
                  width: 'clamp(60px, 12vw, 80px)',
                  height: 'clamp(60px, 12vw, 80px)',
                  background: 'linear-gradient(145deg, rgba(240, 250, 248, 0.98), rgba(235, 248, 246, 0.98))',
                  boxShadow: `
                    4px 4px 8px rgba(0, 0, 0, 0.15),
                    -4px -4px 8px rgba(255, 255, 255, 0.9),
                    0 0 0 1px rgba(255, 255, 255, 0.5)
                  `,
                  color: 'var(--primary-700)',
                } : {
                  width: 'clamp(60px, 12vw, 80px)',
                  height: 'clamp(60px, 12vw, 80px)',
                  color: 'var(--primary-500)',
                }}
                title="Аналитика"
                aria-label="Аналитика"
              >
                <span className="text-2xl sm:text-3xl md:text-4xl">📊</span>
              </button>
            </div>
            </motion.div>
            )}
          </AnimatePresence>

          {/* Scrollable Container */}
          <div
            ref={containerRef}
            onScroll={throttledScrollHandler}
            className="h-screen w-full overflow-y-auto overflow-x-hidden"
            style={{ 
              scrollBehavior: 'smooth',
            }}
          >
            {/* Mood Section - Top */}
            <section
              ref={moodSectionRef}
              className="min-h-screen w-full bg-[var(--primary-50)] flex flex-col items-center justify-center relative"
            >
            {/* Auth Buttons - Top Right - scrolls with content */}
            {!isCalendarModalOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="absolute top-3 sm:top-4 md:top-6 right-2 sm:right-3 md:right-[23px] z-[100]"
              >
                {!isAuthenticated ? (
                  <div className="flex gap-2 sm:gap-2.5 md:gap-3">
                    <Link
                      to="/login"
                      className="px-3 sm:px-4 md:px-5 py-1 sm:py-2 md:py-2.5 neu-button text-[var(--primary-700)] font-semibold text-xs sm:text-sm transition-all hover:scale-105 flex items-center justify-center"
                      style={{ marginRight: '10px' }}
                    >
                      Войти
                    </Link>
                    <Link
                      to="/register"
                      className="px-3 sm:px-4 md:px-5 py-1 sm:py-2 md:py-2.5 neu-button-primary text-white font-semibold text-xs sm:text-sm transition-all hover:scale-105 shadow-lg flex items-center justify-center"
                    >
                      Зарегистрироваться
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 relative" ref={menuRef}>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      title="Личный кабинет"
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all hover:scale-105 active:scale-95"
                      style={{
                        background: 'linear-gradient(145deg, #f0faf8, #ebf8f6)',
                        boxShadow: `
                          10px 10px 20px rgba(0, 0, 0, 0.15),
                          -10px -10px 20px rgba(255, 255, 255, 1),
                          inset 2px 2px 4px rgba(255, 255, 255, 0.5),
                          inset -2px -2px 4px rgba(0, 0, 0, 0.05),
                          0 0 0 1px rgba(255, 255, 255, 0.6)
                        `,
                        fontSize: '21px',
                      }}
                    >
                      <span>
                        👤
                      </span>
                    </button>

                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                          className="absolute right-0 top-full mt-3 p-3 min-w-[240px] neu-card z-[110]"
                          style={{
                            boxShadow: '10px 10px 20px rgba(0,0,0,0.15), -10px -10px 20px rgba(255,255,255,1)'
                          }}
                        >
                          <div className="px-3 py-2.5 border-b border-[var(--primary-100)] mb-2">
                            <p className="text-[11px] text-[var(--primary-500)] font-bold uppercase tracking-wider mb-1">👤 Аккаунт</p>
                            <p className="text-sm font-bold text-[var(--primary-900)] truncate">{user?.email || user?.username}</p>
                          </div>
                          <button
                            onClick={() => {
                              setShowUserMenu(false)
                              logout()
                            }}
                            className="w-full text-left px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 font-bold text-sm"
                          >
                            <span className="text-lg">🚪</span>
                            Выйти
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Butterfly Logo - Positioned near the mood section */}
            <div className="absolute left-0 right-0 z-50" style={{
              top: isNarrow
                ? 'max(0px, calc(40vh - 350px))'
                : isTransitionScreen
                  ? 'max(0px, calc(40vh - 280px))'
                  : isSmallScreen 
                    ? 'max(0px, calc(40vh - 250px))' 
                    : 'max(0px, calc(40vh - 380px))'
            }}>
              <motion.div 
                layoutId="main-butterfly"
                layout="position"
                className="w-full flex flex-col items-center justify-center"
                transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <span 
                  className="text-[var(--primary-500)] cursor-pointer select-none inline-block hover:scale-110 transition-transform duration-300" 
                  style={{ fontSize: '130px' }}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >🦋</span>
                <p 
                  className="text-[var(--primary-700)] text-[31px] sm:text-[33px] md:text-[37px] font-bold mb-4"
                  style={{ 
                    fontWeight: 700, 
                    marginTop: isNarrow 
                      ? 'calc(2rem - 35px)' 
                      : isTransitionScreen
                        ? 'calc(2rem - 25px)'
                        : isMediumScreen 
                          ? 'calc(2rem - 10px)' 
                          : 'calc(2rem + 5px)'
                  }}
                >
                  Как ты?
                </p>
              </motion.div>
            </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className="relative z-10 w-full flex justify-center py-4 sm:py-6 md:py-8 lg:py-12 xl:py-16 mt-[220px] sm:mt-[235px] md:mt-[10px] lg:mt-[30px] xl:mt-[53px] max-[530px]:mt-[180px]"
              >
                <MoodPage onMoodSaved={scrollToAnalytics} />
              </motion.div>
            </section>

            {/* Analytics Section - Bottom */}
            <section
              ref={analyticsSectionRef}
              className="min-h-screen w-full bg-[var(--primary-50)] py-4"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="w-full page-section-wrapper"
              >
                <AnalyticsPage onModalChange={setIsCalendarModalOpen} />
              </motion.div>
            </section>

            {/* Copyright Footer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full bg-[var(--primary-50)]" 
              style={{ paddingLeft: '15px', paddingBottom: '10px', paddingTop: '50px' }}
            >
              <p 
                className="text-[var(--primary-900)] font-medium tracking-wide"
                style={{
                  fontSize: isMobileScreen ? '12px' : '16px'
                }}
              >
                © Новый Я 2026
              </p>
            </motion.div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
