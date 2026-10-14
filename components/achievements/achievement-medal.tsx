import {
  CalendarCheckIcon,
  ClipboardListIcon,
  FootprintsIcon,
  GraduationCapIcon,
  PiggyBankIcon,
  PlugZapIcon,
  RocketIcon,
  ScanLineIcon,
  ShieldCheckIcon,
  StarIcon,
  TargetIcon,
  TrendingUpIcon,
  TrophyIcon,
  type LucideIcon,
} from "lucide-react"

import type { AchievementCode } from "@/lib/api"
import { cn } from "@/lib/utils"

const iconByCode: Record<AchievementCode, LucideIcon> = {
  FirstTransaction: FootprintsIcon,
  ReceiptScanned: ScanLineIcon,
  ChannelLinked: PlugZapIcon,
  FirstBudget: ClipboardListIcon,
  FirstGoal: TargetIcon,
  GoalAchieved: TrophyIcon,
  ThreeGoalsAchieved: RocketIcon,
  FirstInvestment: TrendingUpIcon,
  FirstCourse: GraduationCapIcon,
  ConsistentThreeMonths: CalendarCheckIcon,
  BudgetKept: ShieldCheckIcon,
  Saver: PiggyBankIcon,
}

const sizes = {
  sm: { medal: "h-10 w-8", ribbon: "h-4 w-2", ribbonInset: "left-2 right-2", disc: "size-7 border-2", icon: "size-3.5" },
  md: { medal: "h-[3.25rem] w-11", ribbon: "h-[1.375rem] w-[0.6875rem]", ribbonInset: "left-[0.6875rem] right-[0.6875rem]", disc: "size-10 border-[2.5px]", icon: "size-5" },
  lg: { medal: "h-24 w-20", ribbon: "h-10 w-5", ribbonInset: "left-5 right-5", disc: "size-[4.5rem] border-4", icon: "size-9" },
} as const

interface AchievementMedalProps {
  code: AchievementCode
  size?: keyof typeof sizes
  className?: string
}

/** Disco dorado con la cinta violeta de FinGrow; el ícono del centro distingue a cada logro. */
export function AchievementMedal({ code, size = "md", className }: AchievementMedalProps) {
  const Icon = iconByCode[code] ?? TrophyIcon
  const style = sizes[size]

  return (
    <span className={cn("relative inline-block shrink-0", style.medal, className)} aria-hidden>
      <span className={cn("absolute top-0 flex justify-between", style.ribbonInset)}>
        <span className={cn("skew-x-12 bg-primary", style.ribbon)} />
        <span className={cn("-skew-x-12 bg-primary", style.ribbon)} />
      </span>
      <span
        className={cn(
          "absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full border-gold bg-gold-soft text-gold",
          style.disc,
        )}
      >
        <Icon className={style.icon} />
      </span>
    </span>
  )
}

/** Una estrella que sale disparada desde la medalla hacia (`dx`, `dy`); la animación está en globals.css. */
export function MedalStar({ dx, dy, delay }: { dx: string; dy: string; delay: string }) {
  return (
    <StarIcon
      className="achievement-star pointer-events-none absolute left-1/2 top-[60%] -ml-2 -mt-2 size-4 text-gold"
      fill="currentColor"
      style={{ "--dx": dx, "--dy": dy, animationDelay: delay } as React.CSSProperties}
      aria-hidden
    />
  )
}
