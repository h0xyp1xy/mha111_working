import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { emotionalStateApi } from '../services/api'
import { useStore } from '../store/useStore'
import { useToast } from '../components/Toast'
import { useAuth } from '../contexts/AuthContext'
import { setCookie, getCookie } from '../utils/cookies'

const ASSESSMENT_QUESTIONS = [
  {
    id: 1,
    question: 'Как ты?',
    type: 'choice',
    options: [
      { value: 'excellent', label: 'Прекрасно', emoji: '😄' },
      { value: 'good', label: 'Хорошо', emoji: '😊' },
      { value: 'neutral', label: 'Обычно', emoji: '😐' },
      { value: 'bad', label: 'Непросто', emoji: '😢' },
      { value: 'very_bad', label: 'Сложно', emoji: '😰' },
    ],
  },
  // {
  //   id: 2,
  //   question: 'Что тебя беспокоит?',
  //   type: 'choice',
  //   options: [
  //     { value: 'work', label: 'Работа/Учеба', icon: WorkIcon },
  //     { value: 'relationships', label: 'Отношения', icon: HeartIcon },
  //     { value: 'health', label: 'Здоровье', icon: HealthIcon },
  //     { value: 'finance', label: 'Финансы', icon: MoneyIcon },
  //     { value: 'future', label: 'Будущее', icon: FutureIcon },
  //     { value: 'family', label: 'Семья', icon: FamilyIcon },
  //     { value: 'nothing', label: 'Ничего', icon: CheckIcon },
  //   ],
  // },
  // {
  //   id: 3,
  //   question: 'Насколько ты напряжен?',
  //   type: 'scale',
  //   minLabel: 'Совсем нет стресса',
  //   maxLabel: 'Очень сильный стресс',
  // },
  // {
  //   id: 4,
  //   question: 'Как ты спишь?',
  //   type: 'choice',
  //   options: [
  //     { value: 'excellent', label: 'Прекрасно', icon: SleepIcon },
  //     { value: 'good', label: 'Хорошо', icon: SleepIcon },
  //     { value: 'fair', label: 'Обычно', icon: NeutralIcon },
  //     { value: 'poor', label: 'Непросто', icon: SadIcon },
  //     { value: 'very_poor', label: 'Сложно', icon: AnxiousIcon },
  //   ],
  // },
  // {
  //   id: 5,
  //   question: 'Сколько у тебя энергии?',
  //   type: 'scale',
  //   minLabel: 'Очень низкий',
  //   maxLabel: 'Очень высокий',
  // },
  // {
  //   id: 6,
  //   question: 'Что ты хочешь улучшить?',
  //   type: 'choice',
  //   options: [
  //     { value: 'health', label: 'Здоровье', icon: HealthIcon },
  //     { value: 'relationships', label: 'Отношения', icon: HeartIcon },
  //     { value: 'career', label: 'Карьера', icon: WorkIcon },
  //     { value: 'mood', label: 'Настроение', icon: HappyIcon },
  //     { value: 'habits', label: 'Привычки', icon: CheckIcon },
  //     { value: 'self_esteem', label: 'Самооценка', icon: HappyIcon },
  //     { value: 'nothing', label: 'Ничего', icon: CheckIcon },
  //   ],
  // },
  // {
  //   id: 7,
  //   question: 'Как ты справляешься с трудностями?',
  //   type: 'choice',
  //   options: [
  //     { value: 'talking', label: 'Разговариваю с кем-то', icon: ChatIcon },
  //     { value: 'sports', label: 'Занимаюсь спортом', icon: EnergyIcon },
  //     { value: 'hobbies', label: 'Хобби', icon: HappyIcon },
  //     { value: 'meditation', label: 'Медитация/Релаксация', icon: CalmIcon },
  //     { value: 'work', label: 'Ухожу в работу', icon: WorkIcon },
  //     { value: 'avoid', label: 'Избегаю проблемы', icon: SadIcon },
  //   ],
  // },
  // {
  //   id: 8,
  //   question: 'Что тебя радует?',
  //   type: 'choice',
  //   options: [
  //     { value: 'family', label: 'Семья', icon: FamilyIcon },
  //     { value: 'friends', label: 'Друзья', icon: HeartIcon },
  //     { value: 'hobbies', label: 'Хобби', icon: HappyIcon },
  //     { value: 'work', label: 'Работа', icon: WorkIcon },
  //     { value: 'sports', label: 'Спорт', icon: EnergyIcon },
  //     { value: 'travel', label: 'Путешествия', icon: FutureIcon },
  //     { value: 'nothing', label: 'Ничего', icon: NeutralIcon },
  //   ],
  // },
]

