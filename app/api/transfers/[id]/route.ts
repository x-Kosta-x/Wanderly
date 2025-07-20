
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// DELETE - удалить перевод
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase
      .from('transfers')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting transfer:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Transfer deleted successfully' })
  } catch (error) {
    console.error('Error deleting transfer:', error)
    return NextResponse.json({ error: 'Failed to delete transfer' }, { status: 500 })
  }
}
