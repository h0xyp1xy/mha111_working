import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { conversationApi, voiceApi } from '../services/api'
import { useStore } from '../store/useStore'
import { useToast } from './Toast'
import type { Message } from '../types'

const CompleteSessionButton = ({ sessionId }: { sessionId: number }) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { setCurrentSession } = useStore()
  const toast = useToast()
  
  const completeMutation = useMutation({
    mutationFn: () => conversationApi.completeWithSummary(sessionId),
    onSuccess: (data) => {
      // Show summary message
      toast.success(data.message, 6000)
      toast.info(data.summary, 8000)
      
      // Clear current session
      setCurrentSession(null)
      
      // Invalidate queries to refresh analytics
      queryClient.invalidateQueries({ queryKey: ['analytics-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['activeSession'] })
      queryClient.invalidateQueries({ queryKey: ['emotional-timeline'] })
      
      // Optionally navigate to analytics
      setTimeout(() => {
        toast.info('Перейти к разделу "Мой прогресс" для просмотра статистики?', 5000)
        setTimeout(() => {
          navigate('/analytics')
        }, 2000)
      }, 1000)
    },
    onError: (error: any) => {
      console.error('Error completing session:', error)
      toast.error('Не удалось завершить сессию. Попробуйте снова.')
    },
  })
  
  return (
    <motion.button
      type="button"
      onClick={() => {
        toast.warning('Завершить сессию и сгенерировать статистику? Сессия будет сохранена.', 5000)
        setTimeout(() => {
          completeMutation.mutate()
        }, 1000)
      }}
      disabled={completeMutation.isPending}
      className="w-full px-4 py-2.5 neu-button border-2 border-[var(--primary-400)] text-[var(--primary-700)] font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      whileTap={{ scale: completeMutation.isPending ? 1 : 0.98 }}
    >
      {completeMutation.isPending ? (
        <>
          <div className="w-4 h-4 border-2 border-[var(--primary-500)] border-t-transparent rounded-full animate-spin" />
          <span>Обработка...</span>
        </>
      ) : (
        <>
          <span>✓</span>
          <span>Я добавил лечение</span>
        </>
      )}
    </motion.button>
  )
}

export const ConversationFlow = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([])
  const lastMessageIdRef = useRef<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { currentSession, setCurrentSession, setRiskDetected } = useStore()
  const queryClient = useQueryClient()
  const toast = useToast()

  const { data: activeSession } = useQuery({
    queryKey: ['activeSession'],
    queryFn: conversationApi.getActiveSession,
    retry: 1,
  })

  useEffect(() => {
    if (activeSession) {
      setCurrentSession(activeSession)
      setMessages(activeSession.messages || [])
    }
  }, [activeSession, setCurrentSession])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const processVoiceMutation = useMutation({
    mutationFn: (text: string) => voiceApi.processInput(text, currentSession?.id),
    onSuccess: (data) => {
      setError(null)
      // Add user message
      setMessages((prev) => [...prev, data.user_message])
      
      // Add therapist response with typing animation - prevent duplicate messages
      // Check if this message was already added
      if (lastMessageIdRef.current === data.therapist_message.id) {
        return // Prevent duplicate
      }
      
      setIsTyping(true)
      lastMessageIdRef.current = data.therapist_message.id
      
      setTimeout(() => {
        setIsTyping(false)
        // Only add message if it's not already in the list
        setMessages((prev) => {
          const exists = prev.some(m => m.id === data.therapist_message.id)
          if (exists) return prev
          return [...prev, data.therapist_message]
        })
      }, 500)
      
      // Update session
      if (data.session_id) {
        conversationApi.getSession(data.session_id).then(setCurrentSession)
      }
      
      // Handle lesson recommendation
      if (data.recommended_category) {
        // Show toast notification
        setTimeout(() => {
          toast.info('ИИ-психолог рекомендует посмотреть практики', 5000)
          setSuggestedReplies(['Перейти к практикам', 'Продолжить разговор'])
        }, 1000)
      }
      
      // Generate suggested replies based on context
      const generateSuggestedReplies = (response: string) => {
        const replies: string[] = []
        if (response.toLowerCase().includes('расскажи') || response.toLowerCase().includes('поделись')) {
          replies.push('Хорошо, расскажу подробнее')
        }
        if (response.toLowerCase().includes('как дела') || response.toLowerCase().includes('как ты')) {
          replies.push('Спасибо, что спрашиваешь')
        }
        if (response.toLowerCase().includes('практик') || response.toLowerCase().includes('упражнени')) {
          replies.push('Покажи практики')
        }
        if (replies.length === 0) {
          replies.push('Понял', 'Спасибо', 'Расскажи больше')
        }
        return replies.slice(0, 3)
      }
      
      setSuggestedReplies(generateSuggestedReplies(data.therapist_message.content))
      
      // Invalidate analytics queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['analytics-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['activeSession'] })
      
      // Handle risk detection
      if (data.risk_detected) {
        setRiskDetected(true)
      }
    },
    onError: (error: any) => {
      console.error('Error processing voice input:', error)
      let errorMessage = 'Не удалось отправить сообщение. Пожалуйста, попробуйте снова.'
      let isSessionLimit = false
      
      if (error?.response) {
        if (error.response.status === 403 && error.response.data?.limit_reached) {
          // Session limit reached
          isSessionLimit = true
          errorMessage = error.response.data.message || error.response.data.error || errorMessage
        } else if (error.response.status === 500) {
          errorMessage = 'Произошла ошибка на сервере. Пожалуйста, попробуйте позже.'
        } else if (error.response.status === 401) {
          errorMessage = 'Сессия истекла. Пожалуйста, войдите заново.'
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        }
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      if (isSessionLimit) {
        toast.error(errorMessage, 8000)
        // Show upgrade prompt
        setTimeout(() => {
          toast.info('Обновитесь до Премиум для неограниченного количества сессий!', 5000)
        }, 2000)
      } else {
        toast.error(errorMessage)
      }
      setTimeout(() => setError(null), 5000)
    },
  })

  const [textInput, setTextInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedInput = textInput.trim()
    if (trimmedInput) {
      processVoiceMutation.mutate(trimmedInput)
      setTextInput('')
    }
  }

  return (
    <div className="min-h-screen flex flex-col p-2 sm:p-3 md:p-4 lg:p-6 bg-[var(--primary-50)]">
      <div className="max-w-4xl w-full mx-auto flex flex-col h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)]">
        {/* Messages */}
        <div className="neu-card p-3 sm:p-4 md:p-6 flex-1 overflow-y-auto mb-3 sm:mb-4 rounded-xl scroll-smooth">
          <AnimatePresence>
            {messages.length === 0 && !isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex items-center justify-center h-full text-gray-500"
              >
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 rounded-full bg-[var(--primary-100)] flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">💬</span>
                  </div>
                  <p className="text-lg sm:text-xl mb-2 font-semibold text-[var(--primary-700)]">Начните разговор</p>
                  <p className="text-sm sm:text-base text-gray-500">Напишите сообщение ИИ-психологу, и я помогу вам разобраться в ваших чувствах</p>
                </div>
              </motion.div>
            )}
            {messages.map((message) => {
              const messageTime = new Date(message.created_at).toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className={`mb-3 flex items-end gap-2 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender === 'therapist' && (
                    <div className="w-8 h-8 rounded-full bg-[var(--primary-200)] flex items-center justify-center flex-shrink-0 mb-1">
                      <span className="text-lg">🧠</span>
                    </div>
                  )}
                  <div className="flex flex-col max-w-[75%] sm:max-w-[65%]">
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-md transition-all ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] text-white rounded-tr-sm'
                          : 'bg-white text-gray-800 rounded-tl-sm neu-card-inset'
                      }`}
                    >
                      <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                      {message.sentiment_label && message.sender === 'user' && (
                        <p className="text-xs mt-2 opacity-80 font-light">
                          {message.sentiment_label === 'positive' ? '😊' : message.sentiment_label === 'negative' ? '😔' : '😐'} {message.sentiment_label}
                        </p>
                      )}
                    </div>
                    <span className={`text-[10px] text-gray-400 mt-1 px-2 ${
                      message.sender === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {messageTime}
                    </span>
                  </div>
                  {message.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-[var(--primary-500)] flex items-center justify-center flex-shrink-0 mb-1 text-white text-sm font-semibold">
                      Я
                    </div>
                  )}
                </motion.div>
              )
            })}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 flex justify-start items-start gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--primary-200)] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🧠</span>
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white text-gray-800 neu-card-inset shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[var(--primary-400)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-[var(--primary-400)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-[var(--primary-400)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Психолог печатает...</p>
                </div>
              </motion.div>
            )}
            
            {/* Suggested Replies */}
            {suggestedReplies.length > 0 && messages.length > 0 && !isTyping && (
              <div className="flex flex-wrap gap-2 mb-3">
                {suggestedReplies.map((reply, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => {
                      setTextInput(reply)
                      setSuggestedReplies([])
                    }}
                    className="px-3 py-1.5 text-xs sm:text-sm neu-button text-[var(--primary-700)] hover:bg-[var(--primary-100)] transition-colors"
                  >
                    {reply}
                  </motion.button>
                ))}
              </div>
            )}
          </AnimatePresence>
          {processVoiceMutation.isPending && (
            <div className="text-center text-gray-500 py-3 flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-[var(--primary-500)] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Обработка...</span>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Text Input */}
        <form onSubmit={handleSubmit} className="neu-card p-3 sm:p-4 rounded-xl shadow-lg">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 sm:gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (textInput.trim() && !processVoiceMutation.isPending) {
                        handleSubmit(e as any)
                      }
                    }
                  }}
                  placeholder="Напишите сообщение психологу..."
                  rows={1}
                  className="w-full px-4 py-3 pr-12 rounded-xl neu-input text-sm sm:text-base text-[var(--primary-900)] placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary-300)] transition-all min-h-[48px] max-h-[120px]"
                  style={{
                    height: 'auto',
                    overflowY: 'auto',
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`
                  }}
                  disabled={processVoiceMutation.isPending}
                />
                <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                  {textInput.length > 0 && `${textInput.length}`}
                </div>
              </div>
              <motion.button
                type="submit"
                disabled={!textInput.trim() || processVoiceMutation.isPending}
                className="px-5 sm:px-6 py-3 neu-button-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-semibold whitespace-nowrap shadow-md flex items-center justify-center gap-2 min-w-[100px]"
                whileTap={{ scale: textInput.trim() && !processVoiceMutation.isPending ? 0.98 : 1 }}
              >
                {processVoiceMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Ожидание...</span>
                  </>
                ) : (
                  <>
                    <span>Отправить</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </>
                )}
              </motion.button>
            </div>
            {/* Complete Session Button */}
            {currentSession && messages.length > 0 && (
              <CompleteSessionButton sessionId={currentSession.id} />
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