const MOODS = [
  { emoji: '😊', label: 'Хорошо', value: 'happy' },
  { emoji: '😐', label: 'Нормально', value: 'neutral' },
  { emoji: '😢', label: 'Не очень', value: 'sad' },
  { emoji: '😰', label: 'Тревожно', value: 'anxious' },
  { emoji: '😠', label: 'Злостно', value: 'angry' },
  { emoji: '😌', label: 'Спокойно', value: 'calm' },
]

// Mood to emoji mapping
const moodEmojiMap: Record<string, string> = {
  happy: '😊',
  neutral: '😐',
  sad: '😢',
  anxious: '😰',
  angry: '😠',
  calm: '😌',
}

// Функция для получения поддерживающего сообщения после сохранения настроения
const getSuccessMessage = (mood: string | null): { title: string; message: string } => {
  if (!mood) {
    return {
      title: 'Готово!',
      message: 'Твое настроение сохранено.'
    }
  }

  switch (mood) {
    case 'happy':
      return {
        title: 'Прекрасно!',
        message: 'Ты на волне. Продолжай в том же духе!'
      }
    case 'neutral':
      return {
        title: 'Принято',
        message: 'Каждый день уникален. Это нормально.'
      }
    case 'sad':
      return {
        title: 'Не грусти',
        message: 'Я с тобой.'
      }
    case 'anxious':
      return {
        title: 'Дыши',
        message: 'Тревога пройдет. Ты сильнее, чем думаешь.'
      }
    case 'angry':
      return {
        title: 'Понимаю',
        message: 'Пауза поможет. Ты найдешь решение.'
      }
    case 'calm':
      return {
        title: 'Гармония',
        message: 'Спокойствие — твоя сила.'
      }
    default:
      return {
        title: 'Готово!',
        message: 'Твое настроение сохранено.'
      }
  }
}

// Функция для получения описания настроения
const getMoodDescription = (mood: string | null): string => {
  if (!mood) return ''
  
  switch (mood) {
    case 'happy':
      return 'Позитивное состояние, чувство радости и удовлетворения'
    case 'neutral':
      return 'Нейтральное состояние, обычное самочувствие'
    case 'sad':
      return 'Негативное состояние, чувство грусти и печали'
    case 'anxious':
      return 'Состояние тревоги и беспокойства'
    case 'angry':
      return 'Состояние злости и раздражения'
    case 'calm':
      return 'Спокойное и умиротворенное состояние'
    default:
      return ''
  }
}

// Функция для получения метки шкалы в зависимости от настроения и интенсивности
const getIntensityLabel = (mood: string | null, intensity: number): string => {
  if (!mood) return ''
  
  switch (mood) {
    case 'happy':
      if (intensity <= 2) return 'Немного Хорошо'
      if (intensity <= 4) return 'Хорошо'
      if (intensity <= 6) return 'Очень Хорошо'
      if (intensity <= 8) return 'Отлично'
      return 'Превосходно'
    
    case 'neutral':
      if (intensity <= 2) return 'Слегка Ниже Нормы'
      if (intensity <= 4) return 'Немного Ниже Нормы'
      if (intensity <= 6) return 'Нормально'
      if (intensity <= 8) return 'Немного Выше Нормы'
      return 'Выше Нормы'
    
    case 'sad':
      if (intensity <= 2) return 'Слегка Плохо'
      if (intensity <= 4) return 'Плохо'
      if (intensity <= 6) return 'Очень Плохо'
      if (intensity <= 8) return 'Очень Тяжело'
      return 'Невыносимо'
    
    case 'anxious':
      if (intensity <= 2) return 'Легкое Беспокойство'
      if (intensity <= 4) return 'Беспокойство'
      if (intensity <= 6) return 'Тревожно'
      if (intensity <= 8) return 'Сильная Тревога'
      return 'Паника'
    
    case 'angry':
      if (intensity <= 2) return 'Легкое Раздражение'
      if (intensity <= 4) return 'Раздражение'
      if (intensity <= 6) return 'Злость'
      if (intensity <= 8) return 'Сильная Злость'
      return 'Ярость'
    
    case 'calm':
      if (intensity <= 2) return 'Немного Спокойно'
      if (intensity <= 4) return 'Спокойно'
      if (intensity <= 6) return 'Очень Спокойно'
      if (intensity <= 8) return 'Полное Спокойствие'
      return 'Глубокая Безмятежность'
    
    default:
      return 'Выберите настроение'
  }
}

