"use client"

import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface MonthSelectorProps {
    selectedMonth: number // 0-11
    selectedYear: number
    onMonthChange: (month: number, year: number) => void
}

const MONTHS = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
]

export function MonthSelector({ selectedMonth, selectedYear, onMonthChange }: MonthSelectorProps) {
    const handlePrevious = () => {
        if (selectedMonth === 0) {
            onMonthChange(11, selectedYear - 1)
        } else {
            onMonthChange(selectedMonth - 1, selectedYear)
        }
    }

    const handleNext = () => {
        if (selectedMonth === 11) {
            onMonthChange(0, selectedYear + 1)
        } else {
            onMonthChange(selectedMonth + 1, selectedYear)
        }
    }

    const handleCurrent = () => {
        const now = new Date()
        onMonthChange(now.getMonth(), now.getFullYear())
    }

    const isCurrentMonth = () => {
        const now = new Date()
        return selectedMonth === now.getMonth() && selectedYear === now.getFullYear()
    }

    return (
        <Card className="bg-card border-border">
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePrevious}
                        className="h-9 w-9"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex-1 flex items-center justify-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div className="text-center">
                            <p className="text-lg font-semibold text-card-foreground">
                                {MONTHS[selectedMonth]} {selectedYear}
                            </p>
                        </div>
                    </div>

                    {!isCurrentMonth() && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCurrent}
                            className="hidden sm:flex"
                        >
                            Mês Atual
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNext}
                        className="h-9 w-9"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
