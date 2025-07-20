
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Receipt, 
  ArrowUpDown, 
  Archive,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  UserPlus,
  PieChart,
  BarChart3,
  RotateCcw
} from 'lucide-react'
import { useRealtimeTrip } from '@/hooks/use-realtime'
import { calculateBalances, calculateDebts } from '@/lib/balance-calculator'
import { getCurrencySymbol, Expense } from '@/lib/types'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import BalanceChart from '@/components/balance-chart'
import DebtMatrix from '@/components/debt-matrix'
import ExpenseForm from '@/components/expense-form'
import TransferForm from '@/components/transfer-form'
import ExpenseDistributionChart from '@/components/expense-distribution-chart'
import ParticipantDetails from '@/components/participant-details'
import ParticipantExpenses from '@/components/participant-expenses'
import ExpenseEditForm from '@/components/expense-edit-form'

export default function TripPage({ params }: { params: { id: string } }) {
  const { trip, participants, expenses, transfers, loading } = useRealtimeTrip(params.id)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [transferData, setTransferData] = useState<{ from: string; to: string; amount?: number; currency?: string } | null>(null)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const router = useRouter()
  const { t } = useLanguage()

  const balances = calculateBalances(participants, expenses, transfers)
  const debts = calculateDebts(balances)

  // Расчет общего баланса группы
  const calculateTotalBalance = () => {
    const totalsByCurrency = expenses.reduce((acc, expense) => {
      if (!acc[expense.currency]) {
        acc[expense.currency] = 0
      }
      acc[expense.currency] += Number(expense.amount)
      return acc
    }, {} as Record<string, number>)
    
    return totalsByCurrency
  }

  const totalBalance = calculateTotalBalance()

  const handleAddParticipant = async (formData: FormData) => {
    const name = formData.get('name') as string
    
    if (!name.trim()) {
      toast.error(t('messages.error.participantNameRequired'))
      return
    }

    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim(), tripId: params.id }),
      })

      if (response.ok) {
        toast.success(t('messages.success.participantAdded'))
        setShowAddParticipant(false)
        // Обновляем данные поездки
        window.location.reload()
      } else {
        console.error('Error adding participant:', response.status)
        toast.error(t('messages.error.participantAdd'))
      }
    } catch (error) {
      console.error('Error adding participant:', error)
      toast.error(t('messages.error.participantAdd'))
    }
  }

  const handleArchiveTrip = async () => {
    if (!confirm(t('messages.confirmation.archiveTripPage'))) return

    try {
      const response = await fetch(`/api/trips/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isArchived: true }),
      })

      if (response.ok) {
        toast.success(t('messages.success.tripArchived'))
        router.push('/')
      } else {
        console.error('Error archiving trip:', response.status)
        toast.error(t('messages.error.tripArchive'))
      }
    } catch (error) {
      console.error('Error archiving trip:', error)
      toast.error(t('messages.error.tripArchive'))
    }
  }

  const handleRestoreTrip = async () => {
    if (!confirm(t('messages.confirmation.restoreTripPage'))) return

    try {
      const response = await fetch(`/api/trips/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isArchived: false }),
      })

      if (response.ok) {
        toast.success(t('messages.success.tripRestored'))
        // Обновляем данные поездки
        window.location.reload()
      } else {
        console.error('Error restoring trip:', response.status)
        toast.error(t('messages.error.tripRestore'))
      }
    } catch (error) {
      console.error('Error restoring trip:', error)
      toast.error(t('messages.error.tripRestore'))
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm(t('messages.confirmation.deleteExpense'))) return

    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success(t('messages.success.expenseDeleted'))
        // Обновляем данные поездки
        window.location.reload()
      } else {
        console.error('Error deleting expense:', response.status)
        toast.error(t('messages.error.expenseDelete'))
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast.error(t('messages.error.expenseDelete'))
    }
  }

  const handleDeleteTransfer = async (transferId: string) => {
    if (!confirm(t('messages.confirmation.deleteTransfer'))) return

    try {
      const response = await fetch(`/api/transfers/${transferId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success(t('messages.success.transferDeleted'))
        // Обновляем данные поездки
        window.location.reload()
      } else {
        console.error('Error deleting transfer:', response.status)
        toast.error(t('messages.error.transferDelete'))
      }
    } catch (error) {
      console.error('Error deleting transfer:', error)
      toast.error(t('messages.error.transferDelete'))
    }
  }

  const handleMatrixClick = (from: string, to: string) => {
    // Находим соответствующий долг для автозаполнения суммы и валюты
    const debt = debts.find(d => d.from === from && d.to === to)
    
    setTransferData({ 
      from, 
      to, 
      amount: debt?.amount,
      currency: debt?.currency 
    })
    setShowTransferForm(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('page.trip.loading')}</p>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{t('page.trip.notFound')}</p>
          <Link href="/" className="travel-button">
            {t('page.trip.backToHome')}
          </Link>
        </div>
      </div>
    )
  }

  const recentExpenses = expenses.slice(0, 5)

  return (
    <div className="min-h-screen">
      {/* Заголовок поездки */}
      <div className="travel-gradient text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{trip.name}</h1>
              <div className="flex flex-wrap gap-4 mt-2 text-blue-100">
                {trip.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {trip.location}
                  </div>
                )}
                {(trip.startDate || trip.endDate) && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {trip.startDate && new Date(trip.startDate).toLocaleDateString('ru-RU')}
                    {trip.startDate && trip.endDate && ' - '}
                    {trip.endDate && new Date(trip.endDate).toLocaleDateString('ru-RU')}
                  </div>
                )}
              </div>
            </div>
            {trip.isArchived ? (
              <button
                onClick={handleRestoreTrip}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium"
                title={t('page.trip.restoreFromArchive')}
              >
                <RotateCcw className="w-5 h-5" />
                {t('page.trip.restoreFromArchive')}
              </button>
            ) : (
              <button
                onClick={handleArchiveTrip}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium"
                title={t('page.trip.archiveTrip')}
              >
                <Archive className="w-5 h-5" />
                {t('page.trip.archiveTrip')}
              </button>
            )}
          </div>

          {/* Общий баланс группы */}
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">{t('page.trip.totalBalance')}</h2>
            <div className="flex justify-center gap-4">
              {Object.keys(totalBalance).length > 0 ? (
                Object.entries(totalBalance).map(([currency, amount]) => (
                  <div key={currency} className="text-2xl font-bold">
                    {amount.toFixed(2)} {getCurrencySymbol(currency)}
                  </div>
                ))
              ) : (
                <div className="text-2xl font-bold">0 ₽</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Форма добавления участника */}
        {showAddParticipant && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="travel-card p-6 mb-8"
          >
            <h3 className="text-lg font-semibold mb-4">{t('forms.participant.title')}</h3>
            <form action={handleAddParticipant} className="flex gap-3">
              <input
                type="text"
                name="name"
                placeholder={t('forms.participant.namePlaceholder')}
                className="flex-1 px-3 py-2 border rounded-lg travel-input"
                required
              />
              <button type="submit" className="travel-button">
                {t('buttons.add')}
              </button>
              <button
                type="button"
                onClick={() => setShowAddParticipant(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('buttons.cancel')}
              </button>
            </form>
          </motion.div>
        )}

        {participants.length === 0 ? (
          <div className="travel-card p-8 text-center mb-8">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('participant.noParticipants')}</h3>
            <p className="text-gray-600 mb-6">{t('participant.noParticipantsSubtitle')}</p>
            <button
              onClick={() => setShowAddParticipant(true)}
              className="travel-button flex items-center gap-2 mx-auto"
            >
              <UserPlus className="w-5 h-5" />
              {t('buttons.addParticipant')}
            </button>
          </div>
        ) : (
          <>
            {/* Основная двухколоночная структура */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              
              {/* ЛЕВАЯ КОЛОНКА */}
              <div className="space-y-8">
                
                {/* Балансы участников */}
                <div className="travel-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Users className="w-6 h-6" />
                      {t('participant.balances')}
                    </h2>
                    <button
                      onClick={() => setShowAddParticipant(true)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title={t('buttons.addParticipant')}
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {participants.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">{t('participant.noParticipants')}</p>
                    </div>
                  ) : balances.length === 0 ? (
                    <div className="text-center py-8">
                      <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">{t('participant.addBalanceDetails')}</p>
                    </div>
                  ) : (
                    (() => {
                      // Создаем статус для каждого участника
                      const participantStatuses = participants.map(participant => {
                        // Находим все балансы для участника
                        const participantBalances = balances.filter(b => b.participantId === participant.id)
                        
                        // Находим всех, кому должен этот участник
                        const owesToPeople = debts.filter(debt => debt.from === participant.id)
                        
                        // Находим всех, кто должен этому участнику
                        const owedByPeople = debts.filter(debt => debt.to === participant.id)
                        
                        // Определяем общий статус участника
                        const totalOwes = owesToPeople.reduce((sum, debt) => sum + debt.amount, 0)
                        const totalOwed = owedByPeople.reduce((sum, debt) => sum + debt.amount, 0)
                        
                        let status, statusColor, description, amount, currency
                        
                        if (Math.abs(totalOwes - totalOwed) < 0.01) {
                          // Расчеты завершены
                          status = 'balanced'
                          statusColor = 'bg-gray-50 border-gray-200 hover:border-gray-300'
                          description = t('participant.settlementsComplete')
                          amount = 0
                          currency = participantBalances[0]?.currency || 'RUB'
                        } else if (totalOwed > totalOwes) {
                          // Участнику должны
                          status = 'creditor'
                          statusColor = 'bg-green-50 border-green-200 hover:border-green-300'
                          description = t('participant.owesToReturn')
                          amount = totalOwed - totalOwes
                          currency = participantBalances[0]?.currency || 'RUB'
                        } else {
                          // Участник должен
                          status = 'debtor'
                          statusColor = 'bg-red-50 border-red-200 hover:border-red-300'
                          
                          // Находим основного кредитора (кому больше всего должен)
                          const mainCreditor = owesToPeople.length > 0 
                            ? owesToPeople.reduce((max, debt) => 
                                debt.amount > max.amount ? debt : max
                              )
                            : null
                          
                          if (mainCreditor) {
                            description = t('participant.owesTo', { name: mainCreditor.toName })
                          } else {
                            description = t('participant.owes')
                          }
                          
                          amount = totalOwes - totalOwed
                          currency = participantBalances[0]?.currency || 'RUB'
                        }
                        
                        return {
                          participant,
                          status,
                          statusColor,
                          description,
                          amount,
                          currency
                        }
                      })
                      
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {participantStatuses.map(({ participant, status, statusColor, description, amount, currency }) => (
                            <motion.div
                              key={participant.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${statusColor}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-lg truncate">{participant.name}</h3>
                                  <p className="text-sm text-gray-600 truncate">
                                    {description}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className={`text-2xl font-bold ${
                                    status === 'creditor' ? 'text-green-600' : 
                                    status === 'debtor' ? 'text-red-600' : 'text-gray-600'
                                  }`}>
                                    {status === 'creditor' ? '+' : status === 'debtor' ? '-' : ''}
                                    {amount.toFixed(2)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {getCurrencySymbol(currency)}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )
                    })()
                  )}
                </div>

                {/* Последние расходы */}
                <div className="travel-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Receipt className="w-6 h-6" />
                      {t('expense.recent')}
                    </h2>
                    <button
                      onClick={() => setShowExpenseForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
                    >
                      <Plus className="w-5 h-5" />
                      {t('buttons.addExpense')}
                    </button>
                  </div>
                  
                  {expenses.length === 0 ? (
                    <div className="text-center py-12">
                      <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">{t('expense.noExpenses')}</h3>
                      <p className="text-gray-600 mb-6">{t('expense.noExpensesSubtitle')}</p>
                      <button
                        onClick={() => setShowExpenseForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto font-medium transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                        {t('buttons.addExpense')}
                      </button>
                    </div>
                  ) : (
                    <ParticipantExpenses 
                      participants={participants} 
                      expenses={expenses} 
                      onEditExpense={(expense) => setEditingExpense(expense)}
                    />
                  )}
                </div>

              </div>

              {/* ПРАВАЯ КОЛОНКА */}
              <div className="space-y-8">
                
                {/* Распределение расходов - диаграмма */}
                <div className="travel-card p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <PieChart className="w-6 h-6" />
                    {t('expense.distribution')}
                  </h2>
                  
                  <div className="h-80">
                    <ExpenseDistributionChart participants={participants} expenses={expenses} />
                  </div>
                </div>

                {/* Детализация по участникам */}
                <div className="travel-card p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6" />
                    {t('expense.details')}
                  </h2>
                  
                  <ParticipantDetails participants={participants} expenses={expenses} />
                </div>

              </div>
            </div>

            {/* Матрица долгов - переместили вниз */}
            {debts.length > 0 && (
              <div className="travel-card p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <ArrowUpDown className="w-6 h-6" />
                  {t('transfer.debt')}
                </h2>
                <DebtMatrix 
                  participants={participants} 
                  debts={debts} 
                  onCellClick={handleMatrixClick}
                />
              </div>
            )}

            {/* Переводы */}
            {transfers.length > 0 && (
              <div className="travel-card p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <ArrowUpDown className="w-6 h-6" />
                    {t('transfer.title')}
                  </h2>
                  <button
                    onClick={() => setShowTransferForm(true)}
                    className="travel-button flex items-center gap-2"
                  >
                    <ArrowUpDown className="w-5 h-5" />
                    {t('buttons.transferMoney')}
                  </button>
                </div>
                <div className="space-y-3">
                  {transfers.slice(0, 5).map(transfer => (
                    <motion.div 
                      key={transfer.id} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-lg">
                          {transfer.from?.name} → {transfer.to?.name}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-3">
                          <span>{new Date(transfer.date).toLocaleDateString('ru-RU')}</span>
                          {transfer.description && <span>• {transfer.description}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            {Number(transfer.amount).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getCurrencySymbol(transfer.currency)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTransfer(transfer.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('buttons.delete')}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Плавающая кнопка действий */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-3">
              <button
                onClick={() => setShowTransferForm(true)}
                className="w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                title={t('page.trip.floatingButtons.moneyTransfer')}
              >
                <ArrowUpDown className="w-6 h-6" />
              </button>
              <button
                onClick={() => setShowExpenseForm(true)}
                className="w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                title={t('page.trip.floatingButtons.addExpense')}
              >
                <Plus className="w-7 h-7" />
              </button>
            </div>
          </>
        )}

        {/* Формы */}
        {showExpenseForm && (
          <ExpenseForm
            tripId={params.id}
            participants={participants}
            onClose={() => setShowExpenseForm(false)}
            lastExpenseDate={expenses[0]?.date}
          />
        )}

        {showTransferForm && (
          <TransferForm
            tripId={params.id}
            participants={participants}
            onClose={() => {
              setShowTransferForm(false)
              setTransferData(null)
            }}
            initialData={transferData}
          />
        )}

        {editingExpense && (
          <ExpenseEditForm
            expense={editingExpense}
            participants={participants}
            onClose={() => setEditingExpense(null)}
            onUpdate={(updatedExpense) => {
              // Обновление будет обработано через real-time хуки
              setEditingExpense(null)
            }}
            onDelete={(expenseId) => {
              // Удаление будет обработано через real-time хуки
              setEditingExpense(null)
            }}
          />
        )}
      </div>
    </div>
  )
}
