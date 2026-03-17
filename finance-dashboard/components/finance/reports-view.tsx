"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  type FinanceData,
  calculateTotalIncome,
  calculateTotalFixedExpenses,
  calculateTotalVariableExpenses,
  calculateTotalCreditCardExpenses,
  calculateBalance,
  formatCurrency,
  exportToCSV,
} from "@/lib/finance-store"
import { BarChart3, Download, TrendingUp, FileText, CreditCard, FileDown, FileSpreadsheet } from "lucide-react"
import { exportToPDF } from "@/lib/export-pdf"
import { exportToXLSX } from "@/lib/export-xlsx"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts"

interface ReportsViewProps {
  data: FinanceData
  darkMode?: boolean
}

export function ReportsView({ data, darkMode = false }: ReportsViewProps) {
  const [period, setPeriod] = useState("monthly")

  // Calculate last 6 months of data dynamically
  const today = useMemo(() => new Date(), [])
  const monthlyData = useMemo(() => {
    const points = []
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const m = d.getMonth()
      const y = d.getFullYear()
      
      const income = calculateTotalIncome(data.incomes, m, y)
      const fixed = calculateTotalFixedExpenses(data.fixedExpenses, m, y)
      const variable = calculateTotalVariableExpenses(data.variableExpenses, m, y)
      const cc = calculateTotalCreditCardExpenses(data.creditCardExpenses, m, y)
      const totalExpenses = fixed + variable + cc
      const balanceValue = income - totalExpenses
      
      points.push({
        month: d.toLocaleDateString('pt-BR', { month: 'short' }),
        renda: income,
        gastos: totalExpenses,
        economia: balanceValue,
        rawDate: d
      })
    }
    return points
  }, [data, today])

  const currentSummary = monthlyData[monthlyData.length - 1]
  const totalIncome = currentSummary.renda
  const totalFixed = calculateTotalFixedExpenses(data.fixedExpenses, today.getMonth(), today.getFullYear()) 
  const totalVariable = calculateTotalVariableExpenses(data.variableExpenses, today.getMonth(), today.getFullYear())
  const totalCreditCard = calculateTotalCreditCardExpenses(data.creditCardExpenses, today.getMonth(), today.getFullYear())
  const balance = currentSummary.economia

  // Projection for next 6 months (based on averages)
  const projectionData = useMemo(() => {
    const avgIncome = monthlyData.reduce((acc, p) => acc + p.renda, 0) / monthlyData.length
    const avgExpenses = monthlyData.reduce((acc, p) => acc + p.gastos, 0) / monthlyData.length
    
    const months = ["Prox 1", "Prox 2", "Prox 3", "Prox 4", "Prox 5", "Prox 6"]
    return months.map((month, i) => ({
      month,
      renda: avgIncome * (1 + 0.01 * (i + 1)),
      gastos: avgExpenses * (1 + 0.005 * (i + 1)),
      economia: (avgIncome * (1 + 0.01 * (i + 1))) - (avgExpenses * (1 + 0.005 * (i + 1)))
    }))
  }, [monthlyData])

  const handleExportCSV = () => {
    const csv = exportToCSV(data)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `financeiro_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    exportToPDF(data)
  }

  const handleExportXLSX = () => {
    exportToXLSX(data)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">Relatórios Analíticos</h2>
          <p className="text-muted-foreground">Análises detalhadas das suas finanças</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="quarterly">Trimestral</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2 bg-transparent text-accent border-accent hover:bg-accent/10 h-9" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent text-primary border-primary hover:bg-primary/10 h-9" onClick={handleExportPDF}>
            <FileDown className="h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent text-emerald-500 border-emerald-500 hover:bg-emerald-500/10 h-9" onClick={handleExportXLSX}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Renda</p>
                <p className="text-xl font-bold text-accent">{formatCurrency(totalIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Gastos Fixos</p>
              <p className="text-xl font-bold text-destructive">{formatCurrency(totalFixed)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Gastos Variáveis</p>
              <p className="text-xl font-bold text-warning">{formatCurrency(totalVariable)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Cartão</p>
                <p className="text-xl font-bold text-purple-500">{formatCurrency(totalCreditCard)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Economia</p>
              <p className={`text-xl font-bold ${balance >= 0 ? "text-primary" : "text-destructive"}`}>
                {formatCurrency(balance)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <BarChart3 className="h-5 w-5 text-primary" />
              Renda vs Gastos (Últimos 6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-75">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `R$${v / 1000}k`} />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-2 shadow-lg">
                            <p className="text-[#f3f4f6] text-sm font-medium mb-1">
                              {payload[0].payload.month}
                            </p>
                            <div className="space-y-1">
                              {payload.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                  <span className="text-[#9ca3af] text-xs">{item.name}:</span>
                                  <span className="font-bold text-sm" style={{ color: item.color }}>
                                    {formatCurrency(item.value as number)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend />
                  <Bar dataKey="renda" name="Renda" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gastos" name="Gastos" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Savings Area Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <TrendingUp className="h-5 w-5 text-accent" />
              Economia Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-75">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `R$${v}`} />
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
                  <Area
                    type="monotone"
                    dataKey="economia"
                    stroke="var(--primary)"
                    fill="var(--primary)"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projection Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <FileText className="h-5 w-5 text-warning" />
            Projeção para os Próximos 6 Meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-87.5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-2 shadow-lg">
                          <p className="text-[#f3f4f6] text-sm font-medium mb-1">
                            {payload[0].payload.month}
                          </p>
                          <div className="space-y-1">
                            {payload.map((item, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-[#9ca3af] text-xs">{item.name}:</span>
                                <span className="font-bold text-sm" style={{ color: item.color }}>
                                  {formatCurrency(item.value as number)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="renda"
                  name="Renda Projetada"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "var(--accent)" }}
                />
                <Line
                  type="monotone"
                  dataKey="gastos"
                  name="Gastos Projetados"
                  stroke="var(--destructive)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "var(--destructive)" }}
                />
                <Line
                  type="monotone"
                  dataKey="economia"
                  name="Economia Projetada"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "var(--primary)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-muted-foreground text-center mt-4">
            * Projeção baseada nas médias atuais com ajustes de inflação estimados
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
