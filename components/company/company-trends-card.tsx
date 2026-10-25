"use client"

import { useEffect, useState } from "react"
import { InfoIcon, ShieldCheckIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getCompanyTrends, type CompanyTrendDto, type CompanyTrendsDto, type CompanyTrendUnit } from "@/lib/api"
import { formatDateText, formatNumber } from "@/lib/format"
import { useMessages, type Messages } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { EmptyNotice } from "./company-insights-state"

type TrendsState = { status: "loading" } | { status: "ready"; trends: CompanyTrendsDto } | { status: "error" }

type Tone = "positive" | "opportunity"

const fractionDigits: Record<CompanyTrendUnit, number> = { Percentage: 1, Points: 2, Count: 0 }

function monthAndYear(period: string) {
  return formatDateText(period, { month: "long", year: "numeric" })
}

export function formatTrendValue(value: number, unit: CompanyTrendUnit) {
  return formatNumber(value, { maximumFractionDigits: fractionDigits[unit] })
}

export function formatTrendChange(change: number, unit: CompanyTrendUnit) {
  return `${change > 0 ? "+" : "-"}${formatTrendValue(Math.abs(change), unit)}`
}

function TrendItem({ trend, tone, texts }: { trend: CompanyTrendDto; tone: Tone; texts: Messages["companyTrends"] }) {
  const Icon = trend.change > 0 ? TrendingUpIcon : TrendingDownIcon
  const value = (amount: number) => texts.values[trend.unit](formatTrendValue(amount, trend.unit))

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3",
        tone === "positive" ? "border-success/20 bg-success/10" : "border-amber-500/20 bg-amber-500/10",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-5 shrink-0",
          tone === "positive" ? "text-success" : "text-amber-600 dark:text-amber-400",
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium">{texts.indicators[trend.indicator]}</p>
          <span className="shrink-0 text-sm font-semibold">{texts.changes[trend.unit](formatTrendChange(trend.change, trend.unit))}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {texts.fromTo(value(trend.previousValue), value(trend.currentValue))}
        </p>
      </div>
    </li>
  )
}

function TrendSection({
  title,
  empty,
  trends,
  tone,
  texts,
}: {
  title: string
  empty: string
  trends: CompanyTrendDto[]
  tone: Tone
  texts: Messages["companyTrends"]
}) {
  return (
    <section aria-label={title} className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {trends.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {trends.map((trend) => (
            <TrendItem key={trend.indicator} trend={trend} tone={tone} texts={texts} />
          ))}
        </ul>
      )}
    </section>
  )
}

/** Las dos listas de tendencias o el aviso que corresponda. También la usa el PDF del reporte (HU-65). */
export function TrendsContent({ trends, texts }: { trends: CompanyTrendsDto; texts: Messages["companyTrends"] }) {
  if (!trends.period) return <EmptyNotice>{texts.noPeriod}</EmptyNotice>

  if (!trends.previousPeriod) return <EmptyNotice>{texts.noPreviousPeriod(monthAndYear(trends.period))}</EmptyNotice>

  if (trends.isAnonymized) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" />
        <span>{texts.anonymized(trends.minimumGroupSize)}</span>
      </div>
    )
  }

  if (trends.positiveTrends.length === 0 && trends.opportunities.length === 0) {
    return (
      <EmptyNotice>{texts.noChanges(monthAndYear(trends.period), monthAndYear(trends.previousPeriod))}</EmptyNotice>
    )
  }

  return (
    <div className="space-y-6">
      <TrendSection
        title={texts.positiveTitle}
        empty={texts.noPositive}
        trends={trends.positiveTrends}
        tone="positive"
        texts={texts}
      />
      <TrendSection
        title={texts.opportunitiesTitle}
        empty={texts.noOpportunities}
        trends={trends.opportunities}
        tone="opportunity"
        texts={texts}
      />
    </div>
  )
}

export function CompanyTrendsCard() {
  const texts = useMessages().companyTrends
  const [state, setState] = useState<TrendsState>({ status: "loading" })

  useEffect(() => {
    const controller = new AbortController()

    getCompanyTrends(controller.signal)
      .then((trends) => setState({ status: "ready", trends }))
      .catch(() => {
        if (controller.signal.aborted) return
        setState({ status: "error" })
      })

    return () => controller.abort()
  }, [])

  const compared =
    state.status === "ready" && state.trends.period && state.trends.previousPeriod && !state.trends.isAnonymized
      ? { period: state.trends.period, previousPeriod: state.trends.previousPeriod }
      : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{texts.title}</CardTitle>
        <CardDescription>
          {compared
            ? texts.comparedWith(monthAndYear(compared.period), monthAndYear(compared.previousPeriod))
            : texts.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.status === "loading" ? (
          <div className="space-y-3" data-testid="company-trends-loading">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : state.status === "error" ? (
          <EmptyNotice>{texts.loadFailed}</EmptyNotice>
        ) : (
          <TrendsContent trends={state.trends} texts={texts} />
        )}
      </CardContent>
      {compared && (
        <CardFooter className="flex items-start gap-2 text-xs text-muted-foreground">
          <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
          <p>{texts.footer}</p>
        </CardFooter>
      )}
    </Card>
  )
}
