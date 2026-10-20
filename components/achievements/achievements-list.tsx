"use client"

import { AlertCircleIcon, CheckCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { AchievementDto } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { useMessages } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import { AchievementMedal } from "./achievement-medal"

interface AchievementsListProps {
  achievements: AchievementDto[] | null
  loadFailed: boolean
  onRetry: () => void
}

export function AchievementsList({ achievements, loadFailed, onRetry }: AchievementsListProps) {
  const t = useMessages()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.achievements.title}</CardTitle>
        <CardDescription>{t.achievements.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loadFailed ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <AlertCircleIcon className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">{t.achievements.loadError}</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              {t.achievements.retry}
            </Button>
          </div>
        ) : achievements === null ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {achievements.map((achievement) => {
              const { achievedAt } = achievement
              const earned = achievedAt !== null

              return (
                <div
                  key={achievement.code}
                  className={cn(
                    "flex items-start gap-4 rounded-lg border p-4",
                    earned ? "border-gold/40 bg-gold-soft/40" : "bg-muted/50 opacity-60",
                  )}
                >
                  <AchievementMedal code={achievement.code} className={cn(!earned && "grayscale")} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{achievement.name}</h3>
                      {earned && <CheckCircleIcon className="size-4 text-success" aria-hidden />}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{achievement.description}</p>
                    {achievedAt !== null ? (
                      <p className="mt-2 text-xs font-medium text-gold">
                        {t.achievements.earnedOn(formatDate(achievedAt))}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium">{t.achievements.howToEarn}:</span> {achievement.condition}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
