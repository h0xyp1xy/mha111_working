import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { crisisApi } from '../services/api'
import { useSEO } from '../hooks/useSEO'
import type { CrisisResource } from '../types'

// Default Russian crisis support resources
const defaultRussianResources: CrisisResource[] = [
  {
    id: -1,
    title: 'Единый номер экстренных служб',
    description: 'Для вызова полиции, скорой помощи или пожарной службы',
    phone_number: '112',
    is_emergency: true,
    order: 1,
    is_active: true,
  },
  {
    id: -3,
    title: 'Телефон доверия экстренной психологической помощи',
    description: 'Круглосуточная бесплатная психологическая помощь',
    phone_number: '8 800 333 44 34',
    is_emergency: true,
    order: 3,
    is_active: true,
  },
  {
    id: -4,
    title: 'Экстренная психологическая помощь МЧС',
    description: 'Круглосуточная психологическая помощь в экстренных ситуациях',
    phone_number: '+7 (495) 989 50 50',
    is_emergency: true,
    order: 4,
    is_active: true,
  },
  {
    id: -5,
    title: 'Телефон доверия для детей и подростков',
    description: 'Бесплатная, анонимная и конфиденциальная поддержка для детей, подростков и родителей',
    phone_number: '8 800 2000 122',
    website_url: 'https://telefon-doveria.ru',
    is_emergency: false,
    order: 1,
    is_active: true,
  },
  {
    id: -6,
    title: 'Насилию.нет',
    description: 'Помощь пострадавшим от домашнего насилия',
    phone_number: '8 800 7000 600',
    website_url: 'https://nasiliu.net',
    is_emergency: false,
    order: 2,
    is_active: true,
  },
  {
    id: -7,
    title: 'Горячая линия помощи при зависимости',
    description: 'Поддержка для людей, страдающих от зависимости',
    phone_number: '8 800 700 50 50',
    is_emergency: false,
    order: 3,
    is_active: true,
  },
  {
    id: -8,
    title: 'Российский Красный Крест - Психологическая поддержка',
    description: 'Горячая линия для пострадавших от кризисных ситуаций',
    phone_number: '8 (800) 700 44 50',
    website_url: 'https://www.redcross.ru',
    is_emergency: false,
    order: 4,
    is_active: true,
  },
  {
    id: -9,
    title: 'Психологическая поддержка (Telegram бот)',
    description: 'Первичная психологическая поддержка в текстовом формате',
    website_url: 'https://t.me/psy_rrc_bot',
    is_emergency: false,
    order: 5,
    is_active: true,
  },
]

