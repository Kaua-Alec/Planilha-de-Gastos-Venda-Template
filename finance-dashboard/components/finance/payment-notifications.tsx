"use client"

import { useMemo, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Bell, CheckCircle2, CreditCard, Loader2, Target, AlertCircle, Home } from "lucide-react"
import type { CreditCardExpense, CreditCardLimit, FixedExpense, Goal } from "@/lib/finance-store"
import { formatCurrency, formatDate, getInstallmentForMonth } from "@/lib/finance-store"

interface PaymentNotificationsProps {
    creditCardExpenses: CreditCardExpense[]
    creditCardLimits: CreditCardLimit[]
    fixedExpenses: FixedExpense[]
    goals: Goal[]
    onMarkAsPaid?: (expense: CreditCardExpense) => Promise<void>
    onMarkFixedAsPaid?: (expense: FixedExpense) => Promise<void>
    showGoalAlerts?: boolean
    showCCAlerts?: boolean
    showFixedAlerts?: boolean
}

// Parse YYYY-MM-DD safely without timezone shifts
function parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
}

// Calculate months difference between two dates safely
function getMonthsDifference(startDate: string, endDate: Date): number {
    const start = parseLocalDate(startDate)
    const monthsDiff = (endDate.getFullYear() - start.getFullYear()) * 12 + (endDate.getMonth() - start.getMonth())
    return monthsDiff
}

