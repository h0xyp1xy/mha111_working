import axios from 'axios'
import type {
  Message,
  ConversationSession,
  EmotionalState,
  CBTContent,
  CBTProgress,
  CrisisResource,
  VoiceInputResponse,
  DashboardData,
} from '../types'

// Helper function to get CSRF token from cookie
const getCsrfToken = (): string | null => {
  const name = 'csrftoken'
  const cookies = document.cookie.split(';')
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=')
    if (key === name) {
      return decodeURIComponent(value)
    }
  }
  return null
}

// Ensure CSRF token is available by making a GET request if needed
let csrfTokenPromise: Promise<void> | null = null
const ensureCsrfToken = async (): Promise<void> => {
  if (getCsrfToken()) {
    return Promise.resolve()
  }
  
  if (!csrfTokenPromise) {
    // Use the public CSRF token endpoint
    csrfTokenPromise = api.get('/auth/csrf-token/').then(() => {
      csrfTokenPromise = null
    }).catch(() => {
      // Even if this fails, the cookie might be set
      csrfTokenPromise = null
    })
  }
  
  return csrfTokenPromise
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include CSRF token
api.interceptors.request.use(
  async (config) => {
    // Only add CSRF token for state-changing methods
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      // Ensure we have a CSRF token before making the request
      await ensureCsrfToken()
      const csrfToken = getCsrfToken()
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 401) {
        console.error('Authentication required')
        // Could redirect to login or show auth modal
      } else if (error.response.status === 403) {
        console.error('Access forbidden:', error.response.data)
      } else if (error.response.status >= 500) {
        console.error('Server error:', error.response.status, error.response.data)
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error: No response from server')
      error.message = 'Network error: Unable to connect to server. Please check your connection.'
    } else {
      // Something else happened
      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
)

export const conversationApi = {
  getActiveSession: async (): Promise<ConversationSession | null> => {
    try {
      const response = await api.get('/sessions/active/')
      // Backend returns null/None when no active session exists
      return response.data || null
    } catch (error: any) {
      // 404 or null response means no active session, which is fine
      if (error.response?.status === 404 || !error.response) {
        return null
      }
      throw error
    }
  },
  
  createSession: async (): Promise<ConversationSession> => {
    const response = await api.post('/sessions/', {})
    return response.data
  },
  
  endSession: async (sessionId: number): Promise<void> => {
    await api.post(`/sessions/${sessionId}/end_session/`)
  },
  
  completeWithSummary: async (sessionId: number): Promise<{ summary: string; message: string }> => {
    const response = await api.post(`/sessions/${sessionId}/complete_with_summary/`)
    return response.data
  },
  
  getSession: async (sessionId: number): Promise<ConversationSession> => {
    const response = await api.get(`/sessions/${sessionId}/`)
    return response.data
  },
}

export const voiceApi = {
  processInput: async (text: string, sessionId?: number): Promise<VoiceInputResponse> => {
    const response = await api.post('/voice/process/', {
      text,
      session_id: sessionId,
    })
    return response.data
  },
}

export const emotionalStateApi = {
  create: async (data: Partial<EmotionalState>): Promise<EmotionalState> => {
    const response = await api.post('/emotional-states/', data)
    return response.data
  },
  
  getTimeline: async (days: number = 30): Promise<EmotionalState[]> => {
    const response = await api.get(`/emotional-states/timeline/?days=${days}`)
    return response.data
  },
}

export const cbtApi = {
  getContent: async (): Promise<CBTContent[]> => {
    const response = await api.get('/cbt-content/')
    return response.data.results || response.data
  },
  
  getProgress: async (): Promise<CBTProgress[]> => {
    const response = await api.get('/cbt-progress/')
    return response.data.results || response.data
  },
  
  createOrUpdateProgress: async (
    contentId: number,
    progressPercentage: number,
    completed: boolean
  ): Promise<CBTProgress> => {
    const response = await api.post('/cbt-progress/create_or_update/', {
      content_id: contentId,
      progress_percentage: progressPercentage,
      completed,
    })
    return response.data
  },
  
  updateProgress: async (
    progressId: number,
    progressPercentage: number,
    completed: boolean
  ): Promise<CBTProgress> => {
    const response = await api.post(`/cbt-progress/${progressId}/update_progress/`, {
      progress_percentage: progressPercentage,
      completed,
    })
    return response.data
  },
  
  resetAll: async (): Promise<{ message: string; deleted_count: number }> => {
    const response = await api.post('/cbt-progress/reset_all/')
    return response.data
  },
}

export const analyticsApi = {
  getDashboard: async (days: number = 30): Promise<DashboardData> => {
    const response = await api.get(`/analytics/dashboard/?days=${days}`)
    return response.data
  },
}

export const crisisApi = {
  getResources: async (): Promise<CrisisResource[]> => {
    const response = await api.get('/crisis-resources/')
    return response.data.results || response.data
  },
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  isAdmin: boolean
  subscription?: {
    tier: 'free' | 'premium'
    is_active: boolean
    is_premium: boolean
    expires_at: string | null
  }
  isPremium?: boolean
}

export interface LoginResponse {
  user: User
  message: string
}

export interface RegisterData {
  username?: string
  email: string
  password: string
  password_confirm?: string
  first_name?: string
  last_name?: string
}

export interface Subscription {
  id: number
  tier: 'free' | 'premium'
  is_active: boolean
  is_premium: boolean
  is_expired: boolean
  started_at: string
  expires_at: string | null
  cancel_at_period_end: boolean
}

export interface FeatureLimits {
  max_cbt_programs: number | null
  max_sessions_per_month: number | null
  advanced_analytics: boolean
  priority_support: boolean
  voice_sessions_per_month: number | null
}

export interface SubscriptionStatus {
  subscription: Subscription
  limits: FeatureLimits
  is_premium: boolean
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login/', { username, password })
    return response.data
  },
  
  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await api.post('/auth/register/', data)
    return response.data
  },
  
  logout: async (): Promise<void> => {
    await api.post('/auth/logout/')
  },
  
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await api.get('/auth/current-user/')
      return response.data
    } catch (error: any) {
      if (error.response?.status === 401) {
        return null
      }
      throw error
    }
  },
}

