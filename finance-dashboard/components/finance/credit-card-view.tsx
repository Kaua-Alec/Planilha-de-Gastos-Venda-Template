"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
    type FinanceData,
    type CreditCardExpense,
    calculateTotalCreditCardExpenses,
    calculateCreditCardExpensesForMonth,
    getCreditCardExpensesByBankForMonth,
    getInstallmentForMonth,
    formatCurrency,
    formatDate,
    DEFAULT_VARIABLE_CATEGORIES,
} from "@/lib/finance-store"
import { Plus, Pencil, Trash2, Filter, Building2, Calendar, Tag } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { PaymentNotifications } from "./payment-notifications"
import { MonthSelector } from "./month-selector"

const BANKS = [
    "Nubank",
    "Inter",
    "PicPay",
    "C6 Bank",
    "Banco do Brasil",
    "Bradesco",
    "Itaú",
    "Santander",
    "Caixa",
    "Sicoob",
    "Sicredi",
    "Outros",
]

// Use same dynamic categories as variable expenses for Credit Card
const COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#06b6d4"]

interface CreditCardViewProps {
    data: FinanceData
    onAdd: (expense: Omit<CreditCardExpense, "id">) => Promise<void>
    onUpdate: (expense: CreditCardExpense) => Promise<void>
    onDelete: (id: string) => Promise<void>
    updateCreditCardLimit: (bankName: string, limitAmount: number, dueDay?: number) => Promise<void>
    onUpdateFixedExpense: (expense: any) => Promise<void>
    darkMode?: boolean
}

