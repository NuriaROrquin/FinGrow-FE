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
import { plural } from "@/lib/utils"
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

function toDate(period: string) {
  const [year, month] = period.split("-").map(Number)
  return new Date(year, month - 1, 1)
}

function monthAndYear(period: string) {
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(toDate(period))
}

function monthName(period: string) {
  return new Intl.DateTimeFormat("es-AR", { month: "long" }).format(toDate(period))
}

function formatScore(value: number) {
  return value.toLocaleString("es-AR", { maximumFractionDigits: 2 })
}

function ScoreChange({ change, previousPeriod }: { change: number; previousPeriod: string }) {
  const versus = `vs. ${monthName(previousPeriod)}`

  if (change === 0) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <MinusIcon className="size-4" />
        <span>Sin cambios {versus}</span>
      </div>
    )
  }

  const points = `${Math.abs(change).toLocaleString("es-AR", { maximumFractionDigits: 1 })} ${plural(Math.abs(change), "punto", "puntos")}`

  return change > 0 ? (
    <div className="flex items-center gap-1 text-success">
      <TrendingUpIcon className="size-4" />
      <span>
        +{points} {versus}
      </span>
    </div>
  ) : (
    <div className="flex items-center gap-1 text-destructive">
      <TrendingDownIcon className="size-4" />
      <span>
        −{points} {versus}
      </span>
    </div>
  )
}

export function FinancialHealthCard() {
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
        toastApiError(error, "No se pudo cargar la salud financiera promedio.")
      })

    return () => controller.abort()
  }, [])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>Salud Financiera Promedio</CardDescription>
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

        {state.status === "error" && <p className="text-sm text-muted-foreground">No disponible</p>}

        {state.status === "noPeriods" && (
          <p className="text-sm text-muted-foreground">Todavía no hay meses cerrados para calcularla.</p>
        )}

        {state.status === "hidden" && (
          <div className="flex items-start gap-1 text-sm text-muted-foreground">
            <ShieldCheckIcon className="size-4 mt-0.5 shrink-0" />
            <span>
              Se muestra cuando hay suficientes empleados con actividad para calcularla sin identificar a nadie.
            </span>
          </div>
        )}

        {state.status === "ready" && (
          <div className="space-y-1 text-sm text-muted-foreground">
            {state.change !== null && state.previousPeriod && (
              <ScoreChange change={state.change} previousPeriod={state.previousPeriod} />
            )}
            <p>Promedio de {monthAndYear(state.period)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
