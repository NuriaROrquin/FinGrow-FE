import { api } from "./client"

export type EducationCategory =
  | "Basics"
  | "Savings"
  | "Budgeting"
  | "Investments"
  | "Credit"
  | "Retirement"
  | "Taxes"

/** Etiqueta en castellano de cada categoría, en el orden en que se muestran en los filtros. */
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
  /** Cuerpo del artículo en Markdown. */
  content: string
}

export interface ArticleFilters {
  category?: EducationCategory
  /** Solo los artículos que se leen en esta cantidad de minutos o menos. */
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