export function CreditCardView({
    data,
    onAdd,
    onUpdate,
    onDelete,
    updateCreditCardLimit,
    onUpdateFixedExpense,
    darkMode = false
}: CreditCardViewProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState<CreditCardExpense | null>(null)
    const [bankFilter, setBankFilter] = useState<string>("all")
    const [categoryFilter, setCategoryFilter] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState("")

    // Dynamic categories
    const categories = data.categories?.variable?.length ? data.categories.variable : DEFAULT_VARIABLE_CATEGORIES

    // Month selector state
    const now = new Date()
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
    const [selectedYear, setSelectedYear] = useState(now.getFullYear())
    const [formData, setFormData] = useState({
        date: "",
        description: "",
        totalAmount: "",
        installments: "1",
        bankName: "",
        category: "",
        paid: false,
    })

    const filteredExpenses = useMemo(() => {
        return data.creditCardExpenses.filter((exp) => {
            const description = exp.description || ""
            const matchesSearch = description.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesBank = bankFilter === "all" || exp.bankName === bankFilter
            const matchesCategory = categoryFilter === "all" || exp.category === categoryFilter
            return matchesBank && matchesCategory && matchesSearch
        }).sort((a, b) => {
            // Sort by date descending (most recent first)
            if (a.date > b.date) return -1
            if (a.date < b.date) return 1
            return 0
        })
    }, [data.creditCardExpenses, bankFilter, categoryFilter, searchTerm])

    const totalCreditCard = calculateTotalCreditCardExpenses(filteredExpenses)

    // Monthly expenses calculation
    const monthlyExpenses = useMemo(() => {
        return calculateCreditCardExpensesForMonth(data.creditCardExpenses, selectedMonth, selectedYear)
    }, [data.creditCardExpenses, selectedMonth, selectedYear])

    // Expenses by bank for selected month
    const monthlyExpensesByBank = useMemo(() => {
        return getCreditCardExpensesByBankForMonth(data.creditCardExpenses, selectedMonth, selectedYear)
    }, [data.creditCardExpenses, selectedMonth, selectedYear])

    // Expenses by bank — remaining committed value FROM the selected month onwards (date-based)
    const expensesByBank = useMemo(() => {
        const grouped: Record<string, number> = {}
        data.creditCardExpenses
            .filter(exp => !exp.paid)
            .forEach((exp) => {
                // Which installment falls in the selected month?
                const installmentNumberThisMonth = getInstallmentForMonth(exp.date, selectedMonth, selectedYear)
                // Only count if the installment is still within the valid range
                if (installmentNumberThisMonth < 1 || installmentNumberThisMonth > exp.installments) return
                const installmentAmount = exp.totalAmount / exp.installments
                // Remaining installments from selected month onwards (inclusive)
                const remainingInstallments = exp.installments - installmentNumberThisMonth + 1
                const remainingValue = installmentAmount * remainingInstallments
                grouped[exp.bankName] = (grouped[exp.bankName] || 0) + remainingValue
            })
        return Object.entries(grouped).map(([name, value]) => ({ name, value }))
    }, [data.creditCardExpenses, selectedMonth, selectedYear])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const amount = typeof formData.totalAmount === 'string'
                ? Number.parseFloat(formData.totalAmount.replace(',', '.'))
                : Number(formData.totalAmount)

            if (isNaN(amount)) {
                alert("Por favor, insira um valor válido.")
                return
            }

            if (editingExpense) {
                await onUpdate({
                    ...editingExpense,
                    date: formData.date,
                    description: formData.description,
                    totalAmount: amount,
                    installments: Number.parseInt(formData.installments),
                    currentInstallment: editingExpense.currentInstallment, // Keep existing value
                    bankName: formData.bankName,
                    category: formData.category,
                    paid: formData.paid,
                })
            } else {
                await onAdd({
                    date: formData.date,
                    description: formData.description,
                    totalAmount: amount,
                    installments: Number.parseInt(formData.installments),
                    currentInstallment: 1, // Always start at 1 for new purchases
                    bankName: formData.bankName,
                    category: formData.category,
                    paid: formData.paid,
                })
            }
            resetForm()
        } catch (error) {
            console.error("Failed to save expense:", error)
            alert("Erro ao salvar despesa. Verifique os dados e tente novamente.")
        }
    }

    const handleDelete = (id: string) => {
        if (confirm("Tem certeza que deseja excluir esta compra?")) {
            onDelete(id)
        }
    }

    const handleEdit = (expense: CreditCardExpense) => {
        setEditingExpense(expense)
        setFormData({
            date: expense.date || "",
            description: expense.description || "",
            totalAmount: expense.totalAmount?.toString() || "",
            installments: expense.installments?.toString() || "1",
            bankName: expense.bankName || "",
            category: expense.category || "",
            paid: expense.paid || false,
        })
        setIsOpen(true)
    }

    const resetForm = () => {
        setFormData({
            date: "",
            description: "",
            totalAmount: "",
            installments: "1",
            bankName: "",
            category: "",
            paid: false,
        })
        setEditingExpense(null)
        setIsOpen(false)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-card-foreground">Cartão de Crédito</h2>
                    <p className="text-muted-foreground">Controle suas compras parceladas e à vista</p>
                </div>

                {/* Payment Notifications */}
                <PaymentNotifications
                    creditCardExpenses={data.creditCardExpenses}
                    creditCardLimits={data.creditCardLimits}
                    fixedExpenses={data.fixedExpenses}
                    goals={data.goals}
                    showGoalAlerts={false}
                    showFixedAlerts={false}
                    onMarkAsPaid={async (expense: CreditCardExpense) => {
                        // Check if this is the last installment
                        const isLastInstallment = (expense.currentInstallment || 1) >= (expense.installments || 1)

                        if (isLastInstallment) {
                            // Mark the entire purchase as paid (last installment)
                            await onUpdate({ ...expense, paid: true })
                        } else {
                            // Increment to next installment but keep paid as false
                            await onUpdate({
                                ...expense,
                                currentInstallment: (expense.currentInstallment || 1) + 1,
                                paid: false,
                            })
                        }
                    }}
                    onMarkFixedAsPaid={async (expense: any) => {
                        // Simplified as FixedExpense schema currently doesn't support complex installment logic
                        await onUpdateFixedExpense({ ...expense, paid: true })
                    }}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Main Actions & Table (2 cols wide) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Controls Bar */}
                    <Card className="bg-card border-border">
                        <CardContent className="p-4">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <MonthSelector
                                        selectedMonth={selectedMonth}
                                        selectedYear={selectedYear}
                                        onMonthChange={(month, year) => {
                                            setSelectedMonth(month)
                                            setSelectedYear(year)
                                        }}
                                    />

                                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full sm:w-auto gap-2">
                                                <Plus className="h-4 w-4" />
                                                Nova Compra
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>{editingExpense ? "Editar Compra" : "Adicionar Compra"}</DialogTitle>
                                            </DialogHeader>
                                            <form onSubmit={handleSubmit} className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="date">Data da Compra</Label>
                                                    <Input
                                                        id="date"
                                                        type="date"
                                                        value={formData.date}
                                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="description">Descrição</Label>
                                                    <Input
                                                        id="description"
                                                        placeholder="Ex: Notebook, Celular, Roupas..."
                                                        value={formData.description}
                                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="totalAmount">Valor Total (R$)</Label>
                                                        <Input
                                                            id="totalAmount"
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0,00"
                                                            value={formData.totalAmount}
                                                            onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="installments">Número de Parcelas</Label>
                                                        <Input
                                                            id="installments"
                                                            type="number"
                                                            min="1"
                                                            max="48"
                                                            value={formData.installments}
                                                            onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="bankName">Banco</Label>
                                                    <Select
                                                        value={formData.bankName}
                                                        onValueChange={(value: string) => setFormData({ ...formData, bankName: value })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione o banco" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {BANKS.map((bank) => (
                                                                <SelectItem key={bank} value={bank}>
                                                                    {bank}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="category">Categoria</Label>
                                                    <Select
                                                        value={formData.category}
                                                        onValueChange={(value: string) => setFormData({ ...formData, category: value })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione uma categoria" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {categories.map((cat) => (
                                                                <SelectItem key={cat} value={cat}>
                                                                    {cat}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="paid"
                                                        checked={formData.paid}
                                                        onCheckedChange={(checked) => setFormData({ ...formData, paid: checked as boolean })}
                                                    />
                                                    <Label htmlFor="paid" className="cursor-pointer">
                                                        Parcela paga
                                                    </Label>
                                                </div>
                                                <div className="flex gap-2 justify-end">
                                                    <Button type="button" variant="outline" onClick={resetForm}>
                                                        Cancelar
                                                    </Button>
                                                    <Button type="submit">{editingExpense ? "Salvar" : "Adicionar"}</Button>
                                                </div>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border">
                                    <div className="flex items-center gap-2 flex-1">
                                        <Filter className="h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar por descrição..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>
                                    <Select value={bankFilter} onValueChange={setBankFilter}>
                                        <SelectTrigger className="w-full sm:w-40">
                                            <SelectValue placeholder="Banco" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            {BANKS.map((bank) => (
                                                <SelectItem key={bank} value={bank}>
                                                    {bank}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger className="w-full sm:w-40">
                                            <SelectValue placeholder="Categoria" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas</SelectItem>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat} value={cat}>
                                                    {cat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Table */}
                    <Card className="bg-card border-border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-card-foreground text-lg">Histórico de Compras</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                                {/* Desktop Table */}
                                <Table className="hidden md:table">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead>Banco</TableHead>
                                            <TableHead>Parcelas</TableHead>
                                            <TableHead className="text-right">Valor/Mês</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredExpenses.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    Nenhuma compra encontrada para os filtros selecionados.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredExpenses.map((expense, index) => {
                                                const installmentAmount = expense.totalAmount / expense.installments
                                                return (
                                                    <TableRow key={`cc-table-${expense.id}-${index}`}>
                                                        <TableCell>{formatDate(expense.date)}</TableCell>
                                                        <TableCell className="font-medium">
                                                            <div>
                                                                <div>{expense.description}</div>
                                                                <div className="text-xs text-muted-foreground">{expense.category}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                                                <span className="text-sm">{expense.bankName}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {(() => {
                                                                const n = getInstallmentForMonth(expense.date, selectedMonth, selectedYear)
                                                                const isActive = n >= 1 && n <= expense.installments && !expense.paid
                                                                const isDone = expense.paid || n > expense.installments
                                                                return (
                                                                    <span className={`px-2 py-1 rounded-full text-xs ${isActive ? "bg-purple-500/20 text-purple-400" : isDone ? "bg-green-500/20 text-green-400" : "bg-secondary text-muted-foreground"}`}>
                                                                        {isActive ? `${n}/${expense.installments}` : isDone ? "Pago" : "—"}
                                                                        {isActive && expense.installments > 1 && (
                                                                            <span className="ml-1 text-[10px] opacity-70">
                                                                                (Faltam {expense.installments - (expense.currentInstallment || 1) + 1})
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                )
                                                            })()}
                                                        </TableCell>
                                                        <TableCell className="text-right text-purple-500 font-medium">
                                                            {formatCurrency(installmentAmount)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })
                                        )}
                                    </TableBody>
                                </Table>

                                {/* Mobile Card List */}
                                <div className="md:hidden divide-y divide-border">
                                    {filteredExpenses.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground">
                                            Nenhuma compra encontrada.
                                        </div>
                                    ) : (
                                        filteredExpenses.map((expense, index) => {
                                            const installmentAmount = expense.totalAmount / expense.installments
                                            const n = getInstallmentForMonth(expense.date, selectedMonth, selectedYear)
                                            const isActive = n >= 1 && n <= expense.installments && !expense.paid
                                            const isDone = expense.paid || n > expense.installments

                                            return (
                                                <div key={`cc-mobile-${expense.id}-${index}`} className="p-4 space-y-3">
                                                    <div className="flex justify-between items-start">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold text-card-foreground leading-none">{expense.description}</p>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                    <Building2 className="h-3 w-3" />
                                                                    {expense.bankName}
                                                                </div>
                                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                    <Tag className="h-3 w-3" />
                                                                    {expense.category}
                                                                </div>
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    {formatDate(expense.date)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-purple-500">{formatCurrency(installmentAmount)}</p>
                                                            <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? "bg-purple-500/20 text-purple-400" : isDone ? "bg-green-500/20 text-green-400" : "bg-secondary text-muted-foreground"}`}>
                                                                {isActive ? `${n}/${expense.installments}` : isDone ? "Pago" : "—"}
                                                                {isActive && expense.installments > 1 && ` (Faltam ${expense.installments - (expense.currentInstallment || 1) + 1})`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end gap-2 pt-1 border-t border-border/10">
                                                        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => handleEdit(expense)}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                            Editar
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="h-8 gap-1 text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleDelete(expense.id)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            Excluir
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Sidebar (Summaries & Limits) */}
                <div className="space-y-6">
                    {/* Limits Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg font-semibold">Limites</CardTitle>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Configurar Limites</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        {BANKS.map((bank) => {
                                            const limit = data.creditCardLimits.find(l => l.bankName === bank)?.limitAmount || 0
                                            const dueDay = data.creditCardLimits.find(l => l.bankName === bank)?.dueDay || ''
                                            return (
                                                <div key={bank} className="space-y-2 border-b pb-4 last:border-0">
                                                    <Label className="font-semibold">{bank}</Label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label className="text-sm text-muted-foreground">Limite (R$)</Label>
                                                            <Input
                                                                type="number"
                                                                placeholder="0,00"
                                                                defaultValue={limit}
                                                                onBlur={(e) => {
                                                                    const val = Number(e.target.value)
                                                                    if (val !== limit) {
                                                                        updateCreditCardLimit(bank, val, dueDay as number || undefined)
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm text-muted-foreground">Dia Vencimento</Label>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                max="31"
                                                                placeholder="Dia"
                                                                defaultValue={dueDay}
                                                                onBlur={(e) => {
                                                                    const val = e.target.value ? Number(e.target.value) : undefined
                                                                    if (val !== dueDay) {
                                                                        updateCreditCardLimit(bank, limit, val)
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2">
                            {data.creditCardLimits.filter(l => l.limitAmount > 0).length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Sem limites configurados.
                                </p>
                            ) : (
                                data.creditCardLimits.filter(l => l.limitAmount > 0).map((limit) => {
                                    const totalCommitted = data.creditCardExpenses
                                        .filter(e => e.bankName === limit.bankName && !e.paid)
                                        .reduce((sum, e) => {
                                            const installmentNumberThisMonth = getInstallmentForMonth(e.date, selectedMonth, selectedYear)
                                            if (installmentNumberThisMonth < 1 || installmentNumberThisMonth > e.installments) return sum
                                            const installmentAmount = e.totalAmount / e.installments
                                            const remainingInstallments = e.installments - installmentNumberThisMonth + 1
                                            const remainingValue = installmentAmount * remainingInstallments
                                            return sum + remainingValue
                                        }, 0)

                                    const progress = Math.min(100, (totalCommitted / limit.limitAmount) * 100)

                                    return (
                                        <div key={limit.bankName} className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="font-medium">{limit.bankName}</span>
                                                <span className="text-muted-foreground">
                                                    {formatCurrency(totalCommitted)} / {formatCurrency(limit.limitAmount)}
                                                </span>
                                            </div>
                                            <Progress value={progress} className="h-1.5" />
                                        </div>
                                    )
                                })
                            )}
                        </CardContent>
                    </Card>

                    {/* Monthly Summary Card */}
                    <Card className="bg-card border-border shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-purple-500" />
                                Resumo do Mês
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Total */}
                            <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20 text-center">
                                <p className="text-sm text-muted-foreground mb-1">Total a Pagar</p>
                                <p className="text-3xl font-bold text-purple-500">{formatCurrency(monthlyExpenses)}</p>
                            </div>

                            {/* Chart */}
                            {monthlyExpensesByBank.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="h-[200px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={monthlyExpensesByBank}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={70}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {monthlyExpensesByBank.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-2 shadow-lg">
                                                                    <p className="text-[#f3f4f6] text-sm font-medium mb-1">
                                                                        {payload[0].name}
                                                                    </p>
                                                                    <p className="text-lg font-bold" style={{ color: payload[0].payload.fill || payload[0].color }}>
                                                                        {formatCurrency(payload[0].value as number)}
                                                                    </p>
                                                                </div>
                                                            )
                                                        }
                                                        return null
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Legend */}
                                    <div className="space-y-2">
                                        {monthlyExpensesByBank.map((bank, index) => (
                                            <div key={bank.name} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                    <span className="text-muted-foreground">{bank.name}</span>
                                                </div>
                                                <span className="font-medium text-card-foreground">{formatCurrency(bank.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-8 text-center text-muted-foreground text-sm">
                                    Nenhuma parcela vence neste mês.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
