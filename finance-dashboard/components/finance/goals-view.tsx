"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  type FinanceData,
  type Goal,
  formatCurrency,
  formatDate,
  generateId,
  calculateGoalProgress,
} from "@/lib/finance-store"
import { Plus, Pencil, Trash2, Target, Calculator, TrendingUp, AlertCircle, MoreVertical, Archive, CalendarDays, BarChart, CheckCircle2, RotateCcw } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { PaymentNotifications } from "./payment-notifications"

interface GoalsViewProps {
  data: FinanceData
  onAdd: (goal: Omit<Goal, "id">) => Promise<void>
  onUpdate: (goal: Goal) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onUpdateFixedExpense: (expense: any) => Promise<void>
  onUpdateCreditCardExpense: (expense: any) => Promise<void>
  darkMode?: boolean
}

export function GoalsView({
  data,
  onAdd,
  onUpdate,
  onDelete,
  onUpdateFixedExpense,
  onUpdateCreditCardExpense,
  darkMode = false
}: GoalsViewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    deadline: "",
    status: 'active' as 'active' | 'completed' | 'archived'
  })
  const [overdueGoalId, setOverdueGoalId] = useState<string | null>(null)

  // Helper for numeric parsing (handles commas)
  const parseAmount = (val: string): number => {
    const sanitized = val.toString().replace(",", ".")
    const parsed = Number.parseFloat(sanitized)
    return isNaN(parsed) ? 0 : parsed
  }

  // Statistics with safety checks
  const totalTarget = data.goals.reduce((sum, g) => sum + (Number(g.targetAmount) || 0), 0)
  const totalCurrent = data.goals.reduce((sum, g) => sum + (Number(g.currentAmount) || 0), 0)
  const completedGoals = data.goals.filter((g) => (Number(g.currentAmount) || 0) >= (Number(g.targetAmount) || 0)).length

  // Pie chart data with safety checks
  const remainingValue = Math.max(0, totalTarget - totalCurrent)
  const pieData = [
    { name: "Alcançado", value: totalCurrent },
    { name: "Restante", value: remainingValue },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingGoal) {
      onUpdate({
        ...editingGoal,
        name: formData.name,
        targetAmount: parseAmount(formData.targetAmount),
        currentAmount: parseAmount(formData.currentAmount),
        deadline: formData.deadline,
        status: formData.status,
      })
    } else {
      onAdd({
        name: formData.name,
        targetAmount: parseAmount(formData.targetAmount),
        currentAmount: parseAmount(formData.currentAmount),
        deadline: formData.deadline,
        status: 'active'
      })
    }
    resetForm()
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta meta?")) {
      onDelete(id)
    }
  }

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setFormData({
      name: goal.name || "",
      targetAmount: (goal.targetAmount ?? 0).toString(),
      currentAmount: (goal.currentAmount ?? 0).toString(),
      deadline: goal.deadline || "",
      status: goal.status || 'active'
    })
    setIsOpen(true)
  }

  const handleDeposit = (goalId: string) => {
    const amount = parseAmount(depositAmount)
    if (amount <= 0) return

    const goal = data.goals.find((g) => g.id === goalId)
    if (goal) {
      onUpdate({ ...goal, currentAmount: (Number(goal.currentAmount) || 0) + amount })
    }
    setDepositGoalId(null)
    setDepositAmount("")
  }

  const resetForm = () => {
    setFormData({ name: "", targetAmount: "", currentAmount: "", deadline: "", status: 'active' })
    setEditingGoal(null)
    setIsOpen(false)
  }

  const calculateMonthlyNeeded = (goal: Goal): number => {
    const targetAmount = Number(goal.targetAmount) || 0
    const currentAmount = Number(goal.currentAmount) || 0
    const remaining = targetAmount - currentAmount
    if (remaining <= 0) return 0

    const deadlineStr = goal.deadline || new Date().toISOString().split("T")[0]
    const deadline = new Date(deadlineStr)
    const now = new Date()
    const monthsLeft = Math.max(
      1,
      (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth()),
    )

    return remaining / monthsLeft
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">Metas Financeiras</h2>
          <p className="text-muted-foreground">Acompanhe o progresso das suas metas</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGoal ? "Editar Meta" : "Adicionar Meta"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Meta</Label>
                <Input
                  id="name"
                  placeholder="Ex: Viagem, Carro, Reserva..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Valor Alvo (R$)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentAmount">Valor Atual (R$)</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Prazo</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">{editingGoal ? "Salvar" : "Adicionar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <PaymentNotifications
          creditCardExpenses={data.creditCardExpenses}
          creditCardLimits={data.creditCardLimits}
          fixedExpenses={data.fixedExpenses}
          goals={data.goals}
          showCCAlerts={false}
          showFixedAlerts={false}
          onMarkAsPaid={onUpdateCreditCardExpense}
          onMarkFixedAsPaid={onUpdateFixedExpense}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total das Metas</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalTarget)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Já Guardado</p>
              <p className="text-2xl font-bold text-accent">{formatCurrency(totalCurrent)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Metas Concluídas</p>
              <p className="text-2xl font-bold text-foreground">
                {completedGoals} de {data.goals.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals Cards with Tabs */}
        <div className="space-y-4">
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="active" className="gap-2">
                <Target className="h-4 w-4" />
                Ativas ({data.goals.filter(g => g.status !== 'archived').length})
              </TabsTrigger>
              <TabsTrigger value="archived" className="gap-2">
                <Archive className="h-4 w-4" />
                Arquivadas ({data.goals.filter(g => g.status === 'archived').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4 mt-0">
              {data.goals.filter(g => g.status !== 'archived').length === 0 ? (
                <Card className="bg-card border-border border-dashed">
                  <CardContent className="p-12 text-center text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Nenhuma meta ativa no momento.</p>
                    <p className="text-sm">Clique em "Nova Meta" para começar a planejar seu futuro.</p>
                  </CardContent>
                </Card>
              ) : (
                data.goals
                  .filter(g => g.status !== 'archived')
                  .map((goal, index) => {
                    const progress = calculateGoalProgress(goal)
                    const monthlyNeeded = calculateMonthlyNeeded(goal)
                    const isCompleted = progress >= 100
                    const today = new Date().toISOString().split('T')[0]
                    const isOverdue = !isCompleted && goal.deadline < today

                    return (
                      <Card key={goal.id || `goal-${index}`} className={`bg-card border-border ${isCompleted ? "border-accent" : ""} ${isOverdue ? "border-destructive/50" : ""}`}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg text-card-foreground">{goal.name}</h3>
                                {isOverdue && (
                                  <Badge variant="destructive" className="animate-pulse gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Prazo Excedido
                                  </Badge>
                                )}
                                {isCompleted && (
                                  <Badge variant="outline" className="text-accent border-accent gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Concluída
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">Prazo: {formatDate(goal.deadline)}</p>
                            </div>
                            <div className="flex gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(goal)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDelete(goal.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onUpdate({ ...goal, status: 'archived' })}>
                                    <Archive className="h-4 w-4 mr-2" />
                                    Arquivar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
                              </span>
                              <span className={`font-medium ${isCompleted ? "text-accent" : isOverdue ? "text-destructive" : "text-primary"}`}>
                                {progress.toFixed(0)}%
                              </span>
                            </div>
                            <Progress
                              value={progress}
                              className={`h-3 ${isOverdue ? "[&>div]:bg-destructive" : ""}`}
                            />

                            {isOverdue ? (
                              <div className="pt-2">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="w-full gap-2"
                                  onClick={() => setOverdueGoalId(goal.id)}
                                >
                                  <AlertCircle className="h-4 w-4" />
                                  Resolver Meta Vencida
                                </Button>
                              </div>
                            ) : !isCompleted ? (
                              <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calculator className="h-4 w-4" />
                                  <span>Economizar {formatCurrency(monthlyNeeded)}/mês</span>
                                </div>

                                {depositGoalId === goal.id ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="Valor"
                                      value={depositAmount}
                                      onChange={(e) => setDepositAmount(e.target.value)}
                                      className="w-24 h-8"
                                    />
                                    <Button size="sm" onClick={() => handleDeposit(goal.id)}>
                                      OK
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setDepositGoalId(null)}>
                                      ✕
                                    </Button>
                                  </div>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => setDepositGoalId(goal.id)}>
                                    <TrendingUp className="h-4 w-4 mr-1" />
                                    Depositar
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-2 bg-accent/10 rounded-lg">
                                <span className="text-accent font-medium">🎉 Meta Alcançada!</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
              )}
            </TabsContent>

            <TabsContent value="archived" className="space-y-4 mt-0">
              {data.goals.filter(g => g.status === 'archived').length === 0 ? (
                <Card className="bg-card border-border border-dashed">
                  <CardContent className="p-12 text-center text-muted-foreground">
                    <Archive className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Nenhuma meta arquivada.</p>
                  </CardContent>
                </Card>
              ) : (
                data.goals
                  .filter(g => g.status === 'archived')
                  .map((goal, index) => {
                    const progress = calculateGoalProgress(goal)
                    const isCompleted = progress >= 100

                    return (
                      <Card key={goal.id || `archived-${index}`} className="bg-card border-border opacity-70 hover:opacity-100 transition-opacity">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold text-lg text-card-foreground line-through decoration-muted-foreground">{goal.name}</h3>
                              <p className="text-sm text-muted-foreground text-xs italic">Meta Arquivada</p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 text-accent"
                                onClick={() => onUpdate({ ...goal, status: 'active' })}
                              >
                                <RotateCcw className="h-4 w-4" />
                                Restaurar
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(goal.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
                              </span>
                              <span className="font-medium">
                                {progress.toFixed(0)}%
                              </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Overdue Solution Dialog */}
        <Dialog open={!!overdueGoalId} onOpenChange={(open) => !open && setOverdueGoalId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Resolver Meta Vencida
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                O prazo da meta <strong>{data.goals.find(g => g.id === overdueGoalId)?.name}</strong> terminou e ela ainda não foi concluída. O que deseja fazer?
              </p>

              <div className="grid gap-3">
                <Button
                  variant="outline"
                  className="justify-start h-auto p-4 gap-4"
                  onClick={async () => {
                    const goal = data.goals.find(g => g.id === overdueGoalId)
                    if (goal) {
                      const newDeadline = new Date()
                      newDeadline.setMonth(newDeadline.getMonth() + 1)
                      await onUpdate({ ...goal, deadline: newDeadline.toISOString().split('T')[0] })
                    }
                    setOverdueGoalId(null)
                  }}
                >
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="font-semibold">Prorrogar Prazo</p>
                    <p className="text-xs text-muted-foreground">Estender o prazo por mais 1 mês.</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto p-4 gap-4"
                  onClick={async () => {
                    const goal = data.goals.find(g => g.id === overdueGoalId)
                    if (goal) {
                      await onUpdate({ ...goal, targetAmount: goal.currentAmount })
                    }
                    setOverdueGoalId(null)
                  }}
                >
                  <BarChart className="h-5 w-5 text-accent" />
                  <div className="text-left">
                    <p className="font-semibold">Ajustar Valor</p>
                    <p className="text-xs text-muted-foreground">Definir o valor alvo como o valor já guardado.</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto p-4 gap-4"
                  onClick={async () => {
                    const goal = data.goals.find(g => g.id === overdueGoalId)
                    if (goal) {
                      await onUpdate({ ...goal, status: 'archived' })
                    }
                    setOverdueGoalId(null)
                  }}
                >
                  <Archive className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-semibold">Arquivar Meta</p>
                    <p className="text-xs text-muted-foreground">Remover da visão ativa e guardar os registros.</p>
                  </div>
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOverdueGoalId(null)}>Resolver depois</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pie Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Status Geral das Metas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell key="achieved" fill="var(--accent)" />
                    <Cell key="remaining" fill="var(--muted)" />
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-2 shadow-lg">
                            <p className="text-[#f3f4f6] text-sm font-medium mb-1">
                              {payload[0].name}
                            </p>
                            <p
                              className="text-lg font-bold"
                              style={{
                                color: payload[0].name === "Restante" ? "#ffffff" : payload[0].payload.fill || payload[0].color,
                              }}
                            >
                              {formatCurrency(payload[0].value as number)}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4">
              <p className="text-2xl font-bold text-foreground">{((totalCurrent / totalTarget) * 100).toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground">do total já guardado</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
