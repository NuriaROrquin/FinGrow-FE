"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
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
  BUDGET_NOTIFICATION_EVENT,
  deleteBudget,
  duplicatePreviousBudget,
  getBudget,
  isApiError,
  removeBudgetLimit,
  toastApiError,
  type BudgetDto,
} from "@/lib/api";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/api/transactions";
import { useMessages } from "@/lib/i18n";
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

type LimitEditor =
  | { mode: "edit"; category: ExpenseCategory; amount: number }
  | { mode: "add" }
  | null;

export function MonthlyBudgetSection({
  onBudgetChange,
  onBudgetsChanged,
}: {
  onBudgetChange: (budget: BudgetDto | null) => void;
  /** Se llama cuando se guardó un cambio en un presupuesto o en su gasto, para refrescar el análisis (HU-25). */
  onBudgetsChanged?: () => void;
}) {
  const messages = useMessages();
  const t = messages.budgets;
  const categoryLabels = messages.labels.expenseCategories;
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
        toastApiError(error, t.loadFailed);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [period, reloadKey, t]);

  useEffect(() => {
    onBudgetChange(isLoading ? null : budget);
  }, [budget, isLoading, onBudgetChange]);

  const reload = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    const onBudgetAlert = () => {
      setReloadKey((key) => key + 1);
      onBudgetsChanged?.();
    };
    window.addEventListener(BUDGET_NOTIFICATION_EVENT, onBudgetAlert);
    return () => window.removeEventListener(BUDGET_NOTIFICATION_EVENT, onBudgetAlert);
  }, [onBudgetsChanged]);

  const reloadChanged = () => {
    reload();
    onBudgetsChanged?.();
  };

  const saveBudget = (updated: BudgetDto) => {
    setBudget(updated);
    onBudgetsChanged?.();
  };
  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      await duplicatePreviousBudget(period.year, period.month);
      reloadChanged();
      toast.success(t.duplicated(periodLabel, previousLabel));
    } catch (error) {
      toastApiError(error, t.duplicateFailed);
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
      saveBudget(updated);
      toast.success(t.categoryRemoved(categoryLabels[categoryToRemove]));
    } catch (error) {
      toastApiError(error, t.removeCategoryFailed);
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
      reloadChanged();
      toast.success(t.budgetDeleted(periodLabel));
    } catch (error) {
      toastApiError(error, t.deleteBudgetFailed);
      if (isApiError(error) && error.status === 404) reload();
    } finally {
      setIsRemoving(false);
      setIsDeleteBudgetOpen(false);
    }
  };

  const total =
    budget?.limits.reduce((sum, limit) => sum + limit.amount, 0) ?? 0;
  const categoriesWithoutLimit = EXPENSE_CATEGORIES.filter(
    (category) => !budget?.limits.some((limit) => limit.category === category),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label={t.previousMonth}
            onClick={() => setPeriod((current) => shiftMonth(current, -1))}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <h2 className="min-w-48 text-center text-xl font-semibold">
            {periodLabel}
          </h2>
          <Button
            variant="outline"
            size="icon"
            aria-label={t.nextMonth}
            onClick={() => setPeriod((current) => shiftMonth(current, 1))}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
        {!isLoading && budget && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {t.totalAssigned}{" "}
              <span className="font-semibold text-foreground">
                {formatAmount(total, budget.currency)}
              </span>
            </p>
            {categoriesWithoutLimit.length > 0 && (
              <Button onClick={() => setLimitEditor({ mode: "add" })}>
                <PlusIcon className="size-4" />
                {t.addCategory}
              </Button>
            )}
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setIsDeleteBudgetOpen(true)}
            >
              <Trash2Icon className="size-4" />
              {t.deleteBudget}
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
              {t.noBudgetPrefix}
              <span className="font-medium text-foreground">{periodLabel}</span>
              {t.noBudgetSuffix}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {previousBudget && (
                <Button onClick={handleDuplicate} disabled={isDuplicating}>
                  <CopyIcon className="size-4" />
                  {isDuplicating ? t.duplicating : t.duplicateFrom(previousLabel)}
                </Button>
              )}
              <Button
                variant={previousBudget ? "outline" : "default"}
                onClick={() => setIsCreateOpen(true)}
                disabled={isDuplicating}
              >
                <PlusIcon className="size-4" />
                {t.createFromScratch}
              </Button>
            </div>
            {previousBudget && (
              <p className="text-xs text-muted-foreground">
                {t.duplicateHint(previousBudget.limits.length, previousLabel)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.createTitle}</DialogTitle>
            <DialogDescription>{t.createDescription(periodLabel)}</DialogDescription>
          </DialogHeader>
          <CreateBudgetForm
            period={period}
            onCreated={reloadChanged}
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
              {limitEditor?.mode === "edit" ? t.editLimitTitle : t.addCategoryTitle}
            </DialogTitle>
            <DialogDescription>
              {limitEditor?.mode === "edit"
                ? t.editLimitDescription(periodLabel)
                : t.addCategoryDescription(periodLabel)}
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
              onSaved={saveBudget}
              onBudgetMissing={reload}
              onClose={() => setLimitEditor(null)}
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
            <AlertDialogTitle>{t.removeCategoryTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.removeCategoryWarning(
                categoryToRemove ? categoryLabels[categoryToRemove] : "",
                periodLabel,
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>
              {messages.common.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRemoving}
              onClick={(event) => {
                event.preventDefault();
                void handleRemoveCategory();
              }}
            >
              {isRemoving ? t.removing : t.remove}
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
            <AlertDialogTitle>{t.deleteBudgetTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteBudgetWarning(periodLabel)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>
              {messages.common.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRemoving}
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteBudget();
              }}
            >
              {isRemoving ? t.deleting : t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
