import { api } from "./client"
import type { Currency } from "./transactions"

export type GoalStatus = "Active" | "Achieved" | "Cancelled"

export const GOAL_NAME_MAX_LENGTH = 150

export interface GoalDto {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  currency: Currency
  progressPercentage: number
  deadline: string
  status: GoalStatus
  createdAt: string
}

export interface CreateGoalPayload {
  name: string
  targetAmount: number
  currency: Currency
  deadline: string
}

export function createGoal(payload: CreateGoalPayload, signal?: AbortSignal): Promise<GoalDto> {
  return api.post<GoalDto>("/api/goals", payload, { signal })
}