export const CrisisSupportPage = () => {
  // SEO оптимизация
  useSEO({
    title: 'Кризисная поддержка - Новый Я | Экстренная психологическая помощь',
    description: 'Телефоны доверия и экстренные службы помощи. Круглосуточная психологическая поддержка в сложные моменты. Ты не один.',
    keywords: 'кризисная поддержка, экстренная помощь, телефон доверия, психологическая помощь, кризисная ситуация',
    ogTitle: 'Кризисная поддержка - Новый Я',
    ogDescription: 'Экстренная психологическая помощь и телефоны доверия. Круглосуточная поддержка в сложные моменты',
    canonicalUrl: window.location.origin + '/crisis-support',
  })
  
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  
  const { data: resources = [] } = useQuery({
    queryKey: ['crisis-resources'],
    queryFn: crisisApi.getResources,
  })
  
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  // Filter out American mental health resources
  const americanResourceKeywords = [
    'suicide prevention',
    'crisis text line',
    'mental health america',
    'national suicide',
    '988',
    'text home',
  ]
  
  const filteredResources = resources.filter((r: CrisisResource) => {
    const title = (r.title || '').toLowerCase()
    const description = (r.description || '').toLowerCase()
    const phone = (r.phone_number || '').toLowerCase()
    
    return !americanResourceKeywords.some(keyword => 
      title.includes(keyword.toLowerCase()) ||
      description.includes(keyword.toLowerCase()) ||
      phone.includes(keyword.toLowerCase())
    )
  })

  // Always use Russian defaults, merge with filtered API resources if available
  // Remove duplicates based on phone number or title
  const apiResourceIds = new Set(filteredResources.map((r: CrisisResource) => r.id))
  const uniqueDefaults = defaultRussianResources.filter(r => !apiResourceIds.has(r.id))
  const allResources = [...filteredResources, ...uniqueDefaults].sort((a, b) => {
    // Sort by is_emergency first (emergency first), then by order
    if (a.is_emergency !== b.is_emergency) {
      return a.is_emergency ? -1 : 1
    }
    return a.order - b.order
  })
  
  const emergencyResources = allResources.filter((r: CrisisResource) => r.is_emergency)
  const generalResources = allResources.filter((r: CrisisResource) => !r.is_emergency)

  return (
    <div className="min-h-screen p-8 bg-[var(--primary-50)]">
      <div className="max-w-4xl mx-auto">
        <motion.h1
          className="text-4xl font-bold text-[var(--primary-900)] mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Кризисная поддержка и ресурсы
        </motion.h1>

        {/* Emergency Support Section */}
        <motion.div
          className="neu-card mb-6 overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <button
            onClick={() => toggleSection('emergency')}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-[var(--primary-50)] transition-colors"
          >
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-[var(--primary-900)]">⚠️ Экстренная поддержка</h2>
              {emergencyResources.length > 0 && emergencyResources[0].phone_number && (
                <a
                  href={`tel:${emergencyResources[0].phone_number.replace(/\s/g, '')}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold text-base sm:text-lg shadow-lg"
                >
                  📞 {emergencyResources[0].phone_number}
                </a>
              )}
            </div>
            <motion.svg
              animate={{ rotate: expandedSection === 'emergency' ? 180 : 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-6 h-6 text-[var(--primary-700)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </button>
          <AnimatePresence>
            {expandedSection === 'emergency' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6">
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    Если вы находитесь в непосредственной опасности или переживаете кризис психического здоровья, немедленно обратитесь в службы экстренной помощи.
                  </p>
                  <div className="space-y-6">
                    {emergencyResources.length === 0 ? (
                      <p className="text-gray-600 text-center py-8">Загрузка ресурсов...</p>
                    ) : (
                      emergencyResources.map((resource: CrisisResource) => (
                        <motion.div
                          key={resource.id}
                          className="neu-card p-6 hover:bg-[var(--primary-100)] transition-colors"
                          whileHover={{ scale: 1.01, y: -2 }}
                          whileTap={{ scale: 0.99 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                        >
                          <h3 className="text-xl font-bold text-[var(--primary-900)] mb-3">{resource.title}</h3>
                          <p className="text-gray-700 mb-5 leading-relaxed">{resource.description}</p>
                          <div className="flex flex-wrap gap-4">
                            {resource.phone_number && (
                              <a
                                href={`tel:${resource.phone_number.replace(/\s/g, '')}`}
                                className="inline-flex items-center px-6 py-3 neu-button-primary font-semibold text-base"
                              >
                                📞 Позвонить: {resource.phone_number}
                              </a>
                            )}
                            {resource.website_url && (
                              <a
                                href={resource.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-6 py-3 neu-button-primary font-semibold text-base"
                              >
                                🌐 Посетить сайт
                              </a>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Safety Plan Section */}
        <motion.div
          className="neu-card overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => toggleSection('safety')}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-[var(--primary-50)] transition-colors"
          >
            <h2 className="text-2xl font-bold text-[var(--primary-900)]">📋 План безопасности</h2>
            <motion.svg
              animate={{ rotate: expandedSection === 'safety' ? 180 : 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-6 h-6 text-[var(--primary-700)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </button>
          <AnimatePresence>
            {expandedSection === 'safety' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6">
          <div className="space-y-8">
            <motion.div
              className="neu-card-inset p-6"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-xl font-semibold text-[var(--primary-900)] mb-4">1. Осознайте и назовите кризис</h3>
              <p className="text-gray-700 leading-relaxed">
                Произнесите вслух или про себя: «У меня кризис. Мои мысли и чувства переполняют меня. Это временное состояние, и я могу с ним справиться».
              </p>
            </motion.div>

            <motion.div
              className="neu-card-inset p-6"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-xl font-semibold text-[var(--primary-900)] mb-4">2. Обеспечьте физическую безопасность</h3>
              <p className="text-gray-700 leading-relaxed">
                Если есть мысли о самоповреждении или суициде: Немедленно уберите подальше опасные предметы (лекарства, острые предметы). Перейдите в безопасное место (например, из ванной в гостиную).
              </p>
            </motion.div>

            <motion.div
              className="neu-card-inset p-6"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h3 className="text-xl font-semibold text-[var(--primary-900)] mb-4">3. Свяжитесь с экстренной службой</h3>
              <div className="space-y-4">
                <div className="neu-card-inset p-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Телефон доверия:</strong> <a href="tel:88002000122" className="text-[var(--primary-500)] hover:text-[var(--primary-600)] underline font-medium">8-800-2000-122</a> (Единый общероссийский телефон доверия для детей, подростков и их родителей) или <a href="tel:88003334434" className="text-[var(--primary-500)] hover:text-[var(--primary-600)] underline font-medium">8-800-333-44-34</a> (Российская ассоциация психологической помощи).
                  </p>
                </div>
                <div className="neu-card-inset p-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Скорая психологическая помощь:</strong> <a href="tel:051" className="text-[var(--primary-500)] hover:text-[var(--primary-600)] underline font-medium">051</a> (с мобильного в Москве) или <a href="tel:+7495051" className="text-[var(--primary-500)] hover:text-[var(--primary-600)] underline font-medium">+7 (495) 051</a> (из других регионов).
                  </p>
                </div>
                <div className="neu-card-inset p-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Экстренный номер:</strong> <a href="tel:112" className="text-[var(--primary-600)] hover:text-[var(--primary-700)] underline font-semibold">112</a>. Четко скажите: «Я переживаю острый психологический кризис. Мне нужна помощь.»
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="neu-card-inset p-6"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <h3 className="text-xl font-semibold text-[var(--primary-900)] mb-4">4. Свяжитесь с «живым щитом»</h3>
              <p className="text-gray-700 leading-relaxed">
                Позвоните или напишите человеку из вашей группы поддержки. Скажите прямо: «Мне очень плохо, у меня кризис. Можешь просто побыть со мной на связи?»
              </p>
            </motion.div>
          </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

