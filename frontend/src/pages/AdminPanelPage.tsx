import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useSEO } from '../hooks/useSEO'
import type { CBTContent, CrisisResource } from '../types'

export const AdminPanelPage = () => {
  // SEO - noindex для админ-панели
  useSEO({
    title: 'Админ-панель - Новый Я',
    description: 'Административная панель',
    keywords: '',
    noindex: true,
  })
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [days, setDays] = useState(30)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cbt' | 'crisis'>('dashboard')
  
  // Redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/admin-panel/login')
      } else if (!user?.isAdmin) {
        navigate('/admin-panel/login')
      }
    }
  }, [isAuthenticated, authLoading, user, navigate])
  const [showCBTForm, setShowCBTForm] = useState(false)
  const [showCrisisForm, setShowCrisisForm] = useState(false)
  const [editingCBT, setEditingCBT] = useState<CBTContent | null>(null)
  const [editingCrisis, setEditingCrisis] = useState<CrisisResource | null>(null)
  const queryClient = useQueryClient()
  
  const [cbtFormData, setCBTFormData] = useState({
    title: '',
    category: 'foundations',
    content: '',
    audio_url: '',
    order: 0,
    is_active: true,
  })
  
  const [crisisFormData, setCrisisFormData] = useState({
    title: '',
    description: '',
    phone_number: '',
    website_url: '',
    is_emergency: false,
    order: 0,
    is_active: true,
  })

  const { data: dashboard, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['admin-dashboard', days],
    queryFn: () => adminApi.getDashboard(days),
    enabled: activeTab === 'dashboard',
    retry: false,
  })

  const { data: cbtContent, isLoading: cbtLoading } = useQuery({
    queryKey: ['admin-cbt-content'],
    queryFn: () => adminApi.getCBTContent(),
    enabled: activeTab === 'cbt',
  })

  const { data: crisisResources, isLoading: crisisLoading } = useQuery({
    queryKey: ['admin-crisis-resources'],
    queryFn: () => adminApi.getCrisisResources(),
    enabled: activeTab === 'crisis',
  })

  const deleteCBTMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteCBTContent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cbt-content'] })
    },
  })

  const deleteCrisisMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteCrisisResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-crisis-resources'] })
    },
  })

  const createCBTMutation = useMutation({
    mutationFn: (data: any) => adminApi.createCBTContent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cbt-content'] })
      setShowCBTForm(false)
      setCBTFormData({ title: '', category: 'foundations', content: '', audio_url: '', order: 0, is_active: true })
    },
  })

  const updateCBTMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => adminApi.updateCBTContent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cbt-content'] })
      setShowCBTForm(false)
      setEditingCBT(null)
    },
  })

  const createCrisisMutation = useMutation({
    mutationFn: (data: any) => adminApi.createCrisisResource(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-crisis-resources'] })
      setShowCrisisForm(false)
      setCrisisFormData({ title: '', description: '', phone_number: '', website_url: '', is_emergency: false, order: 0, is_active: true })
    },
  })

  const updateCrisisMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => adminApi.updateCrisisResource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-crisis-resources'] })
      setShowCrisisForm(false)
      setEditingCrisis(null)
    },
  })

  const handleEditCBT = (content: CBTContent) => {
    setEditingCBT(content)
    setCBTFormData({
      title: content.title,
      category: content.category,
      content: content.content,
      audio_url: content.audio_url || '',
      order: content.order,
      is_active: content.is_active,
    })
    setShowCBTForm(true)
  }

  const handleEditCrisis = (resource: CrisisResource) => {
    setEditingCrisis(resource)
    setCrisisFormData({
      title: resource.title,
      description: resource.description,
      phone_number: resource.phone_number || '',
      website_url: resource.website_url || '',
      is_emergency: resource.is_emergency,
      order: resource.order,
      is_active: resource.is_active,
    })
    setShowCrisisForm(true)
  }

  const handleSubmitCBT = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCBT) {
      updateCBTMutation.mutate({ id: editingCBT.id, data: cbtFormData })
    } else {
      createCBTMutation.mutate(cbtFormData)
    }
  }

  const handleSubmitCrisis = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCrisis) {
      updateCrisisMutation.mutate({ id: editingCrisis.id, data: crisisFormData })
    } else {
      createCrisisMutation.mutate(crisisFormData)
    }
  }

  // Check for permission errors
  const hasError = dashboardError || (dashboardLoading === false && !dashboard)
  const isUnauthorized = (dashboardError as any)?.response?.status === 403

  if (isUnauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--primary-50)]">
        <div className="neu-card p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-[var(--primary-900)] mb-4">
            Доступ запрещен
          </h2>
          <p className="text-gray-600 mb-4">
            У вас нет прав для доступа к админ панели. Обратитесь к администратору.
          </p>
          <a href="/" className="text-[var(--primary-600)] hover:underline">
            Вернуться на главную
          </a>
        </div>
      </div>
    )
  }

  if (dashboardLoading || cbtLoading || crisisLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--primary-50)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--primary-500)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--primary-700)]">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--primary-50)] p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--primary-900)] mb-2">
            Панель администратора
          </h1>
          <p className="text-gray-600">Управление системой и аналитика</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'text-[var(--primary-600)] border-b-2 border-[var(--primary-600)]'
                : 'text-gray-600 hover:text-[var(--primary-600)]'
            }`}
          >
            Аналитика
          </button>
          <button
            onClick={() => setActiveTab('cbt')}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === 'cbt'
                ? 'text-[var(--primary-600)] border-b-2 border-[var(--primary-600)]'
                : 'text-gray-600 hover:text-[var(--primary-600)]'
            }`}
          >
            CBT Контент
          </button>
          <button
            onClick={() => setActiveTab('crisis')}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === 'crisis'
                ? 'text-[var(--primary-600)] border-b-2 border-[var(--primary-600)]'
                : 'text-gray-600 hover:text-[var(--primary-600)]'
            }`}
          >
            Кризисные ресурсы
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboard && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="neu-card p-5">
                <div className="text-sm text-gray-600 mb-2">Всего пользователей</div>
                <div className="text-3xl font-bold text-[var(--primary-900)]">
                  {dashboard.overview?.total_users || 0}
                </div>
              </div>
              <div className="neu-card p-5">
                <div className="text-sm text-gray-600 mb-2">Активных пользователей</div>
                <div className="text-3xl font-bold text-[var(--primary-900)]">
                  {dashboard.overview?.active_users || 0}
                </div>
              </div>
              <div className="neu-card p-5">
                <div className="text-sm text-gray-600 mb-2">Всего сессий</div>
                <div className="text-3xl font-bold text-[var(--primary-900)]">
                  {dashboard.overview?.total_sessions || 0}
                </div>
              </div>
              <div className="neu-card p-5">
                <div className="text-sm text-gray-600 mb-2">Всего сообщений</div>
                <div className="text-3xl font-bold text-[var(--primary-900)]">
                  {dashboard.overview?.total_messages || 0}
                </div>
              </div>
            </div>

            {/* Risk Metrics */}
            <div className="neu-card p-6">
              <h2 className="text-xl font-bold text-[var(--primary-900)] mb-4">Метрики риска</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Высокорисковых сообщений</div>
                  <div className="text-2xl font-bold text-red-600">
                    {dashboard.risk_metrics?.high_risk_messages || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Пользователей в кризисе</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {dashboard.risk_metrics?.crisis_users || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* User Engagement */}
            <div className="neu-card p-6">
              <h2 className="text-xl font-bold text-[var(--primary-900)] mb-4">Топ пользователей</h2>
              <div className="space-y-2">
                {dashboard.user_engagement?.slice(0, 10).map((user: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 neu-card-inset rounded-lg">
                    <div>
                      <div className="font-medium text-[var(--primary-900)]">{user.username}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Сессий: {user.sessions}</div>
                      <div className="text-sm text-gray-600">Сообщений: {user.messages}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CBT Content Tab */}
        {activeTab === 'cbt' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[var(--primary-900)]">CBT Контент</h2>
              <button
                onClick={() => {
                  setEditingCBT(null)
                  setCBTFormData({ title: '', category: 'foundations', content: '', audio_url: '', order: 0, is_active: true })
                  setShowCBTForm(true)
                }}
                className="px-4 py-2 neu-button-primary text-white font-medium rounded-lg"
              >
                + Добавить урок
              </button>
            </div>

            {showCBTForm && (
              <div className="neu-card p-6">
                <h3 className="text-xl font-bold text-[var(--primary-900)] mb-4">
                  {editingCBT ? 'Редактировать урок' : 'Создать новый урок'}
                </h3>
                <form onSubmit={handleSubmitCBT} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--primary-700)] mb-2">Название</label>
                    <input
                      type="text"
                      value={cbtFormData.title}
                      onChange={(e) => setCBTFormData({ ...cbtFormData, title: e.target.value })}
                      className="w-full px-4 py-2 neu-input rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--primary-700)] mb-2">Категория</label>
                    <select
                      value={cbtFormData.category}
                      onChange={(e) => setCBTFormData({ ...cbtFormData, category: e.target.value })}
                      className="w-full px-4 py-2 neu-input rounded-lg"
                    >
                      <option value="foundations">Основы CBT</option>
                      <option value="techniques">Техники терапии</option>
                      <option value="conditions">Модули по состояниям</option>
                      <option value="exercises">Интерактивные упражнения</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--primary-700)] mb-2">Содержание</label>
                    <textarea
                      value={cbtFormData.content}
                      onChange={(e) => setCBTFormData({ ...cbtFormData, content: e.target.value })}
                      className="w-full px-4 py-2 neu-input rounded-lg min-h-[200px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--primary-700)] mb-2">Аудио URL (необязательно)</label>
                    <input
                      type="url"
                      value={cbtFormData.audio_url}
                      onChange={(e) => setCBTFormData({ ...cbtFormData, audio_url: e.target.value })}
                      className="w-full px-4 py-2 neu-input rounded-lg"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-[var(--primary-700)] mb-2">Порядок</label>
                      <input
                        type="number"
                        value={cbtFormData.order}
                        onChange={(e) => setCBTFormData({ ...cbtFormData, order: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 neu-input rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                      <input
                        type="checkbox"
                        checked={cbtFormData.is_active}
                        onChange={(e) => setCBTFormData({ ...cbtFormData, is_active: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <label className="text-sm font-medium text-[var(--primary-700)]">Активен</label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 neu-button-primary text-white rounded-lg">
                      {editingCBT ? 'Сохранить' : 'Создать'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCBTForm(false)
                        setEditingCBT(null)
                      }}
                      className="px-4 py-2 neu-button rounded-lg"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {cbtContent?.map((content: CBTContent) => (
                <div key={content.id} className="neu-card p-5 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-[var(--primary-900)] mb-1">{content.title}</h3>
                    <p className="text-sm text-gray-600">{content.category}</p>
                    {!content.is_active && (
                      <span className="text-xs text-red-600">Неактивен</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCBT(content)}
                      className="px-3 py-1 text-sm neu-button"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => deleteCBTMutation.mutate(content.id)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Crisis Resources Tab */}
        {activeTab === 'crisis' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[var(--primary-900)]">Кризисные ресурсы</h2>
              <button
                onClick={() => {
                  setEditingCrisis(null)
                  setCrisisFormData({ title: '', description: '', phone_number: '', website_url: '', is_emergency: false, order: 0, is_active: true })
                  setShowCrisisForm(true)
                }}
                className="px-4 py-2 neu-button-primary text-white font-medium rounded-lg"
              >
                + Добавить ресурс
              </button>
            </div>

            {showCrisisForm && (
              <div className="neu-card p-6">
                <h3 className="text-xl font-bold text-[var(--primary-900)] mb-4">
                  {editingCrisis ? 'Редактировать ресурс' : 'Создать новый ресурс'}
                </h3>
                <form onSubmit={handleSubmitCrisis} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--primary-700)] mb-2">Название</label>
                    <input
                      type="text"
                      value={crisisFormData.title}
                      onChange={(e) => setCrisisFormData({ ...crisisFormData, title: e.target.value })}
                      className="w-full px-4 py-2 neu-input rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--primary-700)] mb-2">Описание</label>
                    <textarea
                      value={crisisFormData.description}
                      onChange={(e) => setCrisisFormData({ ...crisisFormData, description: e.target.value })}
                      className="w-full px-4 py-2 neu-input rounded-lg min-h-[100px]"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--primary-700)] mb-2">Телефон</label>
                      <input
                        type="tel"
                        value={crisisFormData.phone_number}
                        onChange={(e) => setCrisisFormData({ ...crisisFormData, phone_number: e.target.value })}
                        className="w-full px-4 py-2 neu-input rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--primary-700)] mb-2">Сайт</label>
                      <input
                        type="url"
                        value={crisisFormData.website_url}
                        onChange={(e) => setCrisisFormData({ ...crisisFormData, website_url: e.target.value })}
                        className="w-full px-4 py-2 neu-input rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-[var(--primary-700)] mb-2">Порядок</label>
                      <input
                        type="number"
                        value={crisisFormData.order}
                        onChange={(e) => setCrisisFormData({ ...crisisFormData, order: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 neu-input rounded-lg"
                      />
                    </div>
                    <div className="flex flex-col gap-2 mt-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={crisisFormData.is_emergency}
                          onChange={(e) => setCrisisFormData({ ...crisisFormData, is_emergency: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-[var(--primary-700)]">Экстренный</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={crisisFormData.is_active}
                          onChange={(e) => setCrisisFormData({ ...crisisFormData, is_active: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-[var(--primary-700)]">Активен</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 neu-button-primary text-white rounded-lg">
                      {editingCrisis ? 'Сохранить' : 'Создать'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCrisisForm(false)
                        setEditingCrisis(null)
                      }}
                      className="px-4 py-2 neu-button rounded-lg"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {crisisResources?.map((resource: CrisisResource) => (
                <div key={resource.id} className="neu-card p-5 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-[var(--primary-900)]">{resource.title}</h3>
                      {resource.is_emergency && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Экстренный</span>
                      )}
                      {!resource.is_active && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">Неактивен</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{resource.description}</p>
                    {resource.phone_number && (
                      <p className="text-sm text-[var(--primary-600)] mt-1">
                        📞 {resource.phone_number}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCrisis(resource)}
                      className="px-3 py-1 text-sm neu-button"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => deleteCrisisMutation.mutate(resource.id)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

