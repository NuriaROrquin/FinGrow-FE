import { api } from "./client"

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface TwoFactorStatus {
  enabled: boolean
}

export interface TwoFactorSetup {
  secret: string
  provisioningUri: string
}

export const PASSWORD_MIN_LENGTH = 8

export const TWO_FACTOR_CODE_LENGTH = 6

export function changePassword(payload: ChangePasswordPayload): Promise<void> {
  return api.patch("/account/password", payload)
}

export function getTwoFactorStatus(signal?: AbortSignal): Promise<TwoFactorStatus> {
  return api.get<TwoFactorStatus>("/account/2fa", { signal })
}

export function setupTwoFactor(): Promise<TwoFactorSetup> {
  return api.post<TwoFactorSetup>("/account/2fa/setup")
}

export function enableTwoFactor(code: string): Promise<void> {
  return api.post("/account/2fa/enable", { code })
}

export function disableTwoFactor(code: string): Promise<void> {
  return api.post("/account/2fa/disable", { code })
}
