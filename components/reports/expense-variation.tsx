"use client"

import { Badge } from "@/components/ui/badge"
import type { ExpenseComparisonDto } from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"
import { formatNumber, formatSignedMoney } from "@/lib/format"
import { useMessages } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export type FavorableDirection = "decrease" | "increase"

export function formatShare(value: number): string {
  return `${formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

function formatSignedShare(value: number): string {
  return `${value > 0 ? "+" : ""}${formatShare(value)}`
}

function toneClass(variation: number, favorable: FavorableDirection): string {
  if (variation === 0) return "text-muted-foreground"
  const isFavorable = favorable === "decrease" ? variation < 0 : variation > 0
  return isFavorable ? "text-success" : "text-destructive"
}

interface ExpenseVariationProps {
  comparison: ExpenseComparisonDto
  currency: Currency
  favorable?: FavorableDirection
  className?: string
}

export function ExpenseVariation({ comparison, currency, favorable = "decrease", className }: ExpenseVariationProps) {
  const t = useMessages().expenseBreakdown

  if (comparison.isNew) {
    return (
      <span className={cn("inline-flex items-center gap-2 text-sm", className)}>
        <Badge variant="outline" className="rounded-full">
          {t.newCategory}
        </Badge>
        <span className={toneClass(comparison.variationAmount, favorable)}>
          {formatSignedMoney(comparison.variationAmount, currency)}
        </span>
      </span>
    )
  }

  if (comparison.variationAmount === 0) {
    return <span className={cn("text-sm text-muted-foreground", className)}>{t.noChange}</span>
  }

  return (
    <span className={cn("text-sm font-medium tabular-nums", toneClass(comparison.variationAmount, favorable), className)}>
      {formatSignedMoney(comparison.variationAmount, currency)}
      {comparison.variationPercent !== null && ` · ${formatSignedShare(comparison.variationPercent)}`}
    </span>
  )
}
