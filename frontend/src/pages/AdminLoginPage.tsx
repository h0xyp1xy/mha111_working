import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useSEO } from '../hooks/useSEO'

export const AdminLoginPage = () => {
  // SEO - noindex для админ-панели
  useSEO({
    title: 'Админ-панель - Новый Я',
    description: 'Административная панель',
    keywords: '',
    noindex: true,
  })
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(username, password)
      // Check if user is admin (this will be checked on backend)
      navigate('/admin-panel')
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Ошибка входа. Проверьте логин и пароль.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--primary-50)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neu-card p-8 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[var(--primary-900)] mb-2">
            🔐 Админ-панель
          </h1>
          <p className="text-gray-600">
            Войдите для доступа к административной панели
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--primary-700)] mb-2">
              Имя пользователя
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 neu-input rounded-lg focus:ring-2 focus:ring-[var(--primary-300)]"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--primary-700)] mb-2">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 neu-input rounded-lg focus:ring-2 focus:ring-[var(--primary-300)]"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <motion.button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full px-4 py-3 neu-button-primary text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Вход...
              </span>
            ) : (
              'Войти'
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-[var(--primary-600)] hover:underline text-sm">
            ← Вернуться на главную
          </a>
        </div>
      </motion.div>
    </div>
  )
}

