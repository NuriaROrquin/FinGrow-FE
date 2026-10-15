"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { FinancialRecommendationsCard } from "@/components/reports/financial-recommendations-card"
import { FinancialSummaryCard } from "@/components/reports/financial-summary-card"
import { getFinancialInsights, toastApiError, type FinancialInsightsDto, type InsightsEligibilityDto } from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

function currentMonthStatus(eligibility: InsightsEligibilityDto): string {
  const { currentMonthTransactions, requiredTransactions, currentMonthHasIncome } = eligibility

  if (currentMonthTransactions >= requiredTransactions && currentMonthHasIncome) {
    return "Este mes ya cuenta como mes con actividad suficiente."
  }

  if (currentMonthTransactions >= requiredTransactions) {
    return `Este mes ya tenés ${requiredTransactions} movimientos confirmados: solo falta registrar algún ingreso.`
  }

  const income = currentMonthHasIncome ? "" : " y todavía no registraste ingresos"
  return `Este mes llevás ${currentMonthTransactions} de ${requiredTransactions} movimientos confirmados${income}.`
}

function NotEnoughHistory({ eligibility }: { eligibility: InsightsEligibilityDto }) {
  const missingMonths = Math.max(0, eligibility.requiredActiveMonths - eligibility.activeMonths)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis y Recomendaciones</CardTitle>
        <CardDescription>Todavía no tenemos suficiente historial para analizar tus finanzas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          Para ver tus recomendaciones necesitás{" "}
          {plural(eligibility.requiredActiveMonths, "mes", "meses")} con al menos{" "}
          {eligibility.requiredTransactions} movimientos confirmados y algún ingreso. Te{" "}
          {missingMonths === 1 ? "falta" : "faltan"} {plural(missingMonths, "mes", "meses")}.
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Meses con actividad suficiente</span>
            <span>
              {eligibility.activeMonths} de {eligibility.requiredActiveMonths}
            </span>
          </div>
          <Progress
            value={Math.min(100, (eligibility.activeMonths / eligibility.requiredActiveMonths) * 100)}
            className="h-2"
          />
        </div>
        <p className="text-sm text-muted-foreground">{currentMonthStatus(eligibility)}</p>
      </CardContent>
    </Card>
  )
}

interface FinancialInsightsSectionProps {
  dateFrom: string
  dateTo: string
  currency: Currency
}

export function FinancialInsightsSection({ dateFrom, dateTo, currency }: FinancialInsightsSectionProps) {
  const [insights, setInsights] = useState<FinancialInsightsDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)

    getFinancialInsights(currency, dateFrom, dateTo, controller.signal)
      .then(setInsights)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setInsights(null)
        toastApiError(error, "No se pudieron cargar los hitos y recomendaciones.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [currency, dateFrom, dateTo])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Hitos y Recomendaciones</h2>
        <p className="text-sm text-muted-foreground">Lo que lograste en el período y qué podés hacer con tu plata</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <>
            <Skeleton className="h-[360px] w-full" />
            <Skeleton className="h-[360px] w-full" />
          </>
        ) : !insights ? (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground md:col-span-2">
            No se pudieron cargar los hitos y recomendaciones.
          </p>
        ) : (
          <>
            <FinancialSummaryCard achievements={insights.achievements} />
            {insights.eligibility.isEligible && insights.highlights ? (
              <FinancialRecommendationsCard
                recommendations={insights.recommendations}
                available={insights.recommendationsAvailable}
                hasMovements={insights.highlights.hasMovements}
                currency={insights.currency}
              />
            ) : (
              <NotEnoughHistory eligibility={insights.eligibility} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
