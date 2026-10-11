import { api } from "./client"
import type { PagedResultDto } from "./investments"

export type NotificationType = "TransactionsToReview" | "GoalStalled" | "GoalDeadlineApproaching"

export const NOTIFICATIONS_PAGE_SIZE = 20

export interface NotificationDto {
  id: string
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  createdAt: string
  readAt: string | null
}

/** La bandeja del usuario logueado (empleado o empresa), la más reciente primero. */
export function listNotifications(
  query: { unreadOnly?: boolean; pageNumber?: number; pageSize?: number } = {},
  signal?: AbortSignal,
): Promise<PagedResultDto<NotificationDto>> {
  return api.get<PagedResultDto<NotificationDto>>("/api/notifications", {
    query: { pageSize: NOTIFICATIONS_PAGE_SIZE, ...query },
    signal,
  })
}

export async function getUnreadNotificationCount(signal?: AbortSignal): Promise<number> {
  const { unread } = await api.get<{ unread: number }>("/api/notifications/unread-count", { signal })
  return unread
}

export function markNotificationAsRead(notificationId: string, signal?: AbortSignal): Promise<NotificationDto> {
  return api.post<NotificationDto>(`/api/notifications/${notificationId}/read`, undefined, { signal })
}

export async function markAllNotificationsAsRead(signal?: AbortSignal): Promise<number> {
  const { marked } = await api.post<{ marked: number }>("/api/notifications/read-all", undefined, { signal })
  return marked
}
