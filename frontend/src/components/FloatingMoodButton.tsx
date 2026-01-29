import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HappyIcon, NeutralIcon, SadIcon, AnxiousIcon, PlusIcon } from './Icons'
import { emotionalStateApi } from '../services/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const FloatingMoodButton = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [longPressActive, setLongPressActive] = useState(false)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Quick moods for long press - user's main states (3-5 options)
  const quickMoods = [
    { icon: HappyIcon, label: 'Хорошо', value: 'happy' },
    { icon: NeutralIcon, label: 'Обычно', value: 'neutral' },
    { icon: SadIcon, label: 'Непросто', value: 'sad' },
    { icon: AnxiousIcon, label: 'Тревожно', value: 'anxious' },
  ]

  // Quick save mutation - one tap save without navigation
  const quickSaveMutation = useMutation({
    mutationFn: (mood: string) => {
      return emotionalStateApi.create({
        mood,
        intensity: 5, // Default intensity
        notes: '',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['emotional-timeline'] })
      setIsExpanded(false)
      setLongPressActive(false)
    },
  })

  const handleQuickMood = (mood: string) => {
    // Quick save without navigation
    quickSaveMutation.mutate(mood)
  }

  const handleLongPressStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setLongPressActive(true)
      setIsExpanded(true)
    }, 500) // 500ms for long press
  }

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // If expanded (showing ×), show screen width
    if (isExpanded) {
      const width = window.innerWidth
      const height = window.innerHeight
      alert(`Ширина экрана: ${width}px\nВысота экрана: ${height}px`)
      setIsExpanded(false)
      setLongPressActive(false)
    } else if (!longPressActive && !isExpanded) {
      // If not long press, navigate to full mood page
      navigate('/mood')
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40">
      {isExpanded && longPressActive && (
        <div className="mb-4 space-y-2">
          {quickMoods.map((mood) => {
            const IconComponent = mood.icon
            return (
              <button
                key={mood.value}
                onClick={() => handleQuickMood(mood.value)}
                disabled={quickSaveMutation.isPending}
                className="bg-[var(--primary-600)] text-white w-14 h-14 rounded-full neu-button flex items-center justify-center shadow-lg disabled:opacity-50"
                title={mood.label}
              >
                <IconComponent size={24} className="text-white" />
              </button>
            )
          })}
        </div>
      )}
      
      <button
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={(e) => {
          handleLongPressEnd()
          // If expanded, handle click to show screen width
          if (isExpanded) {
            e.preventDefault()
            e.stopPropagation()
            const width = window.innerWidth
            const height = window.innerHeight
            alert(`Ширина экрана: ${width}px\nВысота экрана: ${height}px`)
            setIsExpanded(false)
            setLongPressActive(false)
          }
        }}
        onClick={handleClick}
        className="w-16 h-16 rounded-full neu-button-primary flex items-center justify-center shadow-xl"
        title={isExpanded ? 'Закрыть' : 'Задержись для быстрой записи'}
      >
        {isExpanded ? (
          <span className="text-3xl text-white">×</span>
        ) : (
          <PlusIcon size={32} className="text-white" />
        )}
      </button>
    </div>
  )
}





