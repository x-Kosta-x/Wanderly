'use client'

import { Participant, Debt, getCurrencySymbol } from '@/lib/types'
import { useLanguage } from '@/contexts/language-context'

interface DebtMatrixProps {
  participants: Participant[]
  debts: Debt[]
  onCellClick: (from: string, to: string) => void
}

export default function DebtMatrix({ participants, debts, onCellClick }: DebtMatrixProps) {
  const { t } = useLanguage()
  
  if (participants.length < 2) {
    return (
      <div className="text-center text-gray-500 py-8">
        {t('participant.addParticipants')}
      </div>
    )
  }

  // Создаем карту долгов для быстрого поиска
  const debtMap = new Map<string, Debt>()
  debts.forEach(debt => {
    debtMap.set(`${debt.from}-${debt.to}`, debt)
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="p-4 text-left font-semibold text-gray-700 border-b border-gray-200">
              {t('transfer.matrix.whoOwes')}
            </th>
            {participants.map(participant => (
              <th
                key={participant.id}
                className="p-4 text-center font-semibold text-gray-700 border-b border-gray-200 min-w-[120px]"
              >
                {participant.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {participants.map(fromParticipant => (
            <tr key={fromParticipant.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="p-4 font-semibold text-gray-700 border-b border-gray-100 bg-gray-50/30">
                {fromParticipant.name}
              </td>
              {participants.map(toParticipant => {
                if (fromParticipant.id === toParticipant.id) {
                  return (
                    <td key={toParticipant.id} className="p-4 text-center border-b border-gray-100">
                      <div className="w-full h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 font-medium">
                        —
                      </div>
                    </td>
                  )
                }

                const debt = debtMap.get(`${fromParticipant.id}-${toParticipant.id}`)
                
                return (
                  <td key={toParticipant.id} className="p-4 text-center border-b border-gray-100">
                    {debt ? (
                      <button
                        onClick={() => onCellClick(fromParticipant.id, toParticipant.id)}
                        className="w-full h-12 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                        title={t('transfer.owes', { 
                          from: fromParticipant.name, 
                          to: toParticipant.name 
                        }) + ` ${debt.amount.toFixed(2)} ${getCurrencySymbol(debt.currency)}`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold">{t('transfer.matrix.click')}</span>
                          <span className="text-xs">
                            {debt.amount.toFixed(2)} {getCurrencySymbol(debt.currency)}
                          </span>
                        </div>
                      </button>
                    ) : (
                      <div className="w-full h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 font-medium">
                        0
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700 flex items-center gap-2">
          <span className="text-lg">💡</span>
          <span className="font-medium">{t('transfer.matrix.hint')}</span>
          {t('transfer.matrix.hintText')}
        </p>
      </div>
    </div>
  )
}