"use client"

import { InfoIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RecommendationList } from "@/components/recommendations/recommendation-list"
import type { FinancialRecommendationDto } from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"
import { useIsReportExport } from "./report-export-context"

interface FinancialRecommendationsCardProps {
  recommendations: FinancialRecommendationDto[]
  available: boolean
  hasMovements: boolean
  currency: Currency
}

export function FinancialRecommendationsCard({
  recommendations,
  available,
  hasMovements,
  currency,
}: FinancialRecommendationsCardProps) {
  const isExport = useIsReportExport()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis y Recomendaciones</CardTitle>
        <CardDescription>Basado en tus datos financieros del período</CardDescription>
      </CardHeader>
      <CardContent>
        {!available ? (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            No pudimos generar recomendaciones ahora. Probá de nuevo más tarde.
          </p>
        ) : !hasMovements ? (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            Cuando registres movimientos en {currency} en este período, vas a ver recomendaciones sobre ellos.
          </p>
        ) : (
          <RecommendationList recommendations={recommendations} showLinks={!isExport} />
        )}
      </CardContent>
      <CardFooter className="flex items-start gap-2 text-xs text-muted-foreground">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
        <p>
          Estas recomendaciones se generan automáticamente a partir de tus movimientos. Son orientativas y no
          constituyen asesoramiento financiero certificado.
        </p>
      </CardFooter>
    </Card>
  )
}
