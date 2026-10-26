"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { getLearningProgress, toastApiError, type LearningProgressDto } from "@/lib/api"
import { useMessages, type Messages } from "@/lib/i18n"

export function LearningProgressOverview() {
  const t = useMessages().education
  const [progress, setProgress] = useState<LearningProgressDto | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    getLearningProgress(controller.signal)
      .then(setProgress)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        toastApiError(error, t.progressLoadFailed)
        setLoadFailed(true)
      })

    return () => controller.abort()
  }, [t])

  const value = (amount: number | undefined, suffix = "") =>
    progress === null ? (
      loadFailed ? (
        "—"
      ) : (
        <Skeleton className="h-8 w-16" />
      )
    ) : (
      `${amount}${suffix}`
    )

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t.overallProgress}</CardDescription>
          <CardTitle className="text-2xl">{value(progress?.progressPercentage, "%")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress?.progressPercentage ?? 0} className="h-2" />
          {progress && (
            <p className="text-sm text-muted-foreground mt-2">
              {t.lessonsOf(progress.completedLessons, progress.lessonCount)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t.completedCourses}</CardDescription>
          <CardTitle className="text-2xl">{value(progress?.completedCourses)}</CardTitle>
        </CardHeader>
        <CardContent>
          {progress && (
            <p className="text-sm text-muted-foreground">
              {t.ofAvailableCourses(progress.courseCount)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t.inProgressCourses}</CardDescription>
          <CardTitle className="text-2xl">{value(progress?.inProgressCourses)}</CardTitle>
        </CardHeader>
        <CardContent>
          {progress && <p className="text-sm text-muted-foreground">{t.notStarted(progress.notStartedCourses)}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t.streak}</CardDescription>
          <CardTitle className="text-2xl">
            {value(progress?.streakWeeks, t.weeksSuffix(progress?.streakWeeks ?? 0))}
          </CardTitle>
        </CardHeader>
        <CardContent>{progress && <p className="text-sm text-muted-foreground">{streakMessage(progress, t)}</p>}</CardContent>
      </Card>
    </>
  )
}

function streakMessage(progress: LearningProgressDto, t: Messages["education"]): string {
  if (progress.streakWeeks > 0) {
    return progress.studiedThisWeek ? t.keepItUp : t.keepStreak
  }
  return progress.completedLessons > 0 ? t.resumeStreak : t.startStreak
}
