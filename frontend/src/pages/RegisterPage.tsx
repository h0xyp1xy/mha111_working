import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from '../components/Logo'
import { validateEmail } from '../utils/emailValidator'
import { HelpIcon } from '../components/Icons'
import { useSEO } from '../hooks/useSEO'

export const RegisterPage = () => {
  // SEO оптимизация
  useSEO({
    title: 'Дневник Настроения Онлайн - Новый Я - Регистрация | Вернись к своему эмоциональному балансу',
    description: 'Создай аккаунт и начни отслеживать свое эмоциональное состояние. Простой способ заботиться о ментальном здоровье каждый день.',
    keywords: 'дневник настроения онлайн, регистрация, создать аккаунт, ментальное здоровье, отслеживание настроения, эмоциональное благополучие',
    ogTitle: 'Дневник Настроения Онлайн - Новый Я - Регистрация',
    ogDescription: 'Вернись к своему эмоциональному балансу. Отслеживай настроение и заботься о ментальном здоровье',
    canonicalUrl: window.location.origin + '/register',
  })
  const [step, setStep] = useState<'email' | 'password'>(() => {
    return (sessionStorage.getItem('register_step') as 'email' | 'password') || 'email'
  })
  const [email, setEmail] = useState(() => {
    return sessionStorage.getItem('register_email') || ''
  })
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(() => {
    return sessionStorage.getItem('register_error') || null
  })
  const [isEmailFocused, setIsEmailFocused] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [hasEmailBeenFocused, setHasEmailBeenFocused] = useState(false)
  const [hasPasswordBeenFocused, setHasPasswordBeenFocused] = useState(false)
  const [debouncedEmail, setDebouncedEmail] = useState('')
  const [showEmailHelp, setShowEmailHelp] = useState(false)
  const [showAccountExistsError, setShowAccountExistsError] = useState(() => {
    return sessionStorage.getItem('register_account_exists') === 'true'
  })
  const [errorEmail, setErrorEmail] = useState(() => {
    return sessionStorage.getItem('register_error_email') || ''
  })
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const { register, isLoading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Clear transient error state from storage after initial load
  useEffect(() => {
    sessionStorage.removeItem('register_error')
    sessionStorage.removeItem('register_account_exists')
    sessionStorage.removeItem('register_error_email')
  }, [])

  // Redirect to home page when authenticated after registration
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Focus inputs based on current step
  useEffect(() => {
    if (step === 'email') {
      setTimeout(() => {
        emailInputRef.current?.focus()
      }, 150)
    } else if (step === 'password' && !showAccountExistsError) {
      setTimeout(() => {
        const passwordInput = document.getElementById('password') as HTMLInputElement
        if (passwordInput) {
          passwordInput.focus()
        }
      }, 150)
    }
  }, [step, showAccountExistsError])

  const handleEmailSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)
    setShowAccountExistsError(false)
    setErrorEmail('')

    if (!email) {
      setError('Пожалуйста, введите электронную почту')
      return
    }

    const validation = validateEmail(email)
    if (!validation.isValid) {
      setError(validation.error || 'Пожалуйста, введите корректную электронную почту')
      return
    }

    sessionStorage.setItem('register_email', email)
    sessionStorage.setItem('register_step', 'password')
    setStep('password')
  }

  const handleRegisterSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)
    setShowAccountExistsError(false)

    if (!password) {
      setError('Пожалуйста, введите пароль')
      return
    }

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов')
      return
    }

    try {
      await register({
        email: email,
        username: email, // Use email as username
        password: password,
        password_confirm: password // Matching confirm for API requirement
      })
      
      // Clear storage on success
      sessionStorage.removeItem('register_email')
      sessionStorage.removeItem('register_step')
      sessionStorage.removeItem('register_error')
      sessionStorage.removeItem('register_account_exists')
      
      // Registration mutation already sets user in AuthContext synchronously
      // Navigate immediately - no delay needed
      navigate('/', { replace: true })
    } catch (err: any) {
      console.error('Registration error:', err)
      const errorData = err?.response?.data
      let errorMessage = 'Ошибка регистрации. Пожалуйста, попробуйте еще раз.'
      let isAccountExists = false
      
      if (errorData) {
        if (typeof errorData === 'object') {
          // Check for email or username field errors (account already exists)
          const emailError = errorData.email || errorData.username
          if (emailError) {
            const emailErrorMsg = Array.isArray(emailError) ? emailError[0] : emailError
            // Check if error indicates account already exists
            const msgLower = emailErrorMsg.toLowerCase();
            if (msgLower && (
              msgLower.includes('уже зарегистрирован') ||
              msgLower.includes('already exists') ||
              msgLower.includes('already registered')
            )) {
              errorMessage = 'Аккаунт с такой электронной почтой уже существует. Попробуйте войти или используйте другую почту.'
              isAccountExists = true
            } else {
              errorMessage = emailErrorMsg
            }
          } else {
            // Get first error from any field
            const firstField = Object.keys(errorData)[0]
            const firstError = errorData[firstField]
            const firstErrorMsg = Array.isArray(firstError) ? firstError[0] : firstError
            // Also check if it's an account exists error
            const msgLower = firstErrorMsg.toLowerCase();
            if (msgLower && (
              msgLower.includes('уже зарегистрирован') ||
              msgLower.includes('already exists') ||
              msgLower.includes('already registered')
            )) {
              errorMessage = 'Аккаунт с такой электронной почтой уже существует. Попробуйте войти или используйте другую почту.'
              isAccountExists = true
            } else {
              errorMessage = firstErrorMsg
            }
          }
        } else if (typeof errorData === 'string') {
          // Check if string error indicates account exists
          const msgLower = errorData.toLowerCase();
          if (msgLower.includes('уже зарегистрирован') || 
              msgLower.includes('already exists') || 
              msgLower.includes('already registered')) {
            errorMessage = 'Аккаунт с такой электронной почтой уже существует. Попробуйте войти или используйте другую почту.'
            isAccountExists = true
          } else {
            errorMessage = errorData
          }
        }
      }
      
      // Save error to sessionStorage for persistence after refresh
      sessionStorage.setItem('register_error', errorMessage)
      sessionStorage.setItem('register_account_exists', String(isAccountExists))
      sessionStorage.setItem('register_error_email', email)
      
      setErrorEmail(email)
      setShowAccountExistsError(isAccountExists)
      setError(errorMessage)
    }
  }

  const handleBack = () => {
    setStep('email')
    setPassword('')
    setError(null)
    setShowAccountExistsError(false)
    setErrorEmail('')
    sessionStorage.setItem('register_step', 'email')
    sessionStorage.removeItem('register_error')
    sessionStorage.removeItem('register_account_exists')
    sessionStorage.removeItem('register_error_email')
  }


  const isEmailFilled = email.length > 0
  const isPasswordFilled = password.length > 0
  const shouldMoveEmailLabel = isEmailFilled || isEmailFocused
  const shouldMovePasswordLabel = isPasswordFilled || isPasswordFocused

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 bg-[var(--primary-50)] py-4 sm:py-6">
      <div className="flex-1 flex items-center justify-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[450px] neu-card p-3 sm:p-4 md:p-6 rounded-3xl"
        >
          {/* Logo */}
          <div className="flex justify-start mb-3 sm:mb-4 md:mb-6">
            <div className="text-[var(--primary-500)] cursor-pointer hover:opacity-80 transition-opacity">
              <Logo size={60} className="text-[var(--primary-500)] sm:w-16 sm:h-16 md:w-20 md:h-20" />
            </div>
          </div>

          {/* Title */}
          <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
            <h1 className="font-normal text-[var(--primary-900)] text-left text-lg sm:text-xl md:text-2xl">
              {step === 'email' || (error && !showAccountExistsError) ? 'Создать аккаунт' : showAccountExistsError ? 'Аккаунт уже существует' : 'Придумайте пароль'}
            </h1>
            <button
              type="button"
              onClick={() => {
                const width = window.innerWidth
                alert(`Ширина экрана: ${width}px`)
              }}
              className="text-[var(--primary-500)] hover:text-[var(--primary-600)] transition-colors p-1 rounded-full hover:bg-[var(--primary-100)]"
              title="Помощь"
            >
              <HelpIcon size={24} />
            </button>
          </div>

          {/* Outset Neumorphic Error Message */}
          {error && !showAccountExistsError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 sm:mb-4 md:mb-6 p-2.5 sm:p-3 bg-[var(--primary-50)] text-red-600 text-xs sm:text-sm rounded-2xl font-medium shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,1)] border border-red-100/30 flex items-center gap-2 sm:gap-3"
            >
              <span className="text-lg sm:text-xl">⚠️</span>
              <span>{error}</span>
            </motion.div>
          )}

          {/* Account exists error message above email display */}
          {showAccountExistsError && error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 sm:mb-4 md:mb-6 p-2.5 sm:p-3 bg-[var(--primary-50)] text-red-700 text-xs sm:text-sm rounded-2xl shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,1)] border border-red-100/30"
            >
              <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                <div className="flex-shrink-0 text-xl sm:text-2xl">🚫</div>
                <div className="flex flex-col">
                  <span className="font-bold mb-1 text-sm sm:text-base">Аккаунт уже существует</span>
                  <span className="opacity-90 mb-3 sm:mb-4 leading-relaxed text-xs sm:text-sm">
                    {error.replace('Аккаунт с такой электронной почтой уже существует. ', '')}
                  </span>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <Link
                      to={`/login?email=${encodeURIComponent(email)}`}
                      className="px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors text-xs sm:text-sm shadow-md"
                    >
                      Войти в аккаунт
                    </Link>
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-[var(--primary-50)] text-red-700 rounded-full font-medium hover:bg-red-50 transition-colors text-xs sm:text-sm border border-red-200 shadow-sm"
                    >
                      Ввести новую почту
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            {/* Step 1: Email Form */}
            {step === 'email' && (
              <div className="space-y-3 sm:space-y-4 md:space-y-5">
                <div className="relative">
                  <input
                    ref={emailInputRef}
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => {
                      setError(null)
                      setIsEmailFocused(true)
                      setHasEmailBeenFocused(true)
                    }}
                    onBlur={() => setIsEmailFocused(false)}
                    className={`w-full px-4 rounded-full text-[var(--primary-900)] neu-input shadow-[inset_8px_8px_16px_rgba(0,0,0,0.12),inset_-8px_-8px_16px_rgba(255,255,255,1)] transition-all duration-200 cursor-text ${
                      error
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'focus:ring-1 focus:ring-[var(--primary-500)]'
                    } outline-none`}
                    style={{ 
                      borderRadius: '9999px',
                      paddingTop: 'calc(1px + 1em)',
                      paddingBottom: isEmailFocused ? 'calc(0.75rem + 3px)' : '0.75rem',
                      borderWidth: (isEmailFocused || hasEmailBeenFocused) ? '2px' : '0px',
                      borderStyle: 'solid',
                      borderColor: error ? '#ef4444' : 'var(--primary-500)',
                      borderImageSource: 'none'
                    }}
                    placeholder=" "
                    disabled={isLoading}
                    autoComplete="email"
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit(e as any)}
                  />
                  <label
                    htmlFor="email"
                    className={`absolute left-0 transition-all duration-200 pointer-events-none bg-[var(--primary-50)] px-2 ${
                      shouldMoveEmailLabel
                        ? 'top-0 text-xs text-[var(--primary-500)] -translate-y-1/2 left-4'
                        : 'top-1/2 -translate-y-1/2 left-4 text-base text-[var(--primary-700)]'
                    }`}
                    style={{
                      borderRadius: '9999px'
                    }}
                  >
                    Электронная почта
                  </label>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <Link
                    to="/login"
                    className="text-[var(--primary-500)] hover:text-[var(--primary-600)] font-medium transition-colors"
                    style={{ fontSize: 'calc(0.875rem + 1.5px)' }}
                  >
                    Уже есть аккаунт?
                  </Link>
                  <motion.button
                    type="button"
                    onClick={handleEmailSubmit}
                    disabled={isLoading || !email || !validateEmail(email).isValid}
                    className="px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 bg-[var(--primary-500)] text-white rounded-full font-medium hover:bg-[var(--primary-600)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--primary-500)] transition-colors shadow-lg text-sm sm:text-base"
                    whileHover={{ scale: isLoading || !email || !validateEmail(email).isValid ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading || !email || !validateEmail(email).isValid ? 1 : 0.98 }}
                  >
                    Далее
                  </motion.button>
                </div>
              </div>
            )}

            {/* Step 2: Password Form */}
            {step === 'password' && (
              <div className="space-y-3 sm:space-y-4 md:space-y-5">
                {/* Show editable email in password step */}
                <div className="mb-3 sm:mb-4 md:mb-5">
                  <div className="relative">
                    <input
                      id="email-edit"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setError(null)
                        setErrorEmail('')
                      }}
                      onFocus={() => {
                        setIsEmailFocused(true)
                        setHasEmailBeenFocused(true)
                        setError(null)
                      }}
                      onBlur={() => setIsEmailFocused(false)}
                      className={`w-full px-4 rounded-full text-[var(--primary-900)] neu-input shadow-[inset_8px_8px_16px_rgba(0,0,0,0.12),inset_-8px_-8px_16px_rgba(255,255,255,1)] transition-all duration-200 cursor-text ${
                        showAccountExistsError
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : error
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'focus:ring-1 focus:ring-[var(--primary-500)]'
                      } outline-none`}
                      style={{ 
                        borderRadius: '9999px',
                        paddingTop: 'calc(1px + 1em)',
                        paddingBottom: isEmailFocused ? 'calc(0.75rem + 3px)' : '0.75rem',
                        borderWidth: (isEmailFocused || hasEmailBeenFocused) ? '2px' : '0px',
                        borderStyle: 'solid',
                        borderColor: showAccountExistsError || error ? '#ef4444' : 'var(--primary-500)',
                        borderImageSource: 'none'
                      }}
                      placeholder=" "
                      disabled={isLoading}
                      autoComplete="email"
                    />
                    <label
                      htmlFor="email-edit"
                      className={`absolute left-0 transition-all duration-200 pointer-events-none bg-[var(--primary-50)] px-2 ${
                        shouldMoveEmailLabel
                          ? 'top-0 text-xs text-[var(--primary-500)] -translate-y-1/2 left-4'
                          : 'top-1/2 -translate-y-1/2 left-4 text-base text-[var(--primary-700)]'
                      }`}
                      style={{
                        borderRadius: '9999px'
                      }}
                    >
                      Электронная почта
                    </label>
                  </div>
                </div>

                {!showAccountExistsError && (
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => {
                        setError(null)
                        setIsPasswordFocused(true)
                        setHasPasswordBeenFocused(true)
                      }}
                      onBlur={() => setIsPasswordFocused(false)}
                      className={`w-full px-4 pb-3 pr-12 rounded-full text-[var(--primary-900)] neu-input shadow-[inset_8px_8px_16px_rgba(0,0,0,0.12),inset_-8px_-8px_16px_rgba(255,255,255,1)] transition-all duration-200 cursor-text ${
                        error
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'focus:ring-1 focus:ring-[var(--primary-500)]'
                      } outline-none`}
                      style={{ 
                        borderRadius: '9999px',
                        paddingTop: 'calc(1.25rem + 2px)',
                        borderWidth: (isPasswordFocused || hasPasswordBeenFocused) ? '2px' : '0px',
                        borderStyle: 'solid',
                        borderColor: error ? '#ef4444' : 'var(--primary-500)',
                        borderImageSource: 'none'
                      }}
                      placeholder=" "
                      disabled={isLoading}
                      autoComplete="new-password"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleRegisterSubmit(e as any)}
                    />
                    <label
                      htmlFor="password"
                      className={`absolute left-0 transition-all duration-200 pointer-events-none bg-[var(--primary-50)] px-2 ${
                        shouldMovePasswordLabel
                          ? 'top-0 text-xs text-[var(--primary-500)] -translate-y-1/2 left-4'
                          : 'top-1/2 -translate-y-1/2 left-4 text-base text-[var(--primary-700)]'
                      }`}
                      style={{
                        borderRadius: '9999px'
                      }}
                    >
                      Пароль
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--primary-600)] hover:text-[var(--primary-700)] p-1 text-xl transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? '🫣' : '👁️'}
                    </button>
                  </div>
                )}

                {/* Other errors below password input */}
                {error && !showAccountExistsError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 bg-[var(--primary-50)] text-red-700 text-sm rounded-2xl shadow-[4px_4px_8px_rgba(0,0,0,0.08),-4px_-4px_8px_rgba(255,255,255,1)] border border-red-100/20"
                  >
                    <div className="flex-shrink-0 text-lg">
                      ⚠️
                    </div>
                    <div>
                      <span className="font-bold">Ошибка:</span> {error}
                    </div>
                  </motion.div>
                )}

                {!showAccountExistsError && (
                  <div className="flex justify-between items-center pt-4">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="text-[var(--primary-500)] hover:text-[var(--primary-600)] font-medium transition-colors"
                      style={{ fontSize: 'calc(0.875rem + 1.5px)' }}
                    >
                      Назад
                    </button>
                    <motion.button
                      type="button"
                      onClick={handleRegisterSubmit}
                      disabled={isLoading || !password}
                      className="px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 bg-[var(--primary-500)] text-white rounded-full font-medium hover:bg-[var(--primary-600)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--primary-500)] transition-colors shadow-lg text-sm sm:text-base"
                      whileHover={{ scale: isLoading || !password ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading || !password ? 1 : 0.98 }}
                    >
                      {isLoading ? 'Загрузка...' : 'Готово'}
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Copyright Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full bg-[var(--primary-50)]" 
        style={{ paddingLeft: '15px', paddingBottom: '10px', paddingTop: '20px' }}
      >
        <p className="text-[var(--primary-900)] font-medium text-base tracking-wide">
          © Новый Я 2026
        </p>
      </motion.div>
    </div>
  )
}
