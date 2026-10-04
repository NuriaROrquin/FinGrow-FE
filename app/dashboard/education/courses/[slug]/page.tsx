"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  PlayCircleIcon,
  TrophyIcon,
} from "lucide-react"
import { toast } from "sonner"
import { formatDuration } from "@/components/education/format-duration"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  completeLesson,
  courseLevelLabels,
  educationCategoryLabels,
  getCourse,
  isApiError,
  toastApiError,
  type CourseDetailDto,
} from "@/lib/api"
import { cn } from "@/lib/utils"

const BACK_TO_COURSES = "/dashboard/education"

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; course: CourseDetailDto }
  | { status: "not-found" }
  | { status: "error" }

export default function CoursePage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const [state, setState] = useState<LoadState>({ status: "loading" })
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: "loading" })

    getCourse(params.slug, controller.signal)
      .then((course) => {
        setState({ status: "loaded", course })
        setCurrentLessonId(course.resumeLessonId ?? course.lessons[0]?.id ?? null)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        if (isApiError(error) && error.status === 404) {
          setState({ status: "not-found" })
          return
        }
        toastApiError(error, "No se pudo cargar el curso.")
        setState({ status: "error" })
      })

    return () => controller.abort()
  }, [params.slug])

  const backButton = (
    <Button variant="ghost" size="icon" aria-label="Volver a los cursos" onClick={() => router.push(BACK_TO_COURSES)}>
      <ArrowLeftIcon className="size-4" />
    </Button>
  )

  if (state.status === "loading") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {backButton}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 w-full lg:col-span-2" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (state.status !== "loaded") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {backButton}
          <h1 className="text-3xl font-bold">
            {state.status === "not-found" ? "Curso no encontrado" : "No se pudo cargar el curso"}
          </h1>
        </div>
      </div>
    )
  }

  const { course } = state
  const currentIndex = Math.max(
    0,
    course.lessons.findIndex((lesson) => lesson.id === currentLessonId),
  )
  const currentLesson = course.lessons[currentIndex]
  const previousLesson = course.lessons[currentIndex - 1]
  const nextLesson = course.lessons[currentIndex + 1]
  const isCourseCompleted = course.progressStatus === "Completed"

  const handleComplete = async () => {
    if (!currentLesson) return

    setIsCompleting(true)
    try {
      const updated = await completeLesson(course.slug, currentLesson.id)
      setState({ status: "loaded", course: updated })
      if (updated.progressStatus === "Completed" && !isCourseCompleted) {
        toast.success(`Completaste "${updated.title}"`)
      }
      if (nextLesson) {
        setCurrentLessonId(nextLesson.id)
      }
    } catch (error) {
      toastApiError(error, "No se pudo guardar tu avance.")
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        {backButton}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="mt-1 text-muted-foreground">{course.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <Badge variant="outline">{courseLevelLabels[course.level]}</Badge>
            <Badge variant="secondary">{educationCategoryLabels[course.category]}</Badge>
            <span className="flex items-center gap-1 text-muted-foreground">
              <ClockIcon className="size-3" />
              {formatDuration(course.durationMinutes)}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <BookOpenIcon className="size-3" />
              {course.lessonCount} lecciones
            </span>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-2 pt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Tu progreso · {course.completedLessons} de {course.lessonCount} lecciones
            </span>
            <span className="font-medium">{course.progressPercentage}%</span>
          </div>
          <Progress value={course.progressPercentage} className="h-2" />
          {isCourseCompleted && (
            <p className="flex items-center gap-2 pt-2 text-sm font-medium text-primary">
              <TrophyIcon className="size-4" />
              Completaste este curso. Podés volver a ver cualquier lección cuando quieras.
            </p>
          )}
        </CardContent>
      </Card>

      {currentLesson && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">
                Lección {currentLesson.position}: {currentLesson.title}
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <ClockIcon className="size-3" />
                {formatDuration(currentLesson.durationMinutes)}
                {currentLesson.isCompleted && (
                  <span className="ml-2 flex items-center gap-1 text-primary">
                    <CheckCircleIcon className="size-3" />
                    Completada
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <iframe
                  key={currentLesson.id}
                  src={currentLesson.videoUrl}
                  title={currentLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="outline"
                  disabled={!previousLesson}
                  onClick={() => previousLesson && setCurrentLessonId(previousLesson.id)}
                >
                  <ArrowLeftIcon className="size-4" />
                  Anterior
                </Button>
                {currentLesson.isCompleted ? (
                  <Button
                    variant="outline"
                    disabled={!nextLesson}
                    onClick={() => nextLesson && setCurrentLessonId(nextLesson.id)}
                  >
                    Siguiente
                    <ArrowRightIcon className="size-4" />
                  </Button>
                ) : (
                  <Button onClick={handleComplete} disabled={isCompleting}>
                    {isCompleting ? <Spinner /> : <CheckCircleIcon className="size-4" />}
                    {nextLesson ? "Completar y seguir" : "Completar lección"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lecciones</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-1">
                {course.lessons.map((lesson) => {
                  const isCurrent = lesson.id === currentLesson.id
                  const Icon = lesson.isCompleted ? CheckCircleIcon : isCurrent ? PlayCircleIcon : CircleIcon

                  return (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        onClick={() => setCurrentLessonId(lesson.id)}
                        aria-current={isCurrent ? "step" : undefined}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-md p-2 text-left text-sm transition-colors hover:bg-muted",
                          isCurrent && "bg-muted",
                        )}
                      >
                        <Icon
                          className={cn(
                            "mt-0.5 size-4 shrink-0",
                            lesson.isCompleted ? "text-primary" : "text-muted-foreground",
                          )}
                        />
                        <span className="flex-1">
                          <span className={cn("block", isCurrent && "font-medium")}>
                            {lesson.position}. {lesson.title}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatDuration(lesson.durationMinutes)}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