// Функция для получения всех меток шкалы для настроения
const getScaleLabels = (mood: string | null): string[] => {
  if (!mood) return []
  
  switch (mood) {
    case 'happy':
      return ['Немного Хорошо', 'Хорошо', 'Очень Хорошо', 'Отлично', 'Превосходно']
    case 'neutral':
      return ['Слегка Ниже Нормы', 'Немного Ниже Нормы', 'Нормально', 'Немного Выше Нормы', 'Выше Нормы']
    case 'sad':
      return ['Слегка Плохо', 'Плохо', 'Очень Плохо', 'Очень Тяжело', 'Невыносимо']
    case 'anxious':
      return ['Легкое Беспокойство', 'Беспокойство', 'Тревожно', 'Сильная Тревога', 'Паника']
    case 'angry':
      return ['Легкое Раздражение', 'Раздражение', 'Злость', 'Сильная Злость', 'Ярость']
    case 'calm':
      return ['Немного Спокойно', 'Спокойно', 'Очень Спокойно', 'Полное Спокойствие', 'Глубокая Безмятежность']
    default:
      return []
  }
}

// Функция для получения объяснений уровней интенсивности
const getScaleExplanations = (mood: string | null): string[] => {
  if (!mood) return []
  
  switch (mood) {
    case 'happy':
      return [
        'Легкое чувство удовлетворения',
        'Приятное состояние',
        'Хорошее настроение',
        'Отличное самочувствие',
        'Пик позитивных эмоций'
      ]
    case 'neutral':
      return [
        'Чуть ниже обычного',
        'Немного не в норме',
        'Стандартное состояние',
        'Чуть лучше обычного',
        'Выше стандартного уровня'
      ]
    case 'sad':
      return [
        'Легкая грусть',
        'Плохое настроение',
        'Сильное расстройство',
        'Очень тяжело',
        'Критическое состояние'
      ]
    case 'anxious':
      return [
        'Легкое волнение',
        'Чувство беспокойства',
        'Выраженная тревога',
        'Сильное беспокойство',
        'Паническое состояние'
      ]
    case 'angry':
      return [
        'Легкое недовольство',
        'Чувство раздражения',
        'Выраженная злость',
        'Сильный гнев',
        'Пик агрессии'
      ]
    case 'calm':
      return [
        'Легкое умиротворение',
        'Спокойное состояние',
        'Глубокое спокойствие',
        'Полная гармония',
        'Абсолютная безмятежность'
      ]
    default:
      return []
  }
}

interface MoodPageProps {
  onMoodSaved?: () => void
}

