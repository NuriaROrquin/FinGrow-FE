import { api } from "./client"

export type IntegrationProvider = "whatsapp" | "telegram" | "mercadopago"

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

export interface MercadoPagoAuthorization {
  authorizationUrl: string
  expiresAt: string
}

export interface MercadoPagoSyncSummary {
  imported: number
  alreadyKnown: number
  ignored: number
  syncedAt: string
}

export type MercadoPagoLinkResult = "linked" | "error"

export function startMercadoPagoLink(signal?: AbortSignal): Promise<MercadoPagoAuthorization> {
  return api.post<MercadoPagoAuthorization>("/api/integrations/mercadopago/oauth/start", undefined, { signal })
}

export function syncMercadoPago(signal?: AbortSignal): Promise<MercadoPagoSyncSummary> {
  return api.post<MercadoPagoSyncSummary>("/api/integrations/mercadopago/sync", undefined, { signal })
}
