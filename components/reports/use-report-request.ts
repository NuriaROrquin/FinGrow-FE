"use client"

import { useEffect, useState } from "react"
import { toastApiError } from "@/lib/api"

export interface ReportRequest<T> {
  data: T | null
  isLoading: boolean
}

export function useReportRequest<T>(load: (signal: AbortSignal) => Promise<T>, errorMessage: string): ReportRequest<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)

    load(controller.signal)
      .then((result) => setData(() => result))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setData(null)
        toastApiError(error, errorMessage)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [load, errorMessage])

  return { data, isLoading }
}
