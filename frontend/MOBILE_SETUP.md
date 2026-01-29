# Настройка мобильных приложений (iOS и Android)

## Обзор

Приложение настроено как Progressive Web App (PWA), что позволяет пользователям устанавливать его на iOS и Android устройства.

## Что уже настроено

✅ Web App Manifest (`manifest.json`)  
✅ iOS Meta Tags в `index.html`  
✅ Android конфигурация  
✅ Утилиты для определения мобильных устройств  
✅ Хук `useMobile` для React компонентов  
✅ Автоматическая настройка viewport для мобильных браузеров  

## Создание иконок

Для полноценной работы PWA нужны иконки различных размеров. Используйте существующий `butterfly.svg` для генерации PNG иконок.

### Вариант 1: Использование ImageMagick

```bash
# Установите ImageMagick (если еще не установлен)
# Ubuntu/Debian:
sudo apt-get install imagemagick

# macOS:
brew install imagemagick

# Создайте PNG из SVG (используйте butterfly.svg как основу)
# Размеры: 16x16, 32x32, 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512, 180x180 (для Apple)

# Пример для 192x192:
convert -background none -resize 192x192 public/butterfly.svg public/icon-192x192.png

# Или используйте скрипт:
for size in 16 32 72 96 128 144 152 192 384 512; do
  convert -background none -resize ${size}x${size} public/butterfly.svg public/icon-${size}x${size}.png
done

# Для Apple Touch Icon (180x180):
convert -background none -resize 180x180 public/butterfly.svg public/apple-touch-icon.png
```

### Вариант 2: Онлайн-инструменты

1. Используйте [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
2. Или [RealFaviconGenerator](https://realfavicongenerator.net/)
3. Или [App Icon Generator](https://www.appicon.co/)

Загрузите `butterfly.svg` и скачайте сгенерированные иконки в `frontend/public/`

### Вариант 3: Node.js скрипт

```bash
npm install -D sharp-cli

# Или используйте sharp (нужно будет написать скрипт)
npm install -D sharp
```

## Необходимые файлы

После генерации в `frontend/public/` должны быть:

- `icon-16x16.png`
- `icon-32x32.png`
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`
- `apple-touch-icon.png` (180x180)

## Использование в компонентах

### Хук useMobile

```tsx
import { useMobile } from '../hooks/useMobile'

function MyComponent() {
  const { isPWA, isIOS, isAndroid, isMobile, deviceType, canInstall } = useMobile()

  return (
    <div>
      {isMobile && <p>Мобильное устройство: {deviceType}</p>}
      {isPWA && <p>Установлено как PWA</p>}
      {canInstall && <button onClick={promptInstallPWA}>Установить приложение</button>}
    </div>
  )
}
```

### Утилиты

```tsx
import { isPWA, isIOS, isAndroid, isMobile, getDeviceType, promptInstallPWA } from '../utils/mobileConfig'

if (isMobile()) {
  console.log('Мобильное устройство:', getDeviceType())
}

if (canInstall) {
  promptInstallPWA()
}
```

## Тестирование

### iOS (Safari)

1. Откройте сайт в Safari на iPhone/iPad
2. Нажмите кнопку "Поделиться" (Share)
3. Выберите "На экран «Домой»" (Add to Home Screen)
4. Приложение появится на главном экране

### Android (Chrome)

1. Откройте сайт в Chrome на Android
2. Появится баннер "Установить приложение" или:
3. Меню → "Установить приложение"
4. Приложение установится как нативное

### Desktop (Chrome/Edge)

1. Откройте DevTools (F12)
2. Application → Manifest
3. Проверьте наличие всех иконок
4. Проверьте ошибки

## Дополнительные настройки

### Service Worker (опционально)

Для офлайн работы можно добавить Service Worker. Это требует дополнительной настройки:

```typescript
// В main.tsx добавить:
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
```

### Splash Screens (iOS)

iOS автоматически создает splash screen из иконки. Для кастомного splash screen:

```html
<!-- В index.html -->
<link rel="apple-touch-startup-image" href="/splash-iphone.png" media="(device-width: 375px)">
```

## Публикация в App Stores

### iOS App Store (требует Capacitor/Cordova)

Если нужно опубликовать в App Store, используйте Capacitor:

```bash
npm install -D @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android

npx cap init
npx cap add ios
npx cap add android

# Build
npm run build
npx cap sync
npx cap open ios  # или android
```

### Google Play Store

Аналогично, используйте Capacitor для Android версии.

## Troubleshooting

### Иконки не отображаются

1. Проверьте, что файлы находятся в `public/`
2. Проверьте пути в `manifest.json`
3. Очистите кэш браузера
4. Проверьте консоль браузера на ошибки

### PWA не устанавливается

1. Убедитесь, что сайт работает по HTTPS (обязательно для PWA)
2. Проверьте `manifest.json` на валидность
3. Убедитесь, что все необходимые иконки загружены
4. Проверьте, что `display: "standalone"` установлен в manifest

### Viewport height проблемы

Автоматически настраивается через `setMobileViewportHeight()`. Если есть проблемы:

```css
/* В index.css используйте --vh переменную */
.full-height {
  height: calc(var(--vh, 1vh) * 100);
}
```

## Дополнительные ресурсы

- [MDN Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Apple iOS PWA Guidelines](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Google PWA Checklist](https://web.dev/pwa-checklist/)
