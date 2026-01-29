import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { conversationApi, voiceApi } from '../services/api'
import { useStore } from '../store/useStore'
import { useSEO } from '../hooks/useSEO'

const ASSESSMENT_QUESTIONS = [
  {
    id: 1,
    question: 'Как вы себя чувствуете в последнее время?',
    type: 'text',
  },
  {
    id: 2,
    question: 'Что вас больше всего беспокоит?',
    type: 'text',
  },
  {
    id: 3,
    question: 'Оцените уровень стресса от 1 до 10',
    type: 'scale',
  },
  {
    id: 4,
    question: 'Что вы хотели бы улучшить в своей жизни?',
    type: 'text',
  },
]

export const AssessmentPage = () => {
  // SEO оптимизация
  useSEO({
    title: 'Оценка состояния - Новый Я | Первичная диагностика',
    description: 'Пройди быструю оценку своего эмоционального состояния и получи персонализированные рекомендации для улучшения душевного благополучия.',
    keywords: 'оценка ментального здоровья, диагностика эмоционального состояния, психологическая диагностика',
    ogTitle: 'Оценка состояния - Новый Я',
    ogDescription: 'Пройди оценку своего эмоционального состояния и получи персонализированные рекомендации',
    canonicalUrl: window.location.origin + '/assessment',
  })
  const navigate = useNavigate()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [scaleValue, setScaleValue] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { setCurrentSession } = useStore()

  const currentQuestion = ASSESSMENT_QUESTIONS[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === ASSESSMENT_QUESTIONS.length - 1

  const processAnswerMutation = useMutation({
    mutationFn: (text: string) => voiceApi.processInput(text, undefined),
    onSuccess: (data) => {
      if (data.session_id) {
        conversationApi.getSession(data.session_id).then(setCurrentSession)
      }
    },
  })

  const handleNext = () => {
    if (currentQuestion.type === 'scale') {
      setAnswers({ ...answers, [currentQuestion.id]: scaleValue.toString() })
    } else {
      if (!currentAnswer.trim()) return
      setAnswers({ ...answers, [currentQuestion.id]: currentAnswer })
    }

    if (isLastQuestion) {
      handleSubmit()
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setCurrentAnswer('')
      setScaleValue(5)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // Собираем все ответы в один текст
    const allAnswers = ASSESSMENT_QUESTIONS.map((q) => {
      const answer = answers[q.id] || (q.type === 'scale' ? scaleValue.toString() : currentAnswer)
      return `${q.question}\n${answer}`
    }).join('\n\n')

    // Отправляем ответы ИИ психологу для анализа
    try {
      await processAnswerMutation.mutateAsync(
        `Я прохожу тестирование. Вот мои ответы:\n\n${allAnswers}\n\nПожалуйста, проанализируй мои ответы и дай рекомендации.`
      )
      
      // После тестирования переходим в чат
      setTimeout(() => {
        navigate('/conversation')
      }, 1000)
    } catch (error) {
      console.error('Error submitting assessment:', error)
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      const prevQuestion = ASSESSMENT_QUESTIONS[currentQuestionIndex - 1]
      setCurrentAnswer(answers[prevQuestion.id] || '')
      if (prevQuestion.type === 'scale') {
        setScaleValue(parseInt(answers[prevQuestion.id] || '5', 10))
      }
    }
  }

  const progress = ((currentQuestionIndex + 1) / ASSESSMENT_QUESTIONS.length) * 100

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-[var(--primary-50)]">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Вопрос {currentQuestionIndex + 1} из {ASSESSMENT_QUESTIONS.length}
            </span>
            <span className="text-sm font-semibold text-[var(--primary-700)]">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-3 bg-[var(--primary-200)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary-500)] transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="neu-card p-6 sm:p-8 mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--primary-900)] mb-6">
            {currentQuestion.question}
          </h2>

          {currentQuestion.type === 'scale' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">Низкий</span>
                <span className="text-2xl font-bold text-[var(--primary-700)]">{scaleValue}</span>
                <span className="text-sm text-gray-600">Высокий</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={scaleValue}
                onChange={(e) => setScaleValue(parseInt(e.target.value, 10))}
                className="w-full h-3 bg-[var(--primary-200)] rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, var(--primary-500) 0%, var(--primary-500) ${((scaleValue - 1) / 9) * 100}%, var(--primary-200) ${((scaleValue - 1) / 9) * 100}%, var(--primary-200) 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
                <span>7</span>
                <span>8</span>
                <span>9</span>
                <span>10</span>
              </div>
            </div>
          ) : (
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Введите ваш ответ..."
              className="w-full min-h-[150px] p-4 neu-input rounded-lg resize-none text-[var(--primary-900)] placeholder-gray-400"
              rows={6}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4">
          <button
            onClick={handleBack}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 neu-button disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Назад
          </button>
          <button
            onClick={handleNext}
            disabled={isSubmitting || (currentQuestion.type === 'text' && !currentAnswer.trim())}
            className="px-6 py-3 neu-button-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? 'Обработка...' : isLastQuestion ? 'Завершить тестирование' : 'Далее'}
          </button>
        </div>
      </div>
    </div>
  )
}









