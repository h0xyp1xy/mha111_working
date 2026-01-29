import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { cbtApi } from '../services/api'
import { useSubscription } from '../hooks/useSubscription'
import { useSEO } from '../hooks/useSEO'
import type { CBTContent, CBTProgress } from '../types'

export const CBTDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isPremium } = useSubscription()
  const contentId = id ? parseInt(id, 10) : null
  const [isCompleting, setIsCompleting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const { data: allContent = [] } = useQuery({
    queryKey: ['cbt-content'],
    queryFn: () => cbtApi.getContent(),
  })

  const { data: progress = [] } = useQuery({
    queryKey: ['cbt-progress'],
    queryFn: cbtApi.getProgress,
  })

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
    onSuccess: () => {
      // Refetch progress to update UI
      queryClient.invalidateQueries({ queryKey: ['cbt-progress'] })
    },
  })

  // Find the content by ID (could be a program or a lesson)
  const content = contentId 
    ? (() => {
        // First try to find in programs
        const program = allContent.find((item: CBTContent) => item.id === contentId)
        if (program) return program
        
        // Then try to find in lessons
        for (const program of allContent) {
          const lesson = program.lessons?.find((lesson: CBTContent) => lesson.id === contentId)
          if (lesson) {
            // Check if parent program is locked
            if (program.is_locked) {
              return { ...lesson, is_locked: true, locked_parent: program }
            }
            return lesson
          }
        }
        return null
      })()
    : null
  
  // SEO оптимизация (динамическая на основе контента)
  const seoTitle = content 
    ? `${content.title || 'CBT Программа'} - Новый Я | CBT Программа`
    : 'CBT Программа - Новый Я | Когнитивно-поведенческая терапия'
  const seoDescription = content?.description 
    ? (content.description.length > 155 ? content.description.substring(0, 152) + '...' : content.description)
    : 'Изучай эффективные техники CBT для управления мыслями и эмоциями'
  
  useSEO({
    title: seoTitle,
    description: seoDescription,
    keywords: 'CBT терапия, когнитивно-поведенческая терапия, техники управления эмоциями, психологические программы',
    ogTitle: content?.title ? `${content.title} - Новый Я` : 'CBT Программа - Новый Я',
    ogDescription: seoDescription,
    canonicalUrl: window.location.href,
  })
  
  // Check if content is locked
  const isContentLocked = content?.is_locked || content?.locked_parent || false
  const lockedProgram = content?.locked_parent || (content?.is_locked ? content : null)

  const getProgress = (contentId: number) => {
    return progress.find((p: CBTProgress) => p.content.id === contentId)
  }

  const handleComplete = async () => {
    if (!content) return
    
    setIsCompleting(true)
    const existingProgress = getProgress(content.id)
    updateProgressMutation.mutate({
      contentId: content.id,
      progressId: existingProgress?.id,
      percentage: 100,
      completed: true,
    }, {
      onSuccess: async () => {
        // If this is a lesson, update parent program progress
        if (content.parent) {
          const parentProgram = allContent.find((p: CBTContent) => p.id === content.parent)
          
          if (parentProgram && parentProgram.lessons) {
            // Refetch progress to get updated data
            await queryClient.invalidateQueries({ queryKey: ['cbt-progress'] })
            const updatedProgress = await queryClient.fetchQuery<CBTProgress[]>({
              queryKey: ['cbt-progress'],
              queryFn: cbtApi.getProgress,
            })
            
            const parentLessons = parentProgram.lessons || []
            const completedLessonsCount = parentLessons.filter((l: CBTContent) => {
              const lProgress = updatedProgress.find((p: CBTProgress) => p.content.id === l.id)
              return lProgress?.completed || false
            }).length
            
            // Calculate program progress
            const programProgressPercentage = parentLessons.length > 0
              ? Math.round((completedLessonsCount / parentLessons.length) * 100)
              : 0
            
            const parentProgress = updatedProgress.find((p: CBTProgress) => p.content.id === parentProgram.id)
            if (parentProgress) {
              // Update program progress
              updateProgressMutation.mutate({
                progressId: parentProgress.id,
                percentage: programProgressPercentage,
                completed: completedLessonsCount === parentLessons.length,
              })
            } else {
              // Create program progress if doesn't exist
              updateProgressMutation.mutate({
                contentId: parentProgram.id,
                percentage: programProgressPercentage,
                completed: completedLessonsCount === parentLessons.length,
              })
            }
          }
        }
        
        // Refetch progress to update UI
        await queryClient.invalidateQueries({ queryKey: ['cbt-progress'] })
        
        // Show success feedback before redirecting
        setShowSuccess(true)
        setIsCompleting(false)
        
        // Smooth redirect after showing success
        if (content.parent) {
          setTimeout(() => {
            navigate('/cbt-library')
          }, 2200) // Give time to see success feedback and spinning indicator
        }
      },
      onError: () => {
        setIsCompleting(false)
      },
    })
  }

  if (!content) {
    return (
      <div className="min-h-screen p-8 bg-[var(--primary-50)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--primary-900)] mb-4">
            Контент не найден
          </h2>
          <button
            onClick={() => navigate('/cbt-library')}
            className="neu-button-primary px-6 py-2 text-white"
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    )
  }


  const progressData = getProgress(content.id)
  const progressPercentage = progressData?.progress_percentage || 0
  const isCompleted = progressData?.completed || false

  return (
    <div className="min-h-screen p-8 bg-[var(--primary-50)]">
      <div className="max-w-4xl mx-auto relative">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="neu-card p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
                className="mb-6 flex justify-center"
              >
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-[var(--primary-900)] mb-4"
              >
                Урок завершён!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600"
              >
                Возвращаемся к списку курсов...
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-6 flex justify-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-[var(--primary-500)] border-t-transparent rounded-full"
                />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isCompleting ? 0.5 : 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* Back Button */}
              <motion.button
                onClick={() => navigate('/cbt-library')}
                className="mb-6 flex items-center gap-2 text-[var(--primary-500)] hover:text-[var(--primary-600)] transition-colors"
                whileHover={{ x: -5 }}
                whileTap={{ scale: 0.95 }}
                disabled={isCompleting}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Вернуться к списку</span>
              </motion.button>

              {/* Content Card */}
              <div className="neu-card p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[var(--primary-900)] mb-4">
                {content.title}
              </h1>
              {(() => {
                // Find parent program if this is a lesson
                const parentProgram = allContent.find((p: CBTContent) => 
                  p.lessons?.some((lesson: CBTContent) => lesson.id === content.id)
                )
                if (parentProgram) {
                  return (
                    <p className="text-sm text-gray-500 mb-2">
                      Курс: <button
                        onClick={() => navigate(`/cbt-library/${parentProgram.id}`)}
                        className="text-[var(--primary-500)] hover:text-[var(--primary-600)] underline"
                      >
                        {parentProgram.title}
                      </button>
                    </p>
                  )
                }
                return null
              })()}
            </div>
            {isCompleted && (
              <span className="text-green-600 text-3xl">✓</span>
            )}
          </div>

          {/* Progress Bar - only show for programs (not lessons) */}
          {!content.parent && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Прогресс</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="w-full bg-[var(--soft-gray)] rounded-full h-3">
                <motion.div
                  className="bg-[var(--primary-500)] h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="text-gray-700 whitespace-pre-wrap mb-6 leading-relaxed">
            {content.content}
          </div>

          {/* Audio */}
          {content.audio_url && (
            <div className="mb-6">
              <audio controls className="w-full">
                <source src={content.audio_url} type="audio/mpeg" />
              </audio>
            </div>
          )}

                {/* "Ясно" button for lessons */}
                {content.parent && (
                  <div className="flex justify-end items-center pt-6 border-t border-[var(--soft-gray)]">
                    {!isCompleted ? (
                      <motion.button
                        onClick={handleComplete}
                        className="neu-button-primary px-8 py-3 text-white text-lg font-medium relative"
                        whileHover={!isCompleting ? { scale: 1.05 } : {}}
                        whileTap={!isCompleting ? { scale: 0.95 } : {}}
                        disabled={isCompleting || updateProgressMutation.isPending}
                      >
                        {isCompleting || updateProgressMutation.isPending ? (
                          <span className="flex items-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                            />
                            Сохранение...
                          </span>
                        ) : (
                          'Ясно'
                        )}
                      </motion.button>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <span className="text-2xl">✓</span>
                        <span>Урок пройден</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions - only show for programs (not lessons) */}
                {!content.parent && (
                  <div className="flex justify-end items-center pt-6 border-t border-[var(--soft-gray)]">
                    {!isCompleted && progressPercentage > 0 && (
                      <button
                        onClick={handleComplete}
                        className="neu-button-primary px-6 py-2 text-white"
                      >
                        Отметить выполненным
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

