/**
 * Mobile configuration utilities for iOS and Android
 */

// Check if running as PWA (Progressive Web App)
export const isPWA = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // Check if running in standalone mode (installed PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  const isIOSStandalone = (window.navigator as any).standalone === true
  const isInWebView = /(iPhone|iPod|iPad)(?!.*Safari\/)/.test(navigator.userAgent)
  
  return isStandalone || isIOSStandalone || isInWebView
}

// Check if running on iOS
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

// Check if running on Android
export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false
  return /Android/.test(navigator.userAgent)
}

// Check if running on mobile device
export const isMobile = (): boolean => {
  return isIOS() || isAndroid()
}

// Get device type
export const getDeviceType = (): 'ios' | 'android' | 'desktop' => {
  if (isIOS()) return 'ios'
  if (isAndroid()) return 'android'
  return 'desktop'
}

// Prompt user to install PWA
export const promptInstallPWA = (): void => {
  if (typeof window === 'undefined') return
  
  // For iOS
  if (isIOS() && !isPWA()) {
    // Show custom instruction (iOS doesn't support beforeinstallprompt)
    const message = 'Для установки приложения:\n1. Нажмите кнопку "Поделиться"\n2. Выберите "На экран \"Домой\""'
    alert(message)
    return
  }
  
  // For Android/Chrome
  const event = (window as any).deferredPrompt
  if (event) {
    event.prompt()
    event.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
      }
      (window as any).deferredPrompt = null
    })
  }
}

// Handle PWA install prompt
export const setupPWAInstall = (): void => {
  if (typeof window === 'undefined') return
  
  // Listen for beforeinstallprompt event (Android/Chrome)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    ;(window as any).deferredPrompt = e
    // You can show a custom install button here
  })
  
  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed')
    ;(window as any).deferredPrompt = null
  })
}

// Set viewport height for mobile browsers (fix for address bar)
export const setMobileViewportHeight = (): void => {
  if (typeof window === 'undefined' || !isMobile()) return
  
  const setVH = () => {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }
  
  setVH()
  window.addEventListener('resize', setVH)
  window.addEventListener('orientationchange', setVH)
}
