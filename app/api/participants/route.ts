
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// POST - создать нового участника
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, tripId } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Participant name is required' }, { status: 400 })
    }

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })
    }

    // Проверяем, что поездка существует
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id')
      .eq('id', tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const { data: participant, error } = await supabase
      .from('participants')
      .insert([{ name: name.trim(), tripId }])
      .select()
      .single()

    if (error) {
      console.error('Error creating participant:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(participant)
  } catch (error) {
    console.error('Error creating participant:', error)
    return NextResponse.json({ error: 'Failed to create participant' }, { status: 500 })
  }
}

// GET - получить участников для конкретной поездки
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('tripId')

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })
    }

    const { data: participants, error } = await supabase
      .from('participants')
      .select('*')
      .eq('tripId', tripId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching participants:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(participants || [])
  } catch (error) {
    console.error('Error fetching participants:', error)
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
  }
}
