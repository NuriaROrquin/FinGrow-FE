"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import type { CompanyConcern, CompanyConcernDto } from "@/lib/api"
import { plural } from "@/lib/utils"
import { AnonymizedNotice, EmptyNotice, monthAndYear, type CompanyInsightsState } from "./company-insights-state"

const concernTexts: Record<CompanyConcern, { title: string; description: string; evaluated: [string, string] }> = {
  LowSavings: {
    title: "Ahorro bajo",
    description: "Ahorraron menos del 10 % de sus ingresos del mes.",
    evaluated: ["empleado medido", "empleados medidos"],
  },
  ThinCushion: {
    title: "Fondo de emergencia insuficiente",
    description: "Lo que tienen acumulado cubre menos de un mes y medio de sus gastos.",
    evaluated: ["empleado medido", "empleados medidos"],
  },
  BudgetOverruns: {
    title: "Presupuestos excedidos",
    description: "Se pasaron en más de la mitad de los topes de su presupuesto mensual.",
    evaluated: ["empleado con presupuesto", "empleados con presupuesto"],
  },
  MissedGoalContributions: {
    title: "Metas de ahorro sin cubrir",
    description: "Aportaron menos de la mitad de la cuota mensual de sus metas.",
    evaluated: ["empleado con metas", "empleados con metas"],
  },
}

function formatPercentage(value: number) {
  return `${value.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`
}

function ConcernItem({ concern, rank }: { concern: CompanyConcernDto; rank: number }) {
  const texts = concernTexts[concern.concern]
  const [singular, pluralForm] = texts.evaluated

  return (
    <li className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {rank}
          </div>
          <div>
            <p className="font-medium">{texts.title}</p>
            <p className="text-sm text-muted-foreground">{texts.description}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-semibold">{formatPercentage(concern.percentage)}</p>
          <p className="text-xs text-muted-foreground">
            {concern.affectedEmployees} de {concern.evaluatedEmployees}{" "}
            {plural(concern.evaluatedEmployees, singular, pluralForm)}
          </p>
        </div>
      </div>
      <Progress value={concern.percentage} className="h-2" aria-label={`${texts.title}: ${formatPercentage(concern.percentage)}`} />
    </li>
  )
}

/** Principales preocupaciones financieras de la plantilla, agregadas y anónimas (HU-61). */
export function FinancialConcernsCard({ insights, isLoading, hasFailed }: CompanyInsightsState) {
  const ready = !isLoading && !hasFailed && insights?.period && !insights.isAnonymized ? insights : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Principales Preocupaciones Financieras</CardTitle>
        <CardDescription>
          {ready?.period && ready.measuredEmployees !== null
            ? `${monthAndYear(ready.period)} · ${ready.measuredEmployees} ${plural(ready.measuredEmployees, "empleado medido", "empleados medidos")}`
            : "Desafíos financieros más comunes entre empleados"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4" data-testid="financial-concerns-loading">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : hasFailed || !insights ? (
          <EmptyNotice>No se pudieron cargar las preocupaciones financieras.</EmptyNotice>
        ) : !insights.period ? (
          <EmptyNotice>Todavía no hay meses cerrados para analizar.</EmptyNotice>
        ) : insights.isAnonymized ? (
          <AnonymizedNotice period={insights.period} minimumGroupSize={insights.minimumGroupSize} />
        ) : insights.concerns.length === 0 ? (
          <EmptyNotice>
            En {monthAndYear(insights.period)} no hubo preocupaciones que afecten a {insights.minimumGroupSize} empleados
            o más.
          </EmptyNotice>
        ) : (
          <ol className="space-y-5">
            {insights.concerns.map((concern, index) => (
              <ConcernItem key={concern.concern} concern={concern} rank={index + 1} />
            ))}
          </ol>
        )}
      </CardContent>
      {ready && (
        <CardFooter className="text-xs text-muted-foreground">
          Solo se muestran las preocupaciones que afectan al menos a {ready.minimumGroupSize} empleados, para cuidar el
          anonimato.
        </CardFooter>
      )}
    </Card>
  )
}
