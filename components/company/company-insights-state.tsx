"use client"

import { ShieldCheckIcon } from "lucide-react"
import type { CompanyInsightsDto } from "@/lib/api"
import { formatDateText } from "@/lib/format"
import { useMessages } from "@/lib/i18n"

/** Lo que la página pide una sola vez a `GET /api/company/metrics/insights` y comparten las dos tarjetas. */
export interface CompanyInsightsState {
  insights: CompanyInsightsDto | null
  isLoading: boolean
  hasFailed: boolean
}

export function monthAndYear(period: string) {
  return formatDateText(period, { month: "long", year: "numeric" })
}

export function EmptyNotice({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">{children}</p>
}

export function AnonymizedNotice({ period, minimumGroupSize }: { period: string; minimumGroupSize: number }) {
  const t = useMessages().companyPanel

  return (
    <div className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
      <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" />
      <span>{t.anonymizedInsights(monthAndYear(period), minimumGroupSize)}</span>
    </div>
  )
}
