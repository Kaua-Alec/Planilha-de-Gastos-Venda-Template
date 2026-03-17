import jsPDF from "jspdf"
import "jspdf-autotable"
import { type FinanceData, formatCurrency, formatDate } from "./finance-store"

// Extend jsPDF with autotable
declare module "jspdf" {
    interface jsPDF {
        autoTable: (options: any) => jsPDF
    }
}

export function exportToPDF(data: FinanceData) {
    const doc = new jsPDF()
    const now = new Date()
    const dateStr = formatDate(now.toISOString().split("T")[0])

    // Header
    doc.setFontSize(20)
    doc.setTextColor(40)
    doc.text("Relatório Financeiro Pessoal", 14, 22)

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Gerado em: ${dateStr}`, 14, 30)

    let finalY = 35

    // 1. Incomes Table
    if (data.incomes && data.incomes.length > 0) {
        doc.setFontSize(14)
        doc.setTextColor(0, 150, 0) // Greenish
        doc.text("Receitas (Rendas)", 14, finalY + 10)

        const incomeRows = data.incomes.map(i => [
            formatDate(i.date),
            i.source,
            i.recurring ? "Sim" : "Não",
            formatCurrency(i.amount)
        ])

        doc.autoTable({
            startY: finalY + 15,
            head: [["Data", "Fonte", "Recorrente", "Valor"]],
            body: incomeRows,
            theme: 'striped',
            headStyles: { fillStyle: 'fill', fillColor: [0, 150, 0] },
        })
        finalY = (doc as any).lastAutoTable.finalY
    }

    // 2. Fixed Expenses Table
    if (data.fixedExpenses && data.fixedExpenses.length > 0) {
        doc.setFontSize(14)
        doc.setTextColor(200, 0, 0) // Reddish
        doc.text("Gastos Fixos", 14, finalY + 15)

        const fixedRows = data.fixedExpenses.map(e => [
            e.category,
            formatCurrency(e.amount)
        ])

        doc.autoTable({
            startY: finalY + 20,
            head: [["Categoria", "Valor"]],
            body: fixedRows,
            theme: 'striped',
            headStyles: { fillStyle: 'fill', fillColor: [200, 0, 0] },
        })
        finalY = (doc as any).lastAutoTable.finalY
    }

    // 3. Variable Expenses Table
    if (data.variableExpenses && data.variableExpenses.length > 0) {
        doc.setFontSize(14)
        doc.setTextColor(255, 140, 0) // Orange
        doc.text("Gastos Variáveis", 14, finalY + 15)

        const variableRows = data.variableExpenses.map(e => [
            formatDate(e.date),
            e.description,
            e.category,
            formatCurrency(e.amount)
        ])

        doc.autoTable({
            startY: finalY + 20,
            head: [["Data", "Descrição", "Categoria", "Valor"]],
            body: variableRows,
            theme: 'striped',
            headStyles: { fillStyle: 'fill', fillColor: [255, 140, 0] },
        })
        finalY = (doc as any).lastAutoTable.finalY
    }

    // 4. Credit Card Table
    if (data.creditCardExpenses && data.creditCardExpenses.length > 0) {
        doc.setFontSize(14)
        doc.setTextColor(139, 92, 246) // Purple
        doc.text("Cartão de Crédito (Parcelas do Mês)", 14, finalY + 15)

        const ccRows = data.creditCardExpenses.map(e => {
            const installmentAmount = e.totalAmount / e.installments
            return [
                formatDate(e.date),
                e.description,
                e.bankName,
                `${e.currentInstallment}/${e.installments}`,
                formatCurrency(installmentAmount)
            ]
        })

        doc.autoTable({
            startY: finalY + 20,
            head: [["Data", "Descrição", "Banco", "Parcela", "Valor/Mês"]],
            body: ccRows,
            theme: 'striped',
            headStyles: { fillStyle: 'fill', fillColor: [139, 92, 246] },
        })
        finalY = (doc as any).lastAutoTable.finalY
    }

    // Final Summary
    const income = data.incomes.reduce((sum, i) => sum + i.amount, 0)
    const fixed = data.fixedExpenses.reduce((sum, e) => sum + e.amount, 0)
    const variable = data.variableExpenses.reduce((sum, e) => sum + e.amount, 0)
    const creditCard = data.creditCardExpenses.reduce((sum, e) => sum + (e.totalAmount / e.installments), 0)
    const balance = income - fixed - variable - creditCard

    doc.setFontSize(16)
    doc.setTextColor(40)
    doc.text("Resumo Final", 14, finalY + 25)

    doc.setFontSize(12)
    doc.text(`Total de Receitas: ${formatCurrency(income)}`, 14, finalY + 35)
    doc.text(`Total de Despesas: ${formatCurrency(fixed + variable + creditCard)}`, 14, finalY + 42)

    doc.setFontSize(14)
    if (balance >= 0) {
        doc.setTextColor(0, 150, 0)
        doc.text(`Saldo Positivo: ${formatCurrency(balance)}`, 14, finalY + 52)
    } else {
        doc.setTextColor(200, 0, 0)
        doc.text(`Saldo Negativo: ${formatCurrency(balance)}`, 14, finalY + 52)
    }

    // Save the PDF
    doc.save(`relatorio_financeiro_${now.toISOString().split("T")[0]}.pdf`)
}
