"use client"

// Types for financial data
export interface Income {
  id: string
  date: string
  source: string
  amount: number
  recurring: boolean
}

export interface FixedExpense {
  id: string
  date: string
  category: string
  amount: number
  type: 'fixed' | 'installment'
  installments?: number
  current_installment?: number
  paid: boolean
}

export interface VariableExpense {
  id: string
  date: string
  description: string
  category: string
  amount: number
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string
  status: 'active' | 'completed' | 'archived'
}

export interface CreditCardExpense {
  id: string
  date: string
  description: string
  totalAmount: number
  installments: number
  currentInstallment: number
  bankName: string
  category: string
  paid: boolean
}

export interface CreditCardLimit {
  id: string
  userId: string
  bankName: string
  limitAmount: number
  dueDay?: number // Dia do mês em que vence a fatura (1-31)
}

export interface FinanceData {
  incomes: Income[]
  fixedExpenses: FixedExpense[]
  variableExpenses: VariableExpense[]
  creditCardExpenses: CreditCardExpense[]
  creditCardLimits: CreditCardLimit[]
  goals: Goal[]
  emergencyReserve: number
  categories?: {
    fixed: string[]
    variable: string[]
  }
}

const STORAGE_KEY = "finance_data"

// Default categories
export const DEFAULT_FIXED_CATEGORIES = [
  "Academia", "Água", "Aluguel", "Condomínio", "Consórcio", "Educação",
  "IPTU", "Internet", "Luz", "Plano de Saúde", "Seguro", "Streaming",
  "Telefone", "Transporte", "Veículo", "Outros"
]

export const DEFAULT_VARIABLE_CATEGORIES = [
  "Alimentação", "Beleza", "Casa", "Compras", "Delivery", "Educação",
  "Lazer", "Pets", "Presentes", "Restaurante", "Saúde", "Transporte",
  "Viagem", "Outros"
]

// Initial data - vazio para o usuário preencher
const initialData: FinanceData = {
  incomes: [],
  fixedExpenses: [],
  variableExpenses: [],
  creditCardExpenses: [],
  creditCardLimits: [],
  goals: [],
  emergencyReserve: 0,
  categories: {
    fixed: DEFAULT_FIXED_CATEGORIES,
    variable: DEFAULT_VARIABLE_CATEGORIES,
  }
}

export function loadData(): FinanceData {
  if (typeof window === "undefined") return initialData

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error("Error loading data:", e)
  }

  // Save initial data if none exists
  saveData(initialData)
  return initialData
}

export function saveData(data: FinanceData): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error("Error saving data:", e)
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Calculation helpers
export function calculateTotalIncome(incomes: Income[], month?: number, year?: number): number {
  if (!incomes || !Array.isArray(incomes)) return 0
  
  const filtered = (month !== undefined && year !== undefined)
    ? incomes.filter(i => {
        if (i.recurring) return true
        if (!i.date) return false
        // Timezone-safe date parsing (YYYY-MM-DD)
        const parts = i.date.split('T')[0].split('-')
        const itemYear = parseInt(parts[0])
        const itemMonth = parseInt(parts[1]) - 1 // JS months are 0-indexed
        return itemMonth === month && itemYear === year
      })
    : incomes

  return filtered.reduce((sum, income) => sum + income.amount, 0)
}

export function calculateTotalFixedExpenses(expenses: FixedExpense[], month?: number, year?: number): number {
  if (!expenses || !Array.isArray(expenses)) return 0
  
  const filtered = (month !== undefined && year !== undefined)
    ? expenses.filter(e => {
        if (!e.date) return true // If no date, assume it applies to all months (legacy)
        // Timezone-safe date parsing
        const parts = e.date.split('T')[0].split('-')
        const itemYear = parseInt(parts[0])
        const itemMonth = parseInt(parts[1]) - 1
        return itemMonth === month && itemYear === year
      })
    : expenses

  return filtered.reduce((sum, exp) => sum + exp.amount, 0)
}

export function calculateTotalVariableExpenses(expenses: VariableExpense[], month?: number, year?: number): number {
  if (!expenses || !Array.isArray(expenses)) return 0

  const filtered = (month !== undefined && year !== undefined)
    ? expenses.filter(e => {
        if (!e.date) return false
        // Timezone-safe date parsing
        const parts = e.date.split('T')[0].split('-')
        const itemYear = parseInt(parts[0])
        const itemMonth = parseInt(parts[1]) - 1
        return itemMonth === month && itemYear === year
      })
    : expenses

  return filtered.reduce((sum, exp) => sum + exp.amount, 0)
}

export function calculateTotalCreditCardExpenses(expenses: CreditCardExpense[], month?: number, year?: number): number {
  if (!expenses || !Array.isArray(expenses)) return 0
  
  // If month/year provided, use the specialized month-aware function
  if (month !== undefined && year !== undefined) {
    return calculateCreditCardExpensesForMonth(expenses, month, year)
  }

  // Fallback to legacy summing of current installments (standard total)
  return expenses.reduce((sum, exp) => {
    const totalAmount = typeof exp.totalAmount === 'string'
      ? Number.parseFloat(String(exp.totalAmount).replace(',', '.'))
      : Number(exp.totalAmount || 0)

    const installments = typeof exp.installments === 'string'
      ? Number.parseInt(String(exp.installments))
      : Number(exp.installments || 1)

    if (isNaN(totalAmount) || isNaN(installments) || installments === 0) {
      return sum
    }

    const installmentAmount = totalAmount / installments
    return sum + installmentAmount
  }, 0)
}

