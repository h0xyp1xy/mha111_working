import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { Link } from 'react-router-dom'

export const CrisisAlert = () => {
  const { riskDetected, setRiskDetected } = useStore()

  if (!riskDetected) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
      >
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start space-x-4">
            <div className="text-4xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[var(--primary-900)] mb-2">
                Доступна поддержка
              </h3>
              <p className="text-gray-700 mb-4">
                Мы здесь, чтобы помочь. Если вы в кризисе, пожалуйста, обратитесь в экстренные службы или воспользуйтесь нашими ресурсами кризисной поддержки.
              </p>
              <div className="flex space-x-2">
                <Link
                  to="/crisis-support"
                  className="px-4 py-2 bg-[var(--primary-500)] text-white rounded-lg font-semibold hover:bg-[var(--primary-600)] transition-colors shadow-sm"
                  onClick={() => setRiskDetected(false)}
                >
                  Получить помощь
                </Link>
                <button
                  onClick={() => setRiskDetected(false)}
                  className="px-4 py-2 bg-[var(--primary-50)] text-gray-700 rounded-lg hover:bg-[var(--soft-gray)] transition-colors border border-[var(--soft-gray)]"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

