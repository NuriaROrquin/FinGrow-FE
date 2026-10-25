"use client"

import Link from "next/link"
import { AlertCircleIcon, ArrowRightIcon, LightbulbIcon, TrendingUpIcon, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FinancialRecommendationDto, RecommendationAction, RecommendationKind } from "@/lib/api"
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

interface RecommendationListProps {
  recommendations: FinancialRecommendationDto[]
  /** `false` en el PDF exportado, donde un link no sirve. */
  showLinks?: boolean
  /** Acciones que no llevan link porque ya se está en esa pantalla. */
  hiddenActions?: RecommendationAction[]
}

/** Las recomendaciones de FinGrow-AI (HU-44 en Reportes, HU-25 en Presupuestos), con su link de acción. */
export function RecommendationList({ recommendations, showLinks = true, hiddenActions = [] }: RecommendationListProps) {
  return (
    <ul className="space-y-3">
      {recommendations.map((recommendation, index) => {
        const style = kindStyles[recommendation.kind]
        const Icon = style.icon
        const link =
          !showLinks || recommendation.action === "None" || hiddenActions.includes(recommendation.action)
            ? null
            : actionLinks[recommendation.action]

        return (
          <li key={`${index}-${recommendation.title}`} className={cn("rounded-lg border p-3", style.box)}>
            <div className="flex items-start gap-3">
              <Icon className={cn("mt-0.5 size-5 shrink-0", style.iconColor)} aria-label={style.label} />
              <div className="space-y-1">
                <p className="text-sm font-medium">{recommendation.title}</p>
                <p className="text-sm text-muted-foreground">{recommendation.body}</p>
                {link && (
                  <Button asChild variant="link" size="sm" className="h-auto px-0">
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
  )
}
