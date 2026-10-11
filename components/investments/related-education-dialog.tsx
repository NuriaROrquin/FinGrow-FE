"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { BookOpenIcon, ClockIcon, GraduationCapIcon, NewspaperIcon } from "lucide-react"
import { relatedContentHref } from "@/components/education/back-target"
import { formatDuration } from "@/components/education/format-duration"
import { InvestmentDisclaimer } from "@/components/education/investment-disclaimer"
import { investmentTypeTopics } from "@/components/investments/investment-type-topics"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  courseLevelLabels,
  courseProgressStatusLabels,
  listArticles,
  listCourses,
  toastApiError,
  type ArticleSummaryDto,
  type CourseSummaryDto,
  type InvestmentType,
} from "@/lib/api"
import { plural } from "@/lib/utils"

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; courses: CourseSummaryDto[]; articles: ArticleSummaryDto[] }
  | { status: "error" }

const linkClassName =
  "block rounded-lg border p-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

function CourseLink({ course }: { course: CourseSummaryDto }) {
  return (
    <Link href={relatedContentHref("courses", course.slug)} className={linkClassName}>
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium">{course.title}</span>
        {course.progressStatus !== "NotStarted" && (
          <Badge variant={course.progressStatus === "Completed" ? "default" : "secondary"} className="shrink-0">
            {courseProgressStatusLabels[course.progressStatus]}
          </Badge>
        )}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>{courseLevelLabels[course.level]}</span>
        <span className="flex items-center gap-1">
          <ClockIcon className="size-3" />
          {formatDuration(course.durationMinutes)}
        </span>
        <span className="flex items-center gap-1">
          <BookOpenIcon className="size-3" />
          {course.lessonCount} {plural(course.lessonCount, "lección", "lecciones")}
        </span>
      </div>
    </Link>
  )
}

function ArticleLink({ article }: { article: ArticleSummaryDto }) {
  return (
    <Link href={relatedContentHref("articles", article.slug)} className={linkClassName}>
      <span className="font-medium">{article.title}</span>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{article.summary}</p>
      <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <ClockIcon className="size-3" />
        {article.readingTimeMinutes} min de lectura
      </span>
    </Link>
  )
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof GraduationCapIcon
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-primary" />
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

export function RelatedEducationDialog({
  type,
  open,
  onOpenChange,
}: {
  type: InvestmentType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [state, setState] = useState<LoadState>({ status: "loading" })
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!type) return

    const controller = new AbortController()
    setState({ status: "loading" })

    Promise.all([
      listCourses({ investmentType: type }, controller.signal),
      listArticles({ investmentType: type }, controller.signal),
    ])
      .then(([courses, articles]) => setState({ status: "loaded", courses, articles }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        toastApiError(error, "No se pudo cargar el contenido educativo.")
        setState({ status: "error" })
      })

    return () => controller.abort()
  }, [type, retryCount])

  const topic = type ? investmentTypeTopics[type] : ""
  const isEmpty = state.status === "loaded" && state.courses.length === 0 && state.articles.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Aprendé sobre {topic}</DialogTitle>
          <DialogDescription>Cursos y artículos de FinGrow sobre este tipo de activo.</DialogDescription>
        </DialogHeader>

        <InvestmentDisclaimer />

        {state.status === "loading" && (
          <div className="space-y-2" aria-label="Cargando contenido">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {state.status === "error" && (
          <div className="space-y-3 py-2 text-center text-sm text-muted-foreground">
            <p>No pudimos cargar el contenido. Probá de nuevo en un momento.</p>
            <Button variant="outline" size="sm" onClick={() => setRetryCount((count) => count + 1)}>
              Reintentar
            </Button>
          </div>
        )}

        {isEmpty && (
          <p className="py-2 text-center text-sm text-muted-foreground">
            Todavía no hay contenido sobre {topic}. Mientras tanto, podés explorar el resto en Educación.
          </p>
        )}

        {state.status === "loaded" && state.courses.length > 0 && (
          <Section icon={GraduationCapIcon} title="Cursos">
            {state.courses.map((course) => (
              <CourseLink key={course.id} course={course} />
            ))}
          </Section>
        )}

        {state.status === "loaded" && state.articles.length > 0 && (
          <Section icon={NewspaperIcon} title="Artículos">
            {state.articles.map((article) => (
              <ArticleLink key={article.id} article={article} />
            ))}
          </Section>
        )}

        <Button variant="outline" asChild>
          <Link href="/dashboard/education">Ver todo en Educación</Link>
        </Button>
      </DialogContent>
    </Dialog>
  )
}
