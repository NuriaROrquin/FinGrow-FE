"use client"

import { useSearchParams } from "next/navigation"
import { useMessages } from "@/lib/i18n"

const FROM_INVESTMENTS = "investments"

export interface BackTarget {
  href: string
  label: string
}

export function relatedContentHref(kind: "articles" | "courses", slug: string): string {
  return `/dashboard/education/${kind}/${encodeURIComponent(slug)}?from=${FROM_INVESTMENTS}`
}

export function useBackTarget(fallback: BackTarget): BackTarget {
  const searchParams = useSearchParams()
  const t = useMessages().education

  return searchParams.get("from") === FROM_INVESTMENTS
    ? { href: "/dashboard/investments", label: t.backToInvestments }
    : fallback
}
