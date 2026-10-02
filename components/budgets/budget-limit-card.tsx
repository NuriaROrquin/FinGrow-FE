"use client"

import { PencilIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { BudgetHealth, BudgetLimitDto } from "@/lib/api"
import { expenseCategoryLabels } from "@/lib/api/transactions"
import { cn } from "@/lib/utils"
import { expenseCategoryIcons, formatAmount } from "./budget-month"

type LimitStatus = BudgetHealth | "Completed"

const statusStyles: Record<LimitStatus, { label: string; badge: string; bar: string }> = {
  OnTrack: {
    label: "En curso",
    badge: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    bar: "[&>div]:bg-emerald-500",
  },
  Warning: {
    label: "Cerca del límite",
    badge: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    bar: "[&>div]:bg-amber-500",
  },
  Completed: {
    label: "Completado",
    badge: "border-transparent bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
    bar: "[&>div]:bg-sky-500",
  },
  Exceeded: {
    label: "Excedido",
    badge: "border-transparent bg-destructive text-destructive-foreground",
    bar: "[&>div]:bg-destructive",
  },
}

/**
 * El backend marca `Exceeded` desde el 100 %. En pantalla se separa el caso de haber gastado
 * justo el tope ("Completado") del de haberlo superado ("Excedido").
 */
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
}: {
  limit: BudgetLimitDto
  currency: string | null
  onEdit: () => void
}) {
  const status = statusOf(limit)
  const health = status ? statusStyles[status] : null
  const remaining = limit.remaining ?? 0

  return (
    <Card className={status === "Exceeded" ? "border-destructive/50" : undefined}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{expenseCategoryIcons[limit.category]}</div>
            <div>
              <CardTitle className="text-lg">{expenseCategoryLabels[limit.category]}</CardTitle>
              <CardDescription>Límite mensual: {formatAmount(limit.amount, currency)}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {health && <Badge className={health.badge}>{health.label}</Badge>}
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar límite de ${expenseCategoryLabels[limit.category]}`}
              onClick={onEdit}
            >
              <PencilIcon className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {health ? (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-bold">{formatAmount(limit.spent ?? 0, currency)}</span>
              <span className="text-sm text-muted-foreground">gastado</span>
            </div>
            <Progress value={Math.min(limit.usedPercentage ?? 0, 100)} className={cn("h-2", health.bar)} />
            <div className="flex items-center justify-between text-sm">
              <span className={remaining < 0 ? "font-medium text-destructive" : "text-muted-foreground"}>
                {remaining < 0
                  ? `Te pasaste ${formatAmount(-remaining, currency)}`
                  : remaining === 0
                    ? "Llegaste al límite"
                    : `Quedan ${formatAmount(remaining, currency)}`}
              </span>
              <span className="font-medium">{(limit.usedPercentage ?? 0).toFixed(1)}% usado</span>
            </div>
          </>
        ) : (
          <span className="text-2xl font-bold">{formatAmount(limit.amount, currency)}</span>
        )}
      </CardContent>
    </Card>
  )
}