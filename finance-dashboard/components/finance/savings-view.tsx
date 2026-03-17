"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { type FinanceData, type Goal, calculateBalance, formatCurrency } from "@/lib/finance-store"
import { PiggyBank, Shield, TrendingUp, Sparkles, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pencil, Plus, Minus } from "lucide-react"

interface SavingsViewProps {
  data: FinanceData
  darkMode?: boolean
  onUpdateEmergencyReserve?: (amount: number) => Promise<void>
  onUpdateGoal?: (goal: Goal) => Promise<void>
}

export function SavingsView({
  data,
  darkMode = false,
  onUpdateEmergencyReserve,
  onUpdateGoal
}: SavingsViewProps) {
  const [initialAmount, setInitialAmount] = useState("1000")
  const [monthlyDeposit, setMonthlyDeposit] = useState("500")
  const [interestRate, setInterestRate] = useState("12")
  const [years, setYears] = useState("5")
  const [selectedGoalId, setSelectedGoalId] = useState<string>("")
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false)
  const [adjustmentAmount, setAdjustmentAmount] = useState("")
  const [adjustmentType, setAdjustmentType] = useState<"deposit" | "withdraw">("deposit")

  const balance = calculateBalance(data)
  const emergencyReserve = data.emergencyReserve

  // Suggested distribution
  const availableToSave = Math.max(0, balance)
  const distribution = {
    emergency: availableToSave * 0.5,
    investments: availableToSave * 0.3,
    leisure: availableToSave * 0.2,
  }

  // Compound interest calculator
  const calculateCompoundInterest = () => {
    const P = Number.parseFloat(initialAmount) || 0
    const PMT = Number.parseFloat(monthlyDeposit) || 0
    const r = (Number.parseFloat(interestRate) || 0) / 100 / 12
    const n = (Number.parseFloat(years) || 0) * 12

    if (r === 0) {
      return P + PMT * n
    }

    const futureValue = P * Math.pow(1 + r, n) + PMT * ((Math.pow(1 + r, n) - 1) / r)
    return futureValue
  }

  const futureValue = calculateCompoundInterest()
  const totalInvested =
    (Number.parseFloat(initialAmount) || 0) +
    (Number.parseFloat(monthlyDeposit) || 0) * (Number.parseFloat(years) || 0) * 12
  const interestEarned = futureValue - totalInvested

  // Emergency reserve progress
  const variableExpensesLength = data.variableExpenses.length || 1
  const idealEmergencyReserve =
    (data.fixedExpenses.reduce((sum, e) => sum + e.amount, 0) +
      (data.variableExpenses.reduce((sum, e) => sum + e.amount, 0) / variableExpensesLength) * 30) *
    6
  const emergencyProgress = Math.min(100, (emergencyReserve / idealEmergencyReserve) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-card-foreground">Dinheiro para Guardar</h2>
        <p className="text-muted-foreground">Planeje sua economia e investimentos</p>
      </div>

      {/* Main Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-accent/10 border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                <PiggyBank className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Disponível para Guardar</p>
                <p className="text-2xl font-bold text-accent">{formatCurrency(availableToSave)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reserva de Emergência</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(emergencyReserve)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border col-span-1 sm:col-span-2">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">Meta Reserva de Emergência (6 meses)</p>
                <p className="text-sm font-medium">{emergencyProgress.toFixed(0)}%</p>
              </div>
              <Progress value={emergencyProgress} className="h-3" />
              <p className="text-xs text-muted-foreground">
                Meta ideal: {formatCurrency(idealEmergencyReserve)} (6 meses de gastos)
              </p>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-2"
                  onClick={() => {
                    setAdjustmentAmount("")
                    setAdjustmentType("withdraw")
                    setIsReserveDialogOpen(true)
                  }}
                >
                  <Pencil className="h-3 w-3" />
                  Ajustar Saldo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adjustment Emergency Reserve Dialog */}
      <Dialog open={isReserveDialogOpen} onOpenChange={setIsReserveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar Reserva de Emergência</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Tabs value={adjustmentType} onValueChange={(v) => setAdjustmentType(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="deposit" className="gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  Depositar
                </TabsTrigger>
                <TabsTrigger value="withdraw" className="gap-2">
                  <Minus className="h-3.5 w-3.5" />
                  Retirar
                </TabsTrigger>
              </TabsList>

              <div className="space-y-2 mt-4">
                <Label htmlFor="adjustment-amount">
                  {adjustmentType === "deposit" ? "Quanto deseja adicionar?" : "Quanto foi retirado?"}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input
                    id="adjustment-amount"
                    className="pl-9"
                    type="text"
                    value={adjustmentAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(",", ".")
                      if (!isNaN(Number(val)) || val === "") {
                        setAdjustmentAmount(e.target.value)
                      }
                    }}
                    placeholder="0,00"
                    autoFocus
                  />
                </div>
              </div>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReserveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className={adjustmentType === "withdraw" ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}
              onClick={async () => {
                const amount = parseFloat(adjustmentAmount.replace(",", ".")) || 0
                if (amount <= 0) return

                const currentReserve = data.emergencyReserve
                const newAmount = adjustmentType === "deposit"
                  ? currentReserve + amount
                  : Math.max(0, currentReserve - amount)

                await onUpdateEmergencyReserve?.(newAmount)
                setIsReserveDialogOpen(false)
                setAdjustmentAmount("")
              }}
            >
              {adjustmentType === "deposit" ? "Confirmar Depósito" : "Confirmar Retirada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Distribution Suggestion */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Sparkles className="h-5 w-5 text-[#f59e0b]" />
            Sugestão de Distribuição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-medium text-card-foreground">Reserva de Emergência</span>
                </div>
                <p className="text-2xl font-bold text-primary">{formatCurrency(distribution.emergency)}</p>
                <p className="text-sm text-muted-foreground mt-1">50% do disponível</p>
              </div>
              <Button
                onClick={() => onUpdateEmergencyReserve?.(data.emergencyReserve + distribution.emergency)}
                className="w-full mt-4 bg-primary/20 hover:bg-primary/30 text-primary border-primary/30"
                variant="outline"
                disabled={distribution.emergency <= 0}
              >
                Aplicar na Reserva
              </Button>
            </div>

            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  <span className="font-medium text-card-foreground">Investimentos</span>
                </div>
                <p className="text-2xl font-bold text-accent">{formatCurrency(distribution.investments)}</p>
                <p className="text-sm text-muted-foreground mt-1">30% do disponível</p>

                {data.goals.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-xs text-muted-foreground">Adicionar à meta:</Label>
                    <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                      <SelectTrigger className="h-8 text-xs bg-background/50 border-accent/30">
                        <SelectValue placeholder="Selecione uma meta" />
                      </SelectTrigger>
                      <SelectContent>
                        {data.goals.map(goal => (
                          <SelectItem key={goal.id} value={goal.id}>{goal.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <Button
                onClick={() => {
                  const goal = data.goals.find(g => g.id === selectedGoalId)
                  if (goal) {
                    onUpdateGoal?.({
                      ...goal,
                      currentAmount: (goal.currentAmount || 0) + distribution.investments
                    })
                  }
                }}
                className="w-full mt-4 bg-accent/20 hover:bg-accent/30 text-accent border-accent/30"
                variant="outline"
                disabled={distribution.investments <= 0 || !selectedGoalId}
              >
                Aplicar na Meta
              </Button>
            </div>

            <div className="p-4 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="h-5 w-5 text-[#f59e0b]" />
                  <span className="font-medium text-card-foreground">Lazer/Extras</span>
                </div>
                <p className="text-2xl font-bold text-[#f59e0b]">{formatCurrency(distribution.leisure)}</p>
                <p className="text-sm text-muted-foreground mt-1">20% do disponível</p>
              </div>
              <Button
                className="w-full mt-4 bg-[#f59e0b]/20 hover:bg-[#f59e0b]/30 text-[#f59e0b] border-[#f59e0b]/30 cursor-not-allowed"
                variant="outline"
                disabled
              >
                Uso Recomendado
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compound Interest Calculator */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Calculator className="h-5 w-5 text-primary" />
            Simulador de Juros Compostos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="initial">Valor Inicial (R$)</Label>
                <Input
                  id="initial"
                  type="number"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly">Aporte Mensal (R$)</Label>
                <Input
                  id="monthly"
                  type="number"
                  value={monthlyDeposit}
                  onChange={(e) => setMonthlyDeposit(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Taxa de Juros Anual (%)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years">Período (anos)</Label>
                <Input id="years" type="number" value={years} onChange={(e) => setYears(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="p-6 rounded-lg bg-accent/10 border border-accent/20 text-center">
                <p className="text-sm text-muted-foreground mb-2">Valor Futuro Estimado</p>
                <p className="text-4xl font-bold text-accent">{formatCurrency(futureValue)}</p>
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Investido</p>
                    <p className="font-medium text-foreground">{formatCurrency(totalInvested)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Juros Ganhos</p>
                    <p className="font-medium text-accent">{formatCurrency(interestEarned)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
