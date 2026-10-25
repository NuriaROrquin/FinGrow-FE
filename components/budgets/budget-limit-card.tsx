"use client"

import { PencilIcon, Trash2Icon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { BudgetHealth, BudgetLimitDto } from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/format"
import { useMessages } from "@/lib/i18n"
import { expenseCategoryIcons, formatAmount } from "./budget-month"

type LimitStatus = BudgetHealth | "Completed"
type StatusLabel = "statusOnTrack" | "statusWarning" | "statusCompleted" | "statusExceeded"

const statusStyles: Record<LimitStatus, { label: StatusLabel; badge: string; bar: string }> = {
  OnTrack: {
    label: "statusOnTrack",
    badge: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    bar: "[&>div]:bg-emerald-500",
  },
  Warning: {
    label: "statusWarning",
    badge: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    bar: "[&>div]:bg-amber-500",
  },
  Completed: {
    label: "statusCompleted",
    badge: "border-transparent bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
    bar: "[&>div]:bg-sky-500",
  },
  Exceeded: {
    label: "statusExceeded",
    badge: "border-transparent bg-destructive text-destructive-foreground",
    bar: "[&>div]:bg-destructive",
  },
}

function statusOf(limit: BudgetLimitDto): LimitStatus | null {
  if (limit.spent == null || limit.health == null) {
    return null
  }

  return limit.health === "Exceeded" && (limit.remaining ?? 0) >= 0 ? "Completed" : limit.health
}

export function BudgetLimitCard({
  limit,
  currency,
  onEdit,
  onRemove,
  canRemove,
}: {
  limit: BudgetLimitDto
  currency: Currency | null
  onEdit: () => void
  onRemove: () => void
  canRemove: boolean
}) {
  const messages = useMessages()
  const t = messages.budgets
  const categoryLabel = messages.labels.expenseCategories[limit.category]
  const status = statusOf(limit)
  const health = status ? statusStyles[status] : null
  const remaining = limit.remaining ?? 0

  return (
    <Card
      className={status === "Exceeded" ? "border-destructive/50" : undefined}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="text-3xl">
              {expenseCategoryIcons[limit.category]}
            </div>
            <div>
              <CardTitle className="text-lg">
                {categoryLabel}
              </CardTitle>
              <CardDescription>
                {t.monthlyLimitValue(formatAmount(limit.amount, currency))}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {health && <Badge className={health.badge}>{t[health.label]}</Badge>}
            <Button
              variant="ghost"
              size="icon"
              aria-label={t.editLimitAria(categoryLabel)}
              onClick={onEdit}
            >
              <PencilIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t.removeFromBudgetAria(categoryLabel)}
              title={
                canRemove ? t.removeCategory : t.onlyCategory
              }
              onClick={onRemove}
              disabled={!canRemove}
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {health ? (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-bold">
                {formatAmount(limit.spent ?? 0, currency)}
              </span>
              <span className="text-sm text-muted-foreground">{t.spent}</span>
            </div>
            <Progress
              value={Math.min(limit.usedPercentage ?? 0, 100)}
              className={cn("h-2", health.bar)}
            />
            <div className="flex items-center justify-between text-sm">
              <span
                className={
                  remaining < 0
                    ? "font-medium text-destructive"
                    : "text-muted-foreground"
                }
              >
                {remaining < 0
                  ? t.overBy(formatAmount(-remaining, currency))
                  : remaining === 0
                    ? t.atLimit
                    : t.remaining(formatAmount(remaining, currency))}
              </span>
              <span className="font-medium">
                {t.used(
                  formatNumber(limit.usedPercentage ?? 0, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
                )}
              </span>
            </div>
          </>
        ) : (
          <span className="text-2xl font-bold">
            {formatAmount(limit.amount, currency)}
          </span>
        )}
      </CardContent>
    </Card>
  );
}