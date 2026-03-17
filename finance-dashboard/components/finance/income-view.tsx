"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import {
  type FinanceData,
  type Income,
  formatCurrency,
  formatDate,
  generateId,
} from "@/lib/finance-store"
import { Plus, Pencil, Trash2, Wallet, Filter } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { MonthSelector } from "./month-selector"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

interface IncomeViewProps {
  data: FinanceData
  onAdd: (income: Omit<Income, "id">) => Promise<void>
  onUpdate: (income: Income) => Promise<void>
  onDelete: (id: string) => Promise<void>
  darkMode?: boolean
}

export function IncomeView({ data, onAdd, onUpdate, onDelete, darkMode = false }: IncomeViewProps) {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const [isOpen, setIsOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    date: "",
    source: "",
    amount: "",
    recurring: false,
  })

  // Filter incomes for the selected month:
  // recurring incomes always count; one-time incomes only count if they match the selected month
  const filteredIncomes = useMemo(() => {
    return (data.incomes || []).filter((income) => {
      if (income.recurring) return true
      const d = new Date(income.date)
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
    })
  }, [data.incomes, selectedMonth, selectedYear])

  // Incomes shown in the table (only from selected month, recurring flagged), filtered by search
  const tableIncomes = useMemo(() => {
    return (data.incomes || []).filter((income) => {
      const d = new Date(income.date)
      const matchesMonth = income.recurring || (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear)
      const matchesSearch = (income.source || "").toLowerCase().includes(searchTerm.toLowerCase())
      return matchesMonth && matchesSearch
    }).sort((a, b) => {
      if (a.date > b.date) return -1
      if (a.date < b.date) return 1
      return 0
    })
  }, [data.incomes, selectedMonth, selectedYear, searchTerm])

  const totalIncome = useMemo(() =>
    filteredIncomes.reduce((sum, i) => sum + i.amount, 0),
    [filteredIncomes]
  )

  // Group by source for pie chart (selected month)
  const incomeBySource = useMemo(() => {
    return filteredIncomes.reduce(
      (acc, income) => {
        acc[income.source] = (acc[income.source] || 0) + income.amount
        return acc
      },
      {} as Record<string, number>,
    )
  }, [filteredIncomes])

  const pieData = Object.entries(incomeBySource).map(([name, value]) => ({
    name,
    value,
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingIncome) {
      onUpdate({
        ...editingIncome,
        date: formData.date,
        source: formData.source,
        amount: Number.parseFloat(formData.amount),
        recurring: formData.recurring,
      })
    } else {
      onAdd({
        date: formData.date,
        source: formData.source,
        amount: Number.parseFloat(formData.amount),
        recurring: formData.recurring,
      })
    }
    resetForm()
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta renda?")) {
      onDelete(id)
    }
  }

  const handleEdit = (income: Income) => {
    setEditingIncome(income)
    setFormData({
      date: income.date,
      source: income.source,
      amount: income.amount.toString(),
      recurring: income.recurring,
    })
    setIsOpen(true)
  }

  const resetForm = () => {
    setFormData({ date: "", source: "", amount: "", recurring: false })
    setEditingIncome(null)
    setIsOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">Renda Mensal</h2>
          <p className="text-muted-foreground">Gerencie suas fontes de renda</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Renda
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingIncome ? "Editar Renda" : "Adicionar Renda"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Fonte</Label>
                <Input id="source" placeholder="Ex: Salário, Freelance..." value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input id="amount" type="number" step="0.01" placeholder="0,00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="recurring">Recorrente</Label>
                <Switch id="recurring" checked={formData.recurring} onCheckedChange={(checked: boolean) => setFormData({ ...formData, recurring: checked })} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit">{editingIncome ? "Salvar" : "Adicionar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI + Controls lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* KPI Card - esquerda */}
        <Card className="bg-accent/10 border-accent/20">
          <CardContent className="p-6 h-full flex items-center">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-accent/20 flex items-center justify-center">
                <Wallet className="h-7 w-7 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Renda Total do Mês</p>
                <p className="text-3xl font-bold text-accent">{formatCurrency(totalIncome)}</p>
                {filteredIncomes.some(i => i.recurring) && (
                  <p className="text-xs text-muted-foreground mt-1">Inclui rendas recorrentes</p>
                )}
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

              {/* Linha 2: busca */}
              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por fonte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Fontes de Renda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              {/* Desktop Table */}
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Recorrente</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableIncomes.map((income, index) => (
                    <TableRow key={`income-table-${income.id}-${index}`}>
                      <TableCell>{formatDate(income.date)}</TableCell>
                      <TableCell className="font-medium">{income.source}</TableCell>
                      <TableCell className="text-right text-accent font-medium">
                        {formatCurrency(income.amount)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${income.recurring ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}
                        >
                          {income.recurring ? "Sim" : "Não"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(income)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(income.id)}>
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
                {tableIncomes.map((income, index) => (
                  <div key={`income-mobile-${income.id}-${index}`} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-semibold text-card-foreground leading-none">{income.source}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${income.recurring ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
                            {income.recurring ? "Recorrente" : "Única"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{formatDate(income.date)}</span>
                        </div>
                      </div>
                      <p className="font-bold text-accent">{formatCurrency(income.amount)}</p>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => handleEdit(income)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 gap-1 text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleDelete(income.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {tableIncomes.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  <p>Nenhuma renda registrada para este mês</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Distribution by Source */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Distribuição por Fonte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-87.5">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
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
              {pieData.map((source, index) => (
                <div key={source.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-muted-foreground">{source.name}</span>
                  </div>
                  <span className="font-medium text-card-foreground">{formatCurrency(source.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div >
  )
}
