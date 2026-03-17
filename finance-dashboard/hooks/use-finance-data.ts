"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { useRouter } from 'next/navigation'
import type { FinanceData, Income, FixedExpense, VariableExpense, Goal } from '@/lib/finance-store'

export function useFinanceData() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const [data, setData] = useState<FinanceData>({
        incomes: [],
        fixedExpenses: [],
        variableExpenses: [],
        creditCardExpenses: [],
        creditCardLimits: [],
        goals: [],
        emergencyReserve: 0,
        categories: {
            fixed: [],
            variable: [],
        }
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    // Fetch all data
    const fetchData = async () => {
        if (!user) return

        try {
            setLoading(true)
            setError(null)

            const [incomesRes, fixedRes, variableRes, creditCardRes, limitsRes, goalsRes, settingsRes] = await Promise.all([
                fetch('/api/incomes'),
                fetch('/api/fixed-expenses'),
                fetch('/api/variable-expenses'),
                fetch('/api/credit-card-expenses'),
                fetch('/api/credit-card-limits'),
                fetch('/api/goals'),
                fetch('/api/settings'),
            ])

            const [incomes, fixedExpenses, variableExpenses, creditCardExpenses, creditCardLimits, goals, settings] = await Promise.all([
                incomesRes.json(),
                fixedRes.json(),
                variableRes.json(),
                creditCardRes.json(),
                limitsRes.json(),
                goalsRes.json(),
                settingsRes.json(),
            ])

            setData({
                incomes: Array.isArray(incomes) ? incomes : [],
                fixedExpenses: Array.isArray(fixedExpenses) ? fixedExpenses : [],
                variableExpenses: Array.isArray(variableExpenses) ? variableExpenses : [],
                creditCardExpenses: Array.isArray(creditCardExpenses) ? creditCardExpenses : [],
                creditCardLimits: Array.isArray(creditCardLimits) ? creditCardLimits : [],
                goals: Array.isArray(goals) ? goals : [],
                emergencyReserve: settings?.emergency_reserve || 0,
                categories: settings?.categories || {
                    fixed: [], // Will fallback to defaults in views if empty
                    variable: [],
                }
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user])

    // CRUD operations for incomes
    const addIncome = async (income: Omit<Income, 'id'>) => {
        try {
            const res = await fetch('/api/incomes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(income),
            })
            const newIncome = await res.json()
            setData(prev => ({ ...prev, incomes: [...prev.incomes, newIncome] }))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add income')
        }
    }

    const updateIncome = async (income: Income) => {
        try {
            const res = await fetch('/api/incomes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(income),
            })
            const updated = await res.json()
            setData(prev => ({
                ...prev,
                incomes: prev.incomes.map(i => i.id === updated.id ? updated : i),
            }))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update income')
        }
    }

    const deleteIncome = async (id: string) => {
        try {
            await fetch(`/api/incomes?id=${id}`, { method: 'DELETE' })
            setData(prev => ({ ...prev, incomes: prev.incomes.filter(i => i.id !== id) }))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete income')
        }
    }

    // CRUD operations for fixed expenses
    const addFixedExpense = async (expense: Omit<FixedExpense, 'id'>) => {
        try {
            const res = await fetch('/api/fixed-expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expense),
            })
            const newExpense = await res.json()
            setData(prev => ({ ...prev, fixedExpenses: [...prev.fixedExpenses, newExpense] }))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add fixed expense')
        }
    }

    const updateFixedExpense = async (expense: FixedExpense) => {
        try {
            const res = await fetch('/api/fixed-expenses', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expense),
            })
            const updated = await res.json()
            setData(prev => ({
                ...prev,
                fixedExpenses: prev.fixedExpenses.map(e => e.id === updated.id ? updated : e),
            }))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update fixed expense')
        }
    }

    const deleteFixedExpense = async (id: string) => {
        try {
            await fetch(`/api/fixed-expenses?id=${id}`, { method: 'DELETE' })
            setData(prev => ({ ...prev, fixedExpenses: prev.fixedExpenses.filter(e => e.id !== id) }))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete fixed expense')
        }
    }

    // CRUD operations for variable expenses
    const addVariableExpense = async (expense: Omit<VariableExpense, 'id'>) => {
        try {
            const res = await fetch('/api/variable-expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expense),
            })
            const newExpense = await res.json()
            setData(prev => ({ ...prev, variableExpenses: [...prev.variableExpenses, newExpense] }))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add variable expense')
        }
    }

    const updateVariableExpense = async (expense: VariableExpense) => {
        try {
            const res = await fetch('/api/variable-expenses', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expense),
            })
            const updated = await res.json()
            setData(prev => ({
                ...prev,
                variableExpenses: prev.variableExpenses.map(e => e.id === updated.id ? updated : e),
            }))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update variable expense')
        }
    }

    const deleteVariableExpense = async (id: string) => {
        try {
            await fetch(`/api/variable-expenses?id=${id}`, { method: 'DELETE' })
            setData(prev => ({ ...prev, variableExpenses: prev.variableExpenses.filter(e => e.id !== id) }))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete variable expense')
        }
    }

    // CRUD operations for goals
    const addGoal = async (goal: Omit<Goal, 'id'>) => {
        try {
            const res = await fetch('/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(goal),
            })
            const newGoal = await res.json()
            setData(prev => ({ ...prev, goals: [...prev.goals, newGoal] }))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add goal')
        }
    }

    const updateGoal = async (goal: Goal) => {
        try {
            const res = await fetch('/api/goals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(goal),
            })
            const updated = await res.json()
            setData(prev => ({
                ...prev,
                goals: prev.goals.map(g => g.id === updated.id ? updated : g),
            }))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update goal')
        }
    }

    const deleteGoal = async (id: string) => {
        try {
            await fetch(`/api/goals?id=${id}`, { method: 'DELETE' })
            setData(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete goal')
        }
    }

    // CRUD operations for credit card expenses
    const addCreditCardExpense = async (expense: Omit<import('@/lib/finance-store').CreditCardExpense, 'id'>) => {
        try {
            const res = await fetch('/api/credit-card-expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expense),
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || 'Failed to add credit card expense')
            }

            const newExpense = await res.json()
            setData(prev => ({ ...prev, creditCardExpenses: [...prev.creditCardExpenses, newExpense] }))
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : 'Failed to add credit card expense')
            throw err // Re-throw to let component know it failed
        }
    }

    const updateCreditCardExpense = async (expense: import('@/lib/finance-store').CreditCardExpense) => {
        try {
            const res = await fetch('/api/credit-card-expenses', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expense),
            })
            const updated = await res.json()
            setData(prev => ({
                ...prev,
                creditCardExpenses: prev.creditCardExpenses.map(e => e.id === updated.id ? updated : e),
            }))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update credit card expense')
        }
    }

    const deleteCreditCardExpense = async (id: string) => {
        try {
            await fetch(`/api/credit-card-expenses?id=${id}`, { method: 'DELETE' })
            setData(prev => ({ ...prev, creditCardExpenses: prev.creditCardExpenses.filter(e => e.id !== id) }))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete credit card expense')
        }
    }

    // Update emergency reserve
    const updateEmergencyReserve = async (amount: number) => {
        try {
            await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emergency_reserve: amount }),
            })
            setData(prev => ({ ...prev, emergencyReserve: amount }))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update emergency reserve')
        }
    }

    const updateCreditCardLimit = async (bankName: string, limitAmount: number, dueDay?: number) => {
        try {
            const res = await fetch('/api/credit-card-limits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bankName, limitAmount, dueDay }),
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || 'Failed to update credit card limit')
            }

            const newLimit = await res.json()

            setData(prev => {
                const existingIndex = prev.creditCardLimits.findIndex(l => l.bankName === bankName)
                let newLimits

                if (existingIndex >= 0) {
                    newLimits = [...prev.creditCardLimits]
                    newLimits[existingIndex] = newLimit
                } else {
                    newLimits = [...prev.creditCardLimits, newLimit]
                }

                return { ...prev, creditCardLimits: newLimits }
            })
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : 'Failed to update credit card limit')
            throw err
        }
    }

    // Update categories
    const updateCategories = async (categories: { fixed: string[]; variable: string[] }) => {
        try {
            await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categories }),
            })
            setData(prev => ({ ...prev, categories }))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update categories')
        }
    }

    return {
        data,
        loading: loading || authLoading,
        error,
        refresh: fetchData,
        // Income operations
        addIncome,
        updateIncome,
        deleteIncome,
        // Fixed expense operations
        addFixedExpense,
        updateFixedExpense,
        deleteFixedExpense,
        // Variable expense operations
        addVariableExpense,
        updateVariableExpense,
        deleteVariableExpense,
        // Credit card operations
        addCreditCardExpense,
        updateCreditCardExpense,
        deleteCreditCardExpense,
        updateCreditCardLimit,
        // Goal operations
        addGoal,
        updateGoal,
        deleteGoal,
        // Settings
        updateEmergencyReserve,
        updateCategories,
    }
}
