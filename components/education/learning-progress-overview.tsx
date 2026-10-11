"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { getLearningProgress, toastApiError, type LearningProgressDto } from "@/lib/api"

export function LearningProgressOverview() {
  const [progress, setProgress] = useState<LearningProgressDto | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    getLearningProgress(controller.signal)
      .then(setProgress)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        toastApiError(error, "No se pudo cargar tu progreso de aprendizaje.")
        setLoadFailed(true)
      })

    return () => controller.abort()
  }, [])

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
          <CardDescription>Progreso General</CardDescription>
          <CardTitle className="text-2xl">{value(progress?.progressPercentage, "%")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress?.progressPercentage ?? 0} className="h-2" />
          {progress && (
            <p className="text-sm text-muted-foreground mt-2">
              {progress.completedLessons} de {progress.lessonCount} lecciones
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Cursos Completados</CardDescription>
          <CardTitle className="text-2xl">{value(progress?.completedCourses)}</CardTitle>
        </CardHeader>
        <CardContent>
          {progress && (
            <p className="text-sm text-muted-foreground">
              de {progress.courseCount} {progress.courseCount === 1 ? "curso disponible" : "cursos disponibles"}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Cursos En Curso</CardDescription>
          <CardTitle className="text-2xl">{value(progress?.inProgressCourses)}</CardTitle>
        </CardHeader>
        <CardContent>
          {progress && <p className="text-sm text-muted-foreground">{progress.notStartedCourses} sin empezar</p>}
        </CardContent>
      </Card>
    </>
  )
}
