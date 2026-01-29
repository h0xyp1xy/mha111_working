import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { subscriptionApi } from '../services/api'
import { useToast } from '../components/Toast'
import { useAuth } from '../contexts/AuthContext'
import { useSEO } from '../hooks/useSEO'
import type { SubscriptionStatus, FeatureLimits } from '../types'

export const SubscriptionPage = () => {
  // SEO оптимизация
  useSEO({
    title: 'Подписка - Новый Я | Премиум доступ к полному функционалу',
    description: 'Получи премиум доступ к расширенной аналитике, CBT-программам и всем возможностям для максимального душевного благополучия.',
    keywords: 'премиум подписка, ментальное здоровье, CBT программы, расширенная аналитика, премиум функции',
    ogTitle: 'Подписка - Новый Я',
    ogDescription: 'Получи премиум доступ к полному функционалу для максимального душевного благополучия',
    canonicalUrl: window.location.origin + '/subscription',
  })
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [isUpgrading, setIsUpgrading] = useState(false)

  const { data: subscriptionStatus, isLoading } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: subscriptionApi.getStatus,
    enabled: !!user,
  })

  const upgradeMutation = useMutation({
    mutationFn: subscriptionApi.upgradeToPremium,
    onSuccess: (data) => {
      toast.success(data.message || 'Успешно обновлено до Премиум')
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] })
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      setIsUpgrading(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Ошибка при обновлении подписки')
      setIsUpgrading(false)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: subscriptionApi.cancelSubscription,
    onSuccess: (data) => {
      toast.success(data.message || 'Подписка будет отменена в конце периода')
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Ошибка при отмене подписки')
    },
  })

  const handleUpgrade = () => {
    if (window.confirm('Обновить подписку до Премиум? (В тестовом режиме подписка активируется на 30 дней)')) {
      setIsUpgrading(true)
      upgradeMutation.mutate()
    }
  }

  const handleCancel = () => {
    if (window.confirm('Вы уверены, что хотите отменить подписку? Она будет активна до конца текущего периода.')) {
      cancelMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--primary-50)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--primary-500)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--primary-700)]">Загрузка...</p>
        </div>
      </div>
    )
  }

  const subscription = subscriptionStatus?.subscription
  const limits = subscriptionStatus?.limits || {} as FeatureLimits
  const isPremium = subscriptionStatus?.is_premium || false

  return (
    <div className="min-h-screen bg-[var(--primary-50)] flex items-center justify-center py-8 px-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-[var(--primary-900)] mb-8 text-center">
          Управление подпиской
        </h1>

        {/* Current Subscription Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <h2 className="text-xl font-semibold text-[var(--primary-900)] mb-4">
            Текущая подписка
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-2 ${
                isPremium
                  ? 'bg-[var(--primary-500)] text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {subscription?.tier === 'premium' ? 'Премиум' : 'Бесплатная'}
              </div>
              {subscription?.expires_at && (
                <p className="text-sm text-gray-600 mt-2">
                  Истекает: {new Date(subscription.expires_at).toLocaleDateString('ru-RU')}
                </p>
              )}
              {subscription?.cancel_at_period_end && (
                <p className="text-sm text-amber-600 mt-2">
                  ⚠ Будет отменена в конце периода
                </p>
              )}
            </div>
            {isPremium && !subscription?.cancel_at_period_end && (
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Отмена...' : 'Отменить подписку'}
              </button>
            )}
          </div>
        </motion.div>

        {/* Feature Comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`bg-white rounded-2xl shadow-lg p-6 ${
              !isPremium ? 'ring-2 ring-[var(--primary-500)]' : ''
            }`}
          >
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Бесплатная</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700">
                  {limits.max_cbt_programs || 'Неограниченно'} CBT программ
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700">
                  {limits.max_sessions_per_month || 'Неограниченно'} сессий в месяц
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">✗</span>
                <span className="text-gray-500">Расширенная аналитика</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">✗</span>
                <span className="text-gray-500">Приоритетная поддержка</span>
              </li>
            </ul>
            {!isPremium && (
              <button
                onClick={handleUpgrade}
                disabled={isUpgrading || upgradeMutation.isPending}
                className="w-full px-4 py-3 bg-[var(--primary-500)] text-white rounded-full font-semibold hover:bg-[var(--primary-600)] transition-colors disabled:opacity-50"
              >
                {isUpgrading || upgradeMutation.isPending ? 'Обновление...' : 'Обновить до Премиум'}
              </button>
            )}
          </motion.div>

          {/* Premium Tier */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] rounded-2xl shadow-lg p-6 text-white ${
              isPremium ? 'ring-2 ring-white' : ''
            }`}
          >
            <h3 className="text-xl font-semibold mb-4">Премиум</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <span className="text-white mr-2">✓</span>
                <span>Неограниченный доступ ко всем CBT программам</span>
              </li>
              <li className="flex items-start">
                <span className="text-white mr-2">✓</span>
                <span>Неограниченное количество сессий</span>
              </li>
              <li className="flex items-start">
                <span className="text-white mr-2">✓</span>
                <span>Расширенная аналитика и отчеты</span>
              </li>
              <li className="flex items-start">
                <span className="text-white mr-2">✓</span>
                <span>Приоритетная поддержка</span>
              </li>
            </ul>
            {isPremium && (
              <div className="text-center py-2 bg-white/20 rounded-full font-semibold">
                ✓ Активная подписка
              </div>
            )}
          </motion.div>
        </div>

        {/* Feature Limits Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-[var(--primary-900)] mb-4">
            Ограничения текущей подписки
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">CBT программы</p>
              <p className="text-lg font-semibold text-[var(--primary-900)]">
                {limits.max_cbt_programs === null ? 'Неограниченно' : limits.max_cbt_programs}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Сессии в месяц</p>
              <p className="text-lg font-semibold text-[var(--primary-900)]">
                {limits.max_sessions_per_month === null ? 'Неограниченно' : limits.max_sessions_per_month}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Расширенная аналитика</p>
              <p className="text-lg font-semibold text-[var(--primary-900)]">
                {limits.advanced_analytics ? '✓ Доступна' : '✗ Недоступна'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Приоритетная поддержка</p>
              <p className="text-lg font-semibold text-[var(--primary-900)]">
                {limits.priority_support ? '✓ Доступна' : '✗ Недоступна'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg"
        >
          <p className="text-sm text-amber-800">
            <strong>Примечание:</strong> В тестовом режиме обновление до Премиум активирует подписку на 30 дней без реальной оплаты. 
            В продакшене будет интегрирована Stripe для обработки платежей.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
