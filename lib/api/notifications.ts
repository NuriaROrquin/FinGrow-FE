import { api } from "./client"
import type { PagedResultDto } from "./investments"

export type NotificationType =
  | "TransactionsToReview"
  | "GoalStalled"
  | "GoalDeadlineApproaching"
  | "IntegrationAccessLost"
  | "BudgetWarning"
  | "BudgetExceeded"
  | "AchievementUnlocked"
  | "InvestmentValueChanged"
  | "InvestmentMaturing"
  | "NewEducationContent"

export type CompanyNotificationType =
  | "FinancialWellbeingLow"
  | "ParticipationLow"
  | "EmployeeAdded"
  | "EmployeeRemoved"

export type NotificationCadence = "Daily" | "Weekly" | "Monthly"

/** Evento de window que se dispara cuando llega una alerta de presupuesto, para refrescar esa pantalla. */
export const BUDGET_NOTIFICATION_EVENT = "fingrow:budget-notification"

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

export type NotificationChannel = "InApp" | "Telegram" | "Email"

export interface NotificationChannelDto {
  channel: NotificationChannel
  isEnabled: boolean
  isConfigurable: boolean
  isConnected: boolean
}

export interface NotificationTypePreferenceDto {
  type: NotificationType
  isEnabled: boolean
}

export interface CompanyNotificationTypePreferenceDto {
  type: CompanyNotificationType
  isEnabled: boolean
  cadence: NotificationCadence
  threshold: number | null
}

export interface UpdateCompanyNotificationTypePreferencePayload {
  isEnabled: boolean
  cadence: NotificationCadence
  threshold: number | null
}

export function listNotificationChannels(signal?: AbortSignal): Promise<NotificationChannelDto[]> {
  return api.get<NotificationChannelDto[]>("/api/notifications/channels", { signal })
}

export function changeNotificationChannel(
  channel: NotificationChannel,
  isEnabled: boolean,
  signal?: AbortSignal,
): Promise<NotificationChannelDto> {
  return api.put<NotificationChannelDto>(`/api/notifications/channels/${channel}`, { isEnabled }, { signal })
}

export function listNotificationTypePreferences(signal?: AbortSignal): Promise<NotificationTypePreferenceDto[]> {
  return api.get<NotificationTypePreferenceDto[]>("/api/notifications/types", { signal })
}

export function changeNotificationTypePreference(
  type: NotificationType,
  isEnabled: boolean,
  signal?: AbortSignal,
): Promise<NotificationTypePreferenceDto> {
  return api.put<NotificationTypePreferenceDto>(`/api/notifications/types/${type}`, { isEnabled }, { signal })
}

export function listCompanyNotificationTypePreferences(
  signal?: AbortSignal,
): Promise<CompanyNotificationTypePreferenceDto[]> {
  return api.get<CompanyNotificationTypePreferenceDto[]>("/api/notifications/types", { signal })
}

export function updateCompanyNotificationTypePreference(
  type: CompanyNotificationType,
  payload: UpdateCompanyNotificationTypePreferencePayload,
  signal?: AbortSignal,
): Promise<CompanyNotificationTypePreferenceDto> {
  return api.put<CompanyNotificationTypePreferenceDto>(`/api/notifications/types/${type}`, payload, { signal })
}
