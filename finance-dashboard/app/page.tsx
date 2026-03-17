"use client"

import { useState, useEffect } from "react"
import { Sidebar, type TabType } from "@/components/finance/sidebar"
import { DashboardView } from "@/components/finance/dashboard-view"
import { IncomeView } from "@/components/finance/income-view"
import { FixedExpensesView } from "@/components/finance/fixed-expenses-view"
import { VariableExpensesView } from "@/components/finance/variable-expenses-view"
import { CreditCardView } from "@/components/finance/credit-card-view"
import { GoalsView } from "@/components/finance/goals-view"
import { SavingsView } from "@/components/finance/savings-view"
import { ReportsView } from "@/components/finance/reports-view"
import { SettingsView } from "@/components/finance/settings-view"
import { useFinanceData } from "@/hooks/use-finance-data"
import { Calendar } from "lucide-react"

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)

  const {
    data,
    loading,
    addIncome,
    updateIncome,
    deleteIncome,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    addVariableExpense,
    updateVariableExpense,
    deleteVariableExpense,
    addCreditCardExpense,
    updateCreditCardExpense,
    deleteCreditCardExpense,
    updateCreditCardLimit,
    addGoal,
    updateGoal,
    deleteGoal,
    updateEmergencyReserve,
    updateCategories
  } = useFinanceData()

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Carregando dados financeiros...</div>
      </div>
    )
  }

  // Se não tiver dados (e não estiver carregando), o hook já deve ter redirecionado ou user é null
  if (!data) return null

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}
            <div className="flex-1 lg:flex-none">
              <h1 className="text-lg lg:text-xl font-semibold text-foreground text-center lg:text-left">
                {activeTab === "dashboard" && "Dashboard Principal"}
                {activeTab === "income" && "Renda Mensal"}
                {activeTab === "fixed" && "Gastos Fixos"}
                {activeTab === "variable" && "Gastos Variados"}
                {activeTab === "creditcard" && "Cartão de Crédito"}
                {activeTab === "goals" && "Metas Financeiras"}
                {activeTab === "savings" && "Dinheiro para Guardar"}
                {activeTab === "reports" && "Relatórios"}
                {activeTab === "settings" && "Configurações"}
              </h1>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm capitalize">{today}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8">
          {activeTab === "dashboard" && (
            <DashboardView
              data={data}
              onUpdateCreditCardExpense={updateCreditCardExpense}
              onUpdateFixedExpense={updateFixedExpense}
              darkMode={darkMode}
            />
          )}
          {activeTab === "income" && (
            <IncomeView
              data={data}
              onAdd={addIncome}
              onUpdate={updateIncome}
              onDelete={deleteIncome}
              darkMode={darkMode}
            />
          )}
          {activeTab === "fixed" && (
            <FixedExpensesView
              data={data}
              onAdd={addFixedExpense}
              onUpdate={updateFixedExpense}
              onDelete={deleteFixedExpense}
              onUpdateCreditCardExpense={updateCreditCardExpense}
              darkMode={darkMode}
            />
          )}
          {activeTab === "variable" && (
            <VariableExpensesView
              data={data}
              onAdd={addVariableExpense}
              onUpdate={updateVariableExpense}
              onDelete={deleteVariableExpense}
              darkMode={darkMode}
            />
          )}
          {activeTab === "creditcard" && (
            <CreditCardView
              data={data}
              onAdd={addCreditCardExpense}
              onUpdate={updateCreditCardExpense}
              onDelete={deleteCreditCardExpense}
              updateCreditCardLimit={updateCreditCardLimit}
              onUpdateFixedExpense={updateFixedExpense}
              darkMode={darkMode}
            />
          )}
          {activeTab === "goals" && (
            <GoalsView
              data={data}
              onAdd={addGoal}
              onUpdate={updateGoal}
              onDelete={deleteGoal}
              onUpdateFixedExpense={updateFixedExpense}
              onUpdateCreditCardExpense={updateCreditCardExpense}
              darkMode={darkMode}
            />
          )}
          {activeTab === "savings" && (
            <SavingsView
              data={data}
              darkMode={darkMode}
              onUpdateEmergencyReserve={updateEmergencyReserve}
              onUpdateGoal={updateGoal}
            />
          )}
          {activeTab === "reports" && <ReportsView data={data} darkMode={darkMode} />}
          {activeTab === "settings" && (
            <SettingsView
              data={data}
              onUpdateCategories={updateCategories}
              onUpdateEmergencyReserve={updateEmergencyReserve}
              darkMode={darkMode}
            />
          )}
        </div>
      </main>
    </div>
  )
}
