
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trip, Participant, Expense, Transfer } from '@/lib/types'

export function useRealtimeTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrips = async () => {
      // Загружаем данные из Supabase с участниками и расходами
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          participants(*),
          expenses(*)
        `)
        .order('createdAt', { ascending: false })

      if (error) {
        console.error('Error fetching trips:', error)
        setTrips([])
      } else {
        setTrips(data || [])
      }
      setLoading(false)
    }

    fetchTrips()

    // Подписываемся на изменения
    const channel = supabase
      .channel('trips-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'trips' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Загружаем новую поездку с полными данными
            const { data: newTrip } = await supabase
              .from('trips')
              .select(`
                *,
                participants(*),
                expenses(*)
              `)
              .eq('id', payload.new.id)
              .single()
            
            if (newTrip) {
              setTrips(prev => [newTrip, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            // Загружаем обновленную поездку с полными данными
            const { data: updatedTrip } = await supabase
              .from('trips')
              .select(`
                *,
                participants(*),
                expenses(*)
              `)
              .eq('id', payload.new.id)
              .single()
            
            if (updatedTrip) {
              setTrips(prev => prev.map(trip => 
                trip.id === payload.new.id ? updatedTrip : trip
              ))
            }
          } else if (payload.eventType === 'DELETE') {
            setTrips(prev => prev.filter(trip => trip.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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
        // Загружаем поездку
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .single()

        if (tripError) {
          console.error('Error fetching trip:', tripError)
          setLoading(false)
          return
        }

        setTrip(tripData)

        // Загружаем участников
        const { data: participantsData, error: participantsError } = await supabase
          .from('participants')
          .select('*')
          .eq('tripId', tripId)

        if (participantsError) {
          console.error('Error fetching participants:', participantsError)
        } else {
          setParticipants(participantsData || [])
        }

        // Загружаем расходы с плательщиками и долями
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select(`
            *,
            payer:participants!expenses_payerId_fkey(*),
            shares:expense_shares(*, participant:participants(*))
          `)
          .eq('tripId', tripId)
          .order('date', { ascending: false })

        if (expensesError) {
          console.error('Error fetching expenses:', expensesError)
        } else {
          setExpenses(expensesData || [])
        }

        // Загружаем переводы
        const { data: transfersData, error: transfersError } = await supabase
          .from('transfers')
          .select(`
            *,
            from:participants!transfers_fromId_fkey(*),
            to:participants!transfers_toId_fkey(*)
          `)
          .eq('tripId', tripId)
          .order('date', { ascending: false })

        if (transfersError) {
          console.error('Error fetching transfers:', transfersError)
        } else {
          setTransfers(transfersData || [])
        }

        setLoading(false)
      } catch (error) {
        console.error('Error in fetchTripData:', error)
        setLoading(false)
      }
    }

    fetchTripData()

    // Подписываемся на изменения
    const channel = supabase
      .channel(`trip-${tripId}-changes`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `tripId=eq.${tripId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setParticipants(prev => [...prev, payload.new as Participant])
          } else if (payload.eventType === 'UPDATE') {
            setParticipants(prev => prev.map(p => 
              p.id === payload.new.id ? payload.new as Participant : p
            ))
          } else if (payload.eventType === 'DELETE') {
            setParticipants(prev => prev.filter(p => p.id !== payload.old.id))
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `tripId=eq.${tripId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Перезагружаем расходы с полными данными
            const { data: expensesData } = await supabase
              .from('expenses')
              .select(`
                *,
                payer:participants!expenses_payerId_fkey(*),
                shares:expense_shares(*, participant:participants(*))
              `)
              .eq('tripId', tripId)
              .order('date', { ascending: false })
            
            setExpenses(expensesData || [])
          } else if (payload.eventType === 'DELETE') {
            setExpenses(prev => prev.filter(e => e.id !== payload.old.id))
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'transfers', filter: `tripId=eq.${tripId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Перезагружаем переводы с полными данными
            const { data: transfersData } = await supabase
              .from('transfers')
              .select(`
                *,
                from:participants!transfers_fromId_fkey(*),
                to:participants!transfers_toId_fkey(*)
              `)
              .eq('tripId', tripId)
              .order('date', { ascending: false })
            
            setTransfers(transfersData || [])
          } else if (payload.eventType === 'DELETE') {
            setTransfers(prev => prev.filter(t => t.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tripId])

  return { trip, participants, expenses, transfers, loading }
}
