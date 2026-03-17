"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Plus,
    Trash2,
    Save,
    RotateCcw,
    Settings as SettingsIcon,
    Tag,
    ShieldCheck,
} from "lucide-react"
import {
    type FinanceData,
    DEFAULT_FIXED_CATEGORIES,
    DEFAULT_VARIABLE_CATEGORIES
} from "@/lib/finance-store"
import { LICENSE } from "@/lib/license"


interface SettingsViewProps {
    data: FinanceData
    onUpdateCategories: (categories: { fixed: string[]; variable: string[] }) => Promise<void>
    onUpdateEmergencyReserve: (amount: number) => Promise<void>
    darkMode?: boolean
}

export function SettingsView({
    data,
    onUpdateCategories,
    onUpdateEmergencyReserve,
    darkMode = false
}: SettingsViewProps) {
    const [fixedCategories, setFixedCategories] = useState<string[]>(
        data.categories?.fixed?.length ? data.categories.fixed : DEFAULT_FIXED_CATEGORIES
    )
    const [variableCategories, setVariableCategories] = useState<string[]>(
        data.categories?.variable?.length ? data.categories.variable : DEFAULT_VARIABLE_CATEGORIES
    )
    const [newCategory, setNewCategory] = useState("")
    const [emergencyReserve, setEmergencyReserve] = useState(data.emergencyReserve.toString())
    const [isSaving, setIsSaving] = useState(false)

    const handleAddCategory = (type: 'fixed' | 'variable') => {
        if (!newCategory.trim()) return

        if (type === 'fixed') {
            if (!fixedCategories.includes(newCategory.trim())) {
                setFixedCategories([...fixedCategories, newCategory.trim()])
            }
        } else {
            if (!variableCategories.includes(newCategory.trim())) {
                setVariableCategories([...variableCategories, newCategory.trim()])
            }
        }
        setNewCategory("")
    }

    const handleRemoveCategory = (type: 'fixed' | 'variable', category: string) => {
        if (type === 'fixed') {
            setFixedCategories(fixedCategories.filter(c => c !== category))
        } else {
            setVariableCategories(variableCategories.filter(c => c !== category))
        }
    }

    const handleResetCategories = (type: 'fixed' | 'variable') => {
        if (confirm(`Tem certeza que deseja resetar as categorias ${type === 'fixed' ? 'fixas' : 'variáveis'} para o padrão?`)) {
            if (type === 'fixed') {
                setFixedCategories(DEFAULT_FIXED_CATEGORIES)
            } else {
                setVariableCategories(DEFAULT_VARIABLE_CATEGORIES)
            }
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await onUpdateCategories({
                fixed: fixedCategories,
                variable: variableCategories
            })
            await onUpdateEmergencyReserve(Number.parseFloat(emergencyReserve) || 0)
            alert("Configurações salvas com sucesso!")
        } catch (error) {
            alert("Erro ao salvar configurações.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-card-foreground">Configurações</h2>
                    <p className="text-muted-foreground">Personalize categorias e parâmetros do sistema</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? "Salvando..." : (
                        <>
                            <Save className="h-4 w-4" />
                            Salvar Alterações
                        </>
                    )}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sidebar settings navigation */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5" />
                            Geral
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="emergencyReserve">Reserva de Emergência Ideal</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">R$</span>
                                <Input
                                    id="emergencyReserve"
                                    type="number"
                                    placeholder="0,00"
                                    className="pl-9"
                                    value={emergencyReserve}
                                    onChange={(e) => setEmergencyReserve(e.target.value)}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">Valor usado para calcular o progresso na aba de Reserva.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Management */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Tag className="h-5 w-5" />
                            Gerenciamento de Categorias
                        </CardTitle>
                        <CardDescription>
                            Adicione ou remova categorias para organizar seus lançamentos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="fixed" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="fixed">Fixas</TabsTrigger>
                                <TabsTrigger value="variable">Variáveis</TabsTrigger>
                            </TabsList>

                            <TabsContent value="fixed" className="space-y-4 pt-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Nova categoria fixa..."
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory('fixed')}
                                    />
                                    <Button size="icon" onClick={() => handleAddCategory('fixed')}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-muted/30 rounded-lg">
                                    {fixedCategories.map((cat) => (
                                        <Badge
                                            key={cat}
                                            variant="secondary"
                                            className="px-3 py-1 gap-1 group bg-card border-border hover:bg-destructive/10"
                                        >
                                            {cat}
                                            <button
                                                onClick={() => handleRemoveCategory('fixed', cat)}
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>

                                <Button variant="outline" size="sm" onClick={() => handleResetCategories('fixed')} className="gap-2 text-xs">
                                    <RotateCcw className="h-3 w-3" />
                                    Resetar para o Padrão
                                </Button>
                            </TabsContent>

                            <TabsContent value="variable" className="space-y-4 pt-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Nova categoria variável..."
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory('variable')}
                                    />
                                    <Button size="icon" onClick={() => handleAddCategory('variable')}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-muted/30 rounded-lg">
                                    {variableCategories.map((cat) => (
                                        <Badge
                                            key={cat}
                                            variant="secondary"
                                            className="px-3 py-1 gap-1 bg-card border-border hover:bg-destructive/10"
                                        >
                                            {cat}
                                            <button
                                                onClick={() => handleRemoveCategory('variable', cat)}
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>

                                <Button variant="outline" size="sm" onClick={() => handleResetCategories('variable')} className="gap-2 text-xs">
                                    <RotateCcw className="h-3 w-3" />
                                    Resetar para o Padrão
                                </Button>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-warning/20 bg-warning/5">
                <CardContent className="p-4 flex items-start gap-3">
                    <div className="text-warning mt-0.5">⚠️</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p className="font-semibold text-foreground">Dica:</p>
                        <p>Alterar ou remover categorias não altera os gastos já registrados. Se você remover uma categoria, os gastos antigos continuarão com ela, mas ela não aparecerá mais como opção para novos lançamentos.</p>
                    </div>
                </CardContent>
            </Card>

            {/* Informações de Licença */}
            <Card className="border-border/50 bg-muted/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-normal">
                        <ShieldCheck className="h-4 w-4" />
                        Informações de Licença
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
                        <div>
                            <p className="font-medium text-foreground/60 uppercase tracking-wider text-[10px] mb-0.5">Produto</p>
                            <p>{LICENSE.product} v{LICENSE.version}</p>
                        </div>
                        <div>
                            <p className="font-medium text-foreground/60 uppercase tracking-wider text-[10px] mb-0.5">Licenciado para</p>
                            <p>{LICENSE.owner}</p>
                        </div>
                        <div>
                            <p className="font-medium text-foreground/60 uppercase tracking-wider text-[10px] mb-0.5">Pedido</p>
                            <p>{LICENSE.orderId}</p>
                        </div>
                        <div>
                            <p className="font-medium text-foreground/60 uppercase tracking-wider text-[10px] mb-0.5">Emitido em</p>
                            <p>{LICENSE.issuedAt}</p>
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 mt-3 border-t border-border/30 pt-2">
                        {LICENSE.terms}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
