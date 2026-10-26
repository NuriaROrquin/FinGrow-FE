"use client"

import { DollarSignIcon, TrendingDownIcon, TrendingUpIcon, type LucideIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { MonthAmountDto, MonthlySummaryDto } from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"
import { formatDateText, formatMoney } from "@/lib/format"
import { useMessages } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type Tone = "success" | "destructive" | "primary"

const toneStyles: Record<Tone, { box: string; text: string }> = {
  success: { box: "bg-success/10 border-success/20", text: "text-success" },
  destructive: { box: "bg-destructive/10 border-destructive/20", text: "text-destructive" },
  primary: { box: "bg-primary/10 border-primary/20", text: "text-primary" },
}

interface Highlight {
  label: string
  month: MonthAmountDto | null
  icon: LucideIcon
  tone: Tone
}

function monthLabel(month: MonthAmountDto | null, noData: string): string {
  return month ? formatDateText(new Date(month.year, month.month - 1, 1), { month: "long", year: "numeric" }) : noData
}

function HighlightRow({ highlight, currency }: { highlight: Highlight; currency: Currency }) {
  const t = useMessages().reports
  const Icon = highlight.icon
  const tone = toneStyles[highlight.tone]

  return (
    <div className={cn("flex items-center justify-between gap-3 rounded-lg border p-3", tone.box)}>
      <div className="flex items-center gap-3">
        <Icon className={cn("size-5 shrink-0", tone.text)} />
        <div>
          <p className="font-medium">{highlight.label}</p>
          <p className="text-sm text-muted-foreground first-letter:uppercase">{monthLabel(highlight.month, t.noData)}</p>
        </div>
      </div>
      <span className={cn("font-semibold whitespace-nowrap", tone.text)}>
        {highlight.month ? formatMoney(highlight.month.amount, currency) : "—"}
      </span>
    </div>
  )
}

interface MonthlyHighlightsCardProps {
  summary: MonthlySummaryDto | null
  isLoading: boolean
}

/** Los tres meses destacados de HU-41: los calcula el backend sobre la misma serie del gráfico. */
export function MonthlyHighlightsCard({ summary, isLoading }: MonthlyHighlightsCardProps) {
  const t = useMessages().reports
  const highlights: Highlight[] = summary
    ? [
        { label: t.highestIncomeMonth, month: summary.highlights.highestIncomeMonth, icon: TrendingUpIcon, tone: "success" },
        { label: t.highestExpenseMonth, month: summary.highlights.highestExpenseMonth, icon: TrendingDownIcon, tone: "destructive" },
        { label: t.bestSavingsMonth, month: summary.highlights.bestSavingsMonth, icon: DollarSignIcon, tone: "primary" },
      ]
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.highlightsTitle}</CardTitle>
        <CardDescription>{summary ? t.highlightsDescriptionIn(summary.currency) : t.highlightsDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && !summary ? (
          <Skeleton className="h-[220px] w-full" />
        ) : !summary || summary.months.length === 0 ? (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            {summary ? t.noMovements(summary.currency) : t.highlightsLoadFailed}
          </p>
        ) : (
          <div className="space-y-4">
            {highlights.map((highlight) => (
              <HighlightRow key={highlight.label} highlight={highlight} currency={summary.currency} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
