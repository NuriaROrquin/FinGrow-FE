"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
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
import { PlusIcon, TrophyIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { GoalContributionsDialog } from "@/components/goals/goal-contributions-dialog"
import { AchievedGoalCard, InProgressGoalCard } from "@/components/goals/goal-cards"
import { DeleteGoalDialog } from "@/components/goals/delete-goal-dialog"
import { GoalForm } from "@/components/goals/goal-form"
import { BudgetAnalysisCard } from "@/components/budgets/budget-analysis-card"
import { MonthlyBudgetSection } from "@/components/budgets/monthly-budget-section"
import { formatAmount } from "@/components/budgets/budget-month"
import { listGoals, toastApiError, type BudgetDto, type GoalDto } from "@/lib/api"
import { formatNumber } from "@/lib/format"
import { useMessages } from "@/lib/i18n"

type BudgetsTab = "budgets" | "savings"

const scrollableGoalGrid = "grid max-h-[560px] gap-4 overflow-y-auto p-1 pr-2 md:grid-cols-2"

export default function BudgetsPage() {
  const t = useMessages().budgets
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<BudgetsTab>(() =>
    searchParams.get("tab") === "savings" ? "savings" : "budgets",
  )
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) setActiveTab(tab === "savings" ? "savings" : "budgets")
  }, [searchParams])
  const [currentBudget, setCurrentBudget] = useState<BudgetDto | null>(null)
  const [analysisRefreshKey, setAnalysisRefreshKey] = useState(0)
  const refreshAnalysis = useCallback(() => setAnalysisRefreshKey((key) => key + 1), [])
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
        toastApiError(error, t.goalsLoadFailed)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingGoals(false)
      })

    return () => controller.abort()
  }, [t])

  const replaceGoal = (updated: GoalDto) =>
    setSavingsGoals((current) => current.map((goal) => (goal.id === updated.id ? updated : goal)))

  const totalBudget = currentBudget?.limits.reduce((sum, limit) => sum + limit.amount, 0) ?? 0
  // Sin conversión: cada moneda se suma por separado.
  const savingsTotalsByCurrency = Object.values(
    savingsGoals.reduce<Record<string, { currency: GoalDto["currency"]; target: number; current: number }>>(
      (totals, goal) => {
        const total = totals[goal.currency] ?? { currency: goal.currency, target: 0, current: 0 }
        total.target += goal.targetAmount
        total.current += goal.currentAmount
        totals[goal.currency] = total
        return totals
      },
      {},
    ),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {activeTab === "budgets" ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t.totalBudget}</CardDescription>
                <CardTitle className="text-2xl">
                  {currentBudget ? formatAmount(totalBudget, currentBudget.currency) : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {currentBudget ? t.totalBudgetHint : t.noBudgetHint}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t.categoriesWithLimit}</CardDescription>
                <CardTitle className="text-2xl">{currentBudget?.limits.length ?? 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t.inSelectedMonth}</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t.savingsGoals}</CardDescription>
                <CardTitle className="text-2xl">{goalsInProgress.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t.activeGoals}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t.totalSaved}</CardDescription>
                {savingsTotalsByCurrency.length === 0 && <CardTitle className="text-2xl">—</CardTitle>}
                {savingsTotalsByCurrency.map(({ currency, current }) => (
                  <CardTitle key={currency} className="text-2xl">
                    {formatAmount(current, currency)}
                  </CardTitle>
                ))}
              </CardHeader>
              <CardContent>
                {savingsTotalsByCurrency.map(({ currency, target, current }) => (
                  <p key={currency} className="text-sm text-muted-foreground">
                    {t.ofTarget(
                      formatNumber(target > 0 ? (current / target) * 100 : 0, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      }),
                      currency,
                    )}
                  </p>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BudgetsTab)} className="space-y-4">        
        <TabsList>
          <TabsTrigger value="budgets">{t.tabBudgets}</TabsTrigger>
          <TabsTrigger value="savings">{t.tabSavings}</TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="space-y-4">
          <MonthlyBudgetSection onBudgetChange={setCurrentBudget} onBudgetsChanged={refreshAnalysis} />
          <BudgetAnalysisCard refreshKey={analysisRefreshKey} />
        </TabsContent>

        <TabsContent value="savings" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{t.savingsGoals}</h2>
            <Dialog open={isSavingsDialogOpen} onOpenChange={setIsSavingsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="size-4" />
                  {t.addGoal}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.createGoalTitle}</DialogTitle>
                  <DialogDescription>{t.createGoalDescription}</DialogDescription>
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
                {t.noGoals}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.inProgress(goalsInProgress.length)}
                </h3>
                {goalsInProgress.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t.noGoalsInProgress}
                  </p>
                ) : (
                  <div className={scrollableGoalGrid}>
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
                    {t.achieved(achievedGoals.length)}
                  </h3>
                  <div className={scrollableGoalGrid}>
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
                <DialogTitle>{t.editGoalTitle}</DialogTitle>
                <DialogDescription>{t.editGoalDescription}</DialogDescription>
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
    </div>
  )
}
