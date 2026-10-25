"use client"

import { useEffect, useRef, useState } from "react"
import { InfoIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { RecommendationList } from "@/components/recommendations/recommendation-list"
import {
  getBudgetAnalysis,
  type BudgetAnalysisDto,
  type BudgetAnalysisEligibilityDto,
  type BudgetAnalysisSummaryDto,
} from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"
import { formatDateText, formatNumber } from "@/lib/format"
import { useMessages, type Messages } from "@/lib/i18n"
import { usePreferences } from "@/lib/preferences-context"
import { formatAmount, formatYearMonth } from "./budget-month"

const currencies: Currency[] = ["ARS", "USD", "EUR", "BRL"]

function monthOf(isoDate: string) {
  const [year, month] = isoDate.split("-").map(Number)
  return formatYearMonth({ year, month })
}

// "septiembre", o "diciembre de 2025" si el mes es de otro año.
function monthName(isoDate: string): string {
  const [year, month] = isoDate.split("-").map(Number)
  const date = new Date(year, month - 1, 1)
  return year === new Date().getFullYear()
    ? formatDateText(date, { month: "long" })
    : formatDateText(date, { month: "long", year: "numeric" })
}

function percentage(value: number): string {
  return `${formatNumber(value, { maximumFractionDigits: 0 })}%`
}

function periodLabel(summary: BudgetAnalysisSummaryDto, t: Messages["budgetAnalysis"]): string {
  const first = monthOf(summary.firstMonth)
  const last = monthOf(summary.lastMonth)
  return first === last ? last : t.periodRange(first, last)
}

function NotEnoughHistory({ eligibility, currency }: { eligibility: BudgetAnalysisEligibilityDto; currency: Currency }) {
  const t = useMessages().budgetAnalysis
  const missing = Math.max(0, eligibility.requiredBudgetMonths - eligibility.budgetMonths)

  return (
    <div className="space-y-4">
      <p className="text-sm">{t.notEnoughHistory(eligibility.requiredBudgetMonths, currency, missing)}</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t.monthsWithBudget}</span>
          <span>{t.countOf(eligibility.budgetMonths, eligibility.requiredBudgetMonths)}</span>
        </div>
        <Progress
          value={Math.min(100, (eligibility.budgetMonths / eligibility.requiredBudgetMonths) * 100)}
          className="h-2"
        />
      </div>
    </div>
  )
}

function Summary({ summary, currency }: { summary: BudgetAnalysisSummaryDto; currency: Currency }) {
  const messages = useMessages()
  const t = messages.budgetAnalysis
  const categoryLabels = messages.labels.expenseCategories
  const last = summary.lastClosedMonth
  const lastLabel = formatYearMonth({ year: last.year, month: last.month })
  const period = periodLabel(summary, t)
  const mostExceeded = summary.categories.find((category) => category.category === summary.mostExceededCategory)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">{t.lastClosedMonth(lastLabel)}</p>
          <p className="text-lg font-semibold">{t.countOf(last.categoriesWithinLimit, last.categoriesWithLimit)}</p>
          <p className="text-xs text-muted-foreground">{t.limitsRespected}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">{t.mostExceeded(period)}</p>
          <p className="text-lg font-semibold">{mostExceeded ? categoryLabels[mostExceeded.category] : t.none}</p>
          <p className="text-xs text-muted-foreground">
            {mostExceeded
              ? mostExceeded.monthsWithLimit === 1 && mostExceeded.lastExceededMonth
                ? t.exceededInMonth(monthName(mostExceeded.lastExceededMonth))
                : t.exceededInMonths(mostExceeded.monthsExceeded, mostExceeded.monthsWithLimit)
              : t.noneExceeded}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">{t.lastClosedMonth(lastLabel)}</p>
          <p className="text-lg font-semibold">{formatAmount(last.totalSpent, currency)}</p>
          <p className="text-xs text-muted-foreground">{t.spentOf(formatAmount(last.totalLimit, currency))}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">{t.averageUse(period)}</p>
        <ul className="space-y-2">
          {summary.categories.map((category) => (
            <li key={category.category} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>{categoryLabels[category.category]}</span>
                <span className="text-muted-foreground">
                  {t.exceededRatio(
                    percentage(category.averageUsedPercentage),
                    category.monthsExceeded,
                    category.monthsWithLimit,
                  )}
                </span>
              </div>
              <Progress value={Math.min(100, category.averageUsedPercentage)} className="h-1.5" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Análisis de los presupuestos de los últimos meses cerrados con recomendaciones de FinGrow-AI (HU-25). */
export function BudgetAnalysisCard({ refreshKey = 0 }: { refreshKey?: number }) {
  const t = useMessages().budgetAnalysis
  const { preferences } = usePreferences()
  const [currency, setCurrency] = useState<Currency>(preferences.currency)
  const [analysis, setAnalysis] = useState<BudgetAnalysisDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasFailed, setHasFailed] = useState(false)
  // Moneda del análisis que se está mostrando: al cambiar un presupuesto se recarga sin volver al esqueleto.
  const loadedCurrency = useRef<Currency | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const isFirstLoad = loadedCurrency.current !== currency
    if (isFirstLoad) {
      setIsLoading(true)
      setHasFailed(false)
    }

    getBudgetAnalysis(currency, controller.signal)
      .then((result) => {
        loadedCurrency.current = currency
        setAnalysis(result)
        setHasFailed(false)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        if (!isFirstLoad) return
        setAnalysis(null)
        setHasFailed(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [currency, refreshKey])

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </div>
        <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
          <SelectTrigger className="w-[100px]" aria-label={t.currencyAria}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : hasFailed || !analysis ? (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            {t.loadFailed}
          </p>
        ) : !analysis.eligibility.isEligible || !analysis.summary ? (
          <NotEnoughHistory eligibility={analysis.eligibility} currency={analysis.currency} />
        ) : (
          <>
            {analysis.recommendationsAvailable ? (
              <RecommendationList recommendations={analysis.recommendations} hiddenActions={["Budgets"]} />
            ) : (
              <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                {t.noRecommendations}
              </p>
            )}
            <Summary summary={analysis.summary} currency={analysis.currency} />
          </>
        )}
      </CardContent>
      {analysis?.recommendationsAvailable && !isLoading && (
        <CardFooter className="flex items-start gap-2 text-xs text-muted-foreground">
          <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
          <p>{t.disclaimer}</p>
        </CardFooter>
      )}
    </Card>
  )
}
