"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteBudget,
  duplicatePreviousBudget,
  getBudget,
  isApiError,
  removeBudgetLimit,
  toastApiError,
  type BudgetDto,
} from "@/lib/api";
import {
  expenseCategoryLabels,
  type ExpenseCategory,
} from "@/lib/api/transactions";
import { BudgetCurrencyForm } from "./budget-currency-form";
import { BudgetLimitCard } from "./budget-limit-card";
import { BudgetLimitForm } from "./budget-limit-form";
import {
  currentYearMonth,
  formatAmount,
  formatYearMonth,
  shiftMonth,
  type YearMonth,
} from "./budget-month";
import { CreateBudgetForm } from "./create-budget-form";

const allCategories = Object.keys(expenseCategoryLabels) as ExpenseCategory[];

type LimitEditor =
  | { mode: "edit"; category: ExpenseCategory; amount: number }
  | { mode: "add" }
  | null;

export function MonthlyBudgetSection({
  onBudgetChange,
}: {
  onBudgetChange: (budget: BudgetDto | null) => void;
}) {
  const [period, setPeriod] = useState<YearMonth>(currentYearMonth);
  const [budget, setBudget] = useState<BudgetDto | null>(null);
  const [previousBudget, setPreviousBudget] = useState<BudgetDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [limitEditor, setLimitEditor] = useState<LimitEditor>(null);
  const [categoryToRemove, setCategoryToRemove] =
    useState<ExpenseCategory | null>(null);
  const [isDeleteBudgetOpen, setIsDeleteBudgetOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const previousPeriod = shiftMonth(period, -1);
  const periodLabel = formatYearMonth(period);
  const previousLabel = formatYearMonth(previousPeriod);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    const load = async () => {
      const current = await getBudget(
        period.year,
        period.month,
        controller.signal,
      );
      const previousMonth = shiftMonth(period, -1);
      const previous = current
        ? null
        : await getBudget(
            previousMonth.year,
            previousMonth.month,
            controller.signal,
          );

      setBudget(current);
      setPreviousBudget(previous);
    };

    load()
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setBudget(null);
        setPreviousBudget(null);
        toastApiError(error, "No se pudo cargar el presupuesto del mes.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [period, reloadKey]);

  useEffect(() => {
    onBudgetChange(isLoading ? null : budget);
  }, [budget, isLoading, onBudgetChange]);

  const reload = () => setReloadKey((key) => key + 1);

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      await duplicatePreviousBudget(period.year, period.month);
      reload();
      toast.success(
        `Presupuesto de ${periodLabel} creado a partir de ${previousLabel}`,
      );
    } catch (error) {
      toastApiError(error, "No se pudo duplicar el presupuesto.");
      if (isApiError(error) && (error.status === 409 || error.status === 404))
        reload();
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleRemoveCategory = async () => {
    if (!categoryToRemove) return;

    setIsRemoving(true);
    try {
      const updated = await removeBudgetLimit(
        period.year,
        period.month,
        categoryToRemove,
      );
      setBudget(updated);
      toast.success(
        `${expenseCategoryLabels[categoryToRemove]} se quitó del presupuesto`,
      );
    } catch (error) {
      toastApiError(error, "No se pudo quitar la categoría.");
      if (isApiError(error) && (error.status === 404 || error.status === 409))
        reload();
    } finally {
      setIsRemoving(false);
      setCategoryToRemove(null);
    }
  };

  const handleDeleteBudget = async () => {
    setIsRemoving(true);
    try {
      await deleteBudget(period.year, period.month);
      reload();
      toast.success(`Presupuesto de ${periodLabel} eliminado`);
    } catch (error) {
      toastApiError(error, "No se pudo eliminar el presupuesto.");
      if (isApiError(error) && error.status === 404) reload();
    } finally {
      setIsRemoving(false);
      setIsDeleteBudgetOpen(false);
    }
  };

  const total =
    budget?.limits.reduce((sum, limit) => sum + limit.amount, 0) ?? 0;
  const categoriesWithoutLimit = allCategories.filter(
    (category) => !budget?.limits.some((limit) => limit.category === category),
  );

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
          <h2 className="min-w-48 text-center text-xl font-semibold capitalize">
            {periodLabel}
          </h2>
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
              <span className="font-semibold text-foreground">
                {formatAmount(total, budget.currency)}
              </span>
            </p>
            {categoriesWithoutLimit.length > 0 && (
              <Button onClick={() => setLimitEditor({ mode: "add" })}>
                <PlusIcon className="size-4" />
                Agregar Categoría
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsCurrencyOpen(true)}>
              <ArrowLeftRightIcon className="size-4" />
              Cambiar Moneda
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setIsDeleteBudgetOpen(true)}
            >
              <Trash2Icon className="size-4" />
              Eliminar Presupuesto
            </Button>
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
              onEdit={() =>
                setLimitEditor({
                  mode: "edit",
                  category: limit.category,
                  amount: limit.amount,
                })
              }
              onRemove={() => setCategoryToRemove(limit.category)}
              canRemove={budget.limits.length > 1}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-muted-foreground">
              No tenés un presupuesto para{" "}
              <span className="font-medium text-foreground">{periodLabel}</span>
              .
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {previousBudget && (
                <Button onClick={handleDuplicate} disabled={isDuplicating}>
                  <CopyIcon className="size-4" />
                  {isDuplicating
                    ? "Duplicando..."
                    : `Duplicar el de ${previousLabel}`}
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
                Duplicar copia los {previousBudget.limits.length} límites de{" "}
                {previousLabel}.
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
              Asigná un límite de gasto por categoría para{" "}
              <span className="capitalize">{periodLabel}</span>.
            </DialogDescription>
          </DialogHeader>
          <CreateBudgetForm
            period={period}
            onCreated={reload}
            onConflict={reload}
            onClose={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={limitEditor !== null}
        onOpenChange={(open) => !open && setLimitEditor(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {limitEditor?.mode === "edit"
                ? "Editar límite"
                : "Agregar categoría"}
            </DialogTitle>
            <DialogDescription>
              {limitEditor?.mode === "edit"
                ? "Ajustá el límite"
                : "Definí el límite de una categoría nueva"}{" "}
              para <span className="capitalize">{periodLabel}</span>. Lo gastado
              y el estado se recalculan al guardar.
            </DialogDescription>
          </DialogHeader>
          {limitEditor && budget && (
            <BudgetLimitForm
              key={limitEditor.mode === "edit" ? limitEditor.category : "add"}
              period={period}
              currency={budget.currency}
              category={
                limitEditor.mode === "edit" ? limitEditor.category : undefined
              }
              initialAmount={
                limitEditor.mode === "edit" ? limitEditor.amount : undefined
              }
              availableCategories={categoriesWithoutLimit}
              onSaved={setBudget}
              onBudgetMissing={reload}
              onClose={() => setLimitEditor(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCurrencyOpen} onOpenChange={setIsCurrencyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar moneda</DialogTitle>
            <DialogDescription>
              Elegí la moneda del presupuesto de{" "}
              <span className="capitalize">{periodLabel}</span>. Se aplica a
              todas sus categorías.
            </DialogDescription>
          </DialogHeader>
          {isCurrencyOpen && budget && (
            <BudgetCurrencyForm
              period={period}
              currentCurrency={budget.currency}
              onSaved={setBudget}
              onBudgetMissing={reload}
              onClose={() => setIsCurrencyOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={categoryToRemove !== null}
        onOpenChange={(open) => {
          if (!open && !isRemoving) setCategoryToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a quitar{" "}
              {categoryToRemove ? expenseCategoryLabels[categoryToRemove] : ""}{" "}
              del presupuesto de{" "}
              <span className="capitalize">{periodLabel}</span>. Tus movimientos
              de esa categoría no se borran: solo dejan de compararse contra un
              límite.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRemoving}
              onClick={(event) => {
                event.preventDefault();
                void handleRemoveCategory();
              }}
            >
              {isRemoving ? "Quitando..." : "Quitar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isDeleteBudgetOpen}
        onOpenChange={(open) => {
          if (!open && !isRemoving) setIsDeleteBudgetOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar el presupuesto de{" "}
              <span className="capitalize">{periodLabel}</span> con todas sus
              categorías. Tus movimientos no se borran. Esta acción no se puede
              deshacer, pero podés crear otro presupuesto para el mes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRemoving}
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteBudget();
              }}
            >
              {isRemoving ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
