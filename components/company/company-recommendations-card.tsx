"use client"

import { InfoIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RecommendationList } from "@/components/recommendations/recommendation-list"
import { useMessages } from "@/lib/i18n"
import { AnonymizedNotice, EmptyNotice, monthAndYear, type CompanyInsightsState } from "./company-insights-state"

/** Recomendaciones de FinGrow-AI para acompañar a la plantilla, sin links: son acciones fuera de FinGrow (HU-64). */
export function CompanyRecommendationsCard({ insights, isLoading, hasFailed }: CompanyInsightsState) {
  const t = useMessages().companyPanel
  const ready =
    !isLoading && !hasFailed && insights?.period && !insights.isAnonymized && insights.recommendationsAvailable
      ? insights
      : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.recommendationsTitle}</CardTitle>
        <CardDescription>{t.recommendationsDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3" data-testid="company-recommendations-loading">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : hasFailed || !insights ? (
          <EmptyNotice>{t.recommendationsLoadFailed}</EmptyNotice>
        ) : !insights.period ? (
          <EmptyNotice>{t.noClosedMonthsToAnalyze}</EmptyNotice>
        ) : insights.isAnonymized ? (
          <AnonymizedNotice period={insights.period} minimumGroupSize={insights.minimumGroupSize} />
        ) : !insights.recommendationsAvailable ? (
          <EmptyNotice>{t.recommendationsUnavailable}</EmptyNotice>
        ) : (
          <RecommendationList recommendations={insights.recommendations} showLinks={false} />
        )}
      </CardContent>
      {ready?.period && (
        <CardFooter className="flex items-start gap-2 text-xs text-muted-foreground">
          <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
          <p>{t.recommendationsFooter(monthAndYear(ready.period))}</p>
        </CardFooter>
      )}
    </Card>
  )
}
