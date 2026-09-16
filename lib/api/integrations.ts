import { api } from "./client"

export type IntegrationProvider = "whatsapp" | "telegram"

export interface LinkCode {
  code: string
  expiresAt: string
}

export interface Integration {
  linked: boolean
  externalAccountId: string | null
  linkedAt: string | null
}

export const NOT_LINKED: Integration = { linked: false, externalAccountId: null, linkedAt: null }

export function getIntegration(provider: IntegrationProvider, signal?: AbortSignal): Promise<Integration> {
  return api.get<Integration>(`/api/integrations/${provider}`, { signal })
}

export function requestLinkCode(provider: IntegrationProvider, signal?: AbortSignal): Promise<LinkCode> {
  return api.post<LinkCode>(`/api/integrations/${provider}/link-code`, undefined, { signal })
}

export function unlinkIntegration(provider: IntegrationProvider, signal?: AbortSignal): Promise<void> {
  return api.delete(`/api/integrations/${provider}`, { signal })
}
