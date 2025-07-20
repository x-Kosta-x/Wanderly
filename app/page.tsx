
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, MapPin, Calendar, Users, Archive, Plane, TrendingUp, Globe, Trash2, RotateCcw, EyeOff, Eye } from 'lucide-react'
import { Trip } from '@/lib/types'
import { toast } from 'sonner'
import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'
import LanguageSwitcher from '@/components/language-switcher'

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const { t } = useLanguage()

  // Загрузка поездок
  useEffect(() => {
    fetchTrips()
  }, [])

  const fetchTrips = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/trips')
      if (response.ok) {
        const data = await response.json()
        setTrips(data)
      } else {
        console.error('Failed to fetch trips')
        setTrips([])
      }
    } catch (error) {
      console.error('Error fetching trips:', error)
      setTrips([])
    } finally {
      setLoading(false)
    }
  }

  const activeTrips = trips.filter(trip => !trip.isArchived)
  const archivedTrips = trips.filter(trip => trip.isArchived)

  const handleCreateTrip = async (formData: FormData) => {
    const name = formData.get('name') as string
    const location = formData.get('location') as string
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string

    if (!name.trim()) {
      toast.error(t('forms.trip.nameRequired'))
      return
    }

    try {
      const tripData = {
        name: name.trim(),
        location: location.trim() || null,
        startDate: startDate || null,
        endDate: endDate || null,
      }

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      })

      if (response.ok) {
        const newTrip = await response.json()
        setTrips(prev => [newTrip, ...prev])
        toast.success(t('messages.success.tripCreated'))
        setShowCreateForm(false)
      } else {
        console.error('Failed to create trip')
        toast.error(t('messages.error.tripCreate'))
      }
    } catch (error) {
      console.error('Error creating trip:', error)
      toast.error(t('messages.error.tripCreate'))
    }
  }

  const handleDeleteTrip = async (tripId: string, tripName: string, e: React.MouseEvent) => {
    e.preventDefault() // Предотвращаем переход по ссылке
    e.stopPropagation()

    if (!confirm(t('messages.confirmation.deleteTrip', { name: tripName }))) {
      return
    }

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTrips(prev => prev.filter(trip => trip.id !== tripId))
        toast.success(t('messages.success.tripDeleted'))
      } else {
        console.error('Failed to delete trip')
        toast.error(t('messages.error.tripDelete'))
      }
    } catch (error) {
      console.error('Error deleting trip:', error)
      toast.error(t('messages.error.tripDelete'))
    }
  }

  const handleArchiveTrip = async (tripId: string, tripName: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm(t('messages.confirmation.archiveTrip', { name: tripName }))) {
      return
    }

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isArchived: true }),
      })

      if (response.ok) {
        const updatedTrip = await response.json()
        setTrips(prev => prev.map(trip => 
          trip.id === tripId ? updatedTrip : trip
        ))
        toast.success(t('messages.success.tripArchived'))
      } else {
        console.error('Failed to archive trip')
        toast.error(t('messages.error.tripArchive'))
      }
    } catch (error) {
      console.error('Error archiving trip:', error)
      toast.error(t('messages.error.tripArchive'))
    }
  }

  const handleRestoreTrip = async (tripId: string, tripName: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm(t('messages.confirmation.restoreTrip', { name: tripName }))) {
      return
    }

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isArchived: false }),
      })

      if (response.ok) {
        const updatedTrip = await response.json()
        setTrips(prev => prev.map(trip => 
          trip.id === tripId ? updatedTrip : trip
        ))
        toast.success(t('messages.success.tripRestored'))
      } else {
        console.error('Failed to restore trip')
        toast.error(t('messages.error.tripRestore'))
      }
    } catch (error) {
      console.error('Error restoring trip:', error)
      toast.error(t('messages.error.tripRestore'))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Plane className="w-12 h-12 text-blue-600 animate-bounce mx-auto mb-4" />
          <p className="text-gray-600">{t('page.home.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Заголовок */}
      <div className="travel-gradient text-white py-16 relative">
        <div className="max-w-7xl mx-auto px-4">
          {/* Переключатель языка */}
          <div className="absolute top-6 right-4">
            <LanguageSwitcher />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* Иконка с графиком в круге */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-5xl font-bold mb-4">{t('page.home.title')}</h1>
            <p className="text-white/90 text-xl mb-8 max-w-2xl mx-auto">
              {t('page.home.subtitle')}
            </p>

            {/* Кнопка создания поездки */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto shadow-lg"
            >
              <Plus className="w-5 h-5" />
              {t('buttons.createNewTrip')}
            </button>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">


        {/* Форма создания поездки */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="travel-card p-6 mb-8"
          >
            <h2 className="text-xl font-semibold mb-4">{t('forms.trip.title')}</h2>
            <form action={handleCreateTrip} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('forms.trip.name')} *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border rounded-lg travel-input"
                  placeholder={t('forms.trip.namePlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('forms.trip.location')}
                </label>
                <input
                  type="text"
                  name="location"
                  className="w-full px-3 py-2 border rounded-lg travel-input"
                  placeholder={t('forms.trip.locationPlaceholder')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('forms.trip.startDate')}
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    className="w-full px-3 py-2 border rounded-lg travel-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('forms.trip.endDate')}
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    className="w-full px-3 py-2 border rounded-lg travel-input"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="travel-button"
                >
                  {t('buttons.createTrip')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('buttons.cancel')}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Активные поездки */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {t('page.home.activeTrips')} ({activeTrips.length})
            </h2>
            
            {/* Кнопка показать/скрыть архив */}
            {archivedTrips.length > 0 && (
              <button
                onClick={() => setShowArchive(!showArchive)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-300"
              >
                {showArchive ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    {t('page.home.hideArchive')}
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    {t('page.home.showArchive')}
                  </>
                )}
              </button>
            )}
          </div>
          
          {activeTrips.length === 0 ? (
            <div className="text-center py-16">
              <Plane className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <p className="text-gray-500 text-xl mb-6">
                {t('page.home.noTrips')}
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                {t('page.home.createFirst')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTrips.map((trip, index) => (
                <TripCard 
                  key={trip.id} 
                  trip={trip} 
                  index={index} 
                  onDelete={handleDeleteTrip}
                  onArchive={handleArchiveTrip}
                  isArchived={false}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>

        {/* Архивные поездки */}
        {showArchive && archivedTrips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold mb-8 text-gray-900">
              {t('page.home.archive')} ({archivedTrips.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {archivedTrips.map((trip, index) => (
                <TripCard 
                  key={trip.id} 
                  trip={trip} 
                  index={index} 
                  onRestore={handleRestoreTrip}
                  isArchived={true}
                  t={t}
                />
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  )
}

function TripCard({ trip, index, onDelete, onArchive, onRestore, isArchived, t }: { 
  trip: Trip
  index: number
  onDelete?: (tripId: string, tripName: string, e: React.MouseEvent) => void
  onArchive?: (tripId: string, tripName: string, e: React.MouseEvent) => void
  onRestore?: (tripId: string, tripName: string, e: React.MouseEvent) => void
  isArchived: boolean
  t: (key: string, options?: any) => string
}) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    // Определяем локаль на основе текущего языка
    const locale = t('common.language') === 'English' ? 'en-US' : 
                   t('common.language') === 'Deutsch' ? 'de-DE' : 'ru-RU'
    return new Date(dateString).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateRange = () => {
    if (!trip.startDate && !trip.endDate) {
      return t('forms.trip.datesNotSet')
    }
    if (trip.startDate && trip.endDate) {
      return `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`
    }
    return formatDate(trip.startDate || trip.endDate)
  }

  // Определяем статус поездки
  const getTripStatus = () => {
    // Если поездка архивирована, статус всегда "Завершена"
    if (isArchived) {
      return { text: t('trip.status.completed'), color: "bg-green-100 text-green-800" }
    }
    
    if (!trip.endDate) return { text: t('trip.status.planned'), color: "bg-yellow-100 text-yellow-800" }
    
    const endDate = new Date(trip.endDate)
    const today = new Date()
    
    if (endDate > today) {
      return { text: t('trip.status.planned'), color: "bg-yellow-100 text-yellow-800" }
    } else {
      return { text: t('trip.status.completed'), color: "bg-green-100 text-green-800" }
    }
  }

  // Получаем данные для поездки
  const getTripsStats = () => {
    // Возвращаем статистику из загруженных данных trip
    return {
      participantsCount: trip.participants?.length || 0,
      totalExpenses: trip.expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0,
      currency: trip.expenses?.[0]?.currency || 'RUB'
    }
  }

  const status = getTripStatus()
  const stats = getTripsStats()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative"
    >
      <Link href={`/trip/${trip.id}`}>
        <div className="bg-white rounded-xl shadow-md hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 p-6 cursor-pointer group border border-gray-100 hover:border-blue-200 relative overflow-hidden">
          {/* Тонкая цветная полоска сверху для архивных поездок */}
          {isArchived && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-400 to-gray-500"></div>
          )}
          
          {/* Макет карточки */}
          <div className="h-full">
            {/* ВЕРХНЯЯ ЧАСТЬ - Статус и кнопки действий */}
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color} ${isArchived ? 'opacity-75' : ''}`}>
                {status.text}
              </span>
              
              {/* Кнопки действий */}
              <div className="flex items-center gap-2">
                {!isArchived ? (
                  <>
                    {/* Кнопка архивирования */}
                    <button
                      onClick={(e) => onArchive?.(trip.id, trip.name, e)}
                      className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 hover:bg-blue-50 rounded-lg text-blue-500 hover:text-blue-700 hover:scale-110"
                      title="Переместить в архив"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    
                    {/* Кнопка удаления */}
                    <button
                      onClick={(e) => onDelete?.(trip.id, trip.name, e)}
                      className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 hover:scale-110"
                      title="Удалить поездку"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  /* Кнопка восстановления для архивных поездок */
                  <button
                    onClick={(e) => onRestore?.(trip.id, trip.name, e)}
                    className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 hover:bg-green-50 rounded-lg text-green-600 hover:text-green-700 hover:scale-110"
                    title="Восстановить из архива"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* ОСНОВНАЯ ИНФОРМАЦИЯ */}
            <div>
              {/* Название поездки */}
              <h3 className={`text-xl font-bold mb-3 transition-colors truncate ${
                isArchived ? 'text-gray-600 group-hover:text-gray-800' : 'text-gray-900 group-hover:text-blue-600'
              }`}>
                {trip.name}
              </h3>

              {/* Локация */}
              {trip.location && (
                <div className="flex items-center gap-2 mb-2 text-gray-500">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm truncate">{trip.location}</span>
                </div>
              )}

              {/* Даты поездки */}
              <div className="flex items-center gap-2 mb-2 text-gray-600">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{formatDateRange()}</span>
              </div>

              {/* Количество участников */}
              <div className="flex items-center gap-2 mb-4 text-gray-600">
                <Users className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  {stats.participantsCount} {
                    stats.participantsCount === 1 ? t('trip.participants') : 
                    stats.participantsCount < 5 ? t('trip.participants_plural') : 
                    t('trip.participants_many')
                  }
                </span>
              </div>

              {/* Дата создания и общие расходы */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  {t('trip.created')} {new Date(trip.createdAt).toLocaleDateString(
                    t('common.language') === 'English' ? 'en-US' : 
                    t('common.language') === 'Deutsch' ? 'de-DE' : 'ru-RU'
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold transition-colors ${
                    isArchived ? 'text-gray-500' : 'text-blue-600 group-hover:text-blue-700'
                  }`}>
                    {stats.totalExpenses.toLocaleString(
                      t('common.language') === 'English' ? 'en-US' : 
                      t('common.language') === 'Deutsch' ? 'de-DE' : 'ru-RU'
                    )} {stats.currency}
                  </div>
                  <div className="text-xs text-gray-500">{t('expense.totalExpenses')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Градиентное свечение при наведении */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>
      </Link>
    </motion.div>
  )
}
