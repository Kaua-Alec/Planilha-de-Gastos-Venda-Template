"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  type FinanceData,
  calculateTotalIncome,
  calculateTotalFixedExpenses,
  calculateTotalVariableExpenses,
  calculateTotalCreditCardExpenses,
  calculateBalance,
  formatCurrency,
  calculateGoalProgress,
  calculateCreditCardExpensesForMonth,
  getInstallmentForMonth,
} from "@/lib/finance-store"
import { TrendingUp, TrendingDown, Wallet, Target, ArrowUpRight, ArrowDownRight, CreditCard } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"
import { MonthSelector } from "./month-selector"
import { PaymentNotifications } from "./payment-notifications"

interface DashboardViewProps {
  data: FinanceData
  onUpdateCreditCardExpense: (expense: any) => Promise<void>
  onUpdateFixedExpense: (expense: any) => Promise<void>
  darkMode?: boolean
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

export function DashboardView({
  data,
  onUpdateCreditCardExpense,
  onUpdateFixedExpense,
  darkMode = false
}: DashboardViewProps) {
  // Month selector state
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  // --- Monthly Calculations ---

  const monthlyIncome = useMemo(() => calculateTotalIncome(data.incomes, selectedMonth, selectedYear), [data.incomes, selectedMonth, selectedYear])
  const monthlyFixed = useMemo(() => calculateTotalFixedExpenses(data.fixedExpenses, selectedMonth, selectedYear), [data.fixedExpenses, selectedMonth, selectedYear])
  const monthlyVariable = useMemo(() => calculateTotalVariableExpenses(data.variableExpenses, selectedMonth, selectedYear), [data.variableExpenses, selectedMonth, selectedYear])
  const monthlyCreditCard = useMemo(() => calculateTotalCreditCardExpenses(data.creditCardExpenses, selectedMonth, selectedYear), [data.creditCardExpenses, selectedMonth, selectedYear])
  
  const monthlyTotalExpenses = monthlyFixed + monthlyVariable + monthlyCreditCard
  const monthlyBalance = monthlyIncome - monthlyTotalExpenses

  // 6. Savings Progress (based on monthly income)
  const savingsGoal = monthlyIncome * 0.2
  const savingsProgress = savingsGoal > 0 ? Math.min(100, (monthlyBalance / savingsGoal) * 100) : 0

  // --- Chart Data ---

  // Expense Distribution (Pie Chart)
  const expenseDistribution = [
    { name: "Fixos", value: monthlyFixed },
    { name: "Variáveis", value: monthlyVariable },
    { name: "Cartão", value: monthlyCreditCard },
  ].filter(item => item.value > 0)

  // Top Categories (Bar Chart) - for selected month
  const topCategories = useMemo(() => {
    const categoryTotals: Record<string, number> = {}

    // Add variable expenses
    data.variableExpenses.forEach((exp) => {
      const d = new Date(exp.date)
      if (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount
      }
    })

    // Add credit card expenses (categorized)
    data.creditCardExpenses.forEach((exp) => {
      const installment = getInstallmentForMonth(exp.date, selectedMonth, selectedYear)
      if (installment >= 1 && installment <= exp.installments && !exp.paid) {
        const amount = exp.totalAmount / exp.installments
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amount
      }
    })

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [data, selectedMonth, selectedYear])

  // History Data (Last 6 Months Evolution)
  const historyData = useMemo(() => {
    const dataPoints = []
    for (let i = 5; i >= 0; i--) {
      // Calculate date for this point (going back i months)
      let m = selectedMonth - i
      let y = selectedYear
      while (m < 0) {
        m += 12
        y -= 1
      }

      const monthLabel = new Date(y, m).toLocaleDateString('pt-BR', { month: 'short' })

      // We need to calculate totals for this specific historical month (m, y)
      // This duplicates logic but necessary for the chart
      // Optimization: Extract calculation logic if needed, but for now inline is fine

      // Use centralized calculations for historical data
      const inc = calculateTotalIncome(data.incomes, m, y)
      const fix = calculateTotalFixedExpenses(data.fixedExpenses, m, y)
      const vari = calculateTotalVariableExpenses(data.variableExpenses, m, y)
      const cc = calculateTotalCreditCardExpenses(data.creditCardExpenses, m, y)

      const bal = inc - (fix + vari + cc)

      dataPoints.push({
        month: monthLabel,
        saldo: bal,
        receita: inc,
        despesas: fix + vari + cc
      })
    }
    return dataPoints
  }, [data, selectedMonth, selectedYear])


  // Primary goal
  const primaryGoal = data.goals[0]

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <MonthSelector
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={(m, y) => {
          setSelectedMonth(m)
          setSelectedYear(y)
        }}
      />

      <PaymentNotifications
        creditCardExpenses={data.creditCardExpenses}
        creditCardLimits={data.creditCardLimits}
        fixedExpenses={data.fixedExpenses}
        goals={data.goals}
        onMarkAsPaid={onUpdateCreditCardExpense}
        onMarkFixedAsPaid={(expense) => onUpdateFixedExpense({ ...expense, paid: true })}
      />

      {/* Resumo Mensal Consolidado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-card border-border overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet className="h-24 w-24" />
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Saldo Líquido do Mês</p>
                <h3 className={`text-4xl font-bold tracking-tight ${monthlyBalance >= 0 ? "text-accent" : "text-destructive"}`}>
                  {formatCurrency(monthlyBalance)}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  {monthlyBalance >= 0 ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-accent" />
                      <span>Você está economizando este mês</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-destructive" />
                      <span>Gastos superaram a renda este mês</span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex-1 max-w-md w-full">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-medium text-card-foreground">Comprometimento da Renda</span>
                  <span className={`text-sm font-bold ${monthlyTotalExpenses > monthlyIncome ? "text-destructive" : "text-accent"}`}>
                    {monthlyIncome > 0 ? ((monthlyTotalExpenses / monthlyIncome) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <Progress
                  value={monthlyIncome > 0 ? (monthlyTotalExpenses / monthlyIncome) * 100 : 0}
                  className="h-3 bg-muted"
                  style={{
                    // @ts-ignore
                    '--progress-background': monthlyTotalExpenses > monthlyIncome ? '#ef4444' : '#10b981'
                  }}
                />
                <div className="flex justify-between mt-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Despesas: {formatCurrency(monthlyTotalExpenses)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Renda: {formatCurrency(monthlyIncome)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reserva de Emergência ou Quick Tip */}
        <Card className="bg-accent/5 border-accent/20 flex flex-col justify-center p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <p className="font-semibold text-accent">Dica Financeira</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {monthlyBalance > 0
              ? "Ótimo trabalho! Considere investir este saldo positivo em sua reserva de emergência ou metas de longo prazo."
              : "Atenção aos gastos! Revise suas despesas variáveis para tentar manter o saldo positivo até o fim do mês."}
          </p>
        </Card>
      </div>

      {/* KPI Cards Secundários */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border hover:border-accent/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
              <ArrowUpRight className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Renda Total</p>
              <p className="text-xl font-bold text-card-foreground">{formatCurrency(monthlyIncome)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-destructive/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
              <ArrowDownRight className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Despesas Fixas</p>
              <p className="text-xl font-bold text-card-foreground">{formatCurrency(monthlyFixed)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-destructive/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Variáveis</p>
              <p className="text-xl font-bold text-card-foreground">{formatCurrency(monthlyVariable)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-purple-500/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0">
              <CreditCard className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Cartão de Crédito</p>
              <p className="text-xl font-bold text-card-foreground">{formatCurrency(monthlyCreditCard)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Savings Goal Card */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Meta de Economia (20% da renda)</p>
              <p className="text-2xl font-bold text-primary">{savingsProgress.toFixed(0)}%</p>
              <Progress value={savingsProgress} className="mt-3 h-2" />
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center ml-4">
              <Target className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Evolution Line Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <TrendingUp className="h-5 w-5 text-primary" />
              Evolução do Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `R$${v / 1000}k`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-2 shadow-lg">
                            <p className="text-[#f3f4f6] text-sm font-medium mb-1">
                              {payload[0].payload.month}
                            </p>
                            <p className="text-lg font-bold" style={{ color: payload[0].color }}>
                              {formatCurrency(payload[0].value as number)}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="receita"
                    name="Renda"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="despesas"
                    name="Despesas"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    name="Saldo"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{ fill: "var(--primary)", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "var(--primary)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Distribution Pie Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <TrendingDown className="h-5 w-5 text-destructive" />
              Distribuição de Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h- [280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {expenseDistribution.map((entry, index) => (
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
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">Fixos: {formatCurrency(monthlyFixed)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-accent" />
                <span className="text-sm text-muted-foreground">Variáveis: {formatCurrency(monthlyVariable)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#8b5cf6" }} />
                <span className="text-sm text-muted-foreground">Cartão: {formatCurrency(monthlyCreditCard)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories Bar Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Top 5 Categorias de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-70">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCategories} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                  <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={12} width={80} />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-2 shadow-lg">
                            <p className="text-[#f3f4f6] text-sm font-medium mb-1">
                              {payload[0].payload.name}
                            </p>
                            <p className="text-lg font-bold" style={{ color: payload[0].fill || payload[0].color }}>
                              {formatCurrency(payload[0].value as number)}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Progresso das Metas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.goals.map((goal, index) => (
              <div key={`dashboard-goal-${goal.id}-${index}`} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-card-foreground">{goal.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                  </span>
                </div>
                <div className="relative">
                  <Progress value={calculateGoalProgress(goal)} className="h-3" />
                  <span className="absolute right-0 -top-6 text-xs font-medium text-primary">
                    {calculateGoalProgress(goal).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
