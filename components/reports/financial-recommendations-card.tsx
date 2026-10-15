"use client"

import Link from "next/link"
import { AlertCircleIcon, ArrowRightIcon, InfoIcon, LightbulbIcon, TrendingUpIcon, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { FinancialRecommendationDto, RecommendationAction, RecommendationKind } from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"
import { cn } from "@/lib/utils"

const kindStyles: Record<RecommendationKind, { box: string; icon: LucideIcon; iconColor: string; label: string }> = {
  Positive: {
    box: "bg-success/10 border-success/20",
    icon: TrendingUpIcon,
    iconColor: "text-success",
    label: "Vas bien",
  },
  Warning: {
    box: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
    icon: AlertCircleIcon,
    iconColor: "text-amber-600 dark:text-amber-400",
    label: "Atención",
  },
  Tip: {
    box: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
    icon: LightbulbIcon,
    iconColor: "text-blue-600 dark:text-blue-400",
    label: "Sugerencia",
  },
}

const actionLinks: Record<Exclude<RecommendationAction, "None">, { href: string; label: string }> = {
  Budgets: { href: "/dashboard/budgets", label: "Ver presupuestos" },
  Goals: { href: "/dashboard/budgets?tab=savings", label: "Ver metas de ahorro" },
  Transactions: { href: "/dashboard/transactions", label: "Ver movimientos" },
  Education: { href: "/dashboard/education", label: "Ir a Educación" },
}

interface FinancialRecommendationsCardProps {
  recommendations: FinancialRecommendationDto[]
  available: boolean
  hasMovements: boolean
  currency: Currency
}

export function FinancialRecommendationsCard({
  recommendations,
  available,
  hasMovements,
  currency,
}: FinancialRecommendationsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis y Recomendaciones</CardTitle>
        <CardDescription>Basado en tus datos financieros del período</CardDescription>
      </CardHeader>
      <CardContent>
        {!available ? (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            No pudimos generar recomendaciones ahora. Probá de nuevo más tarde.
          </p>
        ) : !hasMovements ? (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            Cuando registres movimientos en {currency} en este período, vas a ver recomendaciones sobre ellos.
          </p>
        ) : (
          <ul className="space-y-3">
            {recommendations.map((recommendation, index) => {
              const style = kindStyles[recommendation.kind]
              const Icon = style.icon
              const link = recommendation.action === "None" ? null : actionLinks[recommendation.action]

              return (
                <li key={`${index}-${recommendation.title}`} className={cn("rounded-lg border p-3", style.box)}>
                  <div className="flex items-start gap-3">
                    <Icon className={cn("mt-0.5 size-5 shrink-0", style.iconColor)} aria-label={style.label} />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{recommendation.title}</p>
                      <p className="text-sm text-muted-foreground">{recommendation.body}</p>
                      {link && (
                        <Button asChild variant="link" size="sm" className="no-print h-auto px-0">
                          <Link href={link.href}>
                            {link.label}
                            <ArrowRightIcon className="size-3.5" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
      <CardFooter className="flex items-start gap-2 text-xs text-muted-foreground">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
        <p>
          Estas recomendaciones se generan automáticamente a partir de tus movimientos. Son orientativas y no
          constituyen asesoramiento financiero certificado.
        </p>
      </CardFooter>
    </Card>
  )
}
