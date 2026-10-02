"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ChevronLeftIcon, ChevronRightIcon, CopyIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { duplicatePreviousBudget, getBudget, isApiError, toastApiError, type BudgetDto } from "@/lib/api"
import { expenseCategoryLabels, type ExpenseCategory } from "@/lib/api/transactions"
import { BudgetLimitCard } from "./budget-limit-card"
import { BudgetLimitForm } from "./budget-limit-form"
import {
  currentYearMonth,
  formatAmount,
  formatYearMonth,
  shiftMonth,
  type YearMonth,
} from "./budget-month"
import { CreateBudgetForm } from "./create-budget-form"

const allCategories = Object.keys(expenseCategoryLabels) as ExpenseCategory[]

/** Qué límite se está editando: una categoría existente, una nueva, o ninguno. */
type LimitEditor = { mode: "edit"; category: ExpenseCategory; amount: number } | { mode: "add" } | null

export function MonthlyBudgetSection({ onBudgetChange }: { onBudgetChange: (budget: BudgetDto | null) => void }) {
  const [period, setPeriod] = useState<YearMonth>(currentYearMonth)
  const [budget, setBudget] = useState<BudgetDto | null>(null)
  const [previousBudget, setPreviousBudget] = useState<BudgetDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [limitEditor, setLimitEditor] = useState<LimitEditor>(null)

  const previousPeriod = shiftMonth(period, -1)
  const periodLabel = formatYearMonth(period)
  const previousLabel = formatYearMonth(previousPeriod)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)

    const load = async () => {
      const current = await getBudget(period.year, period.month, controller.signal)
      // Solo interesa el mes anterior si hay que ofrecer duplicarlo.
      const previousMonth = shiftMonth(period, -1)
      const previous = current
        ? null
        : await getBudget(previousMonth.year, previousMonth.month, controller.signal)

      setBudget(current)
      setPreviousBudget(previous)
    }

    load()
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setBudget(null)
        setPreviousBudget(null)
        toastApiError(error, "No se pudo cargar el presupuesto del mes.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [period, reloadKey])

  useEffect(() => {
    onBudgetChange(isLoading ? null : budget)
  }, [budget, isLoading, onBudgetChange])

  const reload = () => setReloadKey((key) => key + 1)

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      await duplicatePreviousBudget(period.year, period.month)
      // Duplicar devuelve solo los límites: se vuelve a pedir para traer lo gastado del mes.
      reload()
      toast.success(`Presupuesto de ${periodLabel} creado a partir de ${previousLabel}`)
    } catch (error) {
      toastApiError(error, "No se pudo duplicar el presupuesto.")
      if (isApiError(error) && (error.status === 409 || error.status === 404)) reload()
    } finally {
      setIsDuplicating(false)
    }
  }

  const total = budget?.limits.reduce((sum, limit) => sum + limit.amount, 0) ?? 0
  const categoriesWithoutLimit = allCategories.filter(
    (category) => !budget?.limits.some((limit) => limit.category === category),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Mes anterior"
            onClick={() => setPeriod((current) => shiftMonth(current, -1))}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <h2 className="min-w-48 text-center text-xl font-semibold capitalize">{periodLabel}</h2>
          <Button
            variant="outline"
            size="icon"
            aria-label="Mes siguiente"
            onClick={() => setPeriod((current) => shiftMonth(current, 1))}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
        {!isLoading && budget && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Total asignado:{" "}
              <span className="font-semibold text-foreground">{formatAmount(total, budget.currency)}</span>
            </p>
            {categoriesWithoutLimit.length > 0 && (
              <Button onClick={() => setLimitEditor({ mode: "add" })}>
                <PlusIcon className="size-4" />
                Agregar Categoría
              </Button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : budget ? (
        <div className="grid gap-4 md:grid-cols-2">
          {budget.limits.map((limit) => (
            <BudgetLimitCard
              key={limit.category}
              limit={limit}
              currency={budget.currency}
              onEdit={() => setLimitEditor({ mode: "edit", category: limit.category, amount: limit.amount })}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-muted-foreground">
              No tenés un presupuesto para <span className="font-medium text-foreground">{periodLabel}</span>.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {previousBudget && (
                <Button onClick={handleDuplicate} disabled={isDuplicating}>
                  <CopyIcon className="size-4" />
                  {isDuplicating ? "Duplicando..." : `Duplicar el de ${previousLabel}`}
                </Button>
              )}
              <Button
                variant={previousBudget ? "outline" : "default"}
                onClick={() => setIsCreateOpen(true)}
                disabled={isDuplicating}
              >
                <PlusIcon className="size-4" />
                Crear desde cero
              </Button>
            </div>
            {previousBudget && (
              <p className="text-xs text-muted-foreground">
                Duplicar copia los {previousBudget.limits.length} límites de {previousLabel}.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear presupuesto</DialogTitle>
            <DialogDescription>
              Asigná un límite de gasto por categoría para <span className="capitalize">{periodLabel}</span>.
            </DialogDescription>
          </DialogHeader>
          <CreateBudgetForm
            period={period}
            // Crear devuelve solo los límites: se vuelve a pedir para traer lo gastado del mes.
            onCreated={reload}
            onConflict={reload}
            onClose={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={limitEditor !== null} onOpenChange={(open) => !open && setLimitEditor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{limitEditor?.mode === "edit" ? "Editar límite" : "Agregar categoría"}</DialogTitle>
            <DialogDescription>
              {limitEditor?.mode === "edit" ? "Ajustá el límite" : "Definí el límite de una categoría nueva"} para{" "}
              <span className="capitalize">{periodLabel}</span>. Lo gastado y el estado se recalculan al guardar.
            </DialogDescription>
          </DialogHeader>
          {limitEditor && budget && (
            <BudgetLimitForm
              // La key reinicia el formulario al pasar de una categoría a otra.
              key={limitEditor.mode === "edit" ? limitEditor.category : "add"}
              period={period}
              currency={budget.currency}
              category={limitEditor.mode === "edit" ? limitEditor.category : undefined}
              initialAmount={limitEditor.mode === "edit" ? limitEditor.amount : undefined}
              availableCategories={categoriesWithoutLimit}
              onSaved={setBudget}
              onBudgetMissing={reload}
              onClose={() => setLimitEditor(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}