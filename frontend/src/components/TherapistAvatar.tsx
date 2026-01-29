import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface TherapistAvatarProps {
  isSpeaking: boolean
  message?: string
}

export const TherapistAvatar = ({ isSpeaking, message }: TherapistAvatarProps) => {
  const [displayedMessage, setDisplayedMessage] = useState('')

  useEffect(() => {
    if (message) {
      setDisplayedMessage('')
      let index = 0
      const interval = setInterval(() => {
        if (index < message.length) {
          setDisplayedMessage(message.slice(0, index + 1))
          index++
        } else {
          clearInterval(interval)
        }
      }, 30)

      return () => clearInterval(interval)
    }
  }, [message])

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Circle */}
      <motion.div
        className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-400)] flex items-center justify-center shadow-lg border-2 border-[var(--soft-gray)]"
        animate={{
          scale: isSpeaking ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 0.5,
          repeat: isSpeaking ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        <motion.div
          className="text-6xl"
          animate={{
            rotate: isSpeaking ? [0, 5, -5, 0] : 0,
          }}
          transition={{
            duration: 0.3,
            repeat: isSpeaking ? Infinity : 0,
          }}
        >
          👤
        </motion.div>

        {/* Speaking indicator */}
        {isSpeaking && (
          <motion.div
            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-green-400 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
            }}
          />
        )}
      </motion.div>

      {/* Speech Bubble */}
      {displayedMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md bg-[var(--primary-50)] border border-[var(--soft-gray)] rounded-2xl p-4 shadow-sm"
        >
          <p className="text-[var(--primary-900)] text-lg">{displayedMessage}</p>
          {displayedMessage === message && (
            <motion.div
              className="flex space-x-1 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}

