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
import { expenseCategoryLabels, type Currency } from "@/lib/api/transactions"
import { formatDateText, formatNumber } from "@/lib/format"
import { usePreferences } from "@/lib/preferences-context"
import { formatAmount, formatYearMonth } from "./budget-month"

const currencies: Currency[] = ["ARS", "USD", "EUR", "BRL"]

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

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

function periodLabel(summary: BudgetAnalysisSummaryDto): string {
  const first = monthOf(summary.firstMonth)
  const last = monthOf(summary.lastMonth)
  return first === last ? last : `${first} a ${last}`
}

function NotEnoughHistory({ eligibility, currency }: { eligibility: BudgetAnalysisEligibilityDto; currency: Currency }) {
  const missing = Math.max(0, eligibility.requiredBudgetMonths - eligibility.budgetMonths)

  return (
    <div className="space-y-4">
      <p className="text-sm">
        Para analizar tu presupuesto necesitamos al menos{" "}
        {plural(eligibility.requiredBudgetMonths, "mes", "meses")} con presupuesto en {currency}. Te{" "}
        {missing === 1 ? "falta" : "faltan"}{" "}
        {plural(missing, "mes", "meses")}.
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Meses con presupuesto</span>
          <span>
            {eligibility.budgetMonths} de {eligibility.requiredBudgetMonths}
          </span>
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
  const last = summary.lastClosedMonth
  const lastLabel = formatYearMonth({ year: last.year, month: last.month })
  const period = periodLabel(summary)
  const mostExceeded = summary.categories.find((category) => category.category === summary.mostExceededCategory)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Último mes cerrado · {lastLabel}</p>
          <p className="text-lg font-semibold">
            {last.categoriesWithinLimit} de {last.categoriesWithLimit}
          </p>
          <p className="text-xs text-muted-foreground">topes de gasto respetados</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Categoría más excedida · {period}</p>
          <p className="text-lg font-semibold">
            {mostExceeded ? expenseCategoryLabels[mostExceeded.category] : "Ninguna"}
          </p>
          <p className="text-xs text-muted-foreground">
            {mostExceeded
              ? mostExceeded.monthsWithLimit === 1 && mostExceeded.lastExceededMonth
                ? `Te pasaste del tope en el mes de ${monthName(mostExceeded.lastExceededMonth)}`
                : `Te pasaste del tope en ${mostExceeded.monthsExceeded} de los ${mostExceeded.monthsWithLimit} meses`
              : "No te pasaste de ningún tope de gasto"}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Último mes cerrado · {lastLabel}</p>
          <p className="text-lg font-semibold">{formatAmount(last.totalSpent, currency)}</p>
          <p className="text-xs text-muted-foreground">gastados de {formatAmount(last.totalLimit, currency)} asignados</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Uso promedio por categoría · {period}</p>
        <ul className="space-y-2">
          {summary.categories.map((category) => (
            <li key={category.category} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>{expenseCategoryLabels[category.category]}</span>
                <span className="text-muted-foreground">
                  {percentage(category.averageUsedPercentage)} · excedida {category.monthsExceeded}/
                  {category.monthsWithLimit}
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
          <CardTitle>Análisis de Presupuesto</CardTitle>
          <CardDescription>Cómo te fue con tus presupuestos en los últimos meses</CardDescription>
        </div>
        <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
          <SelectTrigger className="w-[100px]" aria-label="Moneda del análisis">
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
            No se pudo cargar el análisis de tu presupuesto.
          </p>
        ) : !analysis.eligibility.isEligible || !analysis.summary ? (
          <NotEnoughHistory eligibility={analysis.eligibility} currency={analysis.currency} />
        ) : (
          <>
            {analysis.recommendationsAvailable ? (
              <RecommendationList recommendations={analysis.recommendations} hiddenActions={["Budgets"]} />
            ) : (
              <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                No pudimos generar recomendaciones ahora. Probá de nuevo más tarde; mientras tanto, estos son tus
                datos.
              </p>
            )}
            <Summary summary={analysis.summary} currency={analysis.currency} />
          </>
        )}
      </CardContent>
      {analysis?.recommendationsAvailable && !isLoading && (
        <CardFooter className="flex items-start gap-2 text-xs text-muted-foreground">
          <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
          <p>
            Estas recomendaciones se generan automáticamente a partir de tus presupuestos y movimientos. Son
            orientativas y no constituyen asesoramiento financiero certificado.
          </p>
        </CardFooter>
      )}
    </Card>
  )
}
