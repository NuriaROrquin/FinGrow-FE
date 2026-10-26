"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { MonthlySummaryDto } from "@/lib/api"
import { formatMoney } from "@/lib/format"
import { useMessages, type Messages } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useIsReportExport } from "./report-export-context"

interface SummaryCard {
  label: string
  amount: number | null
  detail: string
  tone: "success" | "plain" | "signed"
}

function buildCards(summary: MonthlySummaryDto, t: Messages["reports"]): SummaryCard[] {
  const detail = t.monthsWithData(summary.months.length)

  return [
    { label: t.totalIncome, amount: summary.totalIncome, detail, tone: "success" },
    { label: t.totalExpenses, amount: summary.totalExpenses, detail, tone: "plain" },
    { label: t.totalSavings, amount: summary.totalSavings, detail, tone: "signed" },
    { label: t.averageMonthlySavings, amount: summary.averageMonthlySavings, detail: t.perMonth, tone: "signed" },
  ]
}

function toneClass(card: SummaryCard): string | undefined {
  if (card.amount === null || card.tone === "plain") return undefined
  if (card.tone === "success") return "text-success"
  return card.amount < 0 ? "text-destructive" : "text-success"
}

interface ReportSummaryCardsProps {
  summary: MonthlySummaryDto | null
  isLoading: boolean
}

export function ReportSummaryCards({ summary, isLoading }: ReportSummaryCardsProps) {
  const t = useMessages().reports
  const isExport = useIsReportExport()

  if (isLoading && !summary) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[124px] w-full" />
        ))}
      </div>
    )
  }

  const cards: SummaryCard[] = summary
    ? buildCards(summary, t)
    : [t.totalIncome, t.totalExpenses, t.totalSavings, t.averageMonthlySavings].map((label): SummaryCard => ({
        label,
        amount: null,
        detail: t.noData,
        tone: "plain",
      }))

  return (
    <div className={cn("grid gap-4", isExport ? "grid-cols-2" : "md:grid-cols-2 lg:grid-cols-4")}>
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-2">
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className={cn("text-2xl", toneClass(card))}>
              {card.amount !== null && summary ? formatMoney(card.amount, summary.currency) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{card.detail}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
