

'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Participant, Expense, getCurrencySymbol } from '@/lib/types'
import { PieChart as PieChartIcon, TrendingUp, DollarSign } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface ExpenseDistributionChartProps {
  participants: Participant[]
  expenses: Expense[]
}

const COLORS = [
  'hsl(214, 84%, 56%)', // Primary blue
  'hsl(173, 58%, 39%)', // Teal
  'hsl(43, 74%, 49%)',  // Warm yellow
  'hsl(27, 87%, 67%)',  // Coral
  'hsl(262, 83%, 58%)', // Purple
  'hsl(214, 84%, 66%)', // Lighter blue
  'hsl(173, 58%, 49%)', // Lighter teal
  'hsl(43, 74%, 59%)'   // Lighter yellow
]

export default function ExpenseDistributionChart({ participants, expenses }: ExpenseDistributionChartProps) {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [animationStarted, setAnimationStarted] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    const timer = setTimeout(() => setAnimationStarted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Группируем расходы по валютам
  const expensesByCurrency = expenses.reduce((acc, expense) => {
    if (!acc[expense.currency]) {
      acc[expense.currency] = []
    }
    acc[expense.currency].push(expense)
    return acc
  }, {} as Record<string, Expense[]>)

  // Wenn nет расходов
  if (expenses.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-64 flex items-center justify-center text-muted-foreground"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center"
          >
            <PieChartIcon className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-foreground font-medium"
          >
            {t('expense.noExpensesToShow')}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-muted-foreground mt-1"
          >
            {t('expense.addFirstExpense')}
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
      <AnimatePresence>
        {Object.entries(expensesByCurrency).map(([currency, currencyExpenses], currencyIndex) => {
          // Подсчитываем расходы по участникам
          const expensesByParticipant = currencyExpenses.reduce((acc, expense) => {
            const payerName = expense.payer?.name || t('common.unknown')
            if (!acc[payerName]) {
              acc[payerName] = 0
            }
            acc[payerName] += Number(expense.amount)
            return acc
          }, {} as Record<string, number>)

          const totalAmount = Object.values(expensesByParticipant).reduce((sum, amount) => sum + amount, 0)

          const chartData = Object.entries(expensesByParticipant)
            .map(([name, amount]) => ({
              name,
              value: amount,
              percentage: ((amount / totalAmount) * 100).toFixed(1)
            }))
            .sort((a, b) => b.value - a.value) // Сортируем по убыванию

          if (chartData.length === 0) return null

          const CustomTooltip = ({ active, payload }: any) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-3 rounded-lg shadow-lg border border-gray-200"
                >
                  <p className="font-semibold text-gray-800">{data.name}</p>
                  <p className="text-blue-600 font-medium">
                    {Number(data.value).toFixed(2)} {getCurrencySymbol(currency)}
                  </p>
                  <p className="text-sm text-gray-500">{data.percentage}{t('expense.percentageOfTotal')}</p>
                </motion.div>
              )
            }
            return null
          }

          return (
            <motion.div 
              key={currency}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: currencyIndex * 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100"
            >
              {/* Заголовок с иконкой и статистикой */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {t('expense.expensesByLabel')}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {t('expense.totalSumLabel')} {totalAmount.toFixed(2)} {getCurrencySymbol(currency)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">{chartData.length} {
                    chartData.length === 1 ? t('expense.participantCountLabel') : 
                    chartData.length < 5 ? t('expense.participantCountPluralLabel') : 
                    t('expense.participantCountManyLabel')
                  }</span>
                </div>
              </div>
              
              <div className="relative">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      animationBegin={currencyIndex * 200}
                      animationDuration={1000}
                      onMouseEnter={(_, index) => setSelectedSegment(chartData[index]?.name || null)}
                      onMouseLeave={() => setSelectedSegment(null)}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          stroke={selectedSegment === entry.name ? '#ffffff' : 'transparent'}
                          strokeWidth={selectedSegment === entry.name ? 3 : 0}
                          style={{ 
                            filter: selectedSegment && selectedSegment !== entry.name ? 'brightness(0.7)' : 'brightness(1)',
                            transition: 'all 0.2s ease'
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom"
                      height={40}
                      wrapperStyle={{ 
                        fontSize: '12px',
                        paddingTop: '20px'
                      }}
                      formatter={(value, entry: any) => (
                        <span style={{ color: entry.color, fontWeight: selectedSegment === value ? 'bold' : 'normal' }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>


              </div>

              {/* Мини-статистика участников */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
                {chartData.slice(0, 3).map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: currencyIndex * 0.1 + index * 0.1 + 0.7 }}
                    className="flex items-center gap-2 bg-white bg-opacity-50 rounded-lg p-3 hover:bg-opacity-80 transition-all duration-200"
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.percentage}%</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </motion.div>
  )
}
