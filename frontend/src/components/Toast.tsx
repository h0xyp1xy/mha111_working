import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="pointer-events-auto"
          >
            <div
              className={`neu-card p-4 min-w-[300px] max-w-md shadow-lg ${
                toast.type === 'success'
                  ? 'border-l-4 border-green-500'
                  : toast.type === 'error'
                  ? 'border-l-4 border-red-500'
                  : toast.type === 'warning'
                  ? 'border-l-4 border-yellow-500'
                  : 'border-l-4 border-blue-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-xl">
                  {toast.type === 'success' && '✅'}
                  {toast.type === 'error' && '❌'}
                  {toast.type === 'warning' && '⚠️'}
                  {toast.type === 'info' && 'ℹ️'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--primary-900)]">{toast.message}</p>
                </div>
                <button
                  onClick={() => onRemove(toast.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Hook for using toasts
let toastIdCounter = 0
const toastListeners: Array<(toast: Toast) => void> = []

export const useToast = () => {
  const showToast = (message: string, type: Toast['type'] = 'info', duration = 5000) => {
    const toast: Toast = {
      id: `toast-${toastIdCounter++}`,
      message,
      type,
      duration,
    }
    toastListeners.forEach((listener) => listener(toast))
    
    if (duration > 0) {
      setTimeout(() => {
        toastListeners.forEach((listener) => listener({ ...toast, id: `remove-${toast.id}` }))
      }, duration)
    }
  }

  return {
    success: (message: string, duration?: number) => showToast(message, 'success', duration),
    error: (message: string, duration?: number) => showToast(message, 'error', duration),
    info: (message: string, duration?: number) => showToast(message, 'info', duration),
    warning: (message: string, duration?: number) => showToast(message, 'warning', duration),
  }
}

// Global toast manager component
export const ToastManager = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (toast: Toast) => {
      if (toast.id.startsWith('remove-')) {
        const idToRemove = toast.id.replace('remove-', '')
        setToasts((prev) => prev.filter((t) => t.id !== idToRemove))
      } else {
        setToasts((prev) => [...prev, toast])
      }
    }
    toastListeners.push(listener)
    return () => {
      const index = toastListeners.indexOf(listener)
      if (index > -1) toastListeners.splice(index, 1)
    }
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return <ToastContainer toasts={toasts} onRemove={removeToast} />
}






