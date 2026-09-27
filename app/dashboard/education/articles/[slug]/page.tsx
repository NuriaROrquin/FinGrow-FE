"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeftIcon, ClockIcon } from "lucide-react"
import { ArticleMarkdown } from "@/components/education/article-markdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EDUCATION_CATEGORY_LABELS, getArticle, isApiError, toastApiError, type ArticleDto } from "@/lib/api"

const BACK_TO_ARTICLES = "/dashboard/education?tab=articles"

type LoadState = { status: "loading" } | { status: "loaded"; article: ArticleDto } | { status: "not-found" } | { status: "error" }

export default function ArticlePage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const [state, setState] = useState<LoadState>({ status: "loading" })

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: "loading" })

    getArticle(params.slug, controller.signal)
      .then((article) => setState({ status: "loaded", article }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        if (isApiError(error) && error.status === 404) {
          setState({ status: "not-found" })
          return
        }
        toastApiError(error, "No se pudo cargar el artículo.")
        setState({ status: "error" })
      })

    return () => controller.abort()
  }, [params.slug])

  const backButton = (
    <Button variant="ghost" size="icon" aria-label="Volver a artículos" onClick={() => router.push(BACK_TO_ARTICLES)}>
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
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (state.status !== "loaded") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {backButton}
          <h1 className="text-3xl font-bold">
            {state.status === "not-found" ? "Artículo no encontrado" : "No se pudo cargar el artículo"}
          </h1>
        </div>
      </div>
    )
  }

  const { article } = state

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        {backButton}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{article.title}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
            <Badge variant="outline">{EDUCATION_CATEGORY_LABELS[article.category]}</Badge>
            <span className="flex items-center gap-1">
              <ClockIcon className="size-3" />
              {article.readingTimeMinutes} min de lectura
            </span>
            <span>
              {new Date(article.publishedAt).toLocaleDateString("es-AR", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <Card>
        <CardContent className="pt-6">
          <p className="mb-6 text-lg text-muted-foreground">{article.summary}</p>
          <ArticleMarkdown content={article.content} />
        </CardContent>
      </Card>

      {/* Back Button at Bottom */}
      <div className="flex justify-start">
        <Button variant="outline" onClick={() => router.push(BACK_TO_ARTICLES)}>
          <ArrowLeftIcon className="size-4" />
          Volver a Educación
        </Button>
      </div>
    </div>
  )
}
