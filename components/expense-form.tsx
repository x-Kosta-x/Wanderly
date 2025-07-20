
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Participant, CURRENCIES } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/language-context'

interface ExpenseFormProps {
  tripId: string
  participants: Participant[]
  onClose: () => void
  lastExpenseDate?: string
}

export default function ExpenseForm({ tripId, participants, onClose, lastExpenseDate }: ExpenseFormProps) {
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal')
  const [customShares, setCustomShares] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()

  // Устанавливаем дату по умолчанию
  const defaultDate = lastExpenseDate 
    ? new Date(lastExpenseDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    
    try {
      const description = formData.get('description') as string
      const amount = parseFloat(formData.get('amount') as string)
      const currency = formData.get('currency') as string
      const payerId = formData.get('payerId') as string
      const date = formData.get('date') as string

      if (!description.trim() || !amount || !payerId) {
        toast.error(t('messages.error.fillRequired'))
        return
      }

      if (amount <= 0) {
        toast.error(t('messages.error.amountPositive'))
        return
      }



      // Создаем расход
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert([{
          description: description.trim(),
          amount: amount.toFixed(2),
          currency,
          payerId,
          tripId,
          date: date || new Date().toISOString()
        }])
        .select()
        .single()

      if (expenseError) {
        console.error('Error creating expense:', expenseError)
        toast.error(t('messages.error.expenseCreate'))
        return
      }

      // Создаем доли расхода
      let shares: { expenseId: string; participantId: string; amount: string }[] = []

      if (splitType === 'equal') {
        const shareAmount = (amount / participants.length).toFixed(2)
        shares = participants.map(p => ({
          expenseId: expense.id,
          participantId: p.id,
          amount: shareAmount
        }))
      } else {
        // Кастомное разделение
        const totalCustom = Object.values(customShares).reduce((sum, share) => {
          const value = parseFloat(share) || 0
          return sum + value
        }, 0)

        if (Math.abs(totalCustom - amount) > 0.01) {
          toast.error(t('messages.error.sharesAmountMismatch', { 
            total: totalCustom.toFixed(2), 
            amount: amount.toFixed(2) 
          }))
          return
        }

        shares = Object.entries(customShares)
          .filter(([_, share]) => parseFloat(share) > 0)
          .map(([participantId, share]) => ({
            expenseId: expense.id,
            participantId,
            amount: parseFloat(share).toFixed(2)
          }))
      }

      const { error: sharesError } = await supabase
        .from('expense_shares')
        .insert(shares)

      if (sharesError) {
        console.error('Error creating expense shares:', sharesError)
        toast.error(t('messages.error.expenseCreate'))
        return
      }

      toast.success(t('messages.success.expenseAdded'))
      onClose()
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      toast.error(t('messages.error.genericError'))
    } finally {
      setLoading(false)
    }
  }

  const handleCustomShareChange = (participantId: string, value: string) => {
    setCustomShares(prev => ({
      ...prev,
      [participantId]: value
    }))
  }

  const getTotalCustomShares = () => {
    return Object.values(customShares).reduce((sum, share) => {
      const value = parseFloat(share) || 0
      return sum + value
    }, 0)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">{t('forms.expense.title')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form action={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('forms.expense.description')} *
            </label>
            <input
              type="text"
              name="description"
              required
              className="w-full px-3 py-2 border rounded-lg travel-input"
              placeholder={t('forms.expense.descriptionPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('forms.expense.amount')} *
              </label>
              <input
                type="number"
                name="amount"
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border rounded-lg travel-input"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('forms.expense.currency')}
              </label>
              <select
                name="currency"
                className="w-full px-3 py-2 border rounded-lg travel-input"
              >
                {CURRENCIES.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {t(`currencies.${currency.code}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('forms.expense.payer')} *
              </label>
              <select
                name="payerId"
                required
                className="w-full px-3 py-2 border rounded-lg travel-input"
              >
                <option value="">{t('forms.expense.payerPlaceholder')}</option>
                {participants.map(participant => (
                  <option key={participant.id} value={participant.id}>
                    {participant.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('forms.expense.date')}
              </label>
              <input
                type="date"
                name="date"
                defaultValue={defaultDate}
                className="w-full px-3 py-2 border rounded-lg travel-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">
              {t('forms.expense.splitType')}
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="splitType"
                  value="equal"
                  checked={splitType === 'equal'}
                  onChange={(e) => setSplitType(e.target.value as 'equal' | 'custom')}
                  className="text-blue-600"
                />
                <span>{t('forms.expense.splitEqual')}</span>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="splitType"
                  value="custom"
                  checked={splitType === 'custom'}
                  onChange={(e) => setSplitType(e.target.value as 'equal' | 'custom')}
                  className="text-blue-600"
                />
                <span>{t('forms.expense.splitCustom')}</span>
              </label>
            </div>
          </div>

          {splitType === 'custom' && (
            <div className="space-y-3">
              <h3 className="font-medium">{t('forms.expense.customSharesTitle')}</h3>
              {participants.map(participant => (
                <div key={participant.id} className="flex items-center gap-3">
                  <span className="w-32 text-sm">{participant.name}:</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={customShares[participant.id] || ''}
                    onChange={(e) => handleCustomShareChange(participant.id, e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg travel-input"
                    placeholder="0.00"
                  />
                </div>
              ))}
              <div className="text-sm text-gray-600">
                {t('forms.expense.customSharesTotal')} {getTotalCustomShares().toFixed(2)}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="travel-button flex-1 disabled:opacity-50"
            >
              {loading ? t('buttons.adding') : t('buttons.addExpense')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('buttons.cancel')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