export function calculateBalance(data: FinanceData, month?: number, year?: number): number {
  const income = calculateTotalIncome(data.incomes, month, year)
  const fixed = calculateTotalFixedExpenses(data.fixedExpenses, month, year)
  const variable = calculateTotalVariableExpenses(data.variableExpenses, month, year)
  const creditCard = calculateTotalCreditCardExpenses(data.creditCardExpenses, month, year)
  return income - fixed - variable - creditCard
}

export function calculateGoalProgress(goal: Goal): number {
  if (!goal.targetAmount || goal.targetAmount <= 0) return 0
  return Math.min(100, ((goal.currentAmount || 0) / goal.targetAmount) * 100)
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatDate(dateString: string): string {
  if (!dateString) return ""
  // Extract only the date part if it's a full ISO timestamp
  const dateOnly = dateString.split("T")[0]
  const [year, month, day] = dateOnly.split("-")
  if (!year || !month || !day) return dateString
  return `${day}/${month}/${year}`
}

// Export data as CSV
export function exportToCSV(data: FinanceData): string {
  let csv = "Tipo,Data,Descrição,Categoria,Valor,Status\n"

  data.incomes.forEach((i) => {
    csv += `Renda,${i.date},${i.source},,${i.amount},${i.recurring ? "Recorrente" : "Única"}\n`
  })

  data.fixedExpenses.forEach((e) => {
    csv += `Gasto Fixo,,${e.category},,${e.amount}\n`
  })

  data.variableExpenses.forEach((e) => {
    csv += `Gasto Variável,${e.date},${e.description},${e.category},${e.amount},\n`
  })

  data.creditCardExpenses.forEach((e) => {
    const installmentAmount = (e.totalAmount / e.installments).toFixed(2)
    csv += `Cartão de Crédito,${e.date},${e.description},${e.category},${installmentAmount},${e.bankName} - Parcela ${e.currentInstallment}/${e.installments}\n`
  })

  data.goals.forEach((g) => {
    csv += `Meta,,${g.name},,${g.currentAmount}/${g.targetAmount},${g.deadline}\n`
  })

  return csv
}

// === Monthly Helper Functions ===

/**
 * Calculate the number of months between two dates
 */
export function getMonthsDifference(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? startDate.split('T')[0].split('-') : [startDate.getFullYear(), startDate.getMonth() + 1]
  const end = typeof endDate === 'string' ? endDate.split('T')[0].split('-') : [endDate.getFullYear(), endDate.getMonth() + 1]
  
  const startYear = parseInt(String(start[0]))
  const startMonth = parseInt(String(start[1]))
  const endYear = parseInt(String(end[0]))
  const endMonth = parseInt(String(end[1]))
  
  return (endYear - startYear) * 12 + (endMonth - startMonth)
}

/**
 * Filter items by month and year
 */
export function filterByMonth<T extends { date: string }>(
  items: T[],
  month: number, // 0-11
  year: number
): T[] {
  return items.filter((item) => {
    if (!item.date) return false
    const parts = item.date.split('T')[0].split('-')
    const itemYear = parseInt(parts[0])
    const itemMonth = parseInt(parts[1]) - 1
    return itemMonth === month && itemYear === year
  })
}

/**
 * Calculate which installment of a credit card purchase should be paid in a given month
 */
export function getInstallmentForMonth(
  purchaseDate: string,
  targetMonth: number, // 0-11
  targetYear: number
): number {
  // Use a string representation for the target to be safe
  const targetDateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`
  const monthsSincePurchase = getMonthsDifference(purchaseDate, targetDateStr)
  return monthsSincePurchase + 1
}

/**
 * Calculate total credit card expenses for a specific month (only installments due that month).
 * Uses purely date-based logic: determines which installment # falls in the target month
 * based on the purchase date, regardless of currentInstallment tracking.
 */
export function calculateCreditCardExpensesForMonth(
  expenses: CreditCardExpense[],
  month: number, // 0-11
  year: number
): number {
  return expenses.reduce((total, expense) => {
    // Calculate which installment # falls in the target month based on purchase date
    const installmentNumber = getInstallmentForMonth(expense.date, month, year)

    // Only include if:
    // 1. The installment number is within the valid range (1 to totalInstallments)
    // 2. The expense has not been fully paid
    if (
      installmentNumber >= 1 &&
      installmentNumber <= expense.installments &&
      !expense.paid
    ) {
      const installmentAmount = expense.totalAmount / expense.installments
      return total + installmentAmount
    }

    return total
  }, 0)
}

/**
 * Get credit card expenses by bank for a specific month
 */
export function getCreditCardExpensesByBankForMonth(
  expenses: CreditCardExpense[],
  month: number, // 0-11
  year: number
): { name: string; value: number }[] {
  const byBank: Record<string, number> = {}

  expenses.forEach((expense) => {
    const installmentNumber = getInstallmentForMonth(expense.date, month, year)

    if (
      installmentNumber >= 1 &&
      installmentNumber <= expense.installments &&
      !expense.paid
    ) {
      const installmentAmount = expense.totalAmount / expense.installments
      byBank[expense.bankName] = (byBank[expense.bankName] || 0) + installmentAmount
    }
  })

  return Object.entries(byBank).map(([name, value]) => ({ name, value }))
}
