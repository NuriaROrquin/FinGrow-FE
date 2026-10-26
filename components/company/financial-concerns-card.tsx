"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import type { CompanyConcernDto } from "@/lib/api"
import { formatNumber } from "@/lib/format"
import { useMessages } from "@/lib/i18n"
import { AnonymizedNotice, EmptyNotice, monthAndYear, type CompanyInsightsState } from "./company-insights-state"

function formatPercentage(value: number) {
  return `${formatNumber(value, { maximumFractionDigits: 1 })}%`
}

function ConcernItem({ concern, rank }: { concern: CompanyConcernDto; rank: number }) {
  const t = useMessages().companyPanel
  const texts = t.concerns[concern.concern]

  return (
    <li className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {rank}
          </div>
          <div>
            <p className="font-medium">{texts.title}</p>
            <p className="text-sm text-muted-foreground">{texts.description}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-semibold">{formatPercentage(concern.percentage)}</p>
          <p className="text-xs text-muted-foreground">
            {t.affectedOf(
              concern.affectedEmployees,
              concern.evaluatedEmployees,
              texts.evaluated(concern.evaluatedEmployees),
            )}
          </p>
        </div>
      </div>
      <Progress value={concern.percentage} className="h-2" aria-label={`${texts.title}: ${formatPercentage(concern.percentage)}`} />
    </li>
  )
}

/** Principales preocupaciones financieras de la plantilla, agregadas y anónimas (HU-61). */
export function FinancialConcernsCard({ insights, isLoading, hasFailed }: CompanyInsightsState) {
  const t = useMessages().companyPanel
  const ready = !isLoading && !hasFailed && insights?.period && !insights.isAnonymized ? insights : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.concernsTitle}</CardTitle>
        <CardDescription>
          {ready?.period && ready.measuredEmployees !== null
            ? t.measured(monthAndYear(ready.period), ready.measuredEmployees)
            : t.concernsDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4" data-testid="financial-concerns-loading">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : hasFailed || !insights ? (
          <EmptyNotice>{t.concernsLoadFailed}</EmptyNotice>
        ) : !insights.period ? (
          <EmptyNotice>{t.noClosedMonthsToAnalyze}</EmptyNotice>
        ) : insights.isAnonymized ? (
          <AnonymizedNotice period={insights.period} minimumGroupSize={insights.minimumGroupSize} />
        ) : insights.concerns.length === 0 ? (
          <EmptyNotice>{t.noConcerns(monthAndYear(insights.period), insights.minimumGroupSize)}</EmptyNotice>
        ) : (
          <ol className="space-y-5">
            {insights.concerns.map((concern, index) => (
              <ConcernItem key={concern.concern} concern={concern} rank={index + 1} />
            ))}
          </ol>
        )}
      </CardContent>
      {ready && (
        <CardFooter className="text-xs text-muted-foreground">
          {t.concernsFooter(ready.minimumGroupSize)}
        </CardFooter>
      )}
    </Card>
  )
}