export const subscriptionApi = {
  getStatus: async (): Promise<SubscriptionStatus> => {
    const response = await api.get('/subscription/status/')
    return response.data
  },
  
  upgradeToPremium: async (): Promise<SubscriptionStatus> => {
    const response = await api.post('/subscription/upgrade/')
    return response.data
  },
  
  cancelSubscription: async (): Promise<{ message: string; subscription: Subscription }> => {
    const response = await api.post('/subscription/cancel/')
    return response.data
  },
  
  getFeatureLimits: async (): Promise<{ limits: FeatureLimits; subscription_tier: string; is_premium: boolean }> => {
    const response = await api.get('/subscription/limits/')
    return response.data
  },
}

// Admin API
export const adminApi = {
  getDashboard: async (days: number = 30) => {
    const response = await api.get(`/admin/dashboard/?days=${days}`)
    return response.data
  },
  
  getUserAnalytics: async (userId: number, days: number = 30) => {
    const response = await api.get(`/admin/users/${userId}/analytics/?days=${days}`)
    return response.data
  },
  
  getCBTContent: async () => {
    const response = await api.get('/admin/cbt-content/')
    return response.data
  },
  
  createCBTContent: async (data: Partial<CBTContent>) => {
    const response = await api.post('/admin/cbt-content/', data)
    return response.data
  },
  
  updateCBTContent: async (id: number, data: Partial<CBTContent>) => {
    const response = await api.put(`/admin/cbt-content/${id}/`, data)
    return response.data
  },
  
  deleteCBTContent: async (id: number) => {
    const response = await api.delete(`/admin/cbt-content/${id}/`)
    return response.data
  },
  
  getCrisisResources: async () => {
    const response = await api.get('/admin/crisis-resources/')
    return response.data
  },
  
  createCrisisResource: async (data: Partial<CrisisResource>) => {
    const response = await api.post('/admin/crisis-resources/', data)
    return response.data
  },
  
  updateCrisisResource: async (id: number, data: Partial<CrisisResource>) => {
    const response = await api.put(`/admin/crisis-resources/${id}/`, data)
    return response.data
  },
  
  deleteCrisisResource: async (id: number) => {
    const response = await api.delete(`/admin/crisis-resources/${id}/`)
    return response.data
  },
}

