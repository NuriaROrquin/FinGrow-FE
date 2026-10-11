"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PlusIcon, TrendingUpIcon, AlertCircleIcon, PiggyBankIcon, TrophyIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { GoalContributionsDialog } from "@/components/goals/goal-contributions-dialog"
import { AchievedGoalCard, InProgressGoalCard } from "@/components/goals/goal-cards"
import { DeleteGoalDialog } from "@/components/goals/delete-goal-dialog"
import { GoalForm } from "@/components/goals/goal-form"
import { MonthlyBudgetSection } from "@/components/budgets/monthly-budget-section"
import { formatAmount } from "@/components/budgets/budget-month"
import { listGoals, toastApiError, type BudgetDto, type GoalDto } from "@/lib/api"

export default function BudgetsPage() {
  const [currentBudget, setCurrentBudget] = useState<BudgetDto | null>(null)
  const [isSavingsDialogOpen, setIsSavingsDialogOpen] = useState(false)
  const [savingsGoals, setSavingsGoals] = useState<GoalDto[]>([])
  const [isLoadingGoals, setIsLoadingGoals] = useState(true)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const selectedGoal = savingsGoals.find((goal) => goal.id === selectedGoalId) ?? null
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const editingGoal = savingsGoals.find((goal) => goal.id === editingGoalId) ?? null
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null)
  const deletingGoal = savingsGoals.find((goal) => goal.id === deletingGoalId) ?? null
  const goalsInProgress = savingsGoals.filter((goal) => goal.status === "Active")
  const achievedGoals = savingsGoals
    .filter((goal) => goal.status === "Achieved")
    .sort((a, b) => (b.achievedAt ?? "").localeCompare(a.achievedAt ?? ""))

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

  const totalBudget = currentBudget?.limits.reduce((sum, limit) => sum + limit.amount, 0) ?? 0
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
            <CardTitle className="text-2xl">
              {currentBudget ? formatAmount(totalBudget, currentBudget.currency) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {currentBudget ? "Suma de los topes del mes" : "Sin presupuesto para el mes"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Categorías con Tope</CardDescription>
            <CardTitle className="text-2xl">{currentBudget?.limits.length ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">En el mes seleccionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Metas de Ahorro</CardDescription>
            <CardTitle className="text-2xl">{goalsInProgress.length}</CardTitle>
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
          <MonthlyBudgetSection onBudgetChange={setCurrentBudget} />
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
                <GoalForm
                  onSaved={(goal) => setSavingsGoals((current) => [goal, ...current])}
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
            <div className="space-y-6">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  En curso ({goalsInProgress.length})
                </h3>
                {goalsInProgress.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tenés metas en curso. Creá una nueva con &quot;Agregar Meta&quot;.
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {goalsInProgress.map((goal) => (
                      <InProgressGoalCard
                        key={goal.id}
                        goal={goal}
                        onOpenContributions={() => setSelectedGoalId(goal.id)}
                        onEdit={() => setEditingGoalId(goal.id)}
                        onDelete={() => setDeletingGoalId(goal.id)}
                      />
                    ))}
                  </div>
                )}
              </section>

              {achievedGoals.length > 0 && (
                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-success">
                    <TrophyIcon className="size-4" />
                    Alcanzadas ({achievedGoals.length})
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {achievedGoals.map((goal) => (
                      <AchievedGoalCard
                        key={goal.id}
                        goal={goal}
                        onOpenContributions={() => setSelectedGoalId(goal.id)}
                        onEdit={() => setEditingGoalId(goal.id)}
                        onDelete={() => setDeletingGoalId(goal.id)}
                      />
                    ))}
                  </div>
                </section>
              )}
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

          <Dialog open={editingGoal !== null} onOpenChange={(open) => !open && setEditingGoalId(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Meta de Ahorro</DialogTitle>
                <DialogDescription>Ajustá el nombre, el monto objetivo o la fecha límite de tu meta</DialogDescription>
              </DialogHeader>
              {editingGoal && (
                <GoalForm
                  key={editingGoal.id}
                  goal={editingGoal}
                  onSaved={replaceGoal}
                  onClose={() => setEditingGoalId(null)}
                />
              )}
            </DialogContent>
          </Dialog>

          {deletingGoal && (
            <DeleteGoalDialog
              goal={deletingGoal}
              open
              onOpenChange={(open) => !open && setDeletingGoalId(null)}
              onDeleted={(goalId) => setSavingsGoals((current) => current.filter((goal) => goal.id !== goalId))}
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
