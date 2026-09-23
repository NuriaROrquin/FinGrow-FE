import { api } from "./client"
import type { Currency } from "./transactions"

export type GoalStatus = "Active" | "Achieved" | "Cancelled"

export const GOAL_NAME_MAX_LENGTH = 150

export const CONTRIBUTION_NOTE_MAX_LENGTH = 300

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

export interface GoalContributionDto {
  id: string
  goalId: string
  amount: number
  currency: Currency
  contributedOn: string
  note: string | null
  createdAt: string
}

export interface AddContributionPayload {
  amount: number
  currency: Currency
  contributedOn: string
  note?: string
}

export interface ContributionAddedDto {
  goal: GoalDto
  contribution: GoalContributionDto
}

export function listGoals(signal?: AbortSignal): Promise<GoalDto[]> {
  return api.get<GoalDto[]>("/api/goals", { signal })
}

export function createGoal(payload: CreateGoalPayload, signal?: AbortSignal): Promise<GoalDto> {
  return api.post<GoalDto>("/api/goals", payload, { signal })
}

export function listContributions(goalId: string, signal?: AbortSignal): Promise<GoalContributionDto[]> {
  return api.get<GoalContributionDto[]>(`/api/goals/${goalId}/contributions`, { signal })
}

export function addContribution(
  goalId: string,
  payload: AddContributionPayload,
  signal?: AbortSignal,
): Promise<ContributionAddedDto> {
  return api.post<ContributionAddedDto>(`/api/goals/${goalId}/contributions`, payload, { signal })
}

export function removeContribution(goalId: string, contributionId: string, signal?: AbortSignal): Promise<GoalDto> {
  return api.delete<GoalDto>(`/api/goals/${goalId}/contributions/${contributionId}`, { signal })
}
