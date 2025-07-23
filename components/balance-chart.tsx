

'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Balance, getCurrencySymbol } from '@/lib/types'
import { useLanguage } from '@/contexts/language-context'

interface BalanceChartProps {
  balances: Balance[]
}

const COLORS = [
  'hsl(214, 84%, 56%)', // Primary blue
  'hsl(173, 58%, 39%)', // Teal
  'hsl(43, 74%, 49%)',  // Warm yellow
  'hsl(27, 87%, 67%)',  // Coral
  'hsl(262, 83%, 58%)', // Purple
  'hsl(214, 84%, 46%)', // Deeper blue
  'hsl(173, 58%, 49%)', // Lighter teal
  'hsl(43, 74%, 59%)'   // Lighter yellow
]

export default function BalanceChart({ balances }: BalanceChartProps) {
  const { t } = useLanguage()

  // Группируем балансы по валютам
  const balancesByCurrency = balances.reduce((acc, balance) => {
    if (!acc[balance.currency]) {
      acc[balance.currency] = []
    }
    acc[balance.currency].push(balance)
    return acc
  }, {} as Record<string, Balance[]>)

  // Если нет данных
  if (balances.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        {t('chart.noData')}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(balancesByCurrency).map(([currency, currencyBalances]) => {
        // Подготавливаем данные для диаграммы
        const positiveBalances = currencyBalances.filter(b => b.balance > 0)
        const negativeBalances = currencyBalances.filter(b => b.balance < 0)
        
        const chartData = [
          ...positiveBalances.map(balance => ({
            name: balance.participantName,
            value: Math.abs(balance.balance),
            balance: balance.balance,
            type: 'positive'
          })),
          ...negativeBalances.map(balance => ({
            name: balance.participantName,
            value: Math.abs(balance.balance),
            balance: balance.balance,
            type: 'negative'
          }))
        ]

        if (chartData.length === 0) return null

        return (
          <div key={currency} className="space-y-2">
            <h3 className="font-medium text-center">
              {t('chart.balancesIn')} {getCurrencySymbol(currency)}
            </h3>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.type === 'positive' ? COLORS[index % COLORS.length] : `${COLORS[index % COLORS.length]}80`}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string, props: any) => [
                      `${props.payload.balance > 0 ? '+' : ''}${props.payload.balance.toFixed(2)} ${getCurrencySymbol(currency)}`,
                      props.payload.name
                    ]}
                    labelStyle={{ fontSize: 11 }}
                  />
                  <Legend 
                    verticalAlign="top"
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      })}
    </div>
  )
}
