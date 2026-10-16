"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getExpenseBreakdown, toastApiError, type ExpenseBreakdownDto } from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"
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
  dateFrom: string
  dateTo: string
  currency: Currency
}

export function ExpenseBreakdownSection({ dateFrom, dateTo, currency }: ExpenseBreakdownSectionProps) {
  const t = useMessages().expenseBreakdown
  const [breakdown, setBreakdown] = useState<ExpenseBreakdownDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)

    getExpenseBreakdown(currency, dateFrom, dateTo, controller.signal)
      .then(setBreakdown)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setBreakdown(null)
        toastApiError(error, t.loadFailed)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [currency, dateFrom, dateTo, t.loadFailed])

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
      <ExpenseCategoryDetails breakdown={breakdown} />
    </div>
  )
}
