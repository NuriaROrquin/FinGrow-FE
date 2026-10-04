"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpenIcon, ClockIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  educationCategoryLabels,
  listArticles,
  toastApiError,
  type ArticleSummaryDto,
  type EducationCategory,
} from "@/lib/api"

const ALL = "all"

const readingTimeOptions = [3, 5, 10]

export function ArticlesCatalog() {
  const router = useRouter()
  const [category, setCategory] = useState<EducationCategory | typeof ALL>(ALL)
  const [maxReadingTime, setMaxReadingTime] = useState<string>(ALL)
  const [articles, setArticles] = useState<ArticleSummaryDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)

    listArticles(
      {
        category: category === ALL ? undefined : category,
        maxReadingTime: maxReadingTime === ALL ? undefined : Number(maxReadingTime),
      },
      controller.signal,
    )
      .then(setArticles)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        toastApiError(error, "No se pudieron cargar los artículos.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [category, maxReadingTime])

  const hasFilters = category !== ALL || maxReadingTime !== ALL

  return (
    <Card>
      <CardHeader className="gap-4">
        <div>
          <CardTitle>Lectura Recomendada</CardTitle>
          <CardDescription>Artículos cortos para aprender en un rato libre</CardDescription>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Select value={category} onValueChange={(value) => setCategory(value as EducationCategory | typeof ALL)}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Filtrar por categoría">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas las categorías</SelectItem>
              {Object.entries(educationCategoryLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ToggleGroup
            type="single"
            variant="outline"
            value={maxReadingTime}
            onValueChange={(value) => setMaxReadingTime(value || ALL)}
            aria-label="Filtrar por tiempo de lectura"
          >
            <ToggleGroupItem value={ALL} className="px-3">
              Cualquiera
            </ToggleGroupItem>
            {readingTimeOptions.map((minutes) => (
              <ToggleGroupItem key={minutes} value={String(minutes)} className="px-3">
                ≤ {minutes} min
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : articles.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookOpenIcon />
              </EmptyMedia>
              <EmptyTitle>No hay artículos para mostrar</EmptyTitle>
              <EmptyDescription>
                {hasFilters
                  ? "Probá con otra categoría o con más tiempo de lectura."
                  : "Todavía no hay artículos publicados."}
              </EmptyDescription>
            </EmptyHeader>
            {hasFilters && (
              <Button
                variant="outline"
                onClick={() => {
                  setCategory(ALL)
                  setMaxReadingTime(ALL)
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </Empty>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="flex items-center justify-between gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/dashboard/education/articles/${article.slug}`)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <BookOpenIcon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold">{article.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{article.summary}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                      <Badge variant="outline" className="text-xs">
                        {educationCategoryLabels[article.category]}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="size-3" />
                        {article.readingTimeMinutes} min de lectura
                      </span>
                      <span>
                        {new Date(article.publishedAt).toLocaleDateString("es-AR", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Leer
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
