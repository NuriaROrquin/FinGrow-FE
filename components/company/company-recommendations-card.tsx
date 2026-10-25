"use client"

import { InfoIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RecommendationList } from "@/components/recommendations/recommendation-list"
import { AnonymizedNotice, EmptyNotice, monthAndYear, type CompanyInsightsState } from "./company-insights-state"

/** Recomendaciones de FinGrow-AI para acompañar a la plantilla, sin links: son acciones fuera de FinGrow (HU-64). */
export function CompanyRecommendationsCard({ insights, isLoading, hasFailed }: CompanyInsightsState) {
  const ready =
    !isLoading && !hasFailed && insights?.period && !insights.isAnonymized && insights.recommendationsAvailable
      ? insights
      : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recomendaciones</CardTitle>
        <CardDescription>Acciones para mejorar el bienestar de empleados</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3" data-testid="company-recommendations-loading">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : hasFailed || !insights ? (
          <EmptyNotice>No se pudieron cargar las recomendaciones.</EmptyNotice>
        ) : !insights.period ? (
          <EmptyNotice>Todavía no hay meses cerrados para analizar.</EmptyNotice>
        ) : insights.isAnonymized ? (
          <AnonymizedNotice period={insights.period} minimumGroupSize={insights.minimumGroupSize} />
        ) : !insights.recommendationsAvailable ? (
          <EmptyNotice>
            No pudimos generar recomendaciones ahora. Probá de nuevo más tarde; mientras tanto, los indicadores están
            en Principales Preocupaciones.
          </EmptyNotice>
        ) : (
          <RecommendationList recommendations={insights.recommendations} showLinks={false} />
        )}
      </CardContent>
      {ready?.period && (
        <CardFooter className="flex items-start gap-2 text-xs text-muted-foreground">
          <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
          <p>
            Se generan automáticamente a partir de indicadores agregados y anónimos de {monthAndYear(ready.period)}. Son
            orientativas y no constituyen asesoramiento financiero certificado.
          </p>
        </CardFooter>
      )}
    </Card>
  )
}
