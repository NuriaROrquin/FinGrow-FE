import { api } from "./client"
import type { EducationCategory } from "./education"
import type { InvestmentType } from "./investments"

export type CourseLevel = "Beginner" | "Intermediate" | "Advanced"

export type CourseProgressStatus = "NotStarted" | "InProgress" | "Completed"

export const COURSE_LEVEL_LABELS: Record<CourseLevel, string> = {
  Beginner: "Principiante",
  Intermediate: "Intermedio",
  Advanced: "Avanzado",
}

export const COURSE_PROGRESS_STATUS_LABELS: Record<CourseProgressStatus, string> = {
  NotStarted: "Sin empezar",
  InProgress: "En curso",
  Completed: "Completado",
}

export interface CourseSummaryDto {
  id: string
  slug: string
  title: string
  description: string
  level: CourseLevel
  category: EducationCategory
  relatedInvestmentType: InvestmentType | null
  durationMinutes: number
  lessonCount: number
  completedLessons: number
  progressPercentage: number
  progressStatus: CourseProgressStatus
}

export interface CourseFilters {
  level?: CourseLevel
  maxDuration?: number
  status?: CourseProgressStatus
}

export function listCourses(filters: CourseFilters = {}, signal?: AbortSignal): Promise<CourseSummaryDto[]> {
  return api.get<CourseSummaryDto[]>("/api/courses", {
    query: { level: filters.level, maxDuration: filters.maxDuration, status: filters.status },
    signal,
  })
}
