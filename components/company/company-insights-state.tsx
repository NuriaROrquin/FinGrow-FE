"use client"

import { ShieldCheckIcon } from "lucide-react"
import type { CompanyInsightsDto } from "@/lib/api"

/** Lo que la página pide una sola vez a `GET /api/company/metrics/insights` y comparten las dos tarjetas. */
export interface CompanyInsightsState {
  insights: CompanyInsightsDto | null
  isLoading: boolean
  hasFailed: boolean
}

export function monthAndYear(period: string) {
  const [year, month] = period.split("-").map(Number)
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1))
}

export function EmptyNotice({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">{children}</p>
}

export function AnonymizedNotice({ period, minimumGroupSize }: { period: string; minimumGroupSize: number }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
      <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" />
      <span>
        En {monthAndYear(period)} menos de {minimumGroupSize} empleados tuvieron actividad suficiente para medir su
        salud financiera. Se muestra cuando hay suficientes para no identificar a nadie.
      </span>
    </div>
  )
}
