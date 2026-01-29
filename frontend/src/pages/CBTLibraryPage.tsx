import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { cbtApi } from '../services/api'
import { useToast } from '../components/Toast'
import { SkeletonCard } from '../components/SkeletonLoader'
import { useSubscription } from '../hooks/useSubscription'
import { useSEO } from '../hooks/useSEO'
import type { CBTContent, CBTProgress } from '../types'

export const CBTLibraryPage = () => {
  // SEO оптимизация
  useSEO({
    title: 'CBT Библиотека - Новый Я | Когнитивно-поведенческая терапия',
    description: 'Изучай эффективные техники CBT для управления мыслями и эмоциями. Структурированные программы саморазвития и психологической поддержки.',
    keywords: 'CBT терапия, когнитивно-поведенческая терапия, техники управления эмоциями, психологические программы, саморазвитие',
    ogTitle: 'CBT Библиотека - Новый Я',
    ogDescription: 'Изучай эффективные техники CBT для управления мыслями и эмоциями',
    canonicalUrl: window.location.origin + '/cbt-library',
  })
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const { isPremium, limits } = useSubscription()
  const [expandedPrograms, setExpandedPrograms] = useState<Set<number>>(new Set())
  
  // Refetch progress when returning from a lesson page
  useEffect(() => {
    if (location.pathname === '/cbt-library') {
      queryClient.invalidateQueries({ queryKey: ['cbt-progress'] })
    }
  }, [location.pathname, queryClient])

  const { data: content = [] } = useQuery({
    queryKey: ['cbt-content'],
    queryFn: () => cbtApi.getContent(),
  })

  const { data: progress = [], refetch: refetchProgress } = useQuery({
    queryKey: ['cbt-progress'],
    queryFn: cbtApi.getProgress,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
  
  // Refetch progress when component mounts
  useEffect(() => {
    refetchProgress()
  }, [refetchProgress])

  const updateProgressMutation = useMutation({
    mutationFn: ({ contentId, progressId, percentage, completed }: {
      contentId?: number
      progressId?: number
      percentage: number
      completed: boolean
    }) => {
      if (progressId) {
        return cbtApi.updateProgress(progressId, percentage, completed)
      } else if (contentId) {
        return cbtApi.createOrUpdateProgress(contentId, percentage, completed)
      }
      throw new Error('Either progressId or contentId is required')
    },
    onMutate: async ({ contentId, progressId, percentage, completed }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['cbt-progress'] })
      
      // Snapshot the previous value
      const previousProgress = queryClient.getQueryData<CBTProgress[]>(['cbt-progress'])
      
      // Optimistically update the cache
      queryClient.setQueryData<CBTProgress[]>(['cbt-progress'], (old = []) => {
        if (progressId) {
          // Update existing progress
          return old.map((p: CBTProgress) => 
            p.id === progressId 
              ? { ...p, progress_percentage: percentage, completed }
              : p
          )
        } else if (contentId) {
          // Check if progress exists
          const existing = old.find((p: CBTProgress) => p.content.id === contentId)
          if (existing) {
            // Update existing
            return old.map((p: CBTProgress) => 
              p.content.id === contentId
                ? { ...p, progress_percentage: percentage, completed }
                : p
            )
          } else {
            // Add new progress (optimistic)
            return [...old, {
              id: Date.now(), // Temporary ID
              content: { id: contentId } as CBTContent,
              progress_percentage: percentage,
              completed,
              last_accessed: new Date().toISOString(),
            } as CBTProgress]
          }
        }
        return old
      })
      
      return { previousProgress }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProgress) {
        queryClient.setQueryData(['cbt-progress'], context.previousProgress)
      }
    },
    onSuccess: () => {
      // Refetch to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: ['cbt-progress'] })
    },
  })

  // Get all programs (practices) - items without parent
  // Backend now sends all programs with is_locked flag
  const allPrograms = React.useMemo(() => {
    if (!content || !Array.isArray(content)) return []
    return content.filter((item: CBTContent) => !item.parent)
  }, [content])

  // Separate unlocked and locked programs
  const programs = React.useMemo(() => {
    return allPrograms.filter((item: CBTContent) => !item.is_locked)
  }, [allPrograms])

  // Get locked programs (marked by backend with is_locked flag)
  const lockedPrograms = React.useMemo(() => {
    if (isPremium || limits.max_cbt_programs === null) return []
    return allPrograms.filter((item: CBTContent) => item.is_locked === true)
  }, [allPrograms, isPremium, limits.max_cbt_programs])
  
  // Group programs by category
  const categoryLabels: Record<string, string> = {
    'foundations': 'Основы КПТ',
    'techniques': 'Терапевтические техники',
    'conditions': 'Модули по состояниям',
    'exercises': 'Интерактивные упражнения',
  }
  
  // Group all programs by category (unlocked and locked separately)
  const programsByCategory = React.useMemo(() => {
    return programs.reduce((acc: Record<string, CBTContent[]>, program: CBTContent) => {
      if (program.is_locked) return acc  // Skip locked programs here
      const category = program.category || 'other'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(program)
      return acc
    }, {})
  }, [programs])

  // Group locked programs by category
  const lockedProgramsByCategory = React.useMemo(() => {
    return lockedPrograms.reduce((acc: Record<string, CBTContent[]>, program: CBTContent) => {
      const category = program.category || 'other'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(program)
      return acc
    }, {})
  }, [lockedPrograms])
  
  const categoryOrder = ['foundations', 'techniques', 'conditions', 'exercises']

  const getProgress = (contentId: number) => {
    return progress.find((p: CBTProgress) => p.content.id === contentId)
  }

  const toggleProgram = (programId: number) => {
    setExpandedPrograms((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(programId)) {
        newSet.delete(programId)
      } else {
        newSet.add(programId)
      }
      return newSet
    })
  }

  const handleProgramClick = (program: CBTContent, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    // If program has lessons, toggle expansion. Otherwise, navigate to program page.
    if (program.lessons && program.lessons.length > 0) {
      toggleProgram(program.id)
    } else {
      // Navigate to program detail page if it has no lessons
      navigate(`/cbt-library/${program.id}`)
    }
  }

  const handleLessonClick = (lesson: CBTContent, e: React.MouseEvent) => {
    e.stopPropagation()
    // Just navigate to lesson page - completion happens when "Ясно" button is clicked
    navigate(`/cbt-library/${lesson.id}`)
  }

  const handleComplete = (item: CBTContent, e: React.MouseEvent) => {
    e.stopPropagation()
    const existingProgress = getProgress(item.id)
      updateProgressMutation.mutate({
      contentId: item.id,
      progressId: existingProgress?.id,
        percentage: 100,
        completed: true,
      })
  }

  const resetProgressMutation = useMutation({
    mutationFn: () => cbtApi.resetAll(),
    onSuccess: () => {
      // Refetch progress to update UI
      queryClient.invalidateQueries({ queryKey: ['cbt-progress'] })
      toast.success('Весь прогресс был сброшен')
    },
    onError: (error: any) => {
      console.error('Error resetting progress:', error)
      toast.error('Не удалось сбросить прогресс. Попробуйте снова.')
    },
  })

  const handleResetProgress = () => {
    const confirmed = window.confirm('Это удалит все данные. Всё в порядке, иногда нужно начинать заново. Вы уверены?')
    if (confirmed) {
      resetProgressMutation.mutate()
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-[var(--primary-50)]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
          <div>
            <motion.h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--primary-900)] mb-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Практики
            </motion.h1>
            <p className="text-gray-600 text-sm sm:text-base">Выберите программу и начните работу с собой</p>
          </div>
          <motion.button
            onClick={handleResetProgress}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded-lg transition-colors neu-button"
            whileTap={{ scale: 0.95 }}
            disabled={resetProgressMutation.isPending}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {resetProgressMutation.isPending ? 'Сброс...' : 'Сбросить прогресс'}
          </motion.button>
        </div>

        {contentLoading ? (
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : !content || content.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">Практики пока не добавлены</p>
            <p className="text-gray-500 text-sm">Обратитесь к администратору для добавления контента</p>
          </div>
        ) : (
          <div className="space-y-8">
            {categoryOrder.map((category) => {
              const categoryPrograms = programsByCategory[category] || []
              const categoryLockedPrograms = lockedProgramsByCategory[category] || []
              // Show category if it has any programs (unlocked or locked)
              if (categoryPrograms.length === 0 && categoryLockedPrograms.length === 0) return null
            
            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--primary-300)] to-transparent" />
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--primary-900)] px-4">
                    {categoryLabels[category] || category}
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--primary-300)] to-transparent" />
                </div>
                
                <div className="space-y-6">
                  {categoryPrograms.map((program: CBTContent) => {
            // Programs here should already be unlocked (filtered above)
            // Double check to ensure locked programs don't appear
            if (program.is_locked) {
              return null
            }
            
            const isExpanded = expandedPrograms.has(program.id)
            const lessons = program.lessons || []
            
            // Calculate completed lessons count
            const completedLessons = lessons.filter((lesson: CBTContent) => {
              const lessonProgress = getProgress(lesson.id)
              return lessonProgress?.completed || false
            }).length
            
            // Calculate program progress based on completed lessons
            // This is the source of truth for visual display
            const calculatedProgress = lessons.length > 0 
              ? Math.round((completedLessons / lessons.length) * 100)
              : 0
            
            const progressData = getProgress(program.id)
            // Always use calculated progress for programs with lessons
            // This ensures visual progress matches completed lessons
            const progressPercentage = lessons.length > 0 
              ? calculatedProgress 
              : (progressData?.progress_percentage || 0)
            
            const isCompleted = progressData?.completed || 
              (lessons.length > 0 && completedLessons === lessons.length && completedLessons > 0)
            
            // Calculate circle circumference for progress indicator
            const circleRadius = 20
            const circleCircumference = 2 * Math.PI * circleRadius
            const progressOffset = circleCircumference * (1 - progressPercentage / 100)

              return (
                <motion.div
                key={program.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                className="neu-card overflow-hidden"
              >
                {/* Program Header - Clickable */}
                <div
                  className="p-6 cursor-pointer hover:bg-[var(--primary-100)] transition-colors"
                  onClick={(e) => handleProgramClick(program, e)}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-[var(--primary-500)] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {program.title.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-[var(--primary-900)] mb-1">
                            {program.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Circular Progress Indicator */}
                          {!isCompleted ? (
                            <div className="relative w-14 h-14 flex-shrink-0">
                              <svg
                                className="transform -rotate-90 w-full h-full"
                                viewBox="0 0 48 48"
                              >
                                {/* Background circle */}
                                <circle
                                  cx="24"
                                  cy="24"
                                  r={circleRadius}
                                  stroke="var(--soft-gray)"
                                  strokeWidth="4"
                                  fill="none"
                                />
                                {/* Progress circle */}
                                <motion.circle
                                  key={`circle-${program.id}-${progressPercentage}`}
                                  cx="24"
                                  cy="24"
                                  r={circleRadius}
                                  stroke="var(--primary-500)"
                                  strokeWidth="4"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeDasharray={circleCircumference}
                                  initial={{ strokeDashoffset: circleCircumference }}
                                  animate={{ strokeDashoffset: progressOffset }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                />
                              </svg>
                              {/* Progress count in center */}
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-xs font-bold text-[var(--primary-900)] leading-tight text-center">
                                  {lessons.length > 0 ? (
                                    <>
                                      {completedLessons}
                                      <span className="text-[10px] text-gray-500">/</span>
                                      {lessons.length}
                                    </>
                                  ) : (
                                    '0/0'
                                  )}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
                              <span className="text-green-600 text-3xl">✓</span>
                            </div>
                          )}
                          <motion.svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                            className="text-[var(--primary-500)] flex-shrink-0"
                          >
                            <path d="M6 9l6 6 6-6" />
                          </motion.svg>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-2">{program.content}</p>
                    </div>
                  </div>
                </div>

                {/* Lessons Table - Collapsible */}
                <AnimatePresence>
                  {isExpanded && lessons.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden border-t border-[var(--soft-gray)]"
                    >
                      <div className="p-6 bg-[var(--primary-100)]">
                        <h4 className="text-lg font-semibold text-[var(--primary-900)] mb-4">
                          Уроки курса
                        </h4>
                        <div className="space-y-3">
                          {lessons.map((lesson: CBTContent, index: number) => {
                            const lessonProgress = getProgress(lesson.id)
                            const lessonProgressPercentage = lessonProgress?.progress_percentage || 0
                            const lessonCompleted = lessonProgress?.completed || false

                            return (
                              <motion.div
                                key={lesson.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`p-4 cursor-pointer transition-all ${
                                  lessonProgressPercentage >= 100 
                                    ? 'bg-[var(--primary-100)] rounded-lg border border-[var(--soft-gray)]' 
                                    : 'neu-card-inset'
                                }`}
                                onClick={(e) => handleLessonClick(lesson, e)}
                              >
                                <div className="flex items-start gap-4">
                                  {/* Lesson Number Badge */}
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                    lessonCompleted
                                      ? 'bg-green-500 text-white'
                                      : lessonProgressPercentage >= 100
                                      ? 'bg-[var(--primary-500)] text-white'
                                      : lessonProgressPercentage > 0
                                      ? 'bg-[var(--primary-400)] text-white'
                                      : 'bg-[var(--soft-gray)] text-gray-600'
                                  }`}>
                                    {lessonCompleted ? '✓' : index + 1}
                                  </div>

                                  {/* Lesson Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <h5 className={`text-lg font-semibold ${
                                        lessonProgressPercentage >= 100
                                          ? 'text-[var(--primary-900)]'
                                          : 'text-[var(--primary-900)]'
                                      }`}>
                                        {lesson.title}
                                      </h5>
                                      {lessonCompleted && (
                                        <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                                      )}
                                    </div>
                                    <p className={`text-sm line-clamp-2 ${
                                      lessonProgressPercentage >= 100
                                        ? 'text-[var(--primary-800)]'
                                        : 'text-gray-600'
                                    }`}>
                                      {lesson.content}
                                    </p>
                                  </div>

                                  {/* Arrow Icon */}
                                  <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className={`flex-shrink-0 mt-1 ${
                                      lessonProgressPercentage >= 100
                                        ? 'text-[var(--primary-600)]'
                                        : 'text-gray-400'
                                    }`}
                                  >
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                  </svg>
                  </div>
                </motion.div>
              )
            })}
          </div>
                </div>
                    </motion.div>
                )}
                </AnimatePresence>
              </motion.div>
                  )
                })}
                </div>
                
              </div>
            )
          })}
          </div>
        )}
      </div>
    </div>
  )
}
