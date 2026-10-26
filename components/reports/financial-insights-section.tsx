"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { FinancialRecommendationsCard } from "@/components/reports/financial-recommendations-card"
import { FinancialSummaryCard } from "@/components/reports/financial-summary-card"
import type { FinancialInsightsDto, InsightsEligibilityDto } from "@/lib/api"
import { useMessages, type Messages } from "@/lib/i18n"

function currentMonthStatus(eligibility: InsightsEligibilityDto, t: Messages["reports"]): string {
  const { currentMonthTransactions, requiredTransactions, currentMonthHasIncome } = eligibility

  if (currentMonthTransactions >= requiredTransactions && currentMonthHasIncome) {
    return t.monthCounts
  }

  if (currentMonthTransactions >= requiredTransactions) {
    return t.monthNeedsIncome(requiredTransactions)
  }

  return t.monthProgress(currentMonthTransactions, requiredTransactions, currentMonthHasIncome)
}

function NotEnoughHistory({ eligibility }: { eligibility: InsightsEligibilityDto }) {
  const t = useMessages().reports
  const missingMonths = Math.max(0, eligibility.requiredActiveMonths - eligibility.activeMonths)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.recommendationsTitle}</CardTitle>
        <CardDescription>{t.notEnoughHistoryDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          {t.notEnoughHistory(eligibility.requiredActiveMonths, eligibility.requiredTransactions, missingMonths)}
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{t.activeMonths}</span>
            <span>{t.countOf(eligibility.activeMonths, eligibility.requiredActiveMonths)}</span>
          </div>
          <Progress
            value={Math.min(100, (eligibility.activeMonths / eligibility.requiredActiveMonths) * 100)}
            className="h-2"
          />
        </div>
        <p className="text-sm text-muted-foreground">{currentMonthStatus(eligibility, t)}</p>
      </CardContent>
    </Card>
  )
}

interface FinancialInsightsSectionProps {
  insights: FinancialInsightsDto | null
  isLoading: boolean
}

export function FinancialInsightsSection({ insights, isLoading }: FinancialInsightsSectionProps) {
  const t = useMessages().reports

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t.insightsTitle}</h2>
        <p className="text-sm text-muted-foreground">{t.insightsDescription}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <>
            <Skeleton className="h-[360px] w-full" />
            <Skeleton className="h-[360px] w-full" />
          </>
        ) : !insights ? (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground md:col-span-2">
            {t.insightsLoadFailed}
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
