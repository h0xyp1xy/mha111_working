import { useEffect, useState } from 'react'
import { isPWA, isIOS, isAndroid, isMobile, getDeviceType, setupPWAInstall } from '../utils/mobileConfig'

export const useMobile = () => {
  const [isPWAInstalled, setIsPWAInstalled] = useState(false)
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop')
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    setIsPWAInstalled(isPWA())
    setDeviceType(getDeviceType())
    
    // Check if PWA can be installed
    if (typeof window !== 'undefined') {
      const checkInstall = () => {
        // For Android/Chrome
        if ((window as any).deferredPrompt) {
          setCanInstall(true)
        }
        // For iOS, we can't detect programmatically, but user can install manually
        if (isIOS() && !isPWA()) {
          setCanInstall(true)
        }
      }
      
      setupPWAInstall()
      checkInstall()
      
      // Listen for install prompt
      window.addEventListener('beforeinstallprompt', checkInstall)
      return () => {
        window.removeEventListener('beforeinstallprompt', checkInstall)
      }
    }
  }, [])

  return {
    isPWA: isPWAInstalled,
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    isMobile: isMobile(),
    deviceType,
    canInstall,
  }
}
