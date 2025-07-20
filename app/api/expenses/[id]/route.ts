
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// PUT - обновить расход
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { description, amount, currency, payerId, date, shares } = body

    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 })
    }

    if (!payerId) {
      return NextResponse.json({ error: 'Payer is required' }, { status: 400 })
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

    // Обновляем расход
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .update({
        description: description.trim(),
        amount: Number(amount),
        currency: currency || 'RUB',
        payerId,
        date: date || new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (expenseError) {
      console.error('Error updating expense:', expenseError)
      return NextResponse.json({ error: expenseError.message }, { status: 500 })
    }

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Удаляем старые доли
    const { error: deleteError } = await supabase
      .from('expense_shares')
      .delete()
      .eq('expenseId', params.id)

    if (deleteError) {
      console.error('Error deleting old expense shares:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Создаем новые доли расходов
    const sharesData = shares.map((share: any) => ({
      expenseId: params.id,
      participantId: share.participantId,
      amount: Number(share.amount)
    }))

    const { error: sharesError } = await supabase
      .from('expense_shares')
      .insert(sharesData)

    if (sharesError) {
      console.error('Error creating expense shares:', sharesError)
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
      .eq('id', params.id)
      .single()

    if (fetchError) {
      console.error('Error fetching updated expense:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    return NextResponse.json(fullExpense)
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

// DELETE - удалить расход
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting expense:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
