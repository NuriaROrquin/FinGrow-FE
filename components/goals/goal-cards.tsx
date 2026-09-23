"use client"

import { HandCoinsIcon, TrophyIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { GoalDto } from "@/lib/api"

const dateFormat: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }

function formatDeadline(deadline: string): string {
  return new Date(`${deadline}T00:00:00`).toLocaleDateString("es-AR", dateFormat)
}

function formatAchievedAt(achievedAt: string): string {
  return new Date(achievedAt).toLocaleDateString("es-AR", {
    ...dateFormat,
    timeZone: "America/Argentina/Buenos_Aires",
  })
}

function describeTimeLeft(goal: GoalDto, deadlineLabel: string): string {
  if (goal.status === "Cancelled") return "Meta cancelada"
  if (goal.isOverdue) return `Vencida el ${deadlineLabel}`
  if (goal.daysRemaining === 0) return `Vence hoy · ${deadlineLabel}`
  if (goal.daysRemaining === 1) return `1 día restante · ${deadlineLabel}`
  return `${goal.daysRemaining} días restantes · ${deadlineLabel}`
}

export function InProgressGoalCard({ goal, onOpenContributions }: { goal: GoalDto; onOpenContributions: () => void }) {
  return (
    <Card className={goal.isOverdue ? "border-destructive/50" : undefined}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🎯</div>
            <div>
              <CardTitle className="text-lg">{goal.name}</CardTitle>
              <CardDescription className={goal.isOverdue ? "text-destructive" : undefined}>
                {describeTimeLeft(goal, formatDeadline(goal.deadline))}
              </CardDescription>
            </div>
          </div>
          {goal.isOverdue ? (
            <Badge variant="destructive">Vencida</Badge>
          ) : (
            <Badge variant="outline">{goal.progressPercentage.toFixed(0)}%</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-success">${goal.currentAmount.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground">
            de ${goal.targetAmount.toLocaleString()} {goal.currency}
          </span>
        </div>
        <Progress value={goal.progressPercentage} className="h-2" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">${goal.remainingAmount.toLocaleString()} pendiente</span>
          <span className="font-medium">{goal.progressPercentage.toFixed(1)}% alcanzado</span>
        </div>
        <Button variant="outline" className="w-full" onClick={onOpenContributions}>
          <HandCoinsIcon className="size-4" />
          {goal.status === "Active" ? "Registrar aporte" : "Ver aportes"}
        </Button>
      </CardContent>
    </Card>
  )
}

export function AchievedGoalCard({ goal, onOpenContributions }: { goal: GoalDto; onOpenContributions: () => void }) {
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
                {goal.achievedAt ? `Lograda el ${formatAchievedAt(goal.achievedAt)}` : "Meta lograda"}
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-success text-white">Alcanzada</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-success">${goal.currentAmount.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground">
            objetivo ${goal.targetAmount.toLocaleString()} {goal.currency}
          </span>
        </div>
        <Progress value={100} className="h-2" />
        <Button variant="ghost" className="w-full" onClick={onOpenContributions}>
          <HandCoinsIcon className="size-4" />
          Ver aportes
        </Button>
      </CardContent>
    </Card>
  )
}
