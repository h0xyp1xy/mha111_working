import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { analyticsApi, emotionalStateApi } from '../services/api'
import { SkeletonCard, SkeletonChart, SkeletonCalendar } from '../components/SkeletonLoader'
import { useAuth } from '../contexts/AuthContext'
import { getCookie } from '../utils/cookies'
import type { EmotionalState } from '../types'

interface AnalyticsPageProps {
  onModalChange?: (isOpen: boolean) => void
}

const AnalyticsPageComponent = ({ onModalChange }: AnalyticsPageProps = {}) => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [days, setDays] = useState(30)
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month')
  const hasTrackedMood = !!getCookie('mood_tracked')
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [notesPage, setNotesPage] = useState(0)
  const [calendarExpanded, setCalendarExpanded] = useState(false)
  const [selectedDay, setSelectedDay] = useState<{ date: Date; states: EmotionalState[]; dateStr: string } | null>(null)
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  )
  const [isSmallScreen, setIsSmallScreen] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 600 : false
  )
  const [isMediumScreen, setIsMediumScreen] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 770 : false
  )
  const [isVerySmallScreen, setIsVerySmallScreen] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 440 : false
  )
  const [isNarrowScreen, setIsNarrowScreen] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 880 : false
  )
  const [isExtraNarrowScreen, setIsExtraNarrowScreen] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 550 : false
  )
  const [isTinyScreen, setIsTinyScreen] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 450 : false
  )
  const [isMicroScreen, setIsMicroScreen] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 420 : false
  )
  const [isUltraSmallScreen, setIsUltraSmallScreen] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 400 : false
  )
  const NOTES_PER_PAGE = 3
  
  // Notify parent when modal opens/closes
  React.useEffect(() => {
    onModalChange?.(selectedDay !== null)
  }, [selectedDay, onModalChange])

  // Track mobile screen size
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
      setIsSmallScreen(window.innerWidth < 600)
      setIsMediumScreen(window.innerWidth < 770)
      setIsVerySmallScreen(window.innerWidth < 440)
      setIsNarrowScreen(window.innerWidth < 880)
      setIsExtraNarrowScreen(window.innerWidth < 550)
      setIsTinyScreen(window.innerWidth < 450)
      setIsMicroScreen(window.innerWidth < 420)
      setIsUltraSmallScreen(window.innerWidth < 400)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close modal on ESC key
  React.useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedDay(null)
      }
    }
    if (selectedDay !== null) {
      window.addEventListener('keydown', handleEsc)
    }
    return () => {
      window.removeEventListener('keydown', handleEsc)
    }
  }, [selectedDay])

  // Update days based on selected period is now handled directly in onClick for faster response

  const { data: dashboardData, error: dashboardError, isLoading: dashboardLoading } = useQuery({
    queryKey: ['analytics-dashboard', days],
    queryFn: () => analyticsApi.getDashboard(days),
    retry: 1,
    refetchOnWindowFocus: true,
    enabled: isAuthenticated, // Only fetch if authenticated
  })

  const { data: emotionalTimeline = [], error: timelineError, isLoading: timelineLoading, isFetching: timelineFetching } = useQuery({
    queryKey: ['emotional-timeline', days],
    queryFn: () => emotionalStateApi.getTimeline(days),
    retry: 1,
    refetchOnWindowFocus: true,
    enabled: isAuthenticated, // Only fetch if authenticated
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new data
  })

  const moodLabelMap: Record<string, string> = {
    happy: 'Хорошо',
    neutral: 'Нормально',
    sad: 'Не очень',
    anxious: 'Тревожно',
    angry: 'Злостно',
    calm: 'Спокойно',
  }

  // Color mapping for moods - DailyBean style
  const moodColorMap: Record<string, { bg: string; border: string; text: string }> = {
    happy: { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' }, // Yellow
    neutral: { bg: '#E5E7EB', border: '#9CA3AF', text: '#374151' }, // Gray
    sad: { bg: '#DBEAFE', border: '#60A5FA', text: '#1E40AF' }, // Blue
    anxious: { bg: '#FED7AA', border: '#FB923C', text: '#9A3412' }, // Orange
    angry: { bg: '#FEE2E2', border: '#F87171', text: '#991B1B' }, // Red
    calm: { bg: '#D1FAE5', border: '#34D399', text: '#065F46' }, // Green
  }

  // Filter data for the selected month
  const filteredDataForMonth = React.useMemo(() => {
    const firstDay = new Date(currentMonth.year, currentMonth.month, 1)
    const lastDay = new Date(currentMonth.year, currentMonth.month + 1, 0)
    lastDay.setHours(23, 59, 59, 999) // End of the last day
    
    return emotionalTimeline.filter((state: EmotionalState) => {
      if (!state.recorded_at) return false
      const stateDate = new Date(state.recorded_at)
      return stateDate >= firstDay && stateDate <= lastDay
    })
  }, [emotionalTimeline, currentMonth])

  // Process data for charts - filtered by selected month
  const sentimentData = React.useMemo(() => {
    // Mood weight map - different moods have different baseline values
    const moodWeightMap: Record<string, number> = {
      happy: 1.0,      // Positive: intensity stays 1-10
      calm: 0.8,       // Slightly positive: intensity becomes 0.8-8
      neutral: 0.0,    // Neutral: intensity becomes 0-0 (flat line at 0)
      sad: -1.0,       // Negative: intensity becomes -1 to -10
      anxious: -1.0,   // Negative: intensity becomes -1 to -10
      angry: -1.0,     // Negative: intensity becomes -1 to -10
    }
    
    // Use filtered data for line chart
    const sortedData = [...filteredDataForMonth].sort((a, b) => {
      const dateA = new Date(a.recorded_at || 0)
      const dateB = new Date(b.recorded_at || 0)
      return dateA.getTime() - dateB.getTime()
    })
    
    return sortedData.map((state) => {
      const date = new Date(state.recorded_at || '')
      const dateStr = date.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit' 
      })
      const fullDate = date.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: 'long',
        year: 'numeric'
      }).replace(/\s+г(ода|од|\.)?\s*/gi, '')
      const time = date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      })
      
      const rawIntensity = state.intensity || 5
      const moodWeight = moodWeightMap[state.mood] || 0
      
      // Calculate weighted intensity based on mood type
      let adjustedIntensity: number
      if (state.mood === 'neutral') {
        // Neutral mood stays at 0 regardless of intensity
        adjustedIntensity = 0
      } else {
        // Apply mood weight: positive moods go up, negative moods go down
        adjustedIntensity = rawIntensity * moodWeight
      }
      
      return {
        date: dateStr,
        fullDate: fullDate,
        time: time,
        intensity: adjustedIntensity,
        rawIntensity: rawIntensity, // Keep original for tooltip
        mood: state.mood,
        notes: state.notes || '',
      }
    })
  }, [filteredDataForMonth])
  
  // Mood to emoji mapping
  const moodEmojiMap: Record<string, string> = {
    happy: '😊',
    neutral: '😐',
    sad: '😢',
    anxious: '😰',
    angry: '😠',
    calm: '😌',
  }

  // Custom dot renderer with emoji for line chart
  const renderIconDot = (props: any) => {
    const { cx, cy, payload, index } = props
    if (cx === undefined || cy === undefined || !payload?.mood) return null
    const emoji = moodEmojiMap[payload.mood] || '😐'
    
    return (
      <g key={`emoji-dot-${index}-${cx}-${cy}`} style={{ pointerEvents: 'all' }}>
        <motion.text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fontSize="16"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          style={{ 
            userSelect: 'none', 
            cursor: 'pointer',
            filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.1))',
            pointerEvents: 'auto'
          }}
          whileHover={{ 
            y: -17,
            scale: 1.4,
            transition: { type: 'spring', stiffness: 500, damping: 15 }
          }}
        >
          {emoji}
        </motion.text>
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill="#4A9B8C"
          stroke="#fff"
          strokeWidth={2}
          style={{ pointerEvents: 'none' }}
        />
      </g>
    )
  }

  const moodCounts = React.useMemo(() => {
    return filteredDataForMonth.reduce((acc: Record<string, number>, state: EmotionalState) => {
    acc[state.mood] = (acc[state.mood] || 0) + 1
    return acc
  }, {})
  }, [filteredDataForMonth])

  // Get all entries with notes for the selected month
  const entriesWithNotes = React.useMemo(() => {
    return filteredDataForMonth
      .filter((state: EmotionalState) => state.notes && state.notes.trim().length > 0)
      .sort((a, b) => {
        const dateA = new Date(a.recorded_at || 0)
        const dateB = new Date(b.recorded_at || 0)
        return dateB.getTime() - dateA.getTime() // Most recent first
      })
      .map((state: EmotionalState) => ({
        id: state.id,
        date: new Date(state.recorded_at || '').toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }).replace(/\s+г(ода|од|\.)?\s*/gi, ''),
        time: new Date(state.recorded_at || '').toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        datetime: new Date(state.recorded_at || ''),
        mood: state.mood,
        moodLabel: moodLabelMap[state.mood] || state.mood,
        notes: state.notes || '',
        intensity: state.intensity || 0,
      }))
  }, [filteredDataForMonth])

  // Paginated notes
  const paginatedNotes = React.useMemo(() => {
    const startIndex = notesPage * NOTES_PER_PAGE
    return entriesWithNotes.slice(startIndex, startIndex + NOTES_PER_PAGE)
  }, [entriesWithNotes, notesPage])

  const totalNotesPages = Math.ceil(entriesWithNotes.length / NOTES_PER_PAGE)

  // Reset to first page when entries change
  React.useEffect(() => {
    setNotesPage(0)
  }, [entriesWithNotes.length])

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 }
      }
      return { year: prev.year, month: prev.month - 1 }
    })
  }

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 }
      }
      return { year: prev.year, month: prev.month + 1 }
    })
  }

  // Prepare calendar data for the selected month
  const calendarData = React.useMemo(() => {
    // Create a map of date -> emotional state
    const dateMap = new Map<string, EmotionalState[]>()
    emotionalTimeline.forEach((state: EmotionalState) => {
      const dateStr = state.recorded_at 
        ? new Date(state.recorded_at).toLocaleDateString('en-CA', { timeZone: 'Europe/Moscow' })
        : null
      if (dateStr) {
        if (!dateMap.has(dateStr)) {
          dateMap.set(dateStr, [])
        }
        dateMap.get(dateStr)!.push(state)
      }
    })
    
    // Get first and last day of the selected month
    const firstDay = new Date(currentMonth.year, currentMonth.month, 1)
    const lastDay = new Date(currentMonth.year, currentMonth.month + 1, 0)
    const daysInMonth = lastDay.getDate()
    
    // Generate all days in the month (in Moscow timezone)
    const calendarDays: Array<{ date: Date; states: EmotionalState[]; dateStr: string }> = []
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.year, currentMonth.month, day)
      const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'Europe/Moscow' })
      calendarDays.push({
        date,
        states: dateMap.get(dateStr) || [],
        dateStr,
      })
    }
    
    return { calendarDays, firstDay }
  }, [emotionalTimeline, currentMonth])

  // Show error messages if queries fail - but still show content
  const hasError = (dashboardError || timelineError) && isAuthenticated

  // Calculate statistics with enhanced analytics
  const stats = React.useMemo(() => {
    const totalEntries = filteredDataForMonth.length
    const avgIntensity = filteredDataForMonth.length > 0
      ? (filteredDataForMonth.reduce((sum, s) => sum + (s.intensity || 0), 0) / filteredDataForMonth.length).toFixed(1)
      : 0
    const mostCommonMood = Object.entries(moodCounts).length > 0 
      ? Object.entries(moodCounts).sort(([,a], [,b]) => (b as number) - (a as number))[0]
      : null
    const notesCount = entriesWithNotes.length
    
    // Enhanced stats from dashboard
    const wellnessScore = dashboardData?.wellness_score || null
    const avgSentiment = dashboardData?.average_sentiment || null
    const sentimentTrend = dashboardData?.sentiment_trend || null
    const moodTrend = dashboardData?.mood_trend || null
    const totalSessions = dashboardData?.total_sessions || 0
    const totalMessages = dashboardData?.total_messages || 0
    const riskEvents = dashboardData?.risk_events || 0

    return { 
      totalEntries, 
      avgIntensity, 
      mostCommonMood, 
      notesCount,
      wellnessScore,
      avgSentiment,
      sentimentTrend,
      moodTrend,
      totalSessions,
      totalMessages,
      riskEvents
    }
  }, [filteredDataForMonth, moodCounts, entriesWithNotes, dashboardData])

  // Always render - never return empty
  if (!isAuthenticated && !hasTrackedMood) {
    return (
      <div className="min-h-[300px] sm:min-h-[350px] md:min-h-[400px] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center bg-[var(--primary-50)]">
        <div className="neu-card p-4 sm:p-6 md:p-8 max-w-md w-full">
          <div className="text-5xl mb-4 sm:mb-5 md:mb-6">📊</div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--primary-900)] mb-3 sm:mb-4">📖 История настроения</h2>
          <p className="text-gray-600 mb-6 sm:mb-7 md:mb-8 leading-relaxed text-sm sm:text-base">
            Зайдите в аккаунт, чтобы сохранять историю своих эмоций, видеть графики прогресса и получать персональные рекомендации.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => navigate('/login')}
              className="neu-button-primary py-3 font-semibold text-white w-full rounded-xl shadow-lg transition-all hover:scale-105"
            >
              Войти
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="neu-button py-3 font-semibold text-[var(--primary-700)] w-full rounded-xl shadow-md transition-all hover:scale-105"
            >
              Создать аккаунт
            </button>
          </div>
        </div>
      </div>
    )
  }

  // If user is not authenticated but has tracked mood locally, show limited view/prompt
  const showLoginPrompt = !isAuthenticated && hasTrackedMood;

  return (
    <div className="min-h-screen pt-4 sm:pt-6 px-4 sm:px-6 md:px-8 bg-[var(--primary-50)]" style={{ paddingBottom: '10px' }}>
      <div className="max-w-[890px] mx-auto">
        {/* Sign up prompt for anonymous users who just tracked mood */}
        {showLoginPrompt && (
          <div className={`mb-8 neu-card bg-gradient-to-r from-[var(--primary-100)] to-[var(--primary-50)] border-l-4 border-[var(--primary-500)] flex flex-col sm:flex-row items-center justify-between shadow-md ${
            isTinyScreen ? 'p-2 gap-1.5' : 'p-3 sm:p-6 gap-2 sm:gap-4'
          }`}>
            <div>
              <h3 className={`font-bold text-[var(--primary-900)] mb-[10px] ${
                isTinyScreen ? 'text-[15px]' : 'text-[17px] sm:text-[23px]'
              }`}>💾 Сохраните свой результат!</h3>
            </div>
            <div className="flex items-center whitespace-nowrap gap-[15px]">
              <button 
                onClick={() => navigate('/register')}
                className={`neu-button-primary font-bold text-white shadow-lg transition-all hover:scale-105 rounded-xl flex items-center justify-center leading-none min-h-0 h-[36px] py-0 ${
                  isTinyScreen 
                    ? 'px-[23px] text-[10px]' 
                    : 'px-[25px] sm:px-[39px] sm:h-auto sm:py-2 text-[11px] sm:text-[16px]'
                }`}
              >
                Создать аккаунт
              </button>
              <button 
                onClick={() => navigate('/login')}
                className={`neu-button font-semibold text-[var(--primary-700)] shadow-sm transition-all hover:scale-105 rounded-xl flex items-center justify-center leading-none min-h-0 h-[36px] py-0 ${
                  isTinyScreen 
                    ? 'px-[23px] text-[10px]' 
                    : 'px-[25px] sm:px-[39px] sm:h-auto sm:py-2 text-[11px] sm:text-[16px]'
                }`}
              >
                Войти
              </button>
            </div>
          </div>
        )}
        
        {/* Error banner if there are errors (silent if anonymous as it's expected) */}
        {hasError && isAuthenticated && (
          <div className="mb-4 neu-card p-4 bg-yellow-50 border-l-4 border-yellow-400">
            <p className="text-sm text-yellow-800 font-bold">
              ⚠️ Есть проблемы с загрузкой данных.
            </p>
          </div>
        )}
        
        <div className="mb-[-24px] sm:mb-[-16px] flex flex-col items-start">
          <div className="max-w-[890px] w-full flex flex-col items-start gap-4">
            <div className="text-left">
              <h1 className="text-lg sm:text-3xl md:text-5xl font-extrabold text-[var(--primary-900)] tracking-tight mb-3">
                📊 Мой прогресс
              </h1>
            </div>
          </div>
        </div>
        
        {(dashboardLoading || timelineLoading) && !timelineFetching && (
          <div className="flex items-center justify-center min-h-[400px] mb-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-[var(--primary-200)] border-t-[var(--primary-500)] rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-[var(--primary-700)]">Загрузка...</p>
            </div>
          </div>
        )}

        {/* Analytics Cards - Two Rows */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          {/* Enhanced Sentiment Analysis */}
          {stats.avgSentiment !== null && (
            <div className="neu-card p-5 sm:p-6 flex flex-col">
              <h3 className="text-lg sm:text-xl font-bold text-[var(--primary-900)] mb-4">
                💬 Анализ эмоционального тона общения
              </h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="text-3xl sm:text-4xl cursor-default select-none inline-block"
                      whileHover={{ y: -10, scale: 1.2 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      {(stats.avgSentiment ?? 0) > 0.1 ? '😊' : (stats.avgSentiment ?? 0) < -0.1 ? '😢' : '😐'}
                    </motion.div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-[var(--primary-900)] mb-1">
                        {(stats.avgSentiment ?? 0) > 0.1 ? 'Положительный' : (stats.avgSentiment ?? 0) < -0.1 ? 'Отрицательный' : 'Нейтральный'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-4xl sm:text-5xl font-bold mb-2" style={{
                    color: (stats.avgSentiment ?? 0) > 0 ? '#10b981' : (stats.avgSentiment ?? 0) < 0 ? '#ef4444' : '#6b7280'
                  }}>
                    {(stats.avgSentiment ?? 0) > 0 ? '+' : ''}{typeof stats.avgSentiment === 'number' ? stats.avgSentiment.toFixed(2) : '0.00'}
                  </div>
                  {stats.sentimentTrend !== null && stats.sentimentTrend !== undefined && (
                    <div className={`text-sm font-semibold px-3 py-1 rounded-lg inline-block ${
                      stats.sentimentTrend > 0 
                        ? 'bg-green-100 text-green-700' 
                        : stats.sentimentTrend < 0 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {stats.sentimentTrend > 0 ? '↑' : stats.sentimentTrend < 0 ? '↓' : '→'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Charts - Always show */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          {/* Emotional Timeline */}
          <div className="neu-card py-3 pr-3 pl-0 sm:py-10 sm:pr-10 sm:pl-0 flex flex-col mb-10">
            <div className="flex items-center justify-between mb-4 pl-3 sm:pl-[30px]">
              <div>
                <h3 className="text-sm sm:text-xl md:text-2xl font-bold text-[var(--primary-900)] mb-0">📈 Эмоциональное путешествие</h3>
              </div>
              {/* Period Filter */}
              {isUltraSmallScreen ? (
                // Dropdown for very small screens (< 400px)
                <select
                  value={selectedPeriod}
                  onChange={(e) => {
                    const period = e.target.value as 'today' | 'week' | 'month' | 'all'
                    setSelectedPeriod(period)
                    const daysMap = { today: 1, week: 7, month: 30, all: 365 }
                    setDays(daysMap[period])
                  }}
                  className="font-semibold rounded-full px-3 py-2 text-sm text-[var(--primary-900)] border-none outline-none cursor-pointer"
                  style={{
                    borderRadius: '9999px',
                    boxShadow: `
                      inset 4px 4px 8px rgba(0, 0, 0, 0.15),
                      inset -4px -4px 8px rgba(255, 255, 255, 0.9),
                      0 0 0 1px rgba(255, 255, 255, 0.5)
                    `,
                    background: 'linear-gradient(145deg, rgba(240, 250, 248, 0.98), rgba(235, 248, 246, 0.98))',
                    height: '45px',
                    minWidth: '120px',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234A9B8C' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    paddingRight: '32px',
                  }}
                >
                  <option value="today">Сегодня</option>
                  <option value="week">Неделя</option>
                  <option value="month">Месяц</option>
                  <option value="all">Все</option>
                </select>
              ) : (
                // Button group for larger screens
                <div 
                  className={`flex items-stretch backdrop-blur-sm ${
                    isMicroScreen ? 'gap-0.5' : isTinyScreen ? 'gap-0.5' : isExtraNarrowScreen ? 'gap-1' : isNarrowScreen ? 'gap-1.5' : 'gap-2'
                  }`}
                  style={{
                    padding: '0px',
                    borderRadius: '9999px',
                    boxShadow: `
                      inset 4px 4px 8px rgba(0, 0, 0, 0.15),
                      inset -4px -4px 8px rgba(255, 255, 255, 0.9),
                      0 0 0 1px rgba(255, 255, 255, 0.5)
                    `,
                    background: 'linear-gradient(145deg, rgba(240, 250, 248, 0.98), rgba(235, 248, 246, 0.98))',
                    height: '45px',
                    width: isMicroScreen ? '180px' : isTinyScreen ? '200px' : isExtraNarrowScreen ? '220px' : isNarrowScreen ? '260px' : 'auto',
                    transform: isMicroScreen ? 'scale(0.9)' : 'scale(1)',
                    transformOrigin: 'right center',
                  }}
                >
                  {(['today', 'week', 'month', 'all'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => {
                        setSelectedPeriod(period)
                        // Update days immediately to trigger query refetch without useEffect delay
                        const daysMap = { today: 1, week: 7, month: 30, all: 365 }
                        setDays(daysMap[period])
                      }}
                      className={`
                        relative h-full flex items-center justify-center font-semibold rounded-full transition-none whitespace-nowrap flex-shrink
                        ${selectedPeriod === period 
                          ? 'text-[var(--primary-900)]' 
                          : 'text-[var(--primary-700)] hover:scale-105'
                        }
                      `}
                      style={{
                        paddingLeft: isMicroScreen ? '4px' : isTinyScreen ? '6px' : isExtraNarrowScreen ? '10px' : isNarrowScreen ? '15px' : '24px',
                        paddingRight: isMicroScreen ? '4px' : isTinyScreen ? '6px' : isExtraNarrowScreen ? '10px' : isNarrowScreen ? '15px' : '24px',
                        fontSize: isMicroScreen ? '6.5px' : isTinyScreen ? '7.5px' : isExtraNarrowScreen ? '8.5px' : isNarrowScreen ? '10px' : '16px',
                        ...(selectedPeriod === period ? {
                          background: 'linear-gradient(145deg, rgba(240, 250, 248, 0.98), rgba(235, 248, 246, 0.98))',
                          boxShadow: `
                            2px 2px 4px rgba(0, 0, 0, 0.12),
                            -2px -2px 4px rgba(255, 255, 255, 0.9),
                            0 0 0 1px rgba(255, 255, 255, 0.5)
                          `,
                        } : {})
                      }}
                    >
                      {period === 'today' ? 'Сегодня' : period === 'week' ? 'Неделя' : period === 'month' ? 'Месяц' : 'Все'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[680px] mt-4 relative">
              {(timelineLoading || timelineFetching) ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-[var(--primary-200)] border-t-[var(--primary-500)] rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold text-[var(--primary-700)]">Загрузка...</p>
                  </div>
                </div>
              ) : sentimentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sentimentData} margin={{ top: 30, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(0,0,0,0.7)" 
                      tick={{ fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      width={30}
                      stroke="rgba(0,0,0,0.7)"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        border: '1px solid rgba(0,0,0,0.2)',
                        borderRadius: '8px',
                        color: '#000',
                        maxWidth: '300px',
                      }}
                      content={(props: any) => {
                        if (!props.active || !props.payload || !props.payload[0]) return null
                        const payload = props.payload[0].payload
                        const mood = moodLabelMap[payload.mood] || payload.mood || ''
                        const notes = payload.notes
                        
                        return (
                          <div style={{
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            border: '1px solid rgba(0,0,0,0.2)',
                            borderRadius: '8px',
                            padding: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          }}>
                            <p style={{ margin: 0, marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                              {payload.fullDate}
                            </p>
                            {payload.time && (
                              <p style={{ margin: 0, marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                                {payload.time}
                            </p>
                            )}
                            <div style={{ margin: 0, marginBottom: notes ? '8px' : '0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{moodEmojiMap[payload.mood] || '😐'}</span>
                              <span>{mood}: {Math.round(payload.intensity)}</span>
                            </div>
                            {notes && (
                              <div style={{ 
                                marginTop: '8px', 
                                paddingTop: '8px', 
                                borderTop: '1px solid rgba(0,0,0,0.1)',
                                fontSize: '12px',
                                color: '#666',
                              }}>
                                <p style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{notes}</p>
                              </div>
                            )}
                          </div>
                        )
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="intensity"
                      stroke="#4A9B8C"
                      strokeWidth={2}
                      dot={renderIconDot}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <p className="text-xs mb-2">Нет данных для графика</p>
                </div>
              )}
            </div>
          </div>

          {/* DailyBean Style Calendar */}
          <div className="neu-card p-3 sm:p-8 flex flex-col">
          <div className="flex flex-row items-center justify-between gap-3 mb-4">
            <h3 className="text-sm sm:text-xl md:text-2xl font-bold text-[var(--primary-900)]">📅 Календарь эмоций</h3>
            <div 
              className={`flex items-center backdrop-blur-sm ${isSmallScreen ? 'gap-1.5' : 'gap-2'}`}
              style={{
                padding: isSmallScreen ? '3px' : '4px',
                borderRadius: '9999px',
                boxShadow: `
                  inset 8px 8px 16px rgba(0, 0, 0, 0.12),
                  inset -8px -8px 16px rgba(255, 255, 255, 0.9),
                  0 0 0 1px rgba(255, 255, 255, 0.5)
                `,
                background: 'linear-gradient(145deg, rgba(240, 250, 248, 0.98), rgba(235, 248, 246, 0.98))',
                height: isSmallScreen ? '34px' : '48px',
              }}
            >
              <button
                onClick={goToPreviousMonth}
                className="relative flex items-center justify-center rounded-full overflow-hidden group transition-all hover:scale-105 active:scale-95"
                style={{
                  width: isSmallScreen ? '28px' : '40px',
                  height: isSmallScreen ? '28px' : '40px',
                  background: 'linear-gradient(145deg, rgba(240, 250, 248, 0.98), rgba(235, 248, 246, 0.98))',
                  boxShadow: `
                    4px 4px 8px rgba(0, 0, 0, 0.15),
                    -4px -4px 8px rgba(255, 255, 255, 0.9),
                    0 0 0 1px rgba(255, 255, 255, 0.5)
                  `,
                  color: 'var(--primary-700)',
                }}
                aria-label="Предыдущий месяц"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={isSmallScreen ? 'h-3 w-3' : 'h-4 w-4'}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <span 
                className="font-bold text-[var(--primary-900)] capitalize text-center inline-flex items-center h-full"
                style={{
                  fontSize: isVerySmallScreen ? '8px' : isSmallScreen ? '10px' : '14px',
                  paddingLeft: isVerySmallScreen ? '8px' : isSmallScreen ? '11px' : '16px',
                  paddingRight: isVerySmallScreen ? '8px' : isSmallScreen ? '11px' : '16px',
                  minWidth: isVerySmallScreen ? '70px' : isSmallScreen ? '84px' : '120px',
                }}
              >
                {(() => {
                  const monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
                  const text = `${monthNames[currentMonth.month]} ${currentMonth.year}`
                  return text.replace(/\s*года?\s*\.?/gi, '').trim()
                })()}
              </span>
              <button
                onClick={goToNextMonth}
                className="relative flex items-center justify-center rounded-full overflow-hidden group transition-all hover:scale-105 active:scale-95"
                style={{
                  width: isSmallScreen ? '28px' : '40px',
                  height: isSmallScreen ? '28px' : '40px',
                  background: 'linear-gradient(145deg, rgba(240, 250, 248, 0.98), rgba(235, 248, 246, 0.98))',
                  boxShadow: `
                    4px 4px 8px rgba(0, 0, 0, 0.15),
                    -4px -4px 8px rgba(255, 255, 255, 0.9),
                    0 0 0 1px rgba(255, 255, 255, 0.5)
                  `,
                  color: 'var(--primary-700)',
                }}
                aria-label="Следующий месяц"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={isSmallScreen ? 'h-3 w-3' : 'h-4 w-4'}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
            
            <div className={`grid grid-cols-7 flex-1 ${isSmallScreen ? 'gap-0.5' : isMediumScreen ? 'gap-1' : 'gap-1.5 sm:gap-5'}`}>
              {/* Day labels */}
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                <div
                  key={day}
                  className={`text-center font-semibold text-gray-600 py-1 ${isSmallScreen ? 'text-[6px]' : isMediumScreen ? 'text-[7px]' : 'text-[9px] sm:text-sm'}`}
                >
                  {day}
                </div>
              ))}
              
              {/* Calendar days - very compact */}
              {(() => {
                const { calendarDays, firstDay } = calendarData
                const firstDayOfWeek = firstDay.getDay()
                const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1 // Monday = 0
                
                // Add empty cells for days before the first day of the month
                const emptyCells = []
                for (let i = 0; i < adjustedFirstDay; i++) {
                  emptyCells.push(
                    <div key={`empty-${i}`} className="aspect-square" />
                  )
                }
                
                return (
                  <>
                    {emptyCells}
                    {calendarDays.map((dayData) => {
                      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Moscow' })
                      const isToday = dayData.dateStr === today
                      const hasData = dayData.states.length > 0
                      const uniqueMoods = Array.from(new Set(dayData.states.map(s => s.mood)))
                      const primaryMood = uniqueMoods[0]
                      const moodColors = primaryMood ? moodColorMap[primaryMood] : null
                      
                      return (
                        <motion.button
                          key={dayData.dateStr}
                          onClick={() => hasData && setSelectedDay(dayData)}
                          className={`
                            aspect-square rounded-xl flex flex-col items-center justify-center
                            relative transition-all cursor-pointer
                            ${hasData ? 'hover:scale-105' : ''}
                            ${isSmallScreen ? 'p-1' : isMediumScreen ? 'p-1.5' : 'p-2'}
                          `}
                          style={{
                            backgroundColor: 'var(--primary-50)',
                            boxShadow: isToday 
                              ? `
                                inset 4px 4px 8px rgba(0, 0, 0, 0.15),
                                inset -4px -4px 8px rgba(255, 255, 255, 1)
                              `
                              : `
                                4px 4px 8px rgba(0, 0, 0, 0.12),
                                -4px -4px 8px rgba(255, 255, 255, 1)
                              `,
                            transform: isSmallScreen ? 'scale(0.7)' : isMediumScreen ? 'scale(0.85)' : 'scale(1)',
                            transformOrigin: 'center',
                          }}
                          whileHover={hasData ? { scale: 1.05 } : {}}
                          whileTap={hasData ? { scale: 0.95 } : {}}
                          title={hasData 
                            ? `${dayData.date.toLocaleDateString('ru-RU')}: ${dayData.states.map(s => {
                                const time = new Date(s.recorded_at || '').toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                                return `${moodLabelMap[s.mood]} (${time})`
                              }).join(', ')}`
                            : dayData.date.toLocaleDateString('ru-RU')
                          }
                        >
                          {/* Day number - top right */}
                          <div 
                            className={`absolute font-bold leading-tight ${
                              isSmallScreen 
                                ? 'top-1.5 right-2 text-[9px]' 
                                : isMediumScreen 
                                  ? 'top-2 right-2.5 text-[10px]' 
                                  : 'top-2.5 right-3 text-[11px] sm:text-sm'
                            }`}
                            style={hasData && moodColors ? { color: moodColors.text } : { color: 'var(--primary-700)' }}
                          >
                            {dayData.date.getDate()}
                          </div>
                          
                          {/* Mood icon - centered and outset */}
                          {hasData && primaryMood && (
                            <div 
                              className={`flex items-center justify-center rounded-full ${
                                isSmallScreen 
                                  ? 'mt-0 p-0.5' 
                                  : isMediumScreen 
                                    ? 'mt-0.5 p-1' 
                                    : 'mt-1 p-1.5'
                              }`}
                              style={{
                                backgroundColor: 'var(--primary-50)',
                                boxShadow: '3px 3px 6px rgba(0, 0, 0, 0.1), -3px -3px 6px rgba(255, 255, 255, 1)'
                              }}
                            >
                              <motion.span 
                                className={`leading-none inline-block ${
                                  isSmallScreen 
                                    ? 'text-[10px]' 
                                    : isMediumScreen 
                                      ? 'text-xs' 
                                      : 'text-sm sm:text-2xl'
                                }`}
                                whileHover={{ y: -5, scale: 1.2 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                              >
                                {moodEmojiMap[primaryMood] || '😐'}
                              </motion.span>
                            </div>
                          )}
                        </motion.button>
                      )
                    })}
                  </>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {entriesWithNotes.length > 0 && (
          <div className="neu-card p-4 sm:p-6 mt-8 sm:mt-10">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-[var(--primary-900)]">📝 Мои заметки</h3>
              {entriesWithNotes.length > NOTES_PER_PAGE && (
                <span className="text-xs sm:text-sm text-gray-600">
                  {notesPage + 1} из {totalNotesPages}
                </span>
              )}
            </div>
            <div className="relative">
              <div className="space-y-4 sm:space-y-6 overflow-hidden">
                {paginatedNotes.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>Заметок не найдено</p>
                  </div>
                ) : (
                  paginatedNotes.map((entry) => (
                    <div
                  key={entry.id}
                      className="neu-card-inset p-4 sm:p-5 hover:bg-[var(--primary-50)] transition-all rounded-xl"
                >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                          <motion.span 
                            className="text-3xl sm:text-4xl inline-block"
                            whileHover={{ y: -8, scale: 1.2 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                          >
                            {moodEmojiMap[entry.mood] || '😐'}
                          </motion.span>
                      <div>
                            <div className="font-semibold text-base sm:text-lg text-[var(--primary-900)]">
                          {entry.moodLabel}
                        </div>
                            <div className="text-xs sm:text-sm text-gray-600">
                          {entry.date} в {entry.time}
                        </div>
                      </div>
                    </div>
                        <div className="text-xs sm:text-sm text-gray-500 font-medium bg-[var(--primary-100)] px-3 py-1 rounded-full">
                          Чувство: {entry.intensity}/10
                    </div>
                  </div>
                      <div className="text-sm sm:text-base text-[var(--primary-900)] whitespace-pre-wrap border-t border-[var(--primary-200)] pt-3 sm:pt-4 mt-3 sm:mt-4 leading-relaxed">
                    {entry.notes}
                  </div>
            </div>
                  ))
                )}
                  </div>
              {entriesWithNotes.length > NOTES_PER_PAGE && (
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => setNotesPage((prev) => Math.max(0, prev - 1))}
                    disabled={notesPage === 0}
                    className="w-12 h-12 rounded-full neu-button flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Предыдущая страница"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6 text-[var(--primary-700)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setNotesPage((prev) => Math.min(totalNotesPages - 1, prev + 1))}
                    disabled={notesPage >= totalNotesPages - 1}
                    className="w-12 h-12 rounded-full neu-button flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Следующая страница"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6 text-[var(--primary-700)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                  </div>
              )}
            </div>
          </div>
        )}

        {/* Day Detail Modal - DailyBean style */}
        <AnimatePresence>
        {selectedDay && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[var(--primary-50)] rounded-3xl p-4 sm:p-6 md:p-8 max-w-[460px] min-w-[300px] sm:min-w-[340px] w-fit max-h-[90vh] overflow-y-auto relative shadow-2xl min-h-[300px] sm:min-h-[350px] md:min-h-[400px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedDay(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-[var(--primary-700)] hover:text-[var(--primary-900)] transition-all hover:scale-105 active:scale-95 text-2xl leading-none"
                style={{
                  background: 'linear-gradient(145deg, rgba(240, 250, 248, 0.98), rgba(235, 248, 246, 0.98))',
                  boxShadow: `
                    4px 4px 8px rgba(0, 0, 0, 0.15),
                    -4px -4px 8px rgba(255, 255, 255, 0.9),
                    0 0 0 1px rgba(255, 255, 255, 0.5)
                  `,
                }}
              >
                ×
              </button>
              <div className="py-4">
              <div className="mb-12 text-left -mt-4 ml-1">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--primary-900)] first-letter:uppercase opacity-70 whitespace-nowrap">
                    {selectedDay.date.toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      weekday: 'long'
                    }).replace(/\s+г(ода|од|\.)?\s*/gi, '')}
                  </h2>
                </div>

                {selectedDay.states.length > 0 ? (
                  <div className="flex flex-col items-center gap-6 mt-12 w-full">
                    {selectedDay.states.map((state, index) => {
                      const moodColors = moodColorMap[state.mood] || moodColorMap.neutral
                      const time = state.recorded_at 
                        ? new Date(state.recorded_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                        : ''
                      
                      // Calculate weighted intensity (same as graph)
                      const moodWeightMap: Record<string, number> = {
                        happy: 1.0,
                        calm: 0.8,
                        neutral: 0.0,
                        sad: -1.0,
                        anxious: -1.0,
                        angry: -1.0,
                      }
                      const rawIntensity = state.intensity || 5
                      const moodWeight = moodWeightMap[state.mood] || 0
                      const adjustedIntensity = state.mood === 'neutral' ? 0 : Math.round(rawIntensity * moodWeight)

                      return (
                        <div
                          key={state.id || index}
                          className="p-5 rounded-3xl flex flex-col w-[340px] sm:w-[380px]"
                          style={{
                            backgroundColor: 'var(--primary-50)',
                            boxShadow: `
                              5px 5px 10px rgba(0, 0, 0, 0.12),
                              -5px -5px 10px rgba(255, 255, 255, 1)
                            `,
                            cursor: 'default',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.cursor = 'pointer'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.cursor = 'default'
                          }}
                        >
                          <div className="flex flex-row items-center justify-between w-full mb-3">
                            <div className="flex items-center gap-3">
                              <div 
                                className="p-2.5 rounded-full"
                                style={{ 
                                  backgroundColor: 'var(--primary-50)',
                                  boxShadow: `
                                    4px 4px 8px rgba(0, 0, 0, 0.1),
                                    -4px -4px 8px rgba(255, 255, 255, 1)
                                  `
                                }}
                              >
                                <motion.span 
                                  className="text-3xl leading-none block"
                                  whileHover={{ y: -8, scale: 1.2 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                                >
                                  {moodEmojiMap[state.mood] || '😐'}
                                </motion.span>
                              </div>

                              <div className="flex flex-col">
                                <div className="font-bold text-base leading-tight" style={{ color: moodColors.text }}>
                                  {moodLabelMap[state.mood]}
                                </div>
                                {time && (
                                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                    {time}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end">
                              <div className="text-[8px] uppercase tracking-wider text-gray-400 font-bold leading-none mb-1">Чувство</div>
                              <div 
                                className="font-bold text-xl leading-none"
                                style={{ 
                                  color: moodColors.text,
                                }}
                              >
                                {adjustedIntensity}
                              </div>
                            </div>
                          </div>

                          {state.notes && (
                            <div 
                              className="w-full text-left text-xs leading-relaxed whitespace-pre-wrap font-medium italic pt-3 border-t border-gray-200/40"
                              style={{ 
                                color: 'var(--primary-800)',
                                opacity: 0.8
                              }}
                            >
                              "{state.notes}"
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">Нет записей за этот день</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export const AnalyticsPage = React.memo(AnalyticsPageComponent)

