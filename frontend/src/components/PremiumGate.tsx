import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { SubscriptionIcon } from './Icons'

interface PremiumGateProps {
  feature: string
  children?: React.ReactNode
  className?: string
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ feature, children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative ${className}`}
    >
      {children}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10">
        <div className="text-center p-6 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 text-[var(--primary-500)] flex items-center justify-center">
            <SubscriptionIcon size={48} />
          </div>
          <h3 className="text-xl font-bold text-[var(--primary-900)] mb-2">
            Премиум функция
          </h3>
          <p className="text-gray-600 mb-4">
            {feature} доступна только для пользователей с Премиум подпиской.
          </p>
          <Link
            to="/subscription"
            className="inline-block px-6 py-3 bg-[var(--primary-500)] text-white rounded-full font-semibold hover:bg-[var(--primary-600)] transition-colors"
          >
            Обновить до Премиум
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

interface PremiumBadgeProps {
  className?: string
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-semibold rounded-full ${className}`}>
      <SubscriptionIcon size={12} />
      Premium
    </span>
  )
}
