"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusIcon, TrendingUpIcon, AlertCircleIcon, CheckCircleIcon, PiggyBankIcon, HandCoinsIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { GoalContributionsDialog } from "@/components/goals/goal-contributions-dialog"
import { createGoal, GOAL_NAME_MAX_LENGTH, listGoals, toastApiError, type GoalDto } from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"

const mockBudgets = [
  {
    id: 1,
    category: "Comida y Restaurantes",
    limit: 500000,
    spent: 385000.5,
    period: "mensual",
    icon: "🍔",
  },
  {
    id: 2,
    category: "Transporte",
    limit: 300000,
    spent: 260000,
    period: "mensual",
    icon: "🚗",
  },
  {
    id: 3,
    category: "Entretenimiento",
    limit: 200000,
    spent: 230000,
    period: "mensual",
    icon: "🎬",
  },
  {
    id: 4,
    category: "Servicios y Facturas",
    limit: 400000,
    spent: 320000,
    period: "mensual",
    icon: "💡",
  },
  {
    id: 5,
    category: "Compras",
    limit: 350000,
    spent: 180000,
    period: "mensual",
    icon: "🛍️",
  },
]


const currencyLabels: Record<Currency, string> = {
  ARS: "ARS ($)",
  USD: "USD ($)",
  EUR: "EUR (€)",
  BRL: "BRL (R$)",
}

