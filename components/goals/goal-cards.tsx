"use client"

import { HandCoinsIcon, PencilIcon, Trash2Icon, TrophyIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { GoalDto } from "@/lib/api"
import { formatDate, formatMoney, formatNumber } from "@/lib/format"
import { useMessages, type Messages } from "@/lib/i18n"

function formatDeadline(deadline: string): string {
  return formatDate(deadline)
}

function formatAchievedAt(achievedAt: string): string {
  return formatDate(achievedAt)
}

function describeTimeLeft(goal: GoalDto, deadlineLabel: string, t: Messages["goals"]): string {
  if (goal.status === "Cancelled") return t.cancelledGoal
  if (goal.isOverdue) return t.overdueOn(deadlineLabel)
  if (goal.daysRemaining === 0) return t.dueToday(deadlineLabel)
  return t.daysLeft(goal.daysRemaining, deadlineLabel)
}

export function InProgressGoalCard({
  goal,
  onOpenContributions,
  onEdit,
  onDelete,
}: {
  goal: GoalDto
  onOpenContributions: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const t = useMessages().goals

  return (
    <Card className={goal.isOverdue ? "border-destructive/50" : undefined}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🎯</div>
            <div>
              <CardTitle className="text-lg">{goal.name}</CardTitle>
              <CardDescription className={goal.isOverdue ? "text-destructive" : undefined}>
                {describeTimeLeft(goal, formatDeadline(goal.deadline), t)}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {goal.isOverdue ? (
              <Badge variant="destructive">{t.overdue}</Badge>
            ) : (
              <Badge variant="outline">{formatNumber(goal.progressPercentage, { maximumFractionDigits: 0 })}%</Badge>
            )}
            <Button variant="ghost" size="icon" aria-label={t.editAria(goal.name)} onClick={onEdit}>
              <PencilIcon className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label={t.deleteAria(goal.name)} onClick={onDelete}>
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold">{formatMoney(goal.currentAmount, goal.currency)}</span>
          <span className="text-sm text-muted-foreground">
            {t.ofTarget(formatMoney(goal.targetAmount, goal.currency))}
          </span>
        </div>
        <Progress value={goal.progressPercentage} className="h-2" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t.pending(formatMoney(goal.remainingAmount, goal.currency))}</span>
          <span className="font-medium">
            {t.reached(formatNumber(goal.progressPercentage, { minimumFractionDigits: 1, maximumFractionDigits: 1 }))}
          </span>
        </div>
        <Button variant="outline" className="w-full" onClick={onOpenContributions}>
          <HandCoinsIcon className="size-4" />
          {goal.status === "Active" ? t.addContribution : t.viewContributions}
        </Button>
      </CardContent>
    </Card>
  )
}

export function AchievedGoalCard({
  goal,
  onOpenContributions,
  onEdit,
  onDelete,
}: {
  goal: GoalDto
  onOpenContributions: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const t = useMessages().goals

  return (
    <Card className="border-success/40 bg-success/5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-success/15">
              <TrophyIcon className="size-5 text-success" />
            </div>
            <div>
              <CardTitle className="text-lg">{goal.name}</CardTitle>
              <CardDescription>
                {goal.achievedAt ? t.achievedOn(formatAchievedAt(goal.achievedAt)) : t.achievedGoal}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge className="hover:bg-primary">{t.achievedBadge}</Badge>
            <Button variant="ghost" size="icon" aria-label={t.editAria(goal.name)} onClick={onEdit}>
              <PencilIcon className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label={t.deleteAria(goal.name)} onClick={onDelete}>
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold">{formatMoney(goal.currentAmount, goal.currency)}</span>
          <span className="text-sm text-muted-foreground">
            {t.target(formatMoney(goal.targetAmount, goal.currency))}
          </span>
        </div>
        <Progress value={100} className="h-2" />
        <Button variant="ghost" className="w-full" onClick={onOpenContributions}>
          <HandCoinsIcon className="size-4" />
          {t.viewContributions}
        </Button>
      </CardContent>
    </Card>
  )
}
