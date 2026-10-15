"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  ACHIEVEMENT_NOTIFICATION_EVENT,
  celebrateAchievements,
  listUncelebratedAchievements,
  type AchievementDto,
} from "@/lib/api"
import { useMessages } from "@/lib/i18n"

import { AchievementCelebrationDialog } from "./achievement-celebration-dialog"
import { showAchievementToast, showAchievementsToast } from "./achievement-toast"

/**
 * Celebra los logros que el backend tiene pendientes: al entrar al dashboard (así se ven los que se
 * ganaron desde Telegram o WhatsApp, o los retroactivos) y cada vez que la campanita avisa que llegó uno.
 */
export function AchievementCelebrator() {
  const t = useMessages()
  const [featured, setFeatured] = useState<AchievementDto | null>(null)
  const running = useRef(false)
  const requestedAgain = useRef(false)

  const celebratePending = useCallback(async () => {
    // Un aviso que llega mientras se procesa el anterior no se pierde: se vuelve a consultar al terminar.
    if (running.current) {
      requestedAgain.current = true
      return
    }

    running.current = true

    try {
      do {
        requestedAgain.current = false

        const pending = await listUncelebratedAchievements()
        if (pending.length === 0) continue

        if (pending.length > 1) {
          showAchievementsToast(pending, t)
        } else if (pending[0].isMajor) {
          setFeatured(pending[0])
        } else {
          showAchievementToast(pending[0], t)
        }

        await celebrateAchievements(pending.map((achievement) => achievement.code))
      } while (requestedAgain.current)
    } catch {
      // Lo que no se pudo celebrar sigue pendiente en el backend: se muestra en la próxima visita.
    } finally {
      running.current = false
    }
  }, [t])

  useEffect(() => {
    void celebratePending()

    const onAchievement = () => void celebratePending()
    window.addEventListener(ACHIEVEMENT_NOTIFICATION_EVENT, onAchievement)

    return () => window.removeEventListener(ACHIEVEMENT_NOTIFICATION_EVENT, onAchievement)
  }, [celebratePending])

  return <AchievementCelebrationDialog achievement={featured} onClose={() => setFeatured(null)} />
}
