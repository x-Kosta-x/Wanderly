
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Participant, CURRENCIES } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/language-context'

interface TransferFormProps {
  tripId: string
  participants: Participant[]
  onClose: () => void
  initialData?: { from: string; to: string; amount?: number; currency?: string } | null
}

export default function TransferForm({ tripId, participants, onClose, initialData }: TransferFormProps) {
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    
    try {
      const amount = parseFloat(formData.get('amount') as string)
      const currency = formData.get('currency') as string
      const fromId = formData.get('fromId') as string
      const toId = formData.get('toId') as string
      const description = formData.get('description') as string
      const date = formData.get('date') as string

      if (!amount || !fromId || !toId) {
        toast.error(t('messages.error.fillRequired'))
        return
      }

      if (amount <= 0) {
        toast.error(t('messages.error.amountPositive'))
        return
      }

      if (fromId === toId) {
        toast.error(t('messages.error.samePersonTransfer'))
        return
      }



      const { error } = await supabase
        .from('transfers')
        .insert([{
          amount: amount.toFixed(2),
          currency,
          fromId,
          toId,
          tripId,
          description: description.trim() || null,
          date: date || new Date().toISOString()
        }])

      if (error) {
        console.error('Error creating transfer:', error)
        toast.error(t('messages.error.transferCreate'))
        return
      }

      toast.success(t('messages.success.transferAdded'))
      onClose()
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      toast.error(t('messages.error.genericError'))
    } finally {
      setLoading(false)
    }
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
        className="bg-white rounded-lg p-6 w-full max-w-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">{t('forms.transfer.title')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('forms.transfer.from')} *
              </label>
              <select
                name="fromId"
                required
                defaultValue={initialData?.from || ''}
                className="w-full px-3 py-2 border rounded-lg travel-input"
              >
                <option value="">{t('forms.transfer.fromPlaceholder')}</option>
                {participants.map(participant => (
                  <option key={participant.id} value={participant.id}>
                    {participant.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('forms.transfer.to')} *
              </label>
              <select
                name="toId"
                required
                defaultValue={initialData?.to || ''}
                className="w-full px-3 py-2 border rounded-lg travel-input"
              >
                <option value="">{t('forms.transfer.toPlaceholder')}</option>
                {participants.map(participant => (
                  <option key={participant.id} value={participant.id}>
                    {participant.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('forms.transfer.amount')} *
              </label>
              <input
                type="number"
                name="amount"
                step="0.01"
                min="0"
                required
                defaultValue={initialData?.amount || ''}
                className="w-full px-3 py-2 border rounded-lg travel-input"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('forms.transfer.currency')}
              </label>
              <select
                name="currency"
                defaultValue={initialData?.currency || 'RUB'}
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

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('forms.transfer.description')}
            </label>
            <input
              type="text"
              name="description"
              className="w-full px-3 py-2 border rounded-lg travel-input"
              placeholder={t('forms.transfer.descriptionPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('forms.transfer.date')}
            </label>
            <input
              type="date"
              name="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border rounded-lg travel-input"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="travel-button flex-1 disabled:opacity-50"
            >
              {loading ? t('buttons.creating') : t('buttons.createTransfer')}
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
