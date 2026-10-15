"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { MonthlySummaryDto } from "@/lib/api"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"

function monthsLabel(count: number): string {
  return count === 1 ? "En 1 mes con datos" : `En ${count} meses con datos`
}

interface SummaryCard {
  label: string
  amount: number | null
  detail: string
  tone: "success" | "plain" | "signed"
}

function buildCards(summary: MonthlySummaryDto): SummaryCard[] {
  const detail = monthsLabel(summary.months.length)

  return [
    { label: "Ingresos Totales", amount: summary.totalIncome, detail, tone: "success" },
    { label: "Gastos Totales", amount: summary.totalExpenses, detail, tone: "plain" },
    { label: "Ahorros Totales", amount: summary.totalSavings, detail, tone: "signed" },
    { label: "Ahorro Mensual Promedio", amount: summary.averageMonthlySavings, detail: "Por mes", tone: "signed" },
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
    ? buildCards(summary)
    : ["Ingresos Totales", "Gastos Totales", "Ahorros Totales", "Ahorro Mensual Promedio"].map((label): SummaryCard => ({
        label,
        amount: null,
        detail: "Sin datos",
        tone: "plain",
      }))

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
