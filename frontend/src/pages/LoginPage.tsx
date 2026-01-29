import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from '../components/Logo'
import { validateEmail } from '../utils/emailValidator'
import { useSEO } from '../hooks/useSEO'

export const LoginPage = () => {
  // SEO оптимизация
  useSEO({
    title: 'Дневник Настроения Онлайн - Новый Я - Вход | Вернись к своему эмоциональному балансу',
    description: 'Войди в свой аккаунт и продолжай путь к душевному благополучию. Отслеживай настроение, анализируй прогресс и находи поддержку.',
    keywords: 'дневник настроения онлайн, вход в аккаунт, авторизация, ментальное здоровье, отслеживание настроения',
    ogTitle: 'Дневник Настроения Онлайн - Новый Я - Вход',
    ogDescription: 'Вернись к своему эмоциональному балансу и продолжай путь к душевному благополучию',
    canonicalUrl: window.location.origin + '/login',
  })
  const [step, setStep] = useState<'email' | 'password'>(() => {
    return (sessionStorage.getItem('login_step') as 'email' | 'password') || 'email'
  })
  const [username, setUsername] = useState(() => {
    return sessionStorage.getItem('login_username') || ''
  })
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(() => {
    return sessionStorage.getItem('login_error') || null
  })
  const [errorEmail, setErrorEmail] = useState(() => {
    return sessionStorage.getItem('login_error_email') || ''
  })
  const [isUsernameFocused, setIsUsernameFocused] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [hasUsernameBeenFocused, setHasUsernameBeenFocused] = useState(false)
  const [hasPasswordBeenFocused, setHasPasswordBeenFocused] = useState(false)
  const [debouncedUsername, setDebouncedUsername] = useState('')
  const [showEmailHelp, setShowEmailHelp] = useState(false)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Clear transient error state from storage after initial load
  useEffect(() => {
    sessionStorage.removeItem('login_error')
    sessionStorage.removeItem('login_error_email')
  }, [])

  // Pre-fill email if coming from registration page (check both URL params and state)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const emailFromUrl = searchParams.get('email')
    const emailFromState = (location.state as any)?.email
    const emailToUse = emailFromUrl || emailFromState
    
    if (emailToUse && emailToUse.trim() && emailToUse !== username) {
      console.log('Email from registration:', emailToUse)
      const trimmedEmail = emailToUse.trim()
      setUsername(trimmedEmail)
      setHasUsernameBeenFocused(true)
      setError(null) // Clear any previous errors
      setPassword('') // IMPORTANT: Clear password - user needs to enter the CORRECT password for existing account
      setHasPasswordBeenFocused(false) // Reset password field state
      
      // Trigger debounce update
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      
      // Validate and set debounced username, then advance to password step
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (emailRegex.test(trimmedEmail)) {
        debounceTimeoutRef.current = setTimeout(() => {
          setDebouncedUsername(trimmedEmail)
          // Auto-advance to password step after a short delay
          setTimeout(() => {
            console.log('Auto-advancing to password step for:', trimmedEmail)
            setStep('password')
            setError(null)
            // Focus password field so user can enter their actual password
            setTimeout(() => {
              const passwordInput = document.getElementById('password') as HTMLInputElement
              if (passwordInput) {
                passwordInput.focus()
              }
            }, 100)
          }, 150)
        }, 100)
      } else {
        // Still set debounced username even if invalid format
        debounceTimeoutRef.current = setTimeout(() => {
          setDebouncedUsername(trimmedEmail)
        }, 100)
      }
      
      // Clear URL params and state to avoid re-filling on re-renders
      if (emailFromUrl) {
        navigate(location.pathname, { replace: true })
      } else if (emailFromState) {
        navigate(location.pathname, { replace: true, state: {} })
      }
    }
  }, [location.search, location.state, location.pathname, navigate, username])

  // Reset error when email changes
  useEffect(() => {
    if (error && username !== errorEmail) {
      setError(null)
      setErrorEmail('')
    }
  }, [username, error, errorEmail])

  // Debounce email input
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedUsername(username)
      if (username) {
        setShowEmailHelp(true)
      } else {
        setShowEmailHelp(false)
      }
    }, 500) // 500ms delay

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [username])

  // Hide help text when email is valid
  useEffect(() => {
    if (debouncedUsername) {
      const validation = validateEmail(debouncedUsername)
      if (validation.isValid) {
        // Hide after a short delay when valid
        const hideTimeout = setTimeout(() => {
          setShowEmailHelp(false)
        }, 2000)
        return () => clearTimeout(hideTimeout)
      }
    }
  }, [debouncedUsername])

  // Focus inputs based on current step
  useEffect(() => {
    if (step === 'email') {
      const searchParams = new URLSearchParams(location.search)
      const emailFromUrl = searchParams.get('email')
      const emailFromState = (location.state as any)?.email
      // Don't auto-focus if email is being pre-filled from URL/state (will auto-advance to password)
      if (!emailFromUrl && !emailFromState) {
        setTimeout(() => {
          emailInputRef.current?.focus()
        }, 100)
      }
    } else if (step === 'password') {
      // Focus password field when on password step
      setTimeout(() => {
        const passwordInput = document.getElementById('password') as HTMLInputElement
        if (passwordInput) {
          passwordInput.focus()
        }
      }, 100)
    }
  }, [step, location.search, location.state])

  const handleEmailSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    if (!username) {
      setError('Пожалуйста, введите электронную почту')
      return
    }

    const validation = validateEmail(username)
    if (!validation.isValid) {
      setError(validation.error || 'Пожалуйста, введите корректную электронную почту')
      return
    }

    sessionStorage.setItem('login_username', username)
    sessionStorage.setItem('login_step', 'password')
    setStep('password')

    // Focus password field after step change
    setTimeout(() => {
      const passwordInput = document.getElementById('password') as HTMLInputElement
      if (passwordInput) {
        passwordInput.focus()
      }
    }, 100)
  }

  const handlePasswordSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (e) e.stopPropagation()
    
    // Don't clear error here - let user see previous error until new attempt
    if (!password) {
      setError('Пожалуйста, введите пароль')
      return
    }

    console.log('Login attempt:', { username, passwordLength: password.length })

    try {
      const result = await login(username, password)
      console.log('Login successful:', result)
      // Only navigate on success
      setError(null)
      sessionStorage.removeItem('login_username')
      sessionStorage.removeItem('login_step')
      sessionStorage.removeItem('login_error')
      sessionStorage.removeItem('login_error_email')
      navigate('/', { replace: true })
    } catch (err: any) {
      console.error('Login error caught:', err)
      console.error('Error response:', err?.response)
      console.error('Error response data:', err?.response?.data)
      console.error('Error status:', err?.response?.status)

      // Show specific error message for password step
      let errorMsg = 'Неверный пароль. Пожалуйста, попробуйте снова.'

      if (err?.response?.status === 401) {
        errorMsg = 'Неверный логин или пароль. Пожалуйста, попробуйте снова.'
        console.log('401 error - invalid credentials')
      } else if (err?.response?.status === 400) {
        errorMsg = 'Неверный формат данных. Проверьте email и пароль.'
        console.log('400 error - bad request')
      } else if (err?.response?.data?.error) {
        errorMsg = err.response.data.error
        console.log('Server error message:', errorMsg)
      } else if (err?.message) {
        errorMsg = err.message
        console.log('Network/other error:', errorMsg)
      }

      console.log('Setting error message:', errorMsg, 'Current error state before:', error)
      setError(errorMsg)
      setErrorEmail(username)
      sessionStorage.setItem('login_error', errorMsg)
      sessionStorage.setItem('login_error_email', username)
      console.log('Error message set, current error state after:', errorMsg)

      // Clear password field on wrong password
      setPassword('')
    }
  }

  const handleBack = () => {
    setStep('email')
    setPassword('')
    setError(null)
    setErrorEmail('')
    sessionStorage.setItem('login_step', 'email')
    sessionStorage.removeItem('login_error')
    sessionStorage.removeItem('login_error_email')
  }

  const isUsernameFilled = username.length > 0
  const isPasswordFilled = password.length > 0
  const shouldMoveUsernameLabel = isUsernameFilled || isUsernameFocused
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
          <h1 className="font-normal text-[var(--primary-900)] mb-3 sm:mb-4 md:mb-6 text-left text-lg sm:text-xl md:text-2xl">
            {step === 'email' || error ? 'Вход в аккаунт' : 'Введите пароль'}
          </h1>

          {/* Outset Neumorphic Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 sm:mb-4 md:mb-6 p-2.5 sm:p-3 bg-[var(--primary-50)] text-red-700 text-xs sm:text-sm rounded-2xl shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,1)] border border-red-100/30"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-xl">⚠️</div>
                <div className="flex flex-col">
                  <span className="font-bold mb-1">Ошибка входа</span>
                  <span className="opacity-90 leading-relaxed">{error}</span>
                  {step === 'password' && (error.includes('Неверный логин') || error.toLowerCase().includes('invalid')) && (
                    <div className="flex flex-wrap gap-3 mt-4">
                      <Link
                        to={`/register?email=${encodeURIComponent(username)}`}
                        className="px-5 py-2 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors text-sm shadow-md"
                      >
                        Создать аккаунт
                      </Link>
                      <button
                        type="button"
                        onClick={handleBack}
                        className="px-5 py-2 bg-[var(--primary-50)] text-red-700 rounded-full font-medium hover:bg-red-50 transition-colors text-sm border border-red-200 shadow-sm"
                      >
                        Исправить email
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            {/* Show editable email in password step */}
            {step === 'password' && (
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => {
                      setError(null)
                      setIsUsernameFocused(true)
                      setHasUsernameBeenFocused(true)
                    }}
                    onBlur={() => setIsUsernameFocused(false)}
                    className={`w-full px-4 rounded-full text-[var(--primary-900)] neu-input shadow-[inset_8px_8px_16px_rgba(0,0,0,0.12),inset_-8px_-8px_16px_rgba(255,255,255,1)] transition-all duration-200 cursor-text ${
                      error
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'focus:ring-1 focus:ring-[var(--primary-500)]'
                    } outline-none`}
                    style={{ 
                      borderRadius: '9999px',
                      paddingTop: 'calc(1px + 1em)',
                      paddingBottom: isUsernameFocused ? 'calc(0.75rem + 3px)' : '0.75rem',
                      borderWidth: (isUsernameFocused || hasUsernameBeenFocused) ? '2px' : '0px',
                      borderStyle: 'solid',
                      borderColor: error ? '#ef4444' : 'var(--primary-500)',
                      borderImageSource: 'none'
                    }}
                    placeholder=" "
                    disabled={isLoading}
                    autoComplete="email"
                  />
                  <label
                    className={`absolute left-0 transition-all duration-200 pointer-events-none bg-[var(--primary-50)] px-2 ${
                      shouldMoveUsernameLabel
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
            )}

            {/* Step 1: Email Form */}
            {step === 'email' && (
              <div className="space-y-3 sm:space-y-4 md:space-y-5">
                <div className="relative">
                  <input
                    ref={emailInputRef}
                    id="username"
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => {
                      setError(null)
                      setIsUsernameFocused(true)
                      setHasUsernameBeenFocused(true)
                    }}
                    onBlur={() => setIsUsernameFocused(false)}
                    className={`w-full px-4 rounded-full text-[var(--primary-900)] neu-input shadow-[inset_8px_8px_16px_rgba(0,0,0,0.12),inset_-8px_-8px_16px_rgba(255,255,255,1)] transition-all duration-200 cursor-text ${
                      error
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'focus:ring-1 focus:ring-[var(--primary-500)]'
                    } outline-none`}
                    style={{ 
                      borderRadius: '9999px',
                      paddingTop: 'calc(1px + 1em)',
                      paddingBottom: isUsernameFocused ? 'calc(0.75rem + 3px)' : '0.75rem',
                      borderWidth: (isUsernameFocused || hasUsernameBeenFocused) ? '2px' : '0px',
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
                    htmlFor="username"
                    className={`absolute left-0 transition-all duration-200 pointer-events-none bg-[var(--primary-50)] px-2 ${
                      shouldMoveUsernameLabel
                        ? 'top-0 text-xs text-[var(--primary-500)] -translate-y-1/2 left-4'
                        : 'top-1/2 -translate-y-1/2 left-4 text-base text-[var(--primary-700)]'
                    }`}
                    style={{
                      borderRadius: '9999px'
                    }}
                  >
                    Электронная почта
                  </label>
                  
                  {/* Email verification message */}
                  {showEmailHelp && debouncedUsername && (
                    <div style={{ marginTop: '11px' }}>
                      {(() => {
                        const validation = validateEmail(debouncedUsername)
                        return (
                          <div className={`flex items-center gap-2 ${validation.isValid ? 'text-green-600' : 'text-amber-600'}`} style={{ fontSize: '16px' }}>
                            <span style={{ fontSize: '16px' }}>
                              {validation.isValid ? '✓' : '⚠'}
                            </span>
                            <span style={{ fontSize: '16px' }}>{validation.isValid ? 'Успех' : validation.error || 'Проверьте формат email'}</span>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4">
                  <Link
                    to="/register"
                    className="text-[var(--primary-500)] hover:text-[var(--primary-600)] font-medium transition-colors"
                    style={{ fontSize: 'calc(0.875rem + 1.5px)' }}
                  >
                    Нету аккаунта?
                  </Link>
                  <motion.button
                    type="button"
                    onClick={handleEmailSubmit}
                    disabled={isLoading || !debouncedUsername || !validateEmail(debouncedUsername).isValid}
                    className="px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 bg-[var(--primary-500)] text-white rounded-full font-medium hover:bg-[var(--primary-600)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--primary-500)] transition-colors shadow-lg text-sm sm:text-base"
                    whileHover={{ scale: isLoading || !debouncedUsername || !validateEmail(debouncedUsername).isValid ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading || !debouncedUsername || !validateEmail(debouncedUsername).isValid ? 1 : 0.98 }}
                  >
                    Далее
                  </motion.button>
                </div>
              </div>
            )}

            {/* Step 2: Password Form */}
            {step === 'password' && (
              <div className="space-y-3 sm:space-y-4 md:space-y-5">
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      // Don't clear error on onChange - let it persist until form is submitted
                    }}
                    onFocus={() => {
                      // Don't clear error on focus
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
                    autoComplete="current-password"
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit(e as any)}
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
                    onClick={handlePasswordSubmit}
                    disabled={isLoading || !password}
                    className="px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 bg-[var(--primary-500)] text-white rounded-full font-medium hover:bg-[var(--primary-600)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--primary-500)] transition-colors shadow-lg text-sm sm:text-base"
                    whileHover={{ scale: isLoading || !password ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading || !password ? 1 : 0.98 }}
                  >
                    {isLoading ? 'Вход...' : 'Войти'}
                  </motion.button>
                </div>
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
