import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MoodPage } from './MoodPage'
import { AnalyticsPage } from './AnalyticsPage'

export const CombinedPage = () => {
  const moodSectionRef = useRef<HTMLDivElement>(null)
  const analyticsSectionRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState<'mood' | 'analytics'>('mood')
  const [isScrolling, setIsScrolling] = useState(false)

  // Scroll to analytics after mood is saved
  const scrollToAnalytics = () => {
    scrollToSection('analytics')
  }

  // Handle scroll to detect active section
  useEffect(() => {
    const handleScroll = () => {
      if (isScrolling) return
      
      const container = containerRef.current
      if (!container) return

      const scrollPosition = container.scrollTop
      const windowHeight = window.innerHeight

      // Determine which section is in view
      const moodOffset = moodSectionRef.current?.offsetTop || 0
      const analyticsOffset = analyticsSectionRef.current?.offsetTop || 0

      if (scrollPosition < analyticsOffset - windowHeight / 2) {
        setActiveSection('mood')
      } else {
        setActiveSection('analytics')
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true })
      handleScroll() // Initial check
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [isScrolling])

  // Smooth scroll to section
  const scrollToSection = (section: 'mood' | 'analytics') => {
    setIsScrolling(true)
    const targetRef = section === 'mood' ? moodSectionRef : analyticsSectionRef
    const target = targetRef.current
    const container = containerRef.current

    if (target && container) {
      const targetOffset = target.offsetTop
      container.scrollTo({
        top: targetOffset,
        behavior: 'smooth',
      })
      
      setActiveSection(section)
      
      // Reset scrolling flag after animation
      setTimeout(() => {
        setIsScrolling(false)
      }, 1000)
    }
  }

  return (
    <div className="relative h-screen overflow-hidden bg-[var(--primary-50)]">
      {/* Navigation Buttons - Fixed at bottom */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex gap-4"
      >
        <motion.button
          onClick={() => scrollToSection('mood')}
          className={`px-6 py-3 rounded-full font-semibold transition-all shadow-lg ${
            activeSection === 'mood'
              ? 'bg-[var(--primary-500)] text-white'
              : 'bg-white/90 backdrop-blur-sm text-[var(--primary-700)] hover:bg-white'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Настроение
        </motion.button>
        <motion.button
          onClick={() => scrollToSection('analytics')}
          className={`px-6 py-3 rounded-full font-semibold transition-all shadow-lg ${
            activeSection === 'analytics'
              ? 'bg-[var(--primary-500)] text-white'
              : 'bg-white/90 backdrop-blur-sm text-[var(--primary-700)] hover:bg-white'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Прогресс
        </motion.button>
      </motion.div>

      {/* Scrollable Container with Scroll Snap */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto overflow-x-hidden"
        style={{ 
          scrollBehavior: 'smooth',
          scrollSnapType: 'y mandatory',
        }}
      >
        {/* Mood Section - Top */}
        <section
          ref={moodSectionRef}
          className="min-h-screen w-full snap-start snap-always bg-[var(--primary-50)]"
          style={{ scrollSnapAlign: 'start' }}
        >
          <MoodPage onMoodSaved={scrollToAnalytics} />
        </section>

        {/* Analytics Section - Bottom */}
        <section
          ref={analyticsSectionRef}
          className="min-h-screen w-full snap-start snap-always bg-[var(--primary-50)]"
          style={{ scrollSnapAlign: 'start' }}
        >
          <AnalyticsPage />
        </section>
      </div>
    </div>
  )
}
