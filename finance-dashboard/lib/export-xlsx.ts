import * as XLSX from "xlsx"
import { type FinanceData, formatCurrency, formatDate } from "./finance-store"

export function exportToXLSX(data: FinanceData) {
    const wb = XLSX.utils.book_new()
    const now = new Date()
    const dateStr = now.toISOString().split("T")[0]

    // 1. Incomes Sheet
    const incomeData = data.incomes.map((i) => ({
        Data: formatDate(i.date),
        Fonte: i.source,
        Recorrente: i.recurring ? "Sim" : "Não",
        Valor: i.amount,
    }))
    const wsIncome = XLSX.utils.json_to_sheet(incomeData)
    XLSX.utils.book_append_sheet(wb, wsIncome, "Receitas")

    // 2. Fixed Expenses Sheet
    const fixedData = data.fixedExpenses.map((e) => ({
        Categoria: e.category,
        Valor: e.amount,
    }))
    const wsFixed = XLSX.utils.json_to_sheet(fixedData)
    XLSX.utils.book_append_sheet(wb, wsFixed, "Gastos Fixos")

    // 3. Variable Expenses Sheet
    const variableData = data.variableExpenses.map((e) => ({
        Data: formatDate(e.date),
        Descrição: e.description,
        Categoria: e.category,
        Valor: e.amount,
    }))
    const wsVariable = XLSX.utils.json_to_sheet(variableData)
    XLSX.utils.book_append_sheet(wb, wsVariable, "Gastos Variáveis")

    // 4. Credit Card Sheet
    const ccData = data.creditCardExpenses.map((e) => ({
        Data: formatDate(e.date),
        Descrição: e.description,
        Banco: e.bankName,
        Parcela: `${e.currentInstallment}/${e.installments}`,
        "Valor Parcela": e.totalAmount / e.installments,
    }))
    const wsCC = XLSX.utils.json_to_sheet(ccData)
    XLSX.utils.book_append_sheet(wb, wsCC, "Cartão de Crédito")

    // 5. Summary Sheet
    const totalIncome = data.incomes.reduce((sum, i) => sum + i.amount, 0)
    const totalFixed = data.fixedExpenses.reduce((sum, e) => sum + e.amount, 0)
    const totalVariable = data.variableExpenses.reduce((sum, e) => sum + e.amount, 0)
    const totalCreditCard = data.creditCardExpenses.reduce((sum, e) => sum + e.totalAmount / e.installments, 0)
    const balance = totalIncome - totalFixed - totalVariable - totalCreditCard

    const summaryData = [
        { Descrição: "Total de Receitas", Valor: totalIncome },
        { Descrição: "Total de Gastos Fixos", Valor: totalFixed },
        { Descrição: "Total de Gastos Variáveis", Valor: totalVariable },
        { Descrição: "Total de Cartão de Crédito", Valor: totalCreditCard },
        { Descrição: "Saldo Final", Valor: balance },
    ]
    const wsSummary = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo Geral")

    // Trigger download
    XLSX.writeFile(wb, `relatorio_financeiro_${dateStr}.xlsx`)
}
