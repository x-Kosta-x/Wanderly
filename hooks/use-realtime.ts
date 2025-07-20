
'use client'

import { useEffect, useState } from 'react'
import { Trip, Participant, Expense, Transfer } from '@/lib/types'

export function useRealtimeTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        // Загружаем данные через API
        const response = await fetch('/api/trips')
        
        if (response.ok) {
          const data = await response.json()
          setTrips(data || [])
        } else {
          console.error('Error fetching trips:', response.status)
          setTrips([])
        }
      } catch (error) {
        console.error('Error fetching trips:', error)
        setTrips([])
      } finally {
        setLoading(false)
      }
    }

    fetchTrips()

    // Для демонстрации убираем real-time обновления
    // В реальном приложении можно добавить polling или WebSocket
    
  }, [])

  return { trips, loading }
}

export function useRealtimeTrip(tripId: string) {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tripId) return

    const fetchTripData = async () => {
      try {
        // Загружаем поездку через API
        const response = await fetch(`/api/trips/${tripId}`)
        
        if (!response.ok) {
          console.error('Error fetching trip:', response.status)
          setLoading(false)
          return
        }

        const tripData = await response.json()
        
        setTrip(tripData)
        setParticipants(tripData.participants || [])
        setExpenses(tripData.expenses || [])
        setTransfers(tripData.transfers || [])
        
        setLoading(false)
      } catch (error) {
        console.error('Error in fetchTripData:', error)
        setLoading(false)
      }
    }

    fetchTripData()

    // Для демонстрации убираем real-time обновления
    // В реальном приложении можно добавить polling или WebSocket
    
  }, [tripId])

  return { trip, participants, expenses, transfers, loading }
}
