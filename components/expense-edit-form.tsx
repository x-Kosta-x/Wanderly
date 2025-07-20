

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Save, Trash2, User, UserCheck } from 'lucide-react'
import { Expense, Participant, CURRENCIES, getCurrencySymbol } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/language-context'

interface ExpenseEditFormProps {
  expense: Expense
  participants: Participant[]
  onClose: () => void
  onUpdate?: (updatedExpense: Expense) => void
  onDelete?: (expenseId: string) => void
}

export default function ExpenseEditForm({ 
  expense, 
  participants, 
  onClose, 
  onUpdate, 
  onDelete 
}: ExpenseEditFormProps) {
  const [description, setDescription] = useState(expense.description)
  const [amount, setAmount] = useState(expense.amount.toString())
  const [currency, setCurrency] = useState(expense.currency)
  const [date, setDate] = useState(expense.date.split('T')[0]) // Извлекаем дату без времени
  const [payerId, setPayerId] = useState(expense.payerId)
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set(expense.shares?.map(share => share.participantId) || [])
  )
  const [customShares, setCustomShares] = useState<Record<string, string>>({})
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { t } = useLanguage()

  // Инициализируем кастомные доли
  useEffect(() => {
    if (expense.shares) {
      const shares: Record<string, string> = {}
      expense.shares.forEach(share => {
        shares[share.participantId] = share.amount.toString()
      })
      setCustomShares(shares)
      
      // Проверяем, равны ли доли (равное разделение)
      const amounts = expense.shares.map(share => Number(share.amount))
      const isEqual = amounts.every(amount => Math.abs(amount - amounts[0]) < 0.01)
      setSplitMode(isEqual ? 'equal' : 'custom')
    }
  }, [expense.shares])

  const handleParticipantToggle = (participantId: string) => {
    const newSelected = new Set(selectedParticipants)
    if (newSelected.has(participantId)) {
      newSelected.delete(participantId)
    } else {
      newSelected.add(participantId)
    }
    setSelectedParticipants(newSelected)
  }

  const calculateEqualShare = () => {
    const totalAmount = Number(amount) || 0
    const participantCount = selectedParticipants.size
    return participantCount > 0 ? totalAmount / participantCount : 0
  }

  const handleCustomShareChange = (participantId: string, value: string) => {
    setCustomShares(prev => ({ ...prev, [participantId]: value }))
  }

  const getCustomSharesTotal = () => {
    return Object.values(customShares).reduce((sum, value) => sum + (Number(value) || 0), 0)
  }

  const isFormValid = () => {
    if (!description.trim() || !amount || selectedParticipants.size === 0) {
      return false
    }

    if (splitMode === 'custom') {
      const total = getCustomSharesTotal()
      const expenseAmount = Number(amount)
      return Math.abs(total - expenseAmount) < 0.01
    }

    return true
  }

  const handleSave = async () => {
    if (!isFormValid()) {
      toast.error(t('forms.expense.formValidationError'))
      return
    }

    setSaving(true)

    try {


      const expenseAmount = Number(amount)
      const equalShare = calculateEqualShare()

      // Обновляем основные данные расхода
      const { error: expenseError } = await supabase
        .from('expenses')
        .update({
          description: description.trim(),
          amount: expenseAmount,
          currency,
          date: new Date(date).toISOString(),
          payerId
        })
        .eq('id', expense.id)

      if (expenseError) {
        console.error('Error updating expense:', expenseError)
        toast.error(t('forms.expense.updateError'))
        return
      }

      // Удаляем старые доли
      const { error: deleteSharesError } = await supabase
        .from('expense_shares')
        .delete()
        .eq('expenseId', expense.id)

      if (deleteSharesError) {
        console.error('Error deleting old shares:', deleteSharesError)
        toast.error(t('forms.expense.updateError'))
        return
      }

      // Создаем новые доли
      const shares = Array.from(selectedParticipants).map(participantId => ({
        expenseId: expense.id,
        participantId,
        amount: splitMode === 'equal' ? equalShare : Number(customShares[participantId] || 0)
      }))

      const { error: sharesError } = await supabase
        .from('expense_shares')
        .insert(shares)

      if (sharesError) {
        console.error('Error inserting new shares:', sharesError)
        toast.error(t('forms.expense.updateError'))
        return
      }

      toast.success(t('forms.expense.expenseUpdated'))
      onClose()
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error(t('forms.expense.unexpectedError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t('forms.expense.deleteConfirmation'))) {
      return
    }

    setDeleting(true)

    try {


      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id)

      if (error) {
        console.error('Error deleting expense:', error)
        toast.error(t('forms.expense.deleteError'))
        return
      }

      toast.success(t('forms.expense.expenseDeleted'))
      onDelete?.(expense.id)
      onClose()
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error(t('forms.expense.unexpectedError'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Заголовок */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-semibold">{t('forms.expense.editExpenseTitle')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                {t('forms.expense.expenseDescription')} *
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg travel-input"
                placeholder={t('forms.expense.expenseDescriptionPlaceholder')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('forms.expense.amount')} *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg travel-input"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('forms.expense.currency')}
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg travel-input"
              >
                {CURRENCIES.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} {t(`currencies.${curr.code}`)}
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
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg travel-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('forms.expense.whoPaid')} *
              </label>
              <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg travel-input"
                required
              >
                {participants.map(participant => (
                  <option key={participant.id} value={participant.id}>
                    {participant.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Участники */}
          <div>
            <label className="block text-sm font-medium mb-3">
              {t('forms.expense.whoParticipates')} *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {participants.map(participant => (
                <button
                  key={participant.id}
                  type="button"
                  onClick={() => handleParticipantToggle(participant.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    selectedParticipants.has(participant.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    selectedParticipants.has(participant.id)
                      ? 'bg-blue-100'
                      : 'bg-gray-100'
                  }`}>
                    {selectedParticipants.has(participant.id) ? (
                      <UserCheck className="w-4 h-4 text-blue-600" />
                    ) : (
                      <User className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <span className="font-medium">{participant.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Режим разделения */}
          {selectedParticipants.size > 0 && (
            <div>
              <label className="block text-sm font-medium mb-3">
                {t('forms.expense.howToSplit')}
              </label>
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setSplitMode('equal')}
                  className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                    splitMode === 'equal'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {t('forms.expense.equally')}
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('custom')}
                  className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                    splitMode === 'custom'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {t('forms.expense.customAmounts')}
                </button>
              </div>

              {splitMode === 'equal' ? (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">{t('forms.expense.perPerson')} {calculateEqualShare().toFixed(2)} {getCurrencySymbol(currency)}</span>
                    ({selectedParticipants.size} {
                      selectedParticipants.size === 1 ? t('forms.expense.participants') : 
                      selectedParticipants.size < 5 ? t('forms.expense.participantsPlural') : 
                      t('forms.expense.participantsMany')
                    })
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.from(selectedParticipants).map(participantId => {
                    const participant = participants.find(p => p.id === participantId)
                    if (!participant) return null

                    return (
                      <div key={participantId} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="flex-1 font-medium">{participant.name}</span>
                        <input
                          type="number"
                          value={customShares[participantId] || ''}
                          onChange={(e) => handleCustomShareChange(participantId, e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-24 px-2 py-1 border rounded text-right travel-input"
                        />
                        <span className="text-sm text-gray-500 w-8">
                          {getCurrencySymbol(currency)}
                        </span>
                      </div>
                    )
                  })}
                  
                  <div className="bg-gray-50 rounded-lg p-3 mt-3">
                    <div className="flex justify-between items-center text-sm">
                      <span>{t('forms.expense.sharesSumLabel')}</span>
                      <span className={`font-medium ${
                        Math.abs(getCustomSharesTotal() - Number(amount || 0)) < 0.01
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {getCustomSharesTotal().toFixed(2)} {getCurrencySymbol(currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>{t('forms.expense.totalSumLabel')}</span>
                      <span className="font-medium">
                        {Number(amount || 0).toFixed(2)} {getCurrencySymbol(currency)}
                      </span>
                    </div>
                    {Math.abs(getCustomSharesTotal() - Number(amount || 0)) >= 0.01 && (
                      <div className="text-xs text-red-600 mt-1">
                        {t('forms.expense.sharesMismatchError')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Кнопки действий */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between rounded-b-xl">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? t('buttons.deleting') : t('buttons.delete')}
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('buttons.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={!isFormValid() || saving}
              className="flex items-center gap-2 travel-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? t('buttons.saving') : t('buttons.save')}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
