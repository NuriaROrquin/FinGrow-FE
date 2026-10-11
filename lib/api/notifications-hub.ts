import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr"

import { buildUrl } from "./config"
import type { NotificationDto } from "./notifications"

const HUB_PATH = "/hubs/notifications"
const RETRY_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000]

export interface NotificationsHubHandlers {
  onNotification: (notification: NotificationDto) => void
  onConnected: () => void
  onConnectionLost: () => void
}

export function connectToNotifications(handlers: NotificationsHubHandlers): () => void {
  const connection = new HubConnectionBuilder()
    .withUrl(buildUrl(HUB_PATH), { withCredentials: true })
    .configureLogging(LogLevel.None)
    .build()

  let stopped = false
  let failedAttempts = 0
  let retryTimer: number | undefined

  const scheduleStart = () => {
    if (stopped || retryTimer !== undefined) return

    const delay = RETRY_DELAYS_MS[Math.min(failedAttempts, RETRY_DELAYS_MS.length - 1)]
    failedAttempts += 1
    retryTimer = window.setTimeout(() => {
      retryTimer = undefined
      void start()
    }, delay)
  }

  const start = async () => {
    if (stopped) return

    try {
      await connection.start()
      failedAttempts = 0
      handlers.onConnected()
    } catch {
      if (stopped) return
      handlers.onConnectionLost()
      scheduleStart()
    }
  }

  connection.on("NotificationReceived", (notification: NotificationDto) => handlers.onNotification(notification))
  connection.onclose(() => {
    if (stopped) return
    handlers.onConnectionLost()
    scheduleStart()
  })

  void start()

  return () => {
    stopped = true
    window.clearTimeout(retryTimer)
    void connection.stop()
  }
}
