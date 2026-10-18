"use client"

import { useCallback, useEffect, useState } from "react"

import { ACHIEVEMENT_NOTIFICATION_EVENT, listAchievements, type AchievementDto } from "@/lib/api"

export function useAchievements() {
  const [achievements, setAchievements] = useState<AchievementDto[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    const load = () =>
      listAchievements(controller.signal)
        .then((list) => {
          setAchievements(list)
          setLoadFailed(false)
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return
          setLoadFailed(true)
        })

    setLoadFailed(false)
    void load()

    window.addEventListener(ACHIEVEMENT_NOTIFICATION_EVENT, load)

    return () => {
      controller.abort()
      window.removeEventListener(ACHIEVEMENT_NOTIFICATION_EVENT, load)
    }
  }, [retryCount])

  const retry = useCallback(() => setRetryCount((count) => count + 1), [])

  return { achievements, loadFailed: loadFailed && achievements === null, retry }
}
