
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - получить все поездки
export async function GET() {
  try {
    const { data: trips, error } = await supabase
      .from('trips')
      .select(`
        *,
        participants (*),
        expenses (*)
      `)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching trips:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(trips || [])
  } catch (error) {
    console.error('Error fetching trips:', error)
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 })
  }
}

// POST - создать новую поездку
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, location, startDate, endDate } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Trip name is required' }, { status: 400 })
    }

    const tripData = {
      name: name.trim(),
      location: location?.trim() || null,
      startDate: startDate || null,
      endDate: endDate || null,
      isArchived: false
    }

    const { data: trip, error } = await supabase
      .from('trips')
      .insert([tripData])
      .select()
      .single()

    if (error) {
      console.error('Error creating trip:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(trip)
  } catch (error) {
    console.error('Error creating trip:', error)
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 })
  }
}
