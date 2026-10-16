"use client"

import { useId, useState, type ReactNode } from "react"
import { PiggyBankIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import type { CategoryExpenseDto, ExpenseBreakdownDto, ExpenseTotalDto } from "@/lib/api"
import { expenseCategoryLabels, type Currency } from "@/lib/api/transactions"
import { formatDate, formatMoney } from "@/lib/format"
import { useMessages } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { ExpenseVariation, formatShare, type FavorableDirection } from "./expense-variation"

function CategoryRow({
  category,
  currency,
  isComparing,
}: {
  category: CategoryExpenseDto
  currency: Currency
  isComparing: boolean
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-medium">{expenseCategoryLabels[category.category]}</span>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{formatShare(category.percentage)}</Badge>
          <span className="font-semibold tabular-nums">{formatMoney(category.amount, currency)}</span>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${category.percentage}%` }} />
      </div>
      {isComparing && category.comparison && (
        <ExpenseVariation comparison={category.comparison} currency={currency} className="mt-2 block text-right" />
      )}
    </div>
  )
}

function TotalRow({
  label,
  hint,
  total,
  currency,
  isComparing,
  share,
  favorable = "decrease",
  icon,
  className,
}: {
  label: string
  hint: string
  total: ExpenseTotalDto
  currency: Currency
  isComparing: boolean
  share?: string
  favorable?: FavorableDirection
  icon?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="flex items-start gap-2">
        {icon}
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center justify-end gap-2">
          {share && <Badge variant="outline">{share}</Badge>}
          <span className="font-semibold tabular-nums">{formatMoney(total.amount, currency)}</span>
        </div>
        {isComparing && total.comparison && (
          <ExpenseVariation comparison={total.comparison} currency={currency} favorable={favorable} />
        )}
      </div>
    </div>
  )
}

interface ExpenseCategoryDetailsProps {
  breakdown: ExpenseBreakdownDto
}

export function ExpenseCategoryDetails({ breakdown }: ExpenseCategoryDetailsProps) {
  const t = useMessages().expenseBreakdown
  const switchId = useId()
  const [isComparing, setIsComparing] = useState(false)
  const showsComparison = isComparing && breakdown.hasPreviousPeriod
  const categories = showsComparison
    ? breakdown.categories
    : breakdown.categories.filter((category) => category.amount > 0)

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle>{t.detailsTitle}</CardTitle>
          <CardDescription>
            {showsComparison
              ? t.comparedWith(formatDate(breakdown.previousFrom), formatDate(breakdown.previousTo))
              : t.detailsDescription}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 no-print">
          <Switch id={switchId} checked={isComparing} onCheckedChange={setIsComparing} />
          <Label htmlFor={switchId}>{t.compare}</Label>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isComparing && !breakdown.hasPreviousPeriod && (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">{t.noPreviousPeriod}</p>
        )}
        <div className="space-y-3">
          {categories.map((category) => (
            <CategoryRow
              key={category.category}
              category={category}
              currency={breakdown.currency}
              isComparing={showsComparison}
            />
          ))}
        </div>
        <Separator />
        <div className="space-y-3">
          <TotalRow
            label={t.consumption}
            hint={t.consumptionHint}
            total={breakdown.consumption}
            currency={breakdown.currency}
            isComparing={showsComparison}
            share={formatShare(100)}
          />
          <TotalRow
            label={t.savings}
            hint={t.savingsHint}
            total={breakdown.savings}
            currency={breakdown.currency}
            isComparing={showsComparison}
            favorable="increase"
            icon={<PiggyBankIcon className="mt-0.5 size-5 shrink-0 text-primary" />}
            className="rounded-lg border border-primary/20 bg-primary/10 p-3"
          />
          <Separator />
          <TotalRow
            label={t.total}
            hint={t.totalHint}
            total={breakdown.total}
            currency={breakdown.currency}
            isComparing={showsComparison}
          />
        </div>
      </CardContent>
    </Card>
  )
}
