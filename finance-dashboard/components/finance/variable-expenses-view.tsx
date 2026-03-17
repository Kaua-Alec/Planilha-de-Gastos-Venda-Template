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
  type VariableExpense,
  formatCurrency,
  formatDate,
  DEFAULT_VARIABLE_CATEGORIES,
} from "@/lib/finance-store"
import { Plus, Pencil, Trash2, ShoppingCart, Filter } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { MonthSelector } from "./month-selector"

const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"]

interface VariableExpensesViewProps {
  data: FinanceData
  onAdd: (expense: Omit<VariableExpense, "id">) => Promise<void>
  onUpdate: (expense: VariableExpense) => Promise<void>
  onDelete: (id: string) => Promise<void>
  darkMode?: boolean
}

export function VariableExpensesView({ data, onAdd, onUpdate, onDelete, darkMode = false }: VariableExpensesViewProps) {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const [isOpen, setIsOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<VariableExpense | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    date: "",
    description: "",
    category: "",
    amount: "",
  })

  // Dynamic categories
  const categories = data.categories?.variable?.length ? data.categories.variable : DEFAULT_VARIABLE_CATEGORIES

  // First, filter by selected month
  const monthExpenses = useMemo(() => {
    return (data.variableExpenses || []).filter((exp) => {
      if (!exp.date) return false
      const d = new Date(exp.date)
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
    })
  }, [data.variableExpenses, selectedMonth, selectedYear])

  // Then apply category and search filters
  const filteredExpenses = useMemo(() => {
    return monthExpenses.filter((exp) => {
      const matchesCategory = categoryFilter === "all" || exp.category === categoryFilter
      const matchesSearch = (exp.description || "").toLowerCase().includes(searchTerm.toLowerCase())
      return matchesCategory && matchesSearch
    }).sort((a, b) => {
      if (a.date > b.date) return -1
      if (a.date < b.date) return 1
      return 0
    })
  }, [monthExpenses, categoryFilter, searchTerm])

  const totalVariable = useMemo(() =>
    filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
    [filteredExpenses]
  )

  // Daily expenses chart for selected month
  const dailyExpenses = useMemo(() => {
    const grouped: Record<string, number> = {}
    monthExpenses.forEach((exp) => {
      if (!exp.date) return
      const day = exp.date.split("-")[2]
      grouped[day] = (grouped[day] || 0) + exp.amount
    })
    return Object.entries(grouped)
      .map(([day, value]) => ({ day: `Dia ${Number.parseInt(day)}`, value }))
      .sort((a, b) => Number.parseInt(a.day.replace("Dia ", "")) - Number.parseInt(b.day.replace("Dia ", "")))
  }, [monthExpenses])

  // Category breakdown for selected month
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    monthExpenses.forEach((exp) => {
      totals[exp.category] = (totals[exp.category] || 0) + exp.amount
    })
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [monthExpenses])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingExpense) {
      onUpdate({
        ...editingExpense,
        date: formData.date,
        description: formData.description,
        category: formData.category,
        amount: Number.parseFloat(formData.amount),
      })
    } else {
      onAdd({
        date: formData.date,
        description: formData.description,
        category: formData.category,
        amount: Number.parseFloat(formData.amount),
      })
    }
    resetForm()
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este gasto?")) {
      onDelete(id)
    }
  }

  const handleEdit = (expense: VariableExpense) => {
    setEditingExpense(expense)
    setFormData({
      date: expense.date,
      description: expense.description,
      category: expense.category,
      amount: expense.amount.toString(),
    })
    setIsOpen(true)
  }

  const resetForm = () => {
    setFormData({ date: "", description: "", category: "", amount: "" })
    setEditingExpense(null)
    setIsOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">Gastos Variados</h2>
          <p className="text-muted-foreground">Registre e acompanhe seus gastos do dia a dia</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Gasto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Editar Gasto" : "Adicionar Gasto"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input id="description" placeholder="Ex: Supermercado, Restaurante..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value: string) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input id="amount" type="number" step="0.01" placeholder="0,00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit">{editingExpense ? "Salvar" : "Adicionar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI + Controls lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* KPI Card - esquerda */}
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-6 h-full flex items-center">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-destructive/20 flex items-center justify-center">
                <ShoppingCart className="h-7 w-7 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Gastos Variados</p>
                <p className="text-3xl font-bold text-destructive">{formatCurrency(totalVariable)}</p>
                <p className="text-xs text-muted-foreground mt-1">{filteredExpenses.length} lançamento{filteredExpenses.length !== 1 ? 's' : ''} no mês</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls Card - direita */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              {/* Linha 1: seletor de mês */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <MonthSelector
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  onMonthChange={(m, y) => { setSelectedMonth(m); setSelectedYear(y) }}
                />
              </div>

              {/* Linha 2: busca + filtro de categoria */}
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
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Lista de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto max-h-96 overflow-y-auto">
              {/* Desktop Table */}
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense, index) => (
                    <TableRow key={`variable-table-${expense.id}-${index}`}>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                          {expense.category}
                        </span>
                      </TableCell>
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

              {/* Mobile Card List */}
              <div className="md:hidden divide-y divide-border">
                {filteredExpenses.map((expense, index) => (
                  <div key={`variable-mobile-${expense.id}-${index}`} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-semibold text-card-foreground leading-none">{expense.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                            {expense.category}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{formatDate(expense.date)}</span>
                        </div>
                      </div>
                      <p className="font-bold text-destructive">{formatCurrency(expense.amount)}</p>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
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
                  <p>Nenhum gasto registrado para este mês</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Distribution by Category */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-87.5">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryTotals.map((entry, index) => (
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

            {/* Modern Legend */}
            <div className="mt-4 space-y-2">
              {categoryTotals.map((category, index) => (
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
