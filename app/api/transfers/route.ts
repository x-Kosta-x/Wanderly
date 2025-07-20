
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// POST - создать новый перевод
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency, fromId, toId, tripId, description, date } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 })
    }

    if (!fromId || !toId || !tripId) {
      return NextResponse.json({ error: 'Sender, recipient and trip are required' }, { status: 400 })
    }

    if (fromId === toId) {
      return NextResponse.json({ error: 'Sender and recipient cannot be the same person' }, { status: 400 })
    }

    const { data: transfer, error } = await supabase
      .from('transfers')
      .insert([{
        amount: Number(amount),
        currency: currency || 'RUB',
        fromId,
        toId,
        tripId,
        description: description?.trim() || null,
        date: date || new Date().toISOString()
      }])
      .select(`
        *,
        from:participants!fromId (*),
        to:participants!toId (*)
      `)
      .single()

    if (error) {
      console.error('Error creating transfer:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(transfer)
  } catch (error) {
    console.error('Error creating transfer:', error)
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 })
  }
}

// GET - получить переводы для конкретной поездки
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('tripId')

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })
    }

    const { data: transfers, error } = await supabase
      .from('transfers')
      .select(`
        *,
        from:participants!fromId (*),
        to:participants!toId (*)
      `)
      .eq('tripId', tripId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching transfers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(transfers || [])
  } catch (error) {
    console.error('Error fetching transfers:', error)
    return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 })
  }
}
