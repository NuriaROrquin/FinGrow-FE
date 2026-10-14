import { api } from "./client"

export type AchievementCode =
  | "FirstTransaction"
  | "ReceiptScanned"
  | "ChannelLinked"
  | "FirstBudget"
  | "FirstGoal"
  | "GoalAchieved"
  | "ThreeGoalsAchieved"
  | "FirstInvestment"
  | "FirstCourse"
  | "ConsistentThreeMonths"
  | "BudgetKept"
  | "Saver"

/** Evento de window que dispara la campanita cuando llega un logro, para que se celebre en el momento. */
export const ACHIEVEMENT_NOTIFICATION_EVENT = "fingrow:achievement-notification"

export interface AchievementDto {
  code: AchievementCode
  name: string
  description: string
  condition: string
  /** Un logro importante se celebra en el centro de la pantalla; el resto, con un toast. */
  isMajor: boolean
  /** Null mientras el empleado no lo ganó. */
  achievedAt: string | null
}

/** El catálogo completo, con la fecha de los logros que el empleado ya ganó. */
export function listAchievements(signal?: AbortSignal): Promise<AchievementDto[]> {
  return api.get<AchievementDto[]>("/api/achievements", { signal })
}

export function listUncelebratedAchievements(signal?: AbortSignal): Promise<AchievementDto[]> {
  return api.get<AchievementDto[]>("/api/achievements/uncelebrated", { signal })
}

/** Marca como celebrados solo los códigos que se mostraron: uno que llegó mientras tanto queda pendiente. */
export async function celebrateAchievements(codes: AchievementCode[], signal?: AbortSignal): Promise<number> {
  const { celebrated } = await api.post<{ celebrated: number }>("/api/achievements/celebrate", { codes }, { signal })
  return celebrated
}