export function PaymentNotifications({
    creditCardExpenses,
    creditCardLimits,
    fixedExpenses,
    goals,
    onMarkAsPaid,
    onMarkFixedAsPaid,
    showGoalAlerts = true,
    showCCAlerts = true,
    showFixedAlerts = true
}: PaymentNotificationsProps) {
    // State to track which items are currently being processed (showing spinner)
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
    // State to track items that should be hidden (immediate feedback)
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

    // Get current day of month
    const currentDay = new Date().getDate()
    const today = new Date()

    // Filter unpaid expenses that are due today
    const ccDueToday = useMemo(() => {
        return (creditCardExpenses || []).filter((expense) => {
            // Find the due day for this card from limits configuration
            const cardLimit = creditCardLimits.find(limit => limit.bankName === expense.bankName)
            const dueDay = cardLimit?.dueDay

            // 1. The due day matches current day
            // 2. The purchase date plus installments covers the current month
            // 3. The current installment for this month hasn't been paid yet
            const installmentNumber = getInstallmentForMonth(expense.date, today.getMonth(), today.getFullYear())
            const isInstallmentDue = installmentNumber >= 1 && installmentNumber <= expense.installments
            
            // It's unpaid if the whole purchase is not 'paid' 
            // AND the current tracked installment is the one due (or earlier)
            const isUnpaid = !expense.paid && (expense.currentInstallment || 1) <= installmentNumber

            return (
                dueDay === currentDay &&
                isInstallmentDue &&
                isUnpaid
            )
        })
    }, [creditCardExpenses, creditCardLimits, currentDay, today])

    // Filter fixed expenses due today
    const fixedDueToday = useMemo(() => {
        return (fixedExpenses || []).filter((expense) => {
            if (!expense.date) return false
            const expenseDate = parseLocalDate(expense.date)
            const dueDay = expenseDate.getDate()
            const isCurrentMonth = expenseDate.getMonth() === today.getMonth() && expenseDate.getFullYear() === today.getFullYear()

            // Handle installments if they exist for fixed expenses
            const installmentNumber = expense.type === 'installment' && expense.installments 
                ? getInstallmentForMonth(expense.date, today.getMonth(), today.getFullYear())
                : 1
            const isInstallmentValid = expense.type === 'installment' && expense.installments 
                ? (installmentNumber >= 1 && installmentNumber <= expense.installments)
                : true
            
            const isUnpaid = !expense.paid && (
                expense.type !== 'installment' || 
                (expense.current_installment || 1) <= installmentNumber
            )

            return (
                dueDay === currentDay && 
                isInstallmentValid && 
                isUnpaid
            )
        })
    }, [fixedExpenses, currentDay, today])

    // Filter overdue goals
    const overdueGoals = useMemo(() => {
        const todayStr = today.toISOString().split('T')[0]
        return (goals || []).filter(goal => {
            const isCompleted = (Number(goal.currentAmount) || 0) >= (Number(goal.targetAmount) || 0)
            return !isCompleted && goal.status !== 'archived' && goal.deadline < todayStr
        })
    }, [goals, today])

    // Determine if we have anything to show based on visibility props
    const hasVisibleCC = showCCAlerts && ccDueToday.length > 0
    const hasVisibleFixed = showFixedAlerts && fixedDueToday.length > 0
    const hasVisibleGoals = showGoalAlerts && overdueGoals.length > 0

    if (!hasVisibleCC && !hasVisibleFixed && !hasVisibleGoals) {
        return null
    }

    return (
        <div className="space-y-3">
            {/* Credit Card Notifications */}
            {showCCAlerts && ccDueToday
                .filter(expense => !dismissedIds.has(expense.id))
                .map((expense, index) => {
                    const installmentAmount = expense.totalAmount / expense.installments
                    const isProcessing = processingIds.has(expense.id)

                    return (
                        <Alert key={`cc-alert-${expense.id}-${index}`} className="bg-warning/10 border-warning">
                            <Bell className="h-4 w-4 text-warning" />
                            <AlertTitle className="flex items-center justify-between">
                                <span className="text-warning font-semibold">Vencimento Hoje! (Cartão)</span>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </AlertTitle>
                            <AlertDescription className="mt-2">
                                <div className="space-y-2">
                                    <div>
                                        <p className="font-medium text-foreground">{expense.description}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {expense.bankName} - Parcela {expense.currentInstallment}/{expense.installments} 
                                            {expense.installments > 1 && ` (Faltam ${expense.installments - (expense.currentInstallment || 1) + 1})`}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-lg font-bold text-warning">
                                            {formatCurrency(installmentAmount)}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="default"
                                            className="gap-2"
                                            disabled={isProcessing}
                                            onClick={async () => {
                                                setProcessingIds(prev => new Set(prev).add(expense.id))
                                                try {
                                                    await onMarkAsPaid?.(expense)
                                                    setDismissedIds(prev => new Set(prev).add(expense.id))
                                                } finally {
                                                    setProcessingIds(prev => {
                                                        const next = new Set(prev)
                                                        next.delete(expense.id)
                                                        return next
                                                    })
                                                }
                                            }}
                                        >
                                            {isProcessing ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="h-4 w-4" />
                                            )}
                                            {isProcessing ? "Processando..." : "Marcar como Pago"}
                                        </Button>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )
                })}

            {/* Fixed Expenses Notifications */}
            {showFixedAlerts && fixedDueToday
                .filter(expense => !dismissedIds.has(expense.id))
                .map((expense, index) => {
                    const isProcessing = processingIds.has(expense.id)

                    return (
                        <Alert key={`fixed-alert-${expense.id}-${index}`} className="bg-warning/10 border-warning">
                            <Bell className="h-4 w-4 text-warning" />
                            <AlertTitle className="flex items-center justify-between">
                                <span className="text-warning font-semibold">Vencimento Hoje! (Fixo)</span>
                                <Home className="h-4 w-4 text-muted-foreground" />
                            </AlertTitle>
                            <AlertDescription className="mt-2">
                                <div className="space-y-2">
                                    <div>
                                        <p className="font-medium text-foreground">{expense.category}</p>
                                        {expense.type === 'installment' && expense.installments ? (
                                            <p className="text-sm text-muted-foreground">
                                                Parcela {expense.current_installment || 1}/{expense.installments} 
                                                {expense.installments > 1 && ` (Faltam ${expense.installments - (expense.current_installment || 1) + 1})`}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Gasto Fixo Mensal</p>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-lg font-bold text-warning">
                                            {formatCurrency(expense.amount)}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="default"
                                            className="gap-2"
                                            disabled={isProcessing}
                                            onClick={async () => {
                                                setProcessingIds(prev => new Set(prev).add(expense.id))
                                                try {
                                                    await onMarkFixedAsPaid?.(expense)
                                                    setDismissedIds(prev => new Set(prev).add(expense.id))
                                                } finally {
                                                    setProcessingIds(prev => {
                                                        const next = new Set(prev)
                                                        next.delete(expense.id)
                                                        return next
                                                    })
                                                }
                                            }}
                                        >
                                            {isProcessing ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="h-4 w-4" />
                                            )}
                                            {isProcessing ? "Processando..." : "Marcar como Pago"}
                                        </Button>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )
                })}

            {/* Overdue Goals Alert */}
            {showGoalAlerts && overdueGoals.length > 0 && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="flex items-center justify-between">
                        <span className="font-semibold">Atenção: Metas Vencidas</span>
                        <Target className="h-4 w-4" />
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                        <p className="text-sm">
                            Você tem {overdueGoals.length} {overdueGoals.length === 1 ? 'meta que ultrapassou' : 'metas que ultrapassaram'} o prazo sem serem concluídas.
                            Vá até a aba de <strong>Metas</strong> para resolver e manter seu planejamento em dia!
                        </p>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}
