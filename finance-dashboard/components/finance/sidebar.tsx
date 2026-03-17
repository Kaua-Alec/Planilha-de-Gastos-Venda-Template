"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Wallet,
  Home,
  ShoppingCart,
  CreditCard,
  Target,
  PiggyBank,
  BarChart3,
  Menu,
  X,
  Moon,
  Sun,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export type TabType = "dashboard" | "income" | "fixed" | "variable" | "creditcard" | "goals" | "savings" | "reports" | "settings"

interface SidebarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
}

const menuItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: "income", label: "Renda Mensal", icon: <Wallet className="h-5 w-5" /> },
  { id: "fixed", label: "Gastos Fixos", icon: <Home className="h-5 w-5" /> },
  { id: "variable", label: "Gastos Variados", icon: <ShoppingCart className="h-5 w-5" /> },
  { id: "creditcard", label: "Cartão de Crédito", icon: <CreditCard className="h-5 w-5" /> },
  { id: "goals", label: "Metas", icon: <Target className="h-5 w-5" /> },
  { id: "savings", label: "Economias", icon: <PiggyBank className="h-5 w-5" /> },
  { id: "reports", label: "Relatórios", icon: <BarChart3 className="h-5 w-5" /> },
  { id: "settings", label: "Configurações", icon: <Settings className="h-5 w-5" /> },
]

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen, darkMode, setDarkMode }: SidebarProps) {
  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-sidebar text-sidebar-foreground"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Wallet className="h-6 w-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Controle</h1>
              <p className="text-xs text-sidebar-foreground/60">Financeiro</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id)
                setIsOpen(false)
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                activeTab === item.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Theme toggle */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {darkMode ? "Modo Claro" : "Modo Escuro"}
          </Button>
        </div>
      </aside>
    </>
  )
}
