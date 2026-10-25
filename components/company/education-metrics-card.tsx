"use client"

import { useEffect, useState } from "react"
import { GraduationCapIcon, ShieldCheckIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getCompanyEducationMetrics,
  isApiError,
  toastApiError,
  type CompanyEducationMetricsResponse,
} from "@/lib/api"
import { formatNumber } from "@/lib/format"
import { useMessages } from "@/lib/i18n"

const ANONYMIZED_ERROR_CODE = "Metrics.Anonymized"

type EducationMetricsState =
  | { status: "loading" }
  | { status: "ready"; metrics: CompanyEducationMetricsResponse }
  | { status: "noCourses" }
  | { status: "anonymized" }
  | { status: "error" }

function toEducationMetrics(value: unknown): CompanyEducationMetricsResponse | null {
  if (typeof value !== "object" || value === null) return null

  const metrics = value as Record<string, unknown>

  if (
    typeof metrics.totalCompletedCourses !== "number" ||
    typeof metrics.satisfactionPercentage !== "number" ||
    typeof metrics.last30DaysCompletedCourses !== "number"
  ) {
    return null
  }

  return {
    totalCompletedCourses: metrics.totalCompletedCourses,
    satisfactionPercentage: metrics.satisfactionPercentage,
    last30DaysCompletedCourses: metrics.last30DaysCompletedCourses,
  }
}

function formatCount(value: number) {
  return formatNumber(value)
}

function formatPercentage(value: number) {
  return `${formatNumber(value, { maximumFractionDigits: 1 })}%`
}

export function EducationMetricsCard() {
  const t = useMessages().companyPanel
  const [state, setState] = useState<EducationMetricsState>({ status: "loading" })

  useEffect(() => {
    const controller = new AbortController()

    getCompanyEducationMetrics(controller.signal)
      .then((response) => {
        const metrics = toEducationMetrics(response)
        setState(metrics && metrics.totalCompletedCourses > 0 ? { status: "ready", metrics } : { status: "noCourses" })
      })
      .catch((error) => {
        if (controller.signal.aborted) return

        if (isApiError(error) && error.code === ANONYMIZED_ERROR_CODE) {
          setState({ status: "anonymized" })
          return
        }

        setState({ status: "error" })
        toastApiError(error, t.educationLoadFailed)
      })

    return () => controller.abort()
  }, [t])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{t.completedCourses}</CardDescription>
        <CardTitle className="text-2xl">
          {state.status === "loading" ? (
            <Skeleton className="h-8 w-20" />
          ) : state.status === "ready" ? (
            formatCount(state.metrics.totalCompletedCourses)
          ) : (
            "—"
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {state.status === "loading" && <Skeleton className="h-5 w-full" />}

        {state.status === "error" && <p className="text-sm text-muted-foreground">{t.notAvailable}</p>}

        {state.status === "noCourses" && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <GraduationCapIcon className="size-4" />
            <span>{t.noCompletedCourses}</span>
          </div>
        )}

        {state.status === "anonymized" && (
          <div className="flex items-start gap-1 text-sm text-muted-foreground">
            <ShieldCheckIcon className="size-4 mt-0.5 shrink-0" />
            <span>{t.educationAnonymized}</span>
          </div>
        )}

        {state.status === "ready" && (
          <div className="space-y-1 text-sm text-muted-foreground">
            {state.metrics.satisfactionPercentage !== null && (
              <p>{t.satisfaction(formatPercentage(state.metrics.satisfactionPercentage))}</p>
            )}
            <div className="flex items-center gap-1">
              <GraduationCapIcon className="size-4" />
              <span>{t.completedLast30Days(formatCount(state.metrics.last30DaysCompletedCourses))}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
