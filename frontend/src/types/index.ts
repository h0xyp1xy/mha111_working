export interface Message {
  id: number
  session: number
  sender: 'user' | 'therapist'
  content: string
  sentiment_score?: number
  sentiment_label?: string
  risk_level?: number
  created_at: string
}

export interface ConversationSession {
  id: number
  user: number
  started_at: string
  ended_at?: string
  is_active: boolean
  messages: Message[]
}

export interface EmotionalState {
  id: number
  user: number
  session?: number
  mood: string
  intensity: number
  notes: string
  recorded_at: string
}

export interface CBTContent {
  id: number
  title: string
  category: 'foundations' | 'techniques' | 'conditions' | 'exercises'
  content: string
  audio_url?: string
  order: number
  is_active: boolean
  parent?: number | null
  lessons?: CBTContent[]
  is_locked?: boolean
  created_at: string
}

export interface CBTProgress {
  id: number
  user: number
  content: CBTContent
  completed: boolean
  progress_percentage: number
  last_accessed: string
  completed_at?: string
}

export interface Analytics {
  id: number
  user: number
  date: string
  total_sessions: number
  total_messages: number
  average_sentiment?: number
  dominant_themes: string[]
  risk_events: number
}

export interface CrisisResource {
  id: number
  title: string
  description: string
  phone_number?: string
  website_url?: string
  is_emergency: boolean
  order: number
  is_active: boolean
}

export interface VoiceInputResponse {
  session_id: number
  user_message: Message
  therapist_message: Message
  analysis: {
    sentiment_score: number
    sentiment_label: string
    risk_level: number
    scores: {
      neg: number
      neu: number
      pos: number
      compound: number
    }
  }
  risk_detected: boolean
  recommended_category?: string
}

export interface DashboardData {
  total_sessions: number
  total_messages: number
  total_mood_entries?: number
  total_cbt_completed?: number
  average_sentiment?: number
  sentiment_trend?: number
  average_mood_intensity?: number
  mood_trend?: number
  mood_distribution?: Record<string, number>
  mood_avg_intensity?: Record<string, number>
  most_common_mood?: string
  risk_events: number
  wellness_score?: number
  correlation_data?: Array<{
    date: string
    mood_intensity: number
    sentiment: number
  }>
  dominant_themes: Array<{
    theme: string
    count: number
  }>
  emotional_timeline: Array<{
    date: string
    mood: string
    intensity: number
    notes?: string
    related_session_id?: number
    related_sentiment?: number
  }>
  period_days: number
  is_premium?: boolean
  upgrade_message?: string
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

