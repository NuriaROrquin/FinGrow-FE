"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertCircleIcon, CheckCircleIcon, InboxIcon, ShieldCheckIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  getDepartmentMetrics,
  toastApiError,
  type DepartmentMetricsSummary,
  type HealthBand,
} from "@/lib/api"

export const healthBandLabels: Record<HealthBand, string> = {
  Critical: "Crítica",
  Fragile: "Frágil",
  Stable: "Estable",
  Healthy: "Saludable",
}

const NOT_AVAILABLE = "—"

type DepartmentMetricsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; departments: DepartmentMetricsSummary[] }

function formatNumber(value: number, maximumFractionDigits: number) {
  return value.toLocaleString("es-AR", { maximumFractionDigits })
}

function HealthBandBadge({ band }: { band: HealthBand | null }) {
  const label = band ? healthBandLabels[band] : undefined
  if (!band || !label) return <span className="text-muted-foreground">{NOT_AVAILABLE}</span>

  if (band === "Healthy") {
    return (
      <Badge>
        <CheckCircleIcon className="size-3 mr-1" />
        {label}
      </Badge>
    )
  }

  if (band === "Stable") return <Badge variant="outline">{label}</Badge>

  return (
    <Badge variant={band === "Critical" ? "destructive" : "secondary"}>
      <AlertCircleIcon className="size-3 mr-1" />
      {label}
    </Badge>
  )
}

function DepartmentRow({ department }: { department: DepartmentMetricsSummary }) {
  const hasNoData = !department.isMetricsHidden && department.period === null

  return (
    <TableRow data-testid="department-metrics-row">
      <TableCell className="font-medium">{department.departmentName}</TableCell>

      {department.isMetricsHidden ? (
        <TableCell colSpan={4} className="whitespace-normal">
          <div className="flex items-start gap-2 text-sm text-muted-foreground" role="status">
            <ShieldCheckIcon className="size-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Métricas restringidas</p>
              {department.hiddenReason && <p>{department.hiddenReason}</p>}
              <p>Se requiere un mínimo de {department.minimumGroupSize} empleados.</p>
            </div>
          </div>
        </TableCell>
      ) : hasNoData ? (
        <TableCell colSpan={4}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <InboxIcon className="size-4 shrink-0" />
            <span>Sin datos disponibles</span>
          </div>
        </TableCell>
      ) : (
        <>
          <TableCell>{department.employees === null ? NOT_AVAILABLE : formatNumber(department.employees, 0)}</TableCell>
          <TableCell>
            {department.averageScore === null ? (
              <span className="text-muted-foreground">{NOT_AVAILABLE}</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-semibold whitespace-nowrap">{formatNumber(department.averageScore, 2)}/100</span>
                <Progress value={department.averageScore} className="h-2 w-20" />
              </div>
            )}
          </TableCell>
          <TableCell>
            {department.participation === null ? NOT_AVAILABLE : `${formatNumber(department.participation, 2)}%`}
          </TableCell>
          <TableCell>
            <HealthBandBadge band={department.status} />
          </TableCell>
        </>
      )}
    </TableRow>
  )
}

export function DepartmentMetricsSection() {
  const [state, setState] = useState<DepartmentMetricsState>({ status: "loading" })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    getDepartmentMetrics({}, controller.signal)
      .then((departments) => setState({ status: "ready", departments }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setState({ status: "error" })
        toastApiError(error, "No se pudieron cargar las métricas por departamento.")
      })

    return () => controller.abort()
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: "loading" })
    setAttempt((current) => current + 1)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desglose por Departamento</CardTitle>
        <CardDescription>Métricas de bienestar financiero por departamento</CardDescription>
      </CardHeader>
      <CardContent>
        {state.status === "loading" && (
          <div className="space-y-3" data-testid="department-metrics-loading">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {state.status === "error" && (
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground" role="alert">
            <AlertCircleIcon className="size-4 shrink-0" />
            <span>No se pudieron cargar las métricas por departamento.</span>
            <Button variant="outline" size="sm" onClick={retry}>
              Reintentar
            </Button>
          </div>
        )}

        {state.status === "ready" && state.departments.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay departamentos disponibles</p>
        )}

        {state.status === "ready" && state.departments.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Departamento</TableHead>
                <TableHead>Empleados</TableHead>
                <TableHead>Puntaje Promedio</TableHead>
                <TableHead>Participación</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.departments.map((department) => (
                <DepartmentRow key={department.departmentId} department={department} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
