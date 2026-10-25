"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircleIcon, CheckCircleIcon, InboxIcon, ShieldCheckIcon } from "lucide-react"
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
import { formatNumber as formatLocaleNumber } from "@/lib/format"
import { useMessages } from "@/lib/i18n"
import { compareText, sortRows, toggleSort, type SortAccessors, type SortState } from "@/lib/sort"

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

const departmentMetricsSortValues: SortAccessors<DepartmentMetricsSummary, DepartmentMetricsSortField> = {
  departmentName: (department) => department.departmentName,
  employees: (department) => visibleMetric(department, department.employees),
  averageScore: (department) => visibleMetric(department, department.averageScore),
  participation: (department) => visibleMetric(department, department.participation),
  status: (department) => visibleMetric(department, department.status && healthBandRank[department.status]),
}

type DepartmentMetricsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; departments: DepartmentMetricsSummary[] }

function formatNumber(value: number, maximumFractionDigits: number) {
  return formatLocaleNumber(value, { maximumFractionDigits })
}

export function HealthBandBadge({ band }: { band: HealthBand | null }) {
  const healthBands = useMessages().labels.healthBands
  const label = band ? healthBands[band] : undefined
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
  const t = useMessages().companyPanel
  const hasNoData = !department.isMetricsHidden && department.period === null

  return (
    <TableRow data-testid="department-metrics-row">
      <TableCell className="font-medium">{department.departmentName}</TableCell>

      {department.isMetricsHidden ? (
        <TableCell colSpan={4} className="whitespace-normal">
          <div className="flex items-start gap-2 text-sm text-muted-foreground" role="status">
            <ShieldCheckIcon className="size-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">{t.restrictedMetrics}</p>
              {department.hiddenReason && <p>{department.hiddenReason}</p>}
              <p>{t.minimumGroup(department.minimumGroupSize)}</p>
            </div>
          </div>
        </TableCell>
      ) : hasNoData ? (
        <TableCell colSpan={4}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <InboxIcon className="size-4 shrink-0" />
            <span>{t.noDataAvailable}</span>
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
  const t = useMessages().companyPanel
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
        toastApiError(error, t.departmentMetricsLoadFailed)
      })

    return () => controller.abort()
  }, [attempt, t])

  const retry = useCallback(() => {
    setState({ status: "loading" })
    setAttempt((current) => current + 1)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.breakdownTitle}</CardTitle>
        <CardDescription>{t.breakdownDescription}</CardDescription>
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
            <span>{t.departmentMetricsLoadFailed}</span>
            <Button variant="outline" size="sm" onClick={retry}>
              {t.retry}
            </Button>
          </div>
        )}

        {state.status === "ready" && state.departments.length === 0 && (
          <p className="text-sm text-muted-foreground">{t.noDepartments}</p>
        )}

        {state.status === "ready" && state.departments.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead label={t.columnDepartment} field="departmentName" sort={sort} onSort={handleSort} />
                <SortableTableHead label={t.columnEmployees} field="employees" sort={sort} onSort={handleSort} />
                <SortableTableHead label={t.columnAverageScore} field="averageScore" sort={sort} onSort={handleSort} />
                <SortableTableHead label={t.columnParticipation} field="participation" sort={sort} onSort={handleSort} />
                <SortableTableHead label={t.columnStatus} field="status" sort={sort} onSort={handleSort} />
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
