"use client"

import { useEffect, useState } from "react"
import { ShieldCheckIcon, UsersIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { getCompanyParticipation, toastApiError, type CompanyParticipationDto } from "@/lib/api"
import { plural } from "@/lib/utils"

function monthLabel(periodStart: string) {
  const [year, month] = periodStart.split("-").map(Number)
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1))
}

function formatRate(rate: number) {
  return `${rate.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`
}

function ParticipationDetail({ participation }: { participation: CompanyParticipationDto }) {
  if (participation.isParticipationHidden) {
    return (
      <div className="flex items-start gap-1 text-sm text-muted-foreground">
        <ShieldCheckIcon className="size-4 mt-0.5 shrink-0" />
        <span>
          Se muestra a partir de {participation.minimumGroupSize} empleados activos, para que no se pueda identificar a
          nadie.
        </span>
      </div>
    )
  }

  if (participation.participationRate === null) {
    return <p className="text-sm text-muted-foreground">Todavía no hay empleados activos.</p>
  }

  return (
    <>
      <Progress value={participation.participationRate} className="h-2" />
      <p className="text-sm text-muted-foreground mt-2">
        {participation.participatingEmployees} de {participation.activeEmployees} activos registraron movimientos o
        aportes en {monthLabel(participation.periodStart)}
      </p>
    </>
  )
}

export function ParticipationCards() {
  const [participation, setParticipation] = useState<CompanyParticipationDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    getCompanyParticipation(controller.signal)
      .then(setParticipation)
      .catch((error) => {
        if (!controller.signal.aborted) {
          toastApiError(error, "No se pudieron cargar las métricas de participación.")
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [])

  if (isLoading || !participation) {
    return (
      <>
        {["Total de Empleados", "Tasa de Participación"].map((title) => (
          <Card key={title}>
            <CardHeader className="pb-2">
              <CardDescription>{title}</CardDescription>
              <CardTitle className="text-2xl">{isLoading ? <Skeleton className="h-8 w-20" /> : "—"}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-5 w-full" />
              ) : (
                <p className="text-sm text-muted-foreground">No disponible</p>
              )}
            </CardContent>
          </Card>
        ))}
      </>
    )
  }

  const inactiveEmployees = participation.totalEmployees - participation.activeEmployees

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total de Empleados</CardDescription>
          <CardTitle className="text-2xl">{participation.totalEmployees}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <UsersIcon className="size-4" />
            <span>
              {participation.activeEmployees} {plural(participation.activeEmployees, "activo", "activos")}
              {inactiveEmployees > 0 && ` · ${inactiveEmployees} sin acceso`}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Tasa de Participación</CardDescription>
          <CardTitle className="text-2xl">
            {participation.participationRate === null ? "—" : formatRate(participation.participationRate)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ParticipationDetail participation={participation} />
        </CardContent>
      </Card>
    </>
  )
}
