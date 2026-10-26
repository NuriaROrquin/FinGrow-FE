"use client"

import { useEffect, useState } from "react"
import { MinusIcon, ShieldCheckIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getCompanyMetrics,
  isApiError,
  toastApiError,
  type CompanyMetricsDto,
  type HealthBand,
} from "@/lib/api"
import { formatDateText, formatNumber } from "@/lib/format"
import { useMessages } from "@/lib/i18n"
import { HealthBandBadge } from "./department-metrics-section"

const ANONYMIZED_ERROR_CODE = "Metrics.Anonymized"

type FinancialHealthState =
  | { status: "loading" }
  | {
      status: "ready"
      period: string
      score: number
      band: HealthBand
      change: number | null
      previousPeriod: string | null
    }
  | { status: "hidden" }
  | { status: "noPeriods" }
  | { status: "error" }

function toState(metrics: CompanyMetricsDto[]): FinancialHealthState {
  const periods = [...metrics].sort((first, second) => first.period.localeCompare(second.period))
  const latest = periods[periods.length - 1]

  if (!latest) return { status: "noPeriods" }
  if (latest.isMetricsHidden || latest.averageFinancialHealthScore === null || latest.financialHealthBand === null) {
    return { status: "hidden" }
  }

  const previous = [...periods]
    .slice(0, -1)
    .reverse()
    .find((period) => !period.isMetricsHidden && period.averageFinancialHealthScore !== null)
  const change =
    previous?.averageFinancialHealthScore != null
      ? Math.round((latest.averageFinancialHealthScore - previous.averageFinancialHealthScore) * 10) / 10
      : null

  return {
    status: "ready",
    period: latest.period,
    score: latest.averageFinancialHealthScore,
    band: latest.financialHealthBand,
    change,
    previousPeriod: change === null ? null : previous?.period ?? null,
  }
}

function monthAndYear(period: string) {
  return formatDateText(period, { month: "long", year: "numeric" })
}

function monthName(period: string) {
  return formatDateText(period, { month: "long" })
}

function formatScore(value: number) {
  return formatNumber(value, { maximumFractionDigits: 2 })
}

function ScoreChange({ change, previousPeriod }: { change: number; previousPeriod: string }) {
  const t = useMessages().companyPanel
  const month = monthName(previousPeriod)

  if (change === 0) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <MinusIcon className="size-4" />
        <span>{t.noChanges(month)}</span>
      </div>
    )
  }

  const points = t.pointsVersus(formatNumber(Math.abs(change), { maximumFractionDigits: 1 }), Math.abs(change), month)

  return change > 0 ? (
    <div className="flex items-center gap-1 text-success">
      <TrendingUpIcon className="size-4" />
      <span>+{points}</span>
    </div>
  ) : (
    <div className="flex items-center gap-1 text-destructive">
      <TrendingDownIcon className="size-4" />
      <span>−{points}</span>
    </div>
  )
}

export function FinancialHealthCard() {
  const t = useMessages().companyPanel
  const [state, setState] = useState<FinancialHealthState>({ status: "loading" })

  useEffect(() => {
    const controller = new AbortController()

    getCompanyMetrics({}, controller.signal)
      .then((metrics) => setState(toState(metrics)))
      .catch((error) => {
        if (controller.signal.aborted) return

        if (isApiError(error) && error.code === ANONYMIZED_ERROR_CODE) {
          setState({ status: "hidden" })
          return
        }

        setState({ status: "error" })
        toastApiError(error, t.healthLoadFailed)
      })

    return () => controller.abort()
  }, [t])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{t.averageHealth}</CardDescription>
        <CardTitle className="text-2xl">
          {state.status === "loading" ? (
            <Skeleton className="h-8 w-20" />
          ) : state.status === "ready" ? (
            <div className="flex flex-wrap items-center gap-2">
              <span>{formatScore(state.score)}/100</span>
              <HealthBandBadge band={state.band} />
            </div>
          ) : (
            "—"
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {state.status === "loading" && <Skeleton className="h-5 w-full" />}

        {state.status === "error" && <p className="text-sm text-muted-foreground">{t.notAvailable}</p>}

        {state.status === "noPeriods" && (
          <p className="text-sm text-muted-foreground">{t.noClosedMonths}</p>
        )}

        {state.status === "hidden" && (
          <div className="flex items-start gap-1 text-sm text-muted-foreground">
            <ShieldCheckIcon className="size-4 mt-0.5 shrink-0" />
            <span>{t.healthHidden}</span>
          </div>
        )}

        {state.status === "ready" && (
          <div className="space-y-1 text-sm text-muted-foreground">
            {state.change !== null && state.previousPeriod && (
              <ScoreChange change={state.change} previousPeriod={state.previousPeriod} />
            )}
            <p>{t.averageOf(monthAndYear(state.period))}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
