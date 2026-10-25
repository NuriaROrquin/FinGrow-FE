"use client"

import { InfoIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RecommendationList } from "@/components/recommendations/recommendation-list"
import type { FinancialRecommendationDto } from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"
import { useMessages } from "@/lib/i18n"
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
  const t = useMessages().reports
  const isExport = useIsReportExport()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.recommendationsTitle}</CardTitle>
        <CardDescription>{t.recommendationsDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {!available ? (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            {t.noRecommendations}
          </p>
        ) : !hasMovements ? (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            {t.noMovementsForRecommendations(currency)}
          </p>
        ) : (
          <RecommendationList recommendations={recommendations} showLinks={!isExport} />
        )}
      </CardContent>
      <CardFooter className="flex items-start gap-2 text-xs text-muted-foreground">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
        <p>{t.recommendationsDisclaimer}</p>
      </CardFooter>
    </Card>
  )
}
