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

export interface EmployeeProfile {
  fullName: string
  email: string
  phoneNumber: string | null
  nationalId: string | null
  /** Fecha sin hora, `yyyy-MM-dd`. */
  birthDate: string | null
  address: string | null
  companyName: string
  departmentName: string | null
}

export interface UpdateProfilePayload {
  fullName: string
  phoneNumber: string | null
  nationalId: string | null
  birthDate: string | null
  address: string | null
}

export const PASSWORD_MIN_LENGTH = 8

// Los límites del perfil son los de `Employee` en FinGrow-BE: si cambian allá, cambian acá.
export const FULL_NAME_MIN_LENGTH = 2

export const FULL_NAME_MAX_LENGTH = 200

export const PHONE_NUMBER_MAX_LENGTH = 30

export const PHONE_NUMBER_MIN_DIGITS = 8

export const PHONE_NUMBER_MAX_DIGITS = 15

export const NATIONAL_ID_MIN_LENGTH = 7

export const NATIONAL_ID_MAX_LENGTH = 8

export const ADDRESS_MAX_LENGTH = 200

export const PROFILE_MIN_AGE = 16

export const PROFILE_MAX_AGE = 100

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

export function getProfile(signal?: AbortSignal): Promise<EmployeeProfile> {
  return api.get<EmployeeProfile>("/account/profile", { signal })
}

export function updateProfile(payload: UpdateProfilePayload): Promise<void> {
  return api.patch("/account/profile", payload)
}
