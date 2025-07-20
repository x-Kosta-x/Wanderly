
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - получить конкретную поездку
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data: trip, error } = await supabase
      .from('trips')
      .select(`
        *,
        participants (*),
        expenses (
          *,
          payer:participants!payerId (*),
          shares:expense_shares (
            *,
            participant:participants (*)
          )
        ),
        transfers (
          *,
          from:participants!fromId (*),
          to:participants!toId (*)
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching trip:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    return NextResponse.json(trip)
  } catch (error) {
    console.error('Error fetching trip:', error)
    return NextResponse.json({ error: 'Failed to fetch trip' }, { status: 500 })
  }
}

// PUT - обновить поездку
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, location, startDate, endDate, isArchived } = body

    const updateData: any = {}

    if (name !== undefined) {
      if (!name?.trim()) {
        return NextResponse.json({ error: 'Trip name is required' }, { status: 400 })
      }
      updateData.name = name.trim()
    }

    if (location !== undefined) {
      updateData.location = location?.trim() || null
    }

    if (startDate !== undefined) {
      updateData.startDate = startDate || null
    }

    if (endDate !== undefined) {
      updateData.endDate = endDate || null
    }

    if (isArchived !== undefined) {
      updateData.isArchived = isArchived
    }

    const { data: trip, error } = await supabase
      .from('trips')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating trip:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    return NextResponse.json(trip)
  } catch (error) {
    console.error('Error updating trip:', error)
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 })
  }
}

// DELETE - удалить поездку
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting trip:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Trip deleted successfully' })
  } catch (error) {
    console.error('Error deleting trip:', error)
    return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 })
  }
}