function todayLocal(): string {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

function formatDeadline(deadline: string): string {
  return new Date(`${deadline}T00:00:00`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function describeTimeLeft(goal: GoalDto, deadlineLabel: string): string {
  if (goal.status === "Achieved") return `Meta alcanzada · límite ${deadlineLabel}`
  if (goal.status === "Cancelled") return "Meta cancelada"
  if (goal.isOverdue) return `Vencida el ${deadlineLabel}`
  if (goal.daysRemaining === 0) return `Vence hoy · ${deadlineLabel}`
  if (goal.daysRemaining === 1) return `1 día restante · ${deadlineLabel}`
  return `${goal.daysRemaining} días restantes · ${deadlineLabel}`
}

export default function BudgetsPage() {
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false)
  const [isSavingsDialogOpen, setIsSavingsDialogOpen] = useState(false)
  const [savingsGoals, setSavingsGoals] = useState<GoalDto[]>([])
  const [isLoadingGoals, setIsLoadingGoals] = useState(true)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const selectedGoal = savingsGoals.find((goal) => goal.id === selectedGoalId) ?? null

  useEffect(() => {
    const controller = new AbortController()

    listGoals(controller.signal)
      .then(setSavingsGoals)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        toastApiError(error, "No se pudieron cargar tus metas de ahorro.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingGoals(false)
      })

    return () => controller.abort()
  }, [])

  const replaceGoal = (updated: GoalDto) =>
    setSavingsGoals((current) => current.map((goal) => (goal.id === updated.id ? updated : goal)))

  const getBudgetStatus = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100
    if (percentage >= 100) return { status: "exceeded", color: "text-destructive", icon: AlertCircleIcon }
    if (percentage >= 80) return { status: "warning", color: "text-amber-500", icon: AlertCircleIcon }
    return { status: "good", color: "text-success", icon: CheckCircleIcon }
  }

  const totalBudget = mockBudgets.reduce((sum, b) => sum + b.limit, 0)
  const totalSpent = mockBudgets.reduce((sum, b) => sum + b.spent, 0)
  const totalSavingsTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0)
  const totalSavingsCurrent = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Presupuestos y Ahorros</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus límites de gasto y metas de ahorro</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Presupuesto Total</CardDescription>
            <CardTitle className="text-2xl">${totalBudget.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Asignación mensual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Gastado</CardDescription>
            <CardTitle className="text-2xl">${totalSpent.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={(totalSpent / totalBudget) * 100} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {((totalSpent / totalBudget) * 100).toFixed(1)}% del presupuesto usado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Metas de Ahorro</CardDescription>
            <CardTitle className="text-2xl">{savingsGoals.filter((g) => g.status === "Active").length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Metas activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Ahorrado</CardDescription>
            <CardTitle className="text-2xl text-success">${totalSavingsCurrent.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {(totalSavingsTarget > 0 ? (totalSavingsCurrent / totalSavingsTarget) * 100 : 0).toFixed(1)}% del
              objetivo
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="budgets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="budgets">Presupuestos</TabsTrigger>
          <TabsTrigger value="savings">Metas de Ahorro</TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="space-y-4">
          <div className="flex justify-between items-center gap-2">
            <h2 className="text-xl font-semibold">Presupuestos Mensuales</h2>
            <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="size-4" />
                  Agregar Presupuesto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Presupuesto</DialogTitle>
                  <DialogDescription>Establece un límite de gasto para una categoría</DialogDescription>
                </DialogHeader>
                <AddBudgetForm onClose={() => setIsBudgetDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {mockBudgets.map((budget) => {
              const percentage = (budget.spent / budget.limit) * 100
              const status = getBudgetStatus(budget.spent, budget.limit)
              const StatusIcon = status.icon

              return (
                <Card key={budget.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{budget.icon}</div>
                        <div>
                          <CardTitle className="text-lg">{budget.category}</CardTitle>
                          <CardDescription className="capitalize">{budget.period}</CardDescription>
                        </div>
                      </div>
                      <StatusIcon className={`size-5 ${status.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-bold">${budget.spent.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">de ${budget.limit.toLocaleString()}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span className={status.color}>{percentage.toFixed(1)}% usado</span>
                      <span className="text-muted-foreground">
                        ${(budget.limit - budget.spent).toLocaleString()} restante
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="savings" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Metas de Ahorro</h2>
            <Dialog open={isSavingsDialogOpen} onOpenChange={setIsSavingsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="size-4" />
                  Agregar Meta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Meta de Ahorro</DialogTitle>
                  <DialogDescription>Establece un monto objetivo y fecha límite para tu ahorro</DialogDescription>
                </DialogHeader>
                <AddSavingsGoalForm
                  onCreated={(goal) => setSavingsGoals((current) => [goal, ...current])}
                  onClose={() => setIsSavingsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {isLoadingGoals ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : savingsGoals.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Todavía no tenés metas de ahorro. Creá la primera con &quot;Agregar Meta&quot;.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {savingsGoals.map((goal) => {
                const deadlineLabel = formatDeadline(goal.deadline)

                return (
                  <Card key={goal.id} className={goal.isOverdue ? "border-destructive/50" : undefined}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">🎯</div>
                          <div>
                            <CardTitle className="text-lg">{goal.name}</CardTitle>
                            <CardDescription className={goal.isOverdue ? "text-destructive" : undefined}>
                              {describeTimeLeft(goal, deadlineLabel)}
                            </CardDescription>
                          </div>
                        </div>
                        {goal.status === "Achieved" ? (
                          <Badge className="bg-success text-white">Completado</Badge>
                        ) : goal.isOverdue ? (
                          <Badge variant="destructive">Vencida</Badge>
                        ) : (
                          <Badge variant="outline">{goal.progressPercentage.toFixed(0)}%</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-success">${goal.currentAmount.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground">
                          de ${goal.targetAmount.toLocaleString()} {goal.currency}
                        </span>
                      </div>
                      <Progress value={goal.progressPercentage} className="h-2" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {goal.remainingAmount > 0
                            ? `$${goal.remainingAmount.toLocaleString()} pendiente`
                            : "Objetivo cubierto"}
                        </span>
                        <span className="font-medium">{goal.progressPercentage.toFixed(1)}% alcanzado</span>
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => setSelectedGoalId(goal.id)}>
                        <HandCoinsIcon className="size-4" />
                        {goal.status === "Active" ? "Registrar aporte" : "Ver aportes"}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {selectedGoal && (
            <GoalContributionsDialog
              goal={selectedGoal}
              open
              onOpenChange={(open) => !open && setSelectedGoalId(null)}
              onGoalChange={replaceGoal}
            />
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Análisis de Presupuesto</CardTitle>
          <CardDescription>Consejos para mejorar tu salud financiera</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <AlertCircleIcon className="size-5 text-amber-600 dark:text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  Presupuesto de entretenimiento excedido
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Has gastado $23000 de tu presupuesto de $20000 en entretenimiento. Considera reducir gastos
                  discrecionales.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
              <TrendingUpIcon className="size-5 text-success mt-0.5" />
              <div>
                <p className="font-medium text-success-foreground">¡Gran progreso en ahorros!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Estás al 82.5% de tu meta de Laptop Nueva. ¡Sigue así!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <PiggyBankIcon className="size-5 text-blue-600 dark:text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Oportunidad de ahorro</p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Tienes $32000 restantes en tu presupuesto. Considera asignar algo a tus metas de ahorro.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AddBudgetForm({ onClose }: { onClose: () => void }) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="budget-category">Categoría</Label>
        <Select>
          <SelectTrigger id="budget-category">
            <SelectValue placeholder="Selecciona categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="food">Comida y Restaurantes</SelectItem>
            <SelectItem value="transport">Transporte</SelectItem>
            <SelectItem value="entertainment">Entretenimiento</SelectItem>
            <SelectItem value="bills">Servicios y Facturas</SelectItem>
            <SelectItem value="shopping">Compras</SelectItem>
            <SelectItem value="health">Salud</SelectItem>
            <SelectItem value="education">Educación</SelectItem>
            <SelectItem value="other">Otros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget-limit">Límite de Presupuesto</Label>
        <Input id="budget-limit" type="number" placeholder="0.00" step="0.01" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget-period">Período</Label>
        <Select defaultValue="monthly">
          <SelectTrigger id="budget-period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Semanal</SelectItem>
            <SelectItem value="monthly">Mensual</SelectItem>
            <SelectItem value="yearly">Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">Crear Presupuesto</Button>
      </div>
    </form>
  )
}

function AddSavingsGoalForm({
  onCreated,
  onClose,
}: {
  onCreated: (goal: GoalDto) => void
  onClose: () => void
}) {
  const [name, setName] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [currency, setCurrency] = useState<Currency>("ARS")
  const [deadline, setDeadline] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    try {
      const goal = await createGoal({
        name: name.trim(),
        targetAmount: parseFloat(targetAmount),
        currency,
        deadline,
      })
      onCreated(goal)
      toast.success(`Meta "${goal.name}" creada`)
      onClose()
    } catch (error) {
      // Si el validador del backend rechaza la fecha o el monto, el mensaje ya viene en castellano.
      toastApiError(error, "No se pudo crear la meta.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="goal-name">Nombre de la Meta</Label>
        <Input
          id="goal-name"
          placeholder="ej., Fondo de Emergencia"
          maxLength={GOAL_NAME_MAX_LENGTH}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="goal-target">Monto Objetivo</Label>
          <Input
            id="goal-target"
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0.01"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal-currency">Moneda</Label>
          <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
            <SelectTrigger id="goal-currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(currencyLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal-deadline">Fecha Límite</Label>
        <Input
          id="goal-deadline"
          type="date"
          min={todayLocal()}
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          required
        />
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Crear Meta"}
        </Button>
      </div>
    </form>
  )
}
