import React from 'react'

interface IconProps {
  className?: string
  size?: number
}

// Home icon - improved minimalistic
export const HomeIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#3B82F6"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

// Chat/Message icon - improved minimalistic
export const ChatIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#10B981"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

// Mood/Emotion icon - improved minimalistic
export const MoodIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#8B5CF6"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <circle cx="9" cy="9" r="1" />
    <circle cx="15" cy="9" r="1" />
  </svg>
)

// Book/Library icon - improved minimalistic
export const BookIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#F59E0B"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

// Analytics/Progress icon - improved minimalistic
export const AnalyticsIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#6366F1"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

// Crisis/Help icon - improved minimalistic
export const CrisisIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#EF4444"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <circle cx="12" cy="16" r="0.5" fill="#EF4444" />
  </svg>
)

// Brain/Testing icon
export const BrainIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#9333EA"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44L2.5 20.5a2.5 2.5 0 0 1 0-4.96l4.54-4.54A2.5 2.5 0 0 1 9.5 2z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44l4.54-4.54a2.5 2.5 0 0 0 0-4.96L14.5 2z" />
  </svg>
)

// Happy mood icon - improved minimalistic
export const HappyIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#FBBF24"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <circle cx="9" cy="9" r="1" fill="#FBBF24" />
    <circle cx="15" cy="9" r="1" fill="#FBBF24" />
  </svg>
)

// Neutral mood icon - improved minimalistic
export const NeutralIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#6B7280"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="8" y1="15" x2="16" y2="15" />
    <circle cx="9" cy="9" r="1" fill="#6B7280" />
    <circle cx="15" cy="9" r="1" fill="#6B7280" />
  </svg>
)

// Sad mood icon - improved minimalistic
export const SadIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#3B82F6"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 15s1.5-2 4-2 4 2 4 2" />
    <circle cx="9" cy="9" r="1" fill="#3B82F6" />
    <circle cx="15" cy="9" r="1" fill="#3B82F6" />
  </svg>
)

// Anxious mood icon - clean design matching other mood icons
export const AnxiousIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#F97316"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 15s1.5-1.5 4-1.5 4 1.5 4 1.5" />
    <ellipse cx="9" cy="9" rx="1" ry="1.5" fill="#F97316" />
    <ellipse cx="15" cy="9" rx="1" ry="1.5" fill="#F97316" />
    <path d="M7 6.5l1 1M17 6.5l-1 1" />
  </svg>
)

// Angry mood icon - improved minimalistic
export const AngryIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#DC2626"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 15s1.5-2 4-2 4 2 4 2" />
    <path d="M9 9L8 8M15 9l1-1" />
  </svg>
)

// Calm mood icon - clean design matching other mood icons
export const CalmIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#10B981"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <path d="M9 9.5c0.3 0.2 0.5 0.3 0.7 0.3 0.2 0 0.4-0.1 0.7-0.3M15 9.5c-0.3 0.2-0.5 0.3-0.7 0.3-0.2 0-0.4-0.1-0.7-0.3" />
  </svg>
)

// Work icon
export const WorkIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#2563EB"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
)

// Heart icon
export const HeartIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#EC4899"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

// Health icon
export const HealthIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#10B981"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

// Money icon
export const MoneyIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#059669"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

// Future icon
export const FutureIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#7C3AED"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

// Family icon
export const FamilyIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#F472B6"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

// Sleep icon
export const SleepIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#1E40AF"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

// Energy icon
export const EnergyIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#FCD34D"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

// Check icon - improved minimalistic
export const CheckIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#10B981"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// Microphone icon (listening)
export const MicrophoneIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#3B82F6"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)

// Microphone off icon (not listening)
export const MicrophoneOffIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#9CA3AF"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2M8 23h8" />
    <line x1="12" y1="19" x2="12" y2="23" />
  </svg>
)

// Plus icon - for quick mood entry
export const PlusIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

// Homepage Mood Icon - в цвете бабочки
export const HomeMoodIcon = ({ className = '', size = 64 }: IconProps) => (
  <svg
    fill="none"
    stroke="#4A9B8C"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 64 64"
    className={className}
  >
    <circle cx="32" cy="32" r="28" />
    <path d="M20 38c0 6 5.5 10 12 10s12-4 12-10" />
    <circle cx="22" cy="24" r="3" fill="#4A9B8C" />
    <circle cx="42" cy="24" r="3" fill="#4A9B8C" />
  </svg>
)

// Homepage Analytics Icon - в цвете бабочки
export const HomeAnalyticsIcon = ({ className = '', size = 64 }: IconProps) => (
  <svg
    fill="none"
    stroke="#4A9B8C"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 64 64"
    className={className}
  >
    <line x1="48" y1="56" x2="48" y2="32" />
    <line x1="32" y1="56" x2="32" y2="16" />
    <line x1="16" y1="56" x2="16" y2="40" />
    <circle cx="48" cy="32" r="3" fill="#4A9B8C" />
    <circle cx="32" cy="16" r="3" fill="#4A9B8C" />
    <circle cx="16" cy="40" r="3" fill="#4A9B8C" />
    <path d="M16 40 L32 16 L48 32" strokeDasharray="2,2" opacity="0.4" />
  </svg>
)

// Subscription icon - Crown/Premium
export const SubscriptionIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="#F59E0B"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M12 2L15 9l7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
  </svg>
)

// Help/Question icon
export const HelpIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