export const MoodPage = ({ onMoodSaved }: MoodPageProps = {}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { isAuthenticated } = useAuth()
  const [selectedMood, setSelectedMood] = useState<string | null>(
    (location.state as any)?.quickMood || null
  )
  const [intensity, setIntensity] = useState(8)
  const [notes, setNotes] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState<{ title: string; message: string; mood?: string } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showAssessment, setShowAssessment] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<number, string>>({})
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [scaleValue, setScaleValue] = useState(5)
  const [savedMoodData, setSavedMoodData] = useState<{ mood: string; intensity: number; notes: string } | null>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const { setCurrentSession } = useStore()
  const queryClient = useQueryClient()
  const [isNarrowMoodGrid, setIsNarrowMoodGrid] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 530
  )

  useEffect(() => {
    const onResize = () => setIsNarrowMoodGrid(window.innerWidth < 530)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Close page on ESC key

  const handleSliderInteraction = useCallback((clientY: number) => {
    if (!sliderRef.current) return
    
    const rect = sliderRef.current.getBoundingClientRect()
    const y = clientY - rect.top
    const height = rect.height
    const percentage = Math.max(0, Math.min(1, 1 - (y / height))) // Invert so top is 10, bottom is 1
    const newIntensity = Math.round(percentage * 9) + 1 // Scale to 1-10
    setIntensity(newIntensity)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    handleSliderInteraction(e.clientY)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleSliderInteraction(e.clientY)
  }, [handleSliderInteraction])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    handleSliderInteraction(e.touches[0].clientY)
  }

  const handleTouchMove = useCallback((e: TouchEvent) => {
    handleSliderInteraction(e.touches[0].clientY)
  }, [handleSliderInteraction])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleTouchEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  // Close page on ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        navigate('/')
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => {
      window.removeEventListener('keydown', handleEsc)
    }
  }, [navigate])

  const createEmotionalStateMutation = useMutation({
    mutationFn: (data: { mood: string; intensity: number; notes: string }) => {
      const payload: any = {
        mood: data.mood,
        intensity: data.intensity,
        notes: data.notes || '',
      }
      console.log('Creating emotional state with payload:', payload)
      return emotionalStateApi.create(payload)
    },
    onSuccess: (data, variables) => {
      // Invalidate analytics queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['analytics-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['emotional-timeline'] })
      
      // Save to cookies if not authenticated or first time tracking
      if (!isAuthenticated || !getCookie('mood_tracked')) {
        setCookie('last_mood', variables.mood, 7)
        setCookie('mood_tracked', 'true', 365)
        console.log('Mood saved to cookies for first-time/anonymous use')
      }
      
      // Save mood data for later use in assessment
      setSavedMoodData(variables)
      
      // Show success message with supportive text
      const message = getSuccessMessage(variables.mood)
      setSuccessMessage({ ...message, mood: variables.mood })
      setShowSuccessMessage(true)
      
      // Wait 4 seconds then scroll to analytics
      setTimeout(() => {
        if (onMoodSaved) {
          onMoodSaved()
        }
      }, 4000)

      // Automatically hide success message after 4 seconds
      setTimeout(() => {
        setShowSuccessMessage(false)
        setSelectedMood(null)
      }, 4000)
    },
    onError: (error: any) => {
      console.error('Error recording emotional state:', error)
      console.error('Error response:', error?.response?.data)
      console.error('Error status:', error?.response?.status)
      
      let errorMessage = 'Что-то пошло не так. Попробуй ещё раз, когда будешь готов.'
      
      if (error?.response?.data) {
        const data = error.response.data
        // Handle field-specific errors
        if (data.mood && Array.isArray(data.mood)) {
          errorMessage = `Ошибка настроения: ${data.mood[0]}`
        } else if (data.intensity && Array.isArray(data.intensity)) {
          errorMessage = `Ошибка интенсивности: ${data.intensity[0]}`
        } else if (data.detail) {
          errorMessage = data.detail
        } else if (data.error) {
          errorMessage = data.error
        } else if (typeof data === 'string') {
          errorMessage = data
        } else if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
          errorMessage = data.non_field_errors[0]
        }
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
    },
  })

  // Handle mood selection - auto-submit on click
  const handleMoodSelect = (mood: string) => {
    // Set mood as selected first to show inset state
    setSelectedMood(mood)
    
    // If not authenticated, save intent and redirect to register smoothly
    if (!isAuthenticated) {
      setCookie('last_mood', mood, 7)
      setCookie('mood_tracked', 'true', 365)
      
      // Short delay to show the click animation before redirect
      setTimeout(() => {
        navigate('/register', { 
          state: { 
            pendingMood: mood,
            from: location.pathname 
          } 
        })
      }, 400)
      return
    }

    // Auto-submit after selecting mood for authenticated users
    createEmotionalStateMutation.mutate({
      mood: mood,
      intensity: 8, // Default intensity
      notes: '', // Empty notes
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMood) {
      alert('Пожалуйста, выбери настроение')
      return
    }

    if (!isAuthenticated) {
      setCookie('last_mood', selectedMood, 7)
      setCookie('mood_tracked', 'true', 365)
      
      // Smooth redirect to register
      setTimeout(() => {
        navigate('/register', { 
          state: { 
            pendingMood: selectedMood,
            from: location.pathname 
          } 
        })
      }, 400)
      return
    }

    createEmotionalStateMutation.mutate({
      mood: selectedMood,
      intensity: 8, // Default intensity
      notes: '', // Empty notes
    })
  }

  const processAssessmentMutation = useMutation({
    mutationFn: () => {
      // Убрана отправка в беседу с психотерапевтом
      // Просто возвращаем успешный результат без отправки
      return Promise.resolve({ success: true })
    },
    onSuccess: () => {
      // Call callback if provided, otherwise navigate
      if (onMoodSaved) {
        setTimeout(() => {
          onMoodSaved()
        }, 1000)
      } else {
        setTimeout(() => {
          navigate('/analytics')
        }, 1000)
      }
    },
    onError: (error) => {
      console.error('Error submitting assessment:', error)
      // Call callback if provided, otherwise navigate
      if (onMoodSaved) {
        setTimeout(() => {
          onMoodSaved()
        }, 1000)
      } else {
        setTimeout(() => {
          navigate('/analytics')
        }, 1000)
      }
    },
  })

  const handleChoiceSelect = (value: string) => {
    setSelectedChoice(value)
    setAssessmentAnswers({ ...assessmentAnswers, [currentQuestion.id]: value })
  }

  const handleAssessmentNext = () => {
    // Validate and save current answer
    if (currentQuestion.type === 'scale') {
      setAssessmentAnswers({ ...assessmentAnswers, [currentQuestion.id]: scaleValue.toString() })
    } else if (currentQuestion.type === 'choice') {
      if (!selectedChoice) {
        alert('Пожалуйста, выбери вариант ответа.')
        return
      }
      setAssessmentAnswers({ ...assessmentAnswers, [currentQuestion.id]: selectedChoice })
    } else {
      if (!currentAnswer.trim()) {
        alert('Пожалуйста, ответь на вопрос перед продолжением.')
        return
      }
      setAssessmentAnswers({ ...assessmentAnswers, [currentQuestion.id]: currentAnswer })
    }

    const isLastQuestion = currentQuestionIndex === ASSESSMENT_QUESTIONS.length - 1
    if (isLastQuestion) {
      handleAssessmentSubmit()
    } else {
      // Move to next question
      const nextIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(nextIndex)
      const nextQuestion = ASSESSMENT_QUESTIONS[nextIndex]
      // Reset state for next question
      setSelectedChoice(null)
      // Load saved answer if exists
      if (nextQuestion.type === 'choice') {
        const savedAnswer = assessmentAnswers[nextQuestion.id]
        if (savedAnswer) {
          setSelectedChoice(savedAnswer)
        }
        setCurrentAnswer('')
      } else if (nextQuestion.type === 'scale') {
        setScaleValue(parseInt(assessmentAnswers[nextQuestion.id] || '5', 10))
        setCurrentAnswer('')
      } else {
        setCurrentAnswer(assessmentAnswers[nextQuestion.id] || '')
      }
    }
  }

  const handleAssessmentSubmit = async () => {
    // Убрана отправка данных в беседу с психотерапевтом
    // Просто завершаем оценку и переходим на аналитику
    // No need for manual loading state - mutation handles it via isPending
    processAssessmentMutation.mutate()
  }

  const handleAssessmentBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  // Initialize question state when question changes
  useEffect(() => {
    if (showAssessment && currentQuestionIndex >= 0 && currentQuestionIndex < ASSESSMENT_QUESTIONS.length) {
      const question = ASSESSMENT_QUESTIONS[currentQuestionIndex]
      if (question.type === 'choice') {
        const savedAnswer = assessmentAnswers[question.id]
        if (savedAnswer) {
          setSelectedChoice(savedAnswer)
        } else {
          setSelectedChoice(null)
        }
        setCurrentAnswer('')
      } else if (question.type === 'scale') {
        setScaleValue(parseInt(assessmentAnswers[question.id] || '5', 10))
        setCurrentAnswer('')
      } else {
        setCurrentAnswer(assessmentAnswers[question.id] || '')
      }
    }
  }, [currentQuestionIndex, showAssessment, assessmentAnswers])

  const currentQuestion = ASSESSMENT_QUESTIONS[currentQuestionIndex]
  const assessmentProgress = ((currentQuestionIndex + 1) / ASSESSMENT_QUESTIONS.length) * 100

  // Assessment Screen
  if (showAssessment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-[var(--primary-50)]">
        <div className="max-w-7xl w-full">
          {/* Progress Bar */}
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm sm:text-base font-medium text-[var(--primary-700)]">
                Вопрос {currentQuestionIndex + 1} из {ASSESSMENT_QUESTIONS.length}
              </span>
              <span className="text-sm sm:text-base font-bold text-[var(--primary-500)]">
                {Math.round(assessmentProgress)}%
              </span>
            </div>
            <div className="neu-card-inset w-full h-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--primary-400)] to-[var(--primary-500)] transition-all duration-500 ease-out rounded-full shadow-inner"
                style={{ width: `${assessmentProgress}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="neu-card p-6 sm:p-8 mb-6 shadow-lg">
            <div className="flex items-start gap-4 mb-6 sm:mb-8">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary-400)] to-[var(--primary-600)] flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md flex-shrink-0">
                {currentQuestionIndex + 1}
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--primary-900)] flex-1 leading-tight pt-1">
                {currentQuestion.question}
              </h2>
            </div>

            {currentQuestion.type === 'scale' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-sm sm:text-base font-medium text-[var(--primary-600)]">
                    {'minLabel' in currentQuestion ? currentQuestion.minLabel : 'Низкий'}
                  </span>
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--primary-400)] to-[var(--primary-600)] flex items-center justify-center shadow-lg mb-2">
                      <span className="text-4xl sm:text-5xl font-bold text-white">{scaleValue}</span>
                    </div>
                    <span className="text-sm text-[var(--primary-600)] font-medium">из 10</span>
                  </div>
                  <span className="text-sm sm:text-base font-medium text-[var(--primary-600)]">
                    {'maxLabel' in currentQuestion ? currentQuestion.maxLabel : 'Высокий'}
                  </span>
                </div>
                <div className="neu-card-inset p-5 sm:p-6 rounded-xl">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={scaleValue}
                    onChange={(e) => setScaleValue(parseInt(e.target.value, 10))}
                    className="w-full h-3 bg-transparent rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, var(--primary-500) 0%, var(--primary-500) ${((scaleValue - 1) / 9) * 100}%, var(--primary-200) ${((scaleValue - 1) / 9) * 100}%, var(--primary-200) 100%)`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs sm:text-sm font-medium text-[var(--primary-600)] px-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <span key={num} className={num === scaleValue ? 'text-[var(--primary-700)] font-bold' : ''}>
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            ) : currentQuestion.type === 'choice' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {currentQuestion.options?.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleChoiceSelect(option.value)}
                      className={`p-4 sm:p-5 rounded-xl transition-all duration-300 flex flex-col items-center justify-center ${
                        selectedChoice === option.value
                          ? 'bg-gradient-to-br from-[var(--primary-400)] to-[var(--primary-600)] text-white shadow-xl'
                          : 'neu-button-inset text-[var(--primary-900)]'
                      }`}
                    >
                      <span className="text-4xl mb-2">
                        {option.emoji}
                      </span>
                      <div className={`text-sm sm:text-base font-medium transition-colors duration-300 ${
                        selectedChoice === option.value ? 'text-white' : 'text-[var(--primary-900)]'
                      }`}>
                        {option.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative">
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder={'placeholder' in currentQuestion ? currentQuestion.placeholder : "Поделись своими мыслями и чувствами..."}
                  className="w-full min-h-[200px] sm:min-h-[220px] p-5 neu-input rounded-xl resize-none text-[var(--primary-900)] placeholder-[var(--primary-400)] text-base leading-relaxed focus:ring-2 focus:ring-[var(--primary-300)] transition-all shadow-inner"
                  rows={8}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {currentAnswer.length} символов
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4">
            <button
              onClick={handleAssessmentBack}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3.5 neu-button disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-[var(--primary-700)] min-w-[120px] rounded-xl shadow-md"
            >
              ← Назад
            </button>
            <button
              onClick={handleAssessmentNext}
              disabled={
                processAssessmentMutation.isPending || 
                (currentQuestion.type === 'text' && !currentAnswer.trim()) ||
                (currentQuestion.type === 'choice' && !selectedChoice)
              }
              className="px-6 py-3.5 neu-button-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-white min-w-[180px] flex items-center justify-center gap-2 rounded-xl shadow-lg"
            >
              {processAssessmentMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Обработка...</span>
                </>
              ) : currentQuestionIndex === ASSESSMENT_QUESTIONS.length - 1 ? (
                <>
                  <span>Готово</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              ) : (
                <>
                  <span>Далее</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Success Screen - Show supportive message after saving mood
  return (
    <div className="flex flex-col items-center bg-[var(--primary-50)]">
      <div className="w-full" style={{ maxWidth: '800px' }}>
        <AnimatePresence mode="wait">
          {showSuccessMessage && successMessage ? (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.4,
                ease: [0.23, 1, 0.32, 1]
              }}
              className="premium-card p-4 sm:p-6 md:p-8 text-center rounded-3xl relative overflow-hidden"
            >
            {/* Success Icon with mood emoji */}
            <div className="mb-8 flex justify-center relative">
              <span className="text-5xl sm:text-6xl">
                {successMessage.mood ? moodEmojiMap[successMessage.mood] || '✓' : '✓'}
              </span>
            </div>

            {/* Success Title with gradient text */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 mt-4 gradient-text" style={{ lineHeight: '1.4' }}>
              {successMessage.title}
            </h2>

            {/* Supportive Message with enhanced typography */}
            <p
              className="text-lg sm:text-xl md:text-2xl text-[var(--primary-700)] leading-relaxed px-4 sm:px-6 font-light"
              style={{ lineHeight: '1.8' }}
            >
              {successMessage.message}
            </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.4,
                ease: [0.23, 1, 0.32, 1]
              }}
              className="premium-card p-4 sm:p-6 md:p-8 rounded-3xl"
            >
          <div className="space-y-4 sm:space-y-6">
            {/* Mood Selection */}
            <div>
              <div className="grid grid-cols-3 max-[530px]:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                {MOODS.map((mood, index) => {
                  const cols = isNarrowMoodGrid ? 2 : 3
                  const isTop = index < cols
                  const isBottom = index >= MOODS.length - cols
                  const isLeft = index % cols === 0
                  const isRight = index % cols === cols - 1
                  const isCenter = !isLeft && !isRight
                  
                  let borderRadius = '1rem'
                  if (!isNarrowMoodGrid) {
                    const isTop3 = index < 3
                    const isBottom3 = index >= 3
                    const isLeft3 = index % 3 === 0
                    const isRight3 = index % 3 === 2
                    const isCenter3 = index % 3 === 1
                    if (isTop3 && isLeft3) borderRadius = '2rem 1rem 1rem 1rem'
                    else if (isTop3 && isRight3) borderRadius = '1rem 2rem 1rem 1rem'
                    else if (isBottom3 && isLeft3) borderRadius = '1rem 1rem 1rem 2rem'
                    else if (isBottom3 && isRight3) borderRadius = '1rem 1rem 2rem 1rem'
                    else if (isBottom3 && isCenter3) borderRadius = '1rem 1rem 2rem 2rem'
                    else if (isTop3 && isCenter3) borderRadius = '1rem'
                  } else {
                    if (isTop && isLeft) borderRadius = '2rem 1rem 1rem 1rem'
                    else if (isTop && isRight) borderRadius = '1rem 2rem 1rem 1rem'
                    else if (isBottom && isLeft) borderRadius = '1rem 1rem 1rem 2rem'
                    else if (isBottom && isRight) borderRadius = '1rem 1rem 2rem 1rem'
                  }
                  
                  return (
                  <button
                    key={mood.value}
                    type="button"
                    onClick={() => handleMoodSelect(mood.value)}
                    disabled={createEmotionalStateMutation.isPending}
                    className={`premium-button relative neu-mood-button flex flex-col items-center justify-center overflow-hidden cursor-pointer ${
                      selectedMood === mood.value ? 'active' : ''
                    } ${createEmotionalStateMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{
                      padding: '24px',
                      borderRadius: borderRadius,
                    }}
                  >
                    {/* Icon */}
                    <div className="relative z-10 mb-1 sm:mb-2 filter drop-shadow-sm">
                      <span className={`text-4xl sm:text-5xl md:text-6xl ${
                        selectedMood === mood.value ? 'drop-shadow-lg' : 'drop-shadow-sm'
                      }`}>
                        {mood.emoji}
                      </span>
                    </div>
                    
                    {/* Label with enhanced typography */}
                    <div className={`text-sm sm:text-base md:text-lg mt-1 font-semibold relative z-10 ${
                      selectedMood === mood.value ? 'text-[var(--primary-900)] drop-shadow-sm' : 'text-[var(--primary-700)]'
                    }`}>{mood.label}</div>
                  </button>
                  )
                })}
              </div>
            </div>

          </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

            