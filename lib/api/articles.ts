import { api } from "./client"
import type { EducationCategory } from "./education"

export const EDUCATION_CATEGORY_LABELS: Record<EducationCategory, string> = {
  Basics: "Básico",
  Savings: "Ahorro",
  Budgeting: "Presupuesto",
  Investments: "Inversiones",
  Credit: "Crédito",
  Retirement: "Jubilación",
  Taxes: "Impuestos",
}

export interface ArticleSummaryDto {
  id: string
  slug: string
  title: string
  summary: string
  category: EducationCategory
  readingTimeMinutes: number
  relatedInvestmentType: string | null
  publishedAt: string
}

export interface ArticleDto extends ArticleSummaryDto {
  content: string
}

export interface ArticleFilters {
  category?: EducationCategory
  maxReadingTime?: number
}

export function listArticles(filters: ArticleFilters = {}, signal?: AbortSignal): Promise<ArticleSummaryDto[]> {
  return api.get<ArticleSummaryDto[]>("/api/articles", {
    query: { category: filters.category, maxReadingTime: filters.maxReadingTime },
    signal,
  })
}

export function getArticle(slug: string, signal?: AbortSignal): Promise<ArticleDto> {
  return api.get<ArticleDto>(`/api/articles/${encodeURIComponent(slug)}`, { signal })
}
