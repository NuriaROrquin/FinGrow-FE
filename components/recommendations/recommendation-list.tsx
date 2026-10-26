"use client"

import Link from "next/link"
import { AlertCircleIcon, ArrowRightIcon, LightbulbIcon, TrendingUpIcon, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FinancialRecommendationDto, RecommendationAction, RecommendationKind } from "@/lib/api"
import { useMessages } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const kindStyles: Record<
  RecommendationKind,
  { box: string; icon: LucideIcon; iconColor: string; label: "positive" | "warning" | "tip" }
> = {
  Positive: {
    box: "bg-success/10 border-success/20",
    icon: TrendingUpIcon,
    iconColor: "text-success",
    label: "positive",
  },
  Warning: {
    box: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
    icon: AlertCircleIcon,
    iconColor: "text-amber-600 dark:text-amber-400",
    label: "warning",
  },
  Tip: {
    box: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
    icon: LightbulbIcon,
    iconColor: "text-blue-600 dark:text-blue-400",
    label: "tip",
  },
}

const actionHrefs: Record<Exclude<RecommendationAction, "None">, string> = {
  Budgets: "/dashboard/budgets",
  Goals: "/dashboard/budgets?tab=savings",
  Transactions: "/dashboard/transactions",
  Education: "/dashboard/education",
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
  const t = useMessages().recommendations

  return (
    <ul className="space-y-3">
      {recommendations.map((recommendation, index) => {
        const style = kindStyles[recommendation.kind]
        const Icon = style.icon
        const link =
          !showLinks || recommendation.action === "None" || hiddenActions.includes(recommendation.action)
            ? null
            : { href: actionHrefs[recommendation.action], label: t.actions[recommendation.action] }

        return (
          <li key={`${index}-${recommendation.title}`} className={cn("rounded-lg border p-3", style.box)}>
            <div className="flex items-start gap-3">
              <Icon className={cn("mt-0.5 size-5 shrink-0", style.iconColor)} aria-label={t[style.label]} />
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
