"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  type FinanceData,
  type FixedExpense,
  formatCurrency,
  formatDate,
  DEFAULT_FIXED_CATEGORIES,
} from "@/lib/finance-store"
import { Plus, Pencil, Trash2, Home, Filter } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { PaymentNotifications } from "./payment-notifications"
import { MonthSelector } from "./month-selector"

const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"]

interface FixedExpensesViewProps {
  data: FinanceData
  onAdd: (expense: Omit<FixedExpense, "id">) => Promise<void>
  onUpdate: (expense: FixedExpense) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onUpdateCreditCardExpense: (expense: any) => Promise<void>
  darkMode?: boolean
}

export function FixedExpensesView({
  data,
  onAdd,
  onUpdate,
  onDelete,
  onUpdateCreditCardExpense,
  darkMode = false
}: FixedExpensesViewProps) {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const [isOpen, setIsOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    date: new Date().toLocaleDateString('en-CA'),
    category: "",
    amount: "",
  })

  // Group by category for the chart
  const filteredExpenses = useMemo(() => {
    return (data.fixedExpenses || []).filter((exp) => {
      const matchesMonth = !exp.date || (() => {
        // Timezone-safe date parsing (YYYY-MM-DD)
        const parts = exp.date.split('T')[0].split('-')
        const itemYear = parseInt(parts[0])
        const itemMonth = parseInt(parts[1]) - 1
        return itemMonth === selectedMonth && itemYear === selectedYear
      })()
      const matchesSearch = (exp.category || "").toLowerCase().includes(searchTerm.toLowerCase())
      return matchesMonth && matchesSearch
    })
  }, [data.fixedExpenses, selectedMonth, selectedYear, searchTerm])

  const totalFixed = useMemo(() =>
    filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
    [filteredExpenses]
  )

  const expensesByCategory = useMemo(() => {
    return filteredExpenses.reduce(
      (acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount
        return acc
      },
      {} as Record<string, number>,
    )
  }, [filteredExpenses])

  const chartData = useMemo(() => {
    return Object.entries(expensesByCategory).map(([name, value]) => ({
      name,
      value,
    }))
  }, [expensesByCategory])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingExpense) {
      onUpdate({
        ...editingExpense,
        date: formData.date,
        category: formData.category,
        amount: Number.parseFloat(formData.amount),
        type: editingExpense.type || 'fixed',
        paid: editingExpense.paid || false,
      })
    } else {
      onAdd({
        date: formData.date,
        category: formData.category,
        amount: Number.parseFloat(formData.amount),
        type: 'fixed',
        paid: false,
      })
    }
    resetForm()
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este gasto?")) {
      onDelete(id)
    }
  }

  const handleEdit = (expense: FixedExpense) => {
    setEditingExpense(expense)
    setFormData({
      date: expense.date || new Date().toLocaleDateString('en-CA'),
      category: expense.category,
      amount: expense.amount.toString(),
    })
    setIsOpen(true)
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toLocaleDateString('en-CA'),
      category: "",
      amount: "",
    })
    setEditingExpense(null)
    setIsOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">Gastos Fixos</h2>
          <p className="text-muted-foreground">Gerencie suas despesas mensais fixas</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Gasto Fixo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Editar Gasto Fixo" : "Adicionar Gasto Fixo"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data de Vencimento</Label>
                <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value: string) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger id="category"><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                  <SelectContent>
                    {(data.categories?.fixed?.length ? data.categories.fixed : DEFAULT_FIXED_CATEGORIES).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input id="amount" type="number" step="0.01" placeholder="0,00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit">{editingExpense ? "Salvar" : "Adicionar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <Card className="bg-card border-border">
          <CardContent className="p-6 h-full flex items-center">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <Home className="h-7 w-7 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Gastos Fixos</p>
                <p className="text-3xl font-bold text-destructive">{formatCurrency(totalFixed)}</p>
                <p className="text-xs text-muted-foreground mt-1">{filteredExpenses.length} lançamento{filteredExpenses.length !== 1 ? 's' : ''} no mês</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <MonthSelector
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  onMonthChange={(m, y) => { setSelectedMonth(m); setSelectedYear(y) }}
                />
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <PaymentNotifications
        creditCardExpenses={data.creditCardExpenses}
        creditCardLimits={data.creditCardLimits}
        fixedExpenses={data.fixedExpenses}
        goals={data.goals}
        showCCAlerts={false}
        showGoalAlerts={false}
        onMarkAsPaid={onUpdateCreditCardExpense}
        onMarkFixedAsPaid={(expense) => onUpdate({ ...expense, paid: true })}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Lista de Gastos Fixos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto max-h-96 overflow-y-auto">
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense, index) => (
                    <TableRow key={`fixed-table-${expense.id}-${index}`}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatDate(expense.date)}
                      </TableCell>
                      <TableCell className="font-medium">{expense.category}</TableCell>
                      <TableCell className="text-right text-destructive font-medium">
                        {formatCurrency(expense.amount)}
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
                  ))}
                </TableBody>
              </Table>
              <div className="md:hidden divide-y divide-border">
                {filteredExpenses.map((expense, index) => (
                  <div key={`fixed-mobile-${expense.id}-${index}`} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-card-foreground">{expense.category}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(expense.date)}</p>
                      </div>
                      <p className="font-bold text-destructive">{formatCurrency(expense.amount)}</p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
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
                ))}
              </div>
              {filteredExpenses.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  <p>Nenhum gasto fixo registrado para este mês</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-87.5">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
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
            <div className="mt-4 space-y-2">
              {chartData.map((category, index) => (
                <div key={category.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-muted-foreground">{category.name}</span>
                  </div>
                  <span className="font-medium text-card-foreground">{formatCurrency(category.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
