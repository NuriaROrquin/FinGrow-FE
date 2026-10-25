"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircleIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  DollarSignIcon,
  GraduationCapIcon,
  PiggyBankIcon,
  PlayCircleIcon,
  ReceiptIcon,
  TrendingUpIcon,
  type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  listCourses,
  toastApiError,
  type CourseDetailDto,
  type CourseLevel,
  type CourseProgressStatus,
  type CourseSummaryDto,
  type EducationCategory,
} from "@/lib/api"
import { useMessages } from "@/lib/i18n"
import { CourseRating } from "./course-rating"
import { formatDuration } from "./format-duration"

const ALL = "all"

const durationOptions = [40, 50, 60]

const categoryIcons: Record<EducationCategory, LucideIcon> = {
  Basics: DollarSignIcon,
  Savings: PiggyBankIcon,
  Budgeting: DollarSignIcon,
  Investments: TrendingUpIcon,
  Credit: CreditCardIcon,
  Retirement: PiggyBankIcon,
  Taxes: ReceiptIcon,
}

export function CoursesCatalog() {
  const messages = useMessages()
  const labels = messages.labels
  const t = messages.education
  const router = useRouter()
  const [level, setLevel] = useState<CourseLevel | typeof ALL>(ALL)
  const [maxDuration, setMaxDuration] = useState<string>(ALL)
  const [status, setStatus] = useState<CourseProgressStatus | typeof ALL>(ALL)
  const [courses, setCourses] = useState<CourseSummaryDto[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setCourses(null)
    setLoadFailed(false)

    listCourses(
      {
        level: level === ALL ? undefined : level,
        maxDuration: maxDuration === ALL ? undefined : Number(maxDuration),
        status: status === ALL ? undefined : status,
      },
      controller.signal,
    )
      .then(setCourses)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        toastApiError(error, t.coursesLoadFailed)
        setLoadFailed(true)
      })

    return () => controller.abort()
  }, [level, maxDuration, status, retryCount, t])

  const updateRating = (updated: CourseDetailDto) => {
    setCourses((current) =>
      current?.map((course) =>
        course.id === updated.id
          ? {
              ...course,
              averageRating: updated.averageRating,
              ratingCount: updated.ratingCount,
              myRating: updated.myRating,
            }
          : course,
      ) ?? current,
    )
  }

  const hasFilters = level !== ALL || maxDuration !== ALL || status !== ALL

  const clearFilters = () => {
    setLevel(ALL)
    setMaxDuration(ALL)
    setStatus(ALL)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select value={level} onValueChange={(value) => setLevel(value as CourseLevel | typeof ALL)}>
            <SelectTrigger className="w-full sm:w-44" aria-label={t.filterByLevel}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t.allLevels}</SelectItem>
              {Object.entries(labels.courseLevels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(value) => setStatus(value as CourseProgressStatus | typeof ALL)}>
            <SelectTrigger className="w-full sm:w-44" aria-label={t.filterByProgress}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t.allProgress}</SelectItem>
              {Object.entries(labels.courseProgressStatuses).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ToggleGroup
          type="single"
          variant="outline"
          value={maxDuration}
          onValueChange={(value) => setMaxDuration(value || ALL)}
          aria-label={t.filterByDuration}
        >
          <ToggleGroupItem value={ALL} className="flex-none px-3">
            {t.anyDuration}
          </ToggleGroupItem>
          {durationOptions.map((minutes) => (
            <ToggleGroupItem key={minutes} value={String(minutes)} className="flex-none px-3">
              {t.upToMinutes(minutes)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {loadFailed ? (
        <Card>
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AlertCircleIcon />
                </EmptyMedia>
                <EmptyTitle>{t.coursesFailedTitle}</EmptyTitle>
                <EmptyDescription>{t.tryAgainShortly}</EmptyDescription>
              </EmptyHeader>
              <Button variant="outline" onClick={() => setRetryCount((count) => count + 1)}>
                {t.retry}
              </Button>
            </Empty>
          </CardContent>
        </Card>
      ) : courses === null ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <GraduationCapIcon />
                </EmptyMedia>
                <EmptyTitle>{t.noCourses}</EmptyTitle>
                <EmptyDescription>{hasFilters ? t.noCoursesFiltered : t.noCoursesPublished}</EmptyDescription>
              </EmptyHeader>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  {t.clearFilters}
                </Button>
              )}
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => {
            const Icon = categoryIcons[course.category]
            const isCompleted = course.progressStatus === "Completed"

            return (
              <Card key={course.id}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription className="mt-1">{course.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="size-4" />
                      <span>{formatDuration(course.durationMinutes)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpenIcon className="size-4" />
                      <span>{messages.educationContent.lessons(course.lessonCount)}</span>
                    </div>
                    <Badge variant="outline">{labels.courseLevels[course.level]}</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t.progressOf(course.completedLessons, course.lessonCount)}
                      </span>
                      <span className="font-medium">{course.progressPercentage}%</span>
                    </div>
                    <Progress value={course.progressPercentage} className="h-2" />
                  </div>

                  <div className="border-t pt-3">
                    <CourseRating
                      slug={course.slug}
                      averageRating={course.averageRating}
                      ratingCount={course.ratingCount}
                      myRating={course.myRating}
                      canRate={isCompleted}
                      onRated={updateRating}
                    />
                  </div>

                  <Button
                    className="w-full"
                    variant={isCompleted ? "outline" : "default"}
                    onClick={() => router.push(`/dashboard/education/courses/${course.slug}`)}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircleIcon className="size-4" />
                        {t.courseDone}
                      </>
                    ) : course.progressStatus === "InProgress" ? (
                      <>
                        <PlayCircleIcon className="size-4" />
                        {t.continueLearning}
                      </>
                    ) : (
                      <>
                        <PlayCircleIcon className="size-4" />
                        {t.startCourse}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
