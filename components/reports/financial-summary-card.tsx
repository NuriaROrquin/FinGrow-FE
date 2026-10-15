"use client"

import { DollarSignIcon, TrendingDownIcon, TrendingUpIcon, type LucideIcon } from "lucide-react"
import { AchievementMedal } from "@/components/achievements/achievement-medal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { AchievementDto, FinancialHighlightsDto, MonthAmountDto } from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"
import { formatDate, formatDateText, formatMoney, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

type Tone = "success" | "destructive" | "primary"

const toneStyles: Record<Tone, { box: string; text: string }> = {
  success: { box: "bg-success/10 border-success/20", text: "text-success" },
  destructive: { box: "bg-destructive/10 border-destructive/20", text: "text-destructive" },
  primary: { box: "bg-primary/10 border-primary/20", text: "text-primary" },
}

interface Highlight {
  label: string
  detail: string
  amount: string
  icon: LucideIcon
  tone: Tone
}

function monthLabel(month: MonthAmountDto | null): string {
  return month ? formatDateText(new Date(month.year, month.month - 1, 1), { month: "long", year: "numeric" }) : "Sin datos"
}

function buildHighlights(highlights: FinancialHighlightsDto, currency: Currency): Highlight[] {
  if (highlights.monthCount === 1) {
    return [
      {
        label: "Ingresos del Mes",
        detail: "Movimientos confirmados",
        amount: formatMoney(highlights.totalIncome, currency),
        icon: TrendingUpIcon,
        tone: "success",
      },
      {
        label: "Gastos del Mes",
        detail: "Movimientos confirmados",
        amount: formatMoney(highlights.totalExpenses, currency),
        icon: TrendingDownIcon,
        tone: "destructive",
      },
      {
        label: "Ahorro del Mes",
        detail:
          highlights.savingsRate !== null
            ? `${formatNumber(highlights.savingsRate, { maximumFractionDigits: 1 })}% de tus ingresos`
            : "Sin ingresos registrados",
        amount: formatMoney(highlights.totalSavings, currency),
        icon: DollarSignIcon,
        tone: "primary",
      },
    ]
  }

  return [
    {
      label: "Mes con Mayor Ingreso",
      detail: monthLabel(highlights.highestIncomeMonth),
      amount: highlights.highestIncomeMonth ? formatMoney(highlights.highestIncomeMonth.amount, currency) : "—",
      icon: TrendingUpIcon,
      tone: "success",
    },
    {
      label: "Mes con Mayor Gasto",
      detail: monthLabel(highlights.highestExpenseMonth),
      amount: highlights.highestExpenseMonth ? formatMoney(highlights.highestExpenseMonth.amount, currency) : "—",
      icon: TrendingDownIcon,
      tone: "destructive",
    },
    {
      label: "Mejor Mes de Ahorro",
      detail: monthLabel(highlights.bestSavingsMonth),
      amount: highlights.bestSavingsMonth ? formatMoney(highlights.bestSavingsMonth.amount, currency) : "—",
      icon: DollarSignIcon,
      tone: "primary",
    },
  ]
}

interface FinancialSummaryCardProps {
  highlights: FinancialHighlightsDto
  achievements: AchievementDto[]
  currency: Currency
}

export function FinancialSummaryCard({ highlights, achievements, currency }: FinancialSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen Financiero</CardTitle>
        <CardDescription>Hitos del período en {currency}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {highlights.hasMovements ? (
          <div className="space-y-4">
            {buildHighlights(highlights, currency).map((highlight) => {
              const Icon = highlight.icon
              const tone = toneStyles[highlight.tone]

              return (
                <div
                  key={highlight.label}
                  className={cn("flex items-center justify-between gap-3 rounded-lg border p-3", tone.box)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("size-5 shrink-0", tone.text)} />
                    <div>
                      <p className="font-medium">{highlight.label}</p>
                      <p className="text-sm text-muted-foreground first-letter:uppercase">{highlight.detail}</p>
                    </div>
                  </div>
                  <span className={cn("font-semibold whitespace-nowrap", tone.text)}>{highlight.amount}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            No hay movimientos confirmados en {currency} en este período.
          </p>
        )}

        <div className="space-y-3">
          <p className="text-sm font-medium">Logros del período</p>
          {achievements.length > 0 ? (
            <ul className="space-y-3">
              {achievements.map((achievement) => (
                <li key={achievement.code} className="flex items-center gap-3">
                  <AchievementMedal code={achievement.code} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {achievement.description}
                      {achievement.achievedAt ? ` · ${formatDate(achievement.achievedAt)}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Todavía no ganaste logros en este período.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
