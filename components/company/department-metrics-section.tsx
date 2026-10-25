"use client"

import { useCallback, useEffect, useId, useMemo, useState } from "react"
import { AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon, InboxIcon, ShieldCheckIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import {
  getDepartmentMetrics,
  toastApiError,
  type DepartmentMetricsSummary,
  type HealthBand,
} from "@/lib/api"
import { compareText, sortRows, toggleSort, type SortAccessors, type SortState } from "@/lib/sort"

export const healthBandLabels: Record<HealthBand, string> = {
  Critical: "Crítica",
  Fragile: "Frágil",
  Stable: "Estable",
  Healthy: "Saludable",
}

const NOT_AVAILABLE = "—"

type DepartmentMetricsSortField = "departmentName" | "employees" | "averageScore" | "participation" | "status"

const healthBandRank: Record<HealthBand, number> = {
  Critical: 0,
  Fragile: 1,
  Stable: 2,
  Healthy: 3,
}

function visibleMetric<Value>(department: DepartmentMetricsSummary, value: Value | null): Value | null {
  return department.isMetricsHidden ? null : value
}

function needsAttention(department: DepartmentMetricsSummary) {
  return department.needsAttention && !department.isMetricsHidden
}

function compareByScore(a: DepartmentMetricsSummary, b: DepartmentMetricsSummary) {
  const left = a.averageFinancialHealthScore ?? Number.POSITIVE_INFINITY
  const right = b.averageFinancialHealthScore ?? Number.POSITIVE_INFINITY
  return left - right || compareText(a.departmentName, b.departmentName)
}

const departmentMetricsSortValues: SortAccessors<DepartmentMetricsSummary, DepartmentMetricsSortField> = {
  departmentName: (department) => department.departmentName,
  employees: (department) => visibleMetric(department, department.activeEmployees),
  averageScore: (department) => visibleMetric(department, department.averageFinancialHealthScore),
  participation: (department) => visibleMetric(department, department.participationRate),
  status: (department) =>
    visibleMetric(
      department,
      department.financialHealthBand === null ? null : healthBandRank[department.financialHealthBand],
    ),
}

type DepartmentMetricsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; departments: DepartmentMetricsSummary[] }

function formatNumber(value: number, maximumFractionDigits: number) {
  return value.toLocaleString("es-AR", { maximumFractionDigits })
}

export function HealthBandBadge({ band }: { band: HealthBand | null }) {
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

function AttentionSummary({ departments }: { departments: DepartmentMetricsSummary[] }) {
  const titleId = useId()
  const departmentsNeedingAttention = departments.filter(needsAttention).sort(compareByScore)
  const hasVisibleBand = departments.some(
    (department) => !department.isMetricsHidden && department.financialHealthBand !== null,
  )

  if (departmentsNeedingAttention.length === 0) {
    if (!hasVisibleBand) return null

    return (
      <div
        className="mb-4 flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 p-3 text-sm"
        role="status"
        data-testid="departments-attention-none"
      >
        <CheckCircleIcon className="size-4 shrink-0 text-success" />
        <span>Ningún departamento está en banda crítica o frágil.</span>
      </div>
    )
  }

  return (
    <section
      aria-labelledby={titleId}
      className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4"
      data-testid="departments-attention"
    >
      <div className="flex items-center gap-2">
        <AlertTriangleIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <h3 id={titleId} className="font-medium">
          Necesitan atención ({departmentsNeedingAttention.length})
        </h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Departamentos con el puntaje promedio en banda crítica o frágil, del más bajo al más alto.
      </p>
      <ul className="mt-3 space-y-2">
        {departmentsNeedingAttention.map((department) => (
          <li
            key={department.departmentId}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm"
            data-testid="department-attention-item"
          >
            <span className="font-medium">{department.departmentName}</span>
            <span className="flex flex-wrap items-center gap-3">
              {department.averageFinancialHealthScore !== null && (
                <span className="font-semibold whitespace-nowrap">
                  {formatNumber(department.averageFinancialHealthScore, 2)}/100
                </span>
              )}
              {department.participationRate !== null && (
                <span className="text-muted-foreground whitespace-nowrap">
                  {formatNumber(department.participationRate, 2)}% de participación
                </span>
              )}
              <HealthBandBadge band={department.financialHealthBand} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function DepartmentRow({ department }: { department: DepartmentMetricsSummary }) {
  const hasNoData = !department.isMetricsHidden && department.period === null
  const isHighlighted = needsAttention(department)

  return (
    <TableRow
      data-testid="department-metrics-row"
      data-needs-attention={isHighlighted || undefined}
      className={isHighlighted ? "bg-amber-500/10 hover:bg-amber-500/15" : undefined}
    >
      <TableCell className="font-medium">
        {isHighlighted ? (
          <span className="flex items-center gap-2">
            <AlertTriangleIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            {department.departmentName}
            <span className="sr-only">(necesita atención)</span>
          </span>
        ) : (
          department.departmentName
        )}
      </TableCell>

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
          <TableCell>
            {department.activeEmployees === null ? NOT_AVAILABLE : formatNumber(department.activeEmployees, 0)}
          </TableCell>
          <TableCell>
            {department.averageFinancialHealthScore === null ? (
              <span className="text-muted-foreground">{NOT_AVAILABLE}</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-semibold whitespace-nowrap">
                  {formatNumber(department.averageFinancialHealthScore, 2)}/100
                </span>
                <Progress value={department.averageFinancialHealthScore} className="h-2 w-20" />
              </div>
            )}
          </TableCell>
          <TableCell>
            {department.participationRate === null ? NOT_AVAILABLE : `${formatNumber(department.participationRate, 2)}%`}
          </TableCell>
          <TableCell>
            <HealthBandBadge band={department.financialHealthBand} />
          </TableCell>
        </>
      )}
    </TableRow>
  )
}

export function DepartmentMetricsSection() {
  const [state, setState] = useState<DepartmentMetricsState>({ status: "loading" })
  const [attempt, setAttempt] = useState(0)
  const [sort, setSort] = useState<SortState<DepartmentMetricsSortField> | null>(null)

  const departments = useMemo(
    () =>
      state.status === "ready"
        ? sortRows(state.departments, sort, departmentMetricsSortValues, (a, b) =>
            compareText(a.departmentName, b.departmentName),
          )
        : [],
    [state, sort],
  )

  const handleSort = (field: DepartmentMetricsSortField) =>
    setSort((current) => toggleSort(current, field, ["employees", "averageScore", "participation"]))

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
          <AttentionSummary departments={state.departments} />
        )}

        {state.status === "ready" && state.departments.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead label="Departamento" field="departmentName" sort={sort} onSort={handleSort} />
                <SortableTableHead label="Empleados" field="employees" sort={sort} onSort={handleSort} />
                <SortableTableHead label="Puntaje Promedio" field="averageScore" sort={sort} onSort={handleSort} />
                <SortableTableHead label="Participación" field="participation" sort={sort} onSort={handleSort} />
                <SortableTableHead label="Estado" field="status" sort={sort} onSort={handleSort} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <DepartmentRow key={department.departmentId} department={department} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
