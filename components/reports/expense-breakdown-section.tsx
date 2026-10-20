"use client"

import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { ExpenseBreakdownDto } from "@/lib/api"
import { useMessages } from "@/lib/i18n"
import { ExpenseCategoryChart } from "./expense-category-chart"
import { ExpenseCategoryDetails } from "./expense-category-details"

function Message({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">{children}</p>
      </CardContent>
    </Card>
  )
}

interface ExpenseBreakdownSectionProps {
  breakdown: ExpenseBreakdownDto | null
  isLoading: boolean
  isComparing: boolean
  onComparingChange: (isComparing: boolean) => void
}

export function ExpenseBreakdownSection({ breakdown, isLoading, isComparing, onComparingChange }: ExpenseBreakdownSectionProps) {
  const t = useMessages().expenseBreakdown

  if (isLoading && !breakdown) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[350px] w-full" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    )
  }

  if (!breakdown) return <Message>{t.loadFailed}</Message>

  if (breakdown.total.amount === 0) return <Message>{t.empty(breakdown.currency)}</Message>

  return (
    <div className="space-y-4">
      <ExpenseCategoryChart breakdown={breakdown} />
      <ExpenseCategoryDetails breakdown={breakdown} isComparing={isComparing} onComparingChange={onComparingChange} />
    </div>
  )
}
