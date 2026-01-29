import { useQuery } from '@tanstack/react-query'
import { subscriptionApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import type { SubscriptionStatus, FeatureLimits } from '../types'

export const useSubscription = () => {
  const { user, isAuthenticated } = useAuth()
  
  const { data: subscriptionStatus, isLoading } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: subscriptionApi.getStatus,
    enabled: isAuthenticated && !!user,
    staleTime: 1 * 60 * 1000, // 1 minute (reduced for better real-time updates)
    retry: 1,
    refetchOnWindowFocus: true,
  })

  // Default to free tier limits if subscription data not loaded
  const defaultLimits: FeatureLimits = {
    max_cbt_programs: 2,  // Free tier: 2 programs (reduced to show limitation)
    max_sessions_per_month: 5,  // Free tier: 5 sessions (reduced)
    advanced_analytics: false,
    priority_support: false,
    voice_sessions_per_month: 3,
  }

  const isPremium = subscriptionStatus?.is_premium === true || user?.isPremium === true || false
  const limits: FeatureLimits = subscriptionStatus?.limits || defaultLimits

  return {
    isPremium,
    limits,
    subscription: subscriptionStatus?.subscription,
    isLoading,
    canAccessPremiumFeature: (feature: string) => {
      switch (feature) {
        case 'advanced_analytics':
          return limits.advanced_analytics === true
        case 'unlimited_cbt':
          return limits.max_cbt_programs === null
        case 'unlimited_sessions':
          return limits.max_sessions_per_month === null
        default:
          return isPremium === true
      }
    }
  }
}
