
export interface Trip {
  id: string
  name: string
  location?: string
  startDate?: string
  endDate?: string
  isArchived: boolean
  createdAt: string
  updatedAt: string
  participants?: Participant[]
  expenses?: Expense[]
  transfers?: Transfer[]
}

export interface Participant {
  id: string
  name: string
  tripId: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  currency: string
  date: string
  payerId: string
  tripId: string
  createdAt: string
  payer?: Participant
  shares?: ExpenseShare[]
}

export interface ExpenseShare {
  id: string
  expenseId: string
  participantId: string
  amount: number
  participant?: Participant
}

export interface Transfer {
  id: string
  amount: number
  currency: string
  description?: string
  date: string
  fromId: string
  toId: string
  tripId: string
  createdAt: string
  from?: Participant
  to?: Participant
}

export interface Balance {
  participantId: string
  participantName: string
  balance: number
  currency: string
}

export interface Debt {
  from: string
  to: string
  fromName: string
  toName: string
  amount: number
  currency: string
}

export const CURRENCIES = [
  { code: 'RUB', symbol: '₽', name: 'Российский рубль' },
  { code: 'USD', symbol: '$', name: 'Доллар США' },
  { code: 'EUR', symbol: '€', name: 'Евро' },
  { code: 'GBP', symbol: '£', name: 'Фунт стерлингов' },
  { code: 'CNY', symbol: '¥', name: 'Китайский юань' },
  { code: 'JPY', symbol: '¥', name: 'Японская иена' },
  { code: 'KRW', symbol: '₩', name: 'Южнокорейская вона' },
  { code: 'THB', symbol: '฿', name: 'Тайский бат' },
  { code: 'VND', symbol: '₫', name: 'Вьетнамский донг' },
]

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find(c => c.code === code)?.symbol || code
}
