'use client'

import { motion } from 'framer-motion'
import { Participant, Expense, getCurrencySymbol } from '@/lib/types'
import { User, TrendingUp, Target, Award } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface ParticipantDetailsProps {
  participants: Participant[]
  expenses: Expense[]
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

export default function ParticipantDetails({ participants, expenses }: ParticipantDetailsProps) {
  const { t } = useLanguage()
  
  // Группируем расходы по валютам
  const expensesByCurrency = expenses.reduce((acc, expense) => {
    if (!acc[expense.currency]) {
      acc[expense.currency] = []
    }
    acc[expense.currency].push(expense)
    return acc
  }, {} as Record<string, Expense[]>)

  if (expenses.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8 text-gray-500"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mx-auto mb-3 flex items-center justify-center"
          >
            <User className="w-6 h-6 text-purple-500" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-medium"
          >
            {t('participant.addBalanceDetails')}
          </motion.p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {Object.entries(expensesByCurrency).map(([currency, currencyExpenses], currencyIndex) => {
        // Подсчитываем расходы и проценты по участникам
        const expensesByParticipant = currencyExpenses.reduce((acc, expense) => {
          const payerId = expense.payerId
          const payerName = expense.payer?.name || t('participant.unknown')
          if (!acc[payerId]) {
            acc[payerId] = { name: payerName, amount: 0 }
          }
          acc[payerId].amount += Number(expense.amount)
          return acc
        }, {} as Record<string, { name: string, amount: number }>)

        const totalAmount = Object.values(expensesByParticipant).reduce((sum, p) => sum + p.amount, 0)
        
        const participantData = Object.entries(expensesByParticipant).map(([id, data], index) => ({
          id,
          name: data.name,
          amount: data.amount,
          percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
          color: COLORS[index % COLORS.length]
        })).sort((a, b) => b.amount - a.amount)

        if (participantData.length === 0) return null

        // Определяем лидера по расходам
        const topSpender = participantData[0]

        return (
          <motion.div 
            key={currency}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: currencyIndex * 0.1 }}
            className="space-y-4"
          >
            {/* Заголовок с статистикой */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {t('participant.details', { currency: getCurrencySymbol(currency) })}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t('participant.participantCount', { count: participantData.length })}
                  </p>
                </div>
              </div>
              
              {/* Лидер по расходам */}
              {topSpender && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1 rounded-full border border-amber-200">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700">
                    {t('participant.leader', { name: topSpender.name })}
                  </span>
                </div>
              )}
            </div>
            
            {/* Список участников */}
            <div className="space-y-3">
              {participantData.map((participant, index) => (
                <motion.div 
                  key={participant.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: currencyIndex * 0.1 + index * 0.05 }}
                  className="group relative"
                >
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200">
                    {/* Позиция и цветной индикатор */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-50 rounded-full text-sm font-semibold text-gray-600 group-hover:bg-gray-100 transition-colors">
                        {index + 1}
                      </div>
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: participant.color }}
                      />
                    </div>
                    
                    {/* Информация об участнике */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {participant.name}
                        </p>
                        {index === 0 && (
                          <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-xs font-medium">{t('participant.top')}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Прогресс бар */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>{t('expense.percentageOfTotal').replace('%', `${participant.percentage.toFixed(1)}%`)}</span>
                          <span>{participant.amount.toFixed(2)} {getCurrencySymbol(currency)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${participant.percentage}%` }}
                            transition={{ delay: currencyIndex * 0.1 + index * 0.05 + 0.3, duration: 0.8 }}
                            className="h-full rounded-full transition-all duration-300"
                            style={{ backgroundColor: participant.color }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Сумма расходов */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-gray-900">
                        {participant.amount.toFixed(0)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getCurrencySymbol(currency)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Дополнительный эффект для лидера */}
                  {index === 0 && (
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-200 to-orange-200 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10" />
                  )}
                </motion.div>
              ))}
            </div>
            
            {/* Итоговая статистика */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: currencyIndex * 0.1 + participantData.length * 0.05 + 0.2 }}
              className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100"
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="font-medium text-gray-700">{t('participant.totalExpenseAmount')}</span>
                </div>
                <span className="font-bold text-blue-600">
                  {totalAmount.toFixed(2)} {getCurrencySymbol(currency)}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}