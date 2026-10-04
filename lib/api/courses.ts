import { api } from "./client"
import type { EducationCategory } from "./education"
import type { InvestmentType } from "./investments"

export type CourseLevel = "Beginner" | "Intermediate" | "Advanced"

export type CourseProgressStatus = "NotStarted" | "InProgress" | "Completed"

export const courseLevelLabels: Record<CourseLevel, string> = {
  Beginner: "Principiante",
  Intermediate: "Intermedio",
  Advanced: "Avanzado",
}

export const courseProgressStatusLabels: Record<CourseProgressStatus, string> = {
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
  averageRating: number | null
  ratingCount: number
  myRating: number | null
}

export interface LessonDto {
  id: string
  position: number
  title: string
  durationMinutes: number
  videoUrl: string
  isCompleted: boolean
}

export interface CourseDetailDto extends CourseSummaryDto {
  resumeLessonId: string | null
  lessons: LessonDto[]
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

export function getCourse(slug: string, signal?: AbortSignal): Promise<CourseDetailDto> {
  return api.get<CourseDetailDto>(`/api/courses/${encodeURIComponent(slug)}`, { signal })
}

export function completeLesson(slug: string, lessonId: string): Promise<CourseDetailDto> {
  return api.put<CourseDetailDto>(`/api/courses/${encodeURIComponent(slug)}/lessons/${lessonId}/completion`)
}

export function rateCourse(slug: string, score: number): Promise<CourseDetailDto> {
  return api.put<CourseDetailDto>(`/api/courses/${encodeURIComponent(slug)}/rating`, { score })
}
