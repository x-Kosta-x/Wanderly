
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// POST - создать новый расход
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description, amount, currency, payerId, tripId, date, shares } = body

    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 })
    }

    if (!payerId || !tripId) {
      return NextResponse.json({ error: 'Payer and trip are required' }, { status: 400 })
    }

    if (!shares || shares.length === 0) {
      return NextResponse.json({ error: 'Expense shares are required' }, { status: 400 })
    }

    // Проверяем, что сумма долей равна общей сумме
    const totalShares = shares.reduce((sum: number, share: any) => sum + Number(share.amount), 0)
    if (Math.abs(totalShares - Number(amount)) > 0.01) {
      return NextResponse.json({ 
        error: `Shares total (${totalShares}) does not equal total amount (${amount})` 
      }, { status: 400 })
    }

    // Создаем расход
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert([{
        description: description.trim(),
        amount: Number(amount),
        currency: currency || 'RUB',
        payerId,
        tripId,
        date: date || new Date().toISOString()
      }])
      .select()
      .single()

    if (expenseError) {
      console.error('Error creating expense:', expenseError)
      return NextResponse.json({ error: expenseError.message }, { status: 500 })
    }

    // Создаем доли расходов
    const sharesData = shares.map((share: any) => ({
      expenseId: expense.id,
      participantId: share.participantId,
      amount: Number(share.amount)
    }))

    const { error: sharesError } = await supabase
      .from('expense_shares')
      .insert(sharesData)

    if (sharesError) {
      console.error('Error creating expense shares:', sharesError)
      // Удаляем созданный расход если не удалось создать доли
      await supabase.from('expenses').delete().eq('id', expense.id)
      return NextResponse.json({ error: sharesError.message }, { status: 500 })
    }

    // Получаем полную информацию о расходе
    const { data: fullExpense, error: fetchError } = await supabase
      .from('expenses')
      .select(`
        *,
        payer:participants!payerId (*),
        shares:expense_shares (
          *,
          participant:participants (*)
        )
      `)
      .eq('id', expense.id)
      .single()

    if (fetchError) {
      console.error('Error fetching created expense:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    return NextResponse.json(fullExpense)
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}

// GET - получить расходы для конкретной поездки
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('tripId')

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })
    }

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select(`
        *,
        payer:participants!payerId (*),
        shares:expense_shares (
          *,
          participant:participants (*)
        )
      `)
      .eq('tripId', tripId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching expenses:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(expenses || [])
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}
