"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BellIcon, CalendarClockIcon, CheckCheckIcon, InboxIcon, TargetIcon, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  toastApiError,
  type NotificationDto,
  type NotificationType,
} from "@/lib/api"
import { formatRelativeTime } from "@/lib/format"
import { useMessages } from "@/lib/i18n"
import { cn } from "@/lib/utils"

// El contador se consulta cada tanto y al volver a la pestaña: las alertas de metas salen de un
// trabajo diario del backend y las de movimientos, de un sync, así que no hace falta más seguido.
const UNREAD_POLL_INTERVAL_MS = 60_000

const iconByType: Record<NotificationType, LucideIcon> = {
  TransactionsToReview: InboxIcon,
  GoalStalled: TargetIcon,
  GoalDeadlineApproaching: CalendarClockIcon,
}

const hrefByType: Partial<Record<NotificationType, string>> = {
  TransactionsToReview: "/dashboard/transactions",
  GoalStalled: "/dashboard",
  GoalDeadlineApproaching: "/dashboard",
}

type ListStatus = "idle" | "loading" | "error" | "ready"

export function NotificationBell() {
  const t = useMessages()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const [status, setStatus] = useState<ListStatus>("idle")

  const refreshUnread = useCallback(async (signal?: AbortSignal) => {
    try {
      setUnread(await getUnreadNotificationCount(signal))
    } catch {
      // Un contador desactualizado no merece un toast cada minuto: se reintenta en la próxima vuelta.
    }
  }, [])

  const loadNotifications = useCallback(async (signal?: AbortSignal) => {
    setStatus("loading")

    try {
      const [page, unreadCount] = await Promise.all([
        listNotifications({}, signal),
        getUnreadNotificationCount(signal),
      ])
      setNotifications(page.items)
      setUnread(unreadCount)
      setStatus("ready")
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      setStatus("error")
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void refreshUnread(controller.signal)

    const interval = window.setInterval(() => void refreshUnread(), UNREAD_POLL_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshUnread()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      controller.abort()
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [refreshUnread])

  useEffect(() => {
    if (!open) return

    const controller = new AbortController()
    void loadNotifications(controller.signal)

    return () => controller.abort()
  }, [open, loadNotifications])

  const markAsRead = async (notification: NotificationDto) => {
    if (notification.isRead) return

    setNotifications((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)),
    )
    setUnread((current) => Math.max(0, current - 1))

    try {
      await markNotificationAsRead(notification.id)
    } catch (error) {
      toastApiError(error)
      void loadNotifications()
    }
  }

  const handleSelect = (notification: NotificationDto) => {
    void markAsRead(notification)

    const href = hrefByType[notification.type]
    if (href) {
      setOpen(false)
      router.push(href)
    }
  }

  const handleMarkAll = async () => {
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })))
    setUnread(0)

    try {
      await markAllNotificationsAsRead()
    } catch (error) {
      toastApiError(error)
      void loadNotifications()
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? `${t.notifications.open} (${t.notifications.unreadCount(unread)})` : t.notifications.open}
        >
          <BellIcon className="size-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{t.notifications.title}</p>
            {unread > 0 && <p className="text-xs text-muted-foreground">{t.notifications.unreadCount(unread)}</p>}
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => void handleMarkAll()}>
              <CheckCheckIcon className="size-4" />
              {t.notifications.markAllRead}
            </Button>
          )}
        </div>

        {status === "loading" && notifications.length === 0 && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
            <p>{t.notifications.loadError}</p>
            <Button variant="outline" size="sm" onClick={() => void loadNotifications()}>
              {t.notifications.retry}
            </Button>
          </div>
        )}

        {status === "ready" && notifications.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
            <BellIcon className="size-6 opacity-50" />
            <p>{t.notifications.empty}</p>
          </div>
        )}

        {notifications.length > 0 && status !== "error" && (
          <div className="max-h-96 overflow-y-auto">
            <ul className="divide-y">
              {notifications.map((notification) => {
                const Icon = iconByType[notification.type] ?? BellIcon

                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(notification)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                        !notification.isRead && "bg-primary/5",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground",
                          !notification.isRead && "bg-primary/10 text-primary",
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1 space-y-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className={cn("text-sm", !notification.isRead && "font-semibold")}>
                            {notification.title}
                          </span>
                          {!notification.isRead && (
                            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                          )}
                        </span>
                        <span className="block text-sm text-muted-foreground">{notification.body}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
