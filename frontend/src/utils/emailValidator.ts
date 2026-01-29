/**
 * Custom email validation function
 * Validates email format with comprehensive checks
 */
export interface EmailValidationResult {
  isValid: boolean
  error?: string
  message?: string
}

export const validateEmail = (email: string): EmailValidationResult => {
  // Trim whitespace
  const trimmedEmail = email.trim()

  // Check if empty
  if (!trimmedEmail) {
    return {
      isValid: false,
      error: 'Пожалуйста, введите электронную почту'
    }
  }

  // Check for spaces
  if (trimmedEmail.includes(' ')) {
    return {
      isValid: false,
      error: 'Электронная почта не должна содержать пробелы'
    }
  }

  // Check for @ symbol
  if (!trimmedEmail.includes('@')) {
    return {
      isValid: false,
      error: 'Электронная почта должна содержать символ @'
    }
  }

  // Split by @
  const parts = trimmedEmail.split('@')
  
  // Check that there's exactly one @
  if (parts.length !== 2) {
    return {
      isValid: false,
      error: 'Некорректный формат электронной почты'
    }
  }

  const [localPart, domainPart] = parts

  // Validate local part (before @)
  if (!localPart || localPart.length === 0) {
    return {
      isValid: false,
      error: 'Часть до @ не может быть пустой'
    }
  }

  if (localPart.length > 64) {
    return {
      isValid: false,
      error: 'Локальная часть адреса слишком длинная (максимум 64 символа)'
    }
  }

  // Check for consecutive dots
  if (localPart.includes('..')) {
    return {
      isValid: false,
      error: 'Локальная часть не может содержать две точки подряд'
    }
  }

  // Check if local part starts or ends with dot
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return {
      isValid: false,
      error: 'Локальная часть не может начинаться или заканчиваться точкой'
    }
  }

  // Validate domain part (after @)
  if (!domainPart || domainPart.length === 0) {
    return {
      isValid: false,
      error: 'Часть после @ не может быть пустой'
    }
  }

  if (domainPart.length > 255) {
    return {
      isValid: false,
      error: 'Доменная часть адреса слишком длинная (максимум 255 символов)'
    }
  }

  // Check for dot in domain
  if (!domainPart.includes('.')) {
    return {
      isValid: false,
      error: 'Доменная часть должна содержать точку (например, example.com)'
    }
  }

  // Check for consecutive dots in domain
  if (domainPart.includes('..')) {
    return {
      isValid: false,
      error: 'Доменная часть не может содержать две точки подряд'
    }
  }

  // Check if domain starts or ends with dot or hyphen
  if (domainPart.startsWith('.') || domainPart.endsWith('.') || 
      domainPart.startsWith('-') || domainPart.endsWith('-')) {
    return {
      isValid: false,
      error: 'Доменная часть имеет некорректный формат'
    }
  }

  // Check for valid TLD (at least 1 character after last dot)
  const domainParts = domainPart.split('.')
  const tld = domainParts[domainParts.length - 1]
  
  if (!tld || tld.length < 1) {
    return {
      isValid: false,
      error: 'Доменная часть должна содержать корректное доменное расширение (например, .com, .ru)'
    }
  }

  // Check for valid characters (alphanumeric, dots, hyphens, underscores)
  const localPartRegex = /^[a-zA-Z0-9._+-]+$/
  const domainPartRegex = /^[a-zA-Z0-9.-]+$/

  if (!localPartRegex.test(localPart)) {
    return {
      isValid: false,
      error: 'Локальная часть содержит недопустимые символы'
    }
  }

  if (!domainPartRegex.test(domainPart)) {
    return {
      isValid: false,
      error: 'Доменная часть содержит недопустимые символы'
    }
  }

  // Final comprehensive regex check (RFC 5322 simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Пожалуйста, введите корректную электронную почту'
    }
  }

  return {
    isValid: true,
    message: 'Корректный формат email'
  }
}
