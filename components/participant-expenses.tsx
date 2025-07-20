

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronDown, User, Edit, Filter, ArrowUpDown } from 'lucide-react'
import { Participant, Expense, getCurrencySymbol } from '@/lib/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/contexts/language-context'

interface ParticipantExpensesProps {
  participants: Participant[]
  expenses: Expense[]
  onEditExpense?: (expense: Expense) => void
}

export default function ParticipantExpenses({ participants, expenses, onEditExpense }: ParticipantExpensesProps) {
  const [expandedExpenses, setExpandedExpenses] = useState<Set<string>>(new Set())
  const [selectedParticipant, setSelectedParticipant] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const { t } = useLanguage()

  // Фильтрация по участникам
  const filteredExpenses = expenses.filter(expense => {
    if (selectedParticipant === 'all') return true
    return expense.payerId === selectedParticipant
  })

  // Сортировка по дате
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
  })

  const toggleExpanded = (expenseId: string) => {
    const newExpanded = new Set(expandedExpenses)
    if (newExpanded.has(expenseId)) {
      newExpanded.delete(expenseId)
    } else {
      newExpanded.add(expenseId)
    }
    setExpandedExpenses(newExpanded)
  }

  return (
    <div className="space-y-4">
      {/* Фильтры и сортировка */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Фильтр по участникам */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('expense.filters.selectParticipant')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('expense.filters.allParticipants')}</SelectItem>
                {participants.map(participant => (
                  <SelectItem key={participant.id} value={participant.id}>
                    {participant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Сортировка по дате */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <Select value={sortOrder} onValueChange={(value: 'newest' | 'oldest') => setSortOrder(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('expense.filters.newest')}</SelectItem>
                <SelectItem value="oldest">{t('expense.filters.oldest')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Список расходов */}
      {sortedExpenses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>{t('expense.noExpensesToShow')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedExpenses.map((expense) => {
            const payer = participants.find(p => p.id === expense.payerId)
            const isExpanded = expandedExpenses.has(expense.id)
            
            return (
              <div key={expense.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                {/* Заголовок расхода */}
                <button
                  onClick={() => toggleExpanded(expense.id)}
                  className="w-full flex items-center gap-3 p-4 bg-white hover:bg-gray-50 transition-colors"
                >
                  {/* Стрелочка */}
                  <div className="text-gray-400">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </div>

                  {/* Информация */}
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">{expense.description}</p>
                    <p className="text-sm text-gray-500">
                      {payer?.name} • {new Date(expense.date).toLocaleDateString(
                        t('common.language') === 'English' ? 'en-US' : 
                        t('common.language') === 'Deutsch' ? 'de-DE' : 'ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Сумма */}
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {Number(expense.amount).toFixed(2)} {getCurrencySymbol(expense.currency)}
                    </div>
                  </div>

                  {/* Кнопка редактирования */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditExpense?.(expense)
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title={t('buttons.editTooltip')}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </button>

                {/* Раскрывающиеся детали расхода */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-200 bg-gray-50"
                    >
                      <div className="p-4">
                        {/* Дата расхода */}
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">{t('expense.expenseDate')}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(expense.date).toLocaleDateString(
                              t('common.language') === 'English' ? 'en-US' : 
                              t('common.language') === 'Deutsch' ? 'de-DE' : 'ru-RU', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>

                        {/* Распределение между участниками */}
                        {expense.shares && expense.shares.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('expense.distributionLabel')}</h4>
                            <div className="space-y-2">
                              {expense.shares.map(share => (
                                <div key={share.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <User className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <span className="font-medium text-gray-900">
                                      {share.participant?.name || participants.find(p => p.id === share.participantId)?.name}
                                    </span>
                                  </div>
                                  <div className="font-semibold text-gray-900">
                                    {Number(share.amount).toFixed(2)} {getCurrencySymbol(expense.currency)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
