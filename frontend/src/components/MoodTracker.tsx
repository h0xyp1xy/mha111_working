import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { emotionalStateApi } from '../services/api'
import { useStore } from '../store/useStore'
import { HappyIcon, NeutralIcon, SadIcon, AnxiousIcon, AngryIcon, CalmIcon } from './Icons'
import { useAuth } from '../contexts/AuthContext'
import { setCookie, getCookie } from '../utils/cookies'

interface MoodTrackerProps {
  onClose: () => void
  onSuccess?: () => void
}

const MOODS = [
  { icon: HappyIcon, label: 'Хорошо', value: 'happy' },
  { icon: NeutralIcon, label: 'Нормально', value: 'neutral' },
  { icon: SadIcon, label: 'Не очень', value: 'sad' },
  { icon: AnxiousIcon, label: 'Тревожно', value: 'anxious' },
  { icon: AngryIcon, label: 'Злостно', value: 'angry' },
  { icon: CalmIcon, label: 'Спокойно', value: 'calm' },
]

// Функция для получения метки шкалы в зависимости от настроения и интенсивности
const getIntensityLabel = (mood: string | null, intensity: number): string => {
  if (!mood) return 'Выберите настроение'
  
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

export const MoodTracker = ({ onClose, onSuccess }: MoodTrackerProps) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [intensity, setIntensity] = useState(8)
  const [notes, setNotes] = useState('')
  const { currentSession } = useStore()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const createEmotionalStateMutation = useMutation({
    mutationFn: (data: { mood: string; intensity: number; notes: string }) => {
      const payload: any = {
        mood: data.mood,
        intensity: data.intensity,
        notes: data.notes || '',
      }
      // Session is optional - only include if it exists and is valid
      // Commenting out session for now to avoid potential validation issues
      // if (currentSession?.id && typeof currentSession.id === 'number') {
      //   payload.session = currentSession.id
      // }
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
      
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error recording emotional state:', error)
      console.error('Error response:', error?.response?.data)
      console.error('Error status:', error?.response?.status)
      
      let errorMessage = 'Не удалось записать эмоциональное состояние. Пожалуйста, попробуй снова.'
      
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMood) {
      alert('Пожалуйста, выбери настроение')
      return
    }
    createEmotionalStateMutation.mutate({
      mood: selectedMood,
      intensity,
      notes,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md w-full"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white text-center">Как ты?</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mood Selection */}
        <div>
          <label className="block text-white mb-3 font-medium">Как ты?</label>
          <div className="grid grid-cols-3 gap-3">
            {MOODS.map((mood) => (
              <motion.button
                key={mood.value}
                type="button"
                onClick={() => setSelectedMood(mood.value)}
                className={`p-4 rounded-xl transition-all flex flex-col items-center justify-center ${
                  selectedMood === mood.value
                    ? 'bg-[var(--primary-600)] scale-110 ring-4 ring-[var(--primary-400)]'
                    : 'bg-white/20 hover:bg-white/30'
                }`}
                whileHover={{ scale: selectedMood === mood.value ? 1.1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <mood.icon size={32} className="text-white mb-1" />
                <div className="text-xs text-white mt-1">{mood.label}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Intensity Slider */}
        <div>
          <label className="block text-white mb-3 font-medium text-center">
            {getIntensityLabel(selectedMood, intensity)}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary-600 transition-all duration-700 ease-out"
            style={{
              transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
          <div className="flex justify-between text-xs text-white/70 mt-1">
            <span>Слабо</span>
            <span>Сильно</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-white mb-3 font-medium">Расскажи про свое состояние. Тебе станет лучше 😌</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Поделись своими мыслями и чувствами..."
            className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--primary-400)] resize-none"
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <div className="flex space-x-3">
          <motion.button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Позже
          </motion.button>
          <motion.button
            type="submit"
            disabled={!selectedMood || createEmotionalStateMutation.isPending}
            className="flex-1 px-6 py-3 bg-[var(--primary-600)] text-white rounded-lg hover:bg-[var(--primary-700)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: selectedMood && !createEmotionalStateMutation.isPending ? 1.02 : 1 }}
            whileTap={{ scale: selectedMood && !createEmotionalStateMutation.isPending ? 0.98 : 1 }}
          >
            {createEmotionalStateMutation.isPending ? 'Сохраняю...' : 'Готово'}
          </motion.button>
        </div>
      </form>
    </motion.div>
  )
}

