
import { Participant, Expense, Transfer, Balance, Debt } from './types'

export function calculateBalances(
  participants: Participant[],
  expenses: Expense[],
  transfers: Transfer[]
): Balance[] {
  const balances: { [key: string]: { [currency: string]: number } } = {}

  // Инициализируем балансы
  participants.forEach(p => {
    balances[p.id] = {}
  })

  // Обрабатываем расходы
  expenses.forEach(expense => {
    const currency = expense.currency
    
    // Инициализируем валюту для всех участников если нужно
    participants.forEach(p => {
      if (!balances[p.id][currency]) {
        balances[p.id][currency] = 0
      }
    })

    // Плательщик потратил деньги
    balances[expense.payerId][currency] += Number(expense.amount)

    // Распределяем расход между участниками
    if (expense.shares && expense.shares.length > 0) {
      expense.shares.forEach(share => {
        balances[share.participantId][currency] -= Number(share.amount)
      })
    } else {
      // Если нет долей, делим поровну между всеми участниками
      const shareAmount = Number(expense.amount) / participants.length
      participants.forEach(p => {
        balances[p.id][currency] -= shareAmount
      })
    }
  })

  // Обрабатываем переводы
  transfers.forEach(transfer => {
    const currency = transfer.currency
    
    // Инициализируем валюту если нужно
    if (!balances[transfer.fromId][currency]) {
      balances[transfer.fromId][currency] = 0
    }
    if (!balances[transfer.toId][currency]) {
      balances[transfer.toId][currency] = 0
    }

    // ИСПРАВЛЕНА ЛОГИКА: когда А переводит деньги Б:
    // - баланс А увеличивается (ему меньше должны)
    // - баланс Б уменьшается (он больше должен)
    balances[transfer.fromId][currency] += Number(transfer.amount)
    balances[transfer.toId][currency] -= Number(transfer.amount)
  })

  // Преобразуем в массив балансов
  const result: Balance[] = []
  participants.forEach(participant => {
    Object.entries(balances[participant.id]).forEach(([currency, amount]) => {
      if (Math.abs(amount) > 0.01) { // Игнорируем очень маленькие суммы
        result.push({
          participantId: participant.id,
          participantName: participant.name,
          balance: Math.round(amount * 100) / 100, // Округляем до копеек
          currency
        })
      }
    })
  })

  return result
}

export function calculateDebts(balances: Balance[]): Debt[] {
  const debts: Debt[] = []
  
  // Группируем балансы по валютам
  const balancesByCurrency: { [currency: string]: Balance[] } = {}
  balances.forEach(balance => {
    if (!balancesByCurrency[balance.currency]) {
      balancesByCurrency[balance.currency] = []
    }
    balancesByCurrency[balance.currency].push(balance)
  })

  // Для каждой валюты рассчитываем долги
  Object.entries(balancesByCurrency).forEach(([currency, currencyBalances]) => {
    const creditors = currencyBalances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance)
    const debtors = currencyBalances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance)

    let i = 0, j = 0
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i]
      const debtor = debtors[j]
      
      const amount = Math.min(creditor.balance, Math.abs(debtor.balance))
      
      if (amount > 0.01) { // Игнорируем очень маленькие суммы
        debts.push({
          from: debtor.participantId,
          to: creditor.participantId,
          fromName: debtor.participantName,
          toName: creditor.participantName,
          amount: Math.round(amount * 100) / 100,
          currency
        })
      }

      creditor.balance -= amount
      debtor.balance += amount

      if (creditor.balance <= 0.01) i++
      if (Math.abs(debtor.balance) <= 0.01) j++
    }
  })

  return debts
}
